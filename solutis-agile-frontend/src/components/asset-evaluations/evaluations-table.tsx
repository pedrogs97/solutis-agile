'use client'

import {
  ActionIcon,
  Badge,
  Group,
  Menu,
  Paper,
  Table,
  Text,
  Tooltip,
} from '@mantine/core'
import { useNavigate } from '@tanstack/react-router'
import { CheckCircle2, Eye, MoreVertical, Pencil } from 'lucide-react'

import { formatMoneyBRL } from '@/lib/utils'
import type { AssetTechnicalEvaluation } from '@/types/AssetEvaluation'

interface EvaluationsTableProps {
  data: AssetTechnicalEvaluation[]
  onApprove?: (id: number) => void
}

export function EvaluationsTable({
  data,
  onApprove,
}: Readonly<EvaluationsTableProps>) {
  const navigate = useNavigate()

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Aprovado':
        return <Badge color="green" variant="light">{status}</Badge>
      case 'Baixado':
        return <Badge color="red" variant="light">{status}</Badge>
      case 'Aguardando aprovação':
        return <Badge color="orange" variant="light">{status}</Badge>
      case 'Em avaliação':
        return <Badge color="blue" variant="light">{status}</Badge>
      default:
        return <Badge color="gray" variant="light">{status}</Badge>
    }
  }

  const getClassificationBadge = (cls?: string | null) => {
    if (!cls) return <Text size="xs" c="dimmed">—</Text>
    switch (cls) {
      case 'Excelente':
      case 'Bom':
        return <Badge color="teal" size="sm" variant="outline">{cls}</Badge>
      case 'Regular':
        return <Badge color="yellow" size="sm" variant="outline">{cls}</Badge>
      default:
        return <Badge color="red" size="sm" variant="outline">{cls}</Badge>
    }
  }

  if (!data || data.length === 0) {
    return (
      <Paper p="xl" withBorder style={{ textAlign: 'center' }}>
        <Text c="dimmed">Nenhuma avaliação técnica encontrada.</Text>
      </Paper>
    )
  }

  return (
    <Table.ScrollContainer minWidth={900}>
      <Table verticalSpacing="sm" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Data</Table.Th>
            <Table.Th>Protocolo</Table.Th>
            <Table.Th>Ativo / Modelo</Table.Th>
            <Table.Th>Patrimônio</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Classificação</Table.Th>
            <Table.Th>Taxa ESG</Table.Th>
            <Table.Th>Economia</Table.Th>
            <Table.Th style={{ textAlign: 'right' }}>Ações</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.map((item) => (
            <Table.Tr key={item.id}>
              <Table.Td>
                <Text size="sm">
                  {new Date(item.created_at || item.evaluation_date).toLocaleDateString('pt-BR')}
                </Text>
              </Table.Td>

              <Table.Td>
                <Text size="sm" fw={600} style={{ fontFamily: 'monospace' }}>
                  {item.protocol}
                </Text>
              </Table.Td>

              <Table.Td>
                <Text size="sm" fw={500}>
                  {item.brand_model || item.asset_type_name || 'Equipamento'}
                </Text>
                {item.serial_number && (
                  <Text size="xs" c="dimmed">
                    S/N: {item.serial_number}
                  </Text>
                )}
              </Table.Td>

              <Table.Td>
                <Text size="sm" style={{ fontFamily: 'monospace' }}>
                  {item.patrimonio || '—'}
                </Text>
              </Table.Td>

              <Table.Td>{getStatusBadge(item.status)}</Table.Td>

              <Table.Td>{getClassificationBadge(item.classification)}</Table.Td>

              <Table.Td>
                <Text size="sm" fw={700} c={item.reuse_percentage > 0 ? 'teal' : 'dimmed'}>
                  {item.reuse_percentage?.toFixed(1) || '0.0'}%
                </Text>
              </Table.Td>

              <Table.Td>
                <Text size="sm" fw={700} c={item.estimated_economy > 0 ? 'green' : 'dimmed'}>
                  {formatMoneyBRL(item.estimated_economy)}
                </Text>
              </Table.Td>

              <Table.Td style={{ textAlign: 'right' }}>
                <Group gap={4} justify="flex-end">
                  <Tooltip label="Visualizar / Editar">
                    <ActionIcon
                      variant="subtle"
                      color="blue"
                      onClick={() => navigate({ to: `/asset-evaluations/${item.id}` })}
                    >
                      <Eye size={18} />
                    </ActionIcon>
                  </Tooltip>

                  <Menu position="bottom-end" shadow="md">
                    <Menu.Target>
                      <ActionIcon variant="subtle" color="gray">
                        <MoreVertical size={18} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        leftSection={<Pencil size={16} />}
                        onClick={() => navigate({ to: `/asset-evaluations/${item.id}` })}
                      >
                        Editar Avaliação
                      </Menu.Item>
                      {item.status !== 'Baixado' && onApprove && (
                        <Menu.Item
                          leftSection={<CheckCircle2 size={16} />}
                          color="green"
                          onClick={() => onApprove(item.id)}
                        >
                          Aprovar e Efetivar Baixa
                        </Menu.Item>
                      )}
                    </Menu.Dropdown>
                  </Menu>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  )
}
