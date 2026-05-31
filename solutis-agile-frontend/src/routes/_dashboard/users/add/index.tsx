'use client'

import { Button, Card, Grid, Tabs, Text } from '@mantine/core'
import { createFileRoute } from '@tanstack/react-router'
import { Check } from 'lucide-react'
import { FormProvider } from 'react-hook-form'

import AsyncSelect from '@/components/common/async-select'
import { Breadcrumbs } from '@/components/common/breadcrumbs'
import Input from '@/components/common/input'
import { PageSectionHeader } from '@/components/common/page-section-header'
import Select from '@/components/common/select'
import FormSkeleton from '@/components/common/skeletons/form-skeleton'
import { ServerError } from '@/components/server-error'
import useUser from '@/hooks/user/useUser'
import { useThemeColors } from '@/hooks/useThemeColors'

export const Route = createFileRoute('/_dashboard/users/add/')({
  errorComponent: () => <ServerError />,
  pendingComponent: () => <FormSkeleton />,
  component: AddUserPage,
})

function AddUserPage() {
  const {
    getContentBackgroundColor,
    getSecondaryTextColor,
    getCardBackgroundColor,
  } = useThemeColors()
  const {
    form,
    onSubmit,
    isLoading,
    groups,
    isPendingGroups,
    fetchEmployeeOptions,
  } = useUser({ isDetail: true })

  return (
    <>
      <Breadcrumbs />
      <PageSectionHeader title="Novo usuário" />
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
                    />
                  </Grid.Col>
                </Grid>
                <Grid>
                  <Grid.Col span={{ base: 12, xs: 4 }}>
                    <Input
                      label="Nome de Usuário ex.: joao.silva"
                      name="username"
                      disabled={isLoading}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, xs: 4 }}>
                    <Input
                      label="E-mail Corporativo"
                      name="email"
                      disabled={isLoading}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, xs: 4 }}>
                    <Input
                      label="Departamento"
                      name="department"
                      disabled={isLoading}
                    />
                  </Grid.Col>
                </Grid>
                <Grid my={10}>
                  <Grid.Col span={{ base: 12, xs: 4 }}>
                    <Input
                      label="Gestor direto"
                      name="manager"
                      disabled={isLoading}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, xs: 4 }}>
                    <Select
                      name="groupId"
                      label="Perfil"
                      data={groups}
                      loading={isPendingGroups}
                    />
                  </Grid.Col>
                </Grid>
                <Button
                  type="submit"
                  variant="outline"
                  radius="md"
                  style={{
                    float: 'right',
                  }}
                  disabled={isLoading}
                >
                  Confirmar&nbsp;
                  <Check size={16} />
                </Button>
              </form>
            </FormProvider>
          </Card>
        </Tabs.Panel>
      </Tabs>
    </>
  )
}
