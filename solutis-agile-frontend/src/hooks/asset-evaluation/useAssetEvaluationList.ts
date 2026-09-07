'use client'

import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'

import { useAbilityGuard } from '@/hooks/useAbilityGuard'
import usePagination from '@/hooks/usePagination'
import {
  fetchAssetEvaluationMetrics,
  fetchAssetEvaluations,
} from '@/services/api/asset-evaluation'
import type {
  AssetEvaluationFilters,
  AssetTechnicalEvaluation,
} from '@/types/AssetEvaluation'

interface IUseAssetEvaluationListProps {
  searchParams: AssetEvaluationFilters
}

export function useAssetEvaluationList({
  searchParams,
}: Readonly<IUseAssetEvaluationListProps>) {
  const [filterOpened, { toggle: toggleFilter }] = useDisclosure(false)
  const navigate = useNavigate()

  useAbilityGuard(
    (currentAbility) => {
      if (currentAbility.cannot('view', 'asset')) {
        notifications.show({
          color: 'red',
          title: 'Acesso Negado',
          message: 'Você não possui permissão para visualizar avaliações de patrimônio.',
        })
        navigate({ to: '/dashboard' })
      }
    },
    [navigate]
  )

  const formFilter = useForm<AssetEvaluationFilters>({
    defaultValues: {
      search: searchParams?.search || '',
      status: searchParams?.status || '',
      date_start: searchParams?.date_start || '',
      date_end: searchParams?.date_end || '',
      page: searchParams?.page,
      size: searchParams?.size,
    },
  })

  const {
    page,
    onPageChange,
    onSearch,
    filters,
    onClearFilters,
    pageSize,
    onPageSizeChange,
  } = usePagination({
    searchParams,
    formFilter,
    invalidateQueryKey: 'fetchAssetEvaluations',
  })

  const {
    isPending,
    error,
    data: listData,
    refetch: refetchList,
  } = useQuery({
    queryKey: [
      'fetchAssetEvaluations',
      {
        ...filters,
        page,
        size: pageSize,
      },
    ],
    queryFn: fetchAssetEvaluations,
  })

  const { data: metricsData, isPending: isPendingMetrics } = useQuery({
    queryKey: ['fetchAssetEvaluationMetrics'],
    queryFn: fetchAssetEvaluationMetrics,
  })

  const exportCsv = () => {
    const items = listData?.items || []
    if (!items.length) {
      notifications.show({
        color: 'yellow',
        message: 'Nenhum registro encontrado para exportar.',
      })
      return
    }

    const header = [
      'Protocolo',
      'Data',
      'Ativo',
      'Patrimônio',
      'Status',
      'Classificação',
      'Viabilidade',
      'Destino',
      'Peso Bruto (kg)',
      'Peso Reaproveitado (kg)',
      'Peso Descartado (kg)',
      'Peso Reciclagem (kg)',
      'Taxa ESG (%)',
      'Economia Estimada (R$)',
    ]

    const rows = items.map((r: AssetTechnicalEvaluation) => [
      r.protocol,
      new Date(r.created_at || r.evaluation_date).toLocaleDateString('pt-BR'),
      r.brand_model || r.asset_type_name || '—',
      r.patrimonio || '—',
      r.status,
      r.classification || '—',
      r.feasibility || '—',
      (r.destination || []).join(' | '),
      r.gross_weight ?? 0,
      r.reused_weight ?? 0,
      r.discarded_weight ?? 0,
      r.recycle_weight ?? 0,
      r.reuse_percentage ?? 0,
      r.estimated_economy ?? 0,
    ])

    const csvContent =
      '\uFEFF' +
      [
        header.join(';'),
        ...rows.map((row: (string | number)[]) =>
          row
            .map((val: string | number) => `"${String(val ?? '').replace(/"/g, '""')}"`)
            .join(';')
        ),
      ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `FO-PAT-02-avaliacoes-${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return {
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
    refetchList,
    exportCsv,
  }
}
