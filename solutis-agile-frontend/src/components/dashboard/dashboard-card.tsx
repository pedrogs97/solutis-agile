'use client'

import { useAbility } from '@casl/react'
import { Box, Card, Collapse, Group, Text } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { Link } from '@tanstack/react-router'
import { ChevronDown } from 'lucide-react'
import { type FC, type ReactNode, useState } from 'react'

import { AbilityContext, Can } from '@/components/providers/ability'

interface DashboardCardProps {
  title: string
  description: string
  icon: ReactNode
  links: Array<{
    label: string
    href: string
    subject?: string
  }>
  iconBgColor?: string
  subject?: string
}

const DashboardCard: FC<DashboardCardProps> = ({
  title,
  description,
  icon,
  links,
  iconBgColor = 'var(--mantine-color-default)',
  subject,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const supportsHover = useMediaQuery('(hover: hover)')
  const ability = useAbility(AbilityContext)

  // Filter links based on permissions
  const visibleLinks = links.filter((link) => {
    if (!link.subject) return true
    return ability.can('view', link.subject)
  })

  if (subject && !ability.can('view', subject)) return null
  if (visibleLinks.length === 0) return null

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      style={{
        height: 'fit-content',
        minHeight: supportsHover ? (isOpen ? '230px' : '100px') : 'fit-content',
        transition: 'min-height 0.3s ease',
        cursor: supportsHover ? 'default' : 'pointer',
      }}
      onMouseEnter={supportsHover ? () => setIsOpen(true) : undefined}
      onMouseLeave={supportsHover ? () => setIsOpen(false) : undefined}
      onClick={supportsHover ? undefined : () => setIsOpen((prev) => !prev)}
    >
      <Group justify="space-between" mb={isOpen ? 'md' : 0}>
        <Group>
          <Box
            style={{
              backgroundColor: iconBgColor,
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
          <Text fw={600} size="lg">
            {title}
          </Text>
        </Group>

        {/* Arrow that rotates on hover/expand */}
        <Box
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.3s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <ChevronDown size={18} />
        </Box>
      </Group>

      <Collapse in={isOpen}>
        <Text size="sm" c="dimmed" mb="md">
          {description}
        </Text>

        <Box>
          {visibleLinks.map((link, index) => (
            <Can key={index} I="view" a={link.subject || 'all'} passThrough>
              {(allowed) =>
                allowed ? (
                  <Link to={link.href} style={{ textDecoration: 'none' }}>
                    <Text
                      component="div"
                      size="sm"
                      c="blue"
                      mb="xs"
                      style={{ cursor: 'pointer' }}
                    >
                      {link.label}
                    </Text>
                  </Link>
                ) : null
              }
            </Can>
          ))}
        </Box>
      </Collapse>
    </Card>
  )
}

export default DashboardCard
