'use client'

import { createFileRoute } from '@tanstack/react-router'

import { Breadcrumbs } from '@/components/common/breadcrumbs'
import { ProcessForm } from '@/components/purchase-processes/form/process-form'
import { ServerError } from '@/components/server-error'

export const Route = createFileRoute('/_dashboard/purchase-processes/$id')({
  errorComponent: () => <ServerError />,
  component: PurchaseProcessDetailPage,
})

function PurchaseProcessDetailPage() {
  const { id } = Route.useParams()

  return (
    <>
      <Breadcrumbs />
      <ProcessForm id={id} />
    </>
  )
}
