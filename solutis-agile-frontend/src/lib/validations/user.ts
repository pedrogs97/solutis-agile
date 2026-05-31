import { object, z } from 'zod'

export const userSchema = object({
  employeeId: z
    .string({
      message: 'Selecione um colaborador',
    })
    .trim()
    .max(255),
  groupId: z
    .string({
      message: 'Selecione um grupo',
    })
    .trim()
    .max(255),

  username: z
    .string({
      message: 'Digite o nome de usuário',
    })
    .min(4, { message: 'Nome de usuário deve ter pelo menos 4 caracteres' })
    .max(20, { message: 'Nome de usuário deve ter no máximo 20 caracteres' })
    .regex(/^(?!.*?[._]{2})[a-zA-Z0-9]+(?:[._][a-zA-Z0-9]+)*$/, {
      message:
        'Nome de usuário deve conter apenas letras, números, pontos e sublinhados, mas não consecutivamente ou no início/fim',
    }),
  email: z
    .string({
      message: 'Digite o e-mail',
    })
    .trim()
    .email({
      message: 'Digite um e-mail válido',
    })
    .max(60),
  manager: z
    .string({
      message: 'Digite o gestor',
    })
    .trim()
    .max(255),
  department: z
    .string({
      message: 'Digite o departamento',
    })
    .trim()
    .max(255),

  isStaff: z.boolean().default(false),
  isActive: z.boolean().default(true),
})
