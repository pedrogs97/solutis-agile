import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { format } from 'date-fns'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { useAbilityGuard } from '@/hooks/useAbilityGuard'
import usePagination from '@/hooks/usePagination'
import { fetchTerms } from '@/services/api/terms'

interface FormFilter {
  search?: string
  status__name?: string
  created_at__gte?: string
  created_at__lte?: string
  page?: number
  size?: string
}

interface IUseTermListProps {
  searchParams: FormFilter
}

export default function useTermList({
  searchParams,
}: Readonly<IUseTermListProps>) {
  const [filterOpened, { toggle: toggleFilter }] = useDisclosure(false)
  const [period, setPeriod] = useState<[Date | null, Date | null]>([null, null])
  const navigate = useNavigate()

  useAbilityGuard(
    (currentAbility) => {
      if (currentAbility.cannot('view', 'lending')) {
        notifications.show({
          message:
            'Usuário não possui permissão "Visualizar Termos de Responsabilidade"',
        })
        navigate({ to: '/dashboard' })
      }
    },
    [navigate],
  )

  const formFilter = useForm<FormFilter>({
    defaultValues: {
      search: searchParams?.search,
      status__name: searchParams?.status__name,
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
    invalidateQueryKey: 'fetchTerms',
  })

  const onSearch = (data: FormFilter) => {
    if (period[0] && period[1]) {
      data.created_at__gte = format(period[0], 'yyyy-MM-dd')
      data.created_at__lte = format(period[1], 'yyyy-MM-dd')
    }
    submitSearch(data)
  }

  const { isPending, error, data } = useQuery({
    queryKey: [
      'fetchTerms',
      {
        ...filters,
        page: page,
        size: pageSize,
      },
    ],
    queryFn: fetchTerms,
  })

  return {
    data,
    isPending,
    error,
    onClearFilters,
    pageSize,
    onPageSizeChange,
    onPageChange,
    page,
    filterOpened,
    toggleFilter,
    formFilter,
    period,
    setPeriod,
    onSearch,
  }
}
