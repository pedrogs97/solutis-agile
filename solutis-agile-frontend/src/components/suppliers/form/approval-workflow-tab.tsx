'use client'

import {
  Alert,
  Badge,
  Button,
  Card,
  Flex,
  Group,
  Loader,
  Stack,
  Text,
  Textarea,
  ThemeIcon,
  Timeline,
} from '@mantine/core'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import dayjs from 'dayjs'
import {
  Ban,
  CheckCircle2,
  CircleDashed,
  Lock,
  MailCheck,
  RefreshCw,
  Send,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

import AsyncSelect from '@/components/common/async-select'
import { useApprovalWorkflow } from '@/hooks/supplier/useApprovalWorkflow'
import { fetchEmployeeSelect } from '@/services/api/employee'
import { useProfileStore } from '@/store/persisted/useProfileStore'
import { type ApprovalTimelineItem } from '@/types/ApprovalWorkflow'

interface ApprovalWorkflowTabProps {
  supplierId?: string
  supplierName?: string
  mode: 'create' | 'edit'
}

interface EmployeeOption {
  value: string
  label: string
  email?: string
}

const formatDate = (value?: string | null) => {
  if (!value) return '-'
  return dayjs(value).format('DD/MM/YYYY HH:mm')
}

const getTimelineBullet = (status: ApprovalTimelineItem['status']) => {
  switch (status) {
    case 'completed':
      return (
        <ThemeIcon color="green" size={32} radius="xl">
          <CheckCircle2 size={18} />
        </ThemeIcon>
      )
    case 'current':
      return (
        <ThemeIcon color="blue" size={32} radius="xl">
          <Send size={18} />
        </ThemeIcon>
      )
    case 'rejected':
      return (
        <ThemeIcon color="red" size={32} radius="xl">
          <Ban size={18} />
        </ThemeIcon>
      )
    default:
      return (
        <ThemeIcon color="gray" size={32} radius="xl">
          <Lock size={18} />
        </ThemeIcon>
      )
  }
}

const getStatusBadge = (status: ApprovalTimelineItem['status']) => {
  switch (status) {
    case 'completed':
      return <Badge color="green">Aprovado</Badge>
    case 'current':
      return <Badge color="blue">Pendente de avaliação</Badge>
    case 'rejected':
      return <Badge color="red">Rejeitado</Badge>
    case 'pendingApproval':
      return <Badge color="yellow">Aguardando aprovação</Badge>
    default:
      return <Badge color="gray">Aguardando</Badge>
  }
}

export function ApprovalWorkflowTab({
  supplierId,
  supplierName,
  mode,
}: ApprovalWorkflowTabProps) {
  const {
    steps,
    currentStepFlow,
    timeline,
    hasFlowNotFound,
    isLoading,
    isFetching,
    startFlow,
    isStartingFlow,
    setResponsibleStep,
    isSending,
    resetFlow,
    isResettingFlow,
    refetchFlow,
  } = useApprovalWorkflow({ supplierId, enabled: mode === 'edit' })
  const profile = useProfileStore((state) => state.profile)
  const isMasterUser = profile?.group === 'MASTER'

  const currentItem = useMemo(
    () => timeline.find((item) => item.status === 'current'),
    [timeline],
  )

  const [selectedApprover, setSelectedApprover] =
    useState<EmployeeOption | null>(null)
  const approverForm = useForm<{ approverId: string; observations: string }>({
    defaultValues: { approverId: '', observations: '' },
  })

  const loadApprovers = useCallback(
    (query: string) => fetchEmployeeSelect(query),
    [],
  )

  const initialApproverOptions = useMemo(() => {
    if (!selectedApprover) return []
    return [selectedApprover]
  }, [selectedApprover])

  useEffect(() => {
    approverForm.setValue('approverId', selectedApprover?.value ?? '')
  }, [selectedApprover, approverForm])

  useEffect(() => {
    if (!currentItem) {
      setSelectedApprover(null)
      approverForm.reset({ approverId: '', observations: '' })
      return
    }

    if (currentItem.approval?.approver) {
      setSelectedApprover({
        value: currentItem.approval.approverId.toString(),
        label: currentItem.approval.approver.name,
        email: currentItem.approval.approver.email,
      })
    } else {
      setSelectedApprover(null)
    }
    approverForm.setValue(
      'observations',
      currentItem.approval?.observations ?? '',
    )
  }, [
    currentItem?.step?.id,
    currentItem?.approval?.approver?.id,
    currentItem?.approval?.observations,
    approverForm,
  ])

  const loading = isLoading || isFetching

  const handleResendStep = async (
    item: ApprovalTimelineItem,
    index: number,
  ) => {
    const approver = item.approval?.approver
    const previousStep = timeline[index - 1]

    if (!approver?.name || !approver.email) {
      notifications.show({
        title: 'Responsável indisponível',
        message: 'Não foi possível identificar o responsável deste passo.',
        color: 'red',
        autoClose: 4000,
      })
      return
    }

    if (!previousStep?.approval?.id) {
      notifications.show({
        title: 'Passo anterior não encontrado',
        message:
          'Não é possível reenviar sem o passo anterior concluído corretamente.',
        color: 'red',
        autoClose: 4000,
      })
      return
    }

    try {
      await setResponsibleStep({
        flowId: previousStep.approval.id,
        originStepId: previousStep.step.id,
        approverName: approver.name,
        approverEmail: approver.email,
        observations: item.approval?.observations ?? '',
      })
    } catch {
      // errors are handled in mutation onError
    }
  }

  const handleStartFlow = async () => {
    if (!supplierId) return
    try {
      await startFlow()
    } catch {
      // errors are handled in mutation onError
      return
    }
    setSelectedApprover(null)
    approverForm.reset({ approverId: '', observations: '' })
  }

  const handleSendForApproval = async () => {
    if (!currentStepFlow || !currentItem) return
    const approverInfo =
      selectedApprover ||
      (currentItem.approval?.approver
        ? {
            value: currentItem.approval.approverId.toString(),
            label: currentItem.approval.approver.name,
            email: currentItem.approval.approver.email,
          }
        : undefined)

    if (!approverInfo?.label || !approverInfo?.email) {
      notifications.show({
        title: 'Selecione um aprovador',
        message: 'É necessário informar o responsável pela avaliação.',
        color: 'red',
        autoClose: 4000,
      })
      return
    }

    const observations = approverForm.getValues('observations')?.trim() ?? ''

    try {
      await setResponsibleStep({
        flowId: currentStepFlow.id,
        approverName: approverInfo.label,
        approverEmail: approverInfo.email,
        observations,
      })
    } catch {
      // errors are handled in mutation onError
      return
    }

    setSelectedApprover(null)
    approverForm.reset({ approverId: '', observations: '' })
  }

  const handleResetFlow = async () => {
    if (!supplierId) return
    try {
      await resetFlow()
    } catch {
      // errors are handled in mutation onError
      return
    }
    setSelectedApprover(null)
    approverForm.reset({ approverId: '', observations: '' })
  }

  const openResetFlowConfirmModal = useCallback(() => {
    modals.openConfirmModal({
      id: 'confirm-reset-approval-flow-modal',
      title: 'Resetar fluxo de aprovação',
      children:
        'Tem certeza que deseja resetar o fluxo de aprovação? Esta ação irá limpar o progresso atual.',
      centered: true,
      labels: { confirm: 'Resetar fluxo', cancel: 'Cancelar' },
      confirmProps: { color: 'red' },
      onCancel: () => modals.close('confirm-reset-approval-flow-modal'),
      onConfirm: handleResetFlow,
    })
  }, [handleResetFlow])

  if (mode === 'create') {
    return (
      <Stack gap="md">
        <Alert color="blue" icon={<CircleDashed size={20} />}>
          O fluxo de aprovação será criado automaticamente após o cadastro do
          fornecedor.
        </Alert>
      </Stack>
    )
  }

  if (!supplierId) {
    return (
      <Stack gap="md">
        <Alert color="yellow" icon={<CircleDashed size={20} />}>
          Salve o fornecedor antes de visualizar o fluxo de aprovação.
        </Alert>
      </Stack>
    )
  }

  if (loading) {
    return (
      <Flex justify="center" align="center" mih={200}>
        <Loader size="lg" />
      </Flex>
    )
  }

  if (hasFlowNotFound) {
    return (
      <Stack gap="md">
        <Alert color="yellow" icon={<CircleDashed size={20} />}>
          Este fornecedor ainda não possui fluxo de aprovação.
        </Alert>
        <Button
          leftSection={<MailCheck size={18} />}
          onClick={handleStartFlow}
          loading={isStartingFlow}
        >
          Iniciar fluxo de aprovação
        </Button>
      </Stack>
    )
  }

  if (!currentStepFlow || steps.length === 0) {
    return (
      <Alert color="red" icon={<Ban size={18} />}>
        Não foi possível carregar o fluxo de aprovação deste fornecedor.
      </Alert>
    )
  }

  const completedCount = timeline.filter(
    (item) => item.status === 'completed',
  ).length
  const activeIndex = Math.min(completedCount, timeline.length - 1)

  return (
    <Stack gap="lg">
      <Flex justify="space-between" align="center">
        <div>
          <Text fw={700} size="lg">
            Fluxo de aprovação
            {supplierName ? ` · ${supplierName}` : ''}
          </Text>
          <Text size="sm" c="dimmed">
            Acompanhe o progresso das aprovações e registre decisões.
          </Text>
        </div>
        <Group>
          {isMasterUser && (
            <Button
              variant="outline"
              color="red"
              leftSection={<RefreshCw size={16} />}
              onClick={openResetFlowConfirmModal}
              loading={isResettingFlow}
              disabled={loading || isSending}
            >
              Resetar fluxo
            </Button>
          )}
          <Button
            variant="light"
            leftSection={<RefreshCw size={16} />}
            onClick={() => {
              refetchFlow()
              setSelectedApprover(null)
              approverForm.reset({ approverId: '', observations: '' })
            }}
          >
            Atualizar fluxo
          </Button>
        </Group>
      </Flex>

      <Timeline active={activeIndex} bulletSize={40} lineWidth={3} color="blue">
        {timeline.map((item, index) => (
          <Timeline.Item
            key={item.step.id}
            bullet={getTimelineBullet(item.status)}
            title={
              <Group gap="xs">
                <Text fw={600}>{item.step.name}</Text>
                {getStatusBadge(item.status)}
              </Group>
            }
          >
            <Card withBorder radius="md" p="md" shadow="sm">
              <Stack gap="xs">
                <Text size="sm" c="dimmed">
                  {item.step.name.toLowerCase().includes('gestor') &&
                  item.step.department === 'Administrativo'
                    ? 'Gestor'
                    : item.step.name.toLowerCase().includes('compliance') &&
                        item.step.department === 'Financeiro'
                      ? 'Compliance e Sustentabilidade'
                      : item.step.department}
                </Text>
                {item.approval ? (
                  <Stack gap={4}>
                    <Text size="sm">
                      Responsável: {item.approval.approver?.name ?? '-'}
                    </Text>
                    <Text size="sm" c="dimmed">
                      Email: {item.approval.approver?.email ?? '-'}
                    </Text>
                    <Text size="sm" c="dimmed">
                      Registrado em: {formatDate(item.approval.approvalAt)}
                    </Text>
                    {item.approval.observations && (
                      <Text size="sm" c="dimmed">
                        Observações: {item.approval.observations}
                      </Text>
                    )}
                    {item.status === 'rejected' && index > 0 && (
                      <Stack gap="xs" mt="sm">
                        <Text size="sm" c="red">
                          Este passo foi rejeitado. Reenvie para o responsável
                          para continuar o fluxo.
                        </Text>
                        <Group justify="flex-end">
                          <Button
                            variant="outline"
                            color="red"
                            leftSection={<RefreshCw size={16} />}
                            loading={isSending}
                            onClick={() => handleResendStep(item, index)}
                          >
                            Reenviar para responsável
                          </Button>
                        </Group>
                      </Stack>
                    )}
                  </Stack>
                ) : item.status === 'current' ? (
                  <Stack gap="sm">
                    <FormProvider {...approverForm}>
                      <AsyncSelect
                        name="approverId"
                        label="Responsável pela aprovação"
                        placeholder="Selecione um colaborador"
                        fetcher={loadApprovers}
                        debounceMs={400}
                        minChars={2}
                        preloadOnOpen
                        disabled={loading || isSending}
                        initialOptions={initialApproverOptions}
                        onOptionSelect={(option) => {
                          if (!option) {
                            setSelectedApprover(null)
                            return
                          }
                          const enriched = option as EmployeeOption
                          setSelectedApprover({
                            value: enriched.value,
                            label: enriched.label,
                            email: enriched.email,
                          })
                        }}
                      />
                      <Textarea
                        label="Observações"
                        placeholder="Adicione observações para o aprovador"
                        minRows={3}
                        autosize
                        disabled={loading || isSending}
                        {...approverForm.register('observations')}
                      />
                    </FormProvider>
                    <Group justify="flex-end">
                      <Button
                        onClick={handleSendForApproval}
                        loading={isSending}
                        leftSection={<MailCheck size={16} />}
                      >
                        Enviar para aprovação
                      </Button>
                    </Group>
                  </Stack>
                ) : (
                  <Text size="sm" c="dimmed">
                    Aguardando aprovação anterior.
                  </Text>
                )}
              </Stack>
            </Card>
          </Timeline.Item>
        ))}
      </Timeline>
    </Stack>
  )
}
