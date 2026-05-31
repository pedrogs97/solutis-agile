'use client'

import {
  Checkbox,
  Grid,
  Input as MantineInput,
  Text,
  TextInput,
} from '@mantine/core'
import { cnpj, cpf } from 'cpf-cnpj-validator'
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { IMaskInput } from 'react-imask'

import NumberInput from '@/components/common/number-input'
import Select from '@/components/common/select'
import { useDomainOptions } from '@/hooks/useDomainOptions'
import { fetchCep } from '@/utils/cep'

export interface GeneralDataTabRef {
  handleCepChange: (cep: string) => void
}

const CEP_DEBOUNCE_MS = 350

export const GeneralDataTab = forwardRef<GeneralDataTabRef>((_props, ref) => {
  const {
    control,
    register,
    formState: { errors },
    setValue,
    trigger,
  } = useFormContext()
  const addressErrors = errors.address as any
  const contactErrors = errors.contact as any
  const cepDebounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )

  const {
    classificationOptions,
    categoryOptions,
    businessSectorOptions,
    companySizeOptions,
    riskLevelOptions,
    supplierTypeOptions,
    supplierSituationOptions,
    isLoading,
  } = useDomainOptions({
    keys: [
      'classifications',
      'categories',
      'businessSectors',
      'companySizes',
      'riskLevels',
      'supplierTypes',
      'supplierSituations',
    ],
  })

  const fetchAddressFromCep = async (cep: string) => {
    const data = await fetchCep(cep)
    if (data) {
      // Update form fields
      setValue('address.street', data.logradouro || '')
      setValue('address.neighbourhood', data.bairro || '')
      setValue('address.state', data.uf || '')
      setValue('address.city', data.localidade || '')
      // Trigger validation to clear any existing errors for the address object
      await trigger('address')
    }
  }

  const scheduleFetchAddressFromCep = (cep: string) => {
    const normalizedCep = cep.replace(/\D/g, '')
    if (cepDebounceTimeoutRef.current) {
      clearTimeout(cepDebounceTimeoutRef.current)
      cepDebounceTimeoutRef.current = null
    }

    if (normalizedCep.length < 8) {
      return
    }

    cepDebounceTimeoutRef.current = setTimeout(() => {
      void fetchAddressFromCep(normalizedCep)
    }, CEP_DEBOUNCE_MS)
  }

  const handleCepChange = (cep: string) => {
    scheduleFetchAddressFromCep(cep)
  }

  // Function to be called externally with just the CEP string
  const handleCepChangeExternal = (cep: string) => {
    scheduleFetchAddressFromCep(cep)
  }

  useEffect(() => {
    return () => {
      if (cepDebounceTimeoutRef.current) {
        clearTimeout(cepDebounceTimeoutRef.current)
      }
    }
  }, [])

  useImperativeHandle(ref, () => ({
    handleCepChange: handleCepChangeExternal,
  }))

  return (
    <Grid>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Select
          name="classification"
          control={control}
          label="Classificação"
          placeholder="Selecione uma classificação"
          data={classificationOptions}
          loading={isLoading.classifications}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Select
          name="category"
          control={control}
          label="Categoria"
          placeholder="Selecione uma categoria"
          data={categoryOptions}
          loading={isLoading.categories}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Select
          name="riskLevel"
          control={control}
          label="Nível de risco"
          placeholder="Selecione o nível de risco"
          data={riskLevelOptions}
          loading={isLoading.riskLevels}
          withAsterisk
          rules={{
            required: 'Nível de risco é obrigatório',
          }}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 6 }}>
        <TextInput
          label="Razão Social"
          placeholder="Digite a razão social"
          required
          error={errors.legalName?.message as string | undefined}
          {...register('legalName', {
            required: 'Razão Social é obrigatória',
          })}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 6 }}>
        <TextInput
          label="Nome Fantasia"
          placeholder="Digite o nome fantasia"
          error={errors.tradeName?.message as string | undefined}
          {...register('tradeName')}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 4 }}>
        <Controller
          name="taxId"
          control={control}
          rules={{
            required: 'CPF/CNPJ é obrigatório',
            validate: (value) => {
              if (!value) return true
              const cleanValue = value.replace(/[^\d]/g, '')

              if (cleanValue.length === 11) {
                return cpf.isValid(cleanValue) || 'CPF inválido'
              } else if (cleanValue.length === 14) {
                return cnpj.isValid(cleanValue) || 'CNPJ inválido'
              }

              return 'CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos'
            },
          }}
          render={({ field, fieldState: { error } }) => (
            <MantineInput.Wrapper
              label={
                <Text>
                  CPF/CNPJ <span style={{ color: 'red' }}>*</span>
                </Text>
              }
              error={error?.message}
            >
              <MantineInput
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                component={IMaskInput}
                mask={[
                  { mask: '000.000.000-00' },
                  { mask: '00.000.000/0000-00' },
                ]}
                error={error?.message}
                value={field.value ?? ''}
                onAccept={(value: string) => field.onChange(value)}
                onBlur={field.onBlur}
                ref={field.ref}
              />
            </MantineInput.Wrapper>
          )}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Controller
          name="stateBusinessRegistration"
          control={control}
          rules={{
            maxLength: {
              value: 20,
              message: 'Inscrição Estadual deve ter no máximo 20 caracteres',
            },
          }}
          render={({ field, fieldState: { error } }) => (
            <TextInput
              label="Inscrição Estadual"
              placeholder="Digite a inscrição estadual"
              inputMode="numeric"
              error={error?.message}
              {...field}
              value={field.value ?? ''}
              onChange={(e) =>
                field.onChange(e.target.value.replace(/\D/g, ''))
              }
            />
          )}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Controller
          name="municipalBusinessRegistration"
          control={control}
          rules={{
            maxLength: {
              value: 20,
              message: 'Inscrição Municipal deve ter no máximo 20 caracteres',
            },
          }}
          render={({ field, fieldState: { error } }) => (
            <TextInput
              label="Inscrição Municipal"
              placeholder="Digite a inscrição municipal"
              inputMode="numeric"
              error={error?.message}
              {...field}
              value={field.value ?? ''}
              onChange={(e) =>
                field.onChange(e.target.value.replace(/\D/g, ''))
              }
            />
          )}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 4 }}>
        <Select
          name="type"
          control={control}
          label="Tipo"
          placeholder="Selecione o tipo"
          data={supplierTypeOptions}
          loading={isLoading.supplierTypes}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Select
          name="situation"
          control={control}
          label="Situação"
          placeholder="Selecione a situação"
          data={supplierSituationOptions}
          loading={isLoading.supplierSituations}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 4 }}>
        <Select
          name="organizationalDetails.businessSector"
          control={control}
          label="Ramo de Atividade"
          placeholder="Selecione"
          data={businessSectorOptions}
          loading={isLoading.businessSectors}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 4 }}>
        <Controller
          name="fiscalDetails.simplesNacionalParticipant"
          control={control}
          render={({ field }) => (
            <Checkbox
              mt="xl"
              label="Optante pelo Simples"
              checked={Boolean(field.value)}
              onChange={(event) => field.onChange(event.currentTarget.checked)}
            />
          )}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 4 }}>
        <Select
          name="companyInformation.companySize"
          control={control}
          label="Porte da Empresa"
          placeholder="Selecione"
          data={companySizeOptions}
          loading={isLoading.companySizes}
        />
      </Grid.Col>

      {/* Address Section */}
      <Grid.Col span={12}>
        <h3 style={{ marginTop: '20px', marginBottom: '15px' }}>
          Endereço <span style={{ color: 'red' }}>*</span>
        </h3>
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Controller
          name="address.postalCode"
          control={control}
          rules={{
            required: 'CEP é obrigatório',
            validate: (value) => {
              const normalizedCep = String(value || '').replace(/\D/g, '')
              if (normalizedCep.length !== 8) {
                return 'CEP deve conter 8 dígitos'
              }
              return true
            },
          }}
          render={({ field, fieldState: { error } }) => (
            <MantineInput.Wrapper label="CEP" error={error?.message}>
              <MantineInput
                placeholder="00000-000"
                component={IMaskInput}
                mask="00000-000"
                error={error?.message}
                value={field.value ?? ''}
                onAccept={(value: string) => {
                  field.onChange(value)
                  handleCepChange(value)
                }}
                onBlur={field.onBlur}
                inputRef={field.ref}
              />
            </MantineInput.Wrapper>
          )}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 8 }}>
        <TextInput
          label="Logradouro"
          placeholder="Rua, Avenida, etc."
          readOnly
          error={addressErrors?.street?.message as string | undefined}
          {...register('address.street')}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <TextInput
          label="Bairro"
          placeholder="Bairro"
          readOnly
          error={addressErrors?.neighbourhood?.message as string | undefined}
          {...register('address.neighbourhood')}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <TextInput
          label="Cidade"
          placeholder="Cidade"
          readOnly
          error={addressErrors?.city?.message as string | undefined}
          {...register('address.city')}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <TextInput
          label="Estado"
          placeholder="Estado"
          readOnly
          error={addressErrors?.state?.message as string | undefined}
          {...register('address.state')}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <NumberInput
          name="address.number"
          label="Número"
          placeholder="Digite o número"
          preffix=""
          allowDecimal={false}
          thousandSeparator=""
          rules={{ required: 'Número é obrigatório' }}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <TextInput
          label="Complemento"
          placeholder="Digite o complemento"
          error={addressErrors?.complement?.message as string | undefined}
          {...register('address.complement', {
            maxLength: {
              value: 255,
              message: 'Complemento deve ter no máximo 255 caracteres',
            },
          })}
        />
      </Grid.Col>

      {/* Contact Section */}
      <Grid.Col span={12}>
        <h3 style={{ marginTop: '20px', marginBottom: '15px' }}>
          Contato <span style={{ color: 'red' }}>*</span>
        </h3>
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <TextInput
          label="Contato"
          placeholder="Informe o nome de contato"
          type="name"
          error={contactErrors?.name?.message as string | undefined}
          {...register('contact.name', {
            required: 'Nome do contato é obrigatório',
          })}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Controller
          name="contact.phone"
          control={control}
          rules={{
            required: 'Telefone é obrigatório',
            validate: (value) => {
              const normalizedPhone = String(value || '').replace(/\D/g, '')
              if (
                normalizedPhone.length !== 10 &&
                normalizedPhone.length !== 11
              ) {
                return 'Telefone deve conter DDD + 8 ou 9 dígitos'
              }
              return true
            },
          }}
          render={({
            field: { onChange, onBlur, value, ref, name },
            fieldState: { error },
          }) => (
            <MantineInput.Wrapper label="Telefone" error={error?.message}>
              <MantineInput
                placeholder="(00) 00000-0000"
                component={IMaskInput}
                mask={[{ mask: '(00) 0000-0000' }, { mask: '(00) 00000-0000' }]}
                error={error?.message}
                value={value ?? ''}
                name={name}
                onBlur={onBlur}
                inputRef={ref}
                onAccept={(maskedValue: string) => onChange(maskedValue)}
              />
            </MantineInput.Wrapper>
          )}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <TextInput
          label="Email"
          placeholder="email@exemplo.com"
          type="email"
          error={contactErrors?.email?.message as string | undefined}
          {...register('contact.email', {
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Email inválido',
            },
          })}
        />
      </Grid.Col>
    </Grid>
  )
})

GeneralDataTab.displayName = 'GeneralDataTab'
