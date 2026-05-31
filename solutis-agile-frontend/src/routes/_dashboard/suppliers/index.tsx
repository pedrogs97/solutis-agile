'use client'

import { Button, TextInput } from '@mantine/core'
import { createFileRoute, Link, useSearch } from '@tanstack/react-router'
import { PackagePlus } from 'lucide-react'
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
import { SuppliersTable } from '@/components/suppliers/table'
import useSupplier from '@/hooks/supplier/useSupplier'

export const Route = createFileRoute('/_dashboard/suppliers/')({
  validateSearch: (search: Record<string, unknown>): FormFilter => {
    return {
      name: (search.name as string) || '',
      cnpj: (search.cnpj as string) || '',
      status: (search.status as string) || '',
      risk: (search.risk as string) || '',
      page: Number(search.page) || 1,
    }
  },
  errorComponent: () => <ServerError />,
  pendingComponent: () => <TableSkeleton />,
  component: SuppliersPage,
})

interface FormFilter {
  name?: string
  cnpj?: string
  status?: string
  risk?: string
  page?: number
}

function SuppliersPage() {
  const searchParams = useSearch({ from: '/_dashboard/suppliers/' })
  const {
    page,
    data,
    isPending,
    error,
    onPageChange,
    pageSize,
    onPageSizeChange,
    filterOpened,
    toggleFilter,
    formFilter,
    onSearch,
    onClearFilters,
  } = useSupplier({ searchParams })

  if (isPending) return <TableSkeleton />
  if (error) return <ServerError />

  return (
    <>
      <Breadcrumbs />
      <PageSectionHeader
        title="Fornecedores"
        actions={
          <Can I="add" a="supplier">
            <Button
              variant="filled"
              radius="md"
              component={Link}
              href="/suppliers/add"
            >
              <PackagePlus />
              &nbsp;Novo Fornecedor
            </Button>
          </Can>
        }
      />
      <ContentSection
        footer={
          <Pagination
            value={page}
            onChange={onPageChange}
            total={data ? Math.ceil(data.count / Number(pageSize)) : 0}
            totalOfItems={data ? data.count : 0}
            pageSize={pageSize}
            onPageSizeChange={onPageSizeChange}
            disabled={isPending || (data ? data.count === 0 : true)}
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
              label="Nome do fornecedor"
              {...formFilter.register('name')}
              miw={200}
              rightSection={<Icons.search size={20} />}
            />
            <TextInput label="CPF/CNPJ" {...formFilter.register('cnpj')} />
            <Select
              name="status"
              label="Status"
              data={[
                { value: '', label: 'Todos' },
                { value: 'ATIVO', label: 'Ativo' },
                { value: 'INATIVO', label: 'Inativo' },
                { value: 'BLOQUEADO', label: 'Bloqueado' },
                { value: 'PENDENTE', label: 'Pendente' },
              ]}
            />
            <Select
              name="risk"
              label="Grau de risco"
              data={[
                { value: '', label: 'Todos' },
                { value: '3', label: 'Alto' },
                { value: '2', label: 'Médio' },
                { value: '1', label: 'Baixo' },
              ]}
            />
          </FilterSection>
        </FormProvider>
        <SuppliersTable data={data} />
      </ContentSection>
    </>
  )
}
