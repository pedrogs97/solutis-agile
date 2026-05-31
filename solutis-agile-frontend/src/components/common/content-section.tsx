'use client'

import { Box } from '@mantine/core'
import { type ReactNode } from 'react'

import { useThemeColors } from '@/hooks/useThemeColors'

type ContentSectionProps = {
  children: ReactNode // main content (filters, table, etc.)
  footer?: ReactNode // bottom slot (e.g., Pagination)
  minHeight?: number // default 500
  padding?: number // default 16
  radius?: number // default 25
}

export default function ContentSection({
  children,
  footer,
  minHeight = 500,
  padding = 16,
  radius = 25,
}: ContentSectionProps) {
  const { getContentBackgroundColor } = useThemeColors()

  return (
    <Box
      bg={getContentBackgroundColor()}
      p={padding}
      mih={minHeight}
      style={{
        borderRadius: radius,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box style={{ flex: 1 }}>{children}</Box>

      {footer && (
        <Box mt="md" style={{ marginTop: 'auto' }}>
          {footer}
        </Box>
      )}
    </Box>
  )
}
