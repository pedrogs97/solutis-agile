import { zodResolver } from '@hookform/resolvers/zod'
import { useDisclosure } from '@mantine/hooks'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import {
  listSuppliersQueryKey,
  useListSuppliers,
} from '@/api/generated/hooks/useListSuppliers.ts'

interface FormFilter {
  name?: string | null
  cnpj?: string | null
  status?: string | null
  risk?: string | null
  page?: number
  size?: string
}

interface IUseSupplier {
  searchParams: FormFilter
}

const filterSchema = z.object({
  name: z.string().optional().nullable(),
  cnpj: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  risk: z.string().optional().nullable(),
  page: z.number().optional(),
  size: z.string().optional(),
})

export default function useSupplier({ searchParams }: Readonly<IUseSupplier>) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const page = Number(searchParams.page || 1)
  const pageSize = searchParams.size || '12'
  const [filterOpened, { toggle: toggleFilter }] = useDisclosure(false)

  const { data, isPending, error } = useListSuppliers({
    ...(searchParams.name && { name: searchParams.name }),
    ...(searchParams.cnpj && { cnpj: searchParams.cnpj }),
    ...(searchParams.status && { status: searchParams.status }),
    ...(searchParams.risk && { risk: Number(searchParams.risk) }),
    page,
    size: Number(pageSize),
  })

  const formFilter = useForm<FormFilter>({
    resolver: zodResolver(filterSchema),
    defaultValues: searchParams,
  })

  function onSearch(data: FormFilter) {
    const params = new URLSearchParams()
    if (data.name) params.set('name', data.name)
    const normalizedCnpj = data.cnpj?.replace(/[.\-/]/g, '') ?? ''
    if (normalizedCnpj) params.set('cnpj', normalizedCnpj)
    if (data.status) params.set('status', data.status)
    if (data.risk) params.set('risk', data.risk)
    navigate({ to: `/suppliers?${params.toString()}` })
    queryClient.invalidateQueries({
      queryKey: listSuppliersQueryKey(),
    })
  }

  function onClearFilters() {
    formFilter.reset({
      name: '',
      cnpj: '',
      status: '',
      risk: '',
    })
    navigate({ to: '/suppliers' })
    queryClient.invalidateQueries({
      queryKey: listSuppliersQueryKey(),
    })
  }

  function onPageChange(newPage: number) {
    const params = new URLSearchParams(searchParams as any)
    params.set('page', String(newPage))
    navigate({ to: `/suppliers?${params.toString()}` })
    queryClient.invalidateQueries({
      queryKey: listSuppliersQueryKey(),
    })
  }

  function onPageSizeChange(newPageSize: string) {
    const params = new URLSearchParams(searchParams as any)
    params.set('size', newPageSize)
    params.set('page', '1') // Reset to first page
    navigate({ to: `/suppliers?${params.toString()}` })
    queryClient.invalidateQueries({
      queryKey: listSuppliersQueryKey(),
    })
  }

  return {
    page,
    data,
    isPending,
    error,
    onPageChange,
    pageSize,
    onPageSizeChange,
    filterOpened,
    toggleFilter,
    formFilter,
    onSearch,
    onClearFilters,
  }
}
