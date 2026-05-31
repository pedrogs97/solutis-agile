'use client'

import type { FlexProps, TextProps } from '@mantine/core'
import { Flex, Text } from '@mantine/core'
import { Children, type ReactNode } from 'react'

import { BackButton } from '@/components/common/back-button'
import { useThemeColors } from '@/hooks/useThemeColors'

interface PageSectionHeaderProps {
  title: ReactNode
  actions?: ReactNode | ReactNode[]
  onBack?: () => void
  containerProps?: FlexProps
  titleProps?: TextProps
}

export function PageSectionHeader({
  title,
  actions,
  onBack,
  containerProps,
  titleProps,
}: Readonly<PageSectionHeaderProps>) {
  const { getSecondaryTextColor } = useThemeColors()

  const actionItems = actions ? Children.toArray(actions).filter(Boolean) : []

  const {
    justify = 'space-between',
    align = 'center',
    mb = 12,
    wrap = 'wrap',
    gap = 12,
    ...restContainerProps
  } = containerProps ?? {}

  const {
    c: titleColor,
    size: titleSize,
    fw: titleWeight,
    ...restTitleProps
  } = titleProps ?? {}

  return (
    <Flex
      justify={justify}
      align={align}
      mb={mb}
      wrap={wrap}
      gap={gap}
      {...restContainerProps}
    >
      <Flex align="center" gap={12}>
        <BackButton onClick={onBack} />
        <Text
          size={titleSize ?? 'lg'}
          fw={titleWeight ?? 700}
          c={titleColor ?? getSecondaryTextColor()}
          {...restTitleProps}
        >
          {title}
        </Text>
      </Flex>

      {actionItems.length > 0 && (
        <Flex align="center" gap={8} wrap="wrap" justify="flex-end">
          {actionItems.map((action, index) => (
            <div key={index}>{action}</div>
          ))}
        </Flex>
      )}
    </Flex>
  )
}
