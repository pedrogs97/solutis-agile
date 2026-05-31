import { z } from 'zod'

export const userAuthSchema = z.object({
  username: z.string().nonempty({
    message: 'Digite o seu nome de usuário',
  }),
  password: z.string().nonempty({
    message: 'Digite a sua senha',
  }),
})
