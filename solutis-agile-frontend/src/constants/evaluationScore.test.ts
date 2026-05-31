import { describe, expect, it } from 'vitest'

import {
  CLASSIFICATION_TABLE,
  EVALUATION_SCORE_LEVELS,
  getClassificationInfo,
  getClassificationInfoByLabel,
  getEvaluationScoreLabel,
  parseEvaluationScoreValue,
} from './evaluationScore'

describe('EVALUATION_SCORE_LEVELS', () => {
  it('maps the fixed labels to the expected percentual values', () => {
    expect(EVALUATION_SCORE_LEVELS).toEqual([
      { label: 'Muito Insatisfeito', value: 0 },
      { label: 'Insatisfeito', value: 20 },
      { label: 'Regularmente Insatisfeito', value: 40 },
      { label: 'Regularmente Satisfeito', value: 60 },
      { label: 'Satisfeito', value: 80 },
      { label: 'Muito Satisfeito', value: 100 },
    ])
  })
})

describe('parseEvaluationScoreValue', () => {
  it('parses only allowed fixed score values', () => {
    expect(parseEvaluationScoreValue('0')).toBe(0)
    expect(parseEvaluationScoreValue('20')).toBe(20)
    expect(parseEvaluationScoreValue('40')).toBe(40)
    expect(parseEvaluationScoreValue('60')).toBe(60)
    expect(parseEvaluationScoreValue('80')).toBe(80)
    expect(parseEvaluationScoreValue('100')).toBe(100)

    expect(parseEvaluationScoreValue('50')).toBeNull()
    expect(parseEvaluationScoreValue(null)).toBeNull()
  })
})

describe('getEvaluationScoreLabel', () => {
  it('returns display labels for fixed scores', () => {
    expect(getEvaluationScoreLabel(60)).toBe('Regularmente Satisfeito')
    expect(getEvaluationScoreLabel('100.00')).toBe('Muito Satisfeito')
  })

  it('returns formatted number for non-fixed scores', () => {
    expect(getEvaluationScoreLabel('73')).toBe('73,00')
  })

  it('returns dash for invalid input', () => {
    expect(getEvaluationScoreLabel(undefined)).toBe('-')
    expect(getEvaluationScoreLabel(null)).toBe('-')
  })
})

describe('CLASSIFICATION_TABLE', () => {
  it('has 4 entries in correct order', () => {
    expect(CLASSIFICATION_TABLE.map((c) => c.label)).toEqual([
      'Excelente',
      'Muito Bom',
      'Regular',
      'Insatisfatório',
    ])
  })
})

describe('getClassificationInfo', () => {
  it('returns Excelente for score >= 95', () => {
    expect(getClassificationInfo(95)?.label).toBe('Excelente')
    expect(getClassificationInfo(100)?.label).toBe('Excelente')
  })

  it('returns Muito Bom for 90-94', () => {
    expect(getClassificationInfo(90)?.label).toBe('Muito Bom')
    expect(getClassificationInfo(94)?.label).toBe('Muito Bom')
  })

  it('returns Regular for 80-89', () => {
    expect(getClassificationInfo(80)?.label).toBe('Regular')
    expect(getClassificationInfo(89)?.label).toBe('Regular')
  })

  it('returns Insatisfatório for score between 1 and 79', () => {
    expect(getClassificationInfo(79)?.label).toBe('Insatisfatório')
    expect(getClassificationInfo(1)?.label).toBe('Insatisfatório')
  })

  it('returns null for zero, null or undefined (no score set)', () => {
    expect(getClassificationInfo(0)).toBeNull()
    expect(getClassificationInfo(null)).toBeNull()
    expect(getClassificationInfo(undefined)).toBeNull()
  })
})

describe('getClassificationInfoByLabel', () => {
  it('finds entry by label', () => {
    expect(getClassificationInfoByLabel('Regular')?.color).toBe('yellow')
    expect(getClassificationInfoByLabel('Excelente')?.color).toBe('green')
  })

  it('returns undefined for unknown label', () => {
    expect(getClassificationInfoByLabel('Desconhecido')).toBeUndefined()
  })
})
