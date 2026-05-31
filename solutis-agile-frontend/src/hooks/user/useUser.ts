import { zodResolver } from '@hookform/resolvers/zod'
import { useDisclosure } from '@mantine/hooks'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { useMutation, useQueries, useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useCallback, useState } from 'react'
import type { Resolver } from 'react-hook-form'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import type { Option } from '@/components/common/async-select'
import { useAbilityGuard } from '@/hooks/useAbilityGuard'
import { useSubmittingMutation } from '@/hooks/useSubmittingMutation'
import { userSchema } from '@/lib/validations/user'
import { fetchEmployeeSelect } from '@/services/api/employee'
import {
  addUser,
  editUser,
  fetchGroups,
  fetchUser,
  fetchUsers,
  sendResetPasswordEmail,
} from '@/services/api/user'

import usePagination from '../usePagination'

interface FormFilter {
  employee__full_name__ilike?: string
  page?: number
  size?: string
}

interface IUseUser {
  searchParams?: FormFilter
  id?: string
  isDetail?: boolean
}

export type FormDataUser = z.infer<typeof userSchema>

export default function useUser({
  searchParams,
  id,
  isDetail,
}: Readonly<IUseUser>) {
  const [filterOpened, { toggle: toggleFilter }] = useDisclosure(false)
  const [canEdit, setCanEdit] = useState<boolean>(false)
  const [employeeInitialOptions, setEmployeeInitialOptions] = useState<
    Option[]
  >([])
  const navigate = useNavigate()

  const { ability, isAbilityReady } = useAbilityGuard(
    (currentAbility) => {
      if (
        (!isDetail && currentAbility.cannot('view', 'user')) ||
        (id && currentAbility.cannot('view', 'user'))
      ) {
        notifications.show({
          message: 'Usuário não possui permissão "Visualizar Usuários"',
        })
        navigate({ to: '/dashboard' })
        return
      }

      if (isDetail && !id && currentAbility.cannot('add', 'user')) {
        notifications.show({
          message: 'Usuário não possui permissão "Adicionar Usuários"',
        })
        navigate({ to: '/users' })
        return
      }

      setCanEdit(currentAbility.can('edit', 'user'))
    },
    [id, isDetail, navigate],
  )

  const fetchEmployeeOptions = useCallback(
    async (query: string) => {
      if (!isAbilityReady) {
        return []
      }

      if (isDetail && !id && ability.cannot('add', 'user')) {
        return []
      }

      return await fetchEmployeeSelect(query)
    },
    [ability, id, isAbilityReady, isDetail],
  )

  const formFilter = useForm<FormFilter>({
    defaultValues: {
      employee__full_name__ilike: searchParams?.employee__full_name__ilike,
      page: searchParams?.page,
      size: searchParams?.size,
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
    invalidateQueryKey: 'fetchUsers',
  })

  const form = useForm<FormDataUser>({
    resolver: zodResolver(userSchema) as Resolver<FormDataUser>,
    mode: 'onSubmit',
  })

  const { data, isPending, error } = useQuery({
    queryKey: [
      'fetchUsers',
      {
        ...filters,
        page: page,
        size: pageSize,
      },
    ],
    queryFn: fetchUsers,
  })

  const fetchUserData = async () => {
    const data = await fetchUser(id!)
    form.setValue('username', data.username)
    form.setValue('email', data.email)
    form.setValue('manager', data.manager)
    form.setValue('department', data.department)
    const employeeId = data.employee?.id ?? data.employeeId
    const employeeLabel =
      data.employee?.fullName ??
      data.employeeFullName ??
      data.fullName ??
      data.employee_name ??
      ''

    form.setValue('employeeId', employeeId ? employeeId.toString() : '')
    form.setValue('groupId', data.group?.id ? data.group.id.toString() : '')
    form.setValue('isActive', Boolean(data.isActive))
    form.setValue('isStaff', data.isStaff)

    if (employeeId) {
      setEmployeeInitialOptions([
        {
          value: employeeId.toString(),
          label: employeeLabel || data.username || '',
        },
      ])
    } else {
      setEmployeeInitialOptions([])
    }
    return data
  }

  const openConfirmEditModal = (data: FormDataUser) =>
    modals.openConfirmModal({
      id: 'confirm-edit-user-modal',
      title: 'Confirmação de dados',
      children: 'Deseja confirmar os dados e editar o usuário?',
      centered: true,
      labels: { confirm: 'Confirmar', cancel: 'Cancelar' },
      onCancel: () => modals.close('confirm-edit-user-modal'),
      onConfirm: () => mutateEditUser(data),
    })

  const openConfirmAddModal = (data: FormDataUser) =>
    modals.openConfirmModal({
      id: 'confirm-add-user-modal',
      title: 'Confirmação de dados',
      children: 'Deseja confirmar os dados e adicionar um novo usuário?',
      centered: true,
      labels: { confirm: 'Confirmar', cancel: 'Cancelar' },
      onCancel: () => modals.close('confirm-add-user-modal'),
      onConfirm: () => mutateAddUser(data),
    })

  const [
    { data: groups, isPending: isPendingGroups, error: errorGroups },
    { data: _ },
  ] = useQueries({
    queries: [
      {
        queryKey: ['fetchGroups'],
        queryFn: fetchGroups,
        enabled: !!isDetail,
      },
      {
        queryKey: ['fetchUser'],
        queryFn: () => fetchUserData(),
        enabled: !!isDetail && !!id,
      },
    ],
  })

  const { mutate: mutateAddUser, isPending: isPendingAddUser } =
    useSubmittingMutation({
      mutationKey: ['addUser'],
      mutationFn: addUser,
      form,
      successMessage: 'Usuário criado com sucesso',
      errorMessage: 'Não foi possível criar o usuário',
      onSuccess: () => {
        navigate({ to: '/users' })
      },
    })

  const { mutate: mutateEditUser, isPending: isPendingEditUser } =
    useSubmittingMutation({
      mutationKey: ['editUser'],
      mutationFn: (data: FormDataUser) => editUser(id!, data),
      form,
      successMessage: 'Usuário editado com sucesso',
      errorMessage: 'Não foi possível editar o usuário',
      onSuccess: () => {
        navigate({ to: '/users' })
      },
    })

  const {
    mutate: mutateSendResetPasswordEmail,
    isPending: isPendingSendResetPasswordEmail,
  } = useMutation({
    mutationKey: ['resetPassword'],
    mutationFn: (userId: string) => sendResetPasswordEmail(userId),
    onSuccess: () => {
      notifications.show({
        title: 'Sucesso',
        message: 'Nova senha enviada com sucesso para o e-mail do usuário',
        color: 'green',
        autoClose: 5000,
      })
    },
    onError: () => {
      notifications.show({
        title: 'Erro',
        message:
          'Não foi possível enviar o e-mail de com a nova senha para o usuário',
        color: 'red',
        autoClose: 5000,
      })
    },
  })

  const onSendResetPasswordEmail = () => {
    mutateSendResetPasswordEmail(id!)
  }

  const onSubmit = async (data: FormDataUser) => {
    if (Object.keys(form.formState.errors).length > 0) {
      return
    }
    if (id) {
      openConfirmEditModal(data)
    } else {
      openConfirmAddModal(data)
    }
  }

  return {
    page,
    filterOpened,
    toggleFilter,
    data,
    isPending,
    error,
    formFilter,
    onPageChange,
    onSearch,
    onClearFilters,
    pageSize,
    onPageSizeChange,
    form,
    onSubmit,
    openConfirmAddModal,
    openConfirmEditModal,
    onSendResetPasswordEmail,
    isLoading:
      isPendingAddUser || isPendingEditUser || isPendingSendResetPasswordEmail,
    groups,
    isPendingGroups,
    errorGroups,
    canEdit,
    fetchEmployeeOptions,
    employeeInitialOptions,
  }
}
