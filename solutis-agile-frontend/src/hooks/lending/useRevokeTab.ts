// Hook specifically for Revoke/Distrato tab logic
import { notifications } from '@mantine/notifications'
import { useCallback, useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'

import { validateSignerPair } from '@/hooks/useSignerEmails'
import axios from '@/lib/axios'

import { handleFileUploadError } from './useLendingDocuments'

interface UseRevokeTabProps {
  lendingId?: string
  lendingData: any
  onInvalidate: () => void
  withDownloadNotification: any
  form: UseFormReturn<any>
  onValidationError?: (error: string | null) => void
}

export function useRevokeTab({
  lendingId,
  lendingData,
  onInvalidate,
  withDownloadNotification,
  form,
  onValidationError,
}: UseRevokeTabProps) {
  const [fileRevoke, setFileRevoke] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const resetRevokeRef = useState<() => void>(() => {})

  const clearRevokeFile = useCallback(() => {
    setFileRevoke(null)
    resetRevokeRef[0]?.()
  }, [resetRevokeRef])

  const onTerminateContract = useCallback(async () => {
    const witnessesRevokeId = form.getValues('witnessesRevokeId')

    // Check if both witnesses are selected
    const validWitnesses = witnessesRevokeId?.filter(
      (w: string) => w && w.trim() !== '',
    )

    if (!validWitnesses || validWitnesses.length < 2) {
      if (onValidationError) {
        onValidationError('Necessário selecionar 2 testemunhas')
      }
      return
    }

    // Clear any previous validation errors
    if (onValidationError) {
      onValidationError(null)
    }

    if (!lendingData) return

    // Convert witness IDs from strings to integers
    const witnessIdsAsIntegers = validWitnesses.map((id: string) =>
      parseInt(id, 10),
    )

    const signerValidation = validateSignerPair(
      {
        principalSigner: form.getValues('principalSigner'),
        employeeSigner: form.getValues('employeeSigner'),
      },
      {
        onInvalid: (missing) => {
          if (missing.principalSigner) {
            form.setError('principalSigner', {
              type: 'manual',
              message: 'Informe o e-mail do gestor responsável',
            })
          }
          if (missing.employeeSigner) {
            form.setError('employeeSigner', {
              type: 'manual',
              message: 'Informe o e-mail do colaborador',
            })
          }
        },
      },
    )

    if (!signerValidation.isValid) {
      return
    }

    form.clearErrors(['principalSigner', 'employeeSigner'])

    setIsSubmitting(true)
    await withDownloadNotification({
      request: {
        url: `/documents/contracts/revoke/create/`,
        method: 'POST',
        data: {
          lendingId: lendingData.id,
          legalPerson: lendingData.legalPerson,
          witnessesId: witnessIdsAsIntegers,
          principalSigner: signerValidation.principalSigner,
          employeeSigner: signerValidation.employeeSigner,
        },
        openInNewTab: true,
      },
      successMessage: 'O distrato do contrato foi iniciado',
      errorMessage: 'Não foi possível abrir o distrato',
      onFinally: () => setIsSubmitting(false),
    })
    onInvalidate()
  }, [
    lendingData,
    form,
    withDownloadNotification,
    onInvalidate,
    onValidationError,
  ])

  const onDownloadRevokeContract = useCallback(async () => {
    if (!lendingData?.documentRevoke) return

    await withDownloadNotification({
      request: {
        url: `/documents/download/${lendingData.documentRevoke}/`,
        method: 'GET',
        openInNewTab: true,
      },
      successMessage: 'Distrato aberto em nova aba',
      errorMessage: 'Não foi possível abrir o distrato',
    })
    onInvalidate()
  }, [lendingData, withDownloadNotification, onInvalidate])

  const onRecreateRevokeContract = useCallback(async () => {
    if (!lendingData) return

    const signerValidation = validateSignerPair(
      {
        principalSigner: form.getValues('principalSigner'),
        employeeSigner: form.getValues('employeeSigner'),
      },
      {
        onInvalid: (missing) => {
          if (missing.principalSigner) {
            form.setError('principalSigner', {
              type: 'manual',
              message: 'Informe o e-mail do gestor responsável',
            })
          }
          if (missing.employeeSigner) {
            form.setError('employeeSigner', {
              type: 'manual',
              message: 'Informe o e-mail do colaborador',
            })
          }
        },
      },
    )

    if (!signerValidation.isValid) {
      return
    }

    form.clearErrors(['principalSigner', 'employeeSigner'])

    setIsSubmitting(true)
    await withDownloadNotification({
      request: {
        url: '/documents/contracts/recreate/',
        method: 'POST',
        data: {
          lendingId: lendingData.id,
          documentId: lendingData.documentRevoke,
          type: 'revoke',
          principalSigner: signerValidation.principalSigner,
          employeeSigner: signerValidation.employeeSigner,
        },
        openInNewTab: true,
      },
      successMessage: 'Distrato recriado com sucesso',
      errorMessage: 'Não foi possível abrir o distrato',
      successColor: 'green',
      onFinally: () => setIsSubmitting(false),
    })
  }, [lendingData, form, withDownloadNotification])

  const onUploadSignedRevoke = useCallback(async () => {
    if (!fileRevoke || !lendingId) return

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('lendingId', lendingId)
      formData.append('file', fileRevoke)

      await axios.post('/documents/contracts/revoke/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      notifications.show({
        title: 'Sucesso',
        message: 'Distrato de comodato enviado com sucesso',
        color: 'green',
        autoClose: 5000,
      })
      clearRevokeFile()
      onInvalidate()
    } catch (err) {
      handleFileUploadError(err, 'distrato')
    } finally {
      setIsSubmitting(false)
    }
  }, [fileRevoke, lendingId, clearRevokeFile, onInvalidate])

  return {
    fileRevoke,
    setFileRevoke,
    clearRevokeFile,
    resetRevokeRef: resetRevokeRef[1],
    isSubmitting,
    onTerminateContract,
    onDownloadRevokeContract,
    onRecreateRevokeContract,
    onUploadSignedRevoke,
  }
}
