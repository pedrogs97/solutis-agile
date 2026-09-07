'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import {
  fetchPurchaseProcessMetrics,
  type PurchaseProcessMetricFilters,
} from '@/services/api/purchase-process'

export function usePurchaseProcessMetrics(
  initialFilters?: PurchaseProcessMetricFilters
) {
  const [periodo, setPeriodo] = useState<string>(initialFilters?.periodo || '')
  const [categoria, setCategoria] = useState<string>(
    initialFilters?.categoria || ''
  )

  const {
    data: metrics,
    isPending,
    error,
    refetch,
  } = useQuery({
    queryKey: ['fetchPurchaseProcessMetrics', { periodo, categoria }],
    queryFn: () => fetchPurchaseProcessMetrics({ periodo, categoria }),
  })

  return {
    periodo,
    setPeriodo,
    categoria,
    setCategoria,
    metrics,
    isPending,
    error,
    refetch,
  }
}
