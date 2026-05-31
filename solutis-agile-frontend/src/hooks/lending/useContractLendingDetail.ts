import { zodResolver } from '@hookform/resolvers/zod'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { useNavigate } from '@tanstack/react-router'
import { AxiosError } from 'axios'
import { useCallback } from 'react'
import { useForm } from 'react-hook-form'

import type { VerificationPayload } from '@/components/lendings/VerificationForm'
import { useDomainOptions } from '@/hooks/useDomainOptions'
import { useFormPersistence } from '@/hooks/useFormPersistence'
import { useSubmittingMutation } from '@/hooks/useSubmittingMutation'
import { normalizeApiErrors } from '@/lib/api-errors'
import { getErrorMessage } from '@/lib/utils'
import { lendingSchema } from '@/lib/validations/lending'
import { fetchEmployeeSelect } from '@/services/api/employee'
import {
  createLending,
  fetchAssetSelect,
} from '@/services/api/lending-contract'
import { type ErrorResponse } from '@/types/ApiResponse'

import { type FormDataLendingContract } from './types'
import { useLendingDocuments } from './useLendingDocuments'
import { useLendingVerification } from './useLendingVerification'

type FormLending = FormDataLendingContract & {
  verification?: VerificationPayload | null
  attachments?: File[]
}

export default function useContractLendingDetail() {
  const navigate = useNavigate()

  const { file, setFile, clearFile, resetRef } = useLendingDocuments()

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

  const formPersistence = useFormPersistence({
    form,
    key: 'lending_create',
    enabled: true,
    debounceMs: 1500,
  })

  const {
    costCenters,
    workloads,
    isLoading: domainLoading,
  } = useDomainOptions({ keys: ['costCenters', 'workloads'] })

  const isPendingCostCenters = domainLoading.costCenters
  const isPendingWorkloads = domainLoading.workloads

  const fetchEmployeeOptions = useCallback(async (query: string) => {
    return await fetchEmployeeSelect(query)
  }, [])

  const fetchWitnessesOptions = useCallback(async (query: string) => {
    return await fetchEmployeeSelect(query)
  }, [])

  const fetchAssetOptions = useCallback(async (query: string) => {
    return await fetchAssetSelect(query)
  }, [])

  const {
    mutate: mutateAddLendingContract,
    isPending: isPendingAddLendingContract,
  } = useSubmittingMutation({
    mutationKey: ['createLendingContract'],
    mutationFn: async (data: FormLending) => {
      const { verification, attachments = [], ...formData } = data ?? {}

      const payloadV2 = {
        employeeId: Number.parseInt(formData.employeeId, 10),
        assetId: Number.parseInt(formData.assetId, 10),
        workloadId: Number.parseInt(formData.workloadId, 10),
        witnessesId: (formData.witnessesId ?? [])
          .filter((witnessId) => witnessId !== '')
          .map((witnessId) => Number.parseInt(witnessId, 10)),
        costCenterId: Number.parseInt(formData.costCenterId, 10),
        manager: formData.manager,
        observations: formData.observations ?? null,
        glpiNumber: formData.glpiNumber ?? null,
        project: formData.project ?? null,
        businessExecutive: formData.businessExecutive ?? null,
        location: formData.location,
        bu: formData.bu,
        msOffice: formData.msOffice,
        principalSigner: formData.principalSigner,
        employeeSigner: formData.employeeSigner,
        legalPerson: formData.legalPerson,
        ...(verification && verification.answered.length > 0
          ? {
              verificationAnswers: {
                typeId: Number.parseInt(String(verification.typeId ?? '1'), 10),
                answered: verification.answered.map((answer) => ({
                  verificationId: answer.verificationId,
                  answer: answer.answer,
                  observations: answer.observations ?? '',
                })),
              },
            }
          : {}),
      }

      return await createLending({
        data: payloadV2,
        attachments,
      })
    },
    form,
    successMessage: null,
    errorMessage: 'Não foi possível criar o contrato de comodato',
    onSuccess: async (response: any) => {
      const createdLending = response?.lending ?? response
      const createdLendingId = createdLending?.id

      if (createdLendingId) {
        navigate({ to: `/lendings/edit/${createdLendingId}` })
      } else {
        notifications.show({
          title: 'Contrato criado',
          message:
            'O contrato foi criado, mas não foi possível abrir a edição automaticamente',
          color: 'yellow',
          autoClose: 5000,
        })
      }

      clearFile()
      resetVerificationFlow()
      formPersistence.clearStorage()
    },
    onError: (error: AxiosError<ErrorResponse[]>) => {
      const errors = normalizeApiErrors(error?.response?.data)
      errors.forEach((err) => {
        getErrorMessage(err, 'Não foi possível criar o contrato de comodato')
        const { error, field } = err
        if (field === 'assetId') {
          setActiveTab('general-data')
          resetVerificationFlow()
        }
        if (field === 'general') return
        form.setError(field as keyof FormDataLendingContract, {
          type: 'custom',
          message: error,
        })
      })
    },
  })

  const {
    verificationImages,
    addVerificationImages,
    removeVerificationImage,
    openLightBox,
    setOpenLightBox,
    activeTab,
    setActiveTab,
    assetType,
    setAssetType,
    hasVerification,
    hasVerificationQuestions,
    handleTabChange,
    verificationQuestions: verificationQuestionList,
    defaultAnswered: defaultVerificationAnswers,
    setVerificationAnswers,
    resetVerificationFlow,
    verificationFormKey,
  } = useLendingVerification({
    form: form as any,
  })

  const openConfirmModalAddContract = useCallback(
    (data: FormLending) => {
      const attachments = [
        ...verificationImages.map(
          (verificationImage) => verificationImage.file,
        ),
        ...(file ? [file] : []),
      ]

      const payload: FormLending = {
        ...data,
        attachments,
      }

      modals.openConfirmModal({
        id: 'confirm-add-contract-modal',
        size: 'lg',
        title: 'Confirmação de dados',
        children:
          'Deseja confirmar os dados e adicionar um novo contrato de comodato?',
        centered: true,
        labels: {
          confirm: 'Confirmar envio',
          cancel: 'Cancelar e verificar informações',
        },
        onCancel: () => {
          if (hasVerification) {
            setActiveTab('general-data')
            resetVerificationFlow()
          }
          modals.close('confirm-add-contract-modal')
        },
        onConfirm: () => {
          mutateAddLendingContract(payload)
        },
      })
    },
    [
      file,
      hasVerification,
      mutateAddLendingContract,
      resetVerificationFlow,
      setActiveTab,
      verificationImages,
    ],
  )

  const onSubmitQuestionVerification = useCallback(
    async (payload: VerificationPayload) => {
      const sanitizedPayload: VerificationPayload = {
        ...payload,
        typeId: payload.typeId ?? '1',
        answered: payload.answered.map((answer) => ({
          ...answer,
          observations: answer.observations ?? '',
        })),
      }

      if (!hasVerificationQuestions) {
        setVerificationAnswers(sanitizedPayload)
      } else if (sanitizedPayload.answered.length === 0) {
        notifications.show({
          title: 'Erro de validação',
          message: 'Você deve responder pelo menos uma pergunta de verificação',
          color: 'red',
          autoClose: 5000,
        })
        return
      } else {
        setVerificationAnswers(sanitizedPayload)
      }

      const mergedData: FormLending = {
        ...form.getValues(),
        verification: sanitizedPayload,
      }

      openConfirmModalAddContract(mergedData)
    },
    [
      form,
      hasVerificationQuestions,
      openConfirmModalAddContract,
      setVerificationAnswers,
    ],
  )

  const onSubmitGeneralData = async () => {
    setActiveTab('contract-upload')
  }

  return {
    form,
    onSubmitGeneralData,
    onSubmitQuestionVerification,
    openConfirmModalAddContract,

    fetchEmployeeOptions,
    fetchWitnessesOptions,
    fetchAssetOptions,

    workloads,
    isPendingWorkloads,
    costCenters,
    isPendingCostCenters,

    activeTab,
    setActiveTab,
    handleTabChange,

    verificationQuestions: verificationQuestionList,
    defaultVerificationAnswers,
    verificationImages,
    addVerificationImages,
    removeVerificationImage,
    resetVerificationFlow,
    verificationFormKey,
    hasVerification,
    openLightBox,
    setOpenLightBox,
    assetType,
    setAssetType,

    file,
    setFile,
    clearFile,
    resetRef,

    isSubmitting: isPendingAddLendingContract,

    formPersistence,
  }
}
