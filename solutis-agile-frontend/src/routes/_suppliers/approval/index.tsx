'use client'

import {
  Card,
  Container,
  Divider,
  Flex,
  Space,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core'
import { createFileRoute } from '@tanstack/react-router'
import { BadgeCheck, MailX, ShieldCheck } from 'lucide-react'

import TableSkeleton from '@/components/common/skeletons/table-skeleton'
import { ServerError } from '@/components/server-error'
import { useSupplierApproval } from '@/hooks/useSupplierApproval'

export const Route = createFileRoute('/_suppliers/approval/')({
  validateSearch: (search: Record<string, unknown>): SearchFilter => {
    return {
      token: (search.token as string) || '',
    }
  },
  component: ApprovalPage,
  errorComponent: () => <ServerError />,
  pendingComponent: () => <TableSkeleton />,
})

interface SearchFilter {
  token?: string
}

function ApprovalPage() {
  const { message, approved } = useSupplierApproval()

  return (
    <Container size="sm" mih="100vh" py="xl">
      <Flex align="center" justify="center" mih="80vh">
        <Card
          shadow="lg"
          radius="lg"
          p="xl"
          withBorder
          style={{
            width: '100%',
            textAlign: 'center',
            borderColor: approved
              ? 'var(--mantine-color-green-6)'
              : 'var(--mantine-color-red-6)',
          }}
        >
          <Stack align="center" gap="md">
            <ThemeIcon
              variant="light"
              radius="xl"
              size={80}
              color={approved ? 'green' : 'red'}
            >
              {approved ? (
                <BadgeCheck size={42} strokeWidth={1.8} />
              ) : (
                <MailX size={42} strokeWidth={1.8} />
              )}
            </ThemeIcon>

            <Text fw={700} size="xl">
              {approved ? 'Aprovação registrada!' : 'Rejeição registrada!'}
            </Text>
            <Text c="dimmed" size="sm">
              {message}
            </Text>

            <Divider w="60%" />

            <Flex align="center" justify="center" gap="xs">
              <ThemeIcon variant="light" radius="xl" size="lg" color={'green'}>
                <ShieldCheck size={18} />
              </ThemeIcon>
              <Text size="sm" c="dimmed">
                Você pode fechar esta janela com segurança.
              </Text>
            </Flex>

            <Space h="sm" />
          </Stack>
        </Card>
      </Flex>
    </Container>
  )
}
