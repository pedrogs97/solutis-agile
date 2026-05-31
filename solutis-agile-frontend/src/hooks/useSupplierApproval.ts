'use client'

import { notifications } from '@mantine/notifications'
import { useMutation } from '@tanstack/react-query'
import { useSearch } from '@tanstack/react-router'
import { AxiosError } from 'axios'
import { useEffect, useState } from 'react'

import { approveCurrentStep } from '@/services/api/approval-workflow'
import { parseJwt } from '@/utils/jwt'

interface ApproveStepArgs {
  workflowId: number
  isApproved: boolean
  token?: string
}

export function useSupplierApproval() {
  const searchParams = useSearch({ from: '/_suppliers/approval/' })

  const [message, setMessage] = useState<string>('Processing approval...')
  const [approved, setApproved] = useState<boolean>(false)

  const approveStepMutation = useMutation({
    mutationFn: async ({ workflowId, isApproved, token }: ApproveStepArgs) => {
      const payload = {
        workflowId,
        isApproved,
        token,
      }
      await approveCurrentStep(payload)
    },
    onSuccess: async () => {
      notifications.show({
        title: 'Decisão registrada',
        message: 'A decisão foi registrada com sucesso.',
        color: 'green',
        autoClose: 5000,
      })
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

  useEffect(() => {
    if (searchParams.token) {
      const decodedToken = parseJwt(searchParams.token)
      if (decodedToken?.action === 'accept') {
        setMessage('Você aprovou o fornecedor com sucesso!')
        if (approveStepMutation.isPending || approveStepMutation.isSuccess)
          return
        approveStepMutation.mutate({
          workflowId: decodedToken.approvalFlowStepId,
          isApproved: true,
          token: searchParams.token,
        })
        setApproved(true)
      } else if (decodedToken?.action === 'reject') {
        setMessage('Você rejeitou o fornecedor com sucesso!')
        if (approveStepMutation.isPending) return
        approveStepMutation.mutate({
          workflowId: decodedToken.approvalFlowStepId,
          isApproved: false,
          token: searchParams.token,
        })
        setApproved(false)
      } else {
        setMessage('Ação de token inválida.')
      }
    }
  }, [searchParams])

  return {
    message,
    approved,
  }
}
