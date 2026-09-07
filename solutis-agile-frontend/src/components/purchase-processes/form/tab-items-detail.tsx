'use client'

import { Fragment } from 'react'

import {
  ActionIcon,
  Button,
  Group,
  NumberInput,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core'
import { Plus, Trash2 } from 'lucide-react'

import {
  calcItemTotal,
  formatMoney,
  usePurchaseProcessCalculations,
} from '@/hooks/purchase-process/usePurchaseProcessCalculations'
import type { PurchaseItem, PurchaseProcess } from '@/types/PurchaseProcess'
import { UNIDADES } from '@/types/PurchaseProcess'

interface TabItemsDetailProps {
  process: PurchaseProcess
  updateItem: (itemId: string, field: keyof PurchaseItem, value: any) => void
  updateItemPrice: (itemId: string, supplierId: string, value: number | null) => void
  addItem: () => void
  removeItem: (itemId: string) => void
}

export function TabItemsDetail({
  process,
  updateItem,
  updateItemPrice,
  addItem,
  removeItem,
}: TabItemsDetailProps) {
  const { grossMap } = usePurchaseProcessCalculations(process)

  return (
    <Paper withBorder radius="md" p="lg">
      <Stack gap="md">
        <Group justify="space-between" align="center" wrap="wrap">
          <div>
            <Title order={4}>3. Detalhamento dos Itens Cotados</Title>
            <Text size="sm" c="dimmed">
              Discrimine os itens da compra para calcular automaticamente o valor bruto de cada fornecedor. Se a compra não for detalhada por item, deixe esta lista vazia e informe o valor bruto manual no Mapa Comparativo.
            </Text>
          </div>

          <Button
            size="xs"
            variant="light"
            color="blue"
            leftSection={<Plus size={14} />}
            onClick={addItem}
          >
            Adicionar Item
          </Button>
        </Group>

        <Table.ScrollContainer minWidth={750}>
          <Table withTableBorder withColumnBorders verticalSpacing="xs">
            <Table.Thead bg="var(--mantine-color-gray-0)">
              <Table.Tr>
                <Table.Th style={{ width: 45, textAlign: 'center' }}>#</Table.Th>
                <Table.Th style={{ minWidth: 200 }}>Descrição / Especificação</Table.Th>
                <Table.Th style={{ width: 90 }}>Qtd.</Table.Th>
                <Table.Th style={{ width: 100 }}>Unid.</Table.Th>
                {process.fornecedores.map((f, idx) => (
                  <Table.Th key={f.id} colSpan={2} style={{ textAlign: 'center', minWidth: 190 }}>
                    {f.nome || `Fornecedor ${idx + 1}`}
                  </Table.Th>
                ))}
                <Table.Th style={{ width: 45 }}></Table.Th>
              </Table.Tr>
              <Table.Tr>
                <Table.Th></Table.Th>
                <Table.Th></Table.Th>
                <Table.Th></Table.Th>
                <Table.Th></Table.Th>
                {process.fornecedores.map((f) => (
                  <Fragment key={f.id}>
                    <Table.Th style={{ width: 95, fontSize: '11px', textAlign: 'right' }}>Unit. (R$)</Table.Th>
                    <Table.Th style={{ width: 95, fontSize: '11px', textAlign: 'right' }}>Total (R$)</Table.Th>
                  </Fragment>
                ))}
                <Table.Th></Table.Th>
              </Table.Tr>
            </Table.Thead>

            <Table.Tbody>
              {process.itens.map((it, idx) => (
                <Table.Tr key={it.id}>
                  <Table.Td style={{ textAlign: 'center', fontWeight: 600 }}>{idx + 1}</Table.Td>

                  <Table.Td>
                    <TextInput
                      size="xs"
                      placeholder="Descrição do item ou serviço"
                      value={it.descricao || ''}
                      onChange={(e) => updateItem(it.id, 'descricao', e.currentTarget.value)}
                    />
                  </Table.Td>

                  <Table.Td>
                    <NumberInput
                      size="xs"
                      min={0.01}
                      decimalScale={2}
                      value={it.qtd ?? 1}
                      onChange={(val) => updateItem(it.id, 'qtd', typeof val === 'number' ? val : 1)}
                    />
                  </Table.Td>

                  <Table.Td>
                    <Select
                      size="xs"
                      value={it.unidade || 'UN'}
                      onChange={(val) => updateItem(it.id, 'unidade', val || 'UN')}
                      data={UNIDADES.map((u) => ({ value: u, label: u }))}
                    />
                  </Table.Td>

                  {process.fornecedores.map((f) => {
                    const price = it.precos ? it.precos[f.id] : undefined
                    const itemTotal = calcItemTotal(it, f.id)
                    return (
                      <Fragment key={f.id}>
                        <Table.Td>
                          <NumberInput
                            size="xs"
                            placeholder="0,00"
                            decimalScale={2}
                            value={price ?? undefined}
                            onChange={(val) =>
                              updateItemPrice(it.id, f.id, typeof val === 'number' ? val : null)
                            }
                          />
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'right', fontWeight: 600 }}>
                          <Text size="xs" fw={600}>
                            {formatMoney(itemTotal)}
                          </Text>
                        </Table.Td>
                      </Fragment>
                    )
                  })}

                  <Table.Td style={{ textAlign: 'center' }}>
                    {process.itens.length > 1 && (
                      <Tooltip label="Remover item">
                        <ActionIcon
                          size="xs"
                          color="red"
                          variant="subtle"
                          onClick={() => removeItem(it.id)}
                        >
                          <Trash2 size={14} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>

            <Table.Tfoot bg="var(--mantine-color-gray-1)">
              <Table.Tr>
                <Table.Td colSpan={4} fw={700} style={{ textAlign: 'right' }}>
                  Total dos Itens por Fornecedor (R$):
                </Table.Td>
                {process.fornecedores.map((f) => (
                  <Table.Td
                    key={f.id}
                    colSpan={2}
                    fw={800}
                    c="blue"
                    style={{ textAlign: 'right', paddingRight: '12px' }}
                  >
                    {formatMoney(grossMap[f.id] ?? 0)}
                  </Table.Td>
                ))}
                <Table.Td></Table.Td>
              </Table.Tr>
            </Table.Tfoot>
          </Table>
        </Table.ScrollContainer>
      </Stack>
    </Paper>
  )
}
