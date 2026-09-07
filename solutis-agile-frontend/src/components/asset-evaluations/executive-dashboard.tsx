'use client'

import {
  Badge,
  Card,
  Grid,
  Group,
  Paper,
  Progress,
  RingProgress,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import {
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  DollarSign,
  Leaf,
  Recycle,
  Scale,
  Trash2,
} from 'lucide-react'

import { formatMoneyBRL } from '@/lib/utils'
import type { AssetEvaluationMetrics } from '@/types/AssetEvaluation'

interface ExecutiveDashboardProps {
  metrics?: AssetEvaluationMetrics | null
  isLoading?: boolean
}

export function ExecutiveDashboard({
  metrics,
}: Readonly<ExecutiveDashboardProps>) {
  const totalEvaluations = metrics?.total_evaluations ?? 0
  const totalReusedAssets = metrics?.total_reused_assets ?? 0
  const totalWrittenOffAssets = metrics?.total_written_off_assets ?? 0
  const totalReusedWeight = metrics?.total_reused_weight ?? 0
  const totalDiscardedWeight = metrics?.total_discarded_weight ?? 0
  const totalRecycleWeight = metrics?.total_recycle_weight ?? 0
  const averageReusePercentage = metrics?.average_reuse_percentage ?? 0
  const totalEstimatedEconomy = metrics?.total_estimated_economy ?? 0

  const totalWasteReduction = totalReusedWeight + totalRecycleWeight

  const stats = [
    {
      title: 'Ativos Avaliados',
      value: totalEvaluations.toString(),
      description: 'Total de formulários FO-PAT-02 registrados',
      icon: Boxes,
      color: 'blue',
    },
    {
      title: 'Reaproveitamento Interno',
      value: totalReusedAssets.toString(),
      description: 'Bens com componentes reaproveitados',
      icon: Recycle,
      color: 'teal',
    },
    {
      title: 'Baixas Efetivadas',
      value: totalWrittenOffAssets.toString(),
      description: 'Bens desativados com status Descarte',
      icon: Trash2,
      color: 'orange',
    },
    {
      title: 'Economia Estimada Gerada',
      value: formatMoneyBRL(totalEstimatedEconomy),
      description: 'Economia pelo reaproveitamento de peças',
      icon: DollarSign,
      color: 'green',
    },
  ]

  return (
    <Stack gap="lg">
      {/* 4 Top KPI Cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} shadow="sm" radius="md" p="md" withBorder>
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                  {stat.title}
                </Text>
                <ThemeIcon color={stat.color} variant="light" size="lg" radius="md">
                  <Icon size={20} />
                </ThemeIcon>
              </Group>
              <Title order={2} fw={800}>
                {stat.value}
              </Title>
              <Text size="xs" c="dimmed" mt={4}>
                {stat.description}
              </Text>
            </Card>
          )
        })}
      </SimpleGrid>

      {/* Main ESG & Sustainability Insights Grid */}
      <Grid gutter="md">
        {/* Left: ESG Reuse Rate Ring */}
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Card shadow="sm" radius="md" p="lg" withBorder h="100%">
            <Group justify="space-between" mb="md">
              <div>
                <Text size="md" fw={700}>
                  Taxa Média de Reaproveitamento ESG
                </Text>
                <Text size="xs" c="dimmed">
                  Eficiência ambiental ponderada por peso
                </Text>
              </div>
              <Badge color="teal" variant="light" leftSection={<Leaf size={14} />}>
                ESG Score
              </Badge>
            </Group>

            <Group justify="center" my="md">
              <RingProgress
                size={180}
                thickness={18}
                roundCaps
                sections={[
                  { value: averageReusePercentage, color: 'teal' },
                  { value: 100 - averageReusePercentage, color: 'gray.2' },
                ]}
                label={
                  <div style={{ textAlign: 'center' }}>
                    <Text size="xl" fw={800} c="teal">
                      {averageReusePercentage.toFixed(1)}%
                    </Text>
                    <Text size="xs" c="dimmed">
                      Reaproveitado
                    </Text>
                  </div>
                }
              />
            </Group>

            <Stack gap="xs" mt="sm">
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Redução de Resíduos Eletrônicos:
                </Text>
                <Text size="sm" fw={700} c="teal">
                  {totalWasteReduction.toFixed(1)} kg
                </Text>
              </Group>
              <Progress
                value={averageReusePercentage}
                color="teal"
                radius="xl"
                size="md"
              />
            </Stack>
          </Card>
        </Grid.Col>

        {/* Right: Weight Distribution & Logistics Breakdown */}
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Card shadow="sm" radius="md" p="lg" withBorder h="100%">
            <Group justify="space-between" mb="md">
              <div>
                <Text size="md" fw={700}>
                  Balanço de Massa e Destinação Patrimonial
                </Text>
                <Text size="xs" c="dimmed">
                  Pesagem consolidada de materiais (kg)
                </Text>
              </div>
              <ThemeIcon color="blue" variant="light" radius="md">
                <Scale size={20} />
              </ThemeIcon>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mt="md">
              <Paper p="md" radius="md" withBorder bg="var(--mantine-color-teal-0)">
                <Group justify="space-between">
                  <Text size="xs" fw={700} c="teal.9">
                    Reaproveitado
                  </Text>
                  <ArrowUpRight size={18} color="var(--mantine-color-teal-6)" />
                </Group>
                <Title order={3} fw={800} c="teal.8" mt="xs">
                  {totalReusedWeight.toFixed(1)} kg
                </Title>
                <Text size="xs" c="teal.7" mt={2}>
                  Peças para estoque e reuso interno
                </Text>
              </Paper>

              <Paper p="md" radius="md" withBorder bg="var(--mantine-color-blue-0)">
                <Group justify="space-between">
                  <Text size="xs" fw={700} c="blue.9">
                    Reciclagem
                  </Text>
                  <Recycle size={18} color="var(--mantine-color-blue-6)" />
                </Group>
                <Title order={3} fw={800} c="blue.8" mt="xs">
                  {totalRecycleWeight.toFixed(1)} kg
                </Title>
                <Text size="xs" c="blue.7" mt={2}>
                  Materiais enviados para logística reversa
                </Text>
              </Paper>

              <Paper p="md" radius="md" withBorder bg="var(--mantine-color-red-0)">
                <Group justify="space-between">
                  <Text size="xs" fw={700} c="red.9">
                    Descarte / Sucata
                  </Text>
                  <ArrowDownRight size={18} color="var(--mantine-color-red-6)" />
                </Group>
                <Title order={3} fw={800} c="red.8" mt="xs">
                  {totalDiscardedWeight.toFixed(1)} kg
                </Title>
                <Text size="xs" c="red.7" mt={2}>
                  Inservíveis com descarte certificado
                </Text>
              </Paper>
            </SimpleGrid>

            <Paper p="md" radius="md" withBorder mt="md" bg="var(--mantine-color-gray-0)">
              <Group justify="space-between">
                <div>
                  <Text size="sm" fw={700}>
                    Conformidade e Rastreabilidade
                  </Text>
                  <Text size="xs" c="dimmed">
                    Processo 100% aderente ao formulário FO-PAT-02 com manifesto de resíduos (MTR) e laudo técnico.
                  </Text>
                </div>
                <Badge color="green" size="lg" leftSection={<CheckCircle2 size={16} />}>
                  Auditado
                </Badge>
              </Group>
            </Paper>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  )
}
