import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useState } from 'react'
import { type UseFormReturn } from 'react-hook-form'

import type { ReportFormFilter } from '@/routes/_dashboard/reports'

interface IUsePaginationReportProps {
  searchParams?: Record<string, any>
  formFilterReport: UseFormReturn<ReportFormFilter>
  invalidateQueryKey: string
}

export function usePaginationReport({
  searchParams,
  formFilterReport,
  invalidateQueryKey,
}: Readonly<IUsePaginationReportProps>) {
  const queryClient = useQueryClient()
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  }) as string
  const navigate = useNavigate()
  const [filters, setFilters] = useState(searchParams)
  const [page, setPage] = useState(1)

  const onPageChange = (value: number) => {
    setPage(value)
    const newFilters = {
      ...filters,
      page: value?.toString(),
    } as unknown as Record<string, string>
    const queryString = `${pathname}?${new URLSearchParams(newFilters).toString()}`
    navigate({ to: queryString })
    queryClient.invalidateQueries({
      queryKey: [invalidateQueryKey, newFilters],
    })
  }

  const onSearch = (values: any) => {
    const newPage = 1
    setPage(newPage)
    const filteredValues = Object.fromEntries(
      Object.entries(values).filter(([_, v]) => v),
    ) as {
      [key: string]: string
    }
    setFilters(filteredValues)
    const queryString = `${pathname}?${new URLSearchParams(filteredValues).toString()}`
    navigate({ to: queryString })
    queryClient.invalidateQueries({
      queryKey: [
        invalidateQueryKey,
        {
          page: newPage.toString(),
          ...filteredValues,
        },
      ],
    })
  }

  const onClearFilters = () => {
    Object.keys(formFilterReport.watch()).forEach((field) =>
      formFilterReport.setValue(field as any, null),
    )
    const newPage = 1
    setPage(newPage)
    setFilters({})
    navigate({ to: pathname })
    queryClient.invalidateQueries({
      queryKey: [
        invalidateQueryKey,
        {
          page: newPage.toString(),
        },
      ],
    })
  }

  return {
    page,
    onPageChange,
    onSearch,
    filters,
    onClearFilters,
  }
}
