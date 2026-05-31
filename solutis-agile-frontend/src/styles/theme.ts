'use client'

import { createTheme } from '@mantine/core'

export const theme = createTheme({
  colors: {
    // You can customize colors here if needed
    gray: [
      '#f8f9fa',
      '#f1f3f4',
      '#e9ecef',
      '#dee2e6',
      '#ced4da',
      '#adb5bd',
      '#6c757d',
      '#495057',
      '#343a40',
      '#212529',
    ],
  },
  other: {
    dashboardBackground: {
      light: '#f6f8fb',
      dark: '#1a1b1e',
    },
    contentBackground: {
      light: '#ffffff',
      dark: '#25262b',
    },
    surface: {
      light: '#ffffff',
      dark: '#25262b',
    },
    cardBackground: {
      light: '#f8f9fa',
      dark: '#2c2e33',
    },
    subtleBackground: {
      light: '#f8f9fa',
      dark: '#1f2023',
    },
    border: {
      light: '#dee2e6',
      dark: '#3b3f46',
    },
    borderStrong: {
      light: '#ced4da',
      dark: '#4a4f57',
    },
    text: {
      light: '#212529',
      dark: '#f1f3f5',
    },
    textMuted: {
      light: '#495057',
      dark: '#adb5bd',
    },
    textInverse: {
      light: '#ffffff',
      dark: '#ffffff',
    },
    icon: {
      light: '#495057',
      dark: '#ced4da',
    },
    status: {
      success: '#2f9e44',
      warning: '#e67700',
      danger: '#e03131',
      info: '#1971c2',
    },
  },
})
