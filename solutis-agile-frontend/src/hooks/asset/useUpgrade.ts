import { zodResolver } from '@hookform/resolvers/zod'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import axios from '@/lib/axios'
import { upgradeSchema } from '@/lib/validations/asset'
import {
  addUpgrade,
  fetchHistoryUpgrade,
  updateUpgrade,
  uploadAttachments,
} from '@/services/api/upgrade'
import { type ErrorResponse } from '@/types/ApiResponse'
import { type AssetUpgrade } from '@/types/Asset'
import { getFilename } from '@/utils/getFilename'
import { openBlob } from '@/utils/openBlob'

export type FormDataUpgrade = z.infer<typeof upgradeSchema>

export default function useUpgrade(id: string | null) {
  const [idToEdit, setIdToEdit] = useState<number | null>(null)
  const [isOpenedAddUpgrade, { open: openAddUpgrade, close: closeAddUpgrade }] =
    useDisclosure(false)
  const [
    isOpenedEditUpgrade,
    { open: openEditUpgrade, close: closeEditUpgrade },
  ] = useDisclosure(false)
  const queryClient = useQueryClient()
  const resetRef = useRef<() => void>(null)
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([])
  const [currentAttachmentFiles, setCurrentAttachmentFiles] = useState<[]>([])

  const formUpgrade = useForm<FormDataUpgrade>({
    resolver: zodResolver(upgradeSchema),
    mode: 'onChange',
  })

  const { mutateAsync: mutateAsyncUploadAttachments } = useMutation({
    mutationKey: ['uploadAttachments'],
    mutationFn: (id: string) => {
      return uploadAttachments(id, attachmentFiles)
    },
  })

  const { mutate: mutateAddUpgrade } = useMutation({
    mutationKey: ['addUpgrade'],
    mutationFn: addUpgrade,
    onSuccess: async (data: AssetUpgrade) => {
      if (attachmentFiles.length > 0) {
        try {
          await mutateAsyncUploadAttachments(data.id?.toString())
          setAttachmentFiles([])
        } catch {
          notifications.show({
            title: 'Erro',
            message: 'Não foi possível enviar os anexos da melhoria',
            color: 'red',
            autoClose: 5000,
          })
        }
      }
      formUpgrade.reset()
      queryClient.invalidateQueries({
        queryKey: ['fetchHistoryUpgrade'],
      })
      notifications.show({
        title: 'Sucesso',
        message: 'Melhoria criada com sucesso',
        color: 'green',
        autoClose: 5000,
      })
      if (attachmentFiles.length > 0) {
        notifications.show({
          title: 'Sucesso',
          message: 'Anexos enviados com sucesso',
          color: 'green',
          autoClose: 5000,
        })
      }
      closeAddUpgrade()
    },
    onError: (error: AxiosError<ErrorResponse[]>) => {
      const errors = error?.response?.data
      errors?.forEach(({ field, error }) => {
        formUpgrade.setError(field as keyof FormDataUpgrade, {
          type: 'custom',
          message: error,
        })
      })
      notifications.show({
        title: 'Erro',
        message: 'Não foi possível criar a melhoria',
        color: 'red',
        autoClose: 5000,
      })
    },
  })

  const { mutate: mutateEditUpgrade } = useMutation({
    mutationKey: ['updateUpgrade'],
    mutationFn: (data) => updateUpgrade(data, idToEdit!),
    onSuccess: async (data: AssetUpgrade) => {
      if (attachmentFiles.length > 0) {
        try {
          await mutateAsyncUploadAttachments(data.id?.toString())
          setAttachmentFiles([])
        } catch {
          notifications.show({
            title: 'Erro',
            message: 'Não foi possível enviar os anexos da melhoria',
            color: 'red',
            autoClose: 5000,
          })
        }
      }
      formUpgrade.reset()
      queryClient.invalidateQueries({
        queryKey: ['fetchHistoryUpgrade'],
      })
      notifications.show({
        title: 'Sucesso',
        message: 'Melhoria atualizada com sucesso',
        color: 'green',
        autoClose: 5000,
      })
      if (attachmentFiles.length > 0) {
        notifications.show({
          title: 'Sucesso',
          message: 'Anexos enviados com sucesso',
          color: 'green',
          autoClose: 5000,
        })
      }
      closeEditUpgrade()
    },
    onError: (error: AxiosError<ErrorResponse[]>) => {
      const errors = error?.response?.data
      errors?.forEach(({ field, error }) => {
        formUpgrade.setError(field as keyof FormDataUpgrade, {
          type: 'custom',
          message: error,
        })
      })
      notifications.show({
        title: 'Erro',
        message: 'Não foi possível atualizar a melhoria',
        color: 'red',
        autoClose: 5000,
      })
    },
  })

  const onSubmit = formUpgrade.handleSubmit((data: any) => {
    data.assetId = id
    if (idToEdit) {
      mutateEditUpgrade(data)
    } else {
      mutateAddUpgrade(data)
    }
  })

  const {
    data: historyUpgrade,
    isPending: isPendingHistoryUpgrade,
    isError: isErrorHistoryUpgrade,
    fetchNextPage: fetchNextPageHistoryUpgrade,
    hasNextPage: hasNextPageHistoryUpgrade,
    isFetching: isFetchingHistoryUpgrade,
    isFetchingNextPage: isFetchingNextPageHistoryUpgrade,
  } = useInfiniteQuery({
    queryKey: ['fetchHistoryUpgrade'],
    queryFn: (params) =>
      fetchHistoryUpgrade({ id: id!, pageParam: params.pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _allPages) => {
      if (lastPage.page === lastPage.pages) {
        return undefined
      }
      return lastPage.page + 1
    },
  })

  const onDownloadAttachment = async (id: string) => {
    const idNotification = notifications.show({
      loading: true,
      title: 'Abrindo anexo',
      message: 'Preparando o anexo, aguarde um momento...',
      autoClose: false,
      withCloseButton: false,
    })
    try {
      const response = await axios.get(
        `/maintenances-upgrade/attachments/download/${id}/`,
        {
          responseType: 'blob',
        },
      )
      const filename = getFilename(response?.headers['content-disposition'])

      const blob = new Blob([response.data], {
        type: response.headers['content-type'] ?? 'application/octet-stream',
      })

      openBlob({
        blob,
        filename,
        contentType: response.headers['content-type'],
        preferNewTab: true,
      })

      notifications.update({
        id: idNotification,
        loading: false,
        autoClose: 500,
        title: 'Anexo aberto em nova aba',
        message: 'Anexo aberto em nova aba',
        color: 'blue',
      })
    } catch {
      notifications.update({
        id: idNotification,
        loading: false,
        autoClose: 500,
        title: 'Erro ao abrir arquivo',
        message: 'Ocorreu um erro ao abrir o arquivo',
        color: 'red',
      })
    }
  }

  return {
    historyUpgrade,
    isPendingHistoryUpgrade,
    isErrorHistoryUpgrade,
    fetchNextPageHistoryUpgrade,
    hasNextPageHistoryUpgrade,
    isFetchingHistoryUpgrade,
    isFetchingNextPageHistoryUpgrade,
    isOpenedAddUpgrade,
    openAddUpgrade,
    closeAddUpgrade,
    isOpenedEditUpgrade,
    openEditUpgrade,
    closeEditUpgrade,
    setIdToEdit,
    formUpgrade,
    onSubmit,
    onDownloadAttachment,
    resetRef,
    attachmentFiles,
    setAttachmentFiles,
    currentAttachmentFiles,
    setCurrentAttachmentFiles,
  }
}
