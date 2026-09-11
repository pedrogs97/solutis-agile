'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  Badge,
  Button,
  Card,
  Container,
  Divider,
  Flex,
  Group,
  Paper,
  PasswordInput,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
  useMantineColorScheme,
} from '@mantine/core'
import { showNotification } from '@mantine/notifications'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowRight, Boxes, CheckCircle2, LogOut, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import Image from '@/components/image'
import { ENVIRONMENT } from '@/constants/env'
import { apiV1 } from '@/lib/axios'
import { userAuthSchema } from '@/lib/validations/auth'
import { signIn, signOut } from '@/store/persisted/useAuthStore'
import { getProfile, updateProfile } from '@/store/persisted/useProfileStore'

export const Route = createFileRoute('/_auth/login/')({
  component: LoginPage,
})

type FormData = z.infer<typeof userAuthSchema>

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
    <svg width="18" height="18" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  )
}

function LoginPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isAzureLoading, setIsAzureLoading] = useState<boolean>(false)
  const [mode, setMode] = useState<'login' | 'select_product'>('login')
  const [authData, setAuthData] = useState<AuthResponseData | null>(null)
  const { colorScheme } = useMantineColorScheme()
  const navigate = useNavigate()

  useEffect(() => {
    const shouldSelectProduct = sessionStorage.getItem('sso_select_product')
    if (shouldSelectProduct) {
      sessionStorage.removeItem('sso_select_product')
      const profile = getProfile()
      if (profile) {
        setAuthData(profile as unknown as AuthResponseData)
        setMode('select_product')
      }
    }
  }, [])

  const handleMicrosoftLogin = async () => {
    setIsAzureLoading(true)
    try {
      const redirectUri =
        ENVIRONMENT.azureRedirectUri ||
        `${window.location.origin}/auth/callback/azure`
      const urlResponse = await fetch(
        `${ENVIRONMENT.baseURL}${apiV1}/auth/azure/url/?redirectUri=${encodeURIComponent(redirectUri)}`,
      )
      if (!urlResponse.ok) {
        const errData = await urlResponse.json().catch(() => null)
        throw new Error(
          errData?.detail ||
            'Não foi possível obter a URL de autenticação corporativa da Microsoft.',
        )
      }
      const data = await urlResponse.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err: any) {
      showNotification({
        title: 'Erro no Login Microsoft',
        message:
          err?.message ||
          'Não foi possível conectar ao serviço da Microsoft. Tente novamente mais tarde.',
        color: 'red',
        autoClose: 6000,
        withCloseButton: true,
      })
      setIsAzureLoading(false)
    }
  }

  const form = useForm({
    resolver: zodResolver(userAuthSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  })

  const redirectToFlow = (data: AuthResponseData) => {
    const targetUrl = new URL(ENVIRONMENT.flowAppURL, window.location.origin)
    targetUrl.searchParams.set('token', data.access_token)
    targetUrl.searchParams.set('user', JSON.stringify({
      id: data.id,
      name: data.full_name,
      email: data.email,
      role: data.group === 'admin' || data.group === 'MASTER' ? 'ADMIN' : 'GESTOR',
    }))
    window.location.href = targetUrl.toString()
  }

  const onSubmit = async (formDataValues: FormData) => {
    setIsLoading(true)
    const formData = new FormData()
    formData.append('username', formDataValues.username)
    formData.append('password', formDataValues.password)
    try {
      const response = await fetch(`${ENVIRONMENT.baseURL}${apiV1}/auth/login/`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Usuário ou senha incorretos.')
      }

      const data: AuthResponseData = await response.json()
      const userProducts = data.products && data.products.length > 0
        ? data.products.map((p) => p.toLowerCase().trim())
        : (Array.isArray(data.products) && data.products.length === 0 ? [] : ['agile', 'flow'])

      // Caso 4: Usuário sem nenhum produto habilitado
      if (userProducts.length === 0) {
        showNotification({
          title: 'Acesso Não Permitido',
          message: 'Usuário não possui acesso a nenhum produto cadastrado.',
          color: 'red',
          autoClose: 6000,
          withCloseButton: true,
        })
        setIsLoading(false)
        return
      }

      signIn(data)
      updateProfile(data)

      const hasAgile = userProducts.includes('agile')
      const hasFlow = userProducts.includes('flow')

      // Caso 1: Usuário possui acesso a ambos os produtos
      if (hasAgile && hasFlow) {
        setAuthData(data)
        setMode('select_product')
        setIsLoading(false)
        return
      }

      // Caso 2: Usuário possui apenas acesso ao Agile
      if (hasAgile) {
        navigate({ to: '/dashboard' })
        return
      }

      // Caso 3: Usuário possui apenas acesso ao Flow
      if (hasFlow) {
        redirectToFlow(data)
        return
      }
    } catch {
      form.setError('password', {
        type: 'custom',
        message: 'Usuário ou senha incorretos.',
      })
      showNotification({
        title: 'Erro ao fazer login',
        message:
          'Não foi possível fazer login, verifique suas credenciais e tente novamente.',
        color: 'red',
        autoClose: 5000,
        withCloseButton: false,
      })
      setIsLoading(false)
    }
  }

  const handleSwitchAccount = () => {
    signOut()
    setAuthData(null)
    setMode('login')
    form.reset()
  }

  return (
    <Container
      size="lg"
      style={{
        minHeight: '100vh',
        display: 'flex',
        width: '100%',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
      }}
    >
      <Image
        src="/solutis-agile-logo.png"
        alt="Logo Solutis Agile"
        width={350}
        height={70}
        priority
      />

      {mode === 'login' ? (
        <Paper
          withBorder
          shadow="md"
          p={30}
          mt={30}
          radius="md"
          style={{ width: '100%', maxWidth: 420 }}
        >
          <Stack gap="xs" mb="md" align="center">
            <Title order={3} fw={800} ta="center">
              Login
            </Title>
            <Text c="dimmed" size="xs" ta="center">
              Acesse o ecossistema integrado Solutis com suas credenciais corporativas
            </Text>
          </Stack>

          {ENVIRONMENT.enableSSO && (
            <>
              <Button
                variant="default"
                size="md"
                fullWidth
                onClick={handleMicrosoftLogin}
                loading={isAzureLoading}
                disabled={isLoading || isAzureLoading}
                leftSection={<MicrosoftLogo />}
                styles={{
                  root: {
                    borderWidth: '1px',
                    fontWeight: 600,
                    transition: 'all 0.2s ease',
                  },
                }}
              >
                Entrar com conta Microsoft
              </Button>

              <Divider
                my="lg"
                label="ou continue com usuário e senha"
                labelPosition="center"
                styles={{
                  label: {
                    fontSize: '0.75rem',
                    color: 'var(--mantine-color-dimmed)',
                  },
                }}
              />
            </>
          )}

          <form onSubmit={form.handleSubmit(onSubmit)}>
            <TextInput
              id="username"
              label="Usuário"
              placeholder="ex: joao.silva"
              autoFocus
              {...form.register('username')}
              disabled={isLoading}
              error={form.formState.errors.username?.message}
            />
            <PasswordInput
              id="password"
              label="Senha"
              placeholder="• • • • • • • •"
              mt="md"
              {...form.register('password')}
              disabled={isLoading}
              error={form.formState.errors.password?.message}
            />
            <Button
              fullWidth
              type="submit"
              mt="xl"
              disabled={isLoading}
              loading={isLoading}
              color="indigo"
              size="md"
            >
              Entrar
            </Button>
          </form>
        </Paper>
      ) : (
        <Paper
          withBorder
          shadow="xl"
          p={32}
          mt={24}
          radius="lg"
          style={{ width: '100%', maxWidth: 780 }}
        >
          <Stack gap="xs" align="center" mb="xl">
            <Badge size="lg" variant="light" color="indigo" radius="sm">
              Sessão Autenticada
            </Badge>
            <Title order={2} fw={800} ta="center">
              Qual produto você deseja acessar?
            </Title>
            <Text c="dimmed" size="sm" ta="center">
              Olá, <strong style={{ color: 'var(--mantine-color-indigo-6)' }}>{authData?.full_name || authData?.email}</strong>! Selecione o sistema desejado para continuar:
            </Text>
          </Stack>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
            {/* Card Solutis Agile */}
            <Card
              withBorder
              padding="xl"
              radius="md"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
              }}
              className="hover:shadow-lg hover:border-indigo-400"
              onClick={() => navigate({ to: '/dashboard' })}
            >
              <Stack gap="md">
                <Group justify="space-between">
                  <ThemeIcon size={48} radius="md" color="indigo" variant="light">
                    <Boxes size={28} />
                  </ThemeIcon>
                  <Badge color="indigo" variant="outline">Agile Core</Badge>
                </Group>

                <div>
                  <Text fw={700} size="lg">Solutis Agile</Text>
                  <Text size="xs" c="dimmed" mt={4}>
                    Gestão patrimonial, ativos, comodatos, fornecedores e análise de compras.
                  </Text>
                </div>

                <Stack gap={4} mt="xs">
                  <Group gap={6}>
                    <CheckCircle2 size={14} color="#4c6ef5" />
                    <Text size="xs" c="dimmed">Controle de Ativos & Comodatos</Text>
                  </Group>
                  <Group gap={6}>
                    <CheckCircle2 size={14} color="#4c6ef5" />
                    <Text size="xs" c="dimmed">Compras & Cotações</Text>
                  </Group>
                  <Group gap={6}>
                    <CheckCircle2 size={14} color="#4c6ef5" />
                    <Text size="xs" c="dimmed">Avaliação Técnica</Text>
                  </Group>
                </Stack>
              </Stack>

              <Button
                color="indigo"
                fullWidth
                mt="xl"
                rightSection={<ArrowRight size={16} />}
                onClick={() => navigate({ to: '/dashboard' })}
              >
                Acessar Solutis Agile
              </Button>
            </Card>

            {/* Card Solutis Flow */}
            <Card
              withBorder
              padding="xl"
              radius="md"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
              }}
              className="hover:shadow-lg hover:border-violet-400"
              onClick={() => authData && redirectToFlow(authData)}
            >
              <Stack gap="md">
                <Group justify="space-between">
                  <ThemeIcon size={48} radius="md" color="violet" variant="light">
                    <Zap size={28} />
                  </ThemeIcon>
                  <Badge color="violet" variant="outline">Flow Real-time</Badge>
                </Group>

                <div>
                  <Text fw={700} size="lg">Solutis Flow</Text>
                  <Text size="xs" c="dimmed" mt={4}>
                    Governança operacional, Kanban em tempo real, acompanhamento de SLAs e gestão de demandas.
                  </Text>
                </div>

                <Stack gap={4} mt="xs">
                  <Group gap={6}>
                    <CheckCircle2 size={14} color="#7950f2" />
                    <Text size="xs" c="dimmed">Quadro Kanban & Fila de Demandas</Text>
                  </Group>
                  <Group gap={6}>
                    <CheckCircle2 size={14} color="#7950f2" />
                    <Text size="xs" c="dimmed">Acompanhamento em Tempo Real</Text>
                  </Group>
                  <Group gap={6}>
                    <CheckCircle2 size={14} color="#7950f2" />
                    <Text size="xs" c="dimmed">Governança & Controle de Prazos</Text>
                  </Group>
                </Stack>
              </Stack>

              <Button
                color="violet"
                fullWidth
                mt="xl"
                rightSection={<ArrowRight size={16} />}
                onClick={() => authData && redirectToFlow(authData)}
              >
                Acessar Solutis Flow
              </Button>
            </Card>
          </SimpleGrid>

          <Flex justify="center" mt="xl">
            <Button
              variant="subtle"
              color="gray"
              size="xs"
              leftSection={<LogOut size={14} />}
              onClick={handleSwitchAccount}
            >
              Entrar com outra conta
            </Button>
          </Flex>
        </Paper>
      )}

      <Flex
        style={{ marginTop: 'auto', paddingTop: '2rem' }}
        align={'center'}
        justify={'space-around'}
        w="100%"
        direction={{ base: 'column', sm: 'row' }}
        gap="xs"
      >
        <Image
          src={
            colorScheme === 'dark'
              ? '/parametrize-logo-dark.png'
              : '/parametrize-logo.png'
          }
          alt="Logo Parametrize"
          width={130}
          height={130}
        />
        <Text c="dimmed" size="xs">
          Copyright © 2023 - {new Date().getFullYear()} Parametrize. Todos os direitos reservados.
        </Text>
      </Flex>
    </Container>
  )
}

