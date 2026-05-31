import { notifications } from '@mantine/notifications'
import { type QueryFunctionContext } from '@tanstack/react-query'

import axios from '@/lib/axios'
import type { ReportFormFilter } from '@/routes/_dashboard/reports'

type Selectish =
  | string
  | number
  | boolean
  | null
  | undefined
  | {
      id?: unknown
      value?: unknown
      code?: unknown
      uuid?: unknown
      slug?: unknown
      label?: unknown
      name?: unknown
      description?: unknown
      fullName?: unknown
      full_name?: unknown
      project?: unknown
      pattern?: unknown
      businessExecutive?: unknown
      business_executive?: unknown
    }

interface SelectOption {
  value: string
  label: string
}

const toStringSafe = (input: unknown) => {
  if (input === null || input === undefined) return ''
  if (typeof input === 'string') return input
  return String(input)
}

const normalizeSelectOption = (item: Selectish): SelectOption | null => {
  if (item === null || item === undefined) {
    return null
  }

  if (
    typeof item === 'string' ||
    typeof item === 'number' ||
    typeof item === 'boolean'
  ) {
    const text = toStringSafe(item).trim()
    if (!text) return null
    return { value: text, label: text }
  }

  if (typeof item === 'object') {
    const valueCandidate =
      'value' in item && item.value !== undefined && item.value !== null
        ? item.value
        : (item.id ?? item.code ?? item.uuid ?? item.slug)

    const labelCandidate =
      item.label ??
      item.name ??
      item.description ??
      item.fullName ??
      item.full_name ??
      item.project ??
      item.pattern ??
      item.businessExecutive ??
      item.business_executive ??
      valueCandidate

    const value = toStringSafe(valueCandidate ?? labelCandidate).trim()
    const label = toStringSafe(labelCandidate ?? valueCandidate).trim()

    if (!value) return null

    return {
      value,
      label: label || value,
    }
  }

  return null
}

const extractItems = (payload: unknown): Selectish[] => {
  if (Array.isArray(payload)) return payload as Selectish[]
  if (
    payload &&
    typeof payload === 'object' &&
    'items' in (payload as Record<string, unknown>) &&
    Array.isArray((payload as Record<string, unknown>).items)
  ) {
    return (payload as { items: Selectish[] }).items
  }
  return []
}

const normalizeSelectOptions = (payload: unknown): SelectOption[] =>
  extractItems(payload)
    .map((item) => normalizeSelectOption(item))
    .filter((option): option is SelectOption => Boolean(option))

export const fetchReports = async ({
  queryKey,
}: QueryFunctionContext<
  [
    string,
    ReportFormFilter & {
      isListResponse: boolean
      searchBy?: string | null
    },
  ]
>) => {
  const [_, filters] = queryKey
  let url = '/report/'
  const filterCleaned = Object.fromEntries(
    Object.entries(filters).filter(([_, v]) => {
      if (v === null || v === undefined) return false
      if (Array.isArray(v)) return v.length > 0
      if (typeof v === 'string') return v.trim().length > 0
      return true
    }),
  )
  for (const key in filterCleaned) {
    if (Array.isArray(filterCleaned[key])) {
      filterCleaned[key] = filterCleaned[key].join(',')
    }
  }
  delete filterCleaned.isListResponse
  delete filterCleaned.searchBy
  if (!filters.searchBy) return {}
  if (filters.isListResponse) {
    url += 'list/'
  }
  if (filters.searchBy === 'Colaborador') {
    url += 'by-employee/'
  }
  if (filters.searchBy === 'Equipamento') {
    url += 'by-asset/'
  }
  if (filters.searchBy === 'Padrão de Equipamento') {
    url += 'by-pattern/'
  }
  if (filters.searchBy === 'Manutenção/Melhoria') {
    url += 'by-maintenance/'
  }
  if (filters.searchBy === 'Estoque de Equipamento') {
    url += 'by-asset-stock/'
  }

  if (filters.isListResponse) {
    const { data } = await axios.get(url, {
      params: {
        size: 10,
        ...filterCleaned,
      },
    })
    return data
  }
  const idNotification = notifications.show({
    loading: true,
    title: 'Realizando download',
    message: 'O arquivo está sendo baixado, aguarde um momento...',
    autoClose: false,
    withCloseButton: false,
  })
  try {
    const response = await axios.get(url, {
      responseType: 'blob',
      params: {
        ...filterCleaned,
      },
    })

    if (response.status === 204) {
      notifications.update({
        id: idNotification,
        loading: false,
        autoClose: 3000,
        title: 'Não foi possível baixar o arquivo',
        message: 'Nenhum dado encontrado',
        color: 'orange',
      })
      return
    }

    const filename = response?.headers['content-disposition']
      .split('filename=')[1]
      .replace(/"/g, '')

    const excelBlob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const urlDownload = window.URL.createObjectURL(excelBlob)

    const link = document.createElement('a')
    link.href = urlDownload
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()

    document.body.removeChild(link)
    window.URL.revokeObjectURL(urlDownload)
    notifications.update({
      id: idNotification,
      loading: false,
      autoClose: 500,
      title: 'Download do documento',
      message: 'O download do documento foi iniciado',
      color: 'blue',
    })
  } catch {
    notifications.update({
      id: idNotification,
      loading: false,
      autoClose: 3000,
      title: 'Erro ao baixar arquivo',
      message: 'Ocorreu um erro ao baixar o arquivo',
      color: 'red',
    })
  }
  return {}
}

export const fetchProjectsSelect = async () => {
  const { data } = await axios.get('/report/projects-select')
  return normalizeSelectOptions(data)
}

export const fetchBusinessExecutiveSelect = async () => {
  const { data } = await axios.get('/report/business-executive-select/')
  return normalizeSelectOptions(data)
}

export const fetchPatternSelect = async () => {
  const { data } = await axios.get('/report/pattern-select/')
  return normalizeSelectOptions(data)
}

export const fetchDashboardData = async () => {
  const { data } = await axios.get('/report/dashboard/')
  return data
}
