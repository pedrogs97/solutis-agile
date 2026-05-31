'use client'

import { notifications } from '@mantine/notifications'
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { useMemo } from 'react'

import {
  fetchApprovalSteps,
  fetchSupplierApprovalFlow,
  resetSupplierApprovalFlow,
  setResponsibleCurrentStep,
  startSupplierApprovalFlow,
} from '@/services/api/approval-workflow'
import {
  type ApprovalFlow,
  type ApprovalStep,
  type ApprovalTimelineItem,
  type StepApproval,
} from '@/types/ApprovalWorkflow'

interface UseApprovalWorkflowParams {
  supplierId?: string
  enabled?: boolean
}

interface SetResponsibleStepArgs {
  flowId: number
  approverName: string
  approverEmail: string
  observations?: string
  originStepId?: number
}

const buildTimeline = (
  steps: ApprovalStep[],
  flow?: ApprovalFlow[],
): ApprovalTimelineItem[] => {
  const firstStepId = steps[0]?.id

  const flowByStep = (flow ?? []).reduce(
    (acc, item) => {
      const stepKey = item.step.id
      const current = acc[stepKey]
      if (!current) {
        acc[stepKey] = item
        return acc
      }

      const currentDate = new Date(
        current.approvedAt || current.reprovedAt || 0,
      ).getTime()
      const newDate = new Date(
        item.approvedAt || item.reprovedAt || 0,
      ).getTime()

      if (newDate >= currentDate) {
        acc[stepKey] = item
      }

      return acc
    },
    {} as Record<number, ApprovalFlow>,
  )

  return steps.map((step, index) => {
    const flowItem = flowByStep[step.id]
    let status: ApprovalTimelineItem['status'] = 'pending'
    let approval: StepApproval | undefined = undefined

    if (flowItem) {
      if (flowItem.isReproved) {
        status = 'rejected'
      } else if (flowItem.isApproved) {
        status = 'completed'
      } else {
        status = 'pendingApproval'
      }

      approval = {
        id: flowItem?.id ?? 0,
        stepId: step.id,
        stepName: step.name,
        stepDepartment: step.department,
        approver: flowItem?.approver ?? '',
        approverId: flowItem?.approverId ?? 0,
        approvalAt: flowItem?.approvedAt ?? '',
        observations: flowItem?.observations ?? '',
        isApproved: flowItem?.isApproved ?? false,
        createdAt: '',
        updatedAt: '',
      } as StepApproval
    } else {
      if (index === 0 && !flow?.length && step.id === firstStepId) {
        status = 'current'
      } else if (index > 0) {
        const previousStep = steps[index - 1]
        const previousFlowItem = flowByStep[previousStep.id]
        if (previousFlowItem?.isApproved) {
          status = 'current'
        }
      }
    }

    return {
      step,
      status,
      approval,
    }
  })
}

export function useApprovalWorkflow({
  supplierId,
  enabled = true,
}: UseApprovalWorkflowParams) {
  const queryClient = useQueryClient()

  const stepsQuery = useQuery({
    queryKey: ['approval-steps'],
    queryFn: async () => {
      const response = await fetchApprovalSteps()
      return response.data
    },
    enabled: enabled && Boolean(supplierId),
  })

  const flowQuery: UseQueryResult<ApprovalFlow[] | undefined> = useQuery({
    queryKey: ['approval-flow', supplierId],
    queryFn: async () => {
      if (!supplierId) return undefined
      const response = await fetchSupplierApprovalFlow(supplierId)
      return response.data
    },
    enabled: enabled && Boolean(supplierId),
    retry: (failureCount, error: any) => {
      const status = (error as AxiosError)?.response?.status
      if (status === 404) {
        return false
      }
      return failureCount < 3
    },
  })

  const steps = useMemo(() => stepsQuery.data ?? [], [stepsQuery.data])
  const flow = flowQuery.data
  const timeline = useMemo(() => buildTimeline(steps, flow), [steps, flow])
  const currentStepFlow = flow?.slice(-1)[0]

  const startFlowMutation = useMutation({
    mutationFn: async () => {
      if (!supplierId) throw new Error('supplierId is required')
      const response = await startSupplierApprovalFlow(supplierId)
      return response.data
    },
    onSuccess: () => {
      notifications.show({
        title: 'Fluxo iniciado',
        message: 'Fluxo de aprovação iniciado com sucesso.',
        color: 'green',
        autoClose: 5000,
      })
      if (supplierId) {
        queryClient.invalidateQueries({
          queryKey: ['approval-flow', supplierId],
        })
      }
    },
    onError: (error: any) => {
      const axiosError = error as AxiosError<any>
      const detail = axiosError?.response?.data?.detail
      const message =
        typeof detail === 'string' && detail
          ? detail
          : 'Não foi possível iniciar o fluxo de aprovação.'
      notifications.show({
        title: 'Erro',
        message,
        color: 'red',
        autoClose: 5000,
      })
    },
  })

  const setResponsibleStepMutation = useMutation({
    mutationFn: async ({
      flowId,
      approverName,
      approverEmail,
      observations,
      originStepId,
    }: SetResponsibleStepArgs) => {
      const stepId = originStepId ?? currentStepFlow?.step.id ?? 0
      if (!flowId || !stepId) {
        throw new Error('Fluxo ou passo inválido.')
      }
      const payload = {
        name: approverName,
        email: approverEmail,
        workflowId: flowId,
        stepId,
        observations: observations ?? '',
      }
      await setResponsibleCurrentStep(payload)
    },
    onSuccess: async () => {
      notifications.show({
        title: 'Decisão registrada',
        message: 'A decisão foi registrada com sucesso.',
        color: 'green',
        autoClose: 5000,
      })
      if (supplierId) {
        await queryClient.invalidateQueries({
          queryKey: ['approval-flow', supplierId],
        })
      }
    },
    onError: (error: any) => {
      const axiosError = error as AxiosError<any>
      const message =
        axiosError?.response?.data?.detail ||
        'Não foi possível registrar a decisão do passo.'
      notifications.show({
        title: 'Erro',
        message,
        color: 'red',
        autoClose: 5000,
      })
    },
  })

  const resetFlowMutation = useMutation({
    mutationFn: async () => {
      if (!supplierId) throw new Error('supplierId is required')
      await resetSupplierApprovalFlow(supplierId)
    },
    onSuccess: async () => {
      notifications.show({
        title: 'Fluxo resetado',
        message: 'O fluxo de aprovação foi resetado com sucesso.',
        color: 'green',
        autoClose: 5000,
      })
      if (supplierId) {
        await queryClient.invalidateQueries({
          queryKey: ['approval-flow', supplierId],
        })
      }
    },
    onError: (error: any) => {
      const axiosError = error as AxiosError<any>
      const message =
        axiosError?.response?.data?.detail ||
        axiosError?.response?.data?.message ||
        'Não foi possível resetar o fluxo de aprovação.'
      notifications.show({
        title: 'Erro',
        message,
        color: 'red',
        autoClose: 5000,
      })
    },
  })

  const hasFlowNotFound = Boolean(
    flowQuery.error &&
    (flowQuery.error as AxiosError)?.response?.status === 404,
  )

  return {
    steps,
    stepsQuery,
    flowQuery,
    timeline,
    hasFlowNotFound,
    isLoading: stepsQuery.isLoading || flowQuery.isLoading,
    isFetching: stepsQuery.isFetching || flowQuery.isFetching,
    startFlow: startFlowMutation.mutateAsync,
    isStartingFlow: startFlowMutation.isPending,
    refetchFlow: flowQuery.refetch,
    currentStepFlow,
    setResponsibleStep: setResponsibleStepMutation.mutateAsync,
    isSending: setResponsibleStepMutation.isPending,
    resetFlow: resetFlowMutation.mutateAsync,
    isResettingFlow: resetFlowMutation.isPending,
  }
}
