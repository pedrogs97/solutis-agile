'use client'

import { Container } from '@mantine/core'
import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useRef } from 'react'

import { PageHeader } from '@/components/page-header'
import { hydrateAuthTokens, signOut } from '@/store/persisted/useAuthStore'
import { getProfile, resetProfile } from '@/store/persisted/useProfileStore'

export const Route = createFileRoute('/_dashboard')({
  component: DashboardLayout,
})

function DashboardLayout() {
  const isLoggingOut = useRef(false)
  const navigate = useNavigate()

  const { accessToken, expiresIn } = hydrateAuthTokens()

  const profile = getProfile()

  const logout = useCallback(() => {
    if (isLoggingOut.current) return // Prevent multiple logout calls

    isLoggingOut.current = true

    try {
      signOut()
      resetProfile()
    } catch (error) {
      console.error('Error during logout:', error)
    }
  }, [])

  useEffect(() => {
    if (isLoggingOut.current) return

    if (!accessToken) {
      logout()
      navigate({ to: '/login', replace: true })
      return
    }

    if (typeof expiresIn === 'number') {
      const currentTime = Math.floor(Date.now() / 1000)

      if (currentTime >= expiresIn) {
        logout()
        navigate({ to: '/login', replace: true })
      }
    }
  }, [accessToken, expiresIn, logout, navigate])

  // Don't render anything if we're in the process of logging out
  if (isLoggingOut.current) {
    return null
  }

  return (
    <>
      <PageHeader fullName={profile?.full_name ?? 'Usuário'} />
      <Container size="xl" pt={20} mih={686}>
        <Outlet />
      </Container>
    </>
  )
}
