// services/api/inventory.ts
import axios from '@/lib/axios'

export type InventoryQuery = {
  page?: number
  size?: number
  search?: string // omit if empty
  year?: string | number | null // omit if null/undefined
  answered?: number // 0 | 1 (omit if undefined)
  hasExtra?: number // 0 | 1 (omit if undefined)
}

export interface InventoryListResponse<T = any> {
  items: T[]
  page: number
  size: number
  pages: number
  total: number
}

/**
 * Remove undefined/null/empty-string fields so the API doesn't get `search=`.
 */
function sanitize<T extends Record<string, any>>(obj: T): Partial<T> {
  const out: Record<string, any> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (
      v === undefined ||
      v === null ||
      (typeof v === 'string' && v.trim() === '')
    )
      continue
    out[k] = typeof v === 'string' ? v.trim() : v
  }
  return out as Partial<T>
}
/**
 * Fetch inventory list.
 * Uses the original endpoint (baseURL is handled by your axios instance).
 * Example resolved URL (with baseURL `/api/v1`):
 *   /api/v1/inventory/get-employee-answer/?page=1&size=12
 */
export const fetchInventory = (params: InventoryQuery) => {
  return axios.get<InventoryListResponse>('/inventory/get-employee-answer', {
    params: sanitize({
      ...params,
      year: params.year ?? new Date().getFullYear().toString(),
    }),
  })
}
