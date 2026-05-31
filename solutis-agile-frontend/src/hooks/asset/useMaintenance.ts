import { zodResolver } from '@hookform/resolvers/zod'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { useCallback, useMemo, useRef, useState } from 'react'
import { type DefaultValues, useForm } from 'react-hook-form'
import { z } from 'zod'

import axios from '@/lib/axios'
import { maintenanceSchema } from '@/lib/validations/asset'
import {
  addMaintenance,
  fetchHistoryMaintenance,
  fetchMaintenanceActions,
  updateMaintenance,
  uploadAttachments,
} from '@/services/api/maintenance'
import { type ErrorResponse } from '@/types/ApiResponse'
import { type AssetMaintenance } from '@/types/Asset'
import { getFilename } from '@/utils/getFilename'
import { openBlob } from '@/utils/openBlob'

export type FormDataMaintenance = z.infer<typeof maintenanceSchema>

export default function useMaintenance(id: string | null) {
  const [idToEdit, setIdToEdit] = useState<number | null>(null)
  const [
    isOpenedAddMaintenance,
    { open: openAddMaintenance, close: closeAddMaintenance },
  ] = useDisclosure(false)
  const [
    isOpenedEditMaintenance,
    { open: openEditMaintenance, close: closeEditMaintenance },
  ] = useDisclosure(false)
  const resetRef = useRef<() => void>(null)
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([])
  const [currentAttachmentFiles, setCurrentAttachmentFiles] = useState<[]>([])
  const queryClient = useQueryClient()

  const maintenanceDefaultValues = useMemo<DefaultValues<FormDataMaintenance>>(
    () => ({
      assetId: id,
      actionId: '',
      glpiNumber: '',
      openDateGlpi: '',
      openDateSupplier: '',
      supplierNumber: '',
      supplierServiceOrder: '',
      incidentDescription: '',
      resolution: '',
      employeeId: '',
      close: false,
      inProgress: false,
      value: 0,
      criticalityId: '',
      hasAssurance: false,
    }),
    [id],
  )

  const formMaintenance = useForm<FormDataMaintenance>({
    resolver: zodResolver(maintenanceSchema) as any,
    mode: 'onChange',
    defaultValues: maintenanceDefaultValues,
  })

  const resetMaintenanceForm = useCallback(() => {
    formMaintenance.reset(maintenanceDefaultValues)
  }, [formMaintenance, maintenanceDefaultValues])

  const {
    data: maintenanceActions,
    isPending: isPendingMaintenanceActions,
    isError: isErrorMaintenanceActions,
  } = useQuery({
    queryKey: ['fetchMaintenanceActions'],
    queryFn: fetchMaintenanceActions,
    enabled: !!id,
  })

  const {
    mutateAsync: mutateAsyncUploadAttachments,
    isPending: isPendingUploadAttachments,
  } = useMutation({
    mutationKey: ['uploadAttachments'],
    mutationFn: (id: string) => {
      return uploadAttachments(id, attachmentFiles)
    },
  })

  const { mutate: mutateAddMaintenance, isPending: isPendingAddMaintenance } =
    useMutation({
      mutationKey: ['addMaintenance'],
      mutationFn: addMaintenance,
      onSuccess: async (data: AssetMaintenance) => {
        if (attachmentFiles.length > 0) {
          try {
            await mutateAsyncUploadAttachments(data.id?.toString())
            setAttachmentFiles([])
          } catch {
            notifications.show({
              title: 'Erro',
              message: 'Não foi possível enviar os anexos da manutenção',
              color: 'red',
              autoClose: 5000,
            })
          }
        }
        resetMaintenanceForm()
        queryClient.invalidateQueries({
          queryKey: ['fetchHistoryMaintenance'],
        })
        notifications.show({
          title: 'Sucesso',
          message: 'Manutenção criada com sucesso',
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
        closeAddMaintenance()
      },
      onError: (error: AxiosError<ErrorResponse[]>) => {
        const errors = error?.response?.data
        errors?.forEach(({ field, error }) => {
          formMaintenance.setError(field as keyof FormDataMaintenance, {
            type: 'custom',
            message: error,
          })
        })
        notifications.show({
          title: 'Erro',
          message: 'Não foi possível criar a manutenção',
          color: 'red',
          autoClose: 5000,
        })
      },
    })

  const { mutate: mutateEditMaintenance, isPending: isPendingEditMaintenance } =
    useMutation({
      mutationKey: ['updateMaintenance'],
      mutationFn: (data) => updateMaintenance(data, idToEdit!),
      onSuccess: async (data: AssetMaintenance) => {
        if (attachmentFiles.length > 0) {
          try {
            await mutateAsyncUploadAttachments(data.id?.toString())
            setAttachmentFiles([])
          } catch {
            notifications.show({
              title: 'Erro',
              message: 'Não foi possível enviar os anexos da manutenção',
              color: 'red',
              autoClose: 5000,
            })
          }
        }
        resetMaintenanceForm()
        queryClient.invalidateQueries({
          queryKey: ['fetchHistoryMaintenance'],
        })
        notifications.show({
          title: 'Sucesso',
          message: 'Manutenção atualizada com sucesso',
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
        closeEditMaintenance()
      },
      onError: (error: AxiosError<ErrorResponse[]>) => {
        const errors = error?.response?.data
        errors?.forEach(({ field, error }) => {
          formMaintenance.setError(field as keyof FormDataMaintenance, {
            type: 'custom',
            message: error,
          })
        })
        notifications.show({
          title: 'Erro',
          message: 'Não foi possível atualizar a manutenção',
          color: 'red',
          autoClose: 5000,
        })
      },
    })

  const onSubmit = formMaintenance.handleSubmit((data: any) => {
    data.assetId = id
    if (idToEdit) {
      mutateEditMaintenance(data)
    } else {
      mutateAddMaintenance(data)
    }
  })

  const {
    data: historyMaintenance,
    isPending: isPendingHistoryMaintenance,
    isError: isErrorHistoryMaintenance,
    fetchNextPage: fetchNextPageHistoryMaintenance,
    hasNextPage: hasNextPageHistoryMaintenance,
    isFetching: isFetchingHistoryMaintenance,
    isFetchingNextPage: isFetchingNextPageHistoryMaintenance,
  } = useInfiniteQuery({
    queryKey: ['fetchHistoryMaintenance'],
    queryFn: (params) =>
      fetchHistoryMaintenance({ id: id!, pageParam: params.pageParam }),
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
        `/maintenances/attachments/download/${id}/`,
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
        color: 'green',
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
    historyMaintenance,
    isPendingHistoryMaintenance,
    isErrorHistoryMaintenance,
    fetchNextPageHistoryMaintenance,
    hasNextPageHistoryMaintenance,
    isFetchingHistoryMaintenance,
    isFetchingNextPageHistoryMaintenance,
    isOpenedAddMaintenance,
    openAddMaintenance,
    closeAddMaintenance,
    isOpenedEditMaintenance,
    openEditMaintenance,
    closeEditMaintenance,
    setIdToEdit,
    formMaintenance,
    onSubmit,
    isPendingOnSubmit:
      isPendingAddMaintenance ||
      isPendingEditMaintenance ||
      isPendingUploadAttachments,
    onDownloadAttachment,
    maintenanceActions,
    isPendingMaintenanceActions,
    isErrorMaintenanceActions,
    resetRef,
    attachmentFiles,
    setAttachmentFiles,
    currentAttachmentFiles,
    setCurrentAttachmentFiles,
    resetMaintenanceForm,
  }
}
