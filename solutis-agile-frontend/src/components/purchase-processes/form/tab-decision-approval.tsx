'use client'

import {
  Alert,
  Badge,
  Button,
  Divider,
  Grid,
  Group,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  Textarea,
  Title,
} from '@mantine/core'
import { modals } from '@mantine/modals'
import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react'

import {
  formatDateTime,
  formatMoney,
  maskCnpj,
  usePurchaseProcessCalculations,
} from '@/hooks/purchase-process/usePurchaseProcessCalculations'
import type { PurchaseProcess } from '@/types/PurchaseProcess'
import { MOTIVOS_COTACAO } from '@/types/PurchaseProcess'

interface TabDecisionApprovalProps {
  process: PurchaseProcess
  updateDecision: (field: keyof PurchaseProcess['decisao'], value: any) => void
  updateApproval: (field: keyof PurchaseProcess['aprovacao'], value: any) => void
  handleDecide: (decisionPayload: {
    status: string
    aprovadoPor?: string
    comentario?: string
  }) => void
  isDeciding: boolean
}

export function TabDecisionApproval({
  process,
  updateDecision,
  updateApproval,
  handleDecide,
  isDeciding,
}: TabDecisionApprovalProps) {
  const {
    filledSuppliers,
    lowest,
    ctaMap,
    selected,
  } = usePurchaseProcessCalculations(process)

  const d = process.decisao
  const apr = process.aprovacao

  const isNotLowest = Boolean(
    selected && lowest && selected.id !== lowest.id && Boolean(selected.nome?.trim())
  )
  const motivoInfo = MOTIVOS_COTACAO.find((m) => m.key === d.motivoKey)

  const openDecisionModal = (targetStatus: string, color: string) => {
    let userName = apr.aprovadoPor || ''
    let comment = apr.comentario || ''

    modals.openConfirmModal({
      title: `Registrar Decisão: ${targetStatus}`,
      children: (
        <Stack gap="sm" mt="xs">
          <Text size="sm">
            Confirme a alteração de status do processo para <strong>{targetStatus}</strong>.
          </Text>
          <Textarea
            label="Comentário da Decisão (Opcional)"
            placeholder="Registre justificativas ou orientações adicionais..."
            defaultValue={comment}
            onChange={(e) => {
              comment = e.currentTarget.value
            }}
          />
        </Stack>
      ),
      labels: { confirm: `Confirmar ${targetStatus}`, cancel: 'Cancelar' },
      confirmProps: { color },
      onConfirm: () => {
        handleDecide({
          status: targetStatus,
          aprovadoPor: userName,
          comentario: comment,
        })
      },
    })
  }

  return (
    <Stack gap="md">
      {/* Comparative Summary */}
      <Paper withBorder radius="md" p="lg">
        <Title order={4} mb="xs">
          Visão Comparativa dos Fornecedores
        </Title>
        <Text size="sm" c="dimmed" mb="md">
          Quadro resumido de propostas para tomada de decisão executiva.
        </Text>

        {filledSuppliers.length === 0 ? (
          <Text size="sm" c="dimmed">
            Nenhum fornecedor preenchido na etapa anterior.
          </Text>
        ) : (
          <Table.ScrollContainer minWidth={600}>
            <Table withTableBorder withColumnBorders verticalSpacing="sm">
              <Table.Thead bg="var(--mantine-color-gray-0)">
                <Table.Tr>
                  <Table.Th>Fornecedor</Table.Th>
                  <Table.Th>CNPJ</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>Custo Total (CTA)</Table.Th>
                  <Table.Th>Cond. Pagamento</Table.Th>
                  <Table.Th>Prazo de Entrega</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filledSuppliers.map((f) => {
                  const isWinner = lowest && lowest.id === f.id
                  return (
                    <Table.Tr key={f.id} bg={isWinner ? '#f6fbf7' : undefined}>
                      <Table.Td>
                        <Group gap={6}>
                          <Text size="sm" fw={600}>
                            {f.nome}
                          </Text>
                          {isWinner && (
                            <Badge color="green" size="xs" variant="filled">
                              Menor Custo
                            </Badge>
                          )}
                        </Group>
                      </Table.Td>
                      <Table.Td>{maskCnpj(f.cnpj) || '—'}</Table.Td>
                      <Table.Td style={{ textAlign: 'right', fontWeight: 700 }}>
                        {formatMoney(ctaMap[f.id] ?? 0)}
                      </Table.Td>
                      <Table.Td>{f.condPagamento || '—'}</Table.Td>
                      <Table.Td>{f.prazoEntrega || '—'}</Table.Td>
                    </Table.Tr>
                  )
                })}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Paper>

      {/* Decision & Justification */}
      <Paper withBorder radius="md" p="lg">
        <Stack gap="md">
          <Title order={4}>Recomendação e Justificativa de Compra</Title>

          <Grid gutter="md">
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Select
                label="Fornecedor Recomendado"
                placeholder="Selecione o fornecedor"
                value={d.fornecedorRecomendadoId || ''}
                onChange={(val) => updateDecision('fornecedorRecomendadoId', val || '')}
                data={filledSuppliers.map((f) => ({ value: f.id, label: f.nome }))}
                clearable
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Select
                label="Mínimo de Propostas Atingido?"
                value={d.minimoAtingido || 'sim'}
                onChange={(val) => updateDecision('minimoAtingido', val || 'sim')}
                data={[
                  { value: 'sim', label: 'Sim (3 ou mais cotações válidas)' },
                  { value: 'nao', label: 'Não (Cotação com exceção / dispensa)' },
                ]}
              />
            </Grid.Col>
          </Grid>

          {isNotLowest && (
            <Alert
              icon={<AlertCircle size={16} />}
              title="Atenção: Fornecedor Não é o de Menor Custo"
              color="orange"
              variant="light"
            >
              O fornecedor recomendado não apresenta o menor Custo Total de Aquisição (CTA). É obrigatório registrar a justificativa técnica ou comercial abaixo.
            </Alert>
          )}

          {(d.minimoAtingido === 'nao' || isNotLowest) && (
            <Select
              label="Motivo da Cotação Não Aplicável / Exceção (FO-AD-01)"
              description="Selecione o enquadramento conforme a política de compras"
              placeholder="Selecione o motivo padrão"
              value={d.motivoKey || ''}
              onChange={(val) => updateDecision('motivoKey', val || '')}
              data={MOTIVOS_COTACAO.map((m) => ({ value: m.key, label: m.label }))}
              clearable
            />
          )}

          <div>
            <Textarea
              label="Justificativa da Decisão / Exceção"
              placeholder={motivoInfo ? motivoInfo.texto : 'Justifique a recomendação da compra...'}
              minRows={3}
              value={d.justificativa || ''}
              onChange={(e) => updateDecision('justificativa', e.currentTarget.value)}
            />
            {motivoInfo && (
              <Button
                size="xs"
                variant="subtle"
                color="blue"
                mt={4}
                onClick={() => updateDecision('justificativa', motivoInfo.texto)}
              >
                Usar texto sugerido do motivo ({motivoInfo.label})
              </Button>
            )}
          </div>

          <Textarea
            label="Recomendação Final"
            placeholder="Descreva a recomendação formal de compra e seus fundamentos..."
            minRows={2}
            value={d.recomendacao || ''}
            onChange={(e) => updateDecision('recomendacao', e.currentTarget.value)}
          />

          <Textarea
            label="Observações / Ressalvas"
            placeholder="Observações complementares para a diretoria..."
            minRows={2}
            value={d.observacoes || ''}
            onChange={(e) => updateDecision('observacoes', e.currentTarget.value)}
          />
        </Stack>
      </Paper>

      {/* Approval Section */}
      <Paper withBorder radius="md" p="lg">
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <div>
              <Title order={4}>Aprovação Executiva</Title>
              <Text size="sm" c="dimmed">
                Registro formal de decisão e aprovação da contratação.
              </Text>
            </div>
            <Badge
              size="lg"
              variant="filled"
              color={
                apr.status === 'Aprovado'
                  ? 'green'
                  : apr.status === 'Reprovado'
                    ? 'red'
                    : apr.status === 'Em análise'
                      ? 'blue'
                      : 'yellow'
              }
            >
              Status: {apr.status}
            </Badge>
          </Group>

          {apr.aprovadoPor && (
            <Alert icon={<CheckCircle size={16} />} color="blue" variant="light">
              Decisão registrada por <strong>{apr.aprovadoPor}</strong> em{' '}
              {formatDateTime(apr.dataDecisao)}
              {apr.comentario && <Text size="xs" mt={4}>"{apr.comentario}"</Text>}
            </Alert>
          )}

          <Textarea
            label="Comentário Geral da Aprovação"
            placeholder="Comentário ou parecer da aprovação..."
            value={apr.comentario || ''}
            onChange={(e) => updateApproval('comentario', e.currentTarget.value)}
          />

          <Divider my="xs" />

          <Group justify="flex-end" gap="sm">
            <Button
              color="gray"
              variant="light"
              disabled={isDeciding}
              onClick={() => openDecisionModal('Dispensado', 'gray')}
            >
              Dispensar
            </Button>
            <Button
              color="blue"
              variant="light"
              disabled={isDeciding}
              leftSection={<Clock size={16} />}
              onClick={() => openDecisionModal('Em análise', 'blue')}
            >
              Marcar Em Análise
            </Button>
            <Button
              color="red"
              disabled={isDeciding}
              leftSection={<XCircle size={16} />}
              onClick={() => openDecisionModal('Reprovado', 'red')}
            >
              ✕ Reprovar
            </Button>
            <Button
              color="green"
              disabled={isDeciding}
              leftSection={<CheckCircle size={16} />}
              onClick={() => openDecisionModal('Aprovado', 'green')}
            >
              ✓ Aprovar Processo
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Stack>
  )
}
