import { z } from 'zod'

export const invoiceSchema = z.object({
  number: z.string().min(3).max(255),
  assetsId: z.array(z.string()).min(1),
})
