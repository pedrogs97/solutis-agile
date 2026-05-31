'use client'

import 'yet-another-react-lightbox/styles.css'

import { Button, Card, Group, Modal, Tabs, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useEffect, useRef } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import Download from 'yet-another-react-lightbox/plugins/download'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'

import { Breadcrumbs } from '@/components/common/breadcrumbs'
import { PageSectionHeader } from '@/components/common/page-section-header'
import FormSkeleton from '@/components/common/skeletons/form-skeleton'
import ContractTab from '@/components/lendings/tabs/contract-tab'
import GeneralDataTab from '@/components/lendings/tabs/general-data-tab'
import VerificationForm from '@/components/lendings/VerificationForm'
import { ServerError } from '@/components/server-error'
import useContractLendingDetail from '@/hooks/lending/useContractLendingDetail'
import { useThemeColors } from '@/hooks/useThemeColors'

export const Route = createFileRoute('/_dashboard/lendings/add/')({
  errorComponent: ({ error }) => (
    <ServerError error={error} context="dashboard/lendings/add-route" />
  ),
  pendingComponent: () => <FormSkeleton />,
  component: AddLendingContractPage,
})

function AddLendingContractPage() {
  const navigate = useNavigate()
  const {
    getContentBackgroundColor,
    getSecondaryTextColor,
    getCardBackgroundColor,
  } = useThemeColors()
  const hook = useContractLendingDetail()

  // Modal de restauração de rascunho
  const [draftModalOpened, { open: openDraftModal, close: closeDraftModal }] =
    useDisclosure(false)
  const draftHandledRef = useRef(false)

  useEffect(() => {
    if (!draftHandledRef.current && hook.formPersistence.hasDraft()) {
      openDraftModal()
    }
  }, [hook.formPersistence, openDraftModal])

  const handleRestoreDraft = () => {
    draftHandledRef.current = true
    hook.formPersistence.restoreDraft()
    closeDraftModal()
  }

  const handleDiscardDraft = () => {
    draftHandledRef.current = true
    hook.formPersistence.clearStorage()
    closeDraftModal()
  }

  const draftTimestamp = hook.formPersistence.getDraftTimestamp()
  const formattedDraftDate = draftTimestamp
    ? format(draftTimestamp, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
        locale: ptBR,
      })
    : ''

  const handleBack = () => {
    navigate({ to: '/lendings' })
  }

  const handleContractBack = () => {
    hook.setActiveTab('general-data')
  }

  const handleContractNext = async () => {
    // If there's verification, go to verification tab
    if (hook.hasVerification) {
      hook.setActiveTab('question-verification')
    } else {
      // Otherwise submit general data to create lending directly
      ;(hook.form.handleSubmit as any)((data: any) => {
        hook.openConfirmModalAddContract(data)
      })()
    }
  }

  return (
    <>
      <Lightbox
        open={hook.openLightBox}
        close={() => hook.setOpenLightBox(false)}
        slides={[{ src: '/checklist_notebook.jpg' }]}
        plugins={[Download, Zoom]}
        zoom={{
          maxZoomPixelRatio: 2,
        }}
        carousel={{ finite: true }}
        render={{
          buttonPrev: () => null,
          buttonNext: () => null,
        }}
      />

      {/* Modal de restauração de rascunho */}
      <Modal
        opened={draftModalOpened}
        onClose={handleDiscardDraft}
        title="Rascunho encontrado"
        centered
      >
        <Text size="sm" mb="md">
          Foi encontrado um rascunho salvo automaticamente em{' '}
          <strong>{formattedDraftDate}</strong>. Deseja continuar de onde parou?
        </Text>
        <Group justify="flex-end" gap="sm">
          <Button variant="outline" onClick={handleDiscardDraft}>
            Descartar
          </Button>
          <Button onClick={handleRestoreDraft}>Restaurar</Button>
        </Group>
      </Modal>

      <Breadcrumbs />
      <PageSectionHeader title="Novo contrato" />
      <Card
        shadow="sm"
        p={20}
        style={{
          borderRadius: 25,
          minHeight: 350,
        }}
        bg={getContentBackgroundColor()}
      >
        <Tabs
          color={getCardBackgroundColor()}
          variant="pills"
          radius="md"
          defaultValue="general-data"
          value={hook.activeTab}
          onChange={hook.handleTabChange}
        >
          <Tabs.List>
            <Tabs.Tab value="general-data" mb={20}>
              <Text size="sm" fw={700} c={getSecondaryTextColor()}>
                Dados Gerais
              </Text>
            </Tabs.Tab>
            <Tabs.Tab value="contract-upload" mb={20}>
              <Text size="sm" fw={700} c={getSecondaryTextColor()}>
                Contrato
              </Text>
            </Tabs.Tab>
            {hook.hasVerification && (
              <Tabs.Tab value="question-verification" mb={20}>
                <Text size="sm" fw={700} c={getSecondaryTextColor()}>
                  Verificação do Ativo
                </Text>
              </Tabs.Tab>
            )}
          </Tabs.List>

          <Tabs.Panel value="general-data">
            <GeneralDataTab
              variant="create"
              form={hook.form}
              fetchEmployeeOptions={hook.fetchEmployeeOptions}
              fetchAssetOptions={hook.fetchAssetOptions}
              fetchWitnessesOptions={hook.fetchWitnessesOptions}
              setAssetType={hook.setAssetType}
              workloads={hook.workloads}
              isPendingWorkloads={hook.isPendingWorkloads}
              costCenters={hook.costCenters}
              isPendingCostCenters={hook.isPendingCostCenters}
              onSubmitGeneralData={hook.onSubmitGeneralData}
              back={handleBack}
              isSubmitting={hook.isSubmitting}
              saveAsyncFieldMeta={hook.formPersistence.saveAsyncFieldMeta}
              getAsyncFieldMeta={hook.formPersistence.getAsyncFieldMeta}
            />
          </Tabs.Panel>
          {hook.hasVerification && (
            <Tabs.Panel value="question-verification">
              <VerificationForm
                key={hook.verificationFormKey}
                questions={hook.verificationQuestions}
                defaultAnswered={hook.defaultVerificationAnswers}
                images={hook.verificationImages}
                onAddImages={hook.addVerificationImages}
                onRemoveImage={hook.removeVerificationImage}
                onSubmit={hook.onSubmitQuestionVerification}
                onOpenGuide={() => hook.setOpenLightBox(true)}
                typeId="1"
                isBusy={hook.isSubmitting}
              />
            </Tabs.Panel>
          )}
          <Tabs.Panel value="contract-upload">
            <ContractTab
              variant="create"
              file={hook.file}
              setFile={hook.setFile}
              clearFile={hook.clearFile}
              resetRef={hook.resetRef}
              isSubmitting={hook.isSubmitting}
              hasVerification={hook.hasVerification}
              onBack={handleContractBack}
              onNext={handleContractNext}
            />
          </Tabs.Panel>
        </Tabs>
      </Card>
    </>
  )
}
