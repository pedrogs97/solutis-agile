/**
 * Read-Only Field Component
 * Displays a field label with text value (not an input)
 */

import {
  Box,
  Input as MantineInput,
  Text,
  useMantineTheme,
} from '@mantine/core'

import { useThemeColors } from '@/hooks/useThemeColors'

interface ReadOnlyFieldProps {
  label: string
  value?: string | number | null
  placeholder?: string
}

export function ReadOnlyField({
  label,
  value,
  placeholder = '-',
}: Readonly<ReadOnlyFieldProps>) {
  const theme = useMantineTheme()
  const { colorScheme, getSecondaryTextColor } = useThemeColors()

  const hasValue = value !== null && value !== undefined && value !== ''
  const displayValue = hasValue ? String(value) : placeholder

  const backgroundColor =
    colorScheme === 'dark' ? theme.colors.dark[6] : theme.white
  const borderColor =
    colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3]

  return (
    <MantineInput.Wrapper label={label} style={{ width: '100%' }}>
      <Box
        style={{
          width: '100%',
          padding: '0px 12px',
          borderRadius: '4px',
          backgroundColor,
          border: `1px solid ${borderColor}`,
          minHeight: 36,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Text
          c={getSecondaryTextColor()}
          style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontSize: '0.875rem * 1',
          }}
        >
          {displayValue}
        </Text>
      </Box>
    </MantineInput.Wrapper>
  )
}
