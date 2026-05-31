'use client'

import {
  Button,
  Group,
  Image,
  Paper,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { PlusSquare } from 'lucide-react'
import { FormProvider } from 'react-hook-form'

import undrawNoData from '@/assets/illustrations/undraw_no_data.svg'
import { Breadcrumbs } from '@/components/common/breadcrumbs'
import ContentSection from '@/components/common/content-section'
import FilterSection from '@/components/common/filter-section'
import { PageSectionHeader } from '@/components/common/page-section-header'
import Pagination from '@/components/common/pagination'
import MiniCardSkeleton from '@/components/common/skeletons/mini-card-skeleton'
import { Can } from '@/components/providers/ability'
import { ServerError } from '@/components/server-error'
import useGroupsAndPermissionsList from '@/hooks/groups-and-permissions/useGroupsAndPermissionsList'
import { useThemeColors } from '@/hooks/useThemeColors'
import type { GroupWithPermissions } from '@/types/Group'

interface GroupsAndPermissionsSearch {
  name__ilike?: string
  page?: number
}

export const Route = createFileRoute('/_dashboard/groups-and-permissions/')({
  validateSearch: (
    search: Record<string, unknown>,
  ): GroupsAndPermissionsSearch => ({
    name__ilike:
      typeof search.name__ilike === 'string' ? search.name__ilike : undefined,
    page: Number(search.page) || undefined,
  }),
  errorComponent: () => <ServerError />,
  pendingComponent: () => <MiniCardSkeleton />,
  component: GroupsAndPermissionsPage,
})

function GroupsAndPermissionsPage() {
  const searchParams = useSearch({
    from: '/_dashboard/groups-and-permissions/',
  })
  const navigate = useNavigate()
  const { getCardBackgroundColor, getSecondaryTextColor } = useThemeColors()

  const {
    filterOpened,
    toggleFilter,

    formFilter,
    page,
    onPageChange,
    onSearch,
    onClearFilters,
    pageSize,
    onPageSizeChange,
    isPending,
    error,
    data,
  } = useGroupsAndPermissionsList({ searchParams })

  if (error) return <ServerError />

  const items = data?.items ?? []
  const hasItems = items.length > 0

  const emptyState = (
    <Stack align="center" justify="center" gap={8} py="xl">
      <Image src={undrawNoData} alt="Sem dados" width={200} height={200} />
      <Text fw={500} c={getSecondaryTextColor()}>
        Nenhum grupo encontrado
      </Text>
      <Can I="add" a="group">
        <Button
          variant="light"
          onClick={() => navigate({ to: '/groups-and-permissions/add' })}
          leftSection={<PlusSquare size={18} />}
        >
          Novo grupo
        </Button>
      </Can>
    </Stack>
  )

  return (
    <>
      <Breadcrumbs />
      <PageSectionHeader
        title="Grupos e Permissões"
        actions={
          <Can I="add" a="group">
            <Button
              variant="filled"
              radius="md"
              onClick={() => navigate({ to: '/groups-and-permissions/add' })}
              leftSection={<PlusSquare size={18} />}
            >
              Novo Grupo
            </Button>
          </Can>
        }
      />
      <ContentSection
        footer={
          <Pagination
            pageSize={pageSize}
            onPageSizeChange={onPageSizeChange}
            value={page}
            onChange={onPageChange}
            totalOfItems={data?.total ?? 0}
            total={data?.pages ?? 0}
            disabled={isPending || !hasItems}
          />
        }
      >
        <FormProvider {...formFilter}>
          <FilterSection
            open={filterOpened}
            onToggle={toggleFilter}
            onClear={onClearFilters}
            onSubmit={formFilter.handleSubmit(onSearch)}
            submitting={isPending}
            cols={4}
          >
            <TextInput
              label="Nome do grupo"
              {...formFilter.register('name__ilike')}
            />
          </FilterSection>
        </FormProvider>

        <Stack gap="md" mt="md">
          {/* Cards grid */}
          {!isPending && !hasItems && emptyState}

          {isPending && (
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
              {Array.from({ length: Math.max(6, Number(pageSize) || 0) }).map(
                (_, i) => (
                  <Paper
                    key={i}
                    shadow="md"
                    radius="md"
                    p="xl"
                    bg={getCardBackgroundColor()}
                  >
                    <Skeleton height={16} width="60%" mb="sm" />
                    <Skeleton height={12} width="40%" />
                  </Paper>
                ),
              )}
            </SimpleGrid>
          )}

          {hasItems && (
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
              {items.map((item: GroupWithPermissions) => {
                const count = item.permissions.length
                const label =
                  count === 0
                    ? 'Nenhuma permissão atribuída'
                    : count === 1
                      ? '1 permissão atribuída'
                      : `${count} permissões atribuídas`

                return (
                  <Paper
                    key={item.id}
                    shadow="sm"
                    radius="lg"
                    p="xl"
                    bg={getCardBackgroundColor()}
                    withBorder
                    style={{
                      cursor: 'pointer',
                      transition: 'box-shadow 120ms ease, transform 120ms ease',
                    }}
                    onClick={() =>
                      navigate({
                        to: `/groups-and-permissions/edit/${item.id}` as any,
                      })
                    }
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.boxShadow =
                        'var(--mantine-shadow-md)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.boxShadow =
                        'var(--mantine-shadow-sm)')
                    }
                  >
                    <Stack gap={6}>
                      <Group justify="space-between" align="start">
                        <Text
                          size="lg"
                          fw={700}
                          c="blue"
                          tt="uppercase"
                          lineClamp={1}
                        >
                          {item.name}
                        </Text>
                      </Group>
                      <Text size="sm" fw={600} c={getSecondaryTextColor()}>
                        {label}
                      </Text>
                    </Stack>
                  </Paper>
                )
              })}
            </SimpleGrid>
          )}
        </Stack>
      </ContentSection>
    </>
  )
}
