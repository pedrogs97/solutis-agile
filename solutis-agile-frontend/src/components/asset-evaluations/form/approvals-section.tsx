'use client'

import {
  Badge,
  Button,
  Card,
  Grid,
  Group,
  Paper,
  Stack,
  Text,
  Textarea,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { modals } from '@mantine/modals'
import { CheckCircle2, ShieldCheck, UserCheck } from 'lucide-react'

import type { AssetTechnicalEvaluation } from '@/types/AssetEvaluation'

interface ApprovalsSectionProps {
  existingEvaluation?: AssetTechnicalEvaluation | null
  onApprove?: (comments?: string, writeOff?: boolean) => void
  isApproving?: boolean
  readOnly?: boolean
}

export function ApprovalsSection({
  existingEvaluation,
  onApprove,
  isApproving = false,
  readOnly = false,
}: Readonly<ApprovalsSectionProps>) {
  const isApprovedOrWrittenOff =
    existingEvaluation?.status === 'Aprovado' ||
    existingEvaluation?.status === 'Baixado'

  const handleOpenApproveModal = () => {
    let approvalComments = ''

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
            onChange={(e) => {
              approvalComments = e.currentTarget.value
            }}
          />
        </Stack>
      ),
      labels: { confirm: 'Confirmar Baixa & Aprovação', cancel: 'Cancelar' },
      confirmProps: { color: 'green' },
      onConfirm: () => {
        if (onApprove) {
          onApprove(approvalComments, true)
        }
      },
    })
  }

  return (
    <Card shadow="xs" radius="md" p="lg" withBorder>
      <Group justify="space-between" mb="md">
        <Group>
          <ThemeIcon size="lg" radius="md" color="teal" variant="light">
            <ShieldCheck size={20} />
          </ThemeIcon>
          <div>
            <Title order={4}>7. Fluxo de Validação & Aprovação Formal</Title>
            <Text size="xs" c="dimmed">
              Assinaturas digitais e efetivação da baixa patrimonial
            </Text>
          </div>
        </Group>

        {isApprovedOrWrittenOff && (
          <Badge color="green" size="lg" leftSection={<CheckCircle2 size={16} />}>
            Aprovado por {existingEvaluation?.approver_name || 'Gestor'}
          </Badge>
        )}
      </Group>

      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper p="md" radius="md" withBorder bg="var(--mantine-color-gray-0)">
            <Group gap="xs" mb="xs">
              <UserCheck size={18} color="var(--mantine-color-blue-6)" />
              <Text size="sm" fw={700}>
                Avaliador Técnico
              </Text>
            </Group>
            <Text size="xs" c="dimmed">
              Responsável pelo laudo e pesagem
            </Text>
            <Text size="sm" fw={600} mt={4}>
              {existingEvaluation?.evaluator_name || 'Usuário Atual'}
            </Text>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper p="md" radius="md" withBorder bg="var(--mantine-color-gray-0)">
            <Group gap="xs" mb="xs">
              <UserCheck size={18} color="var(--mantine-color-teal-6)" />
              <Text size="sm" fw={700}>
                Gestão Patrimonial
              </Text>
            </Group>
            <Text size="xs" c="dimmed">
              Validação dos critérios e catálogo
            </Text>
            <Text size="sm" fw={600} mt={4}>
              Área de Patrimônio
            </Text>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper p="md" radius="md" withBorder bg="var(--mantine-color-gray-0)">
            <Group gap="xs" mb="xs">
              <ShieldCheck size={18} color="var(--mantine-color-green-6)" />
              <Text size="sm" fw={700}>
                Aprovação Final
              </Text>
            </Group>
            <Text size="xs" c="dimmed">
              Autorização da baixa contábil
            </Text>
            <Text size="sm" fw={600} mt={4}>
              {existingEvaluation?.approver_name || 'Pendente de Colegiado'}
            </Text>
          </Paper>
        </Grid.Col>

        {!isApprovedOrWrittenOff && !readOnly && existingEvaluation?.id && (
          <Grid.Col span={12}>
            <Group justify="flex-end" mt="md">
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
      </Grid>
    </Card>
  )
}
