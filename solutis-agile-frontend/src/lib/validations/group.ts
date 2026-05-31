import { z } from 'zod'

export const groupSchema = z.object({
  name: z.string().min(3).max(255),
  permissions: z.array(z.number()),
})
