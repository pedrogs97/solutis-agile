'use client'

import {
  Box,
  Button,
  Card,
  Container,
  Divider,
  Flex,
  Grid,
  Input as MantineInput,
  Paper,
  Space,
  Stack,
  Text,
  Textarea,
  Title,
  useMantineTheme,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Building, Check, Mail, Phone, User } from 'lucide-react'
import { type ChangeEvent, useState } from 'react'
import { IMaskInput } from 'react-imask'

import { ExtraLendingTable } from '@/components/inventory-form/extra-lending-table/extra-lending-table'
import { TableLendings } from '@/components/inventory-form/lendings/table'
import { TableTerms } from '@/components/inventory-form/terms/table'
import { ServerError } from '@/components/server-error'
import { ENVIRONMENT } from '@/constants/env'
import { useThemeColors } from '@/hooks/useThemeColors'
import { apiV1 } from '@/lib/axios'
import { useInventoryStore } from '@/store/persisted/useInventoryStore'

export const Route = createFileRoute('/_inventory/inventory-form/')({
  errorComponent: () => <ServerError />,
  component: InventoryFormPage,
})

function InventoryFormPage() {
  const {
    getContentBackgroundColor,
    getCardBackgroundColor,
    getPrimaryTextColor,
    getSecondaryTextColor,
  } = useThemeColors()
  const theme = useMantineTheme()
  const navigate = useNavigate()

  const {
    inventory,
    inventoryExtraItems,
    updateInventoryExtraItems,
    inventoryLendingItems,
    inventoryTermItems,
    invertoryExtraLendings,
  } = useInventoryStore()
  const [inventoryPhone, setInventoryPhone] = useState(
    inventory?.employee.phone ?? 'Não informado',
  )
  const [inventoryManager, setInventoryManager] = useState(
    inventory?.employee.manager ?? 'Não informado',
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (!inventory || inventory.token === '') {
    navigate({ to: '/inventory-access' })
  }

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    updateInventoryExtraItems(e.target.value)
  }

  const handleChangePhone = (value: string) => {
    setInventoryPhone(value)
    // Clear error when user starts typing
    if (errors.phone) {
      setErrors((prev) => ({ ...prev, phone: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Validate phone format
    const phoneRegex = /^\(\d{2}\) \d{5}-\d{4}$/
    if (
      inventoryPhone &&
      !phoneRegex.test(inventoryPhone) &&
      inventoryPhone !== 'Não informado'
    ) {
      newErrors.phone = 'Formato de telefone inválido. Use (00) 00000-0000'
    }

    // Validate manager field
    if (!inventoryManager || inventoryManager.trim() === '') {
      newErrors.manager = 'Nome do gestor é obrigatório'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChangeManager = (e: ChangeEvent<HTMLInputElement>) => {
    setInventoryManager(e.target.value)
    // Clear error when user starts typing
    if (errors.manager) {
      setErrors((prev) => ({ ...prev, manager: '' }))
    }
  }

  const handleSave = async () => {
    // Validate form before saving
    if (!validateForm()) {
      notifications.show({
        title: 'Erro de validação',
        message: 'Por favor, corrija os erros no formulário antes de salvar.',
        color: 'red',
        autoClose: 3000,
      })
      return
    }

    setIsSubmitting(true)
    const idNotification = notifications.show({
      loading: true,
      title: 'Salvando',
      message: 'O formulário está sendo salvo, aguarde um momento...',
      autoClose: false,
      withCloseButton: false,
    })
    const payload = {
      phone: inventoryPhone,
      manager: inventoryManager,
      lendings: inventoryLendingItems,
      terms: inventoryTermItems,
      extraAssets: invertoryExtraLendings,
      extraItems: inventoryExtraItems,
    }

    try {
      const response = await fetch(
        `${ENVIRONMENT.baseURL}${apiV1}/inventory/answer/`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: {
            Authorization: `bearer ${inventory?.token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        },
      )

      if (response.status === 400) {
        const message = await response.json()
        notifications.update({
          id: idNotification,
          loading: false,
          autoClose: 2000,
          title: 'Erro',
          message: message,
          color: 'red',
        })
      } else {
        notifications.update({
          id: idNotification,
          loading: false,
          autoClose: 1000,
          title: 'Salvo',
          message: 'O formulário foi salvo com sucesso',
          color: 'green',
        })
      }
    } catch {
      notifications.update({
        id: idNotification,
        loading: false,
        autoClose: 2000,
        title: 'Erro',
        message: 'Ocorreu um erro ao salvar o formulário',
        color: 'red',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Skip navigation link for accessibility */}
      <Box
        component="a"
        href="#form-content"
        style={{
          position: 'absolute',
          top: '-40px',
          left: '6px',
          background: theme.colors.blue[6],
          color: theme.white,
          padding: '8px',
          textDecoration: 'none',
          borderRadius: '4px',
          zIndex: 9999,
        }}
        onFocus={(e) => {
          e.currentTarget.style.top = '6px'
        }}
        onBlur={(e) => {
          e.currentTarget.style.top = '-40px'
        }}
      >
        Pular para o conteúdo principal
      </Box>

      <Container size="xl" p={{ base: 'xs', sm: 'md', md: 'lg', lg: 'xl' }}>
        <Paper
          id="form-content"
          shadow="sm"
          p={{ base: 'md', sm: 'lg', md: 'xl' }}
          radius="lg"
          withBorder
          bg={getContentBackgroundColor()}
          role="main"
          aria-label="Formulário de Inventário"
        >
          <Stack gap="xl">
            {/* Header Section */}
            <Box>
              <Title
                order={2}
                c={getPrimaryTextColor()}
                mb="xs"
                id="form-title"
              >
                Formulário de Inventário
              </Title>
              <Text c={getSecondaryTextColor()} size="sm" id="form-description">
                Por favor, verifique e confirme as informações abaixo sobre os
                ativos atribuídos a você.
              </Text>
            </Box>

            <Divider />

            {/* Employee Information Card */}
            <Card
              shadow="xs"
              p="lg"
              radius="md"
              bg={getCardBackgroundColor()}
              role="region"
              aria-labelledby="employee-info-title"
            >
              <Title
                order={3}
                mb="md"
                c={getPrimaryTextColor()}
                id="employee-info-title"
              >
                Informações do Colaborador
              </Title>
              <Grid>
                <Grid.Col span={{ base: 12, md: 6, lg: 8 }}>
                  <Stack gap="md">
                    <Flex direction="column" gap="xs">
                      <Text
                        size="sm"
                        fw={500}
                        c={getPrimaryTextColor()}
                        component="label"
                        htmlFor="employee-name"
                      >
                        Nome Completo
                      </Text>
                      <MantineInput
                        id="employee-name"
                        disabled
                        defaultValue={inventory?.employee.fullName}
                        variant="filled"
                        leftSection={<User size={16} />}
                        aria-label="Nome completo do colaborador"
                        aria-describedby="form-description"
                      />
                    </Flex>
                    <Flex direction="column" gap="xs">
                      <Text
                        size="sm"
                        fw={500}
                        c={getPrimaryTextColor()}
                        component="label"
                        htmlFor="manager-name"
                      >
                        Gestor
                      </Text>
                      <MantineInput
                        id="manager-name"
                        placeholder="Nome do gestor"
                        onChange={handleChangeManager}
                        value={inventoryManager}
                        variant="default"
                        leftSection={<Building size={16} />}
                        error={errors.manager}
                        aria-label="Nome do gestor"
                        aria-required="true"
                        aria-invalid={!!errors.manager}
                      />
                    </Flex>
                  </Stack>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
                  <Stack gap="md">
                    <Flex direction="column" gap="xs">
                      <Text
                        size="sm"
                        fw={500}
                        c={getPrimaryTextColor()}
                        component="label"
                        htmlFor="employee-phone"
                      >
                        Telefone
                      </Text>
                      <MantineInput
                        id="employee-phone"
                        component={IMaskInput}
                        mask="(00) 00000-0000"
                        onAccept={handleChangePhone}
                        value={inventoryPhone}
                        defaultValue={
                          inventory?.employee.phone ?? 'Não informado'
                        }
                        variant="default"
                        leftSection={<Phone size={16} />}
                        error={errors.phone}
                        aria-label="Telefone do colaborador"
                        aria-invalid={!!errors.phone}
                      />
                    </Flex>
                    <Flex direction="column" gap="xs">
                      <Text
                        size="sm"
                        fw={500}
                        c={getPrimaryTextColor()}
                        component="label"
                        htmlFor="employee-email"
                      >
                        Email
                      </Text>
                      <MantineInput
                        id="employee-email"
                        disabled
                        defaultValue={
                          inventory?.employee.email ?? 'Não informado'
                        }
                        variant="filled"
                        leftSection={<Mail size={16} />}
                        aria-label="Email do colaborador"
                        aria-describedby="form-description"
                      />
                    </Flex>
                  </Stack>
                </Grid.Col>
              </Grid>
            </Card>

            {/* Assets Section */}
            <Stack gap="xl">
              <TableLendings />
              <Divider />
              <TableTerms />
              <Divider />

              {/* Additional Assets Card */}
              <Card
                shadow="xs"
                p="lg"
                radius="md"
                bg={getCardBackgroundColor()}
              >
                <Title order={4} mb="md" c={getPrimaryTextColor()}>
                  Ativos Adicionais
                </Title>
                <Text mb="md" c={getSecondaryTextColor()}>
                  Caso você esteja com algum ativo que não foi mencionado na
                  listagem acima, como notebook, desktop, headset, monitor,
                  celular ou mobiliários, gentileza informar nos campos abaixo:
                </Text>
                <ExtraLendingTable />
              </Card>

              {/* Additional Items Card */}
              <Card
                shadow="xs"
                p="lg"
                radius="md"
                bg={getCardBackgroundColor()}
              >
                <Title order={4} mb="md" c={getPrimaryTextColor()}>
                  Outros Itens
                </Title>
                <Stack gap="md">
                  <Text
                    c={getSecondaryTextColor()}
                    id="additional-items-description"
                  >
                    Se estiver com algum ativo como fardamento, chip ou kit
                    ferramentas, gentileza detalhar no campo abaixo:
                  </Text>
                  <Textarea
                    id="additional-items"
                    placeholder="Descreva os itens adicionais..."
                    onChange={handleChange}
                    value={inventoryExtraItems}
                    minRows={3}
                    autosize
                    aria-label="Descrição de itens adicionais como fardamento, chip ou kit ferramentas"
                    aria-describedby="additional-items-description"
                  />
                  <Text size="sm" c={getSecondaryTextColor()} fs="italic">
                    Caso seja necessário entraremos em contato para verificação
                    e geração dos comodatos e/ou termos de responsabilidade.
                  </Text>
                </Stack>
              </Card>

              {/* Contact Information Card */}
              <Card
                shadow="xs"
                p="lg"
                radius="md"
                bg={getCardBackgroundColor()}
              >
                <Title order={4} mb="md" c={getPrimaryTextColor()}>
                  Dúvidas e Contato
                </Title>
                <Stack gap="sm">
                  <Text c={getSecondaryTextColor()}>
                    Em caso de dúvidas, não hesite em manter contato através do
                    e-mail{' '}
                    <Text
                      component="a"
                      href="mailto:inventario@solutis.com.br"
                      c={theme.colors.blue[6]}
                      inherit
                    >
                      inventario@solutis.com.br
                    </Text>{' '}
                    ou pelo Teams com Beatriz Cunha, Thomas Medeiros ou Tailon
                    Souza.
                  </Text>
                  <Text c={getSecondaryTextColor()}>
                    Obrigado por fazer parte desse processo tão importante!
                  </Text>
                </Stack>
              </Card>
            </Stack>

            <Space h="lg" />

            {/* Save Button */}
            <Flex justify={{ base: 'center', sm: 'flex-end' }}>
              <Button
                type="submit"
                variant="filled"
                radius="md"
                size="lg"
                onClick={handleSave}
                loading={isSubmitting}
                disabled={isSubmitting}
                leftSection={!isSubmitting && <Check size={18} />}
                aria-label="Salvar formulário de inventário"
                style={{
                  background: isSubmitting
                    ? theme.colors.gray[6]
                    : `linear-gradient(45deg, ${theme.colors.blue[6]}, ${theme.colors.blue[7]})`,
                  boxShadow: theme.shadows.md,
                  transition: 'all 0.2s ease',
                }}
                styles={{
                  root: {
                    '&:hover:not(:disabled)': {
                      transform: 'translateY(-2px)',
                      boxShadow: theme.shadows.lg,
                    },
                  },
                }}
              >
                {isSubmitting ? 'Salvando...' : 'Salvar Formulário'}
              </Button>
            </Flex>
          </Stack>
        </Paper>
      </Container>
    </>
  )
}
