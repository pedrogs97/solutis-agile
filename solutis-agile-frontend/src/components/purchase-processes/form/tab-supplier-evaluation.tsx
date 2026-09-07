'use client'

import {
  Badge,
  Card,
  Checkbox,
  Grid,
  Group,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core'
import { CheckCircle2, XCircle } from 'lucide-react'

import {
  maskCnpj,
  usePurchaseProcessCalculations,
} from '@/hooks/purchase-process/usePurchaseProcessCalculations'
import type { PurchaseProcess } from '@/types/PurchaseProcess'
import { CRITERIOS_AVALIACAO, NIVEIS_SATISFACAO } from '@/types/PurchaseProcess'

interface TabSupplierEvaluationProps {
  process: PurchaseProcess
  updateEvaluation: (field: keyof PurchaseProcess['avaliacao'], value: any) => void
  updateEvaluationCriterion: (
    critKey: string,
    field: 'status' | 'nivel' | 'obs',
    value: any
  ) => void
}

export function TabSupplierEvaluation({
  process,
  updateEvaluation,
  updateEvaluationCriterion,
}: TabSupplierEvaluationProps) {
  const { evaluationIndex, performanceClassification } =
    usePurchaseProcessCalculations(process)
  const a = process.avaliacao
  const isAprovado = evaluationIndex != null && evaluationIndex >= 0.8

  const getClassifColor = (cl?: string | null) => {
    switch (cl) {
      case 'Excelente':
        return 'teal'
      case 'Satisfatório':
        return 'blue'
      case 'Atenção':
        return 'yellow'
      case 'Insatisfatório':
        return 'red'
      default:
        return 'gray'
    }
  }

  return (
    <Stack gap="md">
      <Paper withBorder radius="md" p="lg">
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <div>
              <Title order={4}>5. Avaliação de Fornecedor (Pós-Compra)</Title>
              <Text size="sm" c="dimmed">
                Preenchida após a aprovação e entrega para registrar o histórico de desempenho do fornecedor.
              </Text>
            </div>
            <Checkbox
              label="Avaliação preenchida e concluída"
              checked={a.preenchida}
              onChange={(e) => updateEvaluation('preenchida', e.currentTarget.checked)}
            />
          </Group>

          <Grid gutter="md">
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Razão Social do Fornecedor"
                placeholder="Razão Social"
                value={a.razaoSocial || ''}
                onChange={(e) => updateEvaluation('razaoSocial', e.currentTarget.value)}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="CNPJ"
                placeholder="00.000.000/0000-00"
                value={maskCnpj(a.cnpj)}
                onChange={(e) => updateEvaluation('cnpj', e.currentTarget.value)}
              />
            </Grid.Col>
          </Grid>

          <Textarea
            label="Descritivo da Compra"
            placeholder="Resumo do item ou serviço contratado..."
            minRows={2}
            value={a.descritivoCompra || ''}
            onChange={(e) => updateEvaluation('descritivoCompra', e.currentTarget.value)}
          />

          <Grid gutter="md">
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Nº da Nota Fiscal"
                placeholder="Ex.: 12345"
                value={a.nfNumero || ''}
                onChange={(e) => updateEvaluation('nfNumero', e.currentTarget.value)}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Data da Compra"
                type="date"
                value={a.dataCompra || ''}
                onChange={(e) => updateEvaluation('dataCompra', e.currentTarget.value)}
              />
            </Grid.Col>
          </Grid>
        </Stack>
      </Paper>

      {/* Quesitos de Avaliação */}
      <Paper withBorder radius="md" p="lg">
        <Stack gap="md">
          <Title order={4}>Quesitos e Índice de Satisfação</Title>
          <Text size="sm" c="dimmed">
            Avalie cada um dos 6 quesitos de fornecimento.
          </Text>

          <Stack gap="xs">
            {CRITERIOS_AVALIACAO.map((c) => {
              const cur = a.criterios[c.key] || {}
              const scoreInfo = NIVEIS_SATISFACAO.find((n) => n.label === cur.nivel)

              return (
                <Card key={c.key} withBorder radius="sm" p="sm">
                  <Grid align="center" gutter="sm">
                    <Grid.Col span={{ base: 12, md: 5 }}>
                      <Text size="sm" fw={600}>
                        {c.num}. {c.label}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {c.pergunta}
                      </Text>
                    </Grid.Col>

                    <Grid.Col span={{ base: 6, md: 3 }}>
                      <Select
                        size="xs"
                        label="Atendimento"
                        placeholder="Status"
                        value={cur.status || ''}
                        onChange={(val) =>
                          updateEvaluationCriterion(c.key, 'status', val || '')
                        }
                        data={[
                          { value: 'Sim', label: 'Sim' },
                          { value: 'Não', label: 'Não' },
                          { value: 'Razoável', label: 'Razoável' },
                        ]}
                        clearable
                      />
                    </Grid.Col>

                    <Grid.Col span={{ base: 6, md: 3 }}>
                      <Select
                        size="xs"
                        label="Nível de Satisfação"
                        placeholder="Selecione"
                        value={cur.nivel || ''}
                        onChange={(val) =>
                          updateEvaluationCriterion(c.key, 'nivel', val || '')
                        }
                        data={NIVEIS_SATISFACAO.map((n) => ({
                          value: n.label,
                          label: `${n.label} (${n.valor * 100}%)`,
                        }))}
                        clearable
                      />
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, md: 1 }} style={{ textAlign: 'right' }}>
                      <Badge
                        size="md"
                        variant="light"
                        color={scoreInfo ? 'blue' : 'gray'}
                      >
                        {scoreInfo ? `${(scoreInfo.valor * 100).toFixed(0)}%` : '—'}
                      </Badge>
                    </Grid.Col>
                  </Grid>
                </Card>
              )
            })}
          </Stack>
        </Stack>
      </Paper>

      {/* Resultados Consolidados */}
      <Paper withBorder radius="md" p="lg">
        <Stack gap="md">
          <Title order={4}>Resultado da Avaliação</Title>

          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
            <Card withBorder radius="md" p="md" style={{ textAlign: 'center' }}>
              <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                Índice Geral de Satisfação
              </Text>
              <Title order={2} mt="xs" c="blue">
                {evaluationIndex != null
                  ? `${(evaluationIndex * 100).toFixed(1)}%`
                  : '—'}
              </Title>
              <Text size="xs" c="dimmed">
                Média dos 6 critérios
              </Text>
            </Card>

            <Card withBorder radius="md" p="md" style={{ textAlign: 'center' }}>
              <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                Resultado (Corte 80%)
              </Text>
              <Group justify="center" gap={6} mt="xs">
                {evaluationIndex != null ? (
                  isAprovado ? (
                    <>
                      <CheckCircle2 color="#2b8a3e" size={28} />
                      <Title order={2} c="green">
                        Aprovado
                      </Title>
                    </>
                  ) : (
                    <>
                      <XCircle color="#fa5252" size={28} />
                      <Title order={2} c="red">
                        Reprovado
                      </Title>
                    </>
                  )
                ) : (
                  <Title order={2} c="dimmed">
                    —
                  </Title>
                )}
              </Group>
              <Text size="xs" c="dimmed">
                Mínimo de 80% para aprovação
              </Text>
            </Card>

            <Card withBorder radius="md" p="md" style={{ textAlign: 'center' }}>
              <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                Classificação de Desempenho
              </Text>
              <Badge
                mt="sm"
                size="xl"
                variant="filled"
                color={getClassifColor(performanceClassification)}
              >
                {performanceClassification || 'Não Avaliado'}
              </Badge>
              <Text size="xs" c="dimmed" mt={8}>
                Excelente / Satisfatório / Atenção / Insatisfatório
              </Text>
            </Card>
          </SimpleGrid>

          <Grid gutter="md" mt="sm">
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Nome do Avaliador"
                placeholder="Nome do responsável pela avaliação"
                value={a.avaliador || ''}
                onChange={(e) => updateEvaluation('avaliador', e.currentTarget.value)}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Data da Avaliação"
                type="date"
                value={a.dataAvaliacao || ''}
                onChange={(e) => updateEvaluation('dataAvaliacao', e.currentTarget.value)}
              />
            </Grid.Col>
          </Grid>
        </Stack>
      </Paper>
    </Stack>
  )
}
