'use client'

import { Center, Loader } from '@mantine/core'
import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { useEffect } from 'react'

import FormSkeleton from '@/components/common/skeletons/form-skeleton'
import { Can } from '@/components/providers/ability'
import { ServerError } from '@/components/server-error'
import { SupplierForm } from '@/components/suppliers/supplier-form'
import { useEditSupplier } from '@/hooks/supplier/useEditSupplier'

export const Route = createFileRoute('/_dashboard/suppliers/edit/$id/')({
  errorComponent: () => <ServerError />,
  pendingComponent: () => <FormSkeleton />,
  component: EditSupplierPage,
})

function EditSupplierPage() {
  const { id: supplierId } = useParams({
    from: '/_dashboard/suppliers/edit/$id/',
  })
  const navigate = useNavigate()

  const {
    initialData,
    supplierData,
    attachmentsData,
    responsibilityMatrixData,
    isLoading,
    error,
  } = useEditSupplier({ supplierId })

  useEffect(() => {
    if (error) {
      navigate({ to: '/suppliers', replace: true })
    }
  }, [error])

  if (isLoading) {
    return (
      <Center mih={400}>
        <Loader color="blue" size="lg" />
      </Center>
    )
  }

  if (error) {
    return (
      <Center mih={400}>
        <Loader color="blue" size="lg" />
      </Center>
    )
  }

  if (!initialData) {
    // Handle case where initial data is not available
    // This could also redirect or show a message
    return <div>Erro ao carregar dados do fornecedor.</div>
  }

  return (
    <Can I="edit" a="supplier">
      <SupplierForm
        mode="edit"
        supplierId={supplierId}
        initialData={initialData}
        supplierName={supplierData?.tradeName || supplierData?.legalName}
        existingAttachments={attachmentsData}
        responsibilityMatrixInitialData={responsibilityMatrixData}
      />
    </Can>
  )
}
