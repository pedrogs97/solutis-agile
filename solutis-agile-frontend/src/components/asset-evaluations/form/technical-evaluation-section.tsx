'use client'

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
import { UseFormReturn } from 'react-hook-form'

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
  const { register, setValue, watch } = form
  const currentDestinations = watch('destination') || []
  const currentClassification = watch('classification')
  const currentFeasibility = watch('feasibility')

  const handleDestinationToggle = (dest: string) => {
    if (readOnly) return
    const exists = currentDestinations.includes(dest)
    if (exists) {
      setValue(
        'destination',
        currentDestinations.filter((d) => d !== dest)
      )
    } else {
      setValue('destination', [...currentDestinations, dest])
    }
  }

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
        {/* Classificação */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Stack gap="xs">
            <Text size="sm" fw={600}>
              Classificação do Estado Geral *
            </Text>
            <Radio.Group
              value={currentClassification || 'Bom'}
              onChange={(val) => setValue('classification', val)}
            >
              <Group gap="sm" mt={4}>
                <Radio value="Excelente" label="Excelente" disabled={readOnly} color="teal" />
                <Radio value="Bom" label="Bom" disabled={readOnly} color="teal" />
                <Radio value="Regular" label="Regular" disabled={readOnly} color="yellow" />
                <Radio value="Ruim" label="Ruim" disabled={readOnly} color="red" />
                <Radio value="Irrecuperável" label="Irrecuperável" disabled={readOnly} color="red" />
              </Group>
            </Radio.Group>
          </Stack>
        </Grid.Col>

        {/* Viabilidade */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Stack gap="xs">
            <Text size="sm" fw={600}>
              Viabilidade de Recuperação *
            </Text>
            <Radio.Group
              value={currentFeasibility || 'Alta'}
              onChange={(val) => setValue('feasibility', val)}
            >
              <Group gap="sm" mt={4}>
                <Radio value="Alta" label="Alta" disabled={readOnly} color="teal" />
                <Radio value="Média" label="Média" disabled={readOnly} color="yellow" />
                <Radio value="Baixa" label="Baixa" disabled={readOnly} color="orange" />
                <Radio value="Inviável" label="Inviável" disabled={readOnly} color="red" />
              </Group>
            </Radio.Group>
          </Stack>
        </Grid.Col>

        {/* Destinos recomendados (Multi-select) */}
        <Grid.Col span={12}>
          <Stack gap="xs">
            <Text size="sm" fw={600}>
              Destino Recomendado * (Selecione uma ou mais opções)
            </Text>
            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
              {DESTINATION_OPTIONS.map((dest) => (
                <Checkbox
                  key={dest}
                  label={dest}
                  checked={currentDestinations.includes(dest)}
                  onChange={() => handleDestinationToggle(dest)}
                  disabled={readOnly}
                  color="indigo"
                />
              ))}
            </SimpleGrid>
          </Stack>
        </Grid.Col>

        <Grid.Col span={12}>
          <Textarea
            label="Parecer Técnico / Diagnóstico de Ocorrência"
            placeholder="Descreva detalhes de testes de hardware realizados, peças danificadas e parecer final..."
            rows={3}
            {...register('justification')}
            disabled={readOnly}
          />
        </Grid.Col>
      </Grid>
    </Card>
  )
}
