import { type AssetType } from './Asset'
import { type Lending } from './Lending'

export interface VerificationCategory {
  id: number
  name: string
}

export interface VerificationAnswerOption {
  id: number
  verificationId: number
  name: string
}

export interface VerificationType {
  id: number
  name: string
}

export interface Verification {
  id: number
  assetType: AssetType | string
  assetTypeId: number
  category: VerificationCategory | null | string
  categoryId: number | null
  options: VerificationAnswerOption[] | string[]
  question: string
  step: string
}

export interface VerificationAnswer {
  id: number
  lending: Lending
  lendingId: number
  verification: Verification | null
  verificationId: number | null
  type: VerificationType
  typeId: number
  answer: string
  observations: string | null
}
