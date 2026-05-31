'use client'

import { Box, Button, TextInput } from '@mantine/core'
import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { UserPlus } from 'lucide-react'
import { FormProvider } from 'react-hook-form'

import { Breadcrumbs } from '@/components/common/breadcrumbs'
import FilterSection from '@/components/common/filter-section'
import { PageSectionHeader } from '@/components/common/page-section-header'
import Pagination from '@/components/common/pagination'
import Select from '@/components/common/select'
import TableSkeleton from '@/components/common/skeletons/table-skeleton'
import { EmployeesTable } from '@/components/employees/table'
import { Can } from '@/components/providers/ability'
import { ServerError } from '@/components/server-error'
import { LEGAL_PERSON_OPTIONS } from '@/constants/selectOptions'
import useEmployee from '@/hooks/employee/useEmployee'
import { useThemeColors } from '@/hooks/useThemeColors'

interface FormFilter {
  full_name__ilike?: string
  legal_person?: boolean
  page?: number
  size?: string
}

export const Route = createFileRoute('/_dashboard/employees/')({
  validateSearch: (search: Record<string, unknown>): FormFilter => ({
    full_name__ilike:
      typeof search.full_name__ilike === 'string'
        ? (search.full_name__ilike as string)
        : undefined,
    legal_person:
      typeof search.legal_person === 'string'
        ? search.legal_person === 'true'
        : undefined,
    page: Number(search.page) || undefined,
    size: typeof search.size === 'string' ? (search.size as string) : undefined,
  }),
  errorComponent: () => <ServerError />,
  pendingComponent: () => <TableSkeleton />,
  component: EmployeesPage,
})

function EmployeesPage() {
  const { getContentBackgroundColor } = useThemeColors()
  const searchParams = useSearch({ from: '/_dashboard/employees/' })
  const navigate = useNavigate()

  const {
    formFilter,
    onSearch,
    onClearFilters,
    pageSize,
    onPageSizeChange,
    onPageChange,
    filterOpened,
    toggleFilter,
    page,
    data,
    isPending,
    error,
  } = useEmployee({ searchParams, isDetail: false })

  if (isPending) return <TableSkeleton />
  if (error) return <ServerError />

  return (
    <>
      <Breadcrumbs />
      <PageSectionHeader
        title="Colaboradores"
        actions={
          <Can I="add" a="employee">
            <Button
              variant="filled"
              radius="md"
              onClick={() => navigate({ to: '/employees/add' })}
            >
              <UserPlus />
              &nbsp;Novo Colaborador
            </Button>
          </Can>
        }
      />
      <Box
        bg={getContentBackgroundColor()}
        p={16}
        style={{ borderRadius: 25 }}
        mih={500}
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
              label="Nome do colaborador"
              {...formFilter.register('full_name__ilike')}
            />
            <Select
              name="legal_person"
              label="Tipo de Colaborador"
              data={LEGAL_PERSON_OPTIONS}
            />
          </FilterSection>
        </FormProvider>
        <EmployeesTable data={data.items} />
        <Pagination
          pageSize={pageSize}
          onPageSizeChange={onPageSizeChange}
          value={page}
          onChange={onPageChange}
          totalOfItems={data.total}
          total={data.pages}
          disabled={isPending || data.length === 0}
        />
      </Box>
    </>
  )
}
