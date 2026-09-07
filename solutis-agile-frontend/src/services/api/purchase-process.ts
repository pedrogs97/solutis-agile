import { QueryFunctionContext } from '@tanstack/react-query'

import axios from '@/lib/axios'
import type {
  PaginatedPurchaseProcessList,
  PurchaseProcess,
  PurchaseProcessMetrics,
} from '@/types/PurchaseProcess'

const BASE_URL = '/purchase-processes'

export interface PurchaseProcessFilters {
  search?: string
  status?: string
  category?: string
  page?: number
  pageSize?: number
  orderBy?: string
}

export interface PurchaseProcessMetricFilters {
  periodo?: string
  categoria?: string
}

export const fetchPurchaseProcesses = async ({
  queryKey,
}: QueryFunctionContext<[string, PurchaseProcessFilters]>) => {
  const [_, filters] = queryKey
  const { data } = await axios.get<PaginatedPurchaseProcessList>(`${BASE_URL}/`, {
    params: {
      search: filters.search,
      status: filters.status,
      category: filters.category,
      page: filters.page,
      page_size: filters.pageSize,
      order_by: filters.orderBy,
    },
  })
  return data
}

export const fetchPurchaseProcess = async ({
  queryKey,
}: QueryFunctionContext<[string, string | undefined]>) => {
  const [_, id] = queryKey
  if (!id) return null
  const { data } = await axios.get<PurchaseProcess>(`${BASE_URL}/${id}/`)
  return data
}

export const fetchPurchaseProcessMetrics = async (
  filters?: PurchaseProcessMetricFilters
) => {
  const { data } = await axios.get<PurchaseProcessMetrics>(`${BASE_URL}/metrics/`, {
    params: filters,
  })
  return data
}

export const createPurchaseProcess = async (
  payload: Partial<PurchaseProcess>
) => {
  const { data } = await axios.post<PurchaseProcess>(`${BASE_URL}/`, payload)
  return data
}

export const updatePurchaseProcess = async (
  id: string,
  payload: Partial<PurchaseProcess>
) => {
  const { data } = await axios.put<PurchaseProcess>(`${BASE_URL}/${id}/`, payload)
  return data
}

export const deletePurchaseProcess = async (id: string) => {
  const { data } = await axios.delete<{ ok: boolean }>(`${BASE_URL}/${id}/`)
  return data
}

export const decidePurchaseProcess = async (
  id: string,
  payload: {
    status: string
    aprovadoPor?: string
    dataDecisao?: string
    comentario?: string
  }
) => {
  const { data } = await axios.post<PurchaseProcess>(
    `${BASE_URL}/${id}/decision/`,
    payload
  )
  return data
}
