'use client'

import { createFileRoute, useParams } from '@tanstack/react-router'

import { EvaluationForm } from '@/components/asset-evaluations/form/evaluation-form'
import { Breadcrumbs } from '@/components/common/breadcrumbs'
import LoadingScreen from '@/components/common/loading-screen'
import { PageSectionHeader } from '@/components/common/page-section-header'
import { ServerError } from '@/components/server-error'

export const Route = createFileRoute('/_dashboard/asset-evaluations/$id')({
  errorComponent: () => <ServerError />,
  pendingComponent: () => <LoadingScreen />,
  component: DetailAssetEvaluationPage,
})

function DetailAssetEvaluationPage() {
  const { id } = useParams({ from: '/_dashboard/asset-evaluations/$id' })

  return (
    <>
      <Breadcrumbs />
      <PageSectionHeader
        title="Detalhes da Avaliação Técnica (FO-PAT-02)"
        subtitle="Visualização, edição e fluxo de aprovação e baixa"
      />
      <EvaluationForm evaluationId={id} />
    </>
  )
}
