'use client'

import { createFileRoute } from '@tanstack/react-router'

import FormSkeleton from '@/components/common/skeletons/form-skeleton'
import { ServerError } from '@/components/server-error'
import { SupplierForm } from '@/components/suppliers/supplier-form'

export const Route = createFileRoute('/_dashboard/suppliers/add/')({
  errorComponent: () => <ServerError />,
  pendingComponent: () => <FormSkeleton />,
  component: AddSupplierPage,
})

function AddSupplierPage() {
  return <SupplierForm mode="create" />
}
