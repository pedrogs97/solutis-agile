import { zodResolver } from '@hookform/resolvers/zod'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { AxiosError } from 'axios'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { useAbilityGuard } from '@/hooks/useAbilityGuard'
import { useDomainOptions } from '@/hooks/useDomainOptions'
import { useFormPersistence } from '@/hooks/useFormPersistence'
import { deriveSignerDefaults, useSignerEmails } from '@/hooks/useSignerEmails'
import axios from '@/lib/axios'
import { termSchema } from '@/lib/validations/lending'
import { addTerm } from '@/services/api/terms'
import { type ErrorResponse } from '@/types/ApiResponse'
import { getFilename } from '@/utils/getFilename'
import { openBlob } from '@/utils/openBlob'

import { fetchEmployeeSelect } from './../../services/api/employee'

interface IUseTermDetail {
  id?: string | null
}

type FormDataLendingTerm = z.infer<typeof termSchema>

export default function useTermDetail({ id }: Readonly<IUseTermDetail>) {
  const [activeTab, setActiveTab] = useState<string | null>('general-data')
  const queryClient = useQueryClient()
  const [canEdit, setCanEdit] = useState<boolean>(false)
  const [canDelete, setCanDelete] = useState(false)
  const navigate = useNavigate()
  const {
    principalSigner,
    employeeSigner,
    hydrateSigners,
    validateSigners,
    resetSigners,
  } = useSignerEmails()

  const { ability, isAbilityReady } = useAbilityGuard(
    (currentAbility) => {
      if (id && currentAbility.cannot('view', 'term')) {
        notifications.show({
          message:
            'Usuário não possui permissão "Visualizar Termo de Responsabilidade"',
        })
        navigate({ to: '/dashboard' })
        return
      }

      if (!id && currentAbility.cannot('add', 'term')) {
        notifications.show({
          message:
            'Usuário não possui permissão "Adicionar Termo de Responsabilidade"',
        })
        navigate({ to: '/dashboard' })
        return
      }

      setCanDelete(currentAbility.can('delete', 'term'))
      setCanEdit(currentAbility.can('edit', 'term'))
    },
    [id, navigate],
  )

  const [file, setFile] = useState<File | null>(null)
  const [fileRevoke, setFileRevoke] = useState<File | null>(null)
  const resetRef = useRef<(() => void) | null>(null)
  const resetRevokeRef = useRef<(() => void) | null>(null)

  const clearFile = () => {
    setFile(null)
    resetRef.current?.()
  }

  const clearRevokeFile = () => {
    setFileRevoke(null)
    resetRevokeRef.current?.()
  }

  const form = useForm<FormDataLendingTerm>({
    resolver: zodResolver(termSchema),
    defaultValues: {
      witnessesRevokeId: ['', ''],
    },
  })

  // Persistência do formulário no localStorage (apenas na criação)
  const formPersistence = useFormPersistence({
    form,
    key: id ? `term_edit_${id}` : 'term_create',
    enabled: !id, // Apenas para criação
    debounceMs: 1500,
  })

  const {
    costCenters,
    workloads,
    isLoading: domainLoading,
  } = useDomainOptions({ keys: ['costCenters', 'workloads'] })

  const isPendingCostCenters = domainLoading.costCenters
  const isPendingWorkloads = domainLoading.workloads

  const fetchLendingTerm = async () => {
    const { data } = await axios.get(`/terms/${id}/`)
    return data
  }

  const { data: lendingTermData } = useQuery({
    queryKey: ['fetchLendingTerm', id],
    queryFn: fetchLendingTerm,
    enabled: !!id,
  })

  useEffect(() => {
    if (!id) {
      return
    }

    form.reset({
      type: '',
      workloadId: '',
      employeeId: '',
      costCenterId: '',
      manager: '',
      observations: '',
      project: '',
      businessExecutive: '',
      location: '',
      description: '',
      value: null,
      quantity: null,
      size: null,
      lineNumber: null,
      operator: null,
      witnessesRevokeId: ['', ''],
    })
    resetSigners()
  }, [id, form, resetSigners])

  useEffect(() => {
    if (!lendingTermData) {
      return
    }

    const item = lendingTermData.item ?? {}

    form.reset({
      type: lendingTermData.type?.name ?? '',
      workloadId: lendingTermData.workload?.name ?? '',
      employeeId: lendingTermData.employee?.fullName ?? '',
      costCenterId: lendingTermData.costCenter?.name ?? '',
      manager: lendingTermData.manager ?? '',
      observations: lendingTermData.observations ?? '',
      project: lendingTermData.project ?? '',
      businessExecutive: lendingTermData.businessExecutive ?? '',
      location: lendingTermData.location ?? '',
      description: item.description ?? '',
      value:
        typeof item.value === 'number'
          ? item.value
          : item.value
            ? Number(item.value)
            : null,
      quantity:
        typeof item.quantity === 'number'
          ? item.quantity
          : item.quantity
            ? Number(item.quantity)
            : null,
      size: item.size ?? null,
      lineNumber: item.lineNumber ?? null,
      operator: item.operator ?? null,
      witnessesRevokeId: ['', ''],
    })

    hydrateSigners(
      deriveSignerDefaults({
        principalSigner: lendingTermData.principalSigner,
        managerEmail: lendingTermData.managerEmail,
        manager: lendingTermData.manager,
        employeeSigner: lendingTermData.employeeSigner,
        employeeEmail: lendingTermData.employeeEmail,
        employee: lendingTermData.employee,
      }),
    )
  }, [lendingTermData, hydrateSigners, form])

  const openConfirmAddTermModal = () =>
    modals.openConfirmModal({
      id: 'confirm-add-term-modal',
      size: 'lg',
      title: 'Confirmação de dados',
      children:
        'Deseja confirmar os dados e adicionar um novo termo de responsabilidade?',
      centered: true,
      labels: {
        confirm: 'Confirmar o envio e visualizar contrato',
        cancel: 'Cancelar e verificar informações',
      },
      onCancel: () => modals.close('confirm-add-term-modal'),
      onConfirm: () => form.handleSubmit(onSubmit)(),
    })

  const openConfirmModalDeleteTerm = () =>
    modals.openConfirmModal({
      id: 'confirm-delete-contract-modal',
      size: 'lg',
      title: 'Confirmação de exclusão',
      children: 'Deseja excluir o termo de responsabilidade?',
      centered: true,
      labels: {
        confirm: 'Confirmar exclusão',
        cancel: 'Cancelar exclusão',
      },
      onCancel: () => modals.close('confirm-delete-contract-modal'),
      onConfirm: () => mutateDeleteLendingTerm(),
    })

  const { mutate: mutateTermDocument } = useMutation({
    mutationKey: ['createLendingDocument'],
    mutationFn: async (term: any) => {
      if (!file) {
        const idNotification = notifications.show({
          loading: true,
          title: 'Abrindo contrato',
          message: 'Preparando o contrato, aguarde um momento...',
          autoClose: false,
          withCloseButton: false,
        })
        try {
          const response = await axios.post(
            '/documents/terms/create/',
            {
              termId: term.id,
              legalPerson: term.employee.legalPerson,
            },
            {
              responseType: 'blob',
            },
          )
          const filename = response.headers['content-disposition']
            .split('filename=')[1]
            .replace(/"/g, '')
          const blob = new Blob([response.data], {
            type: response.headers['content-type'] ?? 'application/pdf',
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
            title: 'Contrato aberto em nova aba',
            message: 'Contrato aberto em nova aba',
            color: 'green',
            autoClose: 5000,
          })
        } catch {
          notifications.update({
            id: idNotification,
            loading: false,
            autoClose: 500,
            title: 'Erro ao abrir arquivo',
            message: 'Não foi possível abrir o contrato',
            color: 'red',
          })
        }
      } else {
        const formData = new FormData()
        formData.append('termId', term.id)
        formData.append('file', file)

        await axios
          .post('/documents/terms/upload/', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          })
          .catch((err) => {
            if (err.response?.status === 413) {
              notifications.show({
                title: 'Atenção',
                message: 'Arquivo muito grande, máximo de 2MB',
                color: 'orange',
                autoClose: 5000,
              })
            }
          })
        notifications.show({
          title: 'Sucesso',
          message: 'Contrato de comodato enviado com sucesso',
          color: 'green',
          autoClose: 5000,
        })
      }
      formPersistence.clearStorage()
      navigate({ to: `/terms/edit/${term.id}` })
    },
    onError: (error: AxiosError<ErrorResponse[]>) => {
      const errors = error?.response?.data
      errors?.forEach(({ field, error }) => {
        form.setError(field as keyof FormDataLendingTerm, {
          type: 'custom',
          message: error,
        })
      })
      notifications.show({
        title: 'Erro',
        message: 'Não foi possível criar o termo de responsbilidade',
        color: 'red',
        autoClose: 5000,
      })
    },
  })

  const { mutate: mutateAddLendingTerm } = useMutation({
    mutationKey: ['addTerm'],
    mutationFn: addTerm,
    onSuccess: (data: any) => {
      mutateTermDocument(data)
    },
    onError: (error: AxiosError<ErrorResponse[]>) => {
      const errors = error?.response?.data
      errors?.forEach(({ field, error }) => {
        form.setError(field as keyof FormDataLendingTerm, {
          type: 'custom',
          message: error,
        })
      })
      notifications.show({
        title: 'Erro',
        message: 'Não foi possível criar o comodato',
        color: 'red',
        autoClose: 5000,
      })
    },
  })

  const { mutate: mutateEditLendingTerm } = useMutation({
    mutationKey: ['editLending'],
    mutationFn: async (data: any) => {
      const dataCleaned = {
        observations: data.observations,
        type: data.type,
      }
      const { data: response } = await axios.patch(
        `/terms/${lendingTermData.id}`,
        dataCleaned,
      )
      if (file) {
        const formData = new FormData()
        formData.append('termId', lendingTermData.id)
        formData.append('file', file)

        await axios
          .post('/documents/terms/upload/', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          })
          .then(() => {
            notifications.show({
              title: 'Sucesso',
              message: 'Termo de responsabilidade enviado com sucesso',
              color: 'green',
              autoClose: 5000,
            })
            clearFile()
          })
          .catch((err) => {
            if (err.response?.status === 413) {
              notifications.show({
                title: 'Atenção',
                message: 'Arquivo muito grande, máximo de 2MB',
                color: 'orange',
                autoClose: 5000,
              })
            }
          })
      }
      if (fileRevoke) {
        const formData = new FormData()
        formData.append('termId', lendingTermData.id)
        formData.append('file', fileRevoke)

        await axios
          .post('/documents/terms/revoke/upload/', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          })
          .then(() => {
            notifications.show({
              title: 'Sucesso',
              message: 'Distrato de comodato enviado com sucesso',
              color: 'green',
              autoClose: 5000,
            })
            clearRevokeFile()
          })
          .catch((err) => {
            if (err.response?.status === 413) {
              notifications.show({
                title: 'Atenção',
                message: 'Arquivo muito grande, máximo de 2MB',
                color: 'orange',
                autoClose: 5000,
              })
            }
          })
      }
      return response
    },
    onSuccess: () => {
      notifications.show({
        title: 'Termo de responsabilidade editado',
        message: 'O termo de responsabilidade foi editado com sucesso',
        color: 'blue',
      })
      queryClient.invalidateQueries({
        queryKey: ['fetchLendingTerm'],
      })
    },
    onError: (error: AxiosError<ErrorResponse[]>) => {
      const errors = error?.response?.data
      errors?.forEach(({ field, error }) => {
        form.setError(field as keyof FormDataLendingTerm, {
          type: 'custom',
          message: error,
        })
      })
      notifications.show({
        title: 'Erro',
        message: 'Não foi possível editar o termo de responsabilidade',
        color: 'red',
        autoClose: 5000,
      })
    },
  })

  const { mutate: mutateDeleteLendingTerm } = useMutation({
    mutationKey: ['deleteLending'],
    mutationFn: async () => {
      const { data: response } = await axios.delete(
        `/terms/${lendingTermData.id}/`,
      )
      return response
    },
    onSuccess: () => {
      notifications.show({
        title: 'Termo excluído',
        message: 'O termo foi excluído com sucesso',
        color: 'blue',
      })
      queryClient.invalidateQueries({
        queryKey: ['fetchLending'],
      })
      navigate({ to: '/terms' })
    },
    onError: (error: AxiosError<ErrorResponse[]>) => {
      const errors = error?.response?.data
      errors?.forEach(({ field, error }) => {
        form.setError(field as keyof FormDataLendingTerm, {
          type: 'custom',
          message: error,
        })
      })
      notifications.show({
        title: 'Erro',
        message: 'Não foi possível excluir o comodato',
        color: 'red',
        autoClose: 5000,
      })
    },
  })

  const onSubmit = (data: FormDataLendingTerm) => {
    if (id) {
      mutateEditLendingTerm(data)
    } else {
      mutateAddLendingTerm(data)
    }
  }

  const fetchEmployeeOptions = useCallback(
    async (query: string) => {
      if (!isAbilityReady) {
        return []
      }

      if (!id && ability.cannot('add', 'term')) {
        return []
      }

      return await fetchEmployeeSelect(query)
    },
    [ability, id, isAbilityReady],
  )

  const onDownloadLendingTerm = async () => {
    const idNotification = notifications.show({
      loading: true,
      title: 'Abrindo termo',
      message: 'Preparando o termo, aguarde um momento...',
      autoClose: false,
      withCloseButton: false,
    })
    try {
      const response = await axios.get(
        `/documents/download/${lendingTermData.document}/`,
        {
          responseType: 'blob',
        },
      )
      const contentDisposition = response?.headers['content-disposition']
      const filename = getFilename(contentDisposition)
      const blob = new Blob([response.data], {
        type: response.headers['content-type'] ?? 'application/pdf',
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
        title: 'Termo aberto em nova aba',
        message: 'Termo aberto em nova aba',
        color: 'blue',
      })
      queryClient.invalidateQueries({
        queryKey: ['fetchLendingTerm'],
      })
    } catch (error) {
      console.error(error)
      notifications.update({
        id: idNotification,
        loading: false,
        autoClose: 500,
        title: 'Erro ao abrir arquivo',
        message: 'Não foi possível abrir o termo',
        color: 'red',
      })
    }
  }

  const onTerminateLendingTerm = async () => {
    const witnessesRevokeId = form.getValues('witnessesRevokeId')
    const selectedWitnesses = Array.isArray(witnessesRevokeId)
      ? witnessesRevokeId.filter(
          (witness) => typeof witness === 'string' && witness.trim() !== '',
        )
      : []

    if (selectedWitnesses.length < 2) {
      form.setError('witnessesRevokeId', {
        type: 'custom',
        message: 'Necessário selecionar 2 testemunhas',
      })
      notifications.show({
        title: 'Informe as testemunhas',
        message: 'Selecione duas testemunhas antes de confirmar o distrato.',
        color: 'orange',
        autoClose: 5000,
      })
      return
    }

    form.clearErrors('witnessesRevokeId')

    const validation = validateSigners({
      onInvalid: () => {
        notifications.show({
          title: 'Informe os e-mails para o distrato',
          message:
            'Preencha o e-mail do gestor e do colaborador antes de confirmar o distrato.',
          color: 'orange',
          autoClose: 5000,
        })
      },
    })

    if (!validation.isValid) {
      return
    }

    const {
      principalSigner: trimmedPrincipalSigner,
      employeeSigner: trimmedEmployeeSigner,
    } = validation
    const witnessIdsAsIntegers = selectedWitnesses.map((id) => parseInt(id, 10))

    if (!lendingTermData?.id) return

    const idNotification = notifications.show({
      loading: true,
      title: 'Abrindo distrato',
      message: 'Preparando o distrato, aguarde um momento...',
      autoClose: false,
      withCloseButton: false,
    })
    try {
      const response = await axios.post(
        `/documents/terms/revoke/create/`,
        {
          termId: lendingTermData.id,
          principalSigner: trimmedPrincipalSigner,
          employeeSigner: trimmedEmployeeSigner,
          witnessesId: witnessIdsAsIntegers,
        },
        {
          responseType: 'blob',
        },
      )
      const filename = response?.headers['content-disposition']
        .split("filename*=utf-8''")[1]
        .replace(/"/g, '')
      const blob = new Blob([response.data], {
        type: response.headers['content-type'] ?? 'application/pdf',
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
        title: 'Distrato aberto em nova aba',
        message: 'Distrato aberto em nova aba',
        color: 'blue',
      })
      queryClient.invalidateQueries({
        queryKey: ['fetchLendingTerm'],
      })
    } catch (error) {
      const axiosError = error as AxiosError<any>
      let message = 'Não foi possível abrir o distrato'

      const responseData = axiosError.response?.data
      if (Array.isArray(responseData)) {
        const collected = responseData
          .map((item) => item?.msg || item?.message)
          .filter(Boolean)
        if (collected.length > 0) {
          message = collected.join(' \u2022 ')
        }
      } else if (
        responseData &&
        typeof responseData === 'object' &&
        'message' in responseData &&
        responseData.message
      ) {
        message = responseData.message as string
      }

      notifications.update({
        id: idNotification,
        loading: false,
        autoClose: 500,
        title: 'Erro ao abrir arquivo',
        message,
        color: 'red',
      })
    }
  }

  const onDownloadRevokeLendingTerm = async () => {
    const idNotification = notifications.show({
      loading: true,
      title: 'Abrindo distrato',
      message: 'Preparando o distrato, aguarde um momento...',
      autoClose: false,
      withCloseButton: false,
    })
    try {
      const response = await axios.get(
        `/documents/download/${lendingTermData.documentRevoke}/`,
        {
          responseType: 'blob',
        },
      )
      const blob = new Blob([response.data], {
        type: response.headers['content-type'] ?? 'application/pdf',
      })

      openBlob({
        blob,
        filename: getFilename(response.headers['content-disposition']),
        contentType: response.headers['content-type'],
        preferNewTab: true,
      })

      notifications.update({
        id: idNotification,
        loading: false,
        autoClose: 500,
        title: 'Distrato aberto em nova aba',
        message: 'Distrato aberto em nova aba',
        color: 'blue',
      })
      queryClient.invalidateQueries({
        queryKey: ['fetchLendingTerm'],
      })
    } catch {
      notifications.update({
        id: idNotification,
        loading: false,
        autoClose: 500,
        title: 'Erro ao abrir arquivo',
        message: 'Não foi possível abrir o distrato',
        color: 'red',
      })
    }
  }

  return {
    form,
    onSubmit,
    activeTab,
    setActiveTab,
    file,
    setFile,
    resetRef,
    clearFile,
    lendingTermData,
    onDownloadLendingTerm,
    fileRevoke,
    setFileRevoke,
    resetRevokeRef,
    clearRevokeFile,
    onDownloadRevokeLendingTerm,
    onTerminateLendingTerm,
    openConfirmAddTermModal,
    fetchEmployeeOptions,
    workloads,
    isPendingWorkloads,
    costCenters,
    isPendingCostCenters,
    canEdit,
    openConfirmModalDeleteTerm,
    canDelete,
    principalSigner,
    employeeSigner,

    // Draft persistence
    formPersistence,
  }
}
