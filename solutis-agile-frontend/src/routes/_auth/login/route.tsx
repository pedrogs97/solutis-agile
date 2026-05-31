'use client'
import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router'
import { Suspense, useEffect, useState } from 'react'

import LoadingScreen from '@/components/common/loading-screen'
import { hydrateAuthTokens, signOut } from '@/store/persisted/useAuthStore'
import { resetProfile } from '@/store/persisted/useProfileStore'

export const Route = createFileRoute('/_auth/login')({ component: AuthLayout })

function AuthLayout() {
  const { accessToken, expiresIn } = hydrateAuthTokens()
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (!accessToken) {
      setIsLoading(false)
      return
    }

    if (typeof expiresIn === 'number') {
      const currentTime = Math.floor(Date.now() / 1000)

      if (currentTime >= expiresIn) {
        signOut()
        resetProfile()
        setIsLoading(false)
        return
      }
    }

    navigate({ to: '/dashboard', replace: true })
  }, [accessToken, expiresIn, navigate])

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Outlet />
    </Suspense>
  )
}
