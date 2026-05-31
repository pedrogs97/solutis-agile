'use client'

import { Button } from '@mantine/core'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useMemo } from 'react'

interface BackButtonProps {
  onClick?: () => void
}

export function BackButton({ onClick }: BackButtonProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const navigate = useNavigate()
  const target = useMemo(() => {
    if (!pathname) return null

    // strip trailing slashes and split
    const clean = pathname.replace(/\/+$/, '') || '/'
    const segments = clean.split('/') // ["", "section", "action", "id?"]

    const section = segments[1] || '' // first segment after "/"
    const action = segments[2] || '' // e.g., "add" or "edit"
    const hasId = Boolean(segments[3]) // e.g., ":id"

    // exactly "/<section>"
    if (section && !action) return '/dashboard'

    // "/<section>/add" or "/<section>/edit/:id"
    if (section && (action === 'add' || (action === 'edit' && hasId))) {
      return `/${section}`
    }

    // anything else (e.g., "/lendings/edit/91", custom flows, deep pages)
    return null
  }, [pathname])

  const handleClick = onClick
    ? onClick
    : () => {
        if (target) navigate({ to: target })
        else navigate({ to: '/dashboard' })
      }

  return (
    <Button
      variant="subtle"
      radius="xl"
      p={0}
      w={36}
      h={36}
      onClick={handleClick}
      aria-label="Voltar"
    >
      <ArrowLeft size={18} />
    </Button>
  )
}
