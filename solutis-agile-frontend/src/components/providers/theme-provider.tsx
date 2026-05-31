'use client'

import { type MantineColorScheme, useMantineColorScheme } from '@mantine/core'
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react'

type ThemeProviderProps = {
  children: ReactNode
  defaultTheme?: ThemeMode
  storageKey?: string
}

type ThemeMode = 'light' | 'dark' | 'auto'

type ThemeProviderState = {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
}

const initialState: ThemeProviderState = {
  theme: 'auto',
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = 'auto',
  storageKey = 'solutis-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeMode>(defaultTheme)
  const { setColorScheme } = useMantineColorScheme()

  useEffect(() => {
    const stored = localStorage.getItem(storageKey) as ThemeMode
    if (stored) {
      setThemeState(stored)
    }
  }, [storageKey])

  useEffect(() => {
    let colorScheme: MantineColorScheme = 'light'

    if (theme === 'auto') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light'
      colorScheme = systemTheme
    } else {
      colorScheme = theme
    }

    setColorScheme(colorScheme)
  }, [theme, setColorScheme])

  const setTheme = (theme: ThemeMode) => {
    localStorage.setItem(storageKey, theme)
    setThemeState(theme)
  }

  const value = {
    theme,
    setTheme,
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider')

  return context
}
