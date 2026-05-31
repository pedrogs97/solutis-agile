'use client'

import { Checkbox, Grid } from '@mantine/core'
import { Controller, useFormContext } from 'react-hook-form'
import { IMaskInput } from 'react-imask'

import Input from '@/components/common/input'
import Select from '@/components/common/select'
import { useDomainOptions } from '@/hooks/useDomainOptions'

interface TaxesTabProps {
  isActive?: boolean
}

export function TaxesTab({ isActive = true }: TaxesTabProps) {
  const { control } = useFormContext()

  const {
    issWithholdingOptions,
    issRegimeOptions,
    taxationRegimeOptions,
    taxationMethodOptions,
    icmsTaxpayerOptions,
    withholdingTaxOptions,
    incomeTypeOptions,
    companySizeOptions,
    customerTypeOptions,
    isLoading,
  } = useDomainOptions({
    keys: [
      'issWithholdings',
      'issRegimes',
      'taxationRegimes',
      'taxationMethods',
      'icmsTaxpayers',
      'withholdingTaxes',
      'incomeTypes',
      'companySizes',
      'customerTypes',
    ],
    enabled: isActive,
  })

  return (
    <Grid>
      {/* Fiscal Details Section */}
      <Grid.Col span={12}>
        <h3 style={{ marginTop: '10px', marginBottom: '15px' }}>
          Detalhes Fiscais
        </h3>
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 4 }}>
        <Controller
          name="fiscalDetails.issTaxpayer"
          control={control}
          render={({ field }) => (
            <Checkbox
              label="Contribuinte ISS"
              checked={field.value}
              onChange={(event) => field.onChange(event.currentTarget.checked)}
            />
          )}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 4 }}>
        <Controller
          name="fiscalDetails.simplesNacionalParticipant"
          control={control}
          render={({ field }) => (
            <Checkbox
              label="Optante pelo Simples"
              checked={field.value}
              onChange={(event) => field.onChange(event.currentTarget.checked)}
            />
          )}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 4 }}>
        <Controller
          name="fiscalDetails.cooperativeMember"
          control={control}
          render={({ field }) => (
            <Checkbox
              label="Sócio Cooperado"
              checked={field.value}
              onChange={(event) => field.onChange(event.currentTarget.checked)}
            />
          )}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 4 }}>
        <Select
          name="fiscalDetails.issWithholding"
          control={control}
          label="Retenção ISS"
          placeholder="Selecione"
          data={issWithholdingOptions}
          loading={isLoading.issWithholdings}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 4 }}>
        <Select
          name="fiscalDetails.issRegime"
          control={control}
          label="Regime ISS"
          placeholder="Selecione"
          data={issRegimeOptions}
          loading={isLoading.issRegimes}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 4 }}>
        <Select
          name="fiscalDetails.withholdingTaxNature"
          control={control}
          label="Natureza da Retenção"
          placeholder="Selecione"
          data={withholdingTaxOptions}
          loading={isLoading.withholdingTaxes}
        />
      </Grid.Col>

      {/* Company Information Section */}
      <Grid.Col span={12}>
        <h3 style={{ marginTop: '30px', marginBottom: '15px' }}>
          Informações da Empresa
        </h3>
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 4 }}>
        <Select
          name="companyInformation.taxationRegime"
          control={control}
          label="Regime de Tributação"
          placeholder="Selecione"
          data={taxationRegimeOptions}
          loading={isLoading.taxationRegimes}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 4 }}>
        <Input
          label="NIT"
          name="companyInformation.nit"
          placeholder="000.00000.00-00"
          mask="000.00000.00-00"
          component={IMaskInput}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 3 }}>
        <Select
          name="companyInformation.companySize"
          control={control}
          label="Porte da Empresa"
          placeholder="Selecione"
          data={companySizeOptions}
          loading={isLoading.companySizes}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 3 }}>
        <Select
          name="companyInformation.icmsTaxpayer"
          control={control}
          label="Contribuinte ICMS"
          placeholder="Selecione"
          data={icmsTaxpayerOptions}
          loading={isLoading.icmsTaxpayers}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 3 }}>
        <Select
          name="companyInformation.incomeType"
          control={control}
          label="Tipo de Rendimento"
          placeholder="Selecione"
          data={incomeTypeOptions}
          loading={isLoading.incomeTypes}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 3 }}>
        <Select
          name="companyInformation.taxationMethod"
          control={control}
          label="Forma de Tributação"
          placeholder="Selecione"
          data={taxationMethodOptions}
          loading={isLoading.taxationMethods}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 6 }}>
        <Select
          name="companyInformation.customerType"
          control={control}
          label="Tipo de Cliente"
          placeholder="Selecione"
          data={customerTypeOptions}
          loading={isLoading.customerTypes}
        />
      </Grid.Col>
    </Grid>
  )
}
