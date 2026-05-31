'use client'

import '@mantine/notifications/styles.css'
import '@mantine/dates/styles.css'
import 'dayjs/locale/pt-br'

import { MantineProvider } from '@mantine/core'
import { DatesProvider } from '@mantine/dates'
import { ModalsProvider } from '@mantine/modals'
import { Notifications } from '@mantine/notifications'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { extend } from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { type ReactNode, Suspense } from 'react'

import { theme } from '@/styles/theme'

import LoadingScreen from '../common/loading-screen'
import { AbilityProvider } from './ability'
import { ThemeProvider } from './theme-provider'

extend(customParseFormat)

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false } },
})

const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <QueryClientProvider client={queryClient}>
        <MantineProvider theme={theme} defaultColorScheme="light">
          <ThemeProvider>
            <ModalsProvider>
              <DatesProvider settings={{ locale: 'pt-br' }}>
                <AbilityProvider>
                  <Notifications />
                  {children}
                </AbilityProvider>
              </DatesProvider>
            </ModalsProvider>
          </ThemeProvider>
        </MantineProvider>
      </QueryClientProvider>
    </Suspense>
  )
}

export default Providers
