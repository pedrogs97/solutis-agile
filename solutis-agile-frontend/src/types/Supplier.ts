import type { PaginatedSupplierListOut } from '@/api/generated/types/PaginatedSupplierListOut.ts'
import type { SupplierFormValues } from '@/types/supplier-form.ts'

export type SuppliersResponse = PaginatedSupplierListOut

/** @deprecated Use SupplierFormValues from @/types/supplier-form.ts */
export type SupplierFormData = SupplierFormValues

/** Kept for legacy service function signatures in services/api/supplier.ts. */
export interface SelectOption {
  id: number
  name: string
}
