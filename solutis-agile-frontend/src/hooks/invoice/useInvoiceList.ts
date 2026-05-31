import { useDisclosure } from '@mantine/hooks'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { useAbilityGuard } from '@/hooks/useAbilityGuard'
import axios from '@/lib/axios'
import { deleteInvoice, fetchInvoices } from '@/services/api/invoice'
import { type Invoice } from '@/types/Invoice'
import { downloadFile } from '@/utils/downloadFile'

import usePagination from '../usePagination'

interface FormFilter {
  search?: string
  page?: number
  size?: string
  number__ilike?: string
}

interface IUseInvoiceProps {
  searchParams: FormFilter
}

export default function useInvoiceList({
  searchParams,
}: Readonly<IUseInvoiceProps>) {
  const [filterOpened, { toggle: toggleFilter }] = useDisclosure(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [invoiceDetail, setInvoiceDetail] = useState<Invoice | null>(null)
  const [
    modalDetailOpened,
    { open: openDetailModal, close: closeDetailModal },
  ] = useDisclosure()
  useAbilityGuard(
    (currentAbility) => {
      if (currentAbility.cannot('view', 'invoice')) {
        notifications.show({
          message: 'Usuário não possui permissão "Visualizar Notas Fiscais"',
        })
        navigate({ to: '/dashboard' })
      }
    },
    [navigate],
  )

  const formFilter = useForm<FormFilter>({
    defaultValues: {
      search: searchParams?.search,
      page: searchParams?.page,
      size: searchParams?.size,
      number__ilike: searchParams?.number__ilike ?? '',
    },
  })

  const {
    page,
    onPageChange,
    onSearch,
    filters,
    onClearFilters,
    pageSize,
    onPageSizeChange,
  } = usePagination({
    searchParams,
    formFilter,
    invalidateQueryKey: 'fetchInvoices',
  })

  const { isPending, error, data } = useQuery({
    queryKey: [
      'fetchInvoices',
      {
        ...filters,
        page: page,
        size: pageSize,
      },
    ],
    queryFn: fetchInvoices,
  })

  const { mutate: mutateDeleteInvoice } = useMutation({
    mutationKey: ['deleteInvoice'],
    mutationFn: deleteInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          'fetchInvoices',
          {
            ...filters,
            page: page,
            size: pageSize,
          },
        ],
      })
      closeDetailModal()
      setInvoiceDetail(null)
      notifications.show({
        title: 'Sucesso',
        message: 'Nota fiscal excluída com sucesso',
        color: 'green',
        autoClose: 5000,
      })
    },
  })

  const { mutate: onDownloadDocument } = useMutation({
    mutationKey: ['downloadDocument'],
    mutationFn: async (documentId: string) => {
      return await axios.get(`/documents/download/${documentId}/`, {
        responseType: 'blob',
      })
    },
    onSuccess: (response) => {
      downloadFile(response)
    },
    onError: (_error) => {
      notifications.show({
        title: 'Erro',
        message: 'Não foi possível abrir o documento',
        color: 'red',
        autoClose: 5000,
      })
    },
  })

  const openConfirmDeleteModal = (id: string) =>
    modals.openConfirmModal({
      id: 'confirm-delete-invoice-modal',
      title: 'Exclusão de nota fiscal',
      children: 'Deseja confirmar a exclusão da nota fiscal?',
      centered: true,
      labels: { confirm: 'Confirmar', cancel: 'Cancelar' },
      onCancel: () => modals.close('confirm-delete-invoice-modal'),
      onConfirm: () => mutateDeleteInvoice(id),
    })

  const downloadInvoice = async (id: string) => {
    try {
      notifications.show({
        title: 'Abrindo documento',
        message: 'Preparando o documento, aguarde um momento...',
        color: 'blue',
        autoClose: false,
        withCloseButton: false,
      })
      const response = await axios.get(`/invoice/download/${id}/`, {
        responseType: 'blob',
      })
      downloadFile(response)
    } catch (error) {
      console.error(error)
      notifications.show({
        title: 'Erro',
        message: 'Não foi possível abrir a nota fiscal',
        color: 'red',
        autoClose: 5000,
      })
    }
    setTimeout(() => {
      notifications.clean()
    }, 5000)
  }

  return {
    filterOpened,
    toggleFilter,
    formFilter,
    page,
    onPageChange,
    onSearch,
    onClearFilters,
    pageSize,
    onPageSizeChange,
    isPending,
    error,
    data,
    invoiceDetail,
    setInvoiceDetail,
    modalDetailOpened,
    openDetailModal,
    closeDetailModal,
    openConfirmDeleteModal,
    downloadInvoice,
    onDownloadDocument,
  }
}
