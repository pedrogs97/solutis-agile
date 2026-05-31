import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import axios from '@/lib/axios'
import {
  downloadAssetTimeline,
  fetchHistoryLending,
} from '@/services/api/asset'
import { type AssetHistory } from '@/types/Asset'
import { getFilename } from '@/utils/getFilename'
import { openBlob } from '@/utils/openBlob'

export default function useContractHistory(id: string | null) {
  const [isOpenHistory, { open: openHistory, close: closeHistory }] =
    useDisclosure(false)
  const [contractHistoryToView, setContractHistoryToView] =
    useState<AssetHistory | null>(null)

  const {
    data: historyLending,
    isPending: isPendingHistoryLending,
    isError: isErrorHistoryLending,
  } = useQuery({
    queryKey: ['fetchHistoryLending', id],
    queryFn: fetchHistoryLending,
  })

  const onDownloadDocument = async (documentId: string) => {
    const idNotification = notifications.show({
      loading: true,
      title: 'Abrindo documento',
      message: 'Preparando o documento, aguarde um momento...',
      autoClose: false,
      withCloseButton: false,
    })
    try {
      const response = await axios.get(`/documents/download/${documentId}/`, {
        responseType: 'blob',
      })
      const filename = getFilename(response?.headers['content-disposition'])

      openBlob({
        blob: new Blob([response.data], {
          type: response.headers['content-type'] ?? 'application/octet-stream',
        }),
        filename,
        contentType: response.headers['content-type'],
        preferNewTab: true,
      })

      notifications.update({
        id: idNotification,
        loading: false,
        autoClose: 500,
        title: 'Documento aberto em nova aba',
        message: 'Documento aberto em nova aba',
        color: 'green',
      })
    } catch {
      notifications.update({
        id: idNotification,
        loading: false,
        autoClose: 500,
        title: 'Erro ao abrir documento',
        message: 'Ocorreu um erro ao abrir o documento',
        color: 'red',
      })
    }
  }

  return {
    historyLending,
    isPendingHistoryLending,
    isErrorHistoryLending,
    isOpenHistory,
    closeHistory,
    openHistory,
    contractHistoryToView,
    setContractHistoryToView,
    onDownloadDocument,
    downloadAssetTimeline,
  }
}
