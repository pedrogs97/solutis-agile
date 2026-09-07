'use client'

import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Pagination,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core'
import { Link, useNavigate } from '@tanstack/react-router'
import { Download, Eye, Plus, Search, Trash2 } from 'lucide-react'

import { formatDate, formatMoney } from '@/hooks/purchase-process/usePurchaseProcessCalculations'
import { usePurchaseProcessList } from '@/hooks/purchase-process/usePurchaseProcessList'
import { CATEGORIAS, STATUS_LIST } from '@/types/PurchaseProcess'

interface ProcessTableProps {
  onToggleDashboard?: () => void
  showDashboard?: boolean
}

export function ProcessTable({ onToggleDashboard, showDashboard }: ProcessTableProps) {
  const navigate = useNavigate()
  const {
    search,
    setSearch,
    status,
    setStatus,
    category,
    setCategory,
    page,
    setPage,
    pageSize,
    setPageSize,
    listData,
    isPending,
    handleDelete,
    exportCsv,
  } = usePurchaseProcessList()

  const getStatusColor = (st: string) => {
    switch (st) {
      case 'Aprovado':
        return 'green'
      case 'Reprovado':
        return 'red'
      case 'Em análise':
        return 'blue'
      case 'Dispensado':
        return 'gray'
      default:
        return 'yellow'
    }
  }

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Prioridade':
        return 'orange'
      case 'Urgência':
        return 'red'
      default:
        return 'teal'
    }
  }

  return (
    <Stack gap="md">
      {/* Search & Actions Bar */}
      <Paper p="sm" withBorder radius="md">
        <Group justify="space-between" wrap="wrap" gap="sm">
          <Group gap="sm" style={{ flex: 1, minWidth: 280 }}>
            <TextInput
              placeholder="Buscar por objeto, comprador ou solicitante..."
              leftSection={<Search size={16} />}
              value={search}
              onChange={(e) => {
                setSearch(e.currentTarget.value)
                setPage(1)
              }}
              style={{ flex: 1, minWidth: 220 }}
              size="sm"
            />
            <Select
              placeholder="Status"
              value={status}
              onChange={(val) => {
                setStatus(val || '')
                setPage(1)
              }}
              data={[{ value: '', label: 'Todos os status' }, ...STATUS_LIST.map((s) => ({ value: s, label: s }))]}
              w={160}
              size="sm"
              clearable
            />
            <Select
              placeholder="Categoria"
              value={category}
              onChange={(val) => {
                setCategory(val || '')
                setPage(1)
              }}
              data={[{ value: '', label: 'Todas as categorias' }, ...CATEGORIAS.map((c) => ({ value: c, label: c }))]}
              w={170}
              size="sm"
              clearable
            />
          </Group>

          <Group gap="xs">
            <Button
              variant="default"
              size="sm"
              leftSection={<Download size={16} />}
              onClick={exportCsv}
            >
              Exportar CSV
            </Button>
            {onToggleDashboard && (
              <Button
                variant={showDashboard ? 'filled' : 'light'}
                color="blue"
                size="sm"
                onClick={onToggleDashboard}
              >
                {showDashboard ? 'Ocultar Dashboard' : '📊 Painel Executivo'}
              </Button>
            )}
            <Button
              component={Link}
              to={'/purchase-processes/new' as any}
              color="green"
              size="sm"
              leftSection={<Plus size={16} />}
            >
              Novo Processo
            </Button>
          </Group>
        </Group>
      </Paper>

      {/* Table Section */}
      <Paper withBorder radius="md" p={0} style={{ overflow: 'hidden' }}>
        <Table.ScrollContainer minWidth={850}>
          <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead bg="var(--mantine-color-gray-0)">
              <Table.Tr>
                <Table.Th style={{ width: 110 }}>Data</Table.Th>
                <Table.Th>Objeto da Contratação</Table.Th>
                <Table.Th style={{ width: 120 }}>Categoria</Table.Th>
                <Table.Th>Fornecedor Recomendado</Table.Th>
                <Table.Th style={{ width: 140, textAlign: 'right' }}>Valor Total (CTA)</Table.Th>
                <Table.Th style={{ width: 120 }}>Status</Table.Th>
                <Table.Th style={{ width: 90, textAlign: 'center' }}>Ações</Table.Th>
              </Table.Tr>
            </Table.Thead>

            <Table.Tbody>
              {isPending ? (
                <Table.Tr>
                  <Table.Td colSpan={7} style={{ textAlign: 'center', padding: '32px' }}>
                    <Text c="dimmed">Carregando processos de compra...</Text>
                  </Table.Td>
                </Table.Tr>
              ) : !listData || listData.items.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={7} style={{ textAlign: 'center', padding: '32px' }}>
                    <Text c="dimmed">Nenhum processo de compra encontrado com os filtros informados.</Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                listData.items.map((item) => (
                  <Table.Tr
                    key={item.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate({ to: `/purchase-processes/${item.id}` as any })}
                  >
                    <Table.Td>
                      <Text size="sm" fw={500}>
                        {formatDate(item.data || item.criadoEm)}
                      </Text>
                    </Table.Td>

                    <Table.Td>
                      <Text size="sm" fw={600} lineClamp={1}>
                        {item.objeto}
                      </Text>
                      <Text size="xs" c="dimmed">
                        Comprador: {item.compradorResponsavel || '—'} | Solicitante: {item.solicitante || '—'}
                      </Text>
                    </Table.Td>

                    <Table.Td>
                      <Badge variant="light" color={getCategoryColor(item.categoria)} size="sm">
                        {item.categoria}
                      </Badge>
                    </Table.Td>

                    <Table.Td>
                      <Text size="sm">
                        {item.fornecedorRecomendadoNome || <span style={{ color: 'var(--mantine-color-dimmed)' }}>—</span>}
                      </Text>
                    </Table.Td>

                    <Table.Td style={{ textAlign: 'right' }}>
                      <Text size="sm" fw={700}>
                        {formatMoney(item.valorProcesso)}
                      </Text>
                    </Table.Td>

                    <Table.Td>
                      <Badge variant="filled" color={getStatusColor(item.status)} size="sm">
                        {item.status}
                      </Badge>
                    </Table.Td>

                    <Table.Td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <Group gap={4} justify="center">
                        <Tooltip label="Visualizar / Editar">
                          <ActionIcon
                            variant="subtle"
                            color="blue"
                            size="sm"
                            component={Link}
                            to={`/purchase-processes/${item.id}` as any}
                          >
                            <Eye size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Excluir">
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            size="sm"
                            onClick={() => handleDelete(item.id, item.objeto)}
                          >
                            <Trash2 size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>

        {listData && listData.totalPages > 1 && (
          <Group justify="space-between" p="sm" bg="var(--mantine-color-gray-0)">
            <Text size="xs" c="dimmed">
              Exibindo {listData.items.length} de {listData.count} processo(s)
            </Text>
            <Pagination
              total={listData.totalPages}
              value={page}
              onChange={setPage}
              size="sm"
              radius="md"
            />
          </Group>
        )}
      </Paper>
    </Stack>
  )
}
