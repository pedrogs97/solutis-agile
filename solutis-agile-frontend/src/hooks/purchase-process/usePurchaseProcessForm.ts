'use client'

import { notifications } from '@mantine/notifications'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useAbilityGuard } from '@/hooks/useAbilityGuard'
import {
  createPurchaseProcess,
  decidePurchaseProcess,
  fetchPurchaseProcess,
  updatePurchaseProcess,
} from '@/services/api/purchase-process'
import type {
  PurchaseItem,
  PurchaseProcess,
  PurchaseSupplier,
} from '@/types/PurchaseProcess'

export function uid(prefix: string): string {
  return (
    prefix +
    '_' +
    Math.random().toString(36).slice(2, 10) +
    Date.now().toString(36).slice(-4)
  )
}

export function createNewSupplier(id?: string): PurchaseSupplier {
  return {
    id: id || uid('f'),
    nome: '',
    cnpj: '',
    desconto: 0,
    impostos: 0,
    frete: 0,
    outros: 0,
    valorBrutoManual: null,
    orcado: null,
    condPagamento: '',
    prazoEntrega: '',
    validadeProposta: '',
    garantia: '',
    obs: '',
  }
}

export function createNewProcess(): PurchaseProcess {
  const f1 = uid('f')
  const f2 = uid('f')
  return {
    id: '',
    schemaVersion: 1,
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
    identificacao: {
      data: new Date().toISOString().slice(0, 10),
      categoria: 'Normal',
      modalidade: 'Produto',
      centroCusto: '',
      objeto: '',
      tipoContratacao: 'Compra nova',
      risco: 'Baixo',
      solicitante: '',
      compradorResponsavel: '',
    },
    fornecedores: [createNewSupplier(f1), createNewSupplier(f2)],
    itens: [
      { id: uid('it'), descricao: '', qtd: 1, unidade: 'UN', precos: {} },
      { id: uid('it'), descricao: '', qtd: 1, unidade: 'UN', precos: {} },
    ],
    decisao: {
      fornecedorRecomendadoId: '',
      minimoAtingido: 'sim',
      motivoKey: '',
      justificativa: '',
      recomendacao: '',
      observacoes: '',
    },
    aprovacao: {
      status: 'Pendente',
      aprovadoPor: '',
      dataDecisao: '',
      comentario: '',
    },
    avaliacao: {
      preenchida: false,
      razaoSocial: '',
      cnpj: '',
      descritivoCompra: '',
      nfNumero: '',
      dataCompra: '',
      criterios: {},
      avaliador: '',
      dataAvaliacao: '',
    },
  }
}

export function usePurchaseProcessForm(id?: string) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  useAbilityGuard(
    (currentAbility) => {
      if (currentAbility.cannot('view', 'supplier')) {
        notifications.show({
          color: 'red',
          title: 'Acesso Negado',
          message: 'Você não possui permissão para acessar processos de compras.',
        })
        navigate({ to: '/dashboard' })
      }
    },
    [navigate]
  )

  const [process, setProcess] = useState<PurchaseProcess>(createNewProcess)
  const [activeTab, setActiveTab] = useState<string>('ident')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const isDirtyRef = useRef(false)

  const isEditing = Boolean(id && id !== 'new')

  const {
    data: fetchedData,
    isPending: isLoadingProcess,
    error,
  } = useQuery({
    queryKey: ['fetchPurchaseProcess', id],
    queryFn: fetchPurchaseProcess,
    enabled: isEditing,
  })

  useEffect(() => {
    if (fetchedData) {
      const fresh = createNewProcess()
      setProcess({
        ...fetchedData,
        identificacao: { ...fresh.identificacao, ...(fetchedData.identificacao || {}) },
        decisao: { ...fresh.decisao, ...(fetchedData.decisao || {}) },
        aprovacao: { ...fresh.aprovacao, ...(fetchedData.aprovacao || {}) },
        avaliacao: { ...fresh.avaliacao, ...(fetchedData.avaliacao || {}) },
        fornecedores: (fetchedData.fornecedores && fetchedData.fornecedores.length
          ? fetchedData.fornecedores
          : fresh.fornecedores
        ).map((f) => ({ ...createNewSupplier(f.id), ...f })),
        itens:
          fetchedData.itens && fetchedData.itens.length
            ? fetchedData.itens
            : fresh.itens,
      })
    }
  }, [fetchedData])

  const saveMutation = useMutation({
    mutationFn: async (payload: Partial<PurchaseProcess>) => {
      if (isEditing && id) {
        return updatePurchaseProcess(id, payload)
      } else {
        return createPurchaseProcess(payload)
      }
    },
    onSuccess: (data) => {
      setSaveStatus('saved')
      queryClient.invalidateQueries({ queryKey: ['fetchPurchaseProcesses'] })
      queryClient.invalidateQueries({ queryKey: ['fetchPurchaseProcessMetrics'] })
      if (!isEditing && data.id) {
        notifications.show({
          color: 'green',
          title: 'Processo Criado',
          message: 'O processo de compra FO-AD-01 foi criado com sucesso.',
        })
        navigate({ to: `/purchase-processes/${data.id}` as any })
      } else {
        notifications.show({
          color: 'green',
          title: 'Alterações Salvas',
          message: 'O processo foi salvo com sucesso.',
        })
      }
    },
    onError: () => {
      setSaveStatus('idle')
      notifications.show({
        color: 'red',
        title: 'Erro ao Salvar',
        message: 'Ocorreu um erro ao salvar o processo de compra.',
      })
    },
  })

  const decisionMutation = useMutation({
    mutationFn: async (decisionPayload: {
      status: string
      aprovadoPor?: string
      comentario?: string
    }) => {
      if (!id) return null
      return decidePurchaseProcess(id, decisionPayload)
    },
    onSuccess: (data) => {
      if (data) {
        setProcess(data)
        queryClient.invalidateQueries({ queryKey: ['fetchPurchaseProcess', id] })
        queryClient.invalidateQueries({ queryKey: ['fetchPurchaseProcesses'] })
        queryClient.invalidateQueries({ queryKey: ['fetchPurchaseProcessMetrics'] })
        notifications.show({
          color: 'green',
          title: 'Decisão Registrada',
          message: `O status do processo foi alterado para "${data.aprovacao?.status}".`,
        })
      }
    },
    onError: () => {
      notifications.show({
        color: 'red',
        title: 'Erro na Decisão',
        message: 'Não foi possível registrar a decisão de aprovação.',
      })
    },
  })

  const handleSave = useCallback(() => {
    setSaveStatus('saving')
    saveMutation.mutate(process)
  }, [process, saveMutation])

  // Updaters
  const updateIdentification = useCallback(
    (field: keyof PurchaseProcess['identificacao'], value: any) => {
      isDirtyRef.current = true
      setProcess((prev) => ({
        ...prev,
        identificacao: { ...prev.identificacao, [field]: value },
      }))
    },
    []
  )

  const updateDecision = useCallback(
    (field: keyof PurchaseProcess['decisao'], value: any) => {
      isDirtyRef.current = true
      setProcess((prev) => ({
        ...prev,
        decisao: { ...prev.decisao, [field]: value },
      }))
    },
    []
  )

  const updateApproval = useCallback(
    (field: keyof PurchaseProcess['aprovacao'], value: any) => {
      isDirtyRef.current = true
      setProcess((prev) => ({
        ...prev,
        aprovacao: { ...prev.aprovacao, [field]: value },
      }))
    },
    []
  )

  const updateEvaluation = useCallback(
    (field: keyof PurchaseProcess['avaliacao'], value: any) => {
      isDirtyRef.current = true
      setProcess((prev) => ({
        ...prev,
        avaliacao: { ...prev.avaliacao, [field]: value },
      }))
    },
    []
  )

  const updateEvaluationCriterion = useCallback(
    (critKey: string, field: 'status' | 'nivel' | 'obs', value: any) => {
      isDirtyRef.current = true
      setProcess((prev) => {
        const curCrit = prev.avaliacao.criterios[critKey] || {}
        return {
          ...prev,
          avaliacao: {
            ...prev.avaliacao,
            criterios: {
              ...prev.avaliacao.criterios,
              [critKey]: { ...curCrit, [field]: value },
            },
          },
        }
      })
    },
    []
  )

  const updateSupplier = useCallback(
    (supplierId: string, field: keyof PurchaseSupplier, value: any) => {
      isDirtyRef.current = true
      setProcess((prev) => ({
        ...prev,
        fornecedores: prev.fornecedores.map((f) =>
          f.id === supplierId ? { ...f, [field]: value } : f
        ),
      }))
    },
    []
  )

  const addSupplier = useCallback(() => {
    if (process.fornecedores.length >= 5) {
      notifications.show({
        color: 'yellow',
        message: 'Limite máximo de 5 fornecedores para o mapa comparativo atingido.',
      })
      return
    }
    isDirtyRef.current = true
    setProcess((prev) => ({
      ...prev,
      fornecedores: [...prev.fornecedores, createNewSupplier()],
    }))
  }, [process.fornecedores.length])

  const removeSupplier = useCallback((supplierId: string) => {
    isDirtyRef.current = true
    setProcess((prev) => {
      const remaining = prev.fornecedores.filter((f) => f.id !== supplierId)
      const updatedItens = prev.itens.map((it) => {
        const prices = { ...(it.precos || {}) }
        delete prices[supplierId]
        return { ...it, precos: prices }
      })
      const recId =
        prev.decisao.fornecedorRecomendadoId === supplierId
          ? ''
          : prev.decisao.fornecedorRecomendadoId
      return {
        ...prev,
        fornecedores: remaining,
        itens: updatedItens,
        decisao: { ...prev.decisao, fornecedorRecomendadoId: recId },
      }
    })
  }, [])

  const updateItem = useCallback(
    (itemId: string, field: keyof PurchaseItem, value: any) => {
      isDirtyRef.current = true
      setProcess((prev) => ({
        ...prev,
        itens: prev.itens.map((it) =>
          it.id === itemId ? { ...it, [field]: value } : it
        ),
      }))
    },
    []
  )

  const updateItemPrice = useCallback(
    (itemId: string, supplierId: string, value: number | null) => {
      isDirtyRef.current = true
      setProcess((prev) => ({
        ...prev,
        itens: prev.itens.map((it) =>
          it.id === itemId
            ? {
                ...it,
                precos: {
                  ...(it.precos || {}),
                  [supplierId]: value,
                },
              }
            : it
        ),
      }))
    },
    []
  )

  const addItem = useCallback(() => {
    isDirtyRef.current = true
    setProcess((prev) => ({
      ...prev,
      itens: [
        ...prev.itens,
        { id: uid('it'), descricao: '', qtd: 1, unidade: 'UN', precos: {} },
      ],
    }))
  }, [])

  const removeItem = useCallback((itemId: string) => {
    isDirtyRef.current = true
    setProcess((prev) => ({
      ...prev,
      itens: prev.itens.filter((it) => it.id !== itemId),
    }))
  }, [])

  // Completion flags
  const isIdentDone = Boolean(
    process.identificacao.objeto &&
      process.identificacao.categoria &&
      process.identificacao.solicitante &&
      process.identificacao.compradorResponsavel
  )
  const isQuoteDone =
    process.fornecedores.filter((f) => f.nome.trim() !== '').length >= 2
  const isDecisionDone = Boolean(process.decisao.recomendacao)
  const isEvalDone = Boolean(process.avaliacao.preenchida)

  return {
    process,
    setProcess,
    activeTab,
    setActiveTab,
    isEditing,
    isLoadingProcess,
    error,
    saveStatus,
    isSaving: saveMutation.isPending,
    isDeciding: decisionMutation.isPending,
    handleSave,
    handleDecide: (decisionPayload: {
      status: string
      aprovadoPor?: string
      comentario?: string
    }) => decisionMutation.mutate(decisionPayload),
    updateIdentification,
    updateDecision,
    updateApproval,
    updateEvaluation,
    updateEvaluationCriterion,
    updateSupplier,
    addSupplier,
    removeSupplier,
    updateItem,
    updateItemPrice,
    addItem,
    removeItem,
    isIdentDone,
    isQuoteDone,
    isDecisionDone,
    isEvalDone,
  }
}
