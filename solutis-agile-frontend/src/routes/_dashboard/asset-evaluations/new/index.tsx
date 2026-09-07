'use client'

import { createFileRoute } from '@tanstack/react-router'

import { EvaluationForm } from '@/components/asset-evaluations/form/evaluation-form'
import { Breadcrumbs } from '@/components/common/breadcrumbs'
import { PageSectionHeader } from '@/components/common/page-section-header'
import FormSkeleton from '@/components/common/skeletons/form-skeleton'
import { ServerError } from '@/components/server-error'

export const Route = createFileRoute('/_dashboard/asset-evaluations/new/')({
  errorComponent: () => <ServerError />,
  pendingComponent: () => <FormSkeleton />,
  component: NewAssetEvaluationPage,
})

function NewAssetEvaluationPage() {
  return (
    <>
      <Breadcrumbs />
      <PageSectionHeader
        title="Novo Formulário FO-PAT-02"
      />
      <EvaluationForm />
    </>
  )
}
