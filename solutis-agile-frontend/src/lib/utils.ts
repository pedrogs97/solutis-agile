import { notifications } from '@mantine/notifications'

/** Formats an ISO date string as dd/mm/yyyy without timezone conversion. */
export function formatDateBR(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr

  const [year, month, day] = dateStr.split('T')[0].split('-')
  if (!year || !month || !day) return dateStr

  return `${day}/${month}/${year}`
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
