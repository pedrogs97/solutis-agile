import { type AxiosResponse } from 'axios'

import axios from '@/lib/axios'
import { getProfile } from '@/store/persisted/useProfileStore'
import {
  type ApprovalFlow,
  type ApprovalStep,
  type ApproveStepPayload,
  type ResponsibleStepPayload,
} from '@/types/ApprovalWorkflow'

const BASE_URL = '/proxy/procurement/v1/approval'

const profile = getProfile()

export const fetchApprovalSteps = async (): Promise<
  AxiosResponse<ApprovalStep[]>
> => {
  return await axios.get(`${BASE_URL}/steps/`)
}

export const fetchSupplierApprovalFlow = async (
  supplierId: string,
): Promise<AxiosResponse<ApprovalFlow[]>> => {
  return await axios.get(`${BASE_URL}/supplier/${supplierId}/flows/`)
}

export const startSupplierApprovalFlow = async (
  supplierId: string,
): Promise<AxiosResponse<ApprovalFlow>> => {
  return await axios.post(`${BASE_URL}/start/`, {
    supplierId,
    approverName: profile?.full_name,
    approverEmail: profile?.email,
  })
}

export const approveCurrentStep = async (
  payload: ApproveStepPayload,
): Promise<AxiosResponse<any>> => {
  return await axios.post(`${BASE_URL}/step/approve/`, payload)
}

export const setResponsibleCurrentStep = async (
  payload: ResponsibleStepPayload,
): Promise<AxiosResponse<any>> => {
  return await axios.post(`${BASE_URL}/steps/responsible/`, payload)
}

export const resetSupplierApprovalFlow = async (
  supplierId: string,
): Promise<AxiosResponse<any>> => {
  return await axios.post(`${BASE_URL}/supplier/${supplierId}/flows/reset/`)
}
