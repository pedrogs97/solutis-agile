import { z } from 'zod'

import {
  typeAccessoriesInput,
  typeComputerInputs,
  typeModelInput,
  typePatrimonialInputs,
  typePhoneInput,
} from '@/constants/assetTypes'

const validatePatrimonialInputs = (
  registerNumber: string,
  serialNumber: string,
  refinementContext: z.RefinementCtx,
  typeId: string,
) => {
  if (registerNumber === '' && typeId !== '10') {
    refinementContext.addIssue({
      code: 'custom',
      message: 'Digite o número do patrimônio',
      path: ['registerNumber'],
    })
  }

  if (serialNumber === '') {
    refinementContext.addIssue({
      code: 'custom',
      message: 'Digite o número de série',
      path: ['serialNumber'],
    })
  }
}

const validateComputerInputs = (
  pattern: string,
  operationalSystem: string,
  configuration: string,
  refinementContext: z.RefinementCtx,
) => {
  if (pattern === '') {
    refinementContext.addIssue({
      code: 'custom',
      message: 'Selecione o padrão',
      path: ['pattern'],
    })
  }

  if (operationalSystem === '') {
    refinementContext.addIssue({
      code: 'custom',
      message: 'Digite o sistema operacional',
      path: ['operationalSystem'],
    })
  }

  if (configuration === '') {
    refinementContext.addIssue({
      code: 'custom',
      message: 'Digite a configuração',
      path: ['configuration'],
    })
  }
}

const validatePhoneInputs = (
  imei: string,
  lineNumber: string,
  operator: string,
  refinementContext: z.RefinementCtx,
) => {
  if (imei === '') {
    refinementContext.addIssue({
      code: 'custom',
      message: 'Digite o IMEI',
      path: ['imei'],
    })
  }

  if (lineNumber === '') {
    refinementContext.addIssue({
      code: 'custom',
      message: 'Digite a linha telefônica',
      path: ['lineNumber'],
    })
  }

  if (operator === '') {
    refinementContext.addIssue({
      code: 'custom',
      message: 'Digite a operadora',
      path: ['operator'],
    })
  }
}

const validateAccessoryInput = (
  accessories: string,
  refinementContext: z.RefinementCtx,
) => {
  if (accessories === '') {
    refinementContext.addIssue({
      code: 'custom',
      message: 'Digite os acessórios',
      path: ['accessories'],
    })
  }
}

const validateModelInput = (
  model: string,
  refinementContext: z.RefinementCtx,
) => {
  if (model === '') {
    refinementContext.addIssue({
      code: 'custom',
      message: 'Digite o modelo',
      path: ['model'],
    })
  }
}

export const assetSchema = z
  .object({
    typeId: z
      .string({ message: 'Selecione o tipo de ativo' })
      .min(1, {
        message: 'Selecione o tipo de ativo',
      })
      .max(255),
    statusId: z.string({ message: 'Selecione a situação do ativo' }).min(1, {
      message: 'Selecione a situação do ativo',
    }),
    invoiceNumber: z.string().optional(),
    code: z.string().optional(),
    registerNumber: z.string().optional(),
    description: z
      .string({ message: 'Digite a descrição' })
      .min(1, {
        message: 'Digite a descrição',
      })
      .max(255),
    supplier: z.string().optional(),
    assuranceDate: z.coerce.date().optional(),
    observations: z.string().optional(),
    discardReason: z.string().optional(),
    pattern: z.string().optional(),
    operationalSystem: z.string().optional(),
    serialNumber: z.string().optional(),
    imei: z.string().optional(),
    acquisitionDate: z.coerce.date().optional(),
    value: z
      .number({
        message: 'Digite o valor do ativo',
      })
      .safe('Digite um número válido')
      .nonnegative('Digite um número válido'),
    depreciation: z.number().optional(),
    msOffice: z.boolean().default(false),
    lineNumber: z.string().optional(),
    operator: z.string().optional(),
    model: z.string().optional(),
    accessories: z.string().optional(),
    configuration: z.string().optional().nullish(),
    quantity: z.number().optional(),
    unit: z.string().optional(),
    active: z.boolean().default(true),
    byAgile: z.boolean().optional(),
  })
  .superRefine((schema, refinementContext) => {
    if (typePatrimonialInputs.indexOf(schema.typeId) !== -1) {
      validatePatrimonialInputs(
        schema.registerNumber ?? '',
        schema.serialNumber ?? '',
        refinementContext,
        schema.typeId,
      )
    }

    if (typeAccessoriesInput.indexOf(schema.typeId) !== -1) {
      validateAccessoryInput(schema.accessories ?? '', refinementContext)
    }

    if (typeComputerInputs.indexOf(schema.typeId) !== -1) {
      validateComputerInputs(
        schema.pattern ?? '',
        schema.operationalSystem ?? '',
        schema.configuration ?? '',
        refinementContext,
      )
    }

    if (typePhoneInput.indexOf(schema.typeId) !== -1) {
      validatePhoneInputs(
        schema.imei ?? '',
        schema.lineNumber ?? '',
        schema.operator ?? '',
        refinementContext,
      )
    }

    if (typeModelInput.indexOf(schema.typeId) !== -1) {
      validateModelInput(schema.model ?? '', refinementContext)
    }
  })

export const maintenanceSchema = z.object({
  assetId: z.string().optional().nullable().nullish(),
  actionId: z.string({ message: 'Selecione a ação' }).min(1, {
    message: 'Selecione a ação',
  }),
  glpiNumber: z.string().optional(),
  openDateGlpi: z
    .union([z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/), z.literal('')])
    .optional()
    .nullish(),
  openDateSupplier: z
    .union([z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/), z.literal('')])
    .optional()
    .nullish(),
  supplierNumber: z.string().optional(),
  supplierServiceOrder: z.string().optional().nullish(),
  incidentDescription: z.string().optional(),
  resolution: z.string().optional(),
  employeeId: z.string({ message: 'Selecione o colaborador' }),
  close: z.boolean().default(false),
  inProgress: z.boolean().default(false),
  value: z.number({ error: 'Digite um valor númerico' }).default(0.0),
  criticalityId: z.string().optional(),
  hasAssurance: z.boolean().default(false),
})

export const upgradeSchema = z.object({
  assetId: z.string().optional().nullable().nullish(),
  employeeId: z.string({ message: 'Selecione o colaborador' }),
  value: z.number({ error: 'Digite um valor númerico' }).optional(),
  detailing: z.string().optional(),
  supplier: z.string().optional(),
  invoiceNumber: z.string().optional(),
  observations: z.string().optional(),
  close: z.boolean().default(false).optional(),
  inProgress: z.boolean().default(false).optional(),
})
