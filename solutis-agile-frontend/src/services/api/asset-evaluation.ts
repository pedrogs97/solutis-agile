import { QueryFunctionContext } from '@tanstack/react-query'

import axios from '@/lib/axios'
import type {
  AssetCatalogComponent,
  AssetEvaluationAttachment,
  AssetEvaluationFilters,
  AssetEvaluationFormValues,
  AssetEvaluationListResponse,
  AssetEvaluationMetrics,
  AssetTechnicalEvaluation,
} from '@/types/AssetEvaluation'

const BASE_URL = '/asset-evaluations'

export const fetchAssetEvaluations = async ({
  queryKey,
}: QueryFunctionContext<[string, AssetEvaluationFilters]>) => {
  const [_, filters] = queryKey
  const { data } = await axios.get<AssetEvaluationListResponse>(`${BASE_URL}/`, {
    params: filters,
  })
  return data
}

export const fetchAssetEvaluation = async ({
  queryKey,
}: QueryFunctionContext<[string, string | number | undefined]>) => {
  const [_, id] = queryKey
  if (!id) return null
  const { data } = await axios.get<AssetTechnicalEvaluation>(`${BASE_URL}/${id}/`)
  return data
}

export const fetchAssetEvaluationMetrics = async () => {
  const { data } = await axios.get<AssetEvaluationMetrics>(`${BASE_URL}/metrics/`)
  return data
}

export const fetchCatalogComponents = async () => {
  const { data } = await axios.get<AssetCatalogComponent[]>(
    `${BASE_URL}/components/catalog/`
  )
  return data
}

export const createCatalogComponent = async (name: string) => {
  const { data } = await axios.post<AssetCatalogComponent>(
    `${BASE_URL}/components/catalog/`,
    { name }
  )
  return data
}

export const createAssetEvaluation = async (
  payload: AssetEvaluationFormValues
) => {
  const { data } = await axios.post<AssetTechnicalEvaluation>(
    `${BASE_URL}/`,
    payload
  )
  return data
}

export const updateAssetEvaluation = async (
  id: number | string,
  payload: Partial<AssetEvaluationFormValues>
) => {
  const { data } = await axios.patch<AssetTechnicalEvaluation>(
    `${BASE_URL}/${id}/`,
    payload
  )
  return data
}

export const uploadEvaluationAttachment = async (
  evaluationId: number | string,
  file: File,
  checklistKey?: string
) => {
  const formData = new FormData()
  formData.append('file', file)
  if (checklistKey) {
    formData.append('checklist_key', checklistKey)
  }

  const { data } = await axios.post<AssetEvaluationAttachment>(
    `${BASE_URL}/${evaluationId}/attachments/`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  )
  return data
}

export const approveAssetEvaluation = async (
  id: number | string,
  payload: { comments?: string; write_off_asset: boolean }
) => {
  const { data } = await axios.post<AssetTechnicalEvaluation>(
    `${BASE_URL}/${id}/approve/`,
    payload
  )
  return data
}
