import { Button, Flex, Grid, InputWrapper, Switch } from '@mantine/core'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useEffect } from 'react'
import { Controller, FormProvider, type UseFormReturn } from 'react-hook-form'

import AsyncSelect, { type Option } from '@/components/common/async-select'
import Input from '@/components/common/input'
import { ReadOnlyField } from '@/components/common/read-only-field'
import Select from '@/components/common/select'
import Textarea from '@/components/common/textarea'
import { WitnessSelection } from '@/components/lendings/witness-selection'
import {
  BUSINESS_UNITS,
  CONTRACT_LOCATIONS,
  FORM_FIELD_LIMITS,
  PRINCIPAL_SIGNERS,
} from '@/constants/selectOptions'
import { type FormDataLendingContract } from '@/hooks/lending/types'
import { useGeneralDataTab } from '@/hooks/lending/useGeneralDataTab'
import { type AsyncFieldMetadata } from '@/hooks/useFormPersistence'
import { deleteLending } from '@/services/api/lending-contract'

type CreateGeneralDataTabProps = {
  variant: 'create'
  form: any
  fetchEmployeeOptions: (query: string) => Promise<any>
  fetchAssetOptions: (query: string) => Promise<any>
  fetchWitnessesOptions: (query: string) => Promise<any>
  setAssetType: (type: string) => void
  workloads: any
  isPendingWorkloads: boolean
  costCenters: any
  isPendingCostCenters: boolean
  onSubmitGeneralData: (data: any) => void
  back: () => void
  isSubmitting: boolean
  // Persistence functions for AsyncSelect fields
  saveAsyncFieldMeta?: (
    fieldName: string,
    metadata: AsyncFieldMetadata | null,
  ) => void
  getAsyncFieldMeta?: (fieldName: string) => AsyncFieldMetadata | null
}

type EditGeneralDataTabProps = {
  variant: 'edit'
  lendingId?: string
  lendingData: any
  canEdit: boolean
  canDelete: boolean
  onInvalidate?: () => void
  onFormReady?: (form: UseFormReturn<FormDataLendingContract>) => void
}

type GeneralDataTabProps = CreateGeneralDataTabProps | EditGeneralDataTabProps

function CreateGeneralDataTab({
  variant: _variant,
  form,
  fetchEmployeeOptions,
  fetchAssetOptions,
  fetchWitnessesOptions,
  setAssetType,
  workloads,
  isPendingWorkloads,
  costCenters,
  isPendingCostCenters,
  onSubmitGeneralData,
  back,
  isSubmitting,
  saveAsyncFieldMeta,
  getAsyncFieldMeta,
}: CreateGeneralDataTabProps) {
  // Get initial options from persisted metadata
  const employeeInitialOptions = (() => {
    const meta = getAsyncFieldMeta?.('employeeId')
    return meta
      ? [
          {
            value: meta.value,
            label: meta.label,
            email: meta.email,
            legalPerson: meta.legalPerson,
          },
        ]
      : undefined
  })()

  const assetInitialOptions = (() => {
    const meta = getAsyncFieldMeta?.('assetId')
    return meta
      ? [{ value: meta.value, label: meta.label, type: meta.type }]
      : undefined
  })()

  const witness1InitialOptions = (() => {
    const meta = getAsyncFieldMeta?.('witnessOneId')
    return meta ? [{ value: meta.value, label: meta.label }] : undefined
  })()

  const witness2InitialOptions = (() => {
    const meta = getAsyncFieldMeta?.('witnessTwoId')
    return meta ? [{ value: meta.value, label: meta.label }] : undefined
  })()

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmitGeneralData)}>
        <Grid my={10}>
          <Grid.Col span={{ base: 12, xs: 6 }}>
            <AsyncSelect
              name="employeeId"
              label="Colaborador"
              placeholder="Selecione o colaborador"
              fetcher={fetchEmployeeOptions}
              initialOptions={employeeInitialOptions}
              onOptionSelect={(option) => {
                if (option) {
                  form.setValue('employeeSigner', option.email)
                  form.setValue('legalPerson', Boolean(option.legalPerson))
                  saveAsyncFieldMeta?.('employeeId', {
                    value: option.value,
                    label: option.label,
                    email: option.email,
                    legalPerson: Boolean(option.legalPerson),
                  })
                } else {
                  form.setValue('legalPerson', false)
                  saveAsyncFieldMeta?.('employeeId', null)
                }
              }}
              debounceMs={2000}
              minChars={2}
              preloadOnOpen
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, xs: 3 }}>
            <Input
              label="E-mail para assinatura"
              placeholder="Digite o e-mail"
              name="employeeSigner"
            />
          </Grid.Col>
        </Grid>

        <Grid my={10}>
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
          <Grid.Col span={{ base: 12, xs: 4 }}>
            <AsyncSelect
              name="assetId"
              label="Ativo"
              placeholder="Selecione o ativo"
              fetcher={fetchAssetOptions}
              initialOptions={assetInitialOptions}
              onOptionSelect={(option: Option | null) => {
                if (option) {
                  setAssetType(option.type ?? '')
                  saveAsyncFieldMeta?.('assetId', {
                    value: option.value,
                    label: option.label,
                    type: option.type,
                  })
                } else {
                  setAssetType('')
                  saveAsyncFieldMeta?.('assetId', null)
                }
              }}
              clearable={false}
              debounceMs={2000}
              minChars={2}
              preloadOnOpen
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, xs: 2 }}>
            <Select
              name="bu"
              label="BU"
              placeholder="Selecione o BU"
              data={BUSINESS_UNITS}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, xs: 1.5 }}>
            <Controller
              name="msOffice"
              control={form.control}
              render={({ field: { onChange, onBlur, value } }) => (
                <InputWrapper label="Pacote Office">
                  <Switch
                    label={value ? 'Sim' : 'Não'}
                    checked={value}
                    onChange={onChange}
                    onBlur={onBlur}
                  />
                </InputWrapper>
              )}
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
              label="Número GLPI"
              placeholder="Digite o número GLPI"
              name="glpiNumber"
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
              label="Origem do Contrato"
              placeholder="Selecione a origem do contrato"
              data={CONTRACT_LOCATIONS}
            />
          </Grid.Col>
        </Grid>

        <Grid my={10}>
          <Grid.Col span={{ base: 12, xs: 12 }}>
            <Grid my={10}>
              <WitnessSelection
                fetcher={fetchWitnessesOptions}
                witness1InitialOptions={witness1InitialOptions}
                witness2InitialOptions={witness2InitialOptions}
                onWitness1Select={(option) => {
                  if (option) {
                    saveAsyncFieldMeta?.('witnessOneId', {
                      value: option.value,
                      label: option.label,
                    })
                  } else {
                    saveAsyncFieldMeta?.('witnessOneId', null)
                  }
                }}
                onWitness2Select={(option) => {
                  if (option) {
                    saveAsyncFieldMeta?.('witnessTwoId', {
                      value: option.value,
                      label: option.label,
                    })
                  } else {
                    saveAsyncFieldMeta?.('witnessTwoId', null)
                  }
                }}
              />
              <Grid.Col span={{ base: 5, xs: 4 }}>
                <Select
                  name="principalSigner"
                  label="Comodante"
                  placeholder="Selecione o comodante"
                  data={PRINCIPAL_SIGNERS}
                />
              </Grid.Col>
            </Grid>
          </Grid.Col>
        </Grid>

        <Grid my={10}>
          <Grid.Col span={{ base: 6, xs: 12 }}>
            <Textarea
              label="Observação"
              placeholder="Digite a observação"
              name="observations"
              rows={FORM_FIELD_LIMITS.TEXTAREA_ROWS}
              maxLength={FORM_FIELD_LIMITS.OBSERVATIONS_MAX_LENGTH}
            />
          </Grid.Col>
        </Grid>

        <Flex justify="space-between">
          <Button
            type="button"
            color="gray"
            variant="outline"
            radius="md"
            onClick={back}
            disabled={isSubmitting}
          >
            <ArrowLeft size={16} />
            &nbsp;Voltar
          </Button>
          <Button
            type="submit"
            variant="outline"
            radius="md"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            Próximo&nbsp;
            <ArrowRight size={16} />
          </Button>
        </Flex>
      </form>
    </FormProvider>
  )
}

export default function GeneralDataTab(props: GeneralDataTabProps) {
  if (props.variant === 'create') {
    return <CreateGeneralDataTab {...props} />
  }

  return <EditGeneralDataTab {...props} />
}

function EditGeneralDataTab({
  variant: _variant,
  lendingId,
  lendingData,
  canEdit,
  canDelete,
  onFormReady,
}: EditGeneralDataTabProps) {
  const navigate = useNavigate()
  const { form, populateForm, onSubmit, isUpdating } = useGeneralDataTab({
    lendingId,
  })

  useEffect(() => {
    if (onFormReady) {
      onFormReady(form)
    }
  }, [form, onFormReady])

  // Populate form when lending data loads
  useEffect(() => {
    if (lendingData) {
      populateForm(lendingData)
    }
  }, [lendingData])

  const { mutate: deleteContract, isPending: isDeleting } = useMutation({
    mutationFn: () => deleteLending(lendingId!),
    onSuccess: () => {
      notifications.show({
        title: 'Sucesso',
        message: 'Contrato excluído com sucesso',
        color: 'green',
      })
      navigate({ to: '/lendings' })
    },
    onError: () => {
      notifications.show({
        title: 'Erro',
        message: 'Não foi possível excluir o contrato',
        color: 'red',
      })
    },
  })

  const openConfirmModalDeleteContract = () =>
    modals.openConfirmModal({
      title: 'Confirmação de exclusão',
      children: 'Deseja excluir o contrato de comodato?',
      centered: true,
      labels: {
        confirm: 'Confirmar exclusão',
        cancel: 'Cancelar exclusão',
      },
      onConfirm: () => deleteContract(),
    })

  const isSubmitting = isUpdating || isDeleting
  const isFormDisabled = !canEdit || isSubmitting || !!lendingData?.signedDate

  return (
    <FormProvider {...form}>
      <form
        id="general-data-form"
        onSubmit={form.handleSubmit((data) => onSubmit(data as any))}
      >
        <Grid my={10}>
          <Grid.Col span={{ base: 12, xs: 6 }}>
            <ReadOnlyField
              label="Colaborador"
              value={lendingData?.employee?.fullName}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, xs: 3 }}>
            <Input
              label="E-mail para assinatura"
              placeholder="Digite o e-mail"
              name="employeeSigner"
              readOnly={isFormDisabled}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, xs: 3 }}>
            <Input label="Gestor" readOnly={isFormDisabled} name="manager" />
          </Grid.Col>
          <Grid.Col span={{ base: 12, xs: 3 }}>
            <ReadOnlyField
              label="Lotação"
              value={lendingData?.workload?.name}
            />
          </Grid.Col>
        </Grid>

        <Grid my={10}>
          <Grid.Col span={{ base: 12, xs: 4 }}>
            <ReadOnlyField
              label="Centro de custo"
              value={lendingData?.costCenter?.name}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, xs: 4 }}>
            <ReadOnlyField
              label="Ativo"
              value={lendingData?.asset?.description}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, xs: 2 }}>
            <ReadOnlyField label="BU" value={lendingData?.bu} />
          </Grid.Col>
          <Grid.Col span={{ base: 12, xs: 1.5 }}>
            <Controller
              name="msOffice"
              control={form.control}
              disabled={isFormDisabled}
              render={({ field: { onChange, onBlur, value } }) => (
                <InputWrapper label="Pacote Office">
                  <Switch
                    label={value ? 'Sim' : 'Não'}
                    checked={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    disabled={isFormDisabled}
                  />
                </InputWrapper>
              )}
            />
          </Grid.Col>
        </Grid>

        <Grid my={10}>
          <Grid.Col span={{ base: 12, xs: 3 }}>
            <Input label="Projeto" readOnly={isFormDisabled} name="project" />
          </Grid.Col>
          <Grid.Col span={{ base: 12, xs: 3 }}>
            <Input
              label="Número GLPI"
              placeholder="Digite o número GLPI"
              readOnly={isFormDisabled}
              name="glpiNumber"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, xs: 3 }}>
            <Input
              label="Executivo"
              readOnly={isFormDisabled}
              name="businessExecutive"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, xs: 3 }}>
            <ReadOnlyField
              label="Origem do Contrato"
              value={lendingData?.location}
            />
          </Grid.Col>
        </Grid>

        <Grid my={10}>
          <Grid.Col span={{ base: 12, xs: 12 }}>
            <Grid my={10}>
              <WitnessSelection
                readOnly
                witness1Value={lendingData?.witnesses?.[0]?.employee?.fullName}
                witness2Value={lendingData?.witnesses?.[1]?.employee?.fullName}
              />
              <Grid.Col span={{ base: 5, xs: 4 }}>
                <Select
                  name="principalSigner"
                  label="Comodante"
                  placeholder="Selecione o comodante"
                  data={PRINCIPAL_SIGNERS}
                  readOnly={isFormDisabled}
                />
              </Grid.Col>
            </Grid>
          </Grid.Col>
        </Grid>

        <Grid my={10}>
          <Grid.Col span={{ base: 12, xs: 12 }}>
            <Textarea
              label="Observação"
              placeholder="Digite a observação"
              name="observations"
              rows={FORM_FIELD_LIMITS.TEXTAREA_ROWS}
              maxLength={FORM_FIELD_LIMITS.OBSERVATIONS_MAX_LENGTH}
              error={form?.formState?.errors?.observations?.message}
              readOnly={!canEdit}
            />
          </Grid.Col>
        </Grid>

        {canDelete && (
          <Flex justify="flex-end" gap="md" mt={25}>
            <Button
              type="button"
              color="red"
              variant="outline"
              radius="md"
              onClick={openConfirmModalDeleteContract}
              disabled={isSubmitting}
              loading={isDeleting}
            >
              Excluir
            </Button>
          </Flex>
        )}
      </form>
    </FormProvider>
  )
}
