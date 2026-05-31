'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
  Container,
  Flex,
  PasswordInput,
  Text,
  TextInput,
  useMantineColorScheme,
} from '@mantine/core'
import { showNotification } from '@mantine/notifications'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import Image from '@/components/image'
import { ENVIRONMENT } from '@/constants/env'
import { apiV1 } from '@/lib/axios'
import { userAuthSchema } from '@/lib/validations/auth'
import { signIn } from '@/store/persisted/useAuthStore'
import { updateProfile } from '@/store/persisted/useProfileStore'

export const Route = createFileRoute('/_auth/login/')({
  // If you want to block this page when already authed, you could redirect here.
  // beforeLoad: ({ context }) => { if (context.auth.isAuthenticated) throw redirect({ to: '/' }) },
  component: LoginPage,
})

type FormData = z.infer<typeof userAuthSchema>

function LoginPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const { colorScheme } = useMantineColorScheme()
  let navigate = useNavigate()

  const form = useForm({
    resolver: zodResolver(userAuthSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  })

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    const formData = new FormData()
    formData.append('username', data.username)
    formData.append('password', data.password)
    try {
      await fetch(`${ENVIRONMENT.baseURL}${apiV1}/auth/login/`, {
        method: 'POST',
        body: formData,
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error('Usuário ou senha incorretos.')
          }
          return response.json()
        })
        .then((data) => {
          signIn(data)
          updateProfile(data)
          navigate({ to: '/dashboard' })
        })
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

  return (
    <Container
      size="lg"
      style={{
        height: '100vh',
        display: 'flex',
        width: '100%',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Image
        src="/solutis-agile-logo.png"
        alt="Logo"
        width={350}
        height={70}
        priority
      />

      <form
        style={{
          width: '100%',
          maxWidth: 400,
          marginTop: 20,
        }}
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <TextInput
          id="username"
          label="Usuário"
          placeholder="Usuário"
          autoFocus
          {...form.register('username')}
          disabled={isLoading}
        />
        <PasswordInput
          id="password"
          label="Senha"
          placeholder="• • • • • • • •"
          mt="md"
          {...form.register('password')}
          disabled={isLoading}
        />
        <Button
          fullWidth
          type="submit"
          mt="xl"
          disabled={isLoading}
          loading={isLoading}
        >
          Entrar
        </Button>
      </form>
      <Flex
        style={{ position: 'absolute', bottom: 10 }}
        align={'center'}
        justify={'space-around'}
        w="100%"
      >
        <Image
          src={
            colorScheme === 'dark'
              ? '/parametrize-logo-dark.png'
              : '/parametrize-logo.png'
          }
          alt="Logo"
          width={150}
          height={150}
        />
        <Text c="dimmed">
          Copyright © 2023 - {new Date().getFullYear()} Parametrize. Todos os
          direitos reservados.
        </Text>
      </Flex>
    </Container>
  )
}
