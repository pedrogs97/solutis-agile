'use client'

import {
  Button,
  Group,
  Select,
  Tabs,
  Text,
  TextInput,
} from '@mantine/core'
import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import {
  BarChart3,
  Download,
  List,
  PlusSquare,
} from 'lucide-react'
import { useState } from 'react'
import { FormProvider } from 'react-hook-form'

import { EvaluationsTable } from '@/components/asset-evaluations/evaluations-table'
import { ExecutiveDashboard } from '@/components/asset-evaluations/executive-dashboard'
import { Breadcrumbs } from '@/components/common/breadcrumbs'
import ContentSection from '@/components/common/content-section'
import FilterSection from '@/components/common/filter-section'
import { PageSectionHeader } from '@/components/common/page-section-header'
import Pagination from '@/components/common/pagination'
import TableSkeleton from '@/components/common/skeletons/table-skeleton'
import { Can } from '@/components/providers/ability'
import { ServerError } from '@/components/server-error'
import { useAssetEvaluationList } from '@/hooks/asset-evaluation/useAssetEvaluationList'
import type { AssetEvaluationFilters } from '@/types/AssetEvaluation'

const STATUS_OPTIONS = [
  { value: 'Rascunho', label: 'Rascunho' },
  { value: 'Em avaliação', label: 'Em avaliação' },
  { value: 'Aguardando aprovação', label: 'Aguardando aprovação' },
  { value: 'Aprovado', label: 'Aprovado' },
  { value: 'Baixado', label: 'Baixado' },
]

export const Route = createFileRoute('/_dashboard/asset-evaluations/')({
  validateSearch: (search: Record<string, unknown>): AssetEvaluationFilters => {
    return {
      search: (search.search as string) || undefined,
      status: (search.status as string) || undefined,
      date_start: (search.date_start as string) || undefined,
      date_end: (search.date_end as string) || undefined,
      page: Number(search.page) || 1,
      size: (search.size as string) || '20',
    }
  },
  errorComponent: () => <ServerError />,
  pendingComponent: () => <TableSkeleton />,
  component: AssetEvaluationsPage,
})

function AssetEvaluationsPage() {
  const searchParams = useSearch({ from: '/_dashboard/asset-evaluations/' })
  const [activeTab, setActiveTab] = useState<string | null>('dashboard')
  const navigate = useNavigate()

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
    listData,
    metricsData,
    isPendingMetrics,
    exportCsv,
  } = useAssetEvaluationList({ searchParams })

  if (isPending && !listData) return <TableSkeleton />
  if (error) return <ServerError />

  return (
    <>
      <Breadcrumbs />
      <PageSectionHeader
        title="Avaliações Técnicas & Descarte (FO-PAT-02)"
        actions={
          <Group>
            <Button
              variant="outline"
              color="gray"
              leftSection={<Download size={16} />}
              onClick={exportCsv}
            >
              Exportar CSV
            </Button>

            <Can I="add" a="asset">
              <Button
                variant="filled"
                radius="md"
                color="blue"
                leftSection={<PlusSquare size={16} />}
                onClick={() => navigate({ to: '/asset-evaluations/new' })}
              >
                Nova Avaliação FO-PAT-02
              </Button>
            </Can>
          </Group>
        }
      />

      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        variant="outline"
        radius="md"
        mb="md"
      >
        <Tabs.List>
          <Tabs.Tab
            value="dashboard"
            leftSection={<BarChart3 size={16} />}
          >
            <Text fw={600} size="sm">
              Painel Executivo ESG
            </Text>
          </Tabs.Tab>
          <Tabs.Tab
            value="history"
            leftSection={<List size={16} />}
          >
            <Text fw={600} size="sm">
              Histórico de Avaliações ({listData?.total ?? 0})
            </Text>
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="dashboard" pt="md">
          <ExecutiveDashboard
            metrics={metricsData}
            isLoading={isPendingMetrics}
          />
        </Tabs.Panel>

        <Tabs.Panel value="history" pt="md">
          <ContentSection
            footer={
              <Pagination
                pageSize={pageSize}
                onPageSizeChange={onPageSizeChange}
                value={page}
                onChange={onPageChange}
                totalOfItems={listData?.total || 0}
                total={listData?.pages || 1}
                disabled={isPending || !listData?.items.length}
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
                cols={3}
              >
                <TextInput
                  label="Buscar por Protocolo, Tombo ou Modelo"
                  placeholder="Ex.: FO-PAT-02, 123456, Dell..."
                  {...formFilter.register('search')}
                  miw={280}
                />

                <Select
                  label="Status do Processo"
                  placeholder="Todos os status"
                  data={STATUS_OPTIONS}
                  clearable
                  value={formFilter.watch('status') || null}
                  onChange={(val) => formFilter.setValue('status', val || '')}
                  miw={200}
                />
              </FilterSection>
            </FormProvider>

            <EvaluationsTable
              data={listData?.items || []}
              onApprove={(id) => navigate({ to: `/asset-evaluations/${id}` })}
            />
          </ContentSection>
        </Tabs.Panel>
      </Tabs>
    </>
  )
}
