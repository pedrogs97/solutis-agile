'use client'

import { notifications } from '@mantine/notifications'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'

import { fetchAssetsSelect } from '@/services/api/asset'
import {
  approveAssetEvaluation,
  createAssetEvaluation,
  fetchAssetEvaluation,
  fetchCatalogComponents,
  updateAssetEvaluation,
  uploadEvaluationAttachment,
} from '@/services/api/asset-evaluation'
import type {
  AssetEvaluationComponent,
  AssetEvaluationFormValues,
  AssetTechnicalEvaluation,
} from '@/types/AssetEvaluation'

const DRAFT_KEY = 'solutis_fo_pat_02_draft_v1'

const DEFAULT_FORM_VALUES: AssetEvaluationFormValues = {
  asset_id: null,
  patrimonio: '',
  asset_type_name: '',
  brand_model: '',
  serial_number: '',
  cost_center: '',
  unity: '',
  status: 'Rascunho',
  classification: 'Bom',
  feasibility: 'Alta',
  destination: ['Reaproveitamento interno'],
  gross_weight: 0,
  reused_weight: 0,
  discarded_weight: 0,
  recycle_weight: 0,
  reuse_percentage: 0,
  acquisition_value: 0,
  net_book_value: 0,
  estimated_economy: 0,
  justification: '',
  technical_opinion: '',
  components: [
    {
      name: 'Memória RAM',
      quantity: 1,
      condition: 'Boa',
      destination: 'Reaproveitamento interno',
      observations: '',
    },
  ],
  new_components_for_catalog: [],
}

interface IUseAssetEvaluationFormProps {
  evaluationId?: string | number | null
}

export function useAssetEvaluationForm({
  evaluationId,
}: IUseAssetEvaluationFormProps = {}) {
  const isEdit = Boolean(evaluationId)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [draftRestored, setDraftRestored] = useState(false)
  const [pendingUploads, setPendingUploads] = useState<{ file: File; checklistKey?: string }[]>([])

  // Load existing data if editing
  const { data: existingEvaluation, isPending: isPendingFetch } = useQuery({
    queryKey: ['fetchAssetEvaluation', evaluationId],
    queryFn: fetchAssetEvaluation,
    enabled: isEdit,
  })

  // Load shared catalog components
  const { data: catalogComponents } = useQuery({
    queryKey: ['fetchCatalogComponents'],
    queryFn: fetchCatalogComponents,
  })

  // Load assets for autocomplete select
  const { data: assetOptions } = useQuery({
    queryKey: ['fetchAssetsSelect', ''],
    queryFn: fetchAssetsSelect,
  })

  const form = useForm<AssetEvaluationFormValues>({
    defaultValues: DEFAULT_FORM_VALUES,
  })

  const { control, setValue, getValues, reset } = form

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'components',
  })

  // Watch critical fields for real-time calculations
  const grossWeight = useWatch({ control, name: 'gross_weight' }) || 0
  const reusedWeight = useWatch({ control, name: 'reused_weight' }) || 0
  const netBookValue = useWatch({ control, name: 'net_book_value' }) || 0
  const watchedClassification = useWatch({ control, name: 'classification' })
  const watchedFeasibility = useWatch({ control, name: 'feasibility' })
  const watchedDestination = useWatch({ control, name: 'destination' }) || []
  const watchedStatus = useWatch({ control, name: 'status' })

  // Real-time calculated metrics
  const calculatedReusePercentage = useMemo(() => {
    const gross = Number(grossWeight) || 0
    const reused = Number(reusedWeight) || 0
    if (gross <= 0) return 0
    return Math.min(100, Math.max(0, parseFloat(((reused / gross) * 100).toFixed(1))))
  }, [grossWeight, reusedWeight])

  const calculatedEstimatedEconomy = useMemo(() => {
    const net = Number(netBookValue) || 0
    return parseFloat(((net * (calculatedReusePercentage / 100))).toFixed(2))
  }, [netBookValue, calculatedReusePercentage])

  // Synchronize computed values into form state
  useEffect(() => {
    setValue('reuse_percentage', calculatedReusePercentage)
    setValue('estimated_economy', calculatedEstimatedEconomy)
  }, [calculatedReusePercentage, calculatedEstimatedEconomy, setValue])

  // Populate form with existing data when editing
  useEffect(() => {
    if (existingEvaluation) {
      reset({
        asset_id: existingEvaluation.asset_id,
        patrimonio: existingEvaluation.patrimonio || '',
        asset_type_name: existingEvaluation.asset_type_name || '',
        brand_model: existingEvaluation.brand_model || '',
        serial_number: existingEvaluation.serial_number || '',
        cost_center: existingEvaluation.cost_center || '',
        unity: existingEvaluation.unity || '',
        status: existingEvaluation.status || 'Rascunho',
        classification: existingEvaluation.classification || 'Bom',
        feasibility: existingEvaluation.feasibility || 'Alta',
        destination: existingEvaluation.destination || ['Reaproveitamento interno'],
        gross_weight: existingEvaluation.gross_weight ?? 0,
        reused_weight: existingEvaluation.reused_weight ?? 0,
        discarded_weight: existingEvaluation.discarded_weight ?? 0,
        recycle_weight: existingEvaluation.recycle_weight ?? 0,
        reuse_percentage: existingEvaluation.reuse_percentage ?? 0,
        acquisition_value: existingEvaluation.acquisition_value ?? 0,
        net_book_value: existingEvaluation.net_book_value ?? 0,
        estimated_economy: existingEvaluation.estimated_economy ?? 0,
        justification: existingEvaluation.justification || '',
        technical_opinion: existingEvaluation.technical_opinion || '',
        components: existingEvaluation.components?.length
          ? existingEvaluation.components
          : DEFAULT_FORM_VALUES.components,
      })
    } else if (!isEdit) {
      // Check draft in localStorage
      try {
        const raw = localStorage.getItem(DRAFT_KEY)
        if (raw) {
          const draft = JSON.parse(raw)
          reset(draft)
          setDraftRestored(true)
        }
      } catch (e) {}
    }
  }, [existingEvaluation, isEdit, reset])

  // Autosave draft when creating
  const saveDraft = useCallback(() => {
    if (!isEdit) {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(getValues()))
      } catch (e) {}
    }
  }, [isEdit, getValues])

  const discardDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY)
    } catch (e) {}
    reset(DEFAULT_FORM_VALUES)
    setDraftRestored(false)
    notifications.show({
      color: 'blue',
      message: 'Rascunho descartado com sucesso.',
    })
  }

  // Mutations
  const createMutation = useMutation({
    mutationFn: createAssetEvaluation,
    onSuccess: async (created: AssetTechnicalEvaluation) => {
      try {
        localStorage.removeItem(DRAFT_KEY)
      } catch (e) {}

      // Upload pending files if any
      if (pendingUploads.length > 0) {
        for (const item of pendingUploads) {
          try {
            await uploadEvaluationAttachment(created.id, item.file, item.checklistKey)
          } catch (e) {
            console.error('Error uploading attachment', e)
          }
        }
      }

      notifications.show({
        color: 'green',
        title: 'Avaliação Registrada',
        message: `Avaliação ${created.protocol} criada com sucesso!`,
      })
      queryClient.invalidateQueries({ queryKey: ['fetchAssetEvaluations'] })
      queryClient.invalidateQueries({ queryKey: ['fetchAssetEvaluationMetrics'] })
      navigate({ to: '/asset-evaluations' })
    },
    onError: () => {
      notifications.show({
        color: 'red',
        title: 'Erro ao Salvar',
        message: 'Ocorreu um erro ao salvar a avaliação. Verifique os dados e tente novamente.',
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (values: AssetEvaluationFormValues) =>
      updateAssetEvaluation(evaluationId!, values),
    onSuccess: async (updated: AssetTechnicalEvaluation) => {
      notifications.show({
        color: 'green',
        title: 'Avaliação Atualizada',
        message: `Avaliação ${updated.protocol} atualizada com sucesso!`,
      })
      queryClient.invalidateQueries({ queryKey: ['fetchAssetEvaluation', evaluationId] })
      queryClient.invalidateQueries({ queryKey: ['fetchAssetEvaluations'] })
      queryClient.invalidateQueries({ queryKey: ['fetchAssetEvaluationMetrics'] })
      navigate({ to: '/asset-evaluations' })
    },
    onError: () => {
      notifications.show({
        color: 'red',
        title: 'Erro ao Atualizar',
        message: 'Ocorreu um erro ao atualizar a avaliação.',
      })
    },
  })

  const approveMutation = useMutation({
    mutationFn: (data: { comments?: string; write_off_asset: boolean }) =>
      approveAssetEvaluation(evaluationId!, data),
    onSuccess: (approved: AssetTechnicalEvaluation) => {
      notifications.show({
        color: 'green',
        title: 'Avaliação Aprovada',
        message: `A avaliação ${approved.protocol} foi aprovada e o ativo baixado para descarte!`,
      })
      queryClient.invalidateQueries({ queryKey: ['fetchAssetEvaluation', evaluationId] })
      queryClient.invalidateQueries({ queryKey: ['fetchAssetEvaluations'] })
      queryClient.invalidateQueries({ queryKey: ['fetchAssetEvaluationMetrics'] })
      navigate({ to: '/asset-evaluations' })
    },
    onError: () => {
      notifications.show({
        color: 'red',
        title: 'Erro na Aprovação',
        message: 'Não foi possível aprovar a avaliação técnica.',
      })
    },
  })

  const onSubmit = (values: AssetEvaluationFormValues) => {
    // Detect custom new components not in catalog
    const existingNames = new Set((catalogComponents || []).map((c: { name: string }) => c.name.toLowerCase()))
    const newComponents: string[] = []
    values.components.forEach((comp) => {
      const clean = comp.name.trim()
      if (clean && !existingNames.has(clean.toLowerCase())) {
        newComponents.push(clean)
        existingNames.add(clean.toLowerCase())
      }
    })
    values.new_components_for_catalog = newComponents

    if (isEdit) {
      updateMutation.mutate(values)
    } else {
      createMutation.mutate(values)
    }
  }

  const addComponentRow = (item?: Partial<AssetEvaluationComponent>) => {
    append({
      name: item?.name || '',
      quantity: item?.quantity ?? 1,
      condition: item?.condition || 'Boa',
      destination: item?.destination || 'Reaproveitamento interno',
      observations: item?.observations || '',
    })
    saveDraft()
  }

  const removeComponentRow = (index: number) => {
    remove(index)
    saveDraft()
  }

  const addPendingUpload = (file: File, checklistKey?: string) => {
    setPendingUploads((prev: { file: File; checklistKey?: string }[]) => [
      ...prev,
      { file, checklistKey },
    ])
  }

  const removePendingUpload = (index: number) => {
    setPendingUploads((prev: { file: File; checklistKey?: string }[]) =>
      prev.filter((_: { file: File; checklistKey?: string }, i: number) => i !== index)
    )
  }

  return {
    form,
    isEdit,
    isPendingFetch,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
    isApproving: approveMutation.isPending,
    existingEvaluation,
    catalogComponents: catalogComponents || [],
    assetOptions: assetOptions || [],
    componentFields: fields,
    addComponentRow,
    removeComponentRow,
    calculatedReusePercentage,
    calculatedEstimatedEconomy,
    watchedClassification,
    watchedFeasibility,
    watchedDestination,
    watchedStatus,
    draftRestored,
    discardDraft,
    saveDraft,
    onSubmit: form.handleSubmit(onSubmit),
    onApprove: (comments?: string, writeOff: boolean = true) =>
      approveMutation.mutate({ comments, write_off_asset: writeOff }),
    pendingUploads,
    addPendingUpload,
    removePendingUpload,
  }
}
