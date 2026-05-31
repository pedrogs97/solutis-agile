'use client'

import { Button, TextInput } from '@mantine/core'
import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { PackagePlus } from 'lucide-react'
import { FormProvider } from 'react-hook-form'

import { Breadcrumbs } from '@/components/common/breadcrumbs'
import ContentSection from '@/components/common/content-section'
import DateRangePicker from '@/components/common/date-range-picker'
import FilterSection from '@/components/common/filter-section'
import { PageSectionHeader } from '@/components/common/page-section-header'
import Pagination from '@/components/common/pagination'
import Select from '@/components/common/select'
import TableSkeleton from '@/components/common/skeletons/table-skeleton'
import { Icons } from '@/components/icons'
import { ContractsTable } from '@/components/lendings/table'
import { Can } from '@/components/providers/ability'
import { ServerError } from '@/components/server-error'
import useContractLendingList from '@/hooks/lending/useContractLendingList'

interface FormFilter {
  page?: number
  size?: string
  search?: string
  asset_type__name?: string
  status__name?: string
  employee__full_name__ilike?: string
}

export const Route = createFileRoute('/_dashboard/lendings/')({
  validateSearch: (search: Record<string, unknown>): FormFilter => {
    return {
      page: Number(search.page) || undefined,
      size: (search.size as string) || undefined,
      search: (search.search as string) || undefined,
      asset_type__name: (search.asset_type__name as string) || undefined,
      status__name: (search.status__name as string) || undefined,
      employee__full_name__ilike:
        (search.employee__full_name__ilike as string) || undefined,
    }
  },
  component: LendingsPage,
  pendingComponent: TableSkeleton,
  errorComponent: ({ error }) => (
    <ServerError error={error} context="dashboard/lendings/list-route" />
  ),
})

function LendingsPage() {
  const searchParams = useSearch({ from: '/_dashboard/lendings/' })
  const navigate = useNavigate()

  const {
    page,
    data,
    isPending,
    error,
    onPageChange,
    onClearFilters,
    pageSize,
    onPageSizeChange,
    formFilter,
    filterOpened,
    toggleFilter,
    assetTypes,
    onSearch,
  } = useContractLendingList({
    searchParams,
  })

  if (isPending) return <TableSkeleton />
  if (error)
    return <ServerError error={error} context="dashboard/lendings/list-query" />

  return (
    <>
      <Breadcrumbs />
      <PageSectionHeader
        title="Contratos de Comodato"
        actions={
          <Can I="add" a="lending">
            <Button
              variant="filled"
              radius="md"
              onClick={() => navigate({ to: '/lendings/add' })}
            >
              <PackagePlus />
              &nbsp;Novo Contrato
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
            onClear={onClearFilters}
            onSubmit={formFilter.handleSubmit(onSearch)}
            submitting={isPending}
            cols={4}
          >
            <TextInput
              label="Pesquisar"
              {...formFilter.register('search')}
              rightSection={<Icons.search size={20} />}
            />

            <DateRangePicker
              name="period"
              label="Período inicial — Período final"
              maxDate={new Date()}
              valueFormat="DD/MM/YYYY"
            />

            <TextInput
              label="Colaborador"
              {...formFilter.register('employee__full_name__ilike')}
            />

            <Select
              name="asset_type__name"
              label="Tipo do ativo"
              data={assetTypes}
            />

            <Select
              label="Status"
              name="status__name"
              data={[
                'Distrato realizado',
                'Arquivo pendente',
                'Ativo',
                'Arquivo de distrato pendente',
                'Inativo',
                '',
              ]}
            />
          </FilterSection>
        </FormProvider>
        <ContractsTable data={data.items} />
      </ContentSection>
    </>
  )
}
