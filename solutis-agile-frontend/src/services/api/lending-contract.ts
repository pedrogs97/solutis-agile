import { type QueryFunctionContext } from '@tanstack/react-query'

import { ENVIRONMENT } from '@/constants/env'
import axios from '@/lib/axios'
import { type Asset } from '@/types/Asset'

export const fetchContracts = async ({
  queryKey,
}: QueryFunctionContext<
  [
    string,
    {
      search?: string
      page?: number
      size?: string
    },
  ]
>) => {
  const [_, filters] = queryKey
  const { data } = await axios.get('/lendings/', {
    params: {
      ...filters,
    },
  })
  return data
}

export const fetchVerificationQuestions = async (assetTypeId: string) => {
  const { data } = await axios.get(`/verifications/${assetTypeId}/`)
  return data
}

export const fetchAssetSelect = async (search?: string) => {
  const { data } = await axios.get('/assets-select/', {
    params: {
      search,
      asset_type__id__in: '1,2,3,4,8,9,10,11,12,13,14,15,16',
      size: 100,
    },
  })

  const assets = data?.items?.map((asset: Asset) => {
    return {
      value: asset.id?.toString(),
      label: `${asset.registerNumber ? asset.registerNumber : ''} ${
        asset.imei ? `- ${asset.imei} ` : ''
      } ${asset?.type?.name ? `- ${asset.type.name}` : ''}`,
      type: asset.type?.name?.toString(),
      typeId: asset.type?.id ?? null,
    }
  })
  return assets
}

// Lending contract CRUD operations
export const fetchLending = async (id: string) => {
  const { data } = await axios.get(`/lendings/${id}/`)
  return data
}

interface CreateLendingVerificationAnswer {
  verificationId: number
  answer: string
  observations?: string
}

interface CreateLendingVerification {
  typeId: number
  answered: CreateLendingVerificationAnswer[]
}

export interface CreateLendingData {
  employeeId: number
  assetId: number
  workloadId?: number
  witnessesId?: number[]
  costCenterId: number
  manager: string
  observations?: string | null
  glpiNumber?: string | null
  project?: string | null
  businessExecutive?: string | null
  location: string
  bu: string
  msOffice?: boolean
  principalSigner: string
  employeeSigner: string
  legalPerson?: boolean
  verificationAnswers?: CreateLendingVerification
}

interface CreateLendingPayload {
  data: CreateLendingData
  attachments?: File[]
}

const apiV2BaseURL = `${ENVIRONMENT.baseURL.replace(/\/$/, '')}/api/v2`

export const createLending = async ({
  data,
  attachments = [],
}: CreateLendingPayload) => {
  const formData = new FormData()
  formData.append('data', JSON.stringify(data))
  attachments.forEach((attachment) => {
    formData.append('attachments', attachment)
  })

  const { data: response } = await axios.post('/lendings/', formData, {
    baseURL: apiV2BaseURL,
  })
  return response
}

export const updateLending = async (id: string, data: any) => {
  const { data: response } = await axios.patch(`/lendings/${id}/`, data)
  return response
}

export const deleteLending = async (id: string) => {
  const { data: response } = await axios.delete(`/lendings/${id}/`)
  return response
}
