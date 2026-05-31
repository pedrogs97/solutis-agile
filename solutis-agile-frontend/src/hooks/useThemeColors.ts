import { useMantineColorScheme, useMantineTheme } from '@mantine/core'

/**
 * Custom hook to get dynamic background colors based on the current theme
 */
export function useThemeColors() {
  const { colorScheme } = useMantineColorScheme()
  const theme = useMantineTheme()

  const schemeKey = colorScheme === 'dark' ? 'dark' : 'light'

  const getContentBackgroundColor = () => {
    return theme.other.contentBackground[schemeKey]
  }

  const getCardBackgroundColor = () => {
    return theme.other.cardBackground[schemeKey]
  }

  const getSecondaryTextColor = () => {
    return theme.other.textMuted[schemeKey]
  }

  const getPrimaryTextColor = () => {
    return theme.other.text[schemeKey]
  }

  const getTableRowEvenBackgroundColor = () => {
    return theme.other.surface[schemeKey]
  }

  const getTableRowOddBackgroundColor = () => {
    return theme.other.subtleBackground[schemeKey]
  }

  const getChartTextColor = () => {
    return theme.other.text[schemeKey]
  }

  const getBorderColor = () => {
    return theme.other.border[schemeKey]
  }

  const getStrongBorderColor = () => {
    return theme.other.borderStrong[schemeKey]
  }

  const getIconColor = () => {
    return theme.other.icon[schemeKey]
  }

  const getInverseTextColor = () => {
    return theme.other.textInverse[schemeKey]
  }

  const getStatusColors = () => {
    return theme.other.status
  }

  return {
    colorScheme,
    getContentBackgroundColor,
    getCardBackgroundColor,
    getSecondaryTextColor,
    getPrimaryTextColor,
    getChartTextColor,
    getTableRowEvenBackgroundColor,
    getTableRowOddBackgroundColor,
    getBorderColor,
    getStrongBorderColor,
    getIconColor,
    getInverseTextColor,
    getStatusColors,
  }
}
