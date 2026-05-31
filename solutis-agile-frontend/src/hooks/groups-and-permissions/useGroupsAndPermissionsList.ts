import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'

import { useAbilityGuard } from '@/hooks/useAbilityGuard'
import { fetchGroupsAndPermissions } from '@/services/api/groups-and-permissions'

import usePagination from '../usePagination'

interface FormFilter {
  name__ilike?: string
  page?: number
  size?: string
}

interface IUseGroupsAndPermissionsList {
  searchParams: FormFilter
}

export default function useGroupsAndPermissionsList({
  searchParams,
}: Readonly<IUseGroupsAndPermissionsList>) {
  const [filterOpened, { toggle: toggleFilter }] = useDisclosure(false)
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const navigate = useNavigate()
  useAbilityGuard(
    (currentAbility) => {
      if (currentAbility.cannot('view', 'group')) {
        notifications.show({
          message: 'Usuário não possui permissão "Visualizar Grupos"',
        })
        navigate({ to: '/dashboard' })
      }
    },
    [navigate],
  )

  const formFilter = useForm<FormFilter>({
    defaultValues: {
      name__ilike: '',
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
    invalidateQueryKey: 'fetchGroupsAndPermissions',
  })

  const { isPending, error, data } = useQuery({
    queryKey: [
      'fetchGroupsAndPermissions',
      {
        ...filters,
        page: page,
        size: pageSize,
      },
    ],
    queryFn: fetchGroupsAndPermissions,
  })
  return {
    filterOpened,
    toggleFilter,
    pathname,
    formFilter,
    page,
    onPageChange,
    onSearch,
    filters,
    onClearFilters,
    pageSize,
    onPageSizeChange,
    isPending,
    error,
    data,
  }
}
