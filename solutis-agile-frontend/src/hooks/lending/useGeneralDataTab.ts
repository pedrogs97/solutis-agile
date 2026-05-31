// Hook for General Data tab - form management only
import { zodResolver } from '@hookform/resolvers/zod'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { useForm } from 'react-hook-form'

import { lendingSchema } from '@/lib/validations/lending'
import { updateLending } from '@/services/api/lending-contract'
import { type ErrorResponse } from '@/types/ApiResponse'

import { type FormDataLendingContract } from './types'

interface UseGeneralDataTabProps {
  lendingId?: string
}

export function useGeneralDataTab({ lendingId }: UseGeneralDataTabProps) {
  const queryClient = useQueryClient()

  const form = useForm<FormDataLendingContract>({
    resolver: zodResolver(lendingSchema) as any,
    mode: 'onTouched',
    shouldFocusError: true,
    defaultValues: {
      employeeId: '',
      assetId: '',
      msOffice: false,
      bu: '',
      workloadId: '',
      witnessesId: ['', ''],
      witnessesRevokeId: ['', ''],
      costCenterId: '',
      manager: '',
      observations: null,
      glpiNumber: null,
      project: null,
      businessExecutive: null,
      location: '',
      employeeSigner: '',
      principalSigner: '',
      legalPerson: false,
    },
  })

  // Populate form when data loads
  const populateForm = (data: any) => {
    const witnessesIds = data.witnesses.map((w: any) => w.employee.fullName)
    form.reset({
      employeeId: data.employee.fullName,
      assetId: data.asset.description,
      msOffice: data.msOffice,
      bu: data.bu,
      workloadId: data.workload.name,
      witnessesId: [witnessesIds[0] ?? '', witnessesIds[1] ?? ''],
      witnessesRevokeId: ['', ''],
      costCenterId: data.costCenter.name,
      manager: data.manager,
      observations: data.observations,
      glpiNumber: data.glpiNumber,
      project: data.project,
      businessExecutive: data.businessExecutive,
      location: data.location,
      employeeSigner: data.employee.email ?? '',
      principalSigner: data.principalSigner ?? '',
      legalPerson: data.employee?.legalPerson ?? false,
    })
  }

  const { mutate: updateLendingData, isPending: isUpdating } = useMutation({
    mutationKey: ['updateLending', lendingId],
    mutationFn: async (data: Partial<FormDataLendingContract>) => {
      const dataCleaned = {
        observations: data.observations,
        msOffice: data.msOffice,
        manager: data.manager,
        project: data.project,
        businessExecutive: data.businessExecutive,
        glpiNumber: data.glpiNumber,
        principalSigner: data.principalSigner,
        employeeSigner: data.employeeSigner,
      }

      return await updateLending(lendingId!, dataCleaned)
    },
    onSuccess: () => {
      notifications.show({
        title: 'Sucesso',
        message: 'Dados atualizados com sucesso',
        color: 'green',
        autoClose: 5000,
      })
      queryClient.invalidateQueries({ queryKey: ['fetchLending', lendingId] })
    },
    onError: (error: AxiosError<ErrorResponse[]>) => {
      const errors = error?.response?.data
      errors?.forEach(({ field, error }) => {
        form.setError(field as keyof FormDataLendingContract, {
          type: 'custom',
          message: error,
        })
      })
      notifications.show({
        title: 'Erro',
        message: 'Não foi possível atualizar os dados',
        color: 'red',
        autoClose: 5000,
      })
    },
  })

  const onSubmit = (data: FormDataLendingContract) => {
    modals.openConfirmModal({
      title: 'Confirmar alterações',
      children: 'Deseja salvar as alterações realizadas?',
      labels: { confirm: 'Salvar', cancel: 'Cancelar' },
      onConfirm: () => updateLendingData(data),
    })
  }

  return {
    form,
    populateForm,
    onSubmit,
    isUpdating,
  }
}
