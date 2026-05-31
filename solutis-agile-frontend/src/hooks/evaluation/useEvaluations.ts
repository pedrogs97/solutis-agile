import { notifications } from '@mantine/notifications'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'

import { normalizeApiErrors } from '@/lib/api-errors'
import api from '@/lib/axios'
import type {
  CreateSupplierEvaluationPayload,
  EvaluationCriterion,
  SupplierEvaluation,
  SupplierEvaluationDetail,
} from '@/types/evaluation'

export const evaluationKeys = {
  all: ['evaluations'] as const,
  lists: () => [...evaluationKeys.all, 'list'] as const,
  list: (filters: string) => [...evaluationKeys.lists(), { filters }] as const,
  details: () => [...evaluationKeys.all, 'detail'] as const,
  detail: (id: number | string) => [...evaluationKeys.details(), id] as const,
  criteria: () => [...evaluationKeys.all, 'criteria'] as const,
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

const DUPLICATE_PERIOD_MESSAGE =
  'Já existe uma avaliação para este fornecedor no período selecionado.'
const MIXED_PERIOD_TYPE_MESSAGE =
  'Já existe uma avaliação neste ano para o fornecedor com outro tipo de período.'
const GENERIC_CREATE_ERROR_MESSAGE = 'Ocorreu um erro ao adicionar a avaliação.'

export function useEvaluationCriteria(enabled = true) {
  return useQuery({
    queryKey: evaluationKeys.criteria(),
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<EvaluationCriterion>>(
        '/proxy/procurement/v1/evaluation/criteria-list/',
      )
      return response.data.results
    },
    enabled,
  })
}

export function useSupplierEvaluations(
  supplierId?: number,
  page = 1,
  pageSize = 12,
  filters?: {
    startPeriod?: string | null
    endPeriod?: string | null
  },
) {
  return useQuery({
    queryKey: [
      ...evaluationKeys.list(String(supplierId)),
      { page, pageSize, filters },
    ],
    queryFn: async () => {
      const params = {
        ...(supplierId ? { supplier: supplierId } : {}),
        ...(filters?.startPeriod ? { startPeriod: filters.startPeriod } : {}),
        ...(filters?.endPeriod ? { endPeriod: filters.endPeriod } : {}),
        page,
        size: pageSize,
      }
      const response = await api.get<PaginatedResponse<SupplierEvaluation>>(
        '/proxy/procurement/v1/evaluation/evaluations-list/',
        { params },
      )
      return response.data
    },
    enabled: !!supplierId,
  })
}

export function useSupplierEvaluationDetail(id?: number) {
  return useQuery({
    queryKey: evaluationKeys.detail(id!),
    queryFn: async () => {
      const response = await api.get<SupplierEvaluationDetail>(
        `/proxy/procurement/v1/evaluation/evaluations/${id}/`,
      )
      return response.data
    },
    enabled: !!id,
  })
}

export function useCreateSupplierEvaluation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateSupplierEvaluationPayload) => {
      const response = await api.post(
        '/proxy/procurement/v1/evaluation/evaluations/',
        data,
      )
      return response.data
    },
    onSuccess: (_, variables) => {
      notifications.show({
        title: 'Sucesso',
        message: 'Avaliação de desempenho adicionada com sucesso!',
        color: 'green',
      })
      queryClient.invalidateQueries({
        queryKey: evaluationKeys.list(String(variables.supplier)),
      })
    },
    onError: (error) => {
      const axiosError = error as AxiosError<{
        detail?: string
        errors?: unknown[]
      }>
      const status = axiosError.response?.status
      const data = axiosError.response?.data
      const detailText =
        typeof data?.detail === 'string' ? data.detail.toLowerCase() : ''

      if (status === 400 && detailText.includes('já existe uma avaliação')) {
        notifications.show({
          title: 'Erro',
          message: DUPLICATE_PERIOD_MESSAGE,
          color: 'red',
        })
        return
      }
      if (status === 400 && detailText.includes('outro tipo de período')) {
        notifications.show({
          title: 'Erro',
          message: MIXED_PERIOD_TYPE_MESSAGE,
          color: 'red',
        })
        return
      }

      const normalized = normalizeApiErrors(data)
      const message =
        normalized.length > 0
          ? normalized
              .map(({ field, error }) =>
                field && field !== 'general' ? `${field}: ${error}` : error,
              )
              .join('\n')
          : GENERIC_CREATE_ERROR_MESSAGE

      notifications.show({
        title: 'Erro ao salvar avaliação',
        message,
        color: 'red',
        autoClose: 8000,
      })
    },
  })
}

export function useUpdateSupplierEvaluation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number
      data: Partial<CreateSupplierEvaluationPayload>
    }) => {
      const response = await api.put(
        `/proxy/procurement/v1/evaluation/evaluations/${id}/`,
        data,
      )
      return response.data
    },
    onSuccess: () => {
      notifications.show({
        title: 'Sucesso',
        message: 'Avaliação de desempenho atualizada com sucesso!',
        color: 'green',
      })
      queryClient.invalidateQueries({
        queryKey: evaluationKeys.all,
      })
    },
    onError: (error) => {
      const axiosError = error as AxiosError<{ detail?: string }>
      if (axiosError.response?.status === 403) {
        notifications.show({
          title: 'Acesso Negado',
          message: 'Você não tem permissão para atualizar esta avaliação.',
          color: 'red',
        })
        return
      }
      notifications.show({
        title: 'Erro',
        message: 'Ocorreu um erro ao atualizar a avaliação.',
        color: 'red',
      })
    },
  })
}

export function useDeleteSupplierEvaluation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(
        `/proxy/procurement/v1/evaluation/evaluations/${id}/`,
      )
      return response.data
    },
    onSuccess: () => {
      notifications.show({
        title: 'Sucesso',
        message: 'Avaliação de desempenho excluída com sucesso!',
        color: 'green',
      })
      queryClient.invalidateQueries({
        queryKey: evaluationKeys.all,
      })
    },
    onError: (error) => {
      const axiosError = error as AxiosError<{ detail?: string }>
      if (axiosError.response?.status === 403) {
        notifications.show({
          title: 'Acesso Negado',
          message: 'Você não tem permissão para excluir esta avaliação.',
          color: 'red',
        })
        return
      }
      notifications.show({
        title: 'Erro',
        message: 'Ocorreu um erro ao excluir a avaliação.',
        color: 'red',
      })
    },
  })
}
