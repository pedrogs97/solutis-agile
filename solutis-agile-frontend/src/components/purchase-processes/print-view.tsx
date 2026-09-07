'use client'

import {
  Badge,
  Divider,
  Paper,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core'

import {
  calcItemTotal,
  formatDate,
  formatDateTime,
  formatMoney,
  maskCnpj,
  usePurchaseProcessCalculations,
} from '@/hooks/purchase-process/usePurchaseProcessCalculations'
import type { PurchaseProcess } from '@/types/PurchaseProcess'
import { CRITERIOS_AVALIACAO, NIVEIS_SATISFACAO } from '@/types/PurchaseProcess'

interface PrintViewProps {
  process: PurchaseProcess
}

export function PrintView({ process }: PrintViewProps) {
  const {
    filledSuppliers,
    lowest,
    ctaMap,
    grossMap,
    evaluationIndex,
    performanceClassification,
    hasItems,
  } = usePurchaseProcessCalculations(process)

  const i = process.identificacao
  const d = process.decisao
  const apr = process.aprovacao
  const a = process.avaliacao

  return (
    <div id="print-content" style={{ display: 'none' }}>
      <Paper p="xl">
        <Stack gap="lg">
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #333', paddingBottom: '12px' }}>
            <div>
              <Title order={2}>FORMULÁRIO DE ANÁLISE E DECISÃO DE COMPRAS</Title>
              <Text size="sm" c="dimmed">FO-AD-01 — Solutis Tecnologias</Text>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Badge size="lg" variant="outline">Status: {apr.status}</Badge>
              <Text size="xs" mt={4}>Emitido em: {new Date().toLocaleDateString('pt-BR')}</Text>
            </div>
          </div>

          {/* 1. Identificação */}
          <div>
            <Title order={4} mb="xs">1. Identificação da Contratação</Title>
            <Table withTableBorder withColumnBorders verticalSpacing="xs">
              <Table.Tbody>
                <Table.Tr>
                  <Table.Td fw={600} style={{ width: 180 }}>Data da Solicitação:</Table.Td>
                  <Table.Td>{formatDate(i.data)}</Table.Td>
                  <Table.Td fw={600} style={{ width: 180 }}>Categoria:</Table.Td>
                  <Table.Td>{i.categoria}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td fw={600}>Modalidade:</Table.Td>
                  <Table.Td>{i.modalidade}</Table.Td>
                  <Table.Td fw={600}>Centro de Custo:</Table.Td>
                  <Table.Td>{i.centroCusto || '—'}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td fw={600}>Tipo de Contratação:</Table.Td>
                  <Table.Td>{i.tipoContratacao}</Table.Td>
                  <Table.Td fw={600}>Nível de Risco:</Table.Td>
                  <Table.Td>{i.risco}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td fw={600}>Solicitante:</Table.Td>
                  <Table.Td>{i.solicitante}</Table.Td>
                  <Table.Td fw={600}>Comprador Responsável:</Table.Td>
                  <Table.Td>{i.compradorResponsavel}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td fw={600}>Objeto:</Table.Td>
                  <Table.Td colSpan={3}>{i.objeto}</Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>
          </div>

          {/* 2. Mapa Comparativo de Cotações */}
          <div>
            <Title order={4} mb="xs">2. Mapa Comparativo de Cotações</Title>
            <Table withTableBorder withColumnBorders verticalSpacing="xs">
              <Table.Thead bg="#f8f9fa">
                <Table.Tr>
                  <Table.Th style={{ width: 220 }}>Critério</Table.Th>
                  {process.fornecedores.map((f, idx) => (
                    <Table.Th key={f.id} style={{ textAlign: 'center' }}>
                      {f.nome || `Fornecedor ${idx + 1}`}
                      {lowest && lowest.id === f.id && Boolean(f.nome?.trim()) && ' (Menor CTA)'}
                    </Table.Th>
                  ))}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                <Table.Tr>
                  <Table.Td fw={600}>CNPJ</Table.Td>
                  {process.fornecedores.map((f) => (
                    <Table.Td key={f.id} style={{ textAlign: 'center' }}>{maskCnpj(f.cnpj) || '—'}</Table.Td>
                  ))}
                </Table.Tr>
                <Table.Tr>
                  <Table.Td fw={600}>Valor Bruto (R$)</Table.Td>
                  {process.fornecedores.map((f) => (
                    <Table.Td key={f.id} style={{ textAlign: 'right' }}>{formatMoney(grossMap[f.id] ?? 0)}</Table.Td>
                  ))}
                </Table.Tr>
                <Table.Tr>
                  <Table.Td>Desconto (R$)</Table.Td>
                  {process.fornecedores.map((f) => (
                    <Table.Td key={f.id} style={{ textAlign: 'right' }}>{formatMoney(f.desconto)}</Table.Td>
                  ))}
                </Table.Tr>
                <Table.Tr>
                  <Table.Td>Impostos / Acréscimos (R$)</Table.Td>
                  {process.fornecedores.map((f) => (
                    <Table.Td key={f.id} style={{ textAlign: 'right' }}>{formatMoney(f.impostos)}</Table.Td>
                  ))}
                </Table.Tr>
                <Table.Tr>
                  <Table.Td>Frete (R$)</Table.Td>
                  {process.fornecedores.map((f) => (
                    <Table.Td key={f.id} style={{ textAlign: 'right' }}>{formatMoney(f.frete)}</Table.Td>
                  ))}
                </Table.Tr>
                <Table.Tr>
                  <Table.Td>Outros Custos (R$)</Table.Td>
                  {process.fornecedores.map((f) => (
                    <Table.Td key={f.id} style={{ textAlign: 'right' }}>{formatMoney(f.outros)}</Table.Td>
                  ))}
                </Table.Tr>
                <Table.Tr style={{ background: '#f1f3f5' }}>
                  <Table.Td fw={700}>CUSTO TOTAL DE AQUISIÇÃO (CTA)</Table.Td>
                  {process.fornecedores.map((f) => (
                    <Table.Td key={f.id} style={{ textAlign: 'right', fontWeight: 800 }}>
                      {formatMoney(ctaMap[f.id] ?? 0)}
                    </Table.Td>
                  ))}
                </Table.Tr>
                <Table.Tr>
                  <Table.Td>Condição de Pagamento</Table.Td>
                  {process.fornecedores.map((f) => (
                    <Table.Td key={f.id}>{f.condPagamento || '—'}</Table.Td>
                  ))}
                </Table.Tr>
                <Table.Tr>
                  <Table.Td>Prazo de Entrega</Table.Td>
                  {process.fornecedores.map((f) => (
                    <Table.Td key={f.id}>{f.prazoEntrega || '—'}</Table.Td>
                  ))}
                </Table.Tr>
                <Table.Tr>
                  <Table.Td>Garantia</Table.Td>
                  {process.fornecedores.map((f) => (
                    <Table.Td key={f.id}>{f.garantia || '—'}</Table.Td>
                  ))}
                </Table.Tr>
              </Table.Tbody>
            </Table>
          </div>

          {/* 3. Detalhamento dos Itens (se houver) */}
          {hasItems && (
            <div>
              <Title order={4} mb="xs">3. Detalhamento dos Itens Cotados</Title>
              <Table withTableBorder withColumnBorders verticalSpacing="xs">
                <Table.Thead bg="#f8f9fa">
                  <Table.Tr>
                    <Table.Th style={{ width: 40 }}>#</Table.Th>
                    <Table.Th>Descrição</Table.Th>
                    <Table.Th style={{ width: 60 }}>Qtd.</Table.Th>
                    <Table.Th style={{ width: 60 }}>Unid.</Table.Th>
                    {process.fornecedores.map((f) => (
                      <Table.Th key={f.id} style={{ textAlign: 'right' }}>
                        {f.nome || 'Fornecedor'}
                      </Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {process.itens.map((it, idx) => (
                    <Table.Tr key={it.id}>
                      <Table.Td>{idx + 1}</Table.Td>
                      <Table.Td>{it.descricao}</Table.Td>
                      <Table.Td>{it.qtd}</Table.Td>
                      <Table.Td>{it.unidade}</Table.Td>
                      {process.fornecedores.map((f) => (
                        <Table.Td key={f.id} style={{ textAlign: 'right' }}>
                          {formatMoney(calcItemTotal(it, f.id))}
                        </Table.Td>
                      ))}
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>
          )}

          {/* 4. Decisão & Aprovação */}
          <div>
            <Title order={4} mb="xs">4. Decisão e Parecer de Aprovação</Title>
            <Table withTableBorder withColumnBorders verticalSpacing="xs">
              <Table.Tbody>
                <Table.Tr>
                  <Table.Td fw={600} style={{ width: 220 }}>Fornecedor Recomendado:</Table.Td>
                  <Table.Td>{filledSuppliers.find((f) => f.id === d.fornecedorRecomendadoId)?.nome || '—'}</Table.Td>
                  <Table.Td fw={600} style={{ width: 220 }}>Mínimo de Propostas Atingido:</Table.Td>
                  <Table.Td>{d.minimoAtingido === 'sim' ? 'Sim' : 'Não (Exceção/Dispensa)'}</Table.Td>
                </Table.Tr>
                {d.justificativa && (
                  <Table.Tr>
                    <Table.Td fw={600}>Justificativa:</Table.Td>
                    <Table.Td colSpan={3}>{d.justificativa}</Table.Td>
                  </Table.Tr>
                )}
                <Table.Tr>
                  <Table.Td fw={600}>Recomendação Final:</Table.Td>
                  <Table.Td colSpan={3}>{d.recomendacao || '—'}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td fw={600}>Decisão Executiva:</Table.Td>
                  <Table.Td>{apr.status}</Table.Td>
                  <Table.Td fw={600}>Aprovado por / Data:</Table.Td>
                  <Table.Td>{apr.aprovadoPor ? `${apr.aprovadoPor} em ${formatDateTime(apr.dataDecisao)}` : '—'}</Table.Td>
                </Table.Tr>
                {apr.comentario && (
                  <Table.Tr>
                    <Table.Td fw={600}>Comentário da Decisão:</Table.Td>
                    <Table.Td colSpan={3}>{apr.comentario}</Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </div>

          {/* 5. Avaliação do Fornecedor (se preenchida) */}
          {a.preenchida && (
            <div>
              <Title order={4} mb="xs">5. Avaliação do Fornecedor</Title>
              <Table withTableBorder withColumnBorders verticalSpacing="xs">
                <Table.Tbody>
                  <Table.Tr>
                    <Table.Td fw={600} style={{ width: 180 }}>Fornecedor Avaliado:</Table.Td>
                    <Table.Td>{a.razaoSocial} ({maskCnpj(a.cnpj)})</Table.Td>
                    <Table.Td fw={600} style={{ width: 180 }}>Nota Fiscal / Data:</Table.Td>
                    <Table.Td>NF {a.nfNumero || '—'} / {formatDate(a.dataCompra)}</Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td fw={600}>Índice Geral:</Table.Td>
                    <Table.Td>{evaluationIndex != null ? `${(evaluationIndex * 100).toFixed(1)}%` : '—'}</Table.Td>
                    <Table.Td fw={600}>Classificação:</Table.Td>
                    <Table.Td>{performanceClassification || '—'}</Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td fw={600}>Avaliador / Data:</Table.Td>
                    <Table.Td colSpan={3}>{a.avaliador || '—'} em {formatDate(a.dataAvaliacao)}</Table.Td>
                  </Table.Tr>
                </Table.Tbody>
              </Table>
            </div>
          )}

          {/* Signatures */}
          <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-around' }}>
            <div style={{ textAlign: 'center', width: '260px', borderTop: '1px solid #333', paddingTop: '8px' }}>
              <Text size="xs" fw={600}>{i.compradorResponsavel || 'Comprador Responsável'}</Text>
              <Text size="xs" c="dimmed">Área de Compras</Text>
            </div>
            <div style={{ textAlign: 'center', width: '260px', borderTop: '1px solid #333', paddingTop: '8px' }}>
              <Text size="xs" fw={600}>{apr.aprovadoPor || 'Aprovador / Gestor'}</Text>
              <Text size="xs" c="dimmed">Diretoria / Gestão</Text>
            </div>
          </div>
        </Stack>
      </Paper>
    </div>
  )
}
