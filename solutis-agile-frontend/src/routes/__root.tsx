import '@mantine/core/styles.css'
import '@mantine/dropzone/styles.css'
import '@mantine/notifications/styles.css'
import '@mantine/dates/styles.css'
import '@/styles/global.css'
import 'dayjs/locale/pt-br'

import { MantineProvider } from '@mantine/core'
import { DatesProvider } from '@mantine/dates'
import { ModalsProvider } from '@mantine/modals'
import { Notifications } from '@mantine/notifications'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { extend } from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'

import { AbilityProvider } from '@/components/providers/ability'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { theme } from '@/styles/theme'

extend(customParseFormat)

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false } },
})

function RootLayout() {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <MantineProvider theme={theme} defaultColorScheme="light">
          <ThemeProvider>
            <ModalsProvider>
              <DatesProvider settings={{ locale: 'pt-br' }}>
                <AbilityProvider>
                  <Notifications />
                  <Outlet />
                </AbilityProvider>
              </DatesProvider>
            </ModalsProvider>
          </ThemeProvider>
        </MantineProvider>
      </QueryClientProvider>
      <TanStackRouterDevtools />
    </>
  )
}

export const Route = createRootRoute({
  component: RootLayout,
})
