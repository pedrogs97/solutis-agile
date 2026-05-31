'use client'

import { Button, TextInput } from '@mantine/core'
import { createFileRoute, useSearch } from '@tanstack/react-router'
import { Send } from 'lucide-react'
import { FormProvider } from 'react-hook-form'

import { Breadcrumbs } from '@/components/common/breadcrumbs'
import ContentSection from '@/components/common/content-section'
import FilterSection from '@/components/common/filter-section'
import { PageSectionHeader } from '@/components/common/page-section-header'
import Pagination from '@/components/common/pagination'
import Select from '@/components/common/select'
import TableSkeleton from '@/components/common/skeletons/table-skeleton'
import { InventoryTable } from '@/components/inventory/inventory-table'
import { ServerError } from '@/components/server-error'
import { YES_NO_OPTIONS } from '@/constants/selectOptions'
import useInventoryList from '@/hooks/inventory/useInventoryList'
import { type InventoryFilter } from '@/types/Inventory'

export const Route = createFileRoute('/_dashboard/inventory/')({
  validateSearch: (search: Record<string, unknown>): InventoryFilter => {
    return {
      search: (search.search as string) || '',
      year: (search.year as string) || '',
      answered: (search.answered as string) || '',
      hasExtra: (search.hasExtra as string) || '',
      page: Number(search.page) || 1,
      size: (search.size as string) || '',
    }
  },
  errorComponent: () => <ServerError />,
  pendingComponent: () => <TableSkeleton />,
  component: InventoryPage,
})

function InventoryPage() {
  const searchParams = useSearch({ from: '/_dashboard/inventory/' })
  const {
    // data
    data,
    isPending,
    error,

    // pagination (URL-driven)
    page,
    pageSize,
    onPageChange,
    onPageSizeChange,

    // filter form (single source of truth for filters)
    formFilter,
    onSearch,
    onClearFilters,

    // filter drawer
    filterOpened,
    toggleFilter,

    // lookups
    availableYears,

    // actions
    sendEmail,
  } = useInventoryList({ searchParams })

  if (isPending) return <TableSkeleton />
  if (error) return <ServerError />

  return (
    <>
      <Breadcrumbs />
      <PageSectionHeader
        title="Inventário"
        actions={
          <Button
            radius="md"
            variant="filled"
            type="button"
            color="var(--mantine-color-green-6)"
            miw={200}
            mt={3}
            onClick={sendEmail}
          >
            <Send size={15} />
            &nbsp; Liberar formulário
          </Button>
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
              label="Nome ou matrícula do colaborador"
              {...formFilter.register('search')}
            />
            <Select
              label="Ano de referência"
              {...formFilter.register('year')}
              data={availableYears}
              clearable={false}
            />
            <Select
              label="Respondido"
              {...formFilter.register('answered')}
              data={YES_NO_OPTIONS}
            />
            <Select
              {...formFilter.register('hasExtra')}
              label="Extra"
              data={YES_NO_OPTIONS}
            />
          </FilterSection>
        </FormProvider>
        <InventoryTable data={data} />
      </ContentSection>
    </>
  )
}
