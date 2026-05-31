import { z } from 'zod'

import {
  lendingQuestionVerificationSchema,
  lendingSchema,
} from '@/lib/validations/lending'

export type FormDataLendingContract = z.infer<typeof lendingSchema>

export type FormDataLendingQuestionVerification = z.infer<
  typeof lendingQuestionVerificationSchema
>
