import { notifications } from '@mantine/notifications'

/** Formats an ISO date string as dd/mm/yyyy without timezone conversion. */
export function formatDateBR(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr

  const [year, month, day] = dateStr.split('T')[0].split('-')
  if (!year || !month || !day) return dateStr

  return `${day}/${month}/${year}`
}

/** Converte um Date ou string para YYYY-MM-DD em horário local, evitando recuo de dia por UTC */
export function formatDateToLocalYMD(val: any): string | null {
  if (!val) return null

  // Se já for string no formato YYYY-MM-DD (ou com hora), extrai os componentes diretamente sem new Date()
  if (typeof val === 'string') {
    const ymdMatch = val.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (ymdMatch) {
      return `${ymdMatch[1]}-${ymdMatch[2]}-${ymdMatch[3]}`
    }
    const brMatch = val.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
    if (brMatch) {
      return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`
    }
  }

  const d = val instanceof Date ? val : new Date(val)
  if (Number.isNaN(d.getTime())) return null
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Converte string ISO ou YYYY-MM-DD para objeto Date em horário local ao meio-dia para evitar variações de fuso/DST */
export function parseLocalDateValue(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === 'string') {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (match) {
      const year = parseInt(match[1], 10)
      const month = parseInt(match[2], 10) - 1
      const day = parseInt(match[3], 10)
      return new Date(year, month, day, 12, 0, 0)
    }
    const matchBR = value.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
    if (matchBR) {
      const day = parseInt(matchBR[1], 10)
      const month = parseInt(matchBR[2], 10) - 1
      const year = parseInt(matchBR[3], 10)
      return new Date(year, month, day, 12, 0, 0)
    }
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

export interface VCLCalculationResult {
  monthlyDepreciation: number
  depreciatedMonths: number
  accumulatedDepreciation: number
  netBookValue: number
  isOutOfScope: boolean
  totalMonthsUsed: number
  totalLifespanMonths: number
  depreciationPercentage: number
  baseDepreciable: number
}

function roundToTwo(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100
}

/**
 * Cálculo automático do Valor Contábil Líquido (VCL)
 * Conforme Especificação Contábil (24/09/2026 · Beatriz Cunha)
 * Método: Depreciação linear mensal (mês de aquisição conta como mês cheio).
 *
 * 1. Base depreciável: valor de aquisição - valor residual
 * 2. Depreciação mensal: base depreciável ÷ vida útil em meses (2 casas decimais)
 * 3. Meses decorridos: (ano_ref - ano_aq) * 12 + (mês_ref - mês_aq) + 1
 * 4. Meses depreciados: menor valor entre decorridos e vida útil (>= 0)
 * 5. Depreciação acumulada: mensal * meses (no último mês, igual à base depreciável)
 * 6. VCL: valor de aquisição - depreciação acumulada (mínimo igual ao residual)
 */
export function calculateNetBookValue(
  acquisitionValue: number | null | undefined,
  acquisitionDate: string | Date | null | undefined,
  expectedLifespan: string | number | null | undefined = 60,
  referenceDate?: string | Date | null,
  residualValue: number | null | undefined = 0,
  writeOffDate?: string | Date | null
): VCLCalculationResult {
  const acqVal = Math.max(0, Number(acquisitionValue) || 0)
  const resVal = Math.max(0, Number(residualValue) || 0)
  const base = Math.max(0, acqVal - resVal)

  // Extrair vida útil em meses
  let lifespanMonths = 60
  if (typeof expectedLifespan === 'number') {
    if (expectedLifespan === 0) {
      lifespanMonths = 0
    } else if (expectedLifespan <= 25) {
      // Valor pequeno passado como anos (legado do form: "5 anos")
      lifespanMonths = expectedLifespan * 12
    } else {
      lifespanMonths = expectedLifespan
    }
  } else if (typeof expectedLifespan === 'string') {
    const text = expectedLifespan.toLowerCase().trim()
    const match = text.match(/(\d+)/)
    if (match) {
      const val = parseInt(match[1], 10)
      if (text.includes('mês') || text.includes('mes')) {
        lifespanMonths = val
      } else if (text.includes('ano')) {
        lifespanMonths = val * 12
      } else {
        lifespanMonths = val > 25 ? val : val * 12
      }
    }
  }

  // Ativo sem valor de aquisição ou sem data
  if (acqVal <= 0 || !acquisitionDate) {
    return {
      monthlyDepreciation: 0,
      depreciatedMonths: 0,
      accumulatedDepreciation: 0,
      netBookValue: acqVal,
      isOutOfScope: false,
      totalMonthsUsed: 0,
      totalLifespanMonths: lifespanMonths,
      depreciationPercentage: 0,
      baseDepreciable: base,
    }
  }

  const start = parseLocalDateValue(acquisitionDate)
  if (!start) {
    return {
      monthlyDepreciation: 0,
      depreciatedMonths: 0,
      accumulatedDepreciation: 0,
      netBookValue: acqVal,
      isOutOfScope: false,
      totalMonthsUsed: 0,
      totalLifespanMonths: lifespanMonths,
      depreciationPercentage: 0,
      baseDepreciable: base,
    }
  }

  // Data de referência efetiva (padrão hoje ou informada)
  let refDate = referenceDate ? parseLocalDateValue(referenceDate) || new Date() : new Date()

  // Se o bem foi baixado antes da data de referência, a depreciação para na baixa
  if (writeOffDate) {
    const parsedWriteOff = parseLocalDateValue(writeOffDate)
    if (parsedWriteOff && parsedWriteOff < refDate) {
      refDate = parsedWriteOff
    }
  }

  // Terrenos ou categorias sem depreciação (vida útil = 0)
  if (lifespanMonths === 0) {
    return {
      monthlyDepreciation: 0,
      depreciatedMonths: 0,
      accumulatedDepreciation: 0,
      netBookValue: acqVal,
      isOutOfScope: false,
      totalMonthsUsed: 0,
      totalLifespanMonths: 0,
      depreciationPercentage: 0,
      baseDepreciable: base,
    }
  }

  const monthly = roundToTwo(base / lifespanMonths)

  // Meses decorridos (mês de aquisição conta como mês cheio: + 1)
  const elapsedMonths =
    (refDate.getFullYear() - start.getFullYear()) * 12 +
    (refDate.getMonth() - start.getMonth()) +
    1

  const depreciatedMonths = Math.max(0, Math.min(elapsedMonths, lifespanMonths))

  // No último mês (ou após), fecha exatamente na base depreciável (absorve centavos)
  const accumulated =
    depreciatedMonths === lifespanMonths ? base : roundToTwo(monthly * depreciatedMonths)

  // O VCL nunca pode ficar menor que o valor residual
  const calculatedVCL = Math.max(resVal, roundToTwo(acqVal - accumulated))

  const isOutOfScope = depreciatedMonths >= lifespanMonths
  const depreciationPercentage =
    base > 0 ? roundToTwo((accumulated / base) * 100) : 100

  return {
    monthlyDepreciation: monthly,
    depreciatedMonths,
    accumulatedDepreciation: accumulated,
    netBookValue: calculatedVCL,
    isOutOfScope,
    totalMonthsUsed: elapsedMonths > 0 ? elapsedMonths : 0,
    totalLifespanMonths: lifespanMonths,
    depreciationPercentage,
    baseDepreciable: base,
  }
}

/**
 * Calcula tempo de utilização formatado a partir da data de aquisição até a data base.
 * Retorna ex: "3 anos e 4 meses", "5 meses" ou "Menos de 1 mês".
 */
export function calculateUsageTime(
  acquisitionDate: string | Date | null | undefined,
  baseDate?: string | Date | null
): string {
  if (!acquisitionDate) return ''
  const start = parseLocalDateValue(acquisitionDate)
  if (!start) return ''
  const end = baseDate ? parseLocalDateValue(baseDate) || new Date() : new Date()

  let years = end.getFullYear() - start.getFullYear()
  let months = end.getMonth() - start.getMonth()

  if (months < 0) {
    years -= 1
    months += 12
  }

  if (years < 0) return ''

  if (years === 0 && months === 0) return 'Menos de 1 mês'
  if (years === 0) return `${months} ${months === 1 ? 'mês' : 'meses'}`
  if (months === 0) return `${years} ${years === 1 ? 'ano' : 'anos'}`
  return `${years} ${years === 1 ? 'ano' : 'anos'} e ${months} ${months === 1 ? 'mês' : 'meses'}`
}

export function formatDate(input: string | number): string {
  const date = new Date(input)
  return date.toLocaleDateString('pt-BR', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatMoneyBRL(input: number | null): string {
  let value = input
  if (!value) {
    value = 0
  }
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export const taxpayerMask = (value: string) => {
  if (value.length > 14) {
    return value.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      '$1.$2.$3/$4-$5',
    )
  }
  return value.replace(/^(\d{2})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export const rgMask = (value: string) => {
  if (value.length > 9) {
    return value.replace(/^(\d{2})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4')
  }
  return value.replace(/^(\d{2})(\d{3})(\d{3})/, '$1.$2.$3')
}

export const cepMask = (value: string) => {
  return value.replace(/^(\d{5})(\d{3})/, '$1-$2')
}

export const phoneMask = (value: string) => {
  if (value.length > 10) {
    return value.replace(/^(\d{2})(\d{1})(\d{4})(\d{4})/, '($1) $2 $3-$4')
  }
  return value.replace(/^(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
}

export function cpfCnpjMask(value?: string) {
  if (!value) return ''
  const digits = value.replace(/\D/g, '')
  if (digits.length === 11) {
    // CPF: 000.000.000-00
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  } else if (digits.length === 14) {
    // CNPJ: 00.000.000/0000-00
    return digits.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      '$1.$2.$3/$4-$5',
    )
  }
  return value
}

export const translateAction = (action: string) => {
  switch (action) {
    case 'add':
      return 'Criar'
    case 'edit':
      return 'Editar'
    case 'delete':
      return 'Deletar'
    case 'view':
      return 'Visualizar'
    default:
      return action
  }
}

export const translateModel = (model: string) => {
  switch (model) {
    case 'employee':
      return 'Colaborador'
    case 'company':
      return 'Empresa'
    case 'user':
      return 'Usuário'
    case 'role':
      return 'Cargo'
    case 'permission':
      return 'Permissão'
    case 'asset':
      return 'Ativo'
    case 'asset_type':
      return 'Tipo do Ativo'
    case 'asset_status':
      return 'Status do Ativo'
    case 'maintenance':
      return 'Manutenções e Melhorias'
    case 'gender':
      return 'Gênero'
    case 'log':
      return 'Log'
    case 'invoice':
      return 'Nota Fiscal'
    case 'center_cost':
      return 'Centro de Custo'
    case 'marital_status':
      return 'Estado Civil'
    case 'inventory':
      return 'Inventário'
    case 'document':
      return 'Documento'
    case 'term':
      return 'Termo'
    case 'verification':
      return 'Verificação'
    case 'group':
      return 'Grupo'
    case 'nationality':
      return 'Nacionalidade'
    case 'lending':
      return 'Comodato'
    case 'auth':
      return 'Autenticação'
    case 'people':
      return 'Pessoa'
    case 'witness':
      return 'Testemunha'
    case 'workload':
      return 'Lotação'
    case 'supplier':
      return 'Fornecedor'
    case 'attachment':
      return 'Documento'
    case 'report':
      return 'Relatório'
    default:
      return model
  }
}

export const getErrorMessage = (
  error: any,
  defaultMessage: string = 'Não foi possível completar a ação',
) => {
  if (typeof error === 'string') {
    return error
  }

  if (typeof error === 'object' && error.field) {
    notifications.show({
      title: 'Erro',
      message: `Verifique o campo: ${(error.field as string).toUpperCase()}`,
      color: 'red',
      autoClose: 5000,
    })
    return error
  }

  if (error.errors) {
    return Object.values(error.errors).join(', ')
  }

  notifications.show({
    title: 'Erro',
    message: defaultMessage,
    color: 'red',
    autoClose: 5000,
  })
  return 'Erro inesperado'
}
