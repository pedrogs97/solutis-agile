'use client'

import {
  Card,
  Grid,
  Group,
  NumberInput,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { Calendar } from 'lucide-react'
import {
  Controller,
  type ControllerRenderProps,
  type UseFormReturn,
} from 'react-hook-form'

import {
  calculateUsageTime,
  formatDateToLocalYMD,
  formatMoneyBRL,
  parseLocalDateValue,
} from '@/lib/utils'
import type { AssetEvaluationFormValues } from '@/types/AssetEvaluation'

interface FinancialSectionProps {
  form: UseFormReturn<AssetEvaluationFormValues>
  estimatedEconomy: number
  readOnly?: boolean
}

export function FinancialSection({
  form,
  estimatedEconomy,
  readOnly = false,
}: Readonly<FinancialSectionProps>) {
  const { control, setValue, getValues } = form

  return (
    <Card shadow="xs" radius="md" p="lg" withBorder>
      {/* Cabeçalho alinhado com o modelo FO-PAT-02 */}
      <Group mb="lg" gap="sm">
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            border: '1px solid light-dark(rgba(186, 230, 253, 0.9), rgba(56, 189, 248, 0.35))',
            backgroundColor: 'light-dark(rgba(240, 249, 255, 0.9), rgba(12, 74, 110, 0.25))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 14,
            color: 'light-dark(var(--mantine-color-blue-7), var(--mantine-color-blue-3))',
            flexShrink: 0,
          }}
        >
          5
        </div>
        <div>
          <Title order={4} fw={700} style={{ lineHeight: 1.2 }}>
            Avaliação financeira
          </Title>
          <Text size="xs" c="dimmed" mt={2}>
            Impacto contábil e econômico da decisão
          </Text>
        </div>
      </Group>

      {/* Grid de campos dinâmicos e persistidos */}
      <Grid gutter="md">
        {/* F1-19: Data de aquisição do bem */}
        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <Controller
            control={control}
            name="acquisition_date"
            render={({ field }) => (
              <DateInput
                label="Data de aquisição do bem"
                placeholder="dd/mm/aaaa"
                valueFormat="DD/MM/YYYY"
                rightSection={
                  <Calendar size={16} color="var(--mantine-color-gray-6)" />
                }
                clearable
                disabled={readOnly}
                value={parseLocalDateValue(field.value)}
                onChange={(val: any) => {
                  const ymd = formatDateToLocalYMD(val)
                  field.onChange(ymd)
                  // F1-20: Calcular tempo de utilização automaticamente
                  if (ymd) {
                    const usage = calculateUsageTime(ymd, getValues('evaluation_date'))
                    if (usage) {
                      setValue('usage_time', usage)
                    }
                  }
                }}
              />
            )}
          />
        </Grid.Col>

        {/* F1-18: Valor de aquisição */}
        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <Controller
            control={control}
            name="acquisition_value"
            render={({
              field,
            }: {
              field: ControllerRenderProps<AssetEvaluationFormValues, 'acquisition_value'>
            }) => (
              <NumberInput
                label="Valor de aquisição"
                placeholder="R$"
                prefix="R$ "
                thousandSeparator="."
                decimalSeparator=","
                decimalScale={2}
                min={0}
                allowNegative={false}
                value={
                  field.value !== undefined && field.value !== null && field.value !== 0
                    ? field.value
                    : ''
                }
                onChange={(val: string | number) =>
                  field.onChange(val === '' ? 0 : Number(val))
                }
                disabled={readOnly}
              />
            )}
          />
        </Grid.Col>

        {/* Valor contábil líquido */}
        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <Controller
            control={control}
            name="net_book_value"
            render={({
              field,
            }: {
              field: ControllerRenderProps<AssetEvaluationFormValues, 'net_book_value'>
            }) => (
              <NumberInput
                label="Valor contábil líquido"
                placeholder="R$"
                prefix="R$ "
                thousandSeparator="."
                decimalSeparator=","
                decimalScale={2}
                min={0}
                allowNegative={false}
                value={
                  field.value !== undefined && field.value !== null && field.value !== 0
                    ? field.value
                    : ''
                }
                onChange={(val: string | number) =>
                  field.onChange(val === '' ? 0 : Number(val))
                }
                disabled={readOnly}
              />
            )}
          />
        </Grid.Col>

        {/* F1-20: Tempo de utilização */}
        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <Controller
            control={control}
            name="usage_time"
            render={({
              field,
            }: {
              field: ControllerRenderProps<AssetEvaluationFormValues, 'usage_time'>
            }) => (
              <TextInput
                label="Tempo de utilização"
                placeholder="Ex.: 3 anos e 4 meses"
                value={field.value || ''}
                onChange={field.onChange}
                disabled={readOnly}
              />
            )}
          />
        </Grid.Col>

        {/* Vida útil prevista */}
        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <Controller
            control={control}
            name="expected_lifespan"
            render={({
              field,
            }: {
              field: ControllerRenderProps<AssetEvaluationFormValues, 'expected_lifespan'>
            }) => (
              <TextInput
                label="Vida útil prevista"
                placeholder="Ex.: 5 anos"
                value={field.value || ''}
                onChange={field.onChange}
                disabled={readOnly}
              />
            )}
          />
        </Grid.Col>

        {/* F1-21: Economia estimada reativa */}
        <Grid.Col span={{ base: 12, sm: 12, md: 4 }}>
          <Stack gap={4}>
            <TextInput
              label="Economia estimada pelo reaproveitamento"
              value={formatMoneyBRL(estimatedEconomy || 0)}
              readOnly
              styles={{
                input: {
                  fontWeight: 700,
                  cursor: 'default',
                  color: 'var(--mantine-color-teal-7)',
                },
              }}
            />
            <Text size="xs" c="dimmed">
              Calculado: valor contábil líquido × % reaproveitamento
            </Text>
          </Stack>
        </Grid.Col>

        {/* Justificativa técnica da decisão */}
        <Grid.Col span={12}>
          <Controller
            control={control}
            name="justification"
            render={({
              field,
            }: {
              field: ControllerRenderProps<AssetEvaluationFormValues, 'justification'>
            }) => (
              <Textarea
                label="Justificativa técnica da decisão"
                placeholder="Parecer técnico detalhado, motivos da viabilidade de reaproveitamento ou necessidade de baixa..."
                rows={3}
                value={field.value || ''}
                onChange={field.onChange}
                disabled={readOnly}
              />
            )}
          />
        </Grid.Col>
      </Grid>
    </Card>
  )
}
