'use client'

import { notifications } from '@mantine/notifications'
import { useCallback, useRef, useState } from 'react'

import { FILE_UPLOAD_CONFIG } from '@/constants/selectOptions'
import { downloadWithNotification } from '@/utils/downloadWithNotification'

export const handleFileUploadError = (err: any, fileType: string) => {
  if (err.response?.status === 413) {
    const maxSizeMB = FILE_UPLOAD_CONFIG.MAX_FILE_SIZE / (1024 * 1024)
    notifications.show({
      title: 'Atenção',
      message: `Arquivo muito grande, máximo de ${maxSizeMB}MB`,
      color: 'orange',
      autoClose: 5000,
    })
  } else {
    notifications.show({
      title: 'Erro',
      message: `Não foi possível enviar o ${fileType}`,
      color: 'red',
      autoClose: 5000,
    })
  }
}

export function useLendingDocuments() {
  const [file, setFile] = useState<File | null>(null)
  const [fileRevoke, setFileRevoke] = useState<File | null>(null)
  const resetRef = useRef<() => void>(() => {})
  const resetRevokeRef = useRef<() => void>(() => {})

  const clearFile = useCallback(() => {
    setFile(null)
    resetRef.current?.()
  }, [])

  const clearRevokeFile = useCallback(() => {
    setFileRevoke(null)
    resetRevokeRef.current?.()
  }, [])

  const withDownloadNotification = useCallback(
    async ({
      request,
      successMessage,
      errorMessage,
      successColor = 'blue',
      onFinally,
    }: {
      request: Parameters<typeof downloadWithNotification>[0]
      successMessage: string
      errorMessage: string
      successColor?: string
      onFinally?: () => void
    }) => {
      await downloadWithNotification({
        ...request,
        successMessage,
        errorMessage,
        successColor,
        onFinally,
      })
    },
    [],
  )

  return {
    file,
    setFile,
    clearFile,
    resetRef,
    fileRevoke,
    setFileRevoke,
    clearRevokeFile,
    resetRevokeRef,
    withDownloadNotification,
  } as const
}
