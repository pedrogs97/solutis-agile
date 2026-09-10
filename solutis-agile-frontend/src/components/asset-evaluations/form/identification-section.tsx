'use client'

import {
  Card,
  Grid,
  Group,
  Radio,
  Select,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { Calendar, Info } from 'lucide-react'
import { Controller, type UseFormReturn } from 'react-hook-form'

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
  'Servidor',
  'Equipamento de rede',
  'Periférico',
  'Móvel',
  'Utensílio',
  'Eletrodoméstico',
  'Outro',
]

function parseDateValue(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === 'string') {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

export function IdentificationSection({
  form,
  assetOptions = [],
  readOnly = false,
}: Readonly<IdentificationSectionProps>) {
  const { control, register, setValue, watch } = form
  const selectedAssetId = watch('asset_id')

  const handleAssetSelect = (val: string | null) => {
    if (!val) {
      setValue('asset_id', null)
      return
    }
    const assetIdNum = parseInt(val, 10)
    setValue('asset_id', assetIdNum)

    // Autopreencher com dados do label se disponível
    const option = assetOptions.find((o) => o.value === val)
    if (option) {
      const parts = option.label.split(' - ')
      if (parts[0] && !watch('patrimonio')) {
        setValue('patrimonio', parts[0].trim())
      }
      if (parts[1]) {
        const fullDesc = parts[1].trim()
        if (!watch('brand_model')) {
          setValue('brand_model', fullDesc)
        }
        const brandParts = fullDesc.split(' ')
        if (brandParts.length > 0 && !watch('manufacturer')) {
          setValue('manufacturer', brandParts[0])
        }
        if (brandParts.length > 1 && !watch('model')) {
          setValue('model', brandParts.slice(1).join(' '))
        }
      }
    }
  }

  return (
    <Card shadow="xs" radius="md" p="lg" withBorder>
      <Group mb="md">
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

      <Grid gutter="md">
        {/* Ativo Cadastrado (Autopreenchimento Opcional) */}
        <Grid.Col span={12}>
          <Select
            label="Vincular a um Ativo Cadastrado (Opcional)"
            placeholder="Selecione um ativo para preenchimento automático de dados"
            data={assetOptions}
            searchable
            clearable
            value={selectedAssetId ? selectedAssetId.toString() : null}
            onChange={handleAssetSelect}
            disabled={readOnly}
          />
        </Grid.Col>

        {/* Linha 1: Tipo, Unidade/Filial e Data da Avaliação */}
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

        <Grid.Col span={{ base: 12, md: 4 }}>
          <TextInput
            label="Unidade / Filial"
            placeholder="Ex.: Matriz Salvador, Filial SP..."
            {...register('unity')}
            disabled={readOnly}
          />
        </Grid.Col>

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
                value={parseDateValue(field.value)}
                onChange={(val: Date | null) =>
                  field.onChange(val ? val.toISOString() : null)
                }
              />
            )}
          />
        </Grid.Col>

        {/* Linha 2: Tombamento, Série e Centro de Custo */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <TextInput
            label="Nº Patrimônio (Tombo) *"
            placeholder="Ex.: 00123456"
            {...register('patrimonio', { required: true })}
            disabled={readOnly}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <TextInput
            label="Número de Série"
            placeholder="S/N do fabricante"
            {...register('serial_number')}
            disabled={readOnly}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <TextInput
            label="Centro de Custo"
            placeholder="Ex.: TI - Operações, ADM..."
            {...register('cost_center')}
            disabled={readOnly}
          />
        </Grid.Col>

        {/* Linha 3: Fabricante, Modelo e Localização Atual */}
        <Grid.Col span={{ base: 12, md: 4 }}>
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

        <Grid.Col span={{ base: 12, md: 4 }}>
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

        <Grid.Col span={{ base: 12, md: 4 }}>
          <TextInput
            label="Localização Atual do Ativo"
            placeholder="Ex.: Depósito TI — Sala 3"
            {...register('current_location')}
            disabled={readOnly}
          />
        </Grid.Col>

        {/* Linha 4: Responsável Inicial, Garantia e Validade */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <TextInput
            label="Responsável pela Avaliação Inicial"
            placeholder="Nome do avaliador responsável"
            {...register('evaluator_name')}
            disabled={readOnly}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
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

        <Grid.Col span={{ base: 12, md: 4 }}>
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
                value={parseDateValue(field.value)}
                onChange={(val: Date | null) =>
                  field.onChange(val ? val.toISOString() : null)
                }
              />
            )}
          />
        </Grid.Col>

        {/* Linha 5: Descrição Complementar */}
        <Grid.Col span={12}>
          <Textarea
            label="Descrição Complementar do Ativo"
            placeholder="Especificações relevantes, acessórios acompanhantes, estado físico visível..."
            rows={2}
            {...register('asset_description')}
            disabled={readOnly}
          />
        </Grid.Col>
      </Grid>
    </Card>
  )
}
