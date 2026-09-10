'use client'

import {
  Badge,
  Card,
  Grid,
  Group,
  Text,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { Calendar, CheckCircle2 } from 'lucide-react'
import {
  Controller,
  type ControllerRenderProps,
  type UseFormReturn,
} from 'react-hook-form'

import type {
  AssetEvaluationFormValues,
  AssetTechnicalEvaluation,
} from '@/types/AssetEvaluation'

interface AssetManagementSectionProps {
  form: UseFormReturn<AssetEvaluationFormValues>
  existingEvaluation?: AssetTechnicalEvaluation | null
  readOnly?: boolean
}

function parseDateValue(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === 'string') {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

export function AssetManagementSection({
  form,
  existingEvaluation,
  readOnly = false,
}: Readonly<AssetManagementSectionProps>) {
  const { control } = form

  const isApprovedOrWrittenOff =
    existingEvaluation?.status === 'Aprovado' ||
    existingEvaluation?.status === 'Baixado'

  return (
    <Card shadow="xs" radius="md" p="lg" withBorder>
      {/* Cabeçalho alinhado com o modelo FO-PAT-02 (Seção 7) */}
      <Group justify="space-between" mb="lg">
        <Group gap="sm">
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border:
                '1px solid light-dark(rgba(186, 230, 253, 0.9), rgba(56, 189, 248, 0.35))',
              backgroundColor:
                'light-dark(rgba(240, 249, 255, 0.9), rgba(12, 74, 110, 0.25))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 14,
              color:
                'light-dark(var(--mantine-color-blue-7), var(--mantine-color-blue-3))',
              flexShrink: 0,
            }}
          >
            7
          </div>
          <div>
            <Title order={4} fw={700} style={{ lineHeight: 1.2 }}>
              Gestão patrimonial
            </Title>
            <Text size="xs" c="dimmed">
              Registro da baixa em sistema
            </Text>
          </div>
        </Group>

        {isApprovedOrWrittenOff && (
          <Badge color="green" size="lg" leftSection={<CheckCircle2 size={16} />}>
            Aprovado por {existingEvaluation?.approver_name || 'Gestor'}
          </Badge>
        )}
      </Group>

      <Grid gutter="md">
        {/* Linha 1: Data da baixa (span 4) e Motivo da baixa em sistema (span 8) */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Controller
            control={control}
            name="write_off_date"
            render={({
              field,
            }: {
              field: ControllerRenderProps<AssetEvaluationFormValues, 'write_off_date'>
            }) => (
              <DateInput
                label="Data da baixa"
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

        <Grid.Col span={{ base: 12, md: 8 }}>
          <Controller
            control={control}
            name="write_off_reason"
            render={({
              field,
            }: {
              field: ControllerRenderProps<AssetEvaluationFormValues, 'write_off_reason'>
            }) => (
              <TextInput
                label="Motivo da baixa em sistema"
                placeholder=""
                disabled={readOnly}
                value={field.value || ''}
                onChange={field.onChange}
              />
            )}
          />
        </Grid.Col>

        {/* Linha 2: Local das peças reaproveitadas (span 4) */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Controller
            control={control}
            name="reused_parts_location"
            render={({
              field,
            }: {
              field: ControllerRenderProps<
                AssetEvaluationFormValues,
                'reused_parts_location'
              >
            }) => (
              <TextInput
                label="Local das peças reaproveitadas"
                placeholder=""
                disabled={readOnly}
                value={field.value || ''}
                onChange={field.onChange}
              />
            )}
          />
        </Grid.Col>

        {/* Linha 3: Destino final do resíduo (span 12) */}
        <Grid.Col span={12}>
          <Controller
            control={control}
            name="waste_final_destination"
            render={({
              field,
            }: {
              field: ControllerRenderProps<
                AssetEvaluationFormValues,
                'waste_final_destination'
              >
            }) => (
              <TextInput
                label="Destino final do resíduo"
                placeholder=""
                disabled={readOnly}
                value={field.value || ''}
                onChange={field.onChange}
              />
            )}
          />
        </Grid.Col>

        {/* Linha 4: Observações (span 12) */}
        <Grid.Col span={12}>
          <Controller
            control={control}
            name="write_off_notes"
            render={({
              field,
            }: {
              field: ControllerRenderProps<AssetEvaluationFormValues, 'write_off_notes'>
            }) => (
              <Textarea
                label="Observações"
                placeholder=""
                minRows={3}
                autosize
                disabled={readOnly}
                value={field.value || ''}
                onChange={field.onChange}
              />
            )}
          />
        </Grid.Col>
      </Grid>
    </Card>
  )
}
