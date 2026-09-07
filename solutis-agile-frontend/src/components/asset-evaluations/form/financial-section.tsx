'use client'

import {
  Card,
  Grid,
  Group,
  NumberInput,
  Paper,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { DollarSign, Sparkles } from 'lucide-react'
import { UseFormReturn } from 'react-hook-form'

import { formatMoneyBRL } from '@/lib/utils'
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
  const { setValue, watch } = form
  const acquisitionValue = watch('acquisition_value') ?? 0
  const netBookValue = watch('net_book_value') ?? 0

  return (
    <Card shadow="xs" radius="md" p="lg" withBorder>
      <Group mb="md">
        <ThemeIcon size="lg" radius="md" color="green" variant="light">
          <DollarSign size={20} />
        </ThemeIcon>
        <div>
          <Title order={4}>5. Avaliação Financeira & Eficiência</Title>
          <Text size="xs" c="dimmed">
            Impacto econômico e economia gerada pelo reaproveitamento patrimonial
          </Text>
        </div>
      </Group>

      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 4 }}>
          <NumberInput
            label="Valor Original de Aquisição (R$)"
            prefix="R$ "
            thousandSeparator="."
            decimalSeparator=","
            decimalScale={2}
            min={0}
            value={acquisitionValue}
            onChange={(val) => setValue('acquisition_value', Number(val) || 0)}
            disabled={readOnly}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <NumberInput
            label="Valor Contábil Líquido (R$)"
            description="Valor contábil após depreciação"
            prefix="R$ "
            thousandSeparator="."
            decimalSeparator=","
            decimalScale={2}
            min={0}
            value={netBookValue}
            onChange={(val) => setValue('net_book_value', Number(val) || 0)}
            disabled={readOnly}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper p="sm" radius="md" withBorder bg="var(--mantine-color-green-0)">
            <Group justify="space-between">
              <Text size="xs" fw={700} c="green.9">
                ECONOMIA ESTIMADA (R$)
              </Text>
              <Sparkles size={16} color="var(--mantine-color-green-7)" />
            </Group>
            <Title order={3} fw={800} c="green.8" mt={4}>
              {formatMoneyBRL(estimatedEconomy)}
            </Title>
            <Text size="xs" c="green.7" mt={2}>
              Calculado: Valor contábil × Taxa ESG
            </Text>
          </Paper>
        </Grid.Col>
      </Grid>
    </Card>
  )
}
