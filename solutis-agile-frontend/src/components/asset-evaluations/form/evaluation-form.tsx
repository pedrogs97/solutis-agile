'use client'

import {
  Alert,
  Button,
  Card,
  Group,
  Stack,
  Text,
} from '@mantine/core'
import { useNavigate } from '@tanstack/react-router'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Printer,
  Save,
  Trash,
} from 'lucide-react'

import { useAssetEvaluationForm } from '@/hooks/asset-evaluation/useAssetEvaluationForm'

import { ApprovalsSection } from './approvals-section'
import { ComplianceAttachmentsSection } from './compliance-attachments-section'
import { ComponentsMatrixSection } from './components-matrix-section'
import { EsgWeightSection } from './esg-weight-section'
import { FinancialSection } from './financial-section'
import { IdentificationSection } from './identification-section'
import { SummaryKpiBar } from './summary-kpi-bar'
import { TechnicalEvaluationSection } from './technical-evaluation-section'

interface EvaluationFormProps {
  evaluationId?: string | number | null
  readOnly?: boolean
}

export function EvaluationForm({
  evaluationId,
  readOnly = false,
}: Readonly<EvaluationFormProps>) {
  const navigate = useNavigate()
  const {
    form,
    isEdit,
    isSubmitting,
    isApproving,
    existingEvaluation,
    catalogComponents,
    assetOptions,
    addComponentRow,
    removeComponentRow,
    calculatedReusePercentage,
    calculatedEstimatedEconomy,
    watchedClassification,
    watchedFeasibility,
    watchedDestination,
    draftRestored,
    discardDraft,
    onSubmit,
    onApprove,
    pendingUploads,
    addPendingUpload,
    removePendingUpload,
  } = useAssetEvaluationForm({ evaluationId })

  const handlePrint = () => {
    window.print()
  }

  return (
    <form onSubmit={onSubmit}>
      <Stack gap="lg">
        {/* Draft Notification if applicable */}
        {draftRestored && !isEdit && (
          <Alert
            color="blue"
            title="Rascunho Restaurado"
            icon={<AlertCircle size={16} />}
          >
            <Group justify="space-between">
              <Text size="sm">
                Recuperamos os dados da sua avaliação em andamento salvos neste navegador.
              </Text>
              <Button
                size="xs"
                variant="subtle"
                color="red"
                leftSection={<Trash size={14} />}
                onClick={discardDraft}
              >
                Descartar Rascunho
              </Button>
            </Group>
          </Alert>
        )}

        {/* Top Summary KPI Bar */}
        <SummaryKpiBar
          classification={watchedClassification}
          feasibility={watchedFeasibility}
          reusePercentage={calculatedReusePercentage}
          destinations={watchedDestination}
        />

        {/* 1. Identificação */}
        <IdentificationSection
          form={form}
          assetOptions={assetOptions}
          readOnly={readOnly}
        />

        {/* 2. Avaliação Técnica */}
        <TechnicalEvaluationSection form={form} readOnly={readOnly} />

        {/* 3. Matriz de Componentes */}
        <ComponentsMatrixSection
          form={form}
          catalogComponents={catalogComponents}
          onAddRow={addComponentRow}
          onRemoveRow={removeComponentRow}
          readOnly={readOnly}
        />

        {/* 4. ESG & Controle de Pesagem */}
        <EsgWeightSection
          form={form}
          reusePercentage={calculatedReusePercentage}
          readOnly={readOnly}
        />

        {/* 5. Avaliação Financeira */}
        <FinancialSection
          form={form}
          estimatedEconomy={calculatedEstimatedEconomy}
          readOnly={readOnly}
        />

        {/* 6. Conformidade & Anexos */}
        <ComplianceAttachmentsSection
          attachments={existingEvaluation?.attachments || []}
          pendingUploads={pendingUploads}
          onAddPendingUpload={addPendingUpload}
          onRemovePendingUpload={removePendingUpload}
          readOnly={readOnly}
        />

        {/* 7. Fluxo de Validação & Aprovação */}
        <ApprovalsSection
          existingEvaluation={existingEvaluation}
          onApprove={onApprove}
          isApproving={isApproving}
          readOnly={readOnly}
        />

        {/* Action Buttons Footer */}
        <Card shadow="sm" radius="md" p="md" withBorder>
          <Group justify="space-between">
            <Button
              variant="default"
              leftSection={<ArrowLeft size={16} />}
              onClick={() => navigate({ to: '/asset-evaluations' })}
            >
              Voltar ao Painel
            </Button>

            <Group gap="sm">
              <Button
                variant="outline"
                leftSection={<Printer size={16} />}
                onClick={handlePrint}
              >
                Imprimir Laudo
              </Button>

              {!readOnly && (
                <Button
                  type="submit"
                  color="blue"
                  leftSection={isEdit ? <Save size={16} /> : <CheckCircle size={16} />}
                  loading={isSubmitting}
                >
                  {isEdit ? 'Salvar Alterações' : 'Finalizar Avaliação'}
                </Button>
              )}
            </Group>
          </Group>
        </Card>
      </Stack>
    </form>
  )
}
