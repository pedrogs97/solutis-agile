'use client'

import { Button, Card, Flex, Loader, Tabs, Text } from '@mantine/core'
import { modals } from '@mantine/modals'
import { showNotification } from '@mantine/notifications'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react'
import { lazy, Suspense, useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'

import ClickSignIcon from '@/assets/icons/clicksign-icon.svg'
import { Breadcrumbs } from '@/components/common/breadcrumbs'
import { PageSectionHeader } from '@/components/common/page-section-header'
import FormSkeleton from '@/components/common/skeletons/form-skeleton'
import { ServerError } from '@/components/server-error'
import { type FormDataLendingContract } from '@/hooks/lending/types'
import { useLendingDocuments } from '@/hooks/lending/useLendingDocuments'
import { useLendingPermissions } from '@/hooks/lending/useLendingPermissions'
import { useThemeColors } from '@/hooks/useThemeColors'
import axios from '@/lib/axios'
import { fetchLending } from '@/services/api/lending-contract'

// Lazy load tab components for better performance
const GeneralDataTab = lazy(
  () => import('@/components/lendings/tabs/general-data-tab'),
)
const ContractTab = lazy(
  () => import('@/components/lendings/tabs/contract-tab'),
)
const RevokeTab = lazy(() => import('@/components/lendings/tabs/revoke-tab'))

export const Route = createFileRoute('/_dashboard/lendings/edit/$id')({
  errorComponent: ({ error }) => (
    <ServerError error={error} context="dashboard/lendings/edit-route" />
  ),
  component: EditLendingContractPageRefactored,
  pendingComponent: () => <FormSkeleton />,
})

function EditLendingContractPageRefactored() {
  const { id } = useParams({ from: '/_dashboard/lendings/edit/$id' })
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<string | null>('general-data')
  const [generalDataForm, setGeneralDataForm] =
    useState<UseFormReturn<FormDataLendingContract> | null>(null)
  const [isSendingClicksign, setIsSendingClicksign] = useState(false)

  const {
    getContentBackgroundColor,
    getSecondaryTextColor,
    getCardBackgroundColor,
  } = useThemeColors()

  const handleNextTab = () => {
    if (activeTab === 'general-data') {
      setActiveTab('contract')
    } else if (activeTab === 'contract') {
      setActiveTab('revoke')
    }
  }

  const handlePreviousTab = () => {
    if (activeTab === 'contract') {
      setActiveTab('general-data')
    } else if (activeTab === 'revoke') {
      setActiveTab('contract')
    } else {
      // If on first tab, go back to list
      navigate({ to: '/lendings' })
    }
  }

  const { canEdit, canDelete } = useLendingPermissions({ lendingId: id })
  const { withDownloadNotification } = useLendingDocuments()

  // Fetch lending data
  const { data: lendingData, isLoading } = useQuery({
    queryKey: ['fetchLending', id],
    queryFn: () => fetchLending(id),
    enabled: !!id,
  })

  const isSigned = Boolean(lendingData?.signedDate)
  const isSignedRevoke = Boolean(lendingData?.revokeSignedDate)
  const isEnableSendToClicksign = () => {
    if (!lendingData || !canEdit) return false
    if (lendingData.document && !isSigned) return true
    if (lendingData.documentRevoke && !isSignedRevoke) return true
    return false
  }

  const handleInvalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['fetchLending', id] })
  }

  const handleSendToClicksign = async () => {
    if (!id || isSendingClicksign || !isEnableSendToClicksign()) return

    try {
      setIsSendingClicksign(true)
      if (lendingData.document && !lendingData.documentRevoke) {
        await axios.post('/documents/send/clicksign/', {
          documentId: lendingData.document,
        })
      } else if (lendingData.documentRevoke) {
        await axios.post('/documents/send/clicksign/', {
          documentId: lendingData.documentRevoke,
        })
      } else {
        showNotification({
          title: 'Documento não encontrado',
          message: 'Não há documento disponível para envio ao Clicksign.',
          color: 'red',
        })
        return
      }
      showNotification({
        title: 'Documento enviado',
        message: 'Contrato encaminhado para assinatura via Clicksign.',
        color: 'teal',
      })
    } catch {
      showNotification({
        title: 'Falha ao enviar',
        message:
          'Não foi possível enviar o contrato para o Clicksign. Tente novamente em instantes.',
        color: 'red',
      })
    } finally {
      setIsSendingClicksign(false)
    }
  }

  const openConfirmSendToClicksignModal = () => {
    if (!isEnableSendToClicksign() || !lendingData) return
    modals.openConfirmModal({
      title: 'Enviar via Clicksign',
      centered: true,
      labels: { confirm: 'Enviar', cancel: 'Cancelar' },
      confirmProps: { color: 'orange' },
      children: (
        <Text size="sm">
          Deseja realmente enviar este contrato para assinatura via Clicksign?
          Os signatários receberão uma notificação imediatamente.
        </Text>
      ),
      onConfirm: () => void handleSendToClicksign(),
    })
  }

  if (isLoading) {
    return <FormSkeleton />
  }

  return (
    <>
      <Breadcrumbs />
      <PageSectionHeader title="Editar contrato" />
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
          value={activeTab}
          onChange={setActiveTab}
        >
          <Tabs.List>
            <Tabs.Tab value="general-data" mb={20}>
              <Text size="sm" fw={700} c={getSecondaryTextColor()}>
                Dados Gerais
              </Text>
            </Tabs.Tab>
            <Tabs.Tab value="contract" mb={20}>
              <Text size="sm" fw={700} c={getSecondaryTextColor()}>
                Contrato
              </Text>
            </Tabs.Tab>
            {isSigned && (
              <Tabs.Tab value="revoke" mb={20}>
                <Text size="sm" fw={700} c={getSecondaryTextColor()}>
                  Distrato
                </Text>
              </Tabs.Tab>
            )}
          </Tabs.List>

          <Tabs.Panel value="general-data">
            <Suspense fallback={<Loader />}>
              <GeneralDataTab
                variant="edit"
                lendingId={id}
                lendingData={lendingData}
                canEdit={canEdit}
                canDelete={canDelete}
                onInvalidate={handleInvalidate}
                onFormReady={setGeneralDataForm}
              />
            </Suspense>
          </Tabs.Panel>

          <Tabs.Panel value="contract">
            <Suspense fallback={<Loader />}>
              {generalDataForm ? (
                <ContractTab
                  variant="edit"
                  lendingId={id}
                  lendingData={lendingData}
                  canEdit={canEdit}
                  onInvalidate={handleInvalidate}
                  withDownloadNotification={withDownloadNotification}
                  form={generalDataForm}
                />
              ) : (
                <Loader />
              )}
            </Suspense>
          </Tabs.Panel>

          {isSigned && (
            <Tabs.Panel value="revoke">
              <Suspense fallback={<Loader />}>
                {generalDataForm ? (
                  <RevokeTab
                    lendingId={id}
                    lendingData={lendingData}
                    canEdit={canEdit}
                    onInvalidate={handleInvalidate}
                    withDownloadNotification={withDownloadNotification}
                    form={generalDataForm}
                  />
                ) : (
                  <Loader />
                )}
              </Suspense>
            </Tabs.Panel>
          )}
        </Tabs>

        <Flex justify="space-between" align="center" mt={25}>
          <Button
            type="button"
            color="gray"
            variant="outline"
            radius="md"
            onClick={handlePreviousTab}
          >
            <ArrowLeftIcon size={16} />
            &nbsp;Voltar
          </Button>
          <Flex gap="sm" align="center">
            <Button
              type="button"
              color="var(--mantine-color-orange-6)"
              variant="outline"
              radius="md"
              loading={isSendingClicksign}
              onClick={openConfirmSendToClicksignModal}
              disabled={!isEnableSendToClicksign()}
              leftSection={
                <img
                  src={ClickSignIcon}
                  alt="Clicksign"
                  style={{ height: 16 }}
                />
              }
            >
              Enviar via Clicksign
            </Button>

            {activeTab === 'general-data' && canEdit && (
              <Button
                type="submit"
                color="blue"
                variant="outline"
                radius="md"
                form="general-data-form"
              >
                Salvar
              </Button>
            )}

            {(activeTab === 'general-data' ||
              (activeTab === 'contract' && isSigned)) && (
              <Button
                type="button"
                color="blue"
                variant="filled"
                radius="md"
                onClick={handleNextTab}
              >
                Próximo&nbsp;
                <ArrowRightIcon size={16} />
              </Button>
            )}
          </Flex>
        </Flex>
      </Card>
    </>
  )
}
