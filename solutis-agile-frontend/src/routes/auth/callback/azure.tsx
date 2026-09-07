'use client'

import {
  Card,
  Center,
  Container,
  Loader,
  Stack,
  Text,
  Title,
  useMantineColorScheme,
} from '@mantine/core'
import { showNotification } from '@mantine/notifications'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

import { ENVIRONMENT } from '@/constants/env'
import { apiV1 } from '@/lib/axios'
import { signIn } from '@/store/persisted/useAuthStore'
import { updateProfile } from '@/store/persisted/useProfileStore'

interface AzureCallbackSearchParams {
  code?: string
  state?: string
  error?: string
  error_description?: string
}

export const Route = createFileRoute('/auth/callback/azure')({
  validateSearch: (search: Record<string, unknown>): AzureCallbackSearchParams => {
    return {
      code: typeof search.code === 'string' ? search.code : undefined,
      state: typeof search.state === 'string' ? search.state : undefined,
      error: typeof search.error === 'string' ? search.error : undefined,
      error_description:
        typeof search.error_description === 'string'
          ? search.error_description
          : undefined,
    }
  },
  component: AzureCallbackPage,
})

interface AuthResponseData {
  id: number
  group: string
  email: string
  full_name: string
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  permissions: string[]
  products?: string[]
}

function MicrosoftLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  )
}

function AzureCallbackPage() {
  const search = Route.useSearch()
  const navigate = useNavigate()
  const hasExecutedRef = useRef(false)
  const { colorScheme } = useMantineColorScheme()

  const redirectToFlow = (data: AuthResponseData) => {
    const targetUrl = new URL(ENVIRONMENT.flowAppURL, window.location.origin)
    targetUrl.searchParams.set('token', data.access_token)
    targetUrl.searchParams.set(
      'user',
      JSON.stringify({
        id: data.id,
        name: data.full_name,
        email: data.email,
        role:
          data.group === 'admin' || data.group === 'MASTER'
            ? 'ADMIN'
            : 'GESTOR',
      }),
    )
    window.location.href = targetUrl.toString()
  }

  useEffect(() => {
    if (hasExecutedRef.current) return
    hasExecutedRef.current = true

    if (!ENVIRONMENT.enableSSO) {
      showNotification({
        title: 'SSO Desabilitado',
        message: 'A autenticação via Single Sign-On (SSO) está desabilitada.',
        color: 'yellow',
        autoClose: 5000,
        withCloseButton: true,
      })
      navigate({ to: '/login', replace: true })
      return
    }

    if (search.error) {
      showNotification({
        title: 'Autenticação Cancelada',
        message:
          'O login com a conta Microsoft foi cancelado ou não foi autorizado.',
        color: 'yellow',
        autoClose: 6000,
        withCloseButton: true,
      })
      navigate({ to: '/login', replace: true })
      return
    }

    if (!search.code) {
      showNotification({
        title: 'Código Não Encontrado',
        message:
          'Nenhum código de autenticação foi retornado pela Microsoft.',
        color: 'red',
        autoClose: 5000,
        withCloseButton: true,
      })
      navigate({ to: '/login', replace: true })
      return
    }

    const processCallback = async () => {
      try {
        const redirectUri =
          ENVIRONMENT.azureRedirectUri ||
          `${window.location.origin}/auth/callback/azure`

        const response = await fetch(
          `${ENVIRONMENT.baseURL}${apiV1}/auth/azure/callback/`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              code: search.code,
              redirectUri,
              state: search.state,
            }),
          },
        )

        if (!response.ok) {
          const errData = await response.json().catch(() => null)
          throw new Error(
            errData?.detail ||
              'Não foi possível concluir a autenticação com a conta Microsoft.',
          )
        }

        const data: AuthResponseData = await response.json()

        const userProducts =
          data.products && data.products.length > 0
            ? data.products.map((p) => p.toLowerCase().trim())
            : Array.isArray(data.products) && data.products.length === 0
              ? []
              : ['agile', 'flow']

        if (userProducts.length === 0) {
          showNotification({
            title: 'Acesso Não Permitido',
            message:
              'Seu usuário não possui acesso a nenhum produto cadastrado no sistema.',
            color: 'red',
            autoClose: 6000,
            withCloseButton: true,
          })
          navigate({ to: '/login', replace: true })
          return
        }

        signIn(data)
        updateProfile(data)

        const hasAgile = userProducts.includes('agile')
        const hasFlow = userProducts.includes('flow')

        if (hasAgile && hasFlow) {
          sessionStorage.setItem('sso_select_product', 'true')
          navigate({ to: '/login', replace: true })
          return
        }

        if (hasAgile) {
          navigate({ to: '/dashboard', replace: true })
          return
        }

        if (hasFlow) {
          redirectToFlow(data)
          return
        }
      } catch (err: any) {
        showNotification({
          title: 'Erro no Login Microsoft',
          message:
            err?.message ||
            'Ocorreu uma falha ao autenticar com a Microsoft. Verifique suas credenciais e tente novamente.',
          color: 'red',
          autoClose: 7000,
          withCloseButton: true,
        })
        navigate({ to: '/login', replace: true })
      }
    }

    processCallback()
  }, [search, navigate])

  return (
    <Container
      size="sm"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Card
        withBorder
        shadow="md"
        radius="md"
        p="xl"
        style={{
          width: '100%',
          maxWidth: 420,
          backgroundColor:
            colorScheme === 'dark'
              ? 'var(--mantine-color-dark-7)'
              : 'var(--mantine-color-white)',
        }}
      >
        <Stack align="center" gap="md" py="lg">
          <MicrosoftLogo />
          <Title order={3} fw={700} ta="center">
            Autenticando via Microsoft
          </Title>
          <Text size="sm" c="dimmed" ta="center">
            Validando suas credenciais corporativas Solutis. Aguarde um instante...
          </Text>
          <Center mt="md">
            <Loader color="indigo" size="md" type="dots" />
          </Center>
        </Stack>
      </Card>
    </Container>
  )
}
