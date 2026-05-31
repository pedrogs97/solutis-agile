export interface EvaluationCriterion {
  id: number
  name: string
  description: string
  weight: string | number
  order: number
}

export interface CriterionScore {
  criterion: number
  score: number | string
  comments?: string
}

export type EvaluationFixedScoreValue = 0 | 20 | 40 | 60 | 80 | 100

export type EvaluationPeriodType = 'QUADRIMESTER' | 'SEMESTER'

export interface SupplierEvaluation {
  id: number
  supplier: {
    id: number
    name: string
    tradeName?: string
  }
  evaluationYear: number
  periodType: EvaluationPeriodType
  periodNumber: number
  periodLabel: string
  evaluatorName: string
  evaluationDate: string
  comments: string
  finalScore: string
  finalClassification?: string
}

export interface SupplierEvaluationDetail extends SupplierEvaluation {
  criterionScores: {
    id: number
    criterion: EvaluationCriterion
    score: string
    comments: string
  }[]
  averageScore?: {
    previousEvaluationsCount: number
    average: string
    min: string
    max: string
  }
  criteriaBreakdown?: Record<string, string>
  createdAt: string
  updatedAt: string
}

export interface CreateSupplierEvaluationPayload {
  supplier: number
  evaluationYear: number
  periodType: EvaluationPeriodType
  periodNumber: number
  evaluatorName: string
  evaluationDate?: string
  comments?: string
  criterionScores?: CriterionScore[]
}
