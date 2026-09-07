'use client'

import { Badge, Card, Group, Progress, SimpleGrid, Text } from '@mantine/core'

interface SummaryKpiBarProps {
  classification?: string | null
  feasibility?: string | null
  reusePercentage: number
  destinations: string[]
}

export function SummaryKpiBar({
  classification,
  feasibility,
  reusePercentage,
  destinations,
}: Readonly<SummaryKpiBarProps>) {
  const getClassificationBadge = () => {
    if (!classification) return <Badge color="gray">Não avaliado</Badge>
    switch (classification) {
      case 'Excelente':
      case 'Bom':
        return <Badge color="teal">{classification}</Badge>
      case 'Regular':
        return <Badge color="yellow">{classification}</Badge>
      default:
        return <Badge color="red">{classification}</Badge>
    }
  }

  const getFeasibilityBadge = () => {
    if (!feasibility) return <Badge color="gray">Não avaliado</Badge>
    switch (feasibility) {
      case 'Alta':
        return <Badge color="teal">Alta</Badge>
      case 'Média':
        return <Badge color="yellow">Média</Badge>
      default:
        return <Badge color="red">{feasibility}</Badge>
    }
  }

  return (
    <Card shadow="xs" radius="md" p="md" withBorder bg="var(--mantine-color-blue-0)">
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
        <div>
          <Text size="xs" c="dimmed" fw={700} tt="uppercase">
            Classificação Geral
          </Text>
          <Group mt={4}>{getClassificationBadge()}</Group>
        </div>

        <div>
          <Text size="xs" c="dimmed" fw={700} tt="uppercase">
            Viabilidade de Recuperação
          </Text>
          <Group mt={4}>{getFeasibilityBadge()}</Group>
        </div>

        <div>
          <Group justify="space-between">
            <Text size="xs" c="dimmed" fw={700} tt="uppercase">
              Reaproveitamento (Peso)
            </Text>
            <Text size="sm" fw={800} c="teal">
              {reusePercentage.toFixed(1)}%
            </Text>
          </Group>
          <Progress
            value={reusePercentage}
            color="teal"
            size="sm"
            radius="xl"
            mt={6}
          />
        </div>

        <div>
          <Text size="xs" c="dimmed" fw={700} tt="uppercase">
            Destino Recomendado
          </Text>
          <Text size="sm" fw={600} truncate mt={4}>
            {destinations.length ? destinations.join(', ') : 'A definir'}
          </Text>
        </div>
      </SimpleGrid>
    </Card>
  )
}
