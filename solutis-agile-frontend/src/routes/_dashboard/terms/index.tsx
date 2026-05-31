'use client'

import { Button, TextInput } from '@mantine/core'
import { DatePickerInput, type DatesRangeValue } from '@mantine/dates'
import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { parseISO } from 'date-fns'
import { FilePlus2 } from 'lucide-react'
import { FormProvider } from 'react-hook-form'

import { Breadcrumbs } from '@/components/common/breadcrumbs'
import ContentSection from '@/components/common/content-section'
import FilterSection from '@/components/common/filter-section'
import { PageSectionHeader } from '@/components/common/page-section-header'
import Pagination from '@/components/common/pagination'
import Select from '@/components/common/select'
import TableSkeleton from '@/components/common/skeletons/table-skeleton'
import { Icons } from '@/components/icons'
import { Can } from '@/components/providers/ability'
import { ServerError } from '@/components/server-error'
import { TermsTable } from '@/components/terms/table'
import useTermList from '@/hooks/term/useTermList'

interface FormFilter {
  search?: string
  status__name?: string
  created_at__gte?: string
  created_at__lte?: string
  page?: number
  size?: string
}

export const Route = createFileRoute('/_dashboard/terms/')({
  validateSearch: (search: Record<string, unknown>): FormFilter => {
    return {
      search: (search.search as string) || undefined,
      status__name: (search.status__name as string) || undefined,
      created_at__gte: (search.created_at__gte as string) || undefined,
      created_at__lte: (search.created_at__lte as string) || undefined,
    }
  },
  component: TermsPage,
  pendingComponent: TableSkeleton,
  errorComponent: ({ error }) => (
    <ServerError error={error} context="dashboard/terms/list-route" />
  ),
})

function TermsPage() {
  const searchParams = useSearch({ from: '/_dashboard/terms/' })
  const navigate = useNavigate()

  const parseDateValue = (value: Date | string | null) => {
    if (!value) return null
    if (value instanceof Date) return value
    return parseISO(value)
  }

  const handlePeriodChange = (value: DatesRangeValue) => {
    setPeriod([parseDateValue(value[0]), parseDateValue(value[1])])
  }

  const {
    data,
    isPending,
    error,
    onClearFilters,
    onPageChange,
    page,
    pageSize,
    onPageSizeChange,
    filterOpened,
    toggleFilter,
    formFilter,

    period,
    setPeriod,
    onSearch,
  } = useTermList({ searchParams })

  if (isPending) return <TableSkeleton />
  if (error)
    return <ServerError error={error} context="dashboard/terms/list-query" />

  return (
    <>
      <Breadcrumbs />
      <PageSectionHeader
        title="Termos de Responsabilidade"
        containerProps={{ my: 10 }}
        actions={
          <Can I="add" a="term">
            <Button
              variant="filled"
              radius="md"
              leftSection={<FilePlus2 size={16} />}
              onClick={() => navigate({ to: '/terms/add' })}
            >
              Adicionar termo
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
            disabled={isPending || data.length === 0}
          />
        }
      >
        <FormProvider {...formFilter}>
          <FilterSection
            open={filterOpened}
            onToggle={toggleFilter}
            onClear={() => {
              setPeriod([null, null])
              onClearFilters()
            }}
            onSubmit={formFilter.handleSubmit(onSearch)}
            submitting={isPending}
            cols={4}
          >
            <TextInput
              label="Pesquisar"
              {...formFilter.register('search')}
              rightSection={<Icons.search size={20} />}
            />
            <Select
              name="status__name"
              control={formFilter.control}
              label="Status"
              data={[
                'Arquivo pendente',
                'Ativo',
                'Arquivo de distrato pendente',
                'Inativo',
                'Distrato realizado',
              ]}
            />
            <DatePickerInput
              type="range"
              label="Data de criação — Período"
              value={period}
              onChange={handlePeriodChange}
              maxDate={new Date()}
              valueFormat="DD/MM/YYYY"
            />
          </FilterSection>
        </FormProvider>
        <TermsTable data={data.items} />
      </ContentSection>
    </>
  )
}
