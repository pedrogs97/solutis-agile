import { notifications } from '@mantine/notifications'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import api from '@/lib/axios'

import {
  useCreateSupplierEvaluation,
  useDeleteSupplierEvaluation,
  useEvaluationCriteria,
  useSupplierEvaluationDetail,
  useSupplierEvaluations,
  useUpdateSupplierEvaluation,
} from './useEvaluations'

vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: vi.fn(),
  },
}))

const mockedApi = vi.mocked(api, { deep: true })
const mockedNotifications = vi.mocked(notifications, { deep: true })

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('useEvaluations hooks', () => {
  it('fetches criteria from proxy v1 endpoint', async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: {
        results: [{ id: 10, name: 'Qualidade', weight: '1.00', order: 1 }],
      },
    } as never)

    const { result } = renderHook(() => useEvaluationCriteria(true), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.data?.[0]?.id).toBe(10)
    })

    expect(mockedApi.get).toHaveBeenCalledWith(
      '/proxy/procurement/v1/evaluation/criteria-list/',
    )
  })

  it('fetches supplier evaluations list from evaluations-list endpoint', async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: { results: [{ id: 100 }] },
    } as never)

    const { result } = renderHook(() => useSupplierEvaluations(7), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.data?.results?.[0]?.id).toBe(100)
    })

    expect(mockedApi.get).toHaveBeenCalledWith(
      '/proxy/procurement/v1/evaluation/evaluations-list/',
      { params: { supplier: 7, page: 1, size: 12 } },
    )
  })

  it('does not fetch supplier evaluations without supplier context', async () => {
    renderHook(() => useSupplierEvaluations(undefined), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(mockedApi.get).not.toHaveBeenCalled()
    })
  })

  it('fetches evaluation detail from proxy v1 endpoint', async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: { id: 42 },
    } as never)

    const { result } = renderHook(() => useSupplierEvaluationDetail(42), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.data?.id).toBe(42)
    })

    expect(mockedApi.get).toHaveBeenCalledWith(
      '/proxy/procurement/v1/evaluation/evaluations/42/',
    )
  })

  it('creates evaluation through proxy v1 endpoint', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: { id: 1 } } as never)

    const payload = {
      supplier: 9,
      evaluationYear: 2026,
      periodType: 'QUADRIMESTER' as const,
      periodNumber: 2,
      evaluatorName: 'Tester',
      evaluationDate: '2026-04-14',
      criterionScores: [{ criterion: 1, score: 80 }],
    }

    const { result } = renderHook(() => useCreateSupplierEvaluation(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.mutateAsync(payload)
    })

    expect(mockedApi.post).toHaveBeenCalledWith(
      '/proxy/procurement/v1/evaluation/evaluations/',
      payload,
    )
  })

  it('updates evaluation without master password header', async () => {
    mockedApi.put.mockResolvedValueOnce({ data: { id: 55 } } as never)

    const payload = {
      supplier: 9,
      evaluationYear: 2026,
      periodType: 'QUADRIMESTER' as const,
      periodNumber: 2,
      evaluatorName: 'Tester',
      evaluationDate: '2026-04-14',
      criterionScores: [{ criterion: 1, score: 80 }],
    }

    const { result } = renderHook(() => useUpdateSupplierEvaluation(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.mutateAsync({ id: 55, data: payload })
    })

    expect(mockedApi.put).toHaveBeenCalledWith(
      '/proxy/procurement/v1/evaluation/evaluations/55/',
      payload,
    )
  })

  it('deletes evaluation without master password header', async () => {
    mockedApi.delete.mockResolvedValueOnce({ data: null } as never)

    const { result } = renderHook(() => useDeleteSupplierEvaluation(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.mutateAsync(55)
    })

    expect(mockedApi.delete).toHaveBeenCalledWith(
      '/proxy/procurement/v1/evaluation/evaluations/55/',
    )
  })

  it('shows friendly message when period is duplicated', async () => {
    mockedApi.post.mockRejectedValueOnce({
      response: {
        status: 400,
        data: {
          detail:
            'Já existe uma avaliação para este fornecedor no quadrimestre e ano selecionados.',
        },
      },
    })

    const payload = {
      supplier: 9,
      evaluationYear: 2026,
      periodType: 'QUADRIMESTER' as const,
      periodNumber: 1,
      evaluatorName: 'Tester',
      evaluationDate: '2026-04-14',
      criterionScores: [{ criterion: 1, score: 80 }],
    }

    const { result } = renderHook(() => useCreateSupplierEvaluation(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await expect(result.current.mutateAsync(payload)).rejects.toBeDefined()
    })

    expect(mockedNotifications.show).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Erro',
        message:
          'Já existe uma avaliação para este fornecedor no período selecionado.',
      }),
    )
  })
})
