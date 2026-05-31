'use client'

import { Flex, Text } from '@mantine/core'
import { Link, useMatches, useRouterState } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { useThemeColors } from '@/hooks/useThemeColors'

const segmentToLabelMap: Record<string, string> = {
  dashboard: 'Painel',
  employees: 'Colaboradores',
  'groups-and-permissions': 'Grupos e Permissões',
  inventory: 'Inventário',
  invoices: 'Notas Fiscais',
  lendings: 'Comodatos',
  assets: 'Ativos',
  contracts: 'Contratos',
  terms: 'Termos',
  logs: 'Logs',
  procurement: 'Compras',
  reports: 'Relatórios',
  users: 'Usuários',
  suppliers: 'Fornecedores',
  add: 'Adicionar',
  edit: 'Editar',
  view: 'Visualizar',
}

const isIdSegment = (segment: string) =>
  /^\d+$/.test(segment) ||
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    segment,
  )

export function Breadcrumbs() {
  const { colorScheme, getSecondaryTextColor } = useThemeColors()
  const [secondaryColor, setSecondaryColor] = useState<string>(
    'var(--mantine-color-dimmed)',
  )
  const matches = useMatches()
  const pathname = useRouterState({
    select: (s) => s.resolvedLocation?.pathname || s.location.pathname,
  })

  // Don't show breadcrumbs during navigation to prevent flash
  if (matches.some((match) => match.status === 'pending')) {
    return null
  }

  const pathSegments = pathname.split('/').filter(Boolean)

  const breadcrumbs: { href: string; label: string }[] = []

  // Sempre adiciona Painel apontando para /dashboard
  breadcrumbs.push({ href: '/dashboard', label: 'Painel' })

  let currentHref = ''

  // Monta breadcrumbs com base na rota atual
  for (let i = 0; i < pathSegments.length; i++) {
    const segment = pathSegments[i]
    if (isIdSegment(segment)) continue

    currentHref += `/${segment}`
    const label = segmentToLabelMap[segment] || segment
    breadcrumbs.push({ href: currentHref, label })
  }

  useEffect(() => {
    setSecondaryColor(getSecondaryTextColor())
  }, [colorScheme, getSecondaryTextColor])

  return (
    <nav aria-label="Breadcrumbs">
      <Flex align="center" gap={4}>
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1
          return (
            <Flex key={index} align="center" gap={4}>
              {isLast ? (
                <Text size="sm" fw={700} c="blue.6">
                  {crumb.label}
                </Text>
              ) : (
                <Link to={crumb.href} style={{ textDecoration: 'none' }}>
                  <Text size="sm" fw={700} c={secondaryColor}>
                    {crumb.label}
                  </Text>
                </Link>
              )}
              {!isLast && (
                <Text size="sm" c={secondaryColor}>
                  /
                </Text>
              )}
            </Flex>
          )
        })}
      </Flex>
    </nav>
  )
}
