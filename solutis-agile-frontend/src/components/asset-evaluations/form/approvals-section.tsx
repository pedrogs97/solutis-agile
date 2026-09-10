'use client'

import type React from 'react'
import {
  Badge,
  Button,
  Card,
  Grid,
  Group,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { modals } from '@mantine/modals'
import {
  Calendar,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
} from 'lucide-react'
import { Controller, type UseFormReturn } from 'react-hook-form'

import type {
  AssetEvaluationFormValues,
  AssetTechnicalEvaluation,
} from '@/types/AssetEvaluation'

interface ApprovalsSectionProps {
  form: UseFormReturn<AssetEvaluationFormValues>
  existingEvaluation?: AssetTechnicalEvaluation | null
  onApprove?: (comments?: string, writeOff?: boolean) => void
  isApproving?: boolean
  readOnly?: boolean
}

function parseDateValue(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === 'string') {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

function formatDateDisplay(value: unknown): string {
  const d = parseDateValue(value)
  if (!d) return '-'
  return d.toLocaleDateString('pt-BR')
}

export function ApprovalsSection({
  form,
  existingEvaluation,
  onApprove,
  isApproving = false,
  readOnly = false,
}: Readonly<ApprovalsSectionProps>) {
  const { control, watch, setValue } = form

  const currentStatus = watch('status') || existingEvaluation?.status || 'Rascunho'
  const watchedApproverName = watch('approver_name') || existingEvaluation?.approver_name
  const watchedApprovalDate = watch('approval_date') || existingEvaluation?.approval_date
  const watchedComments = watch('approval_comments') || existingEvaluation?.approval_comments

  const isApprovedOrWrittenOff =
    currentStatus === 'Aprovado' ||
    currentStatus === 'Baixado' ||
    existingEvaluation?.status === 'Aprovado' ||
    existingEvaluation?.status === 'Baixado'

  const handleOpenApproveModal = () => {
    let approvalComments = watchedComments || ''

    modals.openConfirmModal({
      title: 'Aprovação Formal e Baixa de Patrimônio',
      children: (
        <Stack gap="sm">
          <Text size="sm">
            Confirma a aprovação técnica e a efetivação da <b>baixa do ativo</b> no sistema?
          </Text>
          <Text size="xs" c="dimmed">
            O ativo vinculado terá o status atualizado para <b>DESCARTE (8)</b> e será desativado (`active = false`).
          </Text>
          <Textarea
            label="Parecer / Observações do Aprovador"
            placeholder="Comentários da aprovação..."
            defaultValue={approvalComments}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
              approvalComments = e.currentTarget.value
            }}
          />
        </Stack>
      ),
      labels: { confirm: 'Confirmar Baixa & Aprovação', cancel: 'Cancelar' },
      confirmProps: { color: 'green' },
      onConfirm: () => {
        setValue('status', 'Baixado')
        setValue('approval_comments', approvalComments)
        setValue('approval_date', new Date().toISOString())
        if (onApprove) {
          onApprove(approvalComments, true)
        }
      },
    })
  }

  const renderStatusBadge = () => {
    switch (currentStatus) {
      case 'Baixado':
        return (
          <Badge color="teal" size="lg" leftSection={<CheckCircle2 size={16} />}>
            Baixado em Sistema
          </Badge>
        )
      case 'Aprovado':
        return (
          <Badge color="green" size="lg" leftSection={<CheckCircle2 size={16} />}>
            Aprovado
          </Badge>
        )
      case 'Em Análise':
        return (
          <Badge color="orange" size="lg" leftSection={<Clock size={16} />}>
            Em Análise
          </Badge>
        )
      case 'Rejeitado':
        return (
          <Badge color="red" size="lg" leftSection={<ShieldAlert size={16} />}>
            Rejeitado
          </Badge>
        )
      default:
        return (
          <Badge color="blue" size="lg" variant="light">
            Rascunho
          </Badge>
        )
    }
  }

  return (
    <Card shadow="xs" radius="md" p="lg" withBorder>
      <Group justify="space-between" mb="md">
        <Group gap="sm">
          <Badge size="lg" circle variant="light" color="blue">
            8
          </Badge>
          <div>
            <Title order={4}>Validação & Aprovação Formal</Title>
            <Text size="xs" c="dimmed">
              Fluxo de aprovações, pareceres e efetivação da baixa patrimonial
            </Text>
          </div>
        </Group>

        <Group gap="xs">
          {renderStatusBadge()}
          {isApprovedOrWrittenOff && watchedApproverName && (
            <Badge color="gray" size="lg" variant="outline">
              Por: {watchedApproverName}
            </Badge>
          )}
        </Group>
      </Group>

      <Grid gutter="md">
        {/* Card 1: Avaliador Técnico */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper
            p="md"
            radius="md"
            withBorder
            bg="light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))"
          >
            <Group gap="xs" mb="xs">
              <UserCheck size={18} color="var(--mantine-color-blue-6)" />
              <div>
                <Text size="sm" fw={700}>
                  Avaliador Técnico
                </Text>
                <Text size="xs" c="dimmed">
                  Responsável pelo laudo e pesagem
                </Text>
              </div>
            </Group>

            <Stack gap="xs" mt="sm">
              <Controller
                control={control}
                name="evaluator_name"
                render={({ field }) => (
                  <TextInput
                    label="Nome do Avaliador"
                    placeholder="Nome completo do avaliador"
                    disabled={readOnly}
                    {...field}
                    value={field.value || ''}
                  />
                )}
              />

              <Controller
                control={control}
                name="evaluation_date"
                render={({ field }) => (
                  <DateInput
                    label="Data da Avaliação"
                    placeholder="dd/mm/aaaa"
                    valueFormat="DD/MM/YYYY"
                    rightSection={<Calendar size={16} color="var(--mantine-color-gray-6)" />}
                    clearable
                    disabled={readOnly}
                    value={parseDateValue(field.value)}
                    onChange={(val: Date | null) =>
                      field.onChange(val ? val.toISOString() : null)
                    }
                  />
                )}
              />
            </Stack>
          </Paper>
        </Grid.Col>

        {/* Card 2: Gestão Patrimonial */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper
            p="md"
            radius="md"
            withBorder
            bg="light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))"
          >
            <Group gap="xs" mb="xs">
              <UserCheck size={18} color="var(--mantine-color-teal-6)" />
              <div>
                <Text size="sm" fw={700}>
                  Gestão Patrimonial
                </Text>
                <Text size="xs" c="dimmed">
                  Validação dos critérios e catálogo
                </Text>
              </div>
            </Group>

            <Stack gap="xs" mt="sm">
              <Controller
                control={control}
                name="reviewer_name"
                render={({ field }) => (
                  <TextInput
                    label="Responsável pela Validação"
                    placeholder="Ex.: Gestor Patrimonial"
                    disabled={readOnly}
                    {...field}
                    value={field.value || ''}
                  />
                )}
              />

              <Controller
                control={control}
                name="reviewed_by_date"
                render={({ field }) => (
                  <DateInput
                    label="Data da Validação"
                    placeholder="dd/mm/aaaa"
                    valueFormat="DD/MM/YYYY"
                    rightSection={<Calendar size={16} color="var(--mantine-color-gray-6)" />}
                    clearable
                    disabled={readOnly}
                    value={parseDateValue(field.value)}
                    onChange={(val: Date | null) =>
                      field.onChange(val ? val.toISOString() : null)
                    }
                  />
                )}
              />
            </Stack>
          </Paper>
        </Grid.Col>

        {/* Card 3: Aprovação Final */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper
            p="md"
            radius="md"
            withBorder
            bg="light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))"
          >
            <Group gap="xs" mb="xs">
              <ShieldCheck size={18} color="var(--mantine-color-green-6)" />
              <div>
                <Text size="sm" fw={700}>
                  Aprovação Final
                </Text>
                <Text size="xs" c="dimmed">
                  Autorização da baixa contábil
                </Text>
              </div>
            </Group>

            <Stack gap="xs" mt="sm">
              <Controller
                control={control}
                name="approver_name"
                render={({ field }) => (
                  <TextInput
                    label="Aprovador Formal"
                    placeholder="Ex.: Diretoria / Colegiado"
                    disabled={readOnly}
                    {...field}
                    value={field.value || ''}
                  />
                )}
              />

              <Controller
                control={control}
                name="approval_date"
                render={({ field }) => (
                  <DateInput
                    label="Data da Aprovação"
                    placeholder="dd/mm/aaaa"
                    valueFormat="DD/MM/YYYY"
                    rightSection={<Calendar size={16} color="var(--mantine-color-gray-6)" />}
                    clearable
                    disabled={readOnly}
                    value={parseDateValue(field.value)}
                    onChange={(val: Date | null) =>
                      field.onChange(val ? val.toISOString() : null)
                    }
                  />
                )}
              />

              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select
                    label="Status da Avaliação"
                    disabled={readOnly}
                    data={[
                      { value: 'Rascunho', label: '● Rascunho' },
                      { value: 'Em Análise', label: '● Em Análise' },
                      { value: 'Aprovado', label: '● Aprovado' },
                      { value: 'Baixado', label: '● Baixado' },
                      { value: 'Rejeitado', label: '● Rejeitado' },
                    ]}
                    value={field.value || 'Rascunho'}
                    onChange={(val) => field.onChange(val || 'Rascunho')}
                  />
                )}
              />
            </Stack>
          </Paper>
        </Grid.Col>

        {/* Parecer / Observações do Aprovador */}
        <Grid.Col span={12}>
          <Controller
            control={control}
            name="approval_comments"
            render={({ field }) => (
              <Textarea
                label="Parecer / Observações do Aprovador"
                placeholder="Registre as diretrizes da aprovação, parecer do colegiado ou orientações para a baixa patrimonial..."
                minRows={3}
                autosize
                disabled={readOnly}
                {...field}
                value={field.value || ''}
              />
            )}
          />
        </Grid.Col>

        {/* Botão de Ação Expressa de Aprovação Formal */}
        {!isApprovedOrWrittenOff && !readOnly && existingEvaluation?.id && (
          <Grid.Col span={12}>
            <Group justify="flex-end" mt="xs">
              <Button
                color="green"
                size="md"
                leftSection={<CheckCircle2 size={18} />}
                loading={isApproving}
                onClick={handleOpenApproveModal}
              >
                Aprovar & Efetivar Baixa no Sistema
              </Button>
            </Group>
          </Grid.Col>
        )}

        {/* Alerta de Confirmação quando já aprovado/baixado */}
        {isApprovedOrWrittenOff && (
          <Grid.Col span={12}>
            <Paper
              p="sm"
              radius="md"
              withBorder
              bg="light-dark(var(--mantine-color-teal-0), var(--mantine-color-dark-7))"
            >
              <Group gap="xs">
                <CheckCircle2 size={18} color="var(--mantine-color-teal-6)" />
                <Text size="sm" c="teal" fw={600}>
                  Avaliação homologada com status <b>{currentStatus}</b> por{' '}
                  <b>{watchedApproverName || 'Gestor'}</b> em{' '}
                  <b>{formatDateDisplay(watchedApprovalDate)}</b>.
                </Text>
              </Group>
            </Paper>
          </Grid.Col>
        )}
      </Grid>
    </Card>
  )
}
