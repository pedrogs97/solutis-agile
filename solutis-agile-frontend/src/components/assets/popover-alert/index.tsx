import { Popover, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { Flag } from 'lucide-react'

import { useThemeColors } from '@/hooks/useThemeColors'

function PopoverAlert({ message }: { message: string }) {
  const [opened, { close, open }] = useDisclosure(false)
  const { getSecondaryTextColor } = useThemeColors()

  return (
    <Popover
      width={200}
      position="bottom"
      withArrow
      shadow="md"
      opened={opened}
    >
      <Popover.Target>
        <Text c="var(--mantine-color-red-6)">
          <Flag
            onMouseEnter={() => open()}
            onMouseLeave={close}
            color="red"
            fill="red"
          />
        </Text>
      </Popover.Target>
      <Popover.Dropdown
        style={{ pointerEvents: 'none', width: 122, padding: 5 }}
      >
        <Text size="xs" c={getSecondaryTextColor()} fw={600}>
          {message}
        </Text>
      </Popover.Dropdown>
    </Popover>
  )
}

export default PopoverAlert
