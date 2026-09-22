'use client'

import { useMemo, useState } from 'react'
import {
  Card,
  Grid,
  Group,
  Radio,
  Select,
  Switch,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { notifications } from '@mantine/notifications'
import { Calendar, Info, Search } from 'lucide-react'
import { Controller, type UseFormReturn } from 'react-hook-form'

import { useCostCenterOptions } from '@/hooks/useCostCenterOptions'
import {
  formatDateToLocalYMD,
  parseLocalDateValue,
} from '@/lib/utils'
import { searchAssetByIdentifier } from '@/services/api/asset-evaluation'
import type { AssetEvaluationFormValues } from '@/types/AssetEvaluation'

interface IdentificationSectionProps {
  form: UseFormReturn<AssetEvaluationFormValues>
  assetOptions?: { value: string; label: string }[]
  readOnly?: boolean
}

const ASSET_TYPE_OPTIONS = [
  'Notebook',
  'Desktop',
  'Monitor',
  'Smartphone',
  'Tablet',
  'Impressora',
  'Servidor',
  'Equipamento de rede',
  'Periférico',
  'Móvel',
  'Utensílio',
  'Eletrodoméstico',
  'Outro',
]

const UNITY_OPTIONS = [
  { value: 'Salvador', label: 'Salvador' },
  { value: 'São Paulo', label: 'São Paulo' },
]

export function IdentificationSection({
  form,
  readOnly = false,
}: Readonly<IdentificationSectionProps>) {
  const { control, register, setValue, watch } = form

  const isUnregistered = watch('is_unregistered') || false
  const watchedPatrimonio = watch('patrimonio') || ''
  const watchedSerialNumber = watch('serial_number') || ''
  const watchedCostCenter = watch('cost_center') || ''
  const [isSearching, setIsSearching] = useState(false)

  const { costCenterOptions } = useCostCenterOptions()

  const selectCostCenterData = useMemo(() => {
    const options = (costCenterOptions || []).map((o) => ({
      value: o.label || o.value,
      label: o.label || o.value,
    }))
    if (watchedCostCenter && !options.some((o) => o.value === watchedCostCenter)) {
      options.unshift({ value: watchedCostCenter, label: watchedCostCenter })
    }
    return options
  }, [costCenterOptions, watchedCostCenter])

  // F1-06: Autopreenchimento ao buscar por Tombo ou Série
  const handleSearchAsset = async (query: string) => {
    const cleanQuery = query.trim()
    if (!cleanQuery || cleanQuery.length < 3 || readOnly) return

    setIsSearching(true)
    try {
      const data = await searchAssetByIdentifier(cleanQuery)
      if (data && data.id) {
        setValue('asset_id', data.id)
        if (data.patrimonio) setValue('patrimonio', data.patrimonio)
        if (data.serial_number) setValue('serial_number', data.serial_number)
        if (data.type_name) setValue('asset_type_name', data.type_name)
        if (data.brand) setValue('manufacturer', data.brand)
        if (data.model) setValue('model', data.model)
        if (data.brand_model) setValue('brand_model', data.brand_model)
        if (data.cost_center) setValue('cost_center', data.cost_center)
        if (data.unity) setValue('unity', data.unity)
        if (data.acquisition_value !== undefined && data.acquisition_value !== null) {
          setValue('acquisition_value', Number(data.acquisition_value))
        }
        if (data.net_book_value !== undefined && data.net_book_value !== null) {
          setValue('net_book_value', Number(data.net_book_value))
        }
        if (data.acquisition_date) {
          const ymd = data.acquisition_date.split('T')[0]
          setValue('acquisition_date', ymd)
        }

        notifications.show({
          color: 'teal',
          title: 'Ativo Localizado',
          message: `Dados do patrimônio ${data.patrimonio || cleanQuery} preenchidos automaticamente.`,
        })
      }
    } catch {
      // Ativo não encontrado ou consulta sem retorno — preenchimento manual continua
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <Card shadow="xs" radius="md" p="lg" withBorder>
      <Group mb="md" justify="space-between" align="center">
        <Group>
          <ThemeIcon size="lg" radius="md" color="blue" variant="light">
            <Info size={20} />
          </ThemeIcon>
          <div>
            <Title order={4}>1. Identificação do Ativo</Title>
            <Text size="xs" c="dimmed">
              Dados de cadastro, tombamento e localização do bem
            </Text>
          </div>
        </Group>

        {/* F1-04: Switch de ativo não tombado */}
        <Controller
          control={control}
          name="is_unregistered"
          render={({ field }) => (
            <Switch
              label="Sem número de patrimônio (não tombado)"
              checked={field.value || false}
              onChange={(e) => {
                const checked = e.currentTarget.checked
                field.onChange(checked)
                if (checked) {
                  setValue('patrimonio', '')
                  setValue('asset_id', null)
                }
              }}
              disabled={readOnly}
              color="orange"
            />
          )}
        />
      </Group>

      <Grid gutter="md">
        {/* F1-05: Tombo e Série em destaque prioritário no topo */}
        {!isUnregistered ? (
          <>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="Nº Patrimônio (Tombo) *"
                placeholder="Ex.: 00123456 (digite e pressione Tab para buscar)"
                {...register('patrimonio', { required: !isUnregistered })}
                disabled={readOnly}
                rightSection={
                  <Search
                    size={16}
                    color={isSearching ? 'var(--mantine-color-blue-6)' : 'var(--mantine-color-gray-5)'}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleSearchAsset(watchedPatrimonio)}
                  />
                }
                onBlur={() => {
                  if (watchedPatrimonio) handleSearchAsset(watchedPatrimonio)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSearchAsset(watchedPatrimonio)
                  }
                }}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="Número de Série"
                placeholder="S/N do fabricante (digite e pressione Tab para buscar)"
                {...register('serial_number')}
                disabled={readOnly}
                onBlur={() => {
                  if (watchedSerialNumber && !watchedPatrimonio) {
                    handleSearchAsset(watchedSerialNumber)
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    if (watchedSerialNumber) handleSearchAsset(watchedSerialNumber)
                  }
                }}
              />
            </Grid.Col>
          </>
        ) : (
          <Grid.Col span={12}>
            <TextInput
              label="Descrição do Bem Não Tombado *"
              placeholder="Ex.: Mesa estações 4 lugares, Armário de aço 2 portas, Cadeira ergonômica..."
              {...register('unregistered_description', { required: isUnregistered })}
              disabled={readOnly}
            />
          </Grid.Col>
        )}

        {/* F1-07: Descrição do Ativo e Tipo de Ativo */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <TextInput
            label="Descrição do Ativo"
            placeholder="Especificações resumidas ou descrição principal do bem"
            {...register('asset_description')}
            disabled={readOnly}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Controller
            control={control}
            name="asset_type_name"
            rules={{ required: true }}
            render={({ field }) => (
              <Select
                label="Tipo de Ativo *"
                placeholder="Selecione o tipo de ativo"
                data={Array.from(
                  new Set([
                    ...ASSET_TYPE_OPTIONS,
                    ...(field.value ? [field.value] : []),
                  ])
                )}
                searchable
                clearable
                disabled={readOnly}
                value={field.value || null}
                onChange={(val) => field.onChange(val || '')}
              />
            )}
          />
        </Grid.Col>

        {/* Fabricante e Modelo */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <TextInput
            label="Fabricante"
            placeholder="Ex.: Dell, Lenovo, HP…"
            {...register('manufacturer')}
            onChange={(e) => {
              register('manufacturer').onChange(e)
              const mfg = e.currentTarget.value
              const mdl = watch('model') || ''
              setValue('brand_model', `${mfg} ${mdl}`.trim())
            }}
            disabled={readOnly}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <TextInput
            label="Modelo"
            placeholder="Ex.: Latitude 5420"
            {...register('model')}
            onChange={(e) => {
              register('model').onChange(e)
              const mdl = e.currentTarget.value
              const mfg = watch('manufacturer') || ''
              setValue('brand_model', `${mfg} ${mdl}`.trim())
            }}
            disabled={readOnly}
          />
        </Grid.Col>

        {/* F1-09 & F1-08: Unidade (Select Salvador/São Paulo) e Centro de Custo (Select searchable) */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Controller
            control={control}
            name="unity"
            render={({ field }) => (
              <Select
                label="Unidade / Filial"
                placeholder="Selecione a filial"
                data={UNITY_OPTIONS}
                value={field.value || null}
                onChange={(val) => field.onChange(val || '')}
                disabled={readOnly}
                clearable
              />
            )}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Controller
            control={control}
            name="cost_center"
            render={({ field }) => (
              <Select
                label="Centro de Custo"
                placeholder="Selecione o centro de custo"
                data={selectCostCenterData}
                searchable
                clearable
                value={field.value || null}
                onChange={(val) => field.onChange(val || '')}
                disabled={readOnly}
              />
            )}
          />
        </Grid.Col>

        {/* Data da Avaliação, Responsável e Localização Atual */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Controller
            control={control}
            name="evaluation_date"
            rules={{ required: true }}
            render={({ field }) => (
              <DateInput
                label="Data da Avaliação *"
                placeholder="dd/mm/aaaa"
                valueFormat="DD/MM/YYYY"
                rightSection={
                  <Calendar size={16} color="var(--mantine-color-gray-6)" />
                }
                clearable
                disabled={readOnly}
                value={parseLocalDateValue(field.value)}
                onChange={(val: any) => field.onChange(formatDateToLocalYMD(val))}
              />
            )}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <TextInput
            label="Responsável pela Avaliação Inicial"
            placeholder="Nome do avaliador responsável"
            {...register('evaluator_name')}
            disabled={readOnly}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <TextInput
            label="Localização Atual do Ativo"
            placeholder="Ex.: Depósito TI — Sala 3"
            {...register('current_location')}
            disabled={readOnly}
          />
        </Grid.Col>

        {/* Garantia e Validade */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Controller
            control={control}
            name="is_under_warranty"
            render={({ field }) => (
              <Radio.Group
                label="Em garantia?"
                value={field.value ? 'Sim' : 'Não'}
                onChange={(val) => field.onChange(val === 'Sim')}
              >
                <Group gap="md" mt={6}>
                  <Radio
                    value="Sim"
                    label="Sim"
                    disabled={readOnly}
                    color="blue"
                  />
                  <Radio
                    value="Não"
                    label="Não"
                    disabled={readOnly}
                    color="gray"
                  />
                </Group>
              </Radio.Group>
            )}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Controller
            control={control}
            name="warranty_expiry_date"
            render={({ field }) => (
              <DateInput
                label="Validade da Garantia"
                placeholder="dd/mm/aaaa"
                valueFormat="DD/MM/YYYY"
                rightSection={
                  <Calendar size={16} color="var(--mantine-color-gray-6)" />
                }
                clearable
                disabled={readOnly}
                value={parseLocalDateValue(field.value)}
                onChange={(val: any) => field.onChange(formatDateToLocalYMD(val))}
              />
            )}
          />
        </Grid.Col>
      </Grid>
    </Card>
  )
}
