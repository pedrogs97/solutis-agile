'use client'

import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Group,
  NumberInput,
  Paper,
  Stack,
  Table,
  Text,
  Textarea,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core'
import { AlertTriangle, Plus, Trash2 } from 'lucide-react'

import {
  formatMoney,
  maskCnpj,
  usePurchaseProcessCalculations,
} from '@/hooks/purchase-process/usePurchaseProcessCalculations'
import type { PurchaseProcess, PurchaseSupplier } from '@/types/PurchaseProcess'

interface TabSuppliersQuoteProps {
  process: PurchaseProcess
  updateSupplier: (supplierId: string, field: keyof PurchaseSupplier, value: any) => void
  addSupplier: () => void
  removeSupplier: (supplierId: string) => void
}

export function TabSuppliersQuote({
  process,
  updateSupplier,
  addSupplier,
  removeSupplier,
}: TabSuppliersQuoteProps) {
  const {
    filledSuppliers,
    lowest,
    ctaMap,
    grossMap,
    hasItems,
  } = usePurchaseProcessCalculations(process)

  const n = process.fornecedores.length
  const minCotacoes = 3
  const isUnderMin = filledSuppliers.length > 0 && filledSuppliers.length < minCotacoes

  return (
    <Paper withBorder radius="md" p="lg">
      <Stack gap="md">
        <Group justify="space-between" align="center" wrap="wrap">
          <div>
            <Title order={4}>2. Cotação de Fornecedores (Mapa Comparativo)</Title>
            <Text size="sm" c="dimmed">
              Preencha os dados comerciais de cada fornecedor lado a lado para comparar os custos totais (CTA).
            </Text>
          </div>

          <Button
            size="xs"
            variant="light"
            color="blue"
            leftSection={<Plus size={14} />}
            onClick={addSupplier}
            disabled={n >= 5}
          >
            Adicionar Fornecedor ({n}/5)
          </Button>
        </Group>

        {isUnderMin && (
          <Alert
            icon={<AlertTriangle size={16} />}
            title="Atenção: Mínimo de Cotações"
            color="yellow"
            variant="light"
          >
            Apenas {filledSuppliers.length} fornecedor(es) preenchido(s). A prática usual da Solutis requer no mínimo {minCotacoes} cotações. Se não for possível obter 3 propostas, justifique na etapa de Decisão & Aprovação.
          </Alert>
        )}

        <Table.ScrollContainer minWidth={650}>
          <Table withTableBorder withColumnBorders verticalSpacing="xs">
            <Table.Thead bg="var(--mantine-color-gray-0)">
              <Table.Tr>
                <Table.Th style={{ width: 230, minWidth: 200 }}>Critério / Campo</Table.Th>
                {process.fornecedores.map((f, idx) => {
                  const isWinner = lowest && lowest.id === f.id && Boolean(f.nome?.trim())
                  return (
                    <Table.Th key={f.id} style={{ minWidth: 220 }}>
                      <Group justify="space-between" align="center">
                        <Group gap={6}>
                          <Text size="sm" fw={700}>
                            Fornecedor {idx + 1}
                          </Text>
                          {isWinner && (
                            <Badge color="green" size="xs" variant="filled">
                              Menor Custo
                            </Badge>
                          )}
                        </Group>
                        {n > 1 && (
                          <Tooltip label="Remover fornecedor">
                            <ActionIcon
                              size="xs"
                              color="red"
                              variant="subtle"
                              onClick={() => removeSupplier(f.id)}
                            >
                              <Trash2 size={14} />
                            </ActionIcon>
                          </Tooltip>
                        )}
                      </Group>
                    </Table.Th>
                  )
                })}
              </Table.Tr>
            </Table.Thead>

            <Table.Tbody>
              {/* Razão Social */}
              <Table.Tr>
                <Table.Td fw={600}>Razão Social / Nome</Table.Td>
                {process.fornecedores.map((f) => (
                  <Table.Td key={f.id}>
                    <TextInput
                      size="xs"
                      placeholder="Nome do fornecedor"
                      value={f.nome || ''}
                      onChange={(e) => updateSupplier(f.id, 'nome', e.currentTarget.value)}
                    />
                  </Table.Td>
                ))}
              </Table.Tr>

              {/* CNPJ */}
              <Table.Tr>
                <Table.Td fw={600}>CNPJ</Table.Td>
                {process.fornecedores.map((f) => (
                  <Table.Td key={f.id}>
                    <TextInput
                      size="xs"
                      placeholder="00.000.000/0000-00"
                      value={maskCnpj(f.cnpj)}
                      onChange={(e) => updateSupplier(f.id, 'cnpj', e.currentTarget.value)}
                    />
                  </Table.Td>
                ))}
              </Table.Tr>

              {/* Valor Bruto dos Itens */}
              <Table.Tr>
                <Table.Td fw={600}>
                  Valor Bruto dos Itens (R$)
                  {hasItems && (
                    <Text size="xs" c="dimmed" fw={400}>
                      (Calculado na Aba 3)
                    </Text>
                  )}
                </Table.Td>
                {process.fornecedores.map((f) => (
                  <Table.Td key={f.id}>
                    {hasItems ? (
                      <TextInput
                        size="xs"
                        readOnly
                        value={formatMoney(grossMap[f.id] ?? 0)}
                        styles={{ input: { fontWeight: 600, background: 'var(--mantine-color-gray-1)' } }}
                      />
                    ) : (
                      <NumberInput
                        size="xs"
                        placeholder="0,00"
                        decimalScale={2}
                        fixedDecimalScale
                        prefix="R$ "
                        value={f.valorBrutoManual ?? undefined}
                        onChange={(val) => updateSupplier(f.id, 'valorBrutoManual', val)}
                      />
                    )}
                  </Table.Td>
                ))}
              </Table.Tr>

              {/* Desconto */}
              <Table.Tr>
                <Table.Td>Desconto (R$)</Table.Td>
                {process.fornecedores.map((f) => (
                  <Table.Td key={f.id}>
                    <NumberInput
                      size="xs"
                      placeholder="0,00"
                      decimalScale={2}
                      prefix="R$ "
                      value={f.desconto ?? 0}
                      onChange={(val) => updateSupplier(f.id, 'desconto', typeof val === 'number' ? val : 0)}
                    />
                  </Table.Td>
                ))}
              </Table.Tr>

              {/* Impostos / Acréscimos */}
              <Table.Tr>
                <Table.Td>Impostos / Acréscimos (R$)</Table.Td>
                {process.fornecedores.map((f) => (
                  <Table.Td key={f.id}>
                    <NumberInput
                      size="xs"
                      placeholder="0,00"
                      decimalScale={2}
                      prefix="R$ "
                      value={f.impostos ?? 0}
                      onChange={(val) => updateSupplier(f.id, 'impostos', typeof val === 'number' ? val : 0)}
                    />
                  </Table.Td>
                ))}
              </Table.Tr>

              {/* Frete */}
              <Table.Tr>
                <Table.Td>Frete (R$)</Table.Td>
                {process.fornecedores.map((f) => (
                  <Table.Td key={f.id}>
                    <NumberInput
                      size="xs"
                      placeholder="0,00"
                      decimalScale={2}
                      prefix="R$ "
                      value={f.frete ?? 0}
                      onChange={(val) => updateSupplier(f.id, 'frete', typeof val === 'number' ? val : 0)}
                    />
                  </Table.Td>
                ))}
              </Table.Tr>

              {/* Outros Custos */}
              <Table.Tr>
                <Table.Td>Outros Custos (R$)</Table.Td>
                {process.fornecedores.map((f) => (
                  <Table.Td key={f.id}>
                    <NumberInput
                      size="xs"
                      placeholder="0,00"
                      decimalScale={2}
                      prefix="R$ "
                      value={f.outros ?? 0}
                      onChange={(val) => updateSupplier(f.id, 'outros', typeof val === 'number' ? val : 0)}
                    />
                  </Table.Td>
                ))}
              </Table.Tr>

              {/* CUSTO TOTAL DA AQUISIÇÃO (CTA) */}
              <Table.Tr style={{ background: 'var(--mantine-color-gray-1)' }}>
                <Table.Td fw={700} c="blue">
                  CUSTO TOTAL DE AQUISIÇÃO (CTA)
                </Table.Td>
                {process.fornecedores.map((f) => {
                  const isWinner = lowest && lowest.id === f.id && Boolean(f.nome?.trim())
                  return (
                    <Table.Td key={f.id}>
                      <Paper
                        p="xs"
                        radius="sm"
                        withBorder
                        style={{
                          background: isWinner ? '#ebfbee' : '#fff',
                          borderColor: isWinner ? '#40c057' : 'var(--mantine-color-gray-3)',
                          textAlign: 'center',
                        }}
                      >
                        <Text size="sm" fw={800} c={isWinner ? 'green' : 'dark'}>
                          {formatMoney(ctaMap[f.id] ?? 0)}
                        </Text>
                      </Paper>
                    </Table.Td>
                  )
                })}
              </Table.Tr>

              {/* Valor Orçado */}
              <Table.Tr>
                <Table.Td>Valor Orçado (R$)</Table.Td>
                {process.fornecedores.map((f) => (
                  <Table.Td key={f.id}>
                    <NumberInput
                      size="xs"
                      placeholder="0,00"
                      decimalScale={2}
                      prefix="R$ "
                      value={f.orcado ?? undefined}
                      onChange={(val) => updateSupplier(f.id, 'orcado', typeof val === 'number' ? val : null)}
                    />
                  </Table.Td>
                ))}
              </Table.Tr>

              {/* Condição de Pagamento */}
              <Table.Tr>
                <Table.Td>Condição de Pagamento</Table.Td>
                {process.fornecedores.map((f) => (
                  <Table.Td key={f.id}>
                    <TextInput
                      size="xs"
                      placeholder="Ex.: 30 dias / 30/60 dias"
                      value={f.condPagamento || ''}
                      onChange={(e) => updateSupplier(f.id, 'condPagamento', e.currentTarget.value)}
                    />
                  </Table.Td>
                ))}
              </Table.Tr>

              {/* Prazo de Entrega */}
              <Table.Tr>
                <Table.Td>Prazo de Entrega / Execução</Table.Td>
                {process.fornecedores.map((f) => (
                  <Table.Td key={f.id}>
                    <TextInput
                      size="xs"
                      placeholder="Ex.: 5 dias úteis"
                      value={f.prazoEntrega || ''}
                      onChange={(e) => updateSupplier(f.id, 'prazoEntrega', e.currentTarget.value)}
                    />
                  </Table.Td>
                ))}
              </Table.Tr>

              {/* Validade da Proposta */}
              <Table.Tr>
                <Table.Td>Validade da Proposta</Table.Td>
                {process.fornecedores.map((f) => (
                  <Table.Td key={f.id}>
                    <TextInput
                      size="xs"
                      placeholder="Ex.: 15 dias"
                      value={f.validadeProposta || ''}
                      onChange={(e) => updateSupplier(f.id, 'validadeProposta', e.currentTarget.value)}
                    />
                  </Table.Td>
                ))}
              </Table.Tr>

              {/* Garantia */}
              <Table.Tr>
                <Table.Td>Garantia</Table.Td>
                {process.fornecedores.map((f) => (
                  <Table.Td key={f.id}>
                    <TextInput
                      size="xs"
                      placeholder="Ex.: 12 meses"
                      value={f.garantia || ''}
                      onChange={(e) => updateSupplier(f.id, 'garantia', e.currentTarget.value)}
                    />
                  </Table.Td>
                ))}
              </Table.Tr>

              {/* Observações Comerciais */}
              <Table.Tr>
                <Table.Td>Observações Comerciais</Table.Td>
                {process.fornecedores.map((f) => (
                  <Table.Td key={f.id}>
                    <Textarea
                      size="xs"
                      placeholder="Ressalvas ou notas..."
                      minRows={2}
                      value={f.obs || ''}
                      onChange={(e) => updateSupplier(f.id, 'obs', e.currentTarget.value)}
                    />
                  </Table.Td>
                ))}
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Stack>
    </Paper>
  )
}
