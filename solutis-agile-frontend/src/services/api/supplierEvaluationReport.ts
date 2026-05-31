import { notifications } from '@mantine/notifications'

import axios from '@/lib/axios'

export interface SupplierEvaluationReportFilters {
  supplierId?: number
  supplierName?: string
  taxId?: string
  evaluationYear?: number | null
  periodType?: string | null
  evaluatorName?: string
  startPeriod?: string | null
  endPeriod?: string | null
}

export interface SupplierEvaluationReportRow {
  id: number
  tradeName: string
  taxId: string
  finalScore: string | null
  period: string
  evaluationYear: number
  evaluatorName: string
  evaluationDate: string
}

export interface SupplierEvaluationReportListResponse {
  cacheKey: string
  total: number
  limit: number
  offset: number
  data: SupplierEvaluationReportRow[]
}

interface SupplierEvaluationReportApiRow {
  id: number
  tradeName?: string
  trade_name?: string
  taxId?: string
  tax_id?: string
  finalScore?: string | null
  final_score?: string | null
  period: string
  evaluationYear?: number
  evaluation_year?: number
  evaluatorName?: string
  evaluator_name?: string
  evaluationDate?: string
  evaluation_date?: string
}

interface SupplierEvaluationReportApiResponse {
  cacheKey?: string
  cache_key?: string
  total: number
  limit: number
  offset: number
  data: SupplierEvaluationReportApiRow[]
}

const buildBody = (
  filters: SupplierEvaluationReportFilters,
  extra?: Record<string, unknown>,
) => {
  const cleanFilters: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== null && v !== '') {
      cleanFilters[k] = v
    }
  }
  return {
    reportType: 'supplier_evaluation',
    filters: {
      reportType: 'supplier_evaluation',
      ...cleanFilters,
    },
    ...extra,
  }
}

const normalizeRow = (
  row: SupplierEvaluationReportApiRow,
): SupplierEvaluationReportRow => ({
  id: row.id,
  tradeName: row.tradeName ?? row.trade_name ?? '',
  taxId: row.taxId ?? row.tax_id ?? '',
  finalScore: row.finalScore ?? row.final_score ?? null,
  period: row.period,
  evaluationYear: row.evaluationYear ?? row.evaluation_year ?? 0,
  evaluatorName: row.evaluatorName ?? row.evaluator_name ?? '',
  evaluationDate: row.evaluationDate ?? row.evaluation_date ?? '',
})

const normalizeResponse = (
  response: SupplierEvaluationReportApiResponse,
): SupplierEvaluationReportListResponse => ({
  cacheKey: response.cacheKey ?? response.cache_key ?? '',
  total: response.total,
  limit: response.limit,
  offset: response.offset,
  data: response.data.map(normalizeRow),
})

export const listSupplierEvaluationReport = async (
  filters: SupplierEvaluationReportFilters,
  limit: number,
  offset: number,
): Promise<SupplierEvaluationReportListResponse> => {
  const { data } = await axios.post<SupplierEvaluationReportApiResponse>(
    '/proxy/report/v1/reports/list',
    buildBody(filters, { limit, offset }),
  )
  return normalizeResponse(data)
}

export const downloadSupplierEvaluationReport = async (
  filters: SupplierEvaluationReportFilters,
): Promise<void> => {
  const idNotification = notifications.show({
    loading: true,
    title: 'Realizando download',
    message: 'O arquivo está sendo baixado, aguarde um momento...',
    autoClose: false,
    withCloseButton: false,
  })

  try {
    const response = await axios.post(
      '/proxy/report/v1/reports/download',
      buildBody(filters),
      { responseType: 'blob' },
    )

    const disposition: string = response.headers['content-disposition'] ?? ''
    const filename =
      disposition.split('filename=')[1]?.replace(/"/g, '') ??
      'relatorio_fornecedores.xlsx'

    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

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
}
