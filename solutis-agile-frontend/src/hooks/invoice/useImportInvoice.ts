import { zodResolver } from '@hookform/resolvers/zod'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { AxiosError } from 'axios'
import { useRef, useState } from 'react'
import { type ErrorOption, useForm } from 'react-hook-form'
import { useDebounceValue } from 'usehooks-ts'
import { z } from 'zod'

import { useAbilityGuard } from '@/hooks/useAbilityGuard'
import axios from '@/lib/axios'
import { invoiceSchema } from '@/lib/validations/invoice'
import { fetchAssetsSelect } from '@/services/api/asset'
import { type ErrorResponse } from '@/types/ApiResponse'

type FormDataInvoice = z.infer<typeof invoiceSchema>

export default function useImportInvoice() {
  const [searchAssetValue, setSearchAssetValue] = useState<string>('')
  const [debouncedAssetValue] = useDebounceValue<string>(searchAssetValue, 400)
  const [file, setFile] = useState<File | null>(null)
  const resetRef = useRef<() => void>(null)
  const [errorFile, setErrorFile] = useState<boolean>(false)
  const navigate = useNavigate()

  const { ability, isAbilityReady } = useAbilityGuard(
    (currentAbility) => {
      if (currentAbility.cannot('add', 'invoice')) {
        notifications.show({
          message: 'Usuário não possui permissão "Adicionar Nota Fiscal"',
        })
        navigate({ to: '/dashboard' })
      }
    },
    [navigate],
  )

  const clearFile = () => {
    setFile(null)
    resetRef.current?.()
  }

  const form = useForm<FormDataInvoice>({
    resolver: zodResolver(invoiceSchema),
  })

  const { mutate: mutateCreateInvoice } = useMutation({
    mutationKey: ['createInvoice'],
    mutationFn: async (data: any) => {
      if (!file) {
        return
      }
      const assetsId = data.assetsId.map((asset: string) => parseInt(asset))
      return await axios
        .post('/invoice/invoices/', {
          number: data.number,
          assetsId,
        })
        .then(async (response) => {
          const formData = new FormData()
          formData.append('invoice_file', file)
          formData.append('invoice', response.data?.id)
          await axios.post('/invoice/invoices/document/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          })
          return response
        })
    },
    onSuccess: () => {
      notifications.show({
        title: 'Sucesso',
        message: 'Nota fiscal criada com sucesso',
        color: 'green',
        autoClose: 5000,
      })
      navigate({ to: '/invoices' })
    },
    onError: (error: AxiosError<ErrorResponse[]>) => {
      const errors = error?.response?.data
      errors?.forEach(({ field, error }) => {
        form.setError(field as keyof FormDataInvoice, error as ErrorOption)
      })
      notifications.show({
        title: 'Erro',
        message: 'Não foi possível importar a nota fiscal',
        color: 'red',
        autoClose: 5000,
      })
    },
  })

  const openConfirmModal = () =>
    modals.openConfirmModal({
      id: 'confirm-import-invoice-modal',
      title: 'Confirmação de dados',
      children: 'Deseja confirmar os dados e importar uma nova nota fiscal?',
      centered: true,
      labels: { confirm: 'Confirmar', cancel: 'Cancelar' },
      onCancel: () => modals.close('confirm-import-invoice-modal'),
      onConfirm: () => form.handleSubmit(onSubmit)(),
    })

  const onSubmit = (data: FormDataInvoice) => {
    mutateCreateInvoice(data)
  }

  const { data: assets, isPending: isPendingAssets } = useQuery({
    queryKey: ['fetchAssets', debouncedAssetValue],
    queryFn: fetchAssetsSelect,
    enabled: isAbilityReady && ability.can('add', 'invoice'),
  })

  return {
    assets,
    isPendingAssets,
    setSearchAssetValue,
    file,
    setFile,
    resetRef,
    clearFile,
    form,
    openConfirmModal,
    onSubmit,
    errorFile,
    setErrorFile,
  }
}
