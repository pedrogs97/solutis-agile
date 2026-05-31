import { zodResolver } from '@hookform/resolvers/zod'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { AxiosError } from 'axios'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { useAbilityGuard } from '@/hooks/useAbilityGuard'
import axios from '@/lib/axios'
import { translateAction, translateModel } from '@/lib/utils'
import { groupSchema } from '@/lib/validations/group'
import {
  editGroup,
  fetchGroup,
  fetchPermissions,
} from '@/services/api/groups-and-permissions'
import { type ErrorResponse } from '@/types/ApiResponse'
import { type Permission } from '@/types/Auth'

type FormDataGroup = z.infer<typeof groupSchema>

interface IUseGroupsAndPermissionsDetailProps {
  id?: string | null
}

export default function useGroupsAndPermissionsDetail({
  id,
}: Readonly<IUseGroupsAndPermissionsDetailProps>) {
  const [canEdit, setCanEdit] = useState(false)
  const navigate = useNavigate()

  const form = useForm<FormDataGroup>({
    resolver: zodResolver(groupSchema),
  })

  const loadGroup = async () => {
    if (!id) return
    const data = await fetchGroup(id)
    form.reset({
      name: data.name,
      permissions: data.permissions.map(
        (permission: Permission) => permission.id,
      ),
    })
    return data
  }

  const { isPending: isFetchingGroup } = useQuery({
    queryKey: ['fetchGroup'],
    queryFn: () => loadGroup(),
    enabled: !!id,
  })

  const { data: dataPermissions, isPending: isFetchingPermissions } = useQuery({
    queryKey: ['fetchPermissions'],
    queryFn: fetchPermissions,
  })

  useAbilityGuard(
    (currentAbility) => {
      if (isFetchingGroup || isFetchingPermissions) {
        return
      }

      if (id && currentAbility.cannot('view', 'group')) {
        notifications.show({
          message: 'Usuário não possui permissão "Visualizar Grupo"',
        })
        navigate({ to: '/dashboard' })
        return
      }

      if (id && currentAbility.cannot('view', 'permission')) {
        notifications.show({
          message: 'Usuário não possui permissão "Visualizar Permissão"',
        })
        navigate({ to: '/dashboard' })
        return
      }

      if (!id && currentAbility.cannot('add', 'group')) {
        notifications.show({
          message: 'Usuário não possui permissão "Criar Grupo"',
        })
        navigate({ to: '/dashboard' })
        return
      }

      setCanEdit(currentAbility.can('edit', 'group'))
    },
    [id, isFetchingGroup, isFetchingPermissions, navigate],
  )

  const { mutate: mutateEditGroup } = useMutation({
    mutationKey: ['createGroup'],
    mutationFn: (data: FormDataGroup) => editGroup(id!, data),
    onSuccess: () => {
      notifications.show({
        title: 'Sucesso',
        message: 'Grupo editado com sucesso',
        color: 'green',
        autoClose: 5000,
      })
      navigate({ to: '/groups-and-permissions' })
    },
    onError: (error: AxiosError<ErrorResponse[]>) => {
      const errors = error?.response?.data
      errors?.forEach(({ field, error }) => {
        form.setError(field as keyof FormDataGroup, {
          type: 'custom',
          message: error,
        })
      })
      notifications.show({
        title: 'Erro',
        message: 'Não foi possível editar o grupo',
        color: 'red',
        autoClose: 5000,
      })
    },
  })

  const addGroup = (form: FormDataGroup) => {
    const response = axios.post('/auth/groups/', form)
    return response
  }

  const { mutate: mutateAddGroup } = useMutation({
    mutationKey: ['createGroup'],
    mutationFn: addGroup,
    onSuccess: () => {
      notifications.show({
        title: 'Sucesso',
        message: 'Grupo criado com sucesso',
        color: 'green',
        autoClose: 5000,
      })
      navigate({ to: '/groups-and-permissions' })
    },
    onError: (error: AxiosError<ErrorResponse[]>) => {
      const errors = error?.response?.data
      errors?.forEach(({ field, error }) => {
        form.setError(field as keyof FormDataGroup, {
          type: 'custom',
          message: error,
        })
      })
      notifications.show({
        title: 'Erro',
        message: 'Não foi possível criar o grupo',
        color: 'red',
        autoClose: 5000,
      })
    },
  })

  const openConfirmEditGroupModal = (data: FormDataGroup) =>
    modals.openConfirmModal({
      id: 'confirm-edit-gp-modal',
      title: 'Confirmação de dados',
      children: 'Deseja confirmar os dados e editar este grupo?',
      centered: true,
      labels: { confirm: 'Confirmar', cancel: 'Cancelar' },
      onCancel: () => modals.close('confirm-edit-gp-modal'),
      onConfirm: () => mutateEditGroup(data),
    })

  const openConfirmAddGroupModal = (data: FormDataGroup) =>
    modals.openConfirmModal({
      id: 'confirm-add-gp-modal',
      title: 'Confirmação de dados',
      children: 'Deseja confirmar os dados e adicionar um novo grupo?',
      centered: true,
      labels: { confirm: 'Confirmar', cancel: 'Cancelar' },
      onCancel: () => modals.close('confirm-add-gp-modal'),
      onConfirm: () => mutateAddGroup(data),
    })

  const onSubmit = async (data: FormDataGroup) => {
    const dataCleaned = {
      ...data,
      name: data.name.trim().toUpperCase(),
    }
    if (id) {
      openConfirmEditGroupModal(dataCleaned)
    } else {
      openConfirmAddGroupModal(dataCleaned)
    }
  }

  function organizePermissionsByModule(
    permissions: {
      id: number
      action: string
      model: string
    }[],
  ) {
    const organizedPermissions = {} as {
      [key: string]: {
        id: number
        action: string
      }[]
    }

    if (!permissions) {
      return organizedPermissions
    }
    permissions.forEach((permission) => {
      const model = permission.model as string

      if (!organizedPermissions[model]) {
        organizedPermissions[model] = []
      }

      organizedPermissions[model].push({
        id: permission.id,
        action: `${translateAction(permission.action)} ${translateModel(
          permission.model,
        )}`,
      })
    })

    return organizedPermissions
  }

  const organizedPermissions = organizePermissionsByModule(dataPermissions)

  return {
    form,
    isFetchingGroup,
    isFetchingPermissions,
    organizedPermissions,
    canEdit,
    onSubmit,
  }
}
