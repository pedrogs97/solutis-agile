'use client'

import { useQuery } from '@tanstack/react-query'

import { useGetSupplier } from '@/api/generated/hooks/useGetSupplier.ts'
import { apiToSupplierFormValues } from '@/lib/supplier-mappers'
import {
  getSupplierAttachments,
  type ResponsibilityMatrixData,
} from '@/services/api/supplier'
import type { SupplierFormValues } from '@/types/supplier-form'

interface UseEditSupplierProps {
  supplierId: string
}

export function useEditSupplier({ supplierId }: UseEditSupplierProps) {
  const {
    data: supplierData,
    isLoading: isLoadingSupplier,
    error: supplierError,
  } = useGetSupplier(supplierId ? Number(supplierId) : undefined)

  const { data: attachmentsData, isLoading: isLoadingAttachments } = useQuery({
    queryKey: ['supplier-attachments', supplierId],
    queryFn: () => getSupplierAttachments(supplierId),
    enabled: !!supplierId,
    select: (response) => response.data,
  })

  const initialData: SupplierFormValues | undefined = supplierData
    ? apiToSupplierFormValues(supplierData)
    : undefined

  const responsibilityMatrixData = supplierData?.responsibilityMatrix as
    | ResponsibilityMatrixData
    | undefined

  return {
    initialData,
    supplierData,
    attachmentsData,
    responsibilityMatrixData,
    isLoading: isLoadingSupplier || isLoadingAttachments,
    error: supplierError,
  }
}
