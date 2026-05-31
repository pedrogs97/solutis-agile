import { z } from 'zod'

export const lendingSchema = z.object({
  employeeId: z
    .string({
      message: 'Selecione o colaborador',
    })
    .min(1, 'Necessário informar o colaborador'),
  assetId: z
    .string({
      message: 'Selecione o ativo',
    })
    .min(1, 'Necessário informar o ativo'),
  msOffice: z.boolean().default(false),
  bu: z
    .string({
      message: 'Selecione o BU',
    })
    .min(1, 'Necessário informar o BU'),
  workloadId: z
    .string({
      message: 'Selecione a lotação',
    })
    .min(1, 'Necessário informar a lotação'),
  witnessesId: z
    .array(z.string())
    .min(2, 'É necessário informar 2 testemunhas')
    .max(2, 'É permitido até 2 testemunhas')
    .refine(
      (arr) => {
        const nonEmpty = arr.filter((item) => item !== '')
        return (
          nonEmpty.length === 0 || nonEmpty.length === new Set(nonEmpty).size
        )
      },
      { message: 'Não é permitido testemunhas iguais' },
    ),
  witnessesRevokeId: z
    .array(
      z.string({
        message: 'Selecione as testemunhas',
      }),
    )
    .nullable()
    .nullish(),
  costCenterId: z
    .string({
      message: 'Selecione o centro de custo',
    })
    .min(1, 'Necessário informar o centro de custo'),
  manager: z
    .string({
      message: 'Digite o gestor',
    })
    .min(1, 'Necessário informar o gestor'),
  observations: z
    .string({
      message: 'Digite as observações',
    })
    .nullable()
    .nullish()
    .optional(),
  glpiNumber: z
    .string({
      message: 'Digite o número GLPI',
    })
    .nullable()
    .nullish(),
  project: z
    .string({
      message: 'Digite o projeto',
    })
    .nullable()
    .nullish(),
  businessExecutive: z
    .string({
      message: 'Digite o executivo',
    })
    .nullable()
    .nullish(),
  location: z
    .string({
      message: 'Digite a origem do contrato',
    })
    .min(1, 'Necessário informar a origem do contrato'),
  employeeSigner: z
    .string({
      message: 'Digite o e-mail do colaborador',
    })
    .email('E-mail inválido'),
  principalSigner: z
    .string({
      message: 'Selecione o e-mail do gestor',
    })
    .email('E-mail inválido'),
  legalPerson: z.boolean().default(false),
})

export const lendingQuestionVerificationSchema = z.object({
  answered: z
    .array(
      z.object({
        id: z.number(),
        question: z.string(),
        answer: z.string(),
        assetType: z.string(),
        options: z.array(z.string()),
        step: z.string(),
      }),
    )
    .default([]), // Always default to empty array, validation happens manually in submit handler
})

export const termSchema = z
  .object({
    type: z
      .string({
        message: 'Digite o tipo',
      })
      .min(1, 'Necessário informar o tipo'),
    workloadId: z
      .string({
        message: 'Digite a lotação',
      })
      .min(1, 'Digite a lotação'),
    employeeId: z.string().min(1, 'Necessário informar o colaborador'),
    costCenterId: z
      .string({
        message: 'Digite o centro de custo',
      })
      .min(1, 'Necessário informar o centro de custo'),
    manager: z
      .string({
        message: 'Digite o gestor',
      })
      .min(1, 'Necessário informar o gestor'),
    observations: z.string().nullish(),
    project: z.string().nullish(),
    businessExecutive: z
      .string({
        message: 'Digite o executivo',
      })
      .min(5, 'Informar o executivo'),
    location: z
      .string({
        message: 'Digite a origem do contrato',
      })
      .min(1, 'Necessário informar a origem do contrato'),
    description: z
      .string({
        message: 'Digite a descrição',
      })
      .min(1, 'Necessário informar a descrição'),
    value: z.number().nullish(),
    quantity: z.number().nullish(),
    size: z.string().nullish(),
    lineNumber: z.string().nullish(),
    operator: z.string().nullish(),
    witnessesRevokeId: z.array(z.string()).optional(),
  })
  .superRefine((schema, refinementContext) => {
    if (schema.type === '2' && (!schema.value || !schema.quantity)) {
      refinementContext.addIssue({
        code: 'custom',
        message: 'Digite o valor',
        path: ['value'],
      })
      refinementContext.addIssue({
        code: 'custom',
        message: 'Digite a quantidade',
        path: ['quantity'],
      })
      refinementContext.addIssue({
        code: 'custom',
        message: 'Digite o tamanho',
        path: ['size'],
      })
    }

    if (schema.type === '3' && (!schema.lineNumber || !schema.operator)) {
      refinementContext.addIssue({
        code: 'custom',
        message: 'Digite o número da linha',
        path: ['lineNumber'],
      })
      refinementContext.addIssue({
        code: 'custom',
        message: 'Digite a operadora',
        path: ['operator'],
      })
    }
  })
