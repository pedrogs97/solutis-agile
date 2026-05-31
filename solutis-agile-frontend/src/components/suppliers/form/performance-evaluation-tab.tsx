'use client'

import {
  Badge,
  Box,
  Button,
  Card,
  Grid,
  Group,
  LoadingOverlay,
  Modal,
  Paper,
  Rating,
  Select,
  Stack,
  Table,
  Text,
  Textarea,
  TextInput,
  Tooltip,
} from '@mantine/core'
import { DateInput, MonthPickerInput } from '@mantine/dates'
import { useDisclosure } from '@mantine/hooks'
import { modals } from '@mantine/modals'
import {
  ArrowLeft,
  Eye,
  FileSpreadsheet,
  Pencil,
  Plus,
  Search,
  Trash,
} from 'lucide-react'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'

import Pagination from '@/components/common/pagination'
import {
  EVALUATION_SCORE_LEVELS,
  getClassificationInfo,
  getClassificationInfoByLabel,
  getEvaluationScoreLabel,
  parseEvaluationScoreValue,
} from '@/constants/evaluationScore'
import {
  useCreateSupplierEvaluation,
  useDeleteSupplierEvaluation,
  useEvaluationCriteria,
  useSupplierEvaluationDetail,
  useSupplierEvaluations,
  useUpdateSupplierEvaluation,
} from '@/hooks/evaluation/useEvaluations'
import { formatDateBR } from '@/lib/utils'
import { downloadSupplierEvaluationReport } from '@/services/api/supplierEvaluationReport'
import { useProfileStore } from '@/store/persisted/useProfileStore'
import type {
  CreateSupplierEvaluationPayload,
  EvaluationCriterion,
  EvaluationFixedScoreValue,
} from '@/types/evaluation'

interface PerformanceEvaluationTabProps {
  supplierId?: number
}

type EvaluationView = 'list' | 'add'

interface CriteriaScoresListProps {
  criteria: EvaluationCriterion[]
  scores: Record<number, EvaluationFixedScoreValue>
  onScoreChange: (criterionId: number, value: string | null) => void
}

const PERIOD_NUMBER_OPTIONS = [
  { value: '1', label: '1º Quadrimestre' },
  { value: '2', label: '2º Quadrimestre' },
  { value: '3', label: '3º Quadrimestre' },
]

const formatPeriodLabel = (periodNumber?: number, year?: number) => {
  if (!periodNumber || !year) return '-'
  const baseLabel = PERIOD_NUMBER_OPTIONS.find(
    (option) => Number(option.value) === periodNumber,
  )?.label
  return `${baseLabel ?? `${periodNumber}º`}/${year}`
}

const formatDateForApi = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const startOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), 1)

const parsePickerMonth = (value: Date | string) => {
  if (value instanceof Date) return startOfMonth(value)

  const [year, month] = value.split('-').map(Number)
  if (!year || !month) return null
  return new Date(year, month - 1, 1)
}

const endOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth() + 1, 0)

const addMonths = (date: Date, months: number) =>
  new Date(date.getFullYear(), date.getMonth() + months, 1)

const getMonthDiff = (startDate: Date, endDate: Date) =>
  (endDate.getFullYear() - startDate.getFullYear()) * 12 +
  endDate.getMonth() -
  startDate.getMonth()

const scoreToRating = (score: EvaluationFixedScoreValue | undefined): number =>
  score === undefined ? 0 : score / 20 + 1

const ratingToScore = (rating: number): string | null =>
  rating === 0 ? null : String((rating - 1) * 20)

interface CriterionRatingProps {
  criterionId: number
  value: EvaluationFixedScoreValue | undefined
  onChange: (criterionId: number, value: string | null) => void
}

function CriterionRating({
  criterionId,
  value,
  onChange,
}: CriterionRatingProps) {
  const ratingValue = scoreToRating(value)
  const selectedLabel = EVALUATION_SCORE_LEVELS.find(
    (l) => l.value === value,
  )?.label

  const starSymbol = (starValue: number, filled: boolean) => (
    <Tooltip
      label={EVALUATION_SCORE_LEVELS[starValue - 1]?.label ?? ''}
      withArrow
      position="top"
    >
      <Box
        component="span"
        style={{
          fontSize: 24,
          lineHeight: 1,
          color: filled
            ? 'var(--mantine-color-yellow-5)'
            : 'var(--mantine-color-gray-4)',
        }}
      >
        ★
      </Box>
    </Tooltip>
  )

  return (
    <Group gap="sm" align="center" wrap="nowrap">
      <Rating
        count={6}
        value={ratingValue}
        onChange={(val) => onChange(criterionId, ratingToScore(val))}
        emptySymbol={(v) => starSymbol(v, false)}
        fullSymbol={(v) => starSymbol(v, true)}
      />
      <Text size="xs" c={selectedLabel ? 'dimmed' : 'gray.4'} fw={500} w={160}>
        {selectedLabel ?? '—'}
      </Text>
    </Group>
  )
}

const CriteriaScoresList = memo(function CriteriaScoresList({
  criteria,
  scores,
  onScoreChange,
}: CriteriaScoresListProps) {
  return (
    <Stack gap="xs">
      {criteria.map((criterion, index) => (
        <Box
          key={criterion.id}
          p="sm"
          bg={
            index % 2 === 0
              ? 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))'
              : 'transparent'
          }
          style={{ borderRadius: 'var(--mantine-radius-sm)' }}
        >
          <Group justify="space-between" wrap="nowrap" align="center">
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Text size="sm" fw={600}>
                {criterion.name}
              </Text>
              {criterion.description && (
                <Text size="xs" c="dimmed" truncate="end">
                  {criterion.description}
                </Text>
              )}
            </Box>
            <CriterionRating
              criterionId={criterion.id}
              value={scores[criterion.id]}
              onChange={onScoreChange}
            />
          </Group>
        </Box>
      ))}
    </Stack>
  )
})

export function PerformanceEvaluationTab({
  supplierId,
}: PerformanceEvaluationTabProps) {
  const [viewOpened, { open: openView, close: closeView }] =
    useDisclosure(false)
  const [activeView, setActiveView] = useState<EvaluationView>('list')

  const [viewingEvaluationId, setViewingEvaluationId] = useState<number | null>(
    null,
  )
  const [editingId, setEditingId] = useState<number | null>(null)
  const profile = useProfileStore((state) => state.profile)
  const isMasterUser = profile?.group?.toUpperCase() === 'MASTER'
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState('12')
  const [isDownloadingReport, setIsDownloadingReport] = useState(false)
  const [reportStartMonth, setReportStartMonth] = useState<Date | null>(null)
  const [reportEndMonth, setReportEndMonth] = useState<Date | null>(null)
  const [appliedReportStartMonth, setAppliedReportStartMonth] =
    useState<Date | null>(null)
  const [appliedReportEndMonth, setAppliedReportEndMonth] =
    useState<Date | null>(null)
  const hasSupplierContext = Boolean(supplierId)

  const appliedEvaluationFilters = useMemo(
    () => ({
      startPeriod: appliedReportStartMonth
        ? formatDateForApi(startOfMonth(appliedReportStartMonth))
        : null,
      endPeriod: appliedReportEndMonth
        ? formatDateForApi(endOfMonth(appliedReportEndMonth))
        : null,
    }),
    [appliedReportEndMonth, appliedReportStartMonth],
  )

  const { data: criteria = [] } = useEvaluationCriteria(hasSupplierContext)
  const { data: evaluationsData, isLoading: isLoadingEvaluations } =
    useSupplierEvaluations(
      supplierId,
      page,
      Number(pageSize),
      appliedEvaluationFilters,
    )
  const evaluations = evaluationsData?.results ?? []
  const evaluationsCount = evaluationsData?.count ?? 0
  const { data: viewingEvaluation, isFetching: isLoadingDetails } =
    useSupplierEvaluationDetail(viewingEvaluationId ?? undefined)

  const { mutate: createEvaluation, isPending: isCreating } =
    useCreateSupplierEvaluation()
  const { mutate: updateEvaluation, isPending: isUpdating } =
    useUpdateSupplierEvaluation()
  const { mutate: deleteEvaluation, isPending: isDeleting } =
    useDeleteSupplierEvaluation()

  const isSaving = isCreating || isUpdating || isDeleting
  const reportMonthDiff =
    reportStartMonth && reportEndMonth
      ? getMonthDiff(reportStartMonth, reportEndMonth)
      : 0
  const isReportDateRangeInvalid = Boolean(
    reportStartMonth && reportEndMonth && reportMonthDiff < 0,
  )
  const isReportPeriodTooLong = Boolean(
    reportStartMonth && reportEndMonth && reportMonthDiff > 2,
  )
  const isReportPeriodInvalid =
    isReportDateRangeInvalid || isReportPeriodTooLong
  const hasCompleteReportPeriod = Boolean(reportStartMonth && reportEndMonth)
  const isReportActionDisabled =
    !hasCompleteReportPeriod || isReportPeriodInvalid

  const [newEvaluation, setNewEvaluation] = useState<
    Partial<CreateSupplierEvaluationPayload>
  >({
    evaluationYear: new Date().getFullYear(),
    periodType: 'QUADRIMESTER',
    periodNumber: undefined,
    evaluatorName: '',
    comments: '',
  })
  const [evaluationDate, setEvaluationDate] = useState<Date>(new Date())

  const [scores, setScores] = useState<
    Record<number, EvaluationFixedScoreValue>
  >({})

  useEffect(() => {
    if (editingId && viewingEvaluation && viewingEvaluation.id === editingId) {
      setNewEvaluation({
        evaluationYear: viewingEvaluation.evaluationYear,
        periodType: viewingEvaluation.periodType,
        periodNumber: viewingEvaluation.periodNumber,
        evaluatorName: viewingEvaluation.evaluatorName,
        comments: viewingEvaluation.comments,
      })
      setEvaluationDate(
        new Date(`${viewingEvaluation.evaluationDate}T12:00:00`),
      )

      const newScores: Record<number, EvaluationFixedScoreValue> = {}
      viewingEvaluation.criterionScores.forEach((cs) => {
        const parsed = parseEvaluationScoreValue(cs.score)
        if (parsed !== null) {
          newScores[cs.criterion.id] = parsed
        }
      })
      setScores(newScores)
    }
  }, [editingId, viewingEvaluation])

  const periodNumberOptions = useMemo(() => PERIOD_NUMBER_OPTIONS, [])
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: 11 }, (_, index) => {
      const year = currentYear - 5 + index
      return { value: String(year), label: String(year) }
    })
  }, [])

  const formatScore = (score: number | string | null | undefined) => {
    const normalized = Number(score)
    if (!Number.isFinite(normalized)) return '-'
    return `${normalized.toFixed(2).replace('.', ',')}%`
  }

  const selectedCriteriaCount = useMemo(
    () =>
      criteria.filter((criterion) => scores[criterion.id] !== undefined).length,
    [criteria, scores],
  )

  const isAllCriteriaScored =
    criteria.length > 0 && selectedCriteriaCount === criteria.length

  const calculatedFormScore = useMemo(() => {
    const criteriaForScore = criteria.filter(
      (criterion) => scores[criterion.id] !== undefined,
    )

    if (!criteriaForScore.length) return 0

    let totalWeight = 0
    let totalWeightedScore = 0

    criteriaForScore.forEach((criterion) => {
      const weight = Number(criterion.weight) || 1
      const score = scores[criterion.id]

      if (score === undefined) return

      totalWeight += weight
      totalWeightedScore += score * weight
    })

    return totalWeight > 0 ? totalWeightedScore / totalWeight : 0
  }, [criteria, scores])

  const resetNewEvaluation = () => {
    setNewEvaluation({
      evaluationYear: new Date().getFullYear(),
      periodType: 'QUADRIMESTER',
      periodNumber: undefined,
      evaluatorName: '',
      comments: '',
    })
    setEvaluationDate(new Date())
    setScores({})
  }

  const handleOpenNew = () => {
    resetNewEvaluation()
    setEditingId(null)
    setActiveView('add')
  }

  const handlePageSizeChange = (value: string) => {
    setPageSize(value)
    setPage(1)
  }

  const handleCriterionScoreChange = useCallback(
    (criterionId: number, value: string | null) => {
      const parsed = parseEvaluationScoreValue(value)
      setScores((prev) => {
        const next = { ...prev }
        if (parsed === null) {
          delete next[criterionId]
          return next
        }
        next[criterionId] = parsed
        return next
      })
    },
    [],
  )

  const handleSave = () => {
    if (
      !supplierId ||
      !newEvaluation.periodType ||
      !newEvaluation.periodNumber ||
      !newEvaluation.evaluationYear ||
      !newEvaluation.evaluatorName
    ) {
      return
    }

    const payload: CreateSupplierEvaluationPayload = {
      supplier: Number(supplierId),
      evaluationYear: Number(newEvaluation.evaluationYear),
      periodType: newEvaluation.periodType,
      periodNumber: Number(newEvaluation.periodNumber),
      evaluatorName: newEvaluation.evaluatorName,
      evaluationDate: evaluationDate.toISOString().split('T')[0],
      comments: newEvaluation.comments,
      criterionScores: Object.entries(scores).map(([criterionId, score]) => ({
        criterion: Number(criterionId),
        score,
      })),
    }

    if (editingId) {
      if (!isMasterUser) return

      updateEvaluation(
        { id: editingId, data: payload },
        {
          onSuccess: () => {
            resetNewEvaluation()
            setActiveView('list')
          },
        },
      )
    } else {
      createEvaluation(payload, {
        onSuccess: () => {
          resetNewEvaluation()
          setActiveView('list')
        },
      })
    }
  }

  const handleEditClick = (id: number) => {
    if (!isMasterUser) return

    setViewingEvaluationId(id)
    setEditingId(id)
    setActiveView('add')
  }

  const handleDeleteClick = (id: number) => {
    if (!isMasterUser) return

    modals.openConfirmModal({
      id: 'confirm-delete-supplier-evaluation-modal',
      title: 'Excluir avaliação',
      children: 'Tem certeza que deseja excluir esta avaliação?',
      centered: true,
      labels: { confirm: 'Confirmar exclusão', cancel: 'Cancelar' },
      confirmProps: { color: 'red' },
      onCancel: () => modals.close('confirm-delete-supplier-evaluation-modal'),
      onConfirm: () => deleteEvaluation(id),
    })
  }

  const handleView = (id: number) => {
    setViewingEvaluationId(id)
    openView()
  }

  const handleDownloadExcel = async () => {
    if (!supplierId || !hasCompleteReportPeriod || isReportPeriodInvalid) return

    setIsDownloadingReport(true)
    try {
      await downloadSupplierEvaluationReport({
        supplierId,
        periodType: 'QUADRIMESTER',
        startPeriod: reportStartMonth
          ? formatDateForApi(startOfMonth(reportStartMonth))
          : null,
        endPeriod: reportEndMonth
          ? formatDateForApi(endOfMonth(reportEndMonth))
          : null,
      })
    } finally {
      setIsDownloadingReport(false)
    }
  }

  const handleSearch = () => {
    if (isReportActionDisabled) return
    setAppliedReportStartMonth(reportStartMonth)
    setAppliedReportEndMonth(reportEndMonth)
    setPage(1)
  }

  if (!supplierId) {
    return (
      <Box p="md">
        <Text c="dimmed">
          Salve o fornecedor primeiro para adicionar avaliações de desempenho.
        </Text>
      </Box>
    )
  }

  return (
    <Box pos="relative">
      <LoadingOverlay
        visible={isLoadingEvaluations}
        zIndex={1000}
        overlayProps={{ radius: 'sm', blur: 2 }}
      />
      <Grid>
        <Grid.Col span={12}>
          <Group justify="space-between" align="flex-start" mb="md">
            <Box>
              <Text size="lg" fw={600}>
                Avaliações de Desempenho
              </Text>
              <Text size="sm" c="dimmed">
                {activeView === 'list'
                  ? 'Histórico e relatórios de avaliação de desempenho'
                  : editingId
                    ? 'Edição de avaliação de desempenho'
                    : 'Cadastro de nova avaliação de desempenho'}
              </Text>
            </Box>
            {activeView === 'list' && (
              <Button leftSection={<Plus size={16} />} onClick={handleOpenNew}>
                Nova Avaliação
              </Button>
            )}
          </Group>
        </Grid.Col>

        {activeView === 'list' && (
          <Grid.Col span={12}>
            <Group justify="space-between" align="flex-end" mb="md">
              <Group gap="sm" align="flex-end">
                <MonthPickerInput
                  label="Período inicial"
                  placeholder="mm/aaaa"
                  value={reportStartMonth}
                  onChange={(date) => {
                    const nextStartMonth = date ? parsePickerMonth(date) : null
                    setReportStartMonth(nextStartMonth)

                    if (
                      !nextStartMonth ||
                      (reportEndMonth &&
                        (getMonthDiff(nextStartMonth, reportEndMonth) < 0 ||
                          getMonthDiff(nextStartMonth, reportEndMonth) > 2))
                    ) {
                      setReportEndMonth(null)
                    }
                  }}
                  valueFormat="MM/YYYY"
                  minDate={
                    reportEndMonth ? addMonths(reportEndMonth, -2) : undefined
                  }
                  maxDate={reportEndMonth ?? undefined}
                  clearable
                />
                <MonthPickerInput
                  label="Período final"
                  placeholder={
                    reportStartMonth ? 'mm/aaaa' : 'Selecione o inicial'
                  }
                  value={reportEndMonth}
                  onChange={(date) => {
                    const nextEndMonth = date ? parsePickerMonth(date) : null
                    const diff =
                      reportStartMonth && nextEndMonth
                        ? getMonthDiff(reportStartMonth, nextEndMonth)
                        : 0
                    setReportEndMonth(
                      reportStartMonth && nextEndMonth && diff >= 0 && diff <= 2
                        ? nextEndMonth
                        : null,
                    )
                  }}
                  valueFormat="MM/YYYY"
                  minDate={reportStartMonth ?? undefined}
                  maxDate={
                    reportStartMonth
                      ? addMonths(reportStartMonth, 2)
                      : undefined
                  }
                  error={
                    isReportDateRangeInvalid
                      ? 'Mês final inválido'
                      : isReportPeriodTooLong
                        ? 'Período máximo de 3 meses'
                        : null
                  }
                  disabled={!reportStartMonth}
                  clearable
                />
                <Button
                  leftSection={<Search size={16} />}
                  onClick={handleSearch}
                  disabled={isReportActionDisabled}
                >
                  Pesquisar
                </Button>
                <Button
                  variant="subtle"
                  onClick={() => {
                    setReportStartMonth(null)
                    setReportEndMonth(null)
                    setAppliedReportStartMonth(null)
                    setAppliedReportEndMonth(null)
                    setPage(1)
                  }}
                  disabled={
                    !reportStartMonth &&
                    !reportEndMonth &&
                    !appliedReportStartMonth &&
                    !appliedReportEndMonth
                  }
                >
                  Limpar
                </Button>
                <Button
                  color="green"
                  variant="light"
                  leftSection={<FileSpreadsheet size={16} />}
                  onClick={handleDownloadExcel}
                  loading={isDownloadingReport}
                  disabled={isReportActionDisabled}
                >
                  Download Excel
                </Button>
              </Group>
            </Group>

            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Período</Table.Th>
                    <Table.Th>Data</Table.Th>
                    <Table.Th>Resultado Geral</Table.Th>
                    <Table.Th>Classificação</Table.Th>
                    <Table.Th>Avaliador</Table.Th>
                    <Table.Th>Ações</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {evaluations.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={6} style={{ textAlign: 'center' }}>
                        <Text c="dimmed" my="md">
                          Nenhuma avaliação encontrada.
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    evaluations.map((evaluation) => {
                      const classInfo = evaluation.finalClassification
                        ? getClassificationInfoByLabel(
                            evaluation.finalClassification,
                          )
                        : undefined
                      return (
                        <Table.Tr key={evaluation.id}>
                          <Table.Td>
                            <Text fw={500}>
                              {evaluation.periodLabel
                                ? `${evaluation.periodLabel}/${evaluation.evaluationYear}`
                                : formatPeriodLabel(
                                    evaluation.periodNumber,
                                    evaluation.evaluationYear,
                                  )}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">
                              {formatDateBR(evaluation.evaluationDate)}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm" fw={600}>
                              {formatScore(evaluation.finalScore)}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            {evaluation.finalClassification ? (
                              <Badge
                                color={classInfo?.color ?? 'gray'}
                                variant="light"
                                size="sm"
                              >
                                {evaluation.finalClassification}
                              </Badge>
                            ) : (
                              <Text size="sm" c="dimmed">
                                —
                              </Text>
                            )}
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{evaluation.evaluatorName}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Group gap="xs" wrap="nowrap">
                              <Button
                                variant="light"
                                size="xs"
                                px="xs"
                                onClick={() => handleView(evaluation.id)}
                              >
                                <Eye size={14} />
                              </Button>
                              {isMasterUser && (
                                <>
                                  <Button
                                    variant="light"
                                    color="blue"
                                    size="xs"
                                    px="xs"
                                    onClick={() =>
                                      handleEditClick(evaluation.id)
                                    }
                                  >
                                    <Pencil size={14} />
                                  </Button>
                                  <Button
                                    variant="light"
                                    color="red"
                                    size="xs"
                                    px="xs"
                                    onClick={() =>
                                      handleDeleteClick(evaluation.id)
                                    }
                                    loading={isDeleting}
                                    disabled={isDeleting}
                                  >
                                    <Trash size={14} />
                                  </Button>
                                </>
                              )}
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      )
                    })
                  )}
                </Table.Tbody>
              </Table>
            </Card>
            <Pagination
              value={page}
              onChange={setPage}
              total={Math.ceil(evaluationsCount / Number(pageSize))}
              totalOfItems={evaluationsCount}
              pageSize={pageSize}
              onPageSizeChange={handlePageSizeChange}
              disabled={isLoadingEvaluations || evaluationsCount === 0}
            />
          </Grid.Col>
        )}

        {activeView === 'add' && (
          <Grid.Col span={12}>
            <Group justify="space-between" mb="md">
              <Button
                variant="subtle"
                leftSection={<ArrowLeft size={16} />}
                onClick={() => setActiveView('list')}
              >
                Voltar para listagem
              </Button>
              <Text size="sm" fw={500}>
                {editingId ? 'Editar Avaliação' : 'Nova Avaliação'}
              </Text>
            </Group>

            <Box pos="relative">
              <LoadingOverlay
                visible={isSaving || (editingId !== null && isLoadingDetails)}
                zIndex={1000}
                overlayProps={{ radius: 'sm', blur: 2 }}
              />

              <Grid>
                <Grid.Col span={12}>
                  <Paper withBorder p="md" radius="md">
                    <Text size="lg" fw={600} mb="md">
                      Informações Gerais
                    </Text>
                    <Grid>
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <Select
                          label="Período"
                          placeholder="Selecione o período"
                          data={periodNumberOptions}
                          value={
                            newEvaluation.periodNumber
                              ? String(newEvaluation.periodNumber)
                              : null
                          }
                          onChange={(value) =>
                            setNewEvaluation((prev) => ({
                              ...prev,
                              periodNumber: value ? Number(value) : undefined,
                            }))
                          }
                          required
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <Select
                          label="Ano"
                          placeholder="Selecione o ano"
                          data={yearOptions}
                          value={
                            newEvaluation.evaluationYear
                              ? String(newEvaluation.evaluationYear)
                              : null
                          }
                          onChange={(value) => {
                            setNewEvaluation((prev) => ({
                              ...prev,
                              evaluationYear: value ? Number(value) : undefined,
                            }))
                          }}
                          required
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, md: 4 }}>
                        <DateInput
                          label="Data da Avaliação"
                          placeholder="Selecione a data"
                          value={evaluationDate}
                          onChange={(date) => {
                            if (!date) return
                            const parsedDate = new Date(date)
                            if (!Number.isNaN(parsedDate.getTime())) {
                              setEvaluationDate(parsedDate)
                            }
                          }}
                          valueFormat="DD/MM/YYYY"
                          required
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, md: 8 }}>
                        <TextInput
                          label="Avaliador"
                          placeholder="Nome do avaliador"
                          value={newEvaluation.evaluatorName}
                          onChange={(e) =>
                            setNewEvaluation((prev) => ({
                              ...prev,
                              evaluatorName: e.target.value,
                            }))
                          }
                          required
                        />
                      </Grid.Col>
                    </Grid>
                  </Paper>
                </Grid.Col>

                <Grid.Col span={12}>
                  <Paper withBorder p="md" radius="md">
                    <Text size="lg" fw={600} mb="md">
                      Critérios de Avaliação
                    </Text>
                    <CriteriaScoresList
                      criteria={criteria}
                      scores={scores}
                      onScoreChange={handleCriterionScoreChange}
                    />
                  </Paper>
                </Grid.Col>

                <Grid.Col span={12}>
                  <Grid>
                    <Grid.Col span={{ base: 12, md: 8 }}>
                      <Paper withBorder p="md" radius="md" h="100%">
                        <Text size="lg" fw={600} mb="sm">
                          Comentários e Feedbacks
                        </Text>
                        <Textarea
                          placeholder="Observações adicionais e comentários gerais"
                          value={newEvaluation.comments}
                          onChange={(e) =>
                            setNewEvaluation((prev) => ({
                              ...prev,
                              comments: e.target.value,
                            }))
                          }
                          minRows={4}
                          styles={{ input: { height: '100px' } }}
                        />
                      </Paper>
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, md: 4 }}>
                      {(() => {
                        const classInfo =
                          getClassificationInfo(calculatedFormScore)
                        return (
                          <Paper
                            withBorder
                            p="md"
                            radius="md"
                            bg="light-dark(var(--mantine-color-blue-0), var(--mantine-color-dark-6))"
                            h="100%"
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              alignItems: 'center',
                              borderColor:
                                'light-dark(var(--mantine-color-blue-3), var(--mantine-color-dark-4))',
                            }}
                          >
                            <Text
                              size="md"
                              fw={600}
                              c="light-dark(var(--mantine-color-blue-8), var(--mantine-color-blue-3))"
                              mb="xs"
                            >
                              {isAllCriteriaScored
                                ? 'Resultado Final'
                                : 'Resultado Parcial'}
                            </Text>
                            <Text
                              fw={900}
                              c="light-dark(var(--mantine-color-blue-9), var(--mantine-color-blue-2))"
                              style={{ fontSize: '2.5rem' }}
                            >
                              {calculatedFormScore.toFixed(2).replace('.', ',')}
                              %
                            </Text>
                            {classInfo ? (
                              <>
                                <Badge
                                  color={classInfo.color}
                                  variant="light"
                                  size="sm"
                                  mt="xs"
                                >
                                  {classInfo.label}
                                </Badge>
                                <Text
                                  size="xs"
                                  c="dimmed"
                                  ta="center"
                                  mt={4}
                                  fs="italic"
                                >
                                  {classInfo.action}
                                </Text>
                              </>
                            ) : (
                              <Text
                                size="xs"
                                c="light-dark(var(--mantine-color-blue-6), var(--mantine-color-blue-3))"
                                ta="center"
                                mt="sm"
                              >
                                {isAllCriteriaScored
                                  ? 'Média ponderada baseada no peso dos critérios'
                                  : `${selectedCriteriaCount}/${criteria.length} critérios avaliados`}
                              </Text>
                            )}
                          </Paper>
                        )
                      })()}
                    </Grid.Col>
                  </Grid>
                </Grid.Col>

                <Grid.Col span={12}>
                  <Group justify="flex-end" mt="md">
                    <Button
                      variant="outline"
                      onClick={() => setActiveView('list')}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={
                        !newEvaluation.periodType ||
                        !newEvaluation.periodNumber ||
                        !newEvaluation.evaluationYear ||
                        !newEvaluation.evaluatorName ||
                        Boolean(editingId && !isMasterUser) ||
                        isSaving
                      }
                    >
                      Salvar Avaliação
                    </Button>
                  </Group>
                </Grid.Col>
              </Grid>
            </Box>
          </Grid.Col>
        )}
      </Grid>

      <Modal
        opened={viewOpened}
        onClose={closeView}
        title="Detalhes da Avaliação"
        size="lg"
      >
        <Box pos="relative" style={{ minHeight: 150 }}>
          <LoadingOverlay
            visible={isLoadingDetails}
            zIndex={1000}
            overlayProps={{ radius: 'sm', blur: 2 }}
          />
          {viewingEvaluation && (
            <Grid>
              <Grid.Col span={6}>
                <Text size="sm" fw={500}>
                  Período
                </Text>
                <Text size="sm">
                  {viewingEvaluation.periodLabel
                    ? `${viewingEvaluation.periodLabel}/${viewingEvaluation.evaluationYear}`
                    : formatPeriodLabel(
                        viewingEvaluation.periodNumber,
                        viewingEvaluation.evaluationYear,
                      )}
                </Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="sm" fw={500}>
                  Data
                </Text>
                <Text size="sm">
                  {formatDateBR(viewingEvaluation.evaluationDate)}
                </Text>
              </Grid.Col>

              <Grid.Col span={12} my="sm">
                <Text size="sm" fw={600} mb="sm">
                  Pontuações por Critério
                </Text>
                <Grid>
                  {viewingEvaluation.criterionScores.map((cs) => (
                    <Grid.Col span={6} key={cs.id}>
                      <Text size="sm" fw={500}>
                        {cs.criterion.name}
                      </Text>
                      <Text size="sm" c="dimmed" mt={4}>
                        {getEvaluationScoreLabel(cs.score)}
                      </Text>
                    </Grid.Col>
                  ))}
                </Grid>
              </Grid.Col>

              <Grid.Col span={6}>
                <Text size="sm" fw={500}>
                  Resultado Geral
                </Text>
                <Text size="sm" fw={600}>
                  {formatScore(viewingEvaluation.finalScore)}
                </Text>
              </Grid.Col>

              <Grid.Col span={6}>
                <Text size="sm" fw={500}>
                  Classificação
                </Text>
                {viewingEvaluation.finalClassification ? (
                  (() => {
                    const info = getClassificationInfoByLabel(
                      viewingEvaluation.finalClassification,
                    )
                    return (
                      <>
                        <Badge
                          color={info?.color ?? 'gray'}
                          variant="light"
                          size="md"
                          mt={4}
                        >
                          {viewingEvaluation.finalClassification}
                        </Badge>
                        {info && (
                          <Text size="xs" c="dimmed" mt={4} fs="italic">
                            {info.action}
                          </Text>
                        )}
                      </>
                    )
                  })()
                ) : (
                  <Text size="sm" c="dimmed">
                    —
                  </Text>
                )}
              </Grid.Col>

              <Grid.Col span={6}>
                <Text size="sm" fw={500}>
                  Avaliador
                </Text>
                <Text size="sm">{viewingEvaluation.evaluatorName}</Text>
              </Grid.Col>

              {viewingEvaluation.comments && (
                <Grid.Col span={12}>
                  <Text size="sm" fw={500}>
                    Comentários
                  </Text>
                  <Text size="sm">{viewingEvaluation.comments}</Text>
                </Grid.Col>
              )}
            </Grid>
          )}
        </Box>
      </Modal>
    </Box>
  )
}
