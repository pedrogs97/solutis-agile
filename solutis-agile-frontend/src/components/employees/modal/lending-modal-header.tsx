import { Flex, Text } from '@mantine/core'

import { getLendingBadgeFromStatus } from '@/utils/getStatuses'

interface LendingModalHeaderProps {
  title: string
  identifier?: string | number | null
  status?: string | null
}

export function LendingModalHeader({
  title,
  identifier,
  status,
}: Readonly<LendingModalHeaderProps>) {
  const statusBadge = status ? getLendingBadgeFromStatus(status) : null

  return (
    <Flex align="center">
      <Text fw={700} tt="uppercase">
        {title} | #{identifier ?? '-'} &nbsp;
      </Text>
      {statusBadge}
      <Text fw={700} tt="uppercase">
        {status ?? 'Não informado'}
      </Text>
    </Flex>
  )
}
