import type { EvaluationFixedScoreValue } from '@/types/evaluation'

export const EVALUATION_SCORE_LEVELS: {
  label: string
  value: EvaluationFixedScoreValue
}[] = [
  { label: 'Muito Insatisfeito', value: 0 },
  { label: 'Insatisfeito', value: 20 },
  { label: 'Regularmente Insatisfeito', value: 40 },
  { label: 'Regularmente Satisfeito', value: 60 },
  { label: 'Satisfeito', value: 80 },
  { label: 'Muito Satisfeito', value: 100 },
]

export const EVALUATION_SCORE_SELECT_OPTIONS = EVALUATION_SCORE_LEVELS.map(
  (level) => ({
    value: String(level.value),
    label: level.label,
  }),
)

export const getEvaluationScoreLabel = (
  score: number | string | null | undefined,
): string => {
  if (score === null || score === undefined) return '-'
  const normalizedScore = Number(score)
  if (Number.isNaN(normalizedScore)) return '-'

  const level = EVALUATION_SCORE_LEVELS.find(
    (item) => item.value === normalizedScore,
  )
  return level ? level.label : normalizedScore.toFixed(2).replace('.', ',')
}

export const parseEvaluationScoreValue = (
  value: string | null,
): EvaluationFixedScoreValue | null => {
  if (!value) return null
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return null

  const hasLevel = EVALUATION_SCORE_LEVELS.some(
    (level) => level.value === parsed,
  )
  if (!hasLevel) return null

  return parsed as EvaluationFixedScoreValue
}

export interface ClassificationInfo {
  label: string
  color: string
  action: string
}

export const CLASSIFICATION_TABLE: ClassificationInfo[] = [
  {
    label: 'Excelente',
    color: 'green',
    action: 'Manter e priorizar em futuras negociações',
  },
  {
    label: 'Muito Bom',
    color: 'blue',
    action: 'Manter parceria e monitorar desempenho',
  },
  {
    label: 'Regular',
    color: 'yellow',
    action: 'Avaliar pontos de melhoria e reavaliar futuro',
  },
  {
    label: 'Insatisfatório',
    color: 'red',
    action: 'Considerar substituição ou renegociação',
  },
]

export const getClassificationInfo = (
  score: number | string | null | undefined,
): ClassificationInfo | null => {
  const s = Number(score)
  if (!score || Number.isNaN(s) || s <= 0) return null
  if (s >= 95) return CLASSIFICATION_TABLE[0]!
  if (s >= 90) return CLASSIFICATION_TABLE[1]!
  if (s >= 80) return CLASSIFICATION_TABLE[2]!
  return CLASSIFICATION_TABLE[3]!
}

export const getClassificationInfoByLabel = (
  label: string,
): ClassificationInfo | undefined =>
  CLASSIFICATION_TABLE.find((c) => c.label === label)
