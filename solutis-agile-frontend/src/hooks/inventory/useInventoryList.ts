'use client'

import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'

import axios from '@/lib/axios'
import { fetchInventory as fetchInventoryAPI } from '@/services/api/inventory'

// Filters live in RHF form (no local state)
export type InventoryFilter = {
  search?: string // free text
  year?: string | null // string year or null
  answered?: string // "1" | "0" | "" (empty means unset)
  hasExtra?: string // "1" | "0" | ""
  page?: number
  size?: string // keep as string in URL
}

export type InventoryListResponse<T = any> = {
  items: T[]
  pages: number
  total: number
}

interface UseInventoryListArgs {
  searchParams?: InventoryFilter
}

export default function useInventoryList({
  searchParams = {},
}: Readonly<UseInventoryListArgs>) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Drawer state for <FilterSection />
  const [filterOpened, { toggle: toggleFilter }] = useDisclosure(false)

  // Form holds ALL filters (mirrors URL)
  const formFilter = useForm<InventoryFilter>({
    defaultValues: {
      search: searchParams.search ?? '',
      year: (searchParams.year as string | undefined)
        ? searchParams.year
        : new Date().getFullYear().toString(),
      answered:
        searchParams.answered === '0' || searchParams.answered === '1'
          ? searchParams.answered
          : '',
      hasExtra:
        searchParams.hasExtra === '0' || searchParams.hasExtra === '1'
          ? searchParams.hasExtra
          : '',
      page: searchParams.page ?? 1,
      size: searchParams.size ?? '12',
    },
  })

  // URL-driven pagination (supplier pattern)
  const page = Number(searchParams.page || 1)
  const pageSize = searchParams.size || '12'

  // Helpers to sanitize params (avoid sending empty strings like search="")
  const normalizeQueryFromUrl = (sp: InventoryFilter) => {
    const params: any = {
      page,
      size: Number(pageSize),
    }
    if (sp.search && typeof sp.search === 'string' && sp.search.trim()) {
      params.search = sp.search.trim()
    }
    if (sp.year) params.year = String(sp.year)
    if (sp.answered === '0' || sp.answered === '1')
      params.answered = Number(sp.answered)
    if (sp.hasExtra === '0' || sp.hasExtra === '1')
      params.hasExtra = Number(sp.hasExtra)
    return params
  }

  const { data, isPending, error } = useQuery({
    queryKey: ['fetchInventory', normalizeQueryFromUrl(searchParams)],
    queryFn: () => fetchInventoryAPI(normalizeQueryFromUrl(searchParams)),
    select: (response: any) => response.data,
  })

  const availableYears = useMemo(() => {
    // from 2023 to current year
    const currentYear = new Date().getFullYear()
    const years = []
    for (let y = 2023; y <= currentYear; y++) {
      years.push({ value: String(y), label: String(y) })
    }
    return years
  }, [])

  // --- Pagination handlers: update URL + invalidate (same as useSupplier) ---
  function onPageChange(newPage: number) {
    const params = new URLSearchParams(searchParams as any)
    params.set('page', String(newPage))
    navigate({ to: `/inventory?${params.toString()}` })
    queryClient.invalidateQueries({ queryKey: ['fetchInventory'] })
  }

  function onPageSizeChange(newPageSize: string) {
    const params = new URLSearchParams(searchParams as any)
    params.set('size', newPageSize)
    params.set('page', '1') // Reset to first page
    navigate({ to: `/inventory?${params.toString()}` })
    queryClient.invalidateQueries({ queryKey: ['fetchInventory'] })
  }

  // --- Filter actions: read values from RHF, push to URL (no local state) ---
  const onSearch = (values: InventoryFilter) => {
    const params = new URLSearchParams()
    if (values.search && values.search.trim())
      params.set('search', values.search.trim())
    if (values.year) params.set('year', String(values.year))
    if (values.answered === '0' || values.answered === '1')
      params.set('answered', values.answered)
    if (values.hasExtra === '0' || values.hasExtra === '1')
      params.set('hasExtra', values.hasExtra)

    // keep current page size
    params.set('size', pageSize)
    params.set('page', '1')

    navigate({ to: `/inventory?${params.toString()}` })
    queryClient.invalidateQueries({ queryKey: ['fetchInventory'] })
  }

  const onClearFilters = () => {
    formFilter.reset({
      search: '',
      year: new Date().getFullYear().toString(),
      answered: '',
      hasExtra: '',
      page: 1,
      size: pageSize,
    })
    navigate({ to: `/inventory?page=1&size=${pageSize}` })
    queryClient.invalidateQueries({ queryKey: ['fetchInventory'] })
  }

  const sendEmail = async () => {
    try {
      const { year } = formFilter.getValues()
      await axios.post('/inventory/release-form', { year: year ?? undefined })
      notifications.show({
        title: 'Sucesso',
        message: 'Formulário liberado',
        color: 'green',
      })
    } catch {
      notifications.show({
        title: 'Erro',
        message: 'Não foi possível liberar o formulário',
        color: 'red',
      })
    }
  }

  return {
    // data
    data,
    isPending,
    error,

    // pagination (URL-driven)
    page,
    pageSize,
    onPageChange,
    onPageSizeChange,

    // filter form (single source of truth for filters)
    formFilter,
    onSearch,
    onClearFilters,

    // filter drawer
    filterOpened,
    toggleFilter,

    // lookups
    availableYears,

    // actions
    sendEmail,
  }
}
