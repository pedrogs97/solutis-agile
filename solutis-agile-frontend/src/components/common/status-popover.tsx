import { Center, Flex, Popover, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'

import { getLendingBadgeFromStatus } from '@/utils/getStatuses'

interface StatusPopoverProps {
  status: string | undefined
  number: string
}

export default function StatusPopover({
  status,
  number,
}: Readonly<StatusPopoverProps>) {
  const [opened, { close, open }] = useDisclosure(false)

  return (
    <Popover
      width={200}
      position="bottom"
      withArrow
      shadow="md"
      opened={opened}
    >
      <Popover.Target>
        <Flex onMouseEnter={open} onMouseLeave={close} align="center">
          {getLendingBadgeFromStatus(status)}
          {number || '-'}
        </Flex>
      </Popover.Target>
      <Popover.Dropdown style={{ pointerEvents: 'none' }}>
        <Center>
          {getLendingBadgeFromStatus(status)}
          <Text size="sm">{status || 'Não informado'}</Text>
        </Center>
      </Popover.Dropdown>
    </Popover>
  )
}
