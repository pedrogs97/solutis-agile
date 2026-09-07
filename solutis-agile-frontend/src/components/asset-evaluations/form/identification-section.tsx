'use client'

import {
  Card,
  Grid,
  Group,
  Select,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { Info } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'

import type { AssetEvaluationFormValues } from '@/types/AssetEvaluation'

interface IdentificationSectionProps {
  form: UseFormReturn<AssetEvaluationFormValues>
  assetOptions?: { value: string; label: string }[]
  readOnly?: boolean
}

export function IdentificationSection({
  form,
  assetOptions = [],
  readOnly = false,
}: Readonly<IdentificationSectionProps>) {
  const { register, setValue, watch } = form
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
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Select
            label="Vincular a um Ativo Cadastrado (Opcional)"
            placeholder="Selecione um ativo para preenchimento automático"
            data={assetOptions}
            searchable
            clearable
            value={selectedAssetId ? selectedAssetId.toString() : null}
            onChange={handleAssetSelect}
            disabled={readOnly}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <TextInput
            label="Tipo de Ativo *"
            placeholder="Ex.: Notebook, Servidor, Cadeira, Monitor..."
            {...register('asset_type_name', { required: true })}
            disabled={readOnly}
          />
        </Grid.Col>

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
            label="Marca e Modelo"
            placeholder="Ex.: Dell Latitude 5420"
            {...register('brand_model')}
            disabled={readOnly}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <TextInput
            label="Unidade / Filial"
            placeholder="Ex.: Matriz Salvador, Filial SP..."
            {...register('unity')}
            disabled={readOnly}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <TextInput
            label="Centro de Custo"
            placeholder="Ex.: TI - Operações, ADM..."
            {...register('cost_center')}
            disabled={readOnly}
          />
        </Grid.Col>

        <Grid.Col span={12}>
          <Textarea
            label="Descrição Complementar do Ativo"
            placeholder="Configuração técnica, acessórios inclusos, estado físico visível..."
            rows={2}
            {...register('technical_opinion')}
            disabled={readOnly}
          />
        </Grid.Col>
      </Grid>
    </Card>
  )
}
