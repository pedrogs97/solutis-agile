'use client'

import { Button, Flex, rem, Tabs } from '@mantine/core'
import { Link } from '@tanstack/react-router'
import { ImageIcon } from 'lucide-react'

export function TabsHeader({
  defaultValue,
  tabsList,
  tabsPanel,
  buttonProps,
}: {
  defaultValue: any
  tabsList: any
  tabsPanel: any
  buttonProps: any
}) {
  const iconStyle = { width: rem(12), height: rem(12) }

  return (
    <Tabs variant="unstyled" defaultValue={defaultValue}>
      <Flex mb={15} justify="space-between">
        <Tabs.List>
          {tabsList.map((tab: any) => (
            <Tabs.Tab
              key={tab.value}
              value={tab.value}
              leftSection={<ImageIcon style={iconStyle} />}
            >
              {tab.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        {buttonProps && (
          <Link to={buttonProps.href}>
            <Button variant="filled">Novo usuário</Button>
          </Link>
        )}
      </Flex>

      {tabsPanel.map((tab: any) => (
        <Tabs.Panel key={tab.value} value={tab.value}>
          {tab.content}
        </Tabs.Panel>
      ))}
    </Tabs>
  )
}
