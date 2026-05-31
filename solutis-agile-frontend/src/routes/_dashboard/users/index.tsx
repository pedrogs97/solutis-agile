'use client'

import { Button, TextInput } from '@mantine/core'
import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { UserPlus } from 'lucide-react'
import { FormProvider } from 'react-hook-form'

import { Breadcrumbs } from '@/components/common/breadcrumbs'
import ContentSection from '@/components/common/content-section'
import FilterSection from '@/components/common/filter-section'
import { PageSectionHeader } from '@/components/common/page-section-header'
import Pagination from '@/components/common/pagination'
import TableSkeleton from '@/components/common/skeletons/table-skeleton'
import { Can } from '@/components/providers/ability'
import { ServerError } from '@/components/server-error'
import { UsersTable } from '@/components/users/table'
import useUser from '@/hooks/user/useUser'

interface UsersSearch {
  employee__full_name__ilike?: string
  page?: number
}
export const Route = createFileRoute('/_dashboard/users/')({
  validateSearch: (search: Record<string, unknown>): UsersSearch => ({
    employee__full_name__ilike:
      typeof search.employee__full_name__ilike === 'string'
        ? (search.employee__full_name__ilike as string)
        : undefined,
    page: Number(search.page) || undefined,
  }),
  errorComponent: () => <ServerError />,
  pendingComponent: () => <TableSkeleton />,
  component: UsersPage,
})

function UsersPage() {
  const searchParams = useSearch({ from: '/_dashboard/users/' })
  const navigate = useNavigate()

  const {
    page,
    filterOpened,
    toggleFilter,
    data,
    isPending,
    error,
    formFilter,
    onPageChange,
    onSearch,
    onClearFilters,
    pageSize,
    onPageSizeChange,
    canEdit,
  } = useUser({ searchParams })

  if (isPending) return <TableSkeleton />
  if (error) return <ServerError />

  return (
    <>
      <Breadcrumbs />
      <PageSectionHeader
        title="Usuários"
        actions={
          <Can I="add" a="user">
            <Button
              variant="filled"
              radius="md"
              onClick={() => navigate({ to: '/users/add' })}
            >
              <UserPlus />
              &nbsp;Novo usuário
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
            totalOfItems={data.total}
            total={data.pages}
            disabled={isPending || (data?.items?.length ?? 0) === 0}
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
              label="Nome do usuário"
              {...formFilter.register('employee__full_name__ilike')}
            />
          </FilterSection>
        </FormProvider>
        <UsersTable data={data.items} canEdit={canEdit} />
      </ContentSection>
    </>
  )
}
