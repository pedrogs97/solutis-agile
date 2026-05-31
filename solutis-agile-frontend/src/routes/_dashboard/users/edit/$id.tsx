'use client'

import {
  Button,
  Card,
  Flex,
  Grid,
  InputWrapper,
  Switch,
  Tabs,
  Text,
} from '@mantine/core'
import { createFileRoute, useParams } from '@tanstack/react-router'
import { Check, Send } from 'lucide-react'
import { Controller, FormProvider } from 'react-hook-form'

import AsyncSelect from '@/components/common/async-select'
import { Breadcrumbs } from '@/components/common/breadcrumbs'
import Input from '@/components/common/input'
import { PageSectionHeader } from '@/components/common/page-section-header'
import Select from '@/components/common/select'
import FormSkeleton from '@/components/common/skeletons/form-skeleton'
import { ServerError } from '@/components/server-error'
import useUser from '@/hooks/user/useUser'
import { useThemeColors } from '@/hooks/useThemeColors'

export const Route = createFileRoute('/_dashboard/users/edit/$id')({
  errorComponent: () => <ServerError />,
  pendingComponent: () => <FormSkeleton />,
  component: EditUserPage,
})

function EditUserPage() {
  const {
    getContentBackgroundColor,
    getSecondaryTextColor,
    getCardBackgroundColor,
  } = useThemeColors()
  const { id } = useParams({ from: '/_dashboard/users/edit/$id' })

  const {
    form,
    onSubmit,
    onSendResetPasswordEmail,
    isLoading,
    groups,
    isPendingGroups,
    canEdit,
    fetchEmployeeOptions,
    employeeInitialOptions,
  } = useUser({ id, isDetail: true })

  return (
    <>
      <Breadcrumbs />
      <PageSectionHeader title="Editar usuário" />
      <Tabs
        color={getCardBackgroundColor()}
        variant="pills"
        radius="md"
        defaultValue="general-data"
      >
        <Tabs.List>
          <Tabs.Tab value="general-data" mb={20}>
            <Text size="sm" fw={700} c={getSecondaryTextColor()}>
              Dados Gerais
            </Text>
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="general-data">
          <Card
            shadow="sm"
            p={20}
            style={{
              borderRadius: 25,
              minHeight: 350,
            }}
            bg={getContentBackgroundColor()}
          >
            <FormProvider {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <Grid my={10}>
                  <Grid.Col span={{ base: 12, xs: 6 }}>
                    <AsyncSelect
                      name="employeeId"
                      label="Colaborador"
                      placeholder="Selecione o colaborador"
                      fetcher={fetchEmployeeOptions}
                      debounceMs={400}
                      minChars={2}
                      preloadOnOpen
                      initialOptions={employeeInitialOptions}
                    />
                  </Grid.Col>
                </Grid>
                <Grid>
                  <Grid.Col span={{ base: 12, xs: 4 }}>
                    <Input
                      label="Nome de Usuário ex.: joao.silva"
                      name="username"
                      disabled={isLoading || !canEdit}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, xs: 4 }}>
                    <Input
                      label="E-mail Corporativo"
                      name="email"
                      disabled={isLoading || !canEdit}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, xs: 4 }}>
                    <Input
                      label="Departamento"
                      name="department"
                      disabled={isLoading || !canEdit}
                    />
                  </Grid.Col>
                </Grid>
                <Grid my={10}>
                  <Grid.Col span={{ base: 12, xs: 4 }}>
                    <Input
                      label="Gestor direto"
                      name="manager"
                      disabled={isLoading || !canEdit}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, xs: 4 }}>
                    <Select
                      name="groupId"
                      label="Perfil"
                      data={groups}
                      loading={isLoading || isPendingGroups}
                      disabled={!canEdit}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, xs: 4 }}>
                    <Controller
                      name="isActive"
                      control={form.control}
                      render={({ field: { onChange, onBlur, value } }) => (
                        <InputWrapper label="Status">
                          <Switch
                            color="teal"
                            label={value ? 'Ativo' : 'Inativo'}
                            onChange={onChange}
                            onBlur={onBlur}
                            checked={value}
                            disabled={!canEdit}
                            size="md"
                          />
                        </InputWrapper>
                      )}
                    />
                  </Grid.Col>
                </Grid>
                <Flex my={10} justify="flex-end" wrap="wrap">
                  <Button
                    type="button"
                    variant="filled"
                    radius="md"
                    color="dark"
                    mt={10}
                    onClick={() => onSendResetPasswordEmail()}
                    disabled={isLoading || !canEdit}
                  >
                    Gerar nova senha&nbsp;
                    <Send size={16} />
                  </Button>
                  {canEdit && (
                    <Button
                      type="submit"
                      variant="outline"
                      radius="md"
                      ml={10}
                      mt={10}
                      disabled={isLoading}
                    >
                      Confirmar&nbsp;
                      <Check size={16} />
                    </Button>
                  )}
                </Flex>
              </form>
            </FormProvider>
          </Card>
        </Tabs.Panel>
      </Tabs>
    </>
  )
}
