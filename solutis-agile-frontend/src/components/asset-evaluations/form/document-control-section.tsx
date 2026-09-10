'use client'

import {
  Card,
  Grid,
  Group,
  Select,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { Calendar, FileText } from 'lucide-react'
import { Controller, type UseFormReturn } from 'react-hook-form'

import type { AssetEvaluationFormValues } from '@/types/AssetEvaluation'

interface DocumentControlSectionProps {
  form: UseFormReturn<AssetEvaluationFormValues>
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

function formatDateToISO(val: any): string | null {
  if (!val) return null
  if (val instanceof Date) return Number.isNaN(val.getTime()) ? null : val.toISOString()
  if (typeof val === 'string') {
    const d = new Date(val)
    return Number.isNaN(d.getTime()) ? val : d.toISOString()
  }
  return null
}

export function DocumentControlSection({
  form,
  readOnly = false,
}: Readonly<DocumentControlSectionProps>) {
  const { control, setValue, watch } = form
  const currentClassification = watch('document_classification') || 'USO INTERNO'

  return (
    <Card shadow="xs" radius="md" p="lg" withBorder>
      <Group mb="md">
        <ThemeIcon size="lg" radius="md" color="blue" variant="light">
          <FileText size={20} />
        </ThemeIcon>
        <div>
          <Title order={4}>Controle do documento</Title>
          <Text size="xs" c="dimmed">
            Metadados de vigência e responsáveis pelo formulário
          </Text>
        </div>
      </Group>

      <Grid gutter="md">
        {/* Linha 1: Vigência e Classificação */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Controller
            control={control}
            name="document_start_date"
            render={({ field }) => (
              <DateInput
                label="Data início"
                placeholder="dd/mm/aaaa"
                valueFormat="DD/MM/YYYY"
                rightSection={<Calendar size={16} color="var(--mantine-color-gray-6)" />}
                clearable
                disabled={readOnly}
                value={parseDateValue(field.value)}
                onChange={(val: any) => field.onChange(formatDateToISO(val))}
              />
            )}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Controller
            control={control}
            name="document_end_date"
            render={({ field }) => (
              <DateInput
                label="Data final"
                placeholder="dd/mm/aaaa"
                valueFormat="DD/MM/YYYY"
                rightSection={<Calendar size={16} color="var(--mantine-color-gray-6)" />}
                clearable
                disabled={readOnly}
                value={parseDateValue(field.value)}
                onChange={(val: any) => field.onChange(formatDateToISO(val))}
              />
            )}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Select
            label="Classificação"
            value={currentClassification}
            onChange={(val: string | null) => setValue('document_classification', val || 'USO INTERNO')}
            data={[
              { value: 'USO INTERNO', label: '● USO INTERNO' },
              { value: 'CONFIDENCIAL', label: '● CONFIDENCIAL' },
              { value: 'RESTRITO', label: '● RESTRITO' },
              { value: 'PÚBLICO', label: '● PÚBLICO' },
            ]}
            disabled={readOnly}
            styles={{
              input: {
                fontWeight: 700,
                letterSpacing: '0.4px',
              },
            }}
          />
        </Grid.Col>

        {/* Linha 2: Responsáveis e datas de elaboração, revisão e aprovação */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap={4}>
            <div>
              <Text size="sm" fw={500}>
                Elaborado por
              </Text>
              <Text size="xs" c="dimmed">
                Área de Patrimônio e TI
              </Text>
            </div>
            <Controller
              control={control}
              name="elaborated_by_date"
              render={({ field }) => (
                <DateInput
                  placeholder="dd/mm/aaaa"
                  valueFormat="DD/MM/YYYY"
                  rightSection={<Calendar size={16} color="var(--mantine-color-gray-6)" />}
                  clearable
                  disabled={readOnly}
                  value={parseDateValue(field.value)}
                  onChange={(val: any) => field.onChange(formatDateToISO(val))}
                />
              )}
            />
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap={4}>
            <div>
              <Text size="sm" fw={500}>
                Revisado por
              </Text>
              <Text size="xs" c="dimmed">
                Gestão Patrimonial
              </Text>
            </div>
            <Controller
              control={control}
              name="reviewed_by_date"
              render={({ field }) => (
                <DateInput
                  placeholder="dd/mm/aaaa"
                  valueFormat="DD/MM/YYYY"
                  rightSection={<Calendar size={16} color="var(--mantine-color-gray-6)" />}
                  clearable
                  disabled={readOnly}
                  value={parseDateValue(field.value)}
                  onChange={(val: any) => field.onChange(formatDateToISO(val))}
                />
              )}
            />
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap={4}>
            <div>
              <Text size="sm" fw={500}>
                Aprovado por
              </Text>
              <Text size="xs" c="dimmed">
                Gestão da Área Administrativa
              </Text>
            </div>
            <Controller
              control={control}
              name="approved_by_date"
              render={({ field }) => (
                <DateInput
                  placeholder="dd/mm/aaaa"
                  valueFormat="DD/MM/YYYY"
                  rightSection={<Calendar size={16} color="var(--mantine-color-gray-6)" />}
                  clearable
                  disabled={readOnly}
                  value={parseDateValue(field.value)}
                  onChange={(val: any) => field.onChange(formatDateToISO(val))}
                />
              )}
            />
          </Stack>
        </Grid.Col>
      </Grid>
    </Card>
  )
}
