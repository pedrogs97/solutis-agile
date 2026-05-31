'use client'

import {
  Accordion,
  Affix,
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Grid,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Switch,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Check, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { FormProvider } from 'react-hook-form'

import { Breadcrumbs } from '@/components/common/breadcrumbs'
import Input from '@/components/common/input'
import { PageSectionHeader } from '@/components/common/page-section-header'
import FormSkeleton from '@/components/common/skeletons/form-skeleton'
import { ServerError } from '@/components/server-error'
import useGroupsAndPermissionsDetail from '@/hooks/groups-and-permissions/useGroupsAndPermissionsDetail'
import { useThemeColors } from '@/hooks/useThemeColors'
import { translateModel } from '@/lib/utils'

// Types you likely already have in your app
// Adjust as needed if you have stricter typings
interface PermissionItem {
  id: number | string
  action: string
}

type OrganizedPermissions = Record<string, PermissionItem[]>

export const Route = createFileRoute('/_dashboard/groups-and-permissions/add/')(
  {
    errorComponent: () => <ServerError />,
    pendingComponent: () => <FormSkeleton />,
    component: AddGroupPage,
  },
)

function AddGroupPage() {
  const { getContentBackgroundColor, getSecondaryTextColor } = useThemeColors()
  const { form, organizedPermissions, onSubmit } =
    useGroupsAndPermissionsDetail({ id: null })

  // Local search/filter state for permissions
  const [query, setQuery] = useState('')

  // Convenience: always deal with an array for current selections
  const selected: number[] = form.watch('permissions') || []

  const filteredPermissions: OrganizedPermissions = useMemo(() => {
    if (!organizedPermissions) return {} as OrganizedPermissions
    if (!query.trim()) return organizedPermissions

    const q = query.trim().toLowerCase()
    const next: OrganizedPermissions = {}

    Object.entries(organizedPermissions).forEach(([module, items]) => {
      const hits = items.filter((p) => `${p.action}`.toLowerCase().includes(q))
      if (hits.length) next[module] = hits
    })

    return next
  }, [organizedPermissions, query])

  const totalSelected = selected.length

  const togglePermission = (id: number, checked: boolean) => {
    const set = new Set(selected)
    if (checked) set.add(id)
    else set.delete(id)
    form.setValue('permissions', Array.from(set), { shouldDirty: true })
  }

  const setModuleAll = (moduleKey: string, on: boolean) => {
    if (!organizedPermissions) return
    const ids =
      (organizedPermissions[moduleKey]
        ?.map((p) => p.id)
        .filter((id) => typeof id === 'number') as number[]) || []
    const set = new Set(selected)
    if (on) ids.forEach((id) => set.add(id))
    else ids.forEach((id) => set.delete(id))
    form.setValue('permissions', Array.from(set), { shouldDirty: true })
  }

  return (
    <>
      <Breadcrumbs />
      <PageSectionHeader title="Novo grupo" />

      <Grid gutter="lg" align="stretch">
        {/* Left: group basics */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card shadow="sm" p="lg" radius={20} bg={getContentBackgroundColor()}>
            <Stack gap="md">
              <Box>
                <Text c={getSecondaryTextColor()} size="sm" mb={6}>
                  Informações do grupo
                </Text>
                <Divider />
              </Box>

              <FormProvider {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <Stack gap="md">
                    <Input label="Nome do Grupo" name="name" />
                  </Stack>

                  {/* Affixed action bar (Save / Cancel) */}
                  <Affix position={{ bottom: 20, right: 24 }}>
                    <Group gap="sm">
                      <Button
                        variant="default"
                        component={Link}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          history.back()
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        radius="md"
                        leftSection={<Check size={16} />}
                        onClick={form.handleSubmit(onSubmit)}
                        loading={form.formState.isSubmitting}
                      >
                        Salvar grupo
                      </Button>
                    </Group>
                  </Affix>
                </form>
              </FormProvider>

              <Group gap="xs">
                <Badge radius="sm" variant="light">
                  {totalSelected} permissões selecionadas
                </Badge>
              </Group>
              <Text size="xs" c="dimmed">
                Dica: use a busca para filtrar ações e os botões de cada módulo
                para selecionar tudo rapidamente.
              </Text>
            </Stack>
          </Card>
        </Grid.Col>

        {/* Right: permissions */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card shadow="sm" p="lg" radius={20} bg={getContentBackgroundColor()}>
            <Stack gap="md">
              <Group justify="space-between" align="center">
                <Text size="sm" c={getSecondaryTextColor()} fw={600}>
                  Permissões
                </Text>
                <Group gap="xs">
                  <Tooltip label="Limpar seleção">
                    <Button
                      variant="subtle"
                      size="compact-sm"
                      onClick={() =>
                        form.setValue('permissions', [], { shouldDirty: true })
                      }
                      disabled={form.formState.isSubmitting}
                    >
                      Limpar tudo
                    </Button>
                  </Tooltip>
                </Group>
              </Group>

              <TextInput
                leftSection={<Search size={16} />}
                placeholder="Buscar por ação (ex.: visualizar, editar, excluir...)"
                value={query}
                onChange={(e) => setQuery(e.currentTarget.value)}
              />

              <Divider />

              <ScrollArea h={520} type="hover" offsetScrollbars>
                {filteredPermissions &&
                Object.keys(filteredPermissions).length ? (
                  <Accordion
                    multiple
                    chevronPosition="left"
                    defaultValue={Object.keys(filteredPermissions)}
                  >
                    {Object.entries(filteredPermissions).map(
                      ([moduleKey, items]) => {
                        const moduleIds = items
                          .map((p) => p.id)
                          .filter((id) => typeof id === 'number') as number[]
                        const allSelected = moduleIds.every((id) =>
                          selected.includes(id),
                        )
                        const someSelected =
                          !allSelected &&
                          moduleIds.some((id) => selected.includes(id))

                        return (
                          <Accordion.Item
                            key={moduleKey}
                            value={translateModel(moduleKey)}
                          >
                            <Accordion.Control>
                              <Group justify="space-between" wrap="nowrap">
                                <Text fw={600}>
                                  {translateModel(moduleKey)}
                                </Text>
                                <Group gap={8} wrap="nowrap">
                                  {someSelected && !allSelected ? (
                                    <Badge variant="light" color="yellow">
                                      parcial
                                    </Badge>
                                  ) : allSelected ? (
                                    <Badge variant="light" color="teal">
                                      todas
                                    </Badge>
                                  ) : null}
                                  <Text size="xs" c="dimmed">
                                    {
                                      items.filter(
                                        (i) =>
                                          typeof i.id === 'number' &&
                                          selected.includes(i.id),
                                      ).length
                                    }
                                    /{items.length}
                                  </Text>
                                  <Button
                                    component="div"
                                    role="button"
                                    tabIndex={0}
                                    size="xs"
                                    variant={allSelected ? 'default' : 'light'}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setModuleAll(moduleKey, !allSelected)
                                    }}
                                  >
                                    {allSelected
                                      ? 'Limpar'
                                      : 'Selecionar todas'}
                                  </Button>
                                </Group>
                              </Group>
                            </Accordion.Control>
                            <Accordion.Panel>
                              <Grid gutter="sm">
                                {items.map((permission) => {
                                  const checked =
                                    typeof permission.id === 'number' &&
                                    selected.includes(permission.id)
                                  return (
                                    <Grid.Col
                                      key={permission.id}
                                      span={{ base: 12, sm: 6 }}
                                    >
                                      <Switch
                                        checked={checked}
                                        label={permission.action}
                                        onChange={(e) =>
                                          typeof permission.id === 'number' &&
                                          togglePermission(
                                            permission.id,
                                            e.currentTarget.checked,
                                          )
                                        }
                                      />
                                    </Grid.Col>
                                  )
                                })}
                              </Grid>
                            </Accordion.Panel>
                          </Accordion.Item>
                        )
                      },
                    )}
                  </Accordion>
                ) : (
                  <Paper p="lg" radius="md" withBorder>
                    <Text size="sm" c="dimmed">
                      {query
                        ? 'Nenhuma permissão encontrada para a busca atual.'
                        : 'Nenhuma permissão disponível.'}
                    </Text>
                  </Paper>
                )}
              </ScrollArea>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </>
  )
}
