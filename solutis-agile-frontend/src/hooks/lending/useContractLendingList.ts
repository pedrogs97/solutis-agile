import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'

import { useAbilityGuard } from '@/hooks/useAbilityGuard'
import axios from '@/lib/axios'
import { fetchContracts } from '@/services/api/lending-contract'
import type { AssetType } from '@/types/Asset'

import usePagination from '../usePagination'

interface FormFilter {
  search?: string
  asset_type__name?: string
  status__name?: string
  employee__full_name__ilike?: string
  created_at__gte?: string
  created_at__lte?: string
  period?: [string | null, string | null]
  page?: number
  size?: string
}

interface IUseContractLendingListProps {
  searchParams?: FormFilter
}

export default function useContractLendingList({
  searchParams,
}: Readonly<IUseContractLendingListProps>) {
  const [filterOpened, { toggle: toggleFilter }] = useDisclosure(false)
  const navigate = useNavigate()

  const formFilter = useForm<FormFilter>({
    defaultValues: {
      search: searchParams?.search,
      asset_type__name: searchParams?.asset_type__name,
      status__name: searchParams?.status__name,
      employee__full_name__ilike: searchParams?.employee__full_name__ilike,
      created_at__gte: searchParams?.created_at__gte,
      created_at__lte: searchParams?.created_at__lte,
      page: searchParams?.page,
      size: searchParams?.size,
    },
  })

  const {
    page,
    onPageChange,
    onSearch: submitSearch,
    filters,
    onClearFilters,
    pageSize,
    onPageSizeChange,
  } = usePagination({
    searchParams,
    formFilter,
    invalidateQueryKey: 'fetchContracts',
  })

  useAbilityGuard(
    (currentAbility) => {
      if (currentAbility.cannot('view', 'lending')) {
        notifications.show({
          message:
            'Usuário não possui permissão "Visualizar Contratos de Comodato"',
        })
        navigate({ to: '/dashboard' })
      }
    },
    [navigate],
  )

  const fetchAssetTypes = async () => {
    const { data } = await axios.get('/assets-types/', {
      params: {
        fields: 'name',
      },
    })
    const types = data?.map((assetType: AssetType) => ({
      value: assetType.name,
      label: assetType.name,
    }))

    types.unshift({ value: '', label: '' })
    return types
  }

  const { data: assetTypes } = useQuery({
    queryKey: ['fetchAssetTypes'],
    queryFn: fetchAssetTypes,
  })

  const { isPending, error, data } = useQuery({
    queryKey: [
      'fetchContracts',
      {
        ...filters,
        page: page,
        size: pageSize,
      },
    ],
    queryFn: fetchContracts,
  })

  const onSearch = (data: FormFilter) => {
    const dataCleaned = { ...data } as FormFilter
    if (
      dataCleaned?.period &&
      dataCleaned?.period[0] &&
      dataCleaned?.period[1]
    ) {
      dataCleaned.created_at__gte = dataCleaned.period[0]
      dataCleaned.created_at__lte = dataCleaned.period[1]
      delete dataCleaned.period
    }
    submitSearch(dataCleaned)
  }

  return {
    page,
    data,
    isPending,
    error,
    onPageChange,
    onClearFilters,
    pageSize,
    onPageSizeChange,
    formFilter,
    filterOpened,
    toggleFilter,
    assetTypes,
    onSearch,
  }
}
