import { object, z } from 'zod'

const dateSchema = (message: string, isOptional = false) => {
  const baseSchema = z.date({ message }).min(new Date('1900-01-01'), {
    message: 'Digite uma data válida',
  })

  const preprocessFn = (value: unknown) => {
    if (value instanceof Date) return value
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (trimmed === '') return undefined

      const parts = trimmed.split('/')
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10)
        const month = parseInt(parts[1], 10) - 1
        const year = parseInt(parts[2], 10)
        const date = new Date(year, month, day)
        return isNaN(date.getTime()) ? value : date
      }
      const date = new Date(trimmed)
      return isNaN(date.getTime()) ? value : date
    }
    return value
  }

  if (isOptional) {
    return z.preprocess(preprocessFn, baseSchema.nullish())
  }
  return z.preprocess(preprocessFn, baseSchema)
}

export const employeeSchema = object({
  role: z
    .string({
      message: 'Selecione o cargo',
    })
    .trim()
    .min(1, {
      message: 'Selecione o cargo',
    })
    .max(120, {
      message: 'Selecione o cargo',
    })
    .nullish(),
  educationalLevelId: z
    .string({
      message: 'Selecione o grau de escolaridade',
    })
    .trim()
    .min(1, {
      message: 'Selecione o grau de escolaridade',
    })
    .max(120, {
      message: 'Selecione o grau de escolaridade',
    }),
  nationalityId: z
    .string({
      message: 'Selecione a nacionalidade',
    })
    .trim()
    .min(1, {
      message: 'Selecione a nacionalidade',
    })
    .max(120, {
      message: 'Selecione a nacionalidade',
    }),
  maritalStatusId: z
    .string({
      message: 'Selecione o estado civil',
    })
    .trim()
    .min(1, {
      message: 'Selecione o estado civil',
    })
    .max(120, {
      message: 'Selecione o estado civil',
    }),
  genderId: z
    .string({
      message: 'Selecione o gênero',
    })
    .trim()
    .min(1, {
      message: 'Selecione o gênero',
    })
    .max(120, {
      message: 'Selecione o gênero',
    }),
  jobPosition: z.string().nullish(),
  fullName: z
    .string({
      message: 'Digite o nome completo',
    })
    .trim()
    .min(5, {
      message: 'Digite o nome completo',
    }),
  taxpayerIdentification: z
    .string({
      message: 'Digite o CPF',
    })
    .trim()
    .min(14, 'CPF inválido')
    .max(14, 'CPF inválido'),
  nationalIdentification: z.string().nullish().nullable(),
  registration: z.string().nullish(),
  cellPhone: z
    .string({
      message: 'Digite o celular',
    })
    .trim()
    .min(15, {
      message: 'Celular inválido',
    })
    .max(16, {
      message: 'Celular inválido',
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
  birthday: dateSchema('Digite a data de nascimento'),
  employerContractDate: dateSchema('Digite a data do contrato', true),
  employerEndContractDate: dateSchema('Digite a data do contrato', true),
  employerContractObject: z
    .string({
      message: 'Digite o objeto do contrato',
    })
    .trim()
    .max(255)
    .optional(),
  employerName: z
    .string({
      message: 'Digite a razão social',
    })
    .trim()
    .min(5, {
      message: 'Digite a razão social',
    })
    .max(255),
  employerNumber: z
    .string({
      message: 'Digite o CNPJ',
    })
    .trim()
    .min(18, {
      message: 'CNPJ inválido',
    })
    .max(18),
  manager: z
    .string({
      message: 'Digite o gestor',
    })
    .trim()
    .max(150)
    .optional(),
  status: z
    .string({
      message: 'Selecione o status',
    })
    .trim()
    .min(1, {
      message: 'Selecione o status',
    })
    .max(120, {
      message: 'Selecione o status',
    })
    .nullish(),
  hasSolutisAsset: z.boolean().default(false),
  hasPersonalAsset: z.boolean().default(false),
  hasOtherAsset: z.boolean().default(false),
  toLegalPerson: z.boolean().default(false),
})

export const employeeAddressSchema = object({
  address: z.object({
    postalCode: z
      .string({
        message: 'Digite o CEP',
      })
      .trim()
      .min(9, {
        message: 'CEP inválido',
      })
      .max(9),
    neighbourhood: z
      .string({
        message: 'Digite o bairro',
      })
      .trim()
      .min(3, {
        message: 'Digite o bairro',
      })
      .max(255),
    city: z
      .string({
        message: 'Digite a cidade',
      })
      .trim()
      .min(1, {
        message: 'Digite a cidade',
      }),
    state: z
      .string({
        message: 'Selecione o estado',
      })
      .trim()
      .min(2, {
        message: 'Selecione o estado',
      })
      .max(255),
    street: z
      .string({
        message: 'Digite a rua/logradouro',
      })
      .trim()
      .min(2, {
        message: 'Digite a rua',
      })
      .max(255),
    number: z
      .string({
        message: 'Campo obrigatório',
      })
      .trim()
      .min(1, {
        message: 'Campo obrigatório',
      })
      .max(20),
    complement: z
      .string({
        message: 'Digite o complemento do endereço',
      })
      .trim()
      .max(255),
  }),
})
