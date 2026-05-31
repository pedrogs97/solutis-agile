'use client'

import { Button, Group, Text, TextInput } from '@mantine/core'
import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { PlusSquare, UploadCloud } from 'lucide-react'
import { FormProvider } from 'react-hook-form'

import { AssetsTable } from '@/components/assets/table'
import { Breadcrumbs } from '@/components/common/breadcrumbs'
import ContentSection from '@/components/common/content-section'
import FilterSection from '@/components/common/filter-section'
import { PageSectionHeader } from '@/components/common/page-section-header'
import Pagination from '@/components/common/pagination'
import TableSkeleton from '@/components/common/skeletons/table-skeleton'
import { Can } from '@/components/providers/ability'
import { ServerError } from '@/components/server-error'
import useAssetList from '@/hooks/asset/useAssetList'

interface FormFilter {
  description__ilike?: string
  register_number__ilike?: string
  serial_number__ilike?: string
  page?: number
  size?: string
}

export const Route = createFileRoute('/_dashboard/assets/')({
  validateSearch: (search: Record<string, unknown>): FormFilter => {
    return {
      description__ilike: (search.description__ilike as string) || undefined,
      register_number__ilike:
        (search.register_number__ilike as string) || undefined,
      serial_number__ilike:
        (search.serial_number__ilike as string) || undefined,
      page: Number(search.page) || undefined,
      size: (search.size as string) || undefined,
    }
  },
  errorComponent: () => <ServerError />,
  pendingComponent: () => <TableSkeleton />,
  component: AssetsPage,
})

function AssetsPage() {
  const searchParams = useSearch({ from: '/_dashboard/assets/' })
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
  } = useAssetList({ searchParams })
  const navigate = useNavigate()

  if (isPending) return <TableSkeleton />
  if (error) return <ServerError />

  return (
    <>
      <Breadcrumbs />
      <PageSectionHeader
        title="Ativos"
        actions={
          <Can I="add" a="asset">
            <Group>
              <Button
                variant="filled"
                radius="md"
                onClick={() => navigate({ to: '/assets/add' })}
              >
                <PlusSquare />
                &nbsp;Novo Ativo
              </Button>
              <Button
                variant="filled"
                radius="md"
                color="yellow"
                onClick={() => navigate({ to: '/assets/import' })}
              >
                <UploadCloud color="var(--mantine-color-text)" />
                &nbsp;
                <Text c="var(--mantine-color-text)" size="sm" fw={'bold'}>
                  Importar Ativos
                </Text>
              </Button>
            </Group>
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
              label="Descrição"
              {...formFilter.register('description__ilike')}
              miw={250}
            />
            <TextInput
              label="Registro Patrimonial (Tombo)"
              {...formFilter.register('register_number__ilike')}
              miw={250}
            />
            <TextInput
              label="Número de Série"
              {...formFilter.register('serial_number__ilike')}
              miw={200}
            />
          </FilterSection>
        </FormProvider>
        <AssetsTable data={data.items} />
      </ContentSection>
    </>
  )
}
