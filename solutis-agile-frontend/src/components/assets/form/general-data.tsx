'use client'

import {
  Button,
  Flex,
  Grid,
  Input,
  InputWrapper,
  Switch,
  Textarea,
  TextInput,
} from '@mantine/core'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import type { ComponentType } from 'react'
import {
  type Control,
  Controller,
  type UseFormHandleSubmit,
} from 'react-hook-form'

import Select from '@/components/common/select'
import {
  typeAccessoriesInput,
  typeComputerInputs,
  typeModelInput,
  typePatrimonialInputs,
  typePhoneInput,
} from '@/constants/assetTypes'
import { type Asset } from '@/types/Asset'

interface GeneralDataProps {
  handleSubmit: UseFormHandleSubmit<any>
  onSubmit: (data: any) => void
  validateGeneralData: () => void
  asset: Asset | null | undefined
  control: Control<any>
  assetStatus: any
  assetType: string
  assetTypes: any
  isPendingAssetTypes: boolean
  isPendingAssetStatus: boolean
  isEdit: boolean
  canEdit: boolean
}

export default function GeneralData({
  handleSubmit,
  onSubmit,
  validateGeneralData,
  asset,
  control,
  assetStatus,
  assetType,
  assetTypes,
  isPendingAssetTypes,
  isPendingAssetStatus,
  isEdit,
  canEdit,
}: Readonly<GeneralDataProps>) {
  const MaskedInput = Input as unknown as ComponentType<any>
  function renderPatrimonialInputs(typeId: string) {
    if (!typeId || typePatrimonialInputs.indexOf(typeId) === -1) return null

    return (
      <>
        {typeId !== '10' && (
          <Grid.Col span={{ base: 12, xs: 3 }}>
            <Controller
              name="registerNumber"
              control={control}
              render={({ field, fieldState }) => (
                <TextInput
                  label="Nº de Patrimônio"
                  placeholder="Digite o Nº de Patrimônio"
                  {...field}
                  value={field.value ?? ''}
                  error={fieldState.error?.message}
                  readOnly={asset?.byAgile === false && isEdit}
                />
              )}
            />
          </Grid.Col>
        )}
        <Grid.Col span={{ base: 12, xs: 3 }}>
          <Controller
            name="serialNumber"
            control={control}
            render={({ field, fieldState }) => (
              <TextInput
                label="Número de série"
                {...field}
                value={field.value ?? ''}
                error={fieldState.error?.message}
                readOnly={asset?.byAgile === false && isEdit}
              />
            )}
          />
        </Grid.Col>
      </>
    )
  }

  function renderAccessoryInput(typeId: string) {
    if (!typeId || typeAccessoriesInput.indexOf(typeId) === -1) return null

    return (
      <Grid.Col span={{ base: 12, xs: 4 }}>
        <Controller
          name="accessories"
          control={control}
          render={({ field, fieldState }) => (
            <Textarea
              label="Acessórios"
              {...field}
              value={field.value ?? ''}
              error={fieldState.error?.message}
              readOnly={asset?.byAgile === false && isEdit}
              rows={7}
              maxLength={255}
            />
          )}
        />
      </Grid.Col>
    )
  }

  function renderComputerInputs(typeId: string) {
    if (!typeId || typeComputerInputs.indexOf(typeId) === -1) return null

    return (
      <>
        <Grid.Col span={{ base: 12, xs: 3 }}>
          <Select
            control={control}
            name="pattern"
            label="Padrão do Equipamento"
            data={[
              { value: 'PADRÃO STUDIO', label: 'Padrão Studio' },
              { value: 'PADRÃO ESCRITÓRIO', label: 'Padrão Escritório' },
              { value: 'SERASA', label: 'Serasa' },
              { value: 'MACBOOK', label: 'MacBook' },
              { value: 'MAC MINI', label: 'Mac mini' },
            ]}
            readOnly={asset?.byAgile === false && isEdit}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 3 }}>
          <Controller
            name="operationalSystem"
            control={control}
            render={({ field, fieldState }) => (
              <TextInput
                label="Sistema Operacional"
                {...field}
                value={field.value ?? ''}
                error={fieldState.error?.message}
                readOnly={asset?.byAgile === false && isEdit}
              />
            )}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 1.5 }}>
          <Controller
            name="msOffice"
            control={control}
            render={({ field: { onChange, onBlur, value } }) => (
              <InputWrapper label="Pacote Office">
                <Switch
                  label={value ? 'Sim' : 'Não'}
                  checked={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  readOnly={asset?.byAgile === false && isEdit}
                />
              </InputWrapper>
            )}
          />
        </Grid.Col>
      </>
    )
  }

  function renderConfigurationInputs(typeId: string) {
    if (!typeId || typeComputerInputs.indexOf(typeId) === -1) return null

    return (
      <Grid.Col span={{ base: 12, xs: 4 }}>
        <Controller
          name="configuration"
          control={control}
          render={({ field, fieldState }) => (
            <Textarea
              label="Configurações"
              placeholder="Digite as configurações"
              {...field}
              value={field.value ?? ''}
              error={fieldState.error?.message}
              rows={7}
              maxLength={255}
              readOnly={asset?.byAgile === false && isEdit}
            />
          )}
        />
      </Grid.Col>
    )
  }

  function renderPhoneInputs(typeId: string) {
    if (!typeId || typePhoneInput.indexOf(typeId) === -1) return null

    return (
      <>
        <Grid.Col span={{ base: 12, xs: 3 }}>
          <Controller
            name="imei"
            control={control}
            render={({ field, fieldState }) => (
              <TextInput
                label="IMEI"
                placeholder="Digite o IMEI"
                {...field}
                value={field.value ?? ''}
                error={fieldState.error?.message}
              />
            )}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 3 }}>
          <Controller
            name="lineNumber"
            control={control}
            render={({ field, fieldState }) => (
              <Input.Wrapper
                label="Linha telefônica"
                error={fieldState.error?.message}
              >
                <MaskedInput
                  placeholder="Digite o linha telefônica"
                  mask={[
                    { mask: '(00) 0000-0000' },
                    { mask: '(00) 0 0000-0000' },
                  ]}
                  {...field}
                  value={field.value ?? ''}
                />
              </Input.Wrapper>
            )}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 2 }}>
          <Controller
            name="operator"
            control={control}
            render={({ field, fieldState }) => (
              <TextInput
                label="Operadora"
                placeholder="Digite a operadora"
                {...field}
                value={field.value ?? ''}
                error={fieldState.error?.message}
              />
            )}
          />
        </Grid.Col>
      </>
    )
  }

  function renderModelInput(typeId: string) {
    if (!typeId || typeModelInput.indexOf(typeId) === -1) return null

    return (
      <Grid.Col span={{ base: 12, xs: 3 }}>
        <Controller
          name="model"
          control={control}
          render={({ field, fieldState }) => (
            <TextInput
              label="Modelo"
              placeholder={
                asset?.byAgile === false ? 'Não informado' : 'Digite o modelo'
              }
              {...field}
              value={field.value ?? ''}
              error={fieldState.error?.message}
            />
          )}
        />
      </Grid.Col>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Grid my={10}>
        <Grid.Col span={{ base: 12, xs: 12 }}>
          <Controller
            name="description"
            control={control}
            render={({ field, fieldState }) => (
              <Textarea
                label="Descrição"
                placeholder="Digite a descrição"
                {...field}
                value={field.value ?? ''}
                error={fieldState.error?.message}
                readOnly={asset?.byAgile === false && isEdit}
                maxLength={255}
              />
            )}
          />
        </Grid.Col>
      </Grid>
      <Grid my={10}>
        <Grid.Col span={{ base: 12, xs: 4 }}>
          <Select
            name="typeId"
            control={control}
            label="Tipo"
            placeholder="Selecione o tipo"
            data={assetTypes ?? []}
            loading={isPendingAssetTypes}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 3 }}>
          <Select
            name="statusId"
            control={control}
            label="Situação"
            placeholder="Selecione a situação"
            data={assetStatus ?? []}
            loading={isPendingAssetStatus}
          />
        </Grid.Col>
      </Grid>
      <Grid my={10}>
        {renderPatrimonialInputs(assetType)}
        {renderModelInput(assetType)}
      </Grid>
      <Grid my={10}>{renderComputerInputs(assetType)}</Grid>
      <Grid my={10}>{renderPhoneInputs(assetType)}</Grid>
      <Grid my={10}>
        {renderAccessoryInput(assetType)}
        {renderConfigurationInputs(assetType)}
        <Grid.Col span={{ base: 12, xs: 4 }}>
          <Controller
            name="observations"
            control={control}
            render={({ field }) => (
              <Textarea
                label="Observação"
                placeholder="Digite a observação"
                {...field}
                value={field.value ?? ''}
                rows={7}
                maxLength={255}
              />
            )}
          />
        </Grid.Col>
      </Grid>
      <Flex justify="space-between">
        <Button
          type="button"
          color="gray"
          variant="outline"
          radius="md"
          disabled
        >
          <ArrowLeft size={16} />
          &nbsp;Voltar
        </Button>
        {isEdit && canEdit ? (
          <Button variant="outline" radius="md" type="submit">
            Salvar&nbsp;
            <Check size={16} />
          </Button>
        ) : (
          <Button
            variant="outline"
            radius="md"
            onClick={() => validateGeneralData()}
          >
            Próximo&nbsp;
            <ArrowRight size={16} />
          </Button>
        )}
      </Flex>
    </form>
  )
}
