import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { type UseFormReturn } from 'react-hook-form'

interface IUsePaginationProps {
  searchParams?: Record<string, any>
  formFilter: UseFormReturn
  invalidateQueryKey: string
  defaultPageSize?: number
}

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 12

export default function usePagination({
  searchParams = {},
  formFilter,
  invalidateQueryKey,
  defaultPageSize = DEFAULT_PAGE_SIZE,
}: Readonly<IUsePaginationProps>) {
  const queryClient = useQueryClient()
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const navigate = useNavigate()

  // Initialize from URL params or defaults
  const initialPage = Number(searchParams.page) || DEFAULT_PAGE
  const initialPageSize = searchParams.size || String(defaultPageSize)
  const initialFilters = useMemo(() => {
    const { page, size, ...rest } = searchParams
    return rest
  }, [searchParams])

  const [filters, setFilters] = useState<Record<string, any>>(initialFilters)
  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)

  // Sync URL params to state when they change externally
  useEffect(() => {
    const urlPage = Number(searchParams.page) || DEFAULT_PAGE
    const urlPageSize = searchParams.size || String(defaultPageSize)

    if (urlPage !== page) setPage(urlPage)
    if (urlPageSize !== pageSize) setPageSize(urlPageSize)
  }, [searchParams.page, searchParams.size, defaultPageSize])

  // Helper to update URL and invalidate queries (DRY principle)
  const updatePaginationState = useCallback(
    (newFilters: Record<string, any>, newPage: number, newPageSize: string) => {
      // Filter out undefined, null, empty string, and "undefined" string values
      const cleanFilters = Object.fromEntries(
        Object.entries(newFilters).filter(
          ([_, v]) => v != null && v !== '' && v !== 'undefined',
        ),
      )

      const params = {
        ...cleanFilters,
        page: String(newPage),
        size: newPageSize,
      }

      const queryString = `${pathname}?${new URLSearchParams(params).toString()}`

      navigate({ to: queryString })

      queryClient.invalidateQueries({
        queryKey: [invalidateQueryKey, params],
      })
    },
    [pathname, navigate, queryClient, invalidateQueryKey],
  )

  const onPageChange = useCallback(
    (value: number) => {
      setPage(value)
      updatePaginationState(filters, value, pageSize)
    },
    [filters, pageSize, updatePaginationState],
  )

  const onSearch = useCallback(
    (values: any) => {
      // Filter out empty/null/undefined values and "undefined" strings for cleaner URLs
      const filteredValues = Object.fromEntries(
        Object.entries(values).filter(
          ([_, v]) => v != null && v !== '' && v !== 'undefined',
        ),
      ) as Record<string, any>

      setPage(DEFAULT_PAGE)
      setFilters(filteredValues)
      updatePaginationState(filteredValues, DEFAULT_PAGE, pageSize)
    },
    [pageSize, updatePaginationState],
  )

  const onClearFilters = useCallback(() => {
    // Reset form fields
    const watchedFields = formFilter.watch()
    Object.keys(watchedFields).forEach((field) => {
      formFilter.setValue(field, null)
    })

    // Reset pagination state
    const newPageSize = String(defaultPageSize)
    setPage(DEFAULT_PAGE)
    setPageSize(newPageSize)
    setFilters({})

    // Navigate to base path without query params
    navigate({ to: pathname })

    queryClient.invalidateQueries({
      queryKey: [
        invalidateQueryKey,
        {
          page: String(DEFAULT_PAGE),
          size: newPageSize,
        },
      ],
    })
  }, [
    formFilter,
    pathname,
    navigate,
    queryClient,
    invalidateQueryKey,
    defaultPageSize,
  ])

  const onPageSizeChange = useCallback(
    (value: string) => {
      setPage(DEFAULT_PAGE)
      setPageSize(value)
      updatePaginationState(filters, DEFAULT_PAGE, value)
    },
    [filters, updatePaginationState],
  )

  return {
    page,
    onPageChange,
    onSearch,
    filters,
    onClearFilters,
    pageSize,
    onPageSizeChange,
  }
}
