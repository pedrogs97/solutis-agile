import { z } from 'zod'

export const invertoryAccesSchema = z.object({
  registration: z.string().min(1, {
    message: 'Digite sua matrícula',
  }),
  birthday: z.string().optional().nullish(),
  accept: z
    .string()
    .optional()
    .refine((value) => value !== '0' && value !== '', {
      message: 'Você precisa aceitar os termos',
    }),
})
