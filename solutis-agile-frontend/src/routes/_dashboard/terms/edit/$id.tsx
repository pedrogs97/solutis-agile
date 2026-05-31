'use client'

import { Button, Card, Flex, Grid, Tabs, Text } from '@mantine/core'
import { modals } from '@mantine/modals'
import { showNotification } from '@mantine/notifications'
import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { useState } from 'react'
import { FormProvider } from 'react-hook-form'

import ClickSignIcon from '@/assets/icons/clicksign-icon.svg'
import { Breadcrumbs } from '@/components/common/breadcrumbs'
import { PageSectionHeader } from '@/components/common/page-section-header'
import { ReadOnlyField } from '@/components/common/read-only-field'
import FormSkeleton from '@/components/common/skeletons/form-skeleton'
import Textarea from '@/components/common/textarea'
import { ServerError } from '@/components/server-error'
import ContractTab from '@/components/terms/tabs/contract-tab'
import RevokeTab from '@/components/terms/tabs/revoke-tab'
import useTermDetail from '@/hooks/term/useTermDetail'
import { useThemeColors } from '@/hooks/useThemeColors'
import axios from '@/lib/axios'

export const Route = createFileRoute('/_dashboard/terms/edit/$id')({
  errorComponent: ({ error }) => (
    <ServerError error={error} context="dashboard/terms/edit-route" />
  ),
  pendingComponent: () => <FormSkeleton />,
  component: EditTermPage,
})

function EditTermPage() {
  const { id } = useParams({ from: '/_dashboard/terms/edit/$id' })
  const navigate = useNavigate()
  const [isSendingClicksign, setIsSendingClicksign] = useState(false)
  const {
    getContentBackgroundColor,
    getSecondaryTextColor,
    getCardBackgroundColor,
  } = useThemeColors()
  const {
    form,
    onSubmit,
    activeTab,
    setActiveTab,
    file,
    setFile,
    resetRef,
    clearFile,
    lendingTermData,
    onDownloadLendingTerm,
    fileRevoke,
    setFileRevoke,
    resetRevokeRef,
    clearRevokeFile,
    onDownloadRevokeLendingTerm,
    onTerminateLendingTerm,
    canEdit,
    openConfirmModalDeleteTerm,
    canDelete,
    principalSigner,
    employeeSigner,
  } = useTermDetail({ id })

  const typeValue = lendingTermData?.type?.name ?? ''
  const descriptionValue = lendingTermData?.item?.description ?? ''
  const quantityValue = lendingTermData?.item?.quantity
  const valueValue = lendingTermData?.item?.value
  const sizeValue = lendingTermData?.item?.size ?? ''
  const lineNumberValue = lendingTermData?.item?.lineNumber ?? ''
  const operatorValue = lendingTermData?.item?.operator ?? ''
  const employeeValue = lendingTermData?.employee?.fullName ?? ''
  const managerValue = lendingTermData?.manager ?? ''
  const workloadValue = lendingTermData?.workload?.name ?? ''
  const costCenterValue = lendingTermData?.costCenter?.name ?? ''
  const projectValue = lendingTermData?.project ?? ''
  const businessExecutiveValue = lendingTermData?.businessExecutive ?? ''
  const locationValue = lendingTermData?.location ?? ''

  const handleNextTab = () => {
    if (activeTab === 'general-data') {
      setActiveTab('contract')
    } else if (activeTab === 'contract' && lendingTermData?.signedDate) {
      setActiveTab('revoke')
    }
  }

  const handlePreviousTab = () => {
    if (activeTab === 'contract') {
      setActiveTab('general-data')
    } else if (activeTab === 'revoke') {
      setActiveTab('contract')
    } else {
      navigate({ to: '/terms' })
    }
  }

  const isTermSigned = Boolean(lendingTermData?.signedDate)
  const isGeneralTab = activeTab === 'general-data'
  const isContractTabWithSigned = activeTab === 'contract' && isTermSigned
  const shouldShowOnlySave = !isGeneralTab && !isContractTabWithSigned

  const handleSendToClicksign = async () => {
    if (!id || isSendingClicksign || isTermSigned || !lendingTermData) return

    try {
      setIsSendingClicksign(true)
      await axios.post('/documents/send/clicksign/', { documentId: id })
      showNotification({
        title: 'Documento enviado',
        message: 'Termo encaminhado para assinatura via Clicksign.',
        color: 'teal',
      })
    } catch {
      showNotification({
        title: 'Falha ao enviar',
        message:
          'Não foi possível enviar o termo para o Clicksign. Tente novamente em instantes.',
        color: 'red',
      })
    } finally {
      setIsSendingClicksign(false)
    }
  }

  const openConfirmSendToClicksignModal = () => {
    if (!lendingTermData || isTermSigned) return
    modals.openConfirmModal({
      title: 'Enviar via Clicksign',
      centered: true,
      labels: { confirm: 'Enviar', cancel: 'Cancelar' },
      confirmProps: { color: 'orange' },
      children: (
        <Text size="sm">
          Deseja realmente enviar este termo para assinatura via Clicksign? Os
          signatários serão notificados imediatamente.
        </Text>
      ),
      onConfirm: () => void handleSendToClicksign(),
    })
  }

  return (
    <>
      <Breadcrumbs />
      <PageSectionHeader title="Editar termo" />
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
            {lendingTermData?.signedDate && (
              <Tabs.Tab value="revoke" mb={20}>
                <Text size="sm" fw={700} c={getSecondaryTextColor()}>
                  Distrato
                </Text>
              </Tabs.Tab>
            )}
          </Tabs.List>

          <Tabs.Panel value="general-data">
            <FormProvider {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <Grid my={10}>
                  <Grid.Col span={{ base: 12, xs: 2 }}>
                    <ReadOnlyField label="Tipo" value={typeValue} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, xs: 5.3 }}>
                    <ReadOnlyField
                      label={
                        typeValue === 'Kit de Ferramentas'
                          ? 'Descrição do Kit de Ferramentas'
                          : 'Descrição'
                      }
                      value={descriptionValue}
                    />
                  </Grid.Col>
                  {typeValue === 'Fardamento' && (
                    <>
                      <Grid.Col span={{ base: 12, xs: 1.5 }}>
                        <ReadOnlyField
                          label="Quantidade"
                          value={
                            quantityValue !== undefined &&
                            quantityValue !== null
                              ? String(quantityValue)
                              : undefined
                          }
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, xs: 1.5 }}>
                        <ReadOnlyField
                          label="Valor"
                          value={
                            valueValue !== undefined && valueValue !== null
                              ? String(valueValue)
                              : undefined
                          }
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, xs: 1.7 }}>
                        <ReadOnlyField label="Tamanho" value={sizeValue} />
                      </Grid.Col>
                    </>
                  )}
                  {typeValue === 'Chip' && (
                    <>
                      <Grid.Col span={{ base: 12, xs: 2.5 }}>
                        <ReadOnlyField
                          label="Número da Linha"
                          value={lineNumberValue}
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, xs: 2 }}>
                        <ReadOnlyField
                          label="Operadora"
                          value={operatorValue}
                        />
                      </Grid.Col>
                    </>
                  )}
                </Grid>
                <Grid my={10}>
                  <Grid.Col span={{ base: 12, xs: 6 }}>
                    <ReadOnlyField label="Colaborador" value={employeeValue} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, xs: 3 }}>
                    <ReadOnlyField label="Gestor" value={managerValue} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, xs: 3 }}>
                    <ReadOnlyField label="Lotação" value={workloadValue} />
                  </Grid.Col>
                </Grid>
                <Grid my={10}>
                  <Grid.Col span={{ base: 12, xs: 4 }}>
                    <ReadOnlyField
                      label="Centro de custo"
                      value={costCenterValue}
                    />
                  </Grid.Col>
                </Grid>
                <Grid my={10}>
                  <Grid.Col span={{ base: 12, xs: 3 }}>
                    <ReadOnlyField label="Projeto" value={projectValue} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, xs: 3 }}>
                    <ReadOnlyField
                      label="Executivo"
                      value={businessExecutiveValue}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, xs: 3 }}>
                    <ReadOnlyField
                      label="Origem do Termo"
                      value={locationValue}
                    />
                  </Grid.Col>
                </Grid>
                <Grid my={10}>
                  <Grid.Col span={{ base: 12, xs: 12 }}>
                    <Textarea
                      label="Observação"
                      name="observations"
                      rows={7}
                      maxLength={255}
                    />
                  </Grid.Col>
                </Grid>
              </form>
            </FormProvider>
          </Tabs.Panel>

          <Tabs.Panel value="contract">
            <ContractTab
              termData={lendingTermData}
              canEdit={canEdit}
              file={file}
              onFileChange={setFile}
              onClearFile={clearFile}
              resetRef={resetRef}
              onDownloadContract={onDownloadLendingTerm}
              onConfirmUpload={() => form.handleSubmit(onSubmit)()}
              isSubmitting={form.formState.isSubmitting}
            />
          </Tabs.Panel>

          {lendingTermData?.signedDate && (
            <Tabs.Panel value="revoke">
              <RevokeTab
                termData={lendingTermData}
                canEdit={canEdit}
                fileRevoke={fileRevoke}
                onFileChange={setFileRevoke}
                onClearFile={clearRevokeFile}
                resetRef={resetRevokeRef}
                onConfirmDistrato={onTerminateLendingTerm}
                onDownloadDistrato={onDownloadRevokeLendingTerm}
                onConfirmUpload={() => form.handleSubmit(onSubmit)()}
                isSubmitting={form.formState.isSubmitting}
                principalSigner={principalSigner}
                employeeSigner={employeeSigner}
                form={form}
              />
            </Tabs.Panel>
          )}
        </Tabs>

        <Flex justify="space-between" mt={25}>
          <Button
            type="button"
            color="gray"
            variant="outline"
            radius="md"
            onClick={handlePreviousTab}
          >
            <ArrowLeft size={16} />
            &nbsp;Voltar
          </Button>

          <Flex gap="sm">
            {canEdit && (
              <Button
                type="button"
                color="var(--mantine-color-orange-6)"
                variant="outline"
                radius="md"
                loading={isSendingClicksign}
                onClick={openConfirmSendToClicksignModal}
                disabled={!lendingTermData || isTermSigned}
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
            )}

            {canDelete && isGeneralTab && (
              <Button
                type="button"
                color="red"
                variant="outline"
                radius="md"
                onClick={() => openConfirmModalDeleteTerm()}
              >
                Excluir
              </Button>
            )}

            {(isGeneralTab || isContractTabWithSigned) && (
              <>
                {canEdit && (
                  <Button
                    type="button"
                    variant="outline"
                    radius="md"
                    onClick={() => {
                      onSubmit(form.getValues())
                    }}
                  >
                    Salvar&nbsp;
                    <Check size={16} />
                  </Button>
                )}
                <Button
                  type="button"
                  color="blue"
                  variant="filled"
                  radius="md"
                  onClick={handleNextTab}
                >
                  Próximo&nbsp;
                  <ArrowRight size={16} />
                </Button>
              </>
            )}

            {shouldShowOnlySave && canEdit && (
              <Button
                type="button"
                variant="outline"
                radius="md"
                onClick={() => {
                  onSubmit(form.getValues())
                }}
              >
                Salvar&nbsp;
                <Check size={16} />
              </Button>
            )}
          </Flex>
        </Flex>
      </Card>
    </>
  )
}
