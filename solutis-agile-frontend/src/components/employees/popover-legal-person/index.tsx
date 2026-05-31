import { Popover, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { Briefcase } from 'lucide-react'

import { useThemeColors } from '@/hooks/useThemeColors'

function PopoverLegalPerson() {
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
        <Briefcase
          onMouseEnter={() => open()}
          onMouseLeave={close}
          color="var(--mantine-color-yellow-5)"
        />
      </Popover.Target>
      <Popover.Dropdown
        style={{ pointerEvents: 'none', width: 122, padding: 5 }}
      >
        <Text size="xs" c={getSecondaryTextColor()} fw={600}>
          PESSOA JURÍDICA
        </Text>
      </Popover.Dropdown>
    </Popover>
  )
}

export default PopoverLegalPerson
