'use client'

import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { useAbilityGuard } from '@/hooks/useAbilityGuard'
import {
  deletePurchaseProcess,
  fetchPurchaseProcesses,
  type PurchaseProcessFilters,
} from '@/services/api/purchase-process'
import type { PurchaseProcessSummary } from '@/types/PurchaseProcess'

export function usePurchaseProcessList(initialFilters?: PurchaseProcessFilters) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  useAbilityGuard(
    (currentAbility) => {
      if (currentAbility.cannot('view', 'supplier')) {
        notifications.show({
          color: 'red',
          title: 'Acesso Negado',
          message: 'Você não possui permissão para visualizar processos de compras.',
        })
        navigate({ to: '/dashboard' })
      }
    },
    [navigate]
  )

  const [search, setSearch] = useState(initialFilters?.search || '')
  const [status, setStatus] = useState(initialFilters?.status || '')
  const [category, setCategory] = useState(initialFilters?.category || '')
  const [page, setPage] = useState(initialFilters?.page || 1)
  const [pageSize, setPageSize] = useState(initialFilters?.pageSize || 20)

  const {
    data: listData,
    isPending,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      'fetchPurchaseProcesses',
      { search, status, category, page, pageSize },
    ],
    queryFn: fetchPurchaseProcesses,
  })

  const deleteMutation = useMutation({
    mutationFn: deletePurchaseProcess,
    onSuccess: () => {
      notifications.show({
        color: 'green',
        title: 'Processo excluído',
        message: 'O processo de compra foi excluído com sucesso.',
      })
      queryClient.invalidateQueries({ queryKey: ['fetchPurchaseProcesses'] })
      queryClient.invalidateQueries({ queryKey: ['fetchPurchaseProcessMetrics'] })
    },
    onError: () => {
      notifications.show({
        color: 'red',
        title: 'Erro ao excluir',
        message: 'Não foi possível excluir o processo de compra.',
      })
    },
  })

  const handleDelete = (id: string, objeto: string) => {
    modals.openConfirmModal({
      title: 'Excluir Processo de Compra',
      children: `Tem certeza que deseja excluir o processo "${objeto || id}"? Esta ação não pode ser desfeita.`,
      labels: { confirm: 'Excluir', cancel: 'Cancelar' },
      confirmProps: { color: 'red' },
      onConfirm: () => deleteMutation.mutate(id),
    })
  }

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
      'ID',
      'Data',
      'Objeto',
      'Categoria',
      'Solicitante',
      'Comprador Responsável',
      'Fornecedor Recomendado',
      'Valor Total (CTA)',
      'Status',
    ]

    const rows = items.map((r: PurchaseProcessSummary) => [
      r.id,
      r.data ? new Date(r.data).toLocaleDateString('pt-BR') : '—',
      r.objeto || '—',
      r.categoria || '—',
      r.solicitante || '—',
      r.compradorResponsavel || '—',
      r.fornecedorRecomendadoNome || '—',
      r.valorProcesso ?? 0,
      r.status || '—',
    ])

    const csvContent =
      '\uFEFF' +
      [
        header.join(';'),
        ...rows.map((row) =>
          row
            .map((val) => `"${String(val ?? '').replace(/"/g, '""')}"`)
            .join(';')
        ),
      ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute(
      'download',
      `FO-AD-01-processos-compras-${new Date().toISOString().slice(0, 10)}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return {
    search,
    setSearch,
    status,
    setStatus,
    category,
    setCategory,
    page,
    setPage,
    pageSize,
    setPageSize,
    listData,
    isPending,
    error,
    refetch,
    handleDelete,
    exportCsv,
  }
}
