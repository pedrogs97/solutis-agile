'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  Box,
  Button,
  Container,
  Flex,
  Group as MantineRadioGroup,
  Paper,
  Radio as MantineRadio,
  rem,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { showNotification } from '@mantine/notifications'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { z } from 'zod'

import DateInput from '@/components/common/date-input'
import Input from '@/components/common/input'
import Image from '@/components/image'
import { ServerError } from '@/components/server-error'
import { useThemeColors } from '@/hooks/useThemeColors'
import axios from '@/lib/axios'
import { invertoryAccesSchema } from '@/lib/validations/inventoryAcess'
import { useInventoryStore } from '@/store/persisted/useInventoryStore'

type FormData = z.infer<typeof invertoryAccesSchema>

export const Route = createFileRoute('/_inventory/inventory-access/')({
  errorComponent: () => <ServerError />,
  component: InventoryAccessPage,
})

function InventoryAccessPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const { updateInventory } = useInventoryStore()
  const navigate = useNavigate()
  const { getContentBackgroundColor } = useThemeColors()
  const form = useForm({
    resolver: zodResolver(invertoryAccesSchema),
    defaultValues: {
      registration: '',
      birthday: undefined,
      accept: '',
    },
  })

  const onSubmit = async (data: FormData) => {
    if (!data.birthday) return
    if (isLoading) return
    setIsLoading(true)
    try {
      const payload = {
        registration: data.registration,
        birthday: data?.birthday,
      }
      const response = await axios.post('/inventory/get-employee/', payload)
      updateInventory(response.data)
      navigate({ to: '/inventory-form' as any })
    } catch {
      form.setError('birthday', {
        type: 'custom',
        message: 'Verifique sua matrícula e data de nascimento.',
      })
      showNotification({
        title: 'Erro ao acessar o inventário',
        message:
          'Não foi possível acessar o inventário, verifique suas credenciais e tente novamente. Caso o erro persista, entre em contato com o suporte.',
        color: 'red',
        autoClose: 5000,
        withCloseButton: false,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box
      component="main"
      bg={getContentBackgroundColor()}
      style={{
        minHeight: '100vh',
      }}
    >
      <Container size="md" py="xl">
        <Flex
          direction="column"
          align="center"
          justify="space-between"
          mih="100vh"
        >
          <Stack align="center" gap={rem(40)} w="100%" py="xl">
            <Image
              src="/solutis-agile-logo.png"
              alt="Logo Solutis Agile"
              width={300}
              height={60}
              priority
            />

            <Paper
              withBorder
              radius="lg"
              shadow="md"
              p={{ base: 'xl', sm: rem(40) }}
              w="100%"
              style={{ maxWidth: rem(520) }}
            >
              <Stack gap="xl">
                <Stack gap="xs" align="flex-start">
                  <Title order={2} fz={{ base: rem(24), sm: rem(28) }}>
                    Acesse seu inventário
                  </Title>
                  <Text c="dimmed" fz="sm">
                    Informe seus dados para validar sua identidade e continuar
                    atualizando seus itens.
                  </Text>
                </Stack>

                <FormProvider {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)}>
                    <Stack gap="md">
                      <Input
                        name="registration"
                        label="Matrícula"
                        placeholder="Digite sua matrícula"
                        disabled={isLoading}
                      />
                      <DateInput
                        name="birthday"
                        label="Data de Nascimento"
                        placeholder="Selecione sua data de nascimento"
                        maxDate={new Date()}
                        disabled={isLoading}
                        valueFormat="DD/MM/YYYY"
                      />

                      <Controller
                        name="accept"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Stack gap="xs">
                            <Text fz="sm" fw={500}>
                              Termos de aceite
                            </Text>
                            <MantineRadio.Group
                              error={fieldState.error?.message}
                              onChange={(value) => field.onChange(value)}
                            >
                              <Stack gap="xs">
                                <Text fz="xs" c="dimmed">
                                  Estou ciente de que todos os dados fornecidos
                                  neste formulário estão de acordo com a
                                  política de privacidade da Solutis, nos termos
                                  da LGPD (Lei nº 13.709/18).
                                </Text>
                                <MantineRadioGroup>
                                  <Stack gap={rem(8)}>
                                    <MantineRadio
                                      size="sm"
                                      label="Concordo"
                                      {...field}
                                      value="1"
                                    />
                                    <MantineRadio
                                      size="sm"
                                      label="Discordo"
                                      {...field}
                                      value="0"
                                    />
                                  </Stack>
                                </MantineRadioGroup>
                              </Stack>
                            </MantineRadio.Group>
                          </Stack>
                        )}
                      />

                      <Button
                        type="submit"
                        loading={isLoading}
                        size="md"
                        radius="md"
                      >
                        Entrar
                      </Button>
                    </Stack>
                  </form>
                </FormProvider>
              </Stack>
            </Paper>
          </Stack>

          <Flex
            direction={{ base: 'column', sm: 'row' }}
            align="center"
            justify="center"
            gap="sm"
            pb="md"
          >
            <Image
              src="/parametrize-logo.png"
              alt="Logo Parametrize"
              width={120}
              height={120}
            />
            <Text c="dimmed" fz="xs" ta="center">
              Copyright © 2023 Parametrize. Todos os direitos reservados.
            </Text>
          </Flex>
        </Flex>
      </Container>
    </Box>
  )
}
