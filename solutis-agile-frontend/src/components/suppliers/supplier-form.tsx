'use client'

import {
  Button,
  Card,
  Flex,
  Group,
  Loader,
  LoadingOverlay,
  Modal,
  Tabs,
  Text,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useNavigate } from '@tanstack/react-router'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import {
  lazy,
  type RefObject,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { FormProvider } from 'react-hook-form'

import { Can } from '@/components/providers/ability'
import { GeneralDataTab } from '@/components/suppliers/form/general-data-tab'
import {
  type MatrixDraftDecision,
  type ResponsibilityMatrixTabRef,
} from '@/components/suppliers/form/responsibility-matrix-tab'
import {
  type SupplierFormData,
  useSupplierForm,
} from '@/hooks/supplier/useSupplierForm'
import { useThemeColors } from '@/hooks/useThemeColors'
import { type ResponsibilityMatrixData } from '@/services/api/supplier'

import { Breadcrumbs } from '../common/breadcrumbs'
import { PageSectionHeader } from '../common/page-section-header'

const AdditionalDataTab = lazy(async () => {
  const module = await import('@/components/suppliers/form/additional-data-tab')
  return { default: module.AdditionalDataTab }
})

// const TaxesTab = lazy(async () => {
//   const module = await import('@/components/suppliers/form/taxes-tab')
//   return { default: module.TaxesTab }
// })

const AttachmentsTab = lazy(async () => {
  const module = await import('@/components/suppliers/form/attachments-tab')
  return { default: module.AttachmentsTab }
})

const ResponsibilityMatrixTab = lazy(async () => {
  const module =
    await import('@/components/suppliers/form/responsibility-matrix-tab')
  return { default: module.ResponsibilityMatrixTab }
})

const ApprovalWorkflowTab = lazy(async () => {
  const module =
    await import('@/components/suppliers/form/approval-workflow-tab')
  return { default: module.ApprovalWorkflowTab }
})

const PerformanceEvaluationTab = lazy(async () => {
  const module =
    await import('@/components/suppliers/form/performance-evaluation-tab')
  return { default: module.PerformanceEvaluationTab }
})

interface SupplierFormProps {
  mode: 'create' | 'edit'
  supplierId?: string
  initialData?: SupplierFormData
  supplierName?: string
  existingAttachments?: Array<{
    id: number
    attachmentTypeId?: string | number
    attachmentTypeName: string
    fileName: string
    description: string | null
  }>
  responsibilityMatrixInitialData?: ResponsibilityMatrixData
}

export function SupplierForm({
  mode,
  supplierId,
  initialData,
  supplierName,
  existingAttachments,
  responsibilityMatrixInitialData,
}: SupplierFormProps) {
  const {
    getContentBackgroundColor,
    getSecondaryTextColor,
    getCardBackgroundColor,
  } = useThemeColors()
  const navigate = useNavigate()
  const responsibilityMatrixTabRef = useRef<ResponsibilityMatrixTabRef>(null)

  const handleGetResponsibilityMatrixData = async (
    supplierId: number,
  ): Promise<ResponsibilityMatrixData> => {
    if (!responsibilityMatrixTabRef.current) {
      throw new Error('Responsibility matrix tab ref is not available')
    }
    return responsibilityMatrixTabRef.current.getMatrixData(supplierId)
  }

  const {
    form,
    tabs,
    activeTab,
    currentStep,
    completedSteps,
    attachmentFiles,
    setAttachmentFiles,
    handleNextStep,
    handlePreviousStep,
    handleTabChange,
    handleFinalSubmit,
    handleSaveProgress,
    isPending,
    isSaving,
    isLastStep,
    isFirstStep,
    formPersistence,
    clearAllDrafts,
  } = useSupplierForm({
    mode,
    supplierId,
    initialData,
    responsibilityMatrixInitialData,
    onGetResponsibilityMatrixData: handleGetResponsibilityMatrixData,
    matrixTabRef:
      responsibilityMatrixTabRef as RefObject<ResponsibilityMatrixTabRef>,
  })

  // Modal para restaurar rascunho salvo
  const [draftModalOpened, { open: openDraftModal, close: closeDraftModal }] =
    useDisclosure(false)
  const [draftDecision, setDraftDecision] =
    useState<MatrixDraftDecision>('none')
  const [hasCheckedDraftOnLoad, setHasCheckedDraftOnLoad] = useState(false)
  const hasUnsavedChanges = form.formState.isDirty

  const hasMatrixDraft = () => {
    try {
      const stored = localStorage.getItem('form_draft_supplier_matrix')
      if (!stored) return false

      const parsed = JSON.parse(stored) as Record<string, unknown>
      const hasMeaningfulValue = Object.values(parsed).some((value) => {
        if (typeof value !== 'string') return false
        const normalized = value.trim()
        return normalized.length > 0 && normalized !== '-'
      })

      if (!hasMeaningfulValue) {
        localStorage.removeItem('form_draft_supplier_matrix')
      }

      return hasMeaningfulValue
    } catch {
      return false
    }
  }

  useEffect(() => {
    if (mode !== 'create' || hasCheckedDraftOnLoad) return

    if (formPersistence.hasDraft() || hasMatrixDraft()) {
      setDraftDecision('pending')
      openDraftModal()
    } else {
      setDraftDecision('none')
    }

    setHasCheckedDraftOnLoad(true)
  }, [mode, hasCheckedDraftOnLoad, formPersistence, openDraftModal])

  const handleRestoreDraft = () => {
    formPersistence.restoreDraft()
    // Sempre tentar restaurar a matriz, mesmo que só ela tenha rascunho
    setDraftDecision('restore')
    closeDraftModal()
  }

  const handleDiscardDraft = () => {
    clearAllDrafts()
    setDraftDecision('discard')
    closeDraftModal()
  }

  const formattedDraftDate = useMemo(() => {
    if (mode !== 'create' || hasUnsavedChanges) {
      return ''
    }

    const draftTimestamp = formPersistence.getDraftTimestamp()
    if (!draftTimestamp) {
      return ''
    }

    return format(draftTimestamp, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
      locale: ptBR,
    })
  }, [mode, hasUnsavedChanges, formPersistence.getDraftTimestamp])

  const pageTitle = mode === 'create' ? 'Novo Fornecedor' : 'Editar Fornecedor'
  const tabContentFallback = (
    <Flex align="center" justify="center" mih={200}>
      <Loader size="sm" />
    </Flex>
  )
  const formStatusText =
    mode === 'create'
      ? hasUnsavedChanges
        ? 'Rascunho automático ativo (até 2s)'
        : formattedDraftDate
          ? `Rascunho salvo em ${formattedDraftDate}`
          : 'Sem rascunho local'
      : isSaving
        ? 'Salvando alterações...'
        : hasUnsavedChanges
          ? 'Alterações não salvas'
          : 'Alterações salvas'
  const formStatusColor = hasUnsavedChanges ? 'orange.7' : 'dimmed'

  return (
    <Can I={mode === 'create' ? 'add' : 'edit'} a="supplier">
      {/* Modal de restauração de rascunho */}
      <Modal
        opened={draftModalOpened}
        onClose={() => {}}
        title="Rascunho encontrado"
        centered
        closeOnClickOutside={false}
        closeOnEscape={false}
        withCloseButton={false}
      >
        <Text size="sm" mb="md">
          Encontramos um rascunho salvo de um formulário anterior.
          {formattedDraftDate && (
            <>
              <br />
              <Text span fw={500}>
                Salvo em: {formattedDraftDate}
              </Text>
            </>
          )}
        </Text>
        <Text size="sm" c="dimmed" mb="lg">
          Deseja restaurar os dados do rascunho ou começar um novo formulário?
        </Text>
        <Group justify="flex-end">
          <Button variant="outline" color="gray" onClick={handleDiscardDraft}>
            Começar novo
          </Button>
          <Button onClick={handleRestoreDraft}>Restaurar rascunho</Button>
        </Group>
      </Modal>

      <Breadcrumbs />
      <PageSectionHeader title={pageTitle} />
      <FormProvider {...form}>
        <Card
          shadow="sm"
          p={20}
          style={{ borderRadius: 25 }}
          bg={getContentBackgroundColor()}
          pos="relative"
        >
          <LoadingOverlay visible={isPending} />

          <Tabs
            color={getCardBackgroundColor()}
            variant="pills"
            radius="md"
            value={activeTab}
            onChange={handleTabChange}
            keepMounted={false}
          >
            <Flex justify="space-between" align="center" mb="sm">
              <Text size="sm" c="dimmed">
                Etapa {currentStep} de {tabs.length}
              </Text>
              <Text size="sm" c={formStatusColor}>
                {formStatusText}
              </Text>
            </Flex>

            <Tabs.List mb={20}>
              {tabs.map((tab) => (
                <Tabs.Tab key={tab.value} value={tab.value}>
                  <Text size="sm" fw={700} c={getSecondaryTextColor()}>
                    {tab.label}
                    {completedSteps.includes(tab.step) ? ' ✓' : ''}
                  </Text>
                </Tabs.Tab>
              ))}
            </Tabs.List>

            <Tabs.Panel value="general-data">
              <Card
                shadow="sm"
                p={20}
                style={{
                  borderRadius: 16,
                  minHeight: 400,
                }}
                bg={getContentBackgroundColor()}
              >
                <GeneralDataTab />
              </Card>
            </Tabs.Panel>

            <Tabs.Panel value="additional-data">
              <Card
                shadow="sm"
                p={20}
                style={{
                  borderRadius: 16,
                  minHeight: 400,
                }}
                bg={getContentBackgroundColor()}
              >
                <Suspense fallback={tabContentFallback}>
                  <AdditionalDataTab
                    isActive={activeTab === 'additional-data'}
                  />
                </Suspense>
              </Card>
            </Tabs.Panel>

            {/*
            <Tabs.Panel value="taxes">
              <Card
                shadow="sm"
                p={20}
                style={{
                  borderRadius: 16,
                  minHeight: 400,
                }}
                bg={getContentBackgroundColor()}
              >
                <Suspense fallback={tabContentFallback}>
                  <TaxesTab isActive={activeTab === 'taxes'} />
                </Suspense>
              </Card>
            </Tabs.Panel>
            */}

            <Tabs.Panel value="attachments">
              <Card
                shadow="sm"
                p={20}
                style={{
                  borderRadius: 16,
                  minHeight: 400,
                }}
                bg={getContentBackgroundColor()}
              >
                <Suspense fallback={tabContentFallback}>
                  <AttachmentsTab
                    files={attachmentFiles}
                    onFilesChange={setAttachmentFiles}
                    existingAttachments={existingAttachments}
                    supplierId={supplierId}
                    isActive={activeTab === 'attachments'}
                  />
                </Suspense>
              </Card>
            </Tabs.Panel>

            <Tabs.Panel value="responsibility-matrix">
              <Card
                shadow="sm"
                p={20}
                style={{
                  borderRadius: 16,
                  minHeight: 400,
                }}
                bg={getContentBackgroundColor()}
              >
                <Suspense fallback={tabContentFallback}>
                  <ResponsibilityMatrixTab
                    ref={responsibilityMatrixTabRef}
                    initialData={responsibilityMatrixInitialData}
                    mode={mode}
                    draftDecision={draftDecision}
                  />
                </Suspense>
              </Card>
            </Tabs.Panel>

            <Tabs.Panel value="approval-workflow">
              <Card
                shadow="sm"
                p={20}
                style={{
                  borderRadius: 16,
                  minHeight: 400,
                }}
                bg={getContentBackgroundColor()}
              >
                <Suspense fallback={tabContentFallback}>
                  <ApprovalWorkflowTab
                    mode={mode}
                    supplierId={supplierId}
                    supplierName={supplierName}
                  />
                </Suspense>
              </Card>
            </Tabs.Panel>

            {mode === 'edit' && (
              <Tabs.Panel value="performance-evaluation">
                <Card
                  shadow="sm"
                  p={20}
                  style={{
                    borderRadius: 16,
                    minHeight: 400,
                  }}
                  bg={getContentBackgroundColor()}
                >
                  <Suspense fallback={tabContentFallback}>
                    <PerformanceEvaluationTab
                      supplierId={supplierId ? Number(supplierId) : undefined}
                    />
                  </Suspense>
                </Card>
              </Tabs.Panel>
            )}
          </Tabs>

          <Flex
            justify="space-between"
            mt="xl"
            pt="md"
            pos="sticky"
            bottom={0}
            bg={getContentBackgroundColor()}
            style={{
              borderTop: '1px solid var(--mantine-color-default-border)',
              zIndex: 10,
            }}
          >
            <Button
              variant="outline"
              onClick={
                isFirstStep
                  ? () => navigate({ to: '/suppliers' })
                  : handlePreviousStep
              }
              disabled={isPending}
            >
              <ArrowLeft size={16} />
              &nbsp;{isFirstStep ? 'Cancelar' : 'Anterior'}
            </Button>

            <Group>
              {mode === 'edit' && (
                <Button
                  variant="light"
                  onClick={handleSaveProgress}
                  loading={isSaving || isPending}
                >
                  Salvar
                </Button>
              )}

              {(mode === 'create' || !isLastStep) && (
                <Button
                  onClick={isLastStep ? handleFinalSubmit : handleNextStep}
                  loading={isPending}
                >
                  {isLastStep ? (
                    'Criar Fornecedor'
                  ) : (
                    <>
                      Próximo&nbsp;
                      <ArrowRight size={16} />
                    </>
                  )}
                </Button>
              )}
            </Group>
          </Flex>
        </Card>
      </FormProvider>
    </Can>
  )
}
