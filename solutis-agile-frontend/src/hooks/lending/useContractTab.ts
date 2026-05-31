import { notifications } from '@mantine/notifications'
import { useCallback, useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'

import { validateSignerPair } from '@/hooks/useSignerEmails'
import axios from '@/lib/axios'

import { handleFileUploadError } from './useLendingDocuments'

interface UseContractTabProps {
  lendingId?: string
  lendingData: any
  onInvalidate: () => void
  withDownloadNotification: any
  form: UseFormReturn<any>
}

export function useContractTab({
  lendingId,
  lendingData,
  onInvalidate,
  withDownloadNotification,
  form,
}: UseContractTabProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const resetRef = useState<() => void>(() => {})

  const clearFile = useCallback(() => {
    setFile(null)
    resetRef[0]?.()
  }, [resetRef])

  const onDownloadContract = useCallback(async () => {
    if (!lendingData?.document) return

    await withDownloadNotification({
      request: {
        url: `/documents/download/${lendingData.document}/`,
        method: 'GET',
        openInNewTab: true,
      },
      successMessage: 'Contrato aberto em nova aba',
      errorMessage: 'Não foi possível abrir o contrato',
    })
    onInvalidate()
  }, [lendingData, withDownloadNotification, onInvalidate])

  const onRecreateContract = useCallback(async () => {
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
          documentId: lendingData.document,
          type: '',
          principalSigner: signerValidation.principalSigner,
          employeeSigner: signerValidation.employeeSigner,
        },
        openInNewTab: true,
      },
      successMessage: 'Contrato aberto em nova aba',
      errorMessage: 'Não foi possível abrir o contrato',
      successColor: 'green',
      onFinally: () => setIsSubmitting(false),
    })
  }, [lendingData, withDownloadNotification])

  const onUploadSignedContract = useCallback(async () => {
    if (!file || !lendingId) return

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('lendingId', lendingId)
      formData.append('file', file)

      await axios.post('/documents/contracts/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      notifications.show({
        title: 'Sucesso',
        message: 'Contrato de comodato enviado com sucesso',
        color: 'green',
        autoClose: 5000,
      })
      clearFile()
      onInvalidate()
    } catch (err) {
      handleFileUploadError(err, 'contrato')
    } finally {
      setIsSubmitting(false)
    }
  }, [file, lendingId, clearFile, onInvalidate])

  const onDownloadVerification = useCallback(async () => {
    if (!lendingId) return

    await withDownloadNotification({
      request: {
        url: `/documents/download/verification/${lendingId}/`,
        method: 'GET',
        openInNewTab: true,
      },
      successMessage: 'Verificação aberta em nova aba',
      errorMessage: 'Não foi possível abrir a verificação',
      successColor: 'green',
    })
  }, [lendingId, withDownloadNotification])

  return {
    file,
    setFile,
    clearFile,
    resetRef: resetRef[1],
    isSubmitting,
    onDownloadContract,
    onRecreateContract,
    onUploadSignedContract,
    onDownloadVerification,
  }
}
