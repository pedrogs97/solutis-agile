'use client'

import {
  ActionIcon,
  Avatar,
  Container,
  Flex,
  Group,
  Menu,
  rem,
  Text,
  UnstyledButton,
} from '@mantine/core'
import { Link } from '@tanstack/react-router'
import cx from 'clsx'
import { ChevronDown, LogOut, Monitor, Moon, Sun } from 'lucide-react'
import { useState } from 'react'

import Image from '@/components/image'
import { signOut } from '@/store/persisted/useAuthStore'
import classes from '@/styles/page-header.module.css'

import { useTheme } from './providers/theme-provider'

export function PageHeader({ fullName }: Readonly<{ fullName: string }>) {
  const [userMenuOpened, setUserMenuOpened] = useState(false)
  const { theme, setTheme } = useTheme()

  function getInitials(name: string) {
    if (!name) return ''
    const words = name.split(' ')
    const initials = words.map((w) => w[0]?.toUpperCase()).filter(Boolean)
    return initials.length >= 2 ? initials.join('') : initials[0] || ''
  }

  const handleThemeToggle = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('auto')
    else setTheme('light')
  }

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return (
          <Sun style={{ width: rem(18), height: rem(18) }} strokeWidth={1.5} />
        )
      case 'dark':
        return (
          <Moon style={{ width: rem(18), height: rem(18) }} strokeWidth={1.5} />
        )
      default:
        return (
          <Monitor
            style={{ width: rem(18), height: rem(18) }}
            strokeWidth={1.5}
          />
        )
    }
  }

  return (
    <div className={classes.header}>
      <Container size="xl">
        <Group justify="space-between">
          <Flex align="center">
            <Link to="/dashboard" style={{ textDecoration: 'none' }}>
              <Image
                src="/solutis-agile-logo.png"
                alt="Logo"
                width={200}
                height={40}
                priority
              />
            </Link>
          </Flex>

          {/* User + theme switch */}
          <Flex align="center">
            <Menu
              width={220}
              position="bottom-end"
              transitionProps={{ transition: 'pop-top-right' }}
              onClose={() => setUserMenuOpened(false)}
              onOpen={() => setUserMenuOpened(true)}
              withinPortal
            >
              <Menu.Target>
                <UnstyledButton
                  className={cx(classes.user, {
                    [classes.userActive]: userMenuOpened,
                  })}
                >
                  <Group gap={7}>
                    <Avatar color="cyan" radius="xl">
                      {getInitials(fullName)}
                    </Avatar>
                    <Text fw={500} size="sm" lh={1} mr={3}>
                      {fullName}
                    </Text>
                    <ChevronDown
                      style={{ width: rem(12), height: rem(12) }}
                      strokeWidth={1.5}
                    />
                  </Group>
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Configurações</Menu.Label>
                <Menu.Item
                  leftSection={
                    <LogOut
                      style={{ width: rem(16), height: rem(16) }}
                      strokeWidth={1.5}
                    />
                  }
                  onClick={(event) => {
                    event.preventDefault()
                    signOut()
                    window.location.href = '/login'
                  }}
                >
                  Sair da Conta
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>

            <ActionIcon
              onClick={handleThemeToggle}
              variant="subtle"
              color="gray"
              radius="xl"
              size={50}
            >
              {getThemeIcon()}
            </ActionIcon>
          </Flex>
        </Group>
      </Container>
    </div>
  )
}
