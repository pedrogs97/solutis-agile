'use client'

import {
  ActionIcon,
  Grid,
  HoverCard,
  Stack,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { Info } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { IMaskInput } from 'react-imask'

import Input from '@/components/common/input'
import NumberInput from '@/components/common/number-input'
import Select from '@/components/common/select'
import { BUSINESS_UNITS } from '@/constants/selectOptions'
import { useBankOptions } from '@/hooks/useBankOptions'
import { useCostCenterOptions } from '@/hooks/useCostCenterOptions'
import { useDomainOptions } from '@/hooks/useDomainOptions'

interface AdditionalDataTabProps {
  isActive?: boolean
}

export function AdditionalDataTab({ isActive = true }: AdditionalDataTabProps) {
  const {
    control,
    register,
    setValue,
    clearErrors,
    watch,
    formState: { errors },
  } = useFormContext()
  const contractErrors = errors.contract as any
  const paymentDetailsErrors = errors.paymentDetails as any
  const organizationalDetailsErrors = errors.organizationalDetails as any

  const formatBooleanSelectValue = (value: unknown): string | null => {
    if (value === true || value === 'true') return 'true'
    if (value === false || value === 'false') return 'false'
    return null
  }

  const parseBooleanSelectValue = (value: string | null) => {
    if (value === 'true') return true
    if (value === 'false') return false
    return null
  }

  const [shouldLoadBanks, setShouldLoadBanks] = useState(false)

  /*
  const {
    paymentMethodOptions,
    pixTypeOptions,
    payerTypeOptions,
    businessSectorOptions,
    taxpayerClassificationOptions,
    publicEntityOptions,
    isLoading,
  } = useDomainOptions({
    keys: [
      'paymentMethods',
      'pixTypes',
      'payerTypes',
      'businessSectors',
      'taxpayerClassifications',
      'publicEntities',
    ],
    enabled: isActive,
  })
  */

  const { paymentMethodOptions, pixTypeOptions, isLoading } = useDomainOptions({
    keys: ['paymentMethods', 'pixTypes'],
    enabled: isActive,
  })

  const { bankOptions, isLoading: isBanksLoading } = useBankOptions(
    isActive && shouldLoadBanks,
  )
  const { costCenterOptions, isLoading: isCostCentersLoading } =
    useCostCenterOptions(isActive)

  const PixHelp = (
    <HoverCard width={360} shadow="md" withinPortal>
      <HoverCard.Target>
        <ActionIcon
          variant="subtle"
          aria-label="Ajuda sobre formato da chave PIX"
          size="sm"
        >
          <Info size={16} />
        </ActionIcon>
      </HoverCard.Target>
      <HoverCard.Dropdown>
        <Stack gap={6}>
          <Text fw={600}>Formatos aceitos para Chave PIX</Text>
          <Text size="sm">
            Você pode digitar com ou sem pontuação. O sistema valida o formato
            conforme o tipo selecionado.
          </Text>
          <Text size="sm">
            <b>CPF</b>: 11 dígitos (ex.: 39053344705 ou 390.533.447-05)
          </Text>
          <Text size="sm">
            <b>CNPJ</b>: 14 dígitos (ex.: 04252011000110 ou 04.252.011/0001-10)
          </Text>
          <Text size="sm">
            <b>E-mail</b>: ex.: user@empresa.com
          </Text>
          <Text size="sm">
            <b>Telefone</b>: com DDD (ex.: 11999999999, (11) 99999-9999 ou +55
            (11) 99999-9999)
          </Text>
          <Text size="sm">
            <b>Chave Aleatória</b>: UUID (ex.:
            550e8400-e29b-41d4-a716-446655440000)
          </Text>
        </Stack>
      </HoverCard.Dropdown>
    </HoverCard>
  )

  const selectedBankCode = watch('paymentDetails.bankCode') as
    | string
    | undefined
  const selectedBankName = watch('paymentDetails.bank') as string | undefined
  const warningOnPeriod = watch('contract.warningOnPeriod') as
    | boolean
    | string
    | null
    | undefined
  const isWarningOnPeriodEnabled =
    warningOnPeriod === true || warningOnPeriod === 'true'
  const warningContractPeriod = watch('contract.warningContractPeriod') as
    | string
    | undefined

  useEffect(() => {
    if (isWarningOnPeriodEnabled) return

    if (
      warningContractPeriod &&
      String(warningContractPeriod).trim().length > 0
    ) {
      setValue('contract.warningContractPeriod', '')
      clearErrors('contract.warningContractPeriod')
    }
  }, [isWarningOnPeriodEnabled, warningContractPeriod, setValue, clearErrors])

  useEffect(() => {
    if (!selectedBankCode) return

    const matchedBank = bankOptions.find(
      (option) =>
        option.bankCode === selectedBankCode ||
        option.value === selectedBankCode,
    )

    if (!matchedBank) return

    if (selectedBankName !== matchedBank.bankName) {
      setValue('paymentDetails.bank', matchedBank.bankName, {
        shouldDirty: false,
      })
    }
  }, [selectedBankCode, selectedBankName, bankOptions, setValue])

  useEffect(() => {
    if (selectedBankCode || !selectedBankName || bankOptions.length === 0)
      return

    const normalizedSelectedBankName = selectedBankName.trim().toUpperCase()
    const matchedBank = bankOptions.find(
      (option) =>
        option.bankName.trim().toUpperCase() === normalizedSelectedBankName,
    )

    if (!matchedBank) return

    setValue('paymentDetails.bankCode', matchedBank.bankCode, {
      shouldDirty: false,
    })
  }, [selectedBankCode, selectedBankName, bankOptions, setValue])

  const bankSelectOptions = (() => {
    if (!selectedBankCode || selectedBankCode.trim() === '') return bankOptions

    const exists = bankOptions.some(
      (opt) =>
        opt.value === selectedBankCode || opt.bankCode === selectedBankCode,
    )
    if (exists) return bankOptions

    return [
      {
        value: selectedBankCode,
        label: selectedBankName
          ? `${selectedBankCode} - ${selectedBankName}`
          : selectedBankCode,
        bankCode: selectedBankCode,
        bankName: selectedBankName || selectedBankCode,
      },
      ...bankOptions,
    ]
  })()

  return (
    <Grid>
      {/* Payment Details Section */}
      <Grid.Col span={12}>
        <h3 style={{ marginTop: '10px', marginBottom: '15px' }}>
          Dados do Contrato
        </h3>
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 6 }}>
        <TextInput
          label="Tipo de Contrato"
          placeholder="Ex: Prestação de Serviço, Fornecimento, etc."
          error={contractErrors?.contractType?.message as string | undefined}
          {...register('contract.contractType', {
            maxLength: {
              value: 50,
              message: 'Tipo de Contrato deve ter no máximo 50 caracteres',
            },
          })}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 6 }}>
        <TextInput
          label="Período do Contrato"
          placeholder="Ex: 12 meses, 1 ano, indeterminado, etc."
          error={contractErrors?.contractPeriod?.message as string | undefined}
          {...register('contract.contractPeriod', {
            maxLength: {
              value: 50,
              message: 'Período do Contrato deve ter no máximo 50 caracteres',
            },
          })}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 4 }}>
        <Select
          name="contract.hasContractRenewal"
          control={control}
          label="Renovação de Contrato"
          placeholder="Selecione"
          formatValue={formatBooleanSelectValue}
          parseValue={parseBooleanSelectValue}
          data={[
            { value: 'true', label: 'Sim' },
            { value: 'false', label: 'Não' },
          ]}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 4 }}>
        <Select
          name="contract.warningContractRenewal"
          control={control}
          label="Aviso de Renovação de Contrato"
          placeholder="Selecione"
          formatValue={formatBooleanSelectValue}
          parseValue={parseBooleanSelectValue}
          data={[
            { value: 'true', label: 'Sim' },
            { value: 'false', label: 'Não' },
          ]}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 4 }}>
        <Select
          name="contract.warningOnTermination"
          control={control}
          label="Tem Aviso de Término de Contrato"
          placeholder="Selecione"
          formatValue={formatBooleanSelectValue}
          parseValue={parseBooleanSelectValue}
          data={[
            { value: 'true', label: 'Sim' },
            { value: 'false', label: 'Não' },
          ]}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 4 }}>
        <Select
          name="contract.warningOnRenewal"
          control={control}
          label="Tem Aviso de Renovação de Contrato"
          placeholder="Selecione"
          formatValue={formatBooleanSelectValue}
          parseValue={parseBooleanSelectValue}
          data={[
            { value: 'true', label: 'Sim' },
            { value: 'false', label: 'Não' },
          ]}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 4 }}>
        <Select
          name="contract.warningOnPeriod"
          control={control}
          label="Tem Aviso Prévio de Contrato"
          placeholder="Selecione"
          formatValue={formatBooleanSelectValue}
          parseValue={parseBooleanSelectValue}
          data={[
            { value: 'true', label: 'Sim' },
            { value: 'false', label: 'Não' },
          ]}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 4 }}>
        <Select
          name="contract.warningContractPeriod"
          control={control}
          label={
            isWarningOnPeriodEnabled
              ? 'Aviso Prévio de Contrato *'
              : 'Aviso Prévio de Contrato'
          }
          placeholder="Selecione"
          disabled={!isWarningOnPeriodEnabled}
          data={[
            { value: '30', label: '30 dias' },
            { value: '60', label: '60 dias' },
            { value: '90', label: '90 dias' },
            { value: '120', label: '120 dias' },
          ]}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 6 }}>
        <Textarea
          label="Objeto do Contrato"
          placeholder="Descreva o objeto do contrato"
          error={contractErrors?.objectContract?.message as string | undefined}
          {...register('contract.objectContract', {
            maxLength: {
              value: 255,
              message: 'Objeto do Contrato deve ter no máximo 255 caracteres',
            },
          })}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 6 }}>
        <Textarea
          label="Atividades Executadas"
          placeholder="Descreva as atividades executadas"
          error={
            contractErrors?.executedActivities?.message as string | undefined
          }
          {...register('contract.executedActivities')}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 6 }}>
        <Controller
          name="contract.contractStartDate"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <DateInput
              label="Data de Inicio do Contrato"
              placeholder="Selecione a data de início"
              error={error?.message}
              valueFormat="DD/MM/YYYY"
              {...field}
            />
          )}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 6 }}>
        <Controller
          name="contract.contractEndDate"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <DateInput
              label="Data Final do Contrato"
              placeholder="Selecione a data final"
              error={error?.message}
              valueFormat="DD/MM/YYYY"
              {...field}
            />
          )}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 4 }}>
        <Select
          name="paymentDetails.paymentFrequency"
          control={control}
          label="Periodicidade de Pagamento"
          placeholder="Selecione"
          data={[
            { value: 'semanal', label: 'Semanal' },
            { value: 'quinzenal', label: 'Quinzenal' },
            { value: 'mensal', label: 'Mensal' },
            { value: 'trimestral', label: 'Trimestral' },
            { value: 'semestral', label: 'Semestral' },
            { value: 'anual', label: 'Anual' },
          ]}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 4 }}>
        <TextInput
          label="Data de Pagamento"
          placeholder="Ex: 05 de cada mês."
          error={
            paymentDetailsErrors?.paymentDate?.message as string | undefined
          }
          {...register('paymentDetails.paymentDate', {
            maxLength: {
              value: 100,
              message: 'Data de Pagamento deve ter no máximo 100 caracteres',
            },
          })}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 4 }}>
        <NumberInput
          name="paymentDetails.contractTotalValue"
          label="Valor Total do Contrato"
          placeholder="0,00"
          preffix="R$ "
          thousandSeparator="."
          decimalScale={2}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 4 }}>
        <NumberInput
          name="paymentDetails.contractMonthlyValue"
          label="Valor Mensal do Contrato"
          placeholder="0,00"
          preffix="R$ "
          thousandSeparator="."
          decimalScale={2}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 4 }}>
        <Select
          name="paymentDetails.bankCode"
          control={control}
          label="Banco"
          placeholder="Selecione o banco"
          data={bankSelectOptions}
          loading={isBanksLoading}
          onDropdownOpen={() => setShouldLoadBanks(true)}
          onFocus={() => setShouldLoadBanks(true)}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Input
          name="paymentDetails.agency"
          label="Agência"
          placeholder="1234"
          mask="0000-0"
          component={IMaskInput}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Input
          name="paymentDetails.checkingAccount"
          label="C/C"
          placeholder="12345-6"
          mask="000000000-0"
          component={IMaskInput}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 6 }}>
        <Select
          name="paymentDetails.paymentMethod"
          control={control}
          label="Forma de Pagamento"
          placeholder="Selecione o método"
          data={paymentMethodOptions}
          loading={isLoading.paymentMethods}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 6 }}>
        <Select
          name="paymentDetails.pixKeyType"
          control={control}
          label="Tipo de Chave PIX"
          placeholder="Selecione o tipo"
          data={pixTypeOptions}
          loading={isLoading.pixTypes}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <TextInput
          label={
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
              Chave PIX {PixHelp}
            </span>
          }
          placeholder="Digite a chave PIX"
          error={
            (errors.paymentDetails as any)?.pixKey?.message as
              | string
              | undefined
          }
          {...register('paymentDetails.pixKey')}
        />
      </Grid.Col>

      {/* Organizational Details Section */}
      <Grid.Col span={12}>
        <h3 style={{ marginTop: '30px', marginBottom: '15px' }}>
          Dados Organizacionais
        </h3>
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 4 }}>
        <Select
          name="organizationalDetails.costCenter"
          control={control}
          label="Centro de Custo"
          placeholder="Selecione o centro de custo"
          data={costCenterOptions}
          loading={isCostCentersLoading}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 4 }}>
        <Select
          name="organizationalDetails.businessUnit"
          label="BU"
          placeholder="Selecione o BU"
          data={BUSINESS_UNITS}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 4 }}>
        <TextInput
          label="Executivo Responsável"
          placeholder="Nome do responsável"
          error={
            organizationalDetailsErrors?.responsibleExecutive?.message as
              | string
              | undefined
          }
          {...register('organizationalDetails.responsibleExecutive', {
            maxLength: {
              value: 255,
              message:
                'Executivo Responsável deve ter no máximo 255 caracteres',
            },
          })}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 4 }}>
        <TextInput
          label="Gestor Responsável"
          placeholder="Nome do gestor responsável"
          error={
            organizationalDetailsErrors?.responsibleManager?.message as
              | string
              | undefined
          }
          {...register('organizationalDetails.responsibleManager', {
            maxLength: {
              value: 255,
              message: 'Gestor Responsável deve ter no máximo 255 caracteres',
            },
          })}
        />
      </Grid.Col>

      {/*
      <Grid.Col span={{ base: 12, md: 3 }}>
        <Select
          name="organizationalDetails.payerType"
          control={control}
          label="Tipo de Tomador"
          placeholder="Selecione"
          data={payerTypeOptions}
          loading={isLoading.payerTypes}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 3 }}>
        <Select
          name="organizationalDetails.businessSector"
          control={control}
          label="Ramo de Atividade"
          placeholder="Selecione"
          data={businessSectorOptions}
          loading={isLoading.businessSectors}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 3 }}>
        <Select
          name="organizationalDetails.taxpayerClassification"
          control={control}
          label="Classificação do Contribuinte"
          placeholder="Selecione"
          data={taxpayerClassificationOptions}
          loading={isLoading.taxpayerClassifications}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 3 }}>
        <Select
          name="organizationalDetails.publicEntity"
          control={control}
          label="Orgão Público"
          placeholder="Selecione"
          data={publicEntityOptions}
          loading={isLoading.publicEntities}
        />
      </Grid.Col>
      */}
    </Grid>
  )
}
