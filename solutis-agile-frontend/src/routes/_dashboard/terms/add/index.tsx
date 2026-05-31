'use client'

import {
  Box,
  Button,
  Card,
  Flex,
  Grid,
  Group,
  Modal,
  Tabs,
  Text,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { FormProvider, useWatch } from 'react-hook-form'
import { IMaskInput } from 'react-imask'

import AsyncSelect, { type Option } from '@/components/common/async-select'
import { Breadcrumbs } from '@/components/common/breadcrumbs'
import Input from '@/components/common/input'
import NumberInput from '@/components/common/number-input'
import { PageSectionHeader } from '@/components/common/page-section-header'
import Select from '@/components/common/select'
import FormSkeleton from '@/components/common/skeletons/form-skeleton'
import Textarea from '@/components/common/textarea'
import { FileUploadSection } from '@/components/lendings/file-upload-section'
import { ServerError } from '@/components/server-error'
import { CLOTH_SIZES, CONTRACT_LOCATIONS } from '@/constants/selectOptions'
import useTermDetail from '@/hooks/term/useTermDetail'
import { useThemeColors } from '@/hooks/useThemeColors'

export const Route = createFileRoute('/_dashboard/terms/add/')({
  errorComponent: ({ error }) => (
    <ServerError error={error} context="dashboard/terms/add-route" />
  ),
  pendingComponent: () => <FormSkeleton />,
  component: AddTermContractPage,
})

function AddTermContractPage() {
  const navigate = useNavigate()
  const {
    getContentBackgroundColor,
    getSecondaryTextColor,
    getCardBackgroundColor,
  } = useThemeColors()
  const {
    form,
    onSubmit,
    file,
    setFile,
    clearFile,
    openConfirmAddTermModal,
    resetRef,
    workloads,
    isPendingWorkloads,
    costCenters,
    isPendingCostCenters,
    fetchEmployeeOptions,
    formPersistence,
  } = useTermDetail({ id: null })

  // Otimização: useWatch observa apenas o campo 'type', evitando re-renders desnecessários
  const termType = useWatch({ control: form.control, name: 'type' })

  const [activeTab, setActiveTab] = useState<string | null>('general-data')

  // Modal de restauração de rascunho
  const [draftModalOpened, { open: openDraftModal, close: closeDraftModal }] =
    useDisclosure(false)
  const draftHandledRef = useRef(false)

  useEffect(() => {
    if (!draftHandledRef.current && formPersistence.hasDraft()) {
      openDraftModal()
    }
  }, [formPersistence, openDraftModal])

  const handleRestoreDraft = () => {
    draftHandledRef.current = true
    formPersistence.restoreDraft()
    closeDraftModal()
  }

  const handleDiscardDraft = () => {
    draftHandledRef.current = true
    formPersistence.clearStorage()
    closeDraftModal()
  }

  const draftTimestamp = formPersistence.getDraftTimestamp()
  const formattedDraftDate = draftTimestamp
    ? format(draftTimestamp, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
        locale: ptBR,
      })
    : ''

  // Get initial options from persisted metadata for AsyncSelect
  const employeeInitialOptions = (() => {
    const meta = formPersistence.getAsyncFieldMeta('employeeId')
    return meta ? [{ value: meta.value, label: meta.label }] : undefined
  })()

  const handleNextTab = () => {
    if (activeTab === 'general-data') {
      setActiveTab('contract')
    }
  }

  const handlePreviousTab = () => {
    if (activeTab === 'contract') {
      setActiveTab('general-data')
    } else {
      navigate({ to: '/terms' })
    }
  }

  return (
    <>
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
      <PageSectionHeader title="Novo termo" />
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
          </Tabs.List>

          <Tabs.Panel value="general-data">
            <FormProvider {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <Grid my={12}>
                  <Grid.Col span={{ base: 12, xs: 2 }}>
                    <Select
                      name="type"
                      label="Tipo"
                      placeholder="Selecione o Tipo"
                      data={[
                        { label: 'Kit de Ferramentas', value: '1' },
                        { label: 'Fardamento', value: '2' },
                        { label: 'Chip', value: '3' },
                      ]}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, xs: 5.3 }}>
                    <Input
                      label={
                        termType === '1'
                          ? 'Descrição do Kit de Ferramentas'
                          : 'Descrição'
                      }
                      placeholder={
                        termType === '1'
                          ? 'Digite a descrição do Kit de Ferramentas'
                          : 'Digite a descrição'
                      }
                      name="description"
                    />
                  </Grid.Col>
                  {termType === '2' && (
                    <>
                      <Grid.Col span={{ base: 12, xs: 1.5 }}>
                        <NumberInput
                          label="Quantidade"
                          placeholder="Digite a quantidade"
                          name="quantity"
                          preffix=""
                          decimalScale={0}
                          allowDecimal={false}
                          thousandSeparator=""
                          maxLength={5}
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, xs: 1.5 }}>
                        <NumberInput
                          name="value"
                          label="Valor"
                          placeholder="Digite o valor"
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, xs: 1.7 }}>
                        <Select
                          name="size"
                          label="Tamanho"
                          placeholder="Selecione o tamanho"
                          data={CLOTH_SIZES}
                        />
                      </Grid.Col>
                    </>
                  )}
                  {termType === '3' && (
                    <>
                      <Grid.Col span={{ base: 12, xs: 2.5 }}>
                        <Input
                          label="Número da Linha"
                          placeholder="Digite o número da linha"
                          name="lineNumber"
                          mask="(00) 00000-0000"
                          component={IMaskInput}
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, xs: 2 }}>
                        <Input
                          name="operator"
                          label="Operadora"
                          placeholder="Digite a operadora"
                        />
                      </Grid.Col>
                    </>
                  )}
                </Grid>
                <Grid my={10}>
                  <Grid.Col span={{ base: 12, xs: 6 }}>
                    <AsyncSelect
                      name="employeeId"
                      label="Colaborador"
                      placeholder="Selecione o colaborador"
                      fetcher={fetchEmployeeOptions}
                      initialOptions={employeeInitialOptions}
                      onOptionSelect={(option: Option | null) => {
                        if (option) {
                          formPersistence.saveAsyncFieldMeta('employeeId', {
                            value: option.value,
                            label: option.label,
                          })
                        } else {
                          formPersistence.saveAsyncFieldMeta('employeeId', null)
                        }
                      }}
                      debounceMs={400}
                      minChars={2}
                      preloadOnOpen
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, xs: 3 }}>
                    <Input
                      label="Gestor"
                      placeholder="Digite o gestor"
                      name="manager"
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, xs: 3 }}>
                    <Select
                      name="workloadId"
                      label="Lotação"
                      placeholder="Selecione a lotação"
                      data={workloads}
                      loading={isPendingWorkloads}
                    />
                  </Grid.Col>
                </Grid>
                <Grid my={10}>
                  <Grid.Col span={{ base: 12, xs: 4 }}>
                    <Select
                      name="costCenterId"
                      label="Centro de custo"
                      placeholder="Selecione o centro de custo"
                      data={costCenters}
                      loading={isPendingCostCenters}
                    />
                  </Grid.Col>
                </Grid>
                <Grid my={10}>
                  <Grid.Col span={{ base: 12, xs: 3 }}>
                    <Input
                      label="Projeto"
                      placeholder="Digite o projeto"
                      name="project"
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, xs: 3 }}>
                    <Input
                      label="Executivo"
                      placeholder="Digite o executivo"
                      name="businessExecutive"
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, xs: 3 }}>
                    <Select
                      name="location"
                      label="Origem do Termo"
                      placeholder="Selecione a origem do termo"
                      data={CONTRACT_LOCATIONS}
                    />
                  </Grid.Col>
                </Grid>
                <Grid my={10}>
                  <Grid.Col span={{ base: 12, xs: 12 }}>
                    <Textarea
                      label="Observação"
                      placeholder="Digite a observação"
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
            <Box>
              <Text size="lg" fw={600} mb="xs">
                Carregar Termo
              </Text>
              <Text size="sm" c={getSecondaryTextColor()} mb="md">
                Carregue o termo de responsabilidade assinado para finalizar
              </Text>
            </Box>

            <FileUploadSection
              title="Termo de Responsabilidade"
              description="Clique no botão abaixo e carregue o termo de responsabilidade de comodato assinado"
              file={file}
              onFileChange={setFile}
              onClearFile={clearFile}
              resetRef={resetRef as any}
              disabled={false}
            />
          </Tabs.Panel>
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

          {activeTab === 'general-data' ? (
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
          ) : (
            <Button
              type="button"
              variant="outline"
              radius="md"
              onClick={openConfirmAddTermModal}
            >
              Salvar&nbsp;
              <Check size={16} />
            </Button>
          )}
        </Flex>
      </Card>
    </>
  )
}
