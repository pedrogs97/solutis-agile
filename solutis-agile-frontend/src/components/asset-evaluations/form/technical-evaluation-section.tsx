'use client'

import React from 'react'
import {
  Card,
  Checkbox,
  Grid,
  Group,
  Radio,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { Wrench } from 'lucide-react'
import { Controller, type ControllerRenderProps, type UseFormReturn } from 'react-hook-form'

import type { AssetEvaluationFormValues } from '@/types/AssetEvaluation'

interface TechnicalEvaluationSectionProps {
  form: UseFormReturn<AssetEvaluationFormValues>
  readOnly?: boolean
}

const DESTINATION_OPTIONS = [
  'Reparo',
  'Reutilização',
  'Aproveitamento parcial',
  'Reaproveitamento interno',
  'Reciclagem',
  'Descarte',
  'Venda',
  'Doação',
]

export function TechnicalEvaluationSection({
  form,
  readOnly = false,
}: Readonly<TechnicalEvaluationSectionProps>) {
  const { control } = form

  return (
    <Card shadow="xs" radius="md" p="lg" withBorder>
      <Group mb="md">
        <ThemeIcon size="lg" radius="md" color="indigo" variant="light">
          <Wrench size={20} />
        </ThemeIcon>
        <div>
          <Title order={4}>2. Avaliação Técnica & Diagnóstico</Title>
          <Text size="xs" c="dimmed">
            Classificação do bem, viabilidade técnica e recomendação de destinação
          </Text>
        </div>
      </Group>

      <Grid gutter="lg">
        {/* Classificação do Estado Geral */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Stack gap="xs">
            <Text size="sm" fw={600}>
              Classificação do Estado Geral *
            </Text>
            <Controller
              control={control}
              name="classification"
              rules={{ required: true }}
              render={({ field }: { field: ControllerRenderProps<AssetEvaluationFormValues, 'classification'> }) => (
                <Radio.Group
                  value={field.value || 'Bom'}
                  onChange={(val: string) => field.onChange(val)}
                >
                  <Group gap="sm" mt={4}>
                    <Radio value="Excelente" label="Excelente" disabled={readOnly} color="teal" />
                    <Radio value="Bom" label="Bom" disabled={readOnly} color="teal" />
                    <Radio value="Regular" label="Regular" disabled={readOnly} color="yellow" />
                    <Radio value="Ruim" label="Ruim" disabled={readOnly} color="red" />
                    <Radio value="Irrecuperável" label="Irrecuperável" disabled={readOnly} color="red" />
                  </Group>
                </Radio.Group>
              )}
            />
          </Stack>
        </Grid.Col>

        {/* Viabilidade de Recuperação */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Stack gap="xs">
            <Text size="sm" fw={600}>
              Viabilidade de Recuperação *
            </Text>
            <Controller
              control={control}
              name="feasibility"
              rules={{ required: true }}
              render={({ field }: { field: ControllerRenderProps<AssetEvaluationFormValues, 'feasibility'> }) => (
                <Radio.Group
                  value={field.value || 'Alta'}
                  onChange={(val: string) => field.onChange(val)}
                >
                  <Group gap="sm" mt={4}>
                    <Radio value="Alta" label="Alta" disabled={readOnly} color="teal" />
                    <Radio value="Média" label="Média" disabled={readOnly} color="yellow" />
                    <Radio value="Baixa" label="Baixa" disabled={readOnly} color="orange" />
                    <Radio value="Inviável" label="Inviável" disabled={readOnly} color="red" />
                  </Group>
                </Radio.Group>
              )}
            />
          </Stack>
        </Grid.Col>

        {/* Destinos recomendados (Multi-select) */}
        <Grid.Col span={12}>
          <Stack gap="xs">
            <Text size="sm" fw={600}>
              Destino Recomendado * (Selecione uma ou mais opções)
            </Text>
            <Controller
              control={control}
              name="destination"
              render={({ field }: { field: ControllerRenderProps<AssetEvaluationFormValues, 'destination'> }) => {
                const currentDestinations: string[] = Array.isArray(field.value) ? field.value : []
                const handleToggle = (dest: string) => {
                  if (readOnly) return
                  const exists = currentDestinations.includes(dest)
                  const updated = exists
                    ? currentDestinations.filter((d: string) => d !== dest)
                    : [...currentDestinations, dest]
                  field.onChange(updated)
                }

                return (
                  <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
                    {DESTINATION_OPTIONS.map((dest) => (
                      <Checkbox
                        key={dest}
                        label={dest}
                        checked={currentDestinations.includes(dest)}
                        onChange={() => handleToggle(dest)}
                        disabled={readOnly}
                        color="indigo"
                      />
                    ))}
                  </SimpleGrid>
                )
              }}
            />
          </Stack>
        </Grid.Col>

        {/* Parecer Técnico / Diagnóstico de Ocorrência */}
        <Grid.Col span={12}>
          <Controller
            control={control}
            name="technical_opinion"
            render={({ field }: { field: ControllerRenderProps<AssetEvaluationFormValues, 'technical_opinion'> }) => (
              <Textarea
                label="Parecer Técnico / Diagnóstico de Ocorrência"
                placeholder="Descreva detalhes de testes de hardware realizados, peças danificadas e parecer final..."
                rows={3}
                value={field.value || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                  field.onChange(e.currentTarget.value)
                }}
                disabled={readOnly}
              />
            )}
          />
        </Grid.Col>
      </Grid>
    </Card>
  )
}
