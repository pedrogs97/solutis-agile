'use client'

import {
  Badge,
  Card,
  Grid,
  Group,
  NumberInput,
  Progress,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { Leaf, Scale } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'

import type { AssetEvaluationFormValues } from '@/types/AssetEvaluation'

interface EsgWeightSectionProps {
  form: UseFormReturn<AssetEvaluationFormValues>
  reusePercentage: number
  readOnly?: boolean
}

export function EsgWeightSection({
  form,
  reusePercentage,
  readOnly = false,
}: Readonly<EsgWeightSectionProps>) {
  const { setValue, watch } = form
  const grossWeight = watch('gross_weight') ?? 0
  const reusedWeight = watch('reused_weight') ?? 0
  const discardedWeight = watch('discarded_weight') ?? 0
  const recycleWeight = watch('recycle_weight') ?? 0

  return (
    <Card shadow="xs" radius="md" p="lg" withBorder>
      <Group justify="space-between" mb="md">
        <Group>
          <ThemeIcon size="lg" radius="md" color="teal" variant="light">
            <Leaf size={20} />
          </ThemeIcon>
          <div>
            <Title order={4}>4. ESG & Controle de Pesagem</Title>
            <Text size="xs" c="dimmed">
              Rastreabilidade ambiental e percentual de aproveitamento de massa (kg)
            </Text>
          </div>
        </Group>

        <Badge color="teal" size="lg" leftSection={<Scale size={16} />}>
          Taxa ESG: {reusePercentage.toFixed(1)}%
        </Badge>
      </Group>

      <Grid gutter="md">
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <NumberInput
            label="Peso Bruto do Ativo (kg) *"
            description="Peso total antes da desmontagem"
            min={0}
            step={0.01}
            decimalScale={2}
            value={grossWeight}
            onChange={(val) => setValue('gross_weight', Number(val) || 0)}
            disabled={readOnly}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <NumberInput
            label="Peso Reaproveitado (kg)"
            description="Componentes reaproveitados"
            min={0}
            step={0.01}
            decimalScale={2}
            value={reusedWeight}
            onChange={(val) => setValue('reused_weight', Number(val) || 0)}
            disabled={readOnly}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <NumberInput
            label="Peso Descartado (kg)"
            description="Resíduos sem reuso"
            min={0}
            step={0.01}
            decimalScale={2}
            value={discardedWeight}
            onChange={(val) => setValue('discarded_weight', Number(val) || 0)}
            disabled={readOnly}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <NumberInput
            label="Peso para Reciclagem (kg)"
            description="Logística reversa / reciclagem"
            min={0}
            step={0.01}
            decimalScale={2}
            value={recycleWeight}
            onChange={(val) => setValue('recycle_weight', Number(val) || 0)}
            disabled={readOnly}
          />
        </Grid.Col>

        <Grid.Col span={12}>
          <Stack gap={4}>
            <Group justify="space-between">
              <Text size="xs" fw={700} c="dimmed">
                PROGRESSO DE REAPROVEITAMENTO ESG
              </Text>
              <Text size="xs" fw={700} c="teal">
                {reusePercentage.toFixed(1)}% de massa reaproveitada
              </Text>
            </Group>
            <Progress
              value={reusePercentage}
              color="teal"
              size="lg"
              radius="xl"
              striped
              animated={reusePercentage > 0}
            />
          </Stack>
        </Grid.Col>
      </Grid>
    </Card>
  )
}
