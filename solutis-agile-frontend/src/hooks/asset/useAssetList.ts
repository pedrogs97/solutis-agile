'use client'

import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'

import { useAbilityGuard } from '@/hooks/useAbilityGuard'
import usePagination from '@/hooks/usePagination'
import { fetchAssets } from '@/services/api/asset'

interface FormFilter {
  description__ilike?: string
  register_number__ilike?: string
  serial_number__ilike?: string
  page?: number
  size?: string
}

interface IUseAssetListProps {
  searchParams: FormFilter
}

export default function useAssetList({
  searchParams,
}: Readonly<IUseAssetListProps>) {
  const [filterOpened, { toggle: toggleFilter }] = useDisclosure(false)
  const navigate = useNavigate()
  useAbilityGuard(
    (currentAbility) => {
      if (currentAbility.cannot('view', 'asset')) {
        notifications.show({
          message: 'Usuário não possui permissão "Visualizar Ativos"',
        })
        navigate({ to: '/dashboard' })
      }
    },
    [navigate],
  )

  const formFilter = useForm<FormFilter>({
    defaultValues: {
      description__ilike: '',
      register_number__ilike: '',
      serial_number__ilike: '',
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
    invalidateQueryKey: 'fetchAssets',
  })

  const { isPending, error, data } = useQuery({
    queryKey: [
      'fetchAssets',
      {
        ...filters,
        page: page,
        size: pageSize,
      },
    ],
    queryFn: fetchAssets,
  })

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
  }
}
