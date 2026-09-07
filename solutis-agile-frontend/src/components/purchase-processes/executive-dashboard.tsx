'use client'

import {
  Badge,
  Card,
  Grid,
  Group,
  Paper,
  Progress,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
} from '@mantine/core'
import { Link } from '@tanstack/react-router'
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  FileSpreadsheet,
  TrendingUp,
  Users,
} from 'lucide-react'

import { formatMoney } from '@/hooks/purchase-process/usePurchaseProcessCalculations'
import { usePurchaseProcessMetrics } from '@/hooks/purchase-process/usePurchaseProcessMetrics'
import { CATEGORIAS } from '@/types/PurchaseProcess'

export function ExecutiveDashboard() {
  const {
    periodo,
    setPeriodo,
    categoria,
    setCategoria,
    metrics,
    isPending,
  } = usePurchaseProcessMetrics()

  if (isPending || !metrics) {
    return (
      <Paper p="xl" withBorder radius="md" mb="lg">
        <Text c="dimmed">Carregando indicadores do painel executivo...</Text>
      </Paper>
    )
  }

  const kpis = [
    {
      title: 'Processos no Período',
      value: metrics.totalProcessos,
      sub: 'Processos cadastrados',
      icon: <FileSpreadsheet size={22} color="#1971c2" />,
      bg: '#e7f5ff',
    },
    {
      title: 'Valor Total Aprovado (CTA)',
      value: formatMoney(metrics.valorTotalAprovado),
      sub: 'Custo Total de Aquisição',
      icon: <DollarSign size={22} color="#2b8a3e" />,
      bg: '#ebfbee',
    },
    {
      title: 'Ticket Médio',
      value: formatMoney(metrics.ticketMedio),
      sub: 'Média por processo aprovado',
      icon: <TrendingUp size={22} color="#7950f2" />,
      bg: '#f3f0ff',
    },
    {
      title: 'Economia Identificada',
      value: formatMoney(metrics.economiaIdentificada),
      sub: 'Maior vs. menor CTA cotado',
      icon: <CheckCircle2 size={22} color="#12b886" />,
      bg: '#e6fcf5',
    },
    {
      title: 'Tempo Médio de Decisão',
      value:
        metrics.tempoMedioDecisaoDias != null
          ? `${metrics.tempoMedioDecisaoDias} dias`
          : '—',
      sub: 'Da criação à aprovação/reprovação',
      icon: <Clock size={22} color="#e67700" />,
      bg: '#fff9db',
    },
    {
      title: 'Taxa de Conformidade',
      value:
        metrics.taxaConformidadeCotacao != null
          ? `${metrics.taxaConformidadeCotacao}%`
          : '—',
      sub: 'Mínimo de cotações ou justificado',
      icon: <AlertCircle size={22} color="#0c8599" />,
      bg: '#e3fafc',
    },
  ]

  // Render horizontal bar list
  const renderBarList = (
    items: { label: string; value: number; display: string; color?: string }[]
  ) => {
    if (!items.length) {
      return <Text size="sm" c="dimmed">Sem dados suficientes no período.</Text>
    }
    const maxVal = Math.max(...items.map((i) => i.value), 1)
    return (
      <Stack gap="xs" mt="xs">
        {items.map((item, index) => {
          const pct = Math.max(item.value > 0 ? 4 : 0, Math.round((item.value / maxVal) * 100))
          return (
            <div key={index}>
              <Group justify="space-between" mb={2}>
                <Text size="xs" fw={500}>{item.label}</Text>
                <Text size="xs" fw={600}>{item.display}</Text>
              </Group>
              <Progress value={pct} color={item.color || 'blue'} size="sm" radius="xl" />
            </div>
          )
        })}
      </Stack>
    )
  }

  // Render SVG line chart for monthly trend
  const renderLineChart = (points: { key: string; label: string; value: number }[]) => {
    if (!points.length || points.every((p) => p.value === 0)) {
      return (
        <Text size="sm" c="dimmed" py="md">
          Sem processos suficientes nos últimos meses para gerar a tendência.
        </Text>
      )
    }
    const w = 540
    const h = 140
    const padL = 20
    const padR = 20
    const padT = 15
    const padB = 25
    const innerW = w - padL - padR
    const innerH = h - padT - padB
    const maxVal = Math.max(...points.map((p) => p.value), 1)
    const stepX = points.length > 1 ? innerW / (points.length - 1) : 0

    const x = (i: number) => padL + stepX * i
    const y = (v: number) => padT + innerH - (v / maxVal) * innerH

    const linePts = points.map((p, i) => `${x(i)},${y(p.value)}`).join(' ')
    const areaPts = `M${x(0)},${padT + innerH} L${points
      .map((p, i) => `${x(i)},${y(p.value)}`)
      .join(' L')} L${x(points.length - 1)},${padT + innerH} Z`

    return (
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 140, display: 'block' }}>
          <line
            x1={padL}
            y1={padT + innerH}
            x2={padL + innerW}
            y2={padT + innerH}
            stroke="var(--mantine-color-gray-3)"
            strokeWidth="1"
          />
          <path d={areaPts} fill="#228be6" opacity="0.12" stroke="none" />
          <polyline
            points={linePts}
            fill="none"
            stroke="#228be6"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {points.map((p, i) => (
            <g key={p.key}>
              <circle
                cx={x(i)}
                cy={y(p.value)}
                r="4.5"
                fill="#228be6"
                stroke="var(--mantine-color-body)"
                strokeWidth="2"
              />
              <text
                x={x(i)}
                y={h - 6}
                fontSize="10"
                fill="var(--mantine-color-dimmed)"
                textAnchor="middle"
              >
                {p.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    )
  }

  return (
    <Stack gap="md" mb="xl">
      {/* Filter Toolbar */}
      <Paper p="sm" withBorder radius="md" bg="var(--mantine-color-gray-0)">
        <Group justify="space-between" align="center">
          <Group gap="sm">
            <Select
              size="xs"
              placeholder="Período"
              value={periodo}
              onChange={(val) => setPeriodo(val || '')}
              data={[
                { value: '', label: 'Todo o período' },
                { value: '30', label: 'Últimos 30 dias' },
                { value: '90', label: 'Últimos 90 dias' },
                { value: 'ano', label: 'Este ano' },
              ]}
              w={170}
            />
            <Select
              size="xs"
              placeholder="Categoria"
              value={categoria}
              onChange={(val) => setCategoria(val || '')}
              data={[
                { value: '', label: 'Todas as categorias' },
                ...CATEGORIAS.map((c) => ({ value: c, label: c })),
              ]}
              w={180}
            />
          </Group>
          <Text size="xs" c="dimmed">
            Visão consolidada FO-AD-01
          </Text>
        </Group>
      </Paper>

      {/* KPI Cards Grid */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
        {kpis.map((kpi, idx) => (
          <Card key={idx} withBorder radius="md" p="md">
            <Group justify="space-between" align="flex-start">
              <div>
                <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                  {kpi.title}
                </Text>
                <Title order={3} mt={4} fw={700}>
                  {kpi.value}
                </Title>
                <Text size="xs" c="dimmed" mt={2}>
                  {kpi.sub}
                </Text>
              </div>
              <ThemeIcon size={44} radius="md" style={{ background: kpi.bg }}>
                {kpi.icon}
              </ThemeIcon>
            </Group>
          </Card>
        ))}
      </SimpleGrid>

      {/* Charts & Breakdown Grid */}
      <Grid gutter="md">
        {/* Left Column */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Stack gap="md">
            <Card withBorder radius="md" p="md">
              <Title order={5} mb={2}>
                Processos por Status
              </Title>
              <Text size="xs" c="dimmed" mb="sm">
                Distribuição geral no período selecionado
              </Text>
              {renderBarList(metrics.statusDistribution)}
            </Card>

            <Card withBorder radius="md" p="md">
              <Title order={5} mb={2}>
                Tendência Mensal
              </Title>
              <Text size="xs" c="dimmed" mb="xs">
                Processos abertos por mês nos últimos 6 meses
              </Text>
              {renderLineChart(metrics.monthlyTrend)}
            </Card>

            <Card withBorder radius="md" p="md">
              <Title order={5} mb={2}>
                Processos por Categoria
              </Title>
              <Text size="xs" c="dimmed" mb="sm">
                Normal, Urgência ou Prioridade
              </Text>
              {renderBarList(metrics.categoryDistribution)}
            </Card>
          </Stack>
        </Grid.Col>

        {/* Right Column */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Stack gap="md">
            <Card withBorder radius="md" p="md">
              <Title order={5} mb={2}>
                Processos Aguardando Decisão (Aging)
              </Title>
              <Text size="xs" c="dimmed" mb="sm">
                Pendentes ou em análise ordenados do mais antigo
              </Text>
              {metrics.agingQueue.length === 0 ? (
                <Text size="sm" c="dimmed" py="xs">
                  Nenhum processo pendente aguardando decisão. 🎉
                </Text>
              ) : (
                <Table.ScrollContainer minWidth={350}>
                  <Table highlightOnHover verticalSpacing="xs">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Objeto</Table.Th>
                        <Table.Th>Status</Table.Th>
                        <Table.Th style={{ textAlign: 'right' }}>Aguardando</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {metrics.agingQueue.map((item) => (
                        <Table.Tr key={item.id}>
                          <Table.Td>
                            <Link
                              to={`/purchase-processes/${item.id}` as any}
                              style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                              <Text size="xs" fw={600} lineClamp={1}>
                                {item.objeto}
                              </Text>
                              <Text size="xs" c="dimmed">
                                {item.compradorResponsavel}
                              </Text>
                            </Link>
                          </Table.Td>
                          <Table.Td>
                            <Badge
                              size="xs"
                              variant="light"
                              color={item.status === 'Em análise' ? 'blue' : 'gray'}
                            >
                              {item.status}
                            </Badge>
                          </Table.Td>
                          <Table.Td style={{ textAlign: 'right' }}>
                            <Text size="xs" fw={700} c={item.diasAguardando > 15 ? 'red' : 'dimmed'}>
                              {item.diasAguardando} dia(s)
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
              )}
            </Card>

            <Card withBorder radius="md" p="md">
              <Title order={5} mb={2}>
                Top Compradores Responsáveis
              </Title>
              <Text size="xs" c="dimmed" mb="sm">
                Número de processos conduzidos por comprador
              </Text>
              {renderBarList(metrics.topBuyers)}
            </Card>

            <Card withBorder radius="md" p="md">
              <Title order={5} mb={2}>
                Avaliação de Desempenho de Fornecedores
              </Title>
              <Text size="xs" c="dimmed" mb="sm">
                Classificação pós-compra (Critérios de Qualidade, Prazo, Custo, Atendimento, etc.)
              </Text>
              {renderBarList(metrics.supplierEvaluationDistribution)}
            </Card>
          </Stack>
        </Grid.Col>
      </Grid>
    </Stack>
  )
}
