import { type AxiosResponse } from 'axios'

import type { ListSuppliersQueryParams } from '@/api/generated/types/ListSuppliers.ts'
import axios from '@/lib/axios'
import type { SuppliersResponse } from '@/types/Supplier'
import type { SupplierFormValues as Supplier } from '@/types/supplier-form'

interface SuppliersListParams extends Omit<
  ListSuppliersQueryParams,
  'risk' | 'size'
> {
  name__ilike?: string
  code__ilike?: string
  cnpj__ilike?: string
  risk?: string | number | null
  size?: string | number
}

export const fetchSuppliers = async (
  params?: SuppliersListParams,
): Promise<AxiosResponse<SuppliersResponse>> => {
  return await axios.get('/proxy/procurement/v1/suppliers-list/', { params })
}

export const fetchSupplierById = async (
  id: string,
): Promise<AxiosResponse<Supplier>> => {
  return await axios.get(`/proxy/procurement/v1/suppliers/${id}/`)
}

export const addSupplier = async (
  data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<AxiosResponse<Supplier>> => {
  return await axios.post('/proxy/procurement/v1/suppliers/', data)
}

export const editSupplier = async (
  id: string,
  data: Partial<Supplier>,
): Promise<AxiosResponse<Supplier>> => {
  return await axios.patch(`/proxy/procurement/v1/suppliers/${id}/`, data)
}

export const deleteSupplier = async (
  id: string,
): Promise<AxiosResponse<void>> => {
  return await axios.delete(`/proxy/procurement/v1/suppliers/${id}/`)
}

export const uploadSupplierAttachment = async (
  supplierId: string,
  attachmentType: string,
  file: File,
): Promise<AxiosResponse<any>> => {
  const formData = new FormData()
  formData.append('supplier', supplierId)
  formData.append('attachment_type', attachmentType)
  formData.append('file', file)
  formData.append('description', file.name)

  return await axios.post(
    '/proxy/procurement/v1/attachments/upload/',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  )
}

export interface ResponsibilityMatrixData {
  id?: number
  createdAt?: string
  updatedAt?: string
  supplier: number
  contractRequestRequestingArea: string
  contractRequestAdministrative: string
  contractRequestLegal: string
  contractRequestFinancial: string
  contractRequestIntegrity: string
  contractRequestBoard: string
  documentAnalysisRequestingArea: string
  documentAnalysisAdministrative: string
  documentAnalysisLegal: string
  documentAnalysisFinancial: string
  documentAnalysisIntegrity: string
  documentAnalysisBoard: string
  riskConsultationRequestingArea: string
  riskConsultationAdministrative: string
  riskConsultationLegal: string
  riskConsultationFinancial: string
  riskConsultationIntegrity: string
  riskConsultationBoard: string
  riskAssessmentRequestingArea: string
  riskAssessmentAdministrative: string
  riskAssessmentLegal: string
  riskAssessmentFinancial: string
  riskAssessmentIntegrity: string
  riskAssessmentBoard: string
  systemRegistrationRequestingArea: string
  systemRegistrationAdministrative: string
  systemRegistrationLegal: string
  systemRegistrationFinancial: string
  systemRegistrationIntegrity: string
  systemRegistrationBoard: string
  formHandlingRequestingArea: string
  formHandlingAdministrative: string
  formHandlingLegal: string
  formHandlingFinancial: string
  formHandlingIntegrity: string
  formHandlingBoard: string
  contractDraftRequestingArea: string
  contractDraftAdministrative: string
  contractDraftLegal: string
  contractDraftFinancial: string
  contractDraftIntegrity: string
  contractDraftBoard: string
  complianceValidationRequestingArea: string
  complianceValidationAdministrative: string
  complianceValidationLegal: string
  complianceValidationFinancial: string
  complianceValidationIntegrity: string
  complianceValidationBoard: string
  finalApprovalRequestingArea: string
  finalApprovalAdministrative: string
  finalApprovalLegal: string
  finalApprovalFinancial: string
  finalApprovalIntegrity: string
  finalApprovalBoard: string
  contractSigningRequestingArea: string
  contractSigningAdministrative: string
  contractSigningLegal: string
  contractSigningFinancial: string
  contractSigningIntegrity: string
  contractSigningBoard: string
  documentManagementRequestingArea: string
  documentManagementAdministrative: string
  documentManagementLegal: string
  documentManagementFinancial: string
  documentManagementIntegrity: string
  documentManagementBoard: string
  paymentReleaseRequestingArea: string
  paymentReleaseAdministrative: string
  paymentReleaseLegal: string
  paymentReleaseFinancial: string
  paymentReleaseIntegrity: string
  paymentReleaseBoard: string
  contractExecutionMonitoringRequestingArea: string
  contractExecutionMonitoringAdministrative: string
  contractExecutionMonitoringLegal: string
  contractExecutionMonitoringFinancial: string
  contractExecutionMonitoringIntegrity: string
  contractExecutionMonitoringBoard: string
}

export const saveResponsibilityMatrix = async (
  matrixData: ResponsibilityMatrixData,
): Promise<AxiosResponse<ResponsibilityMatrixData>> => {
  return await axios.post(
    '/proxy/procurement/v1/responsibility-matrix/',
    matrixData,
  )
}

// Additional API functions for edit page
export const getSupplier = async (
  id: string,
): Promise<AxiosResponse<Supplier>> => {
  return await axios.get(`/proxy/procurement/v1/suppliers/${id}/`)
}

export const updateSupplier = async (
  id: string,
  data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<AxiosResponse<Supplier>> => {
  return await axios.put(`/proxy/procurement/v1/suppliers/${id}/`, data)
}

export interface SupplierAttachment {
  id: number
  attachmentTypeId?: number | string
  attachmentTypeName: string
  fileName: string
  description: string | null
}

export interface SupplierAttachmentVersion {
  id: number
  downloadId?: number
  source?: 'current' | 'history'
  attachmentTypeId: number
  attachmentTypeName: string
  fileName: string | null
  description: string | null
  isCurrent: boolean
  uploadedAt: string
}

export interface AttachmentType {
  id: string
  name: string
  riskLevel?: number | null
}

export interface CreateAttachmentTypeRequest {
  name: string
  riskLevel?: string | number | null
}

export interface UpdateAttachmentTypeRequest {
  name?: string
  riskLevel?: string | number | null
}

export const getSupplierAttachments = async (
  supplierId: string,
): Promise<AxiosResponse<SupplierAttachment[]>> => {
  return await axios.get(
    `/proxy/procurement/v1/attachments-list/${supplierId}/`,
  )
}

export const getSupplierAttachmentVersions = async (
  supplierId: string,
  attachmentTypeId: string,
): Promise<AxiosResponse<SupplierAttachmentVersion[]>> => {
  return await axios.get(
    `/proxy/procurement/v1/attachments/history/${supplierId}/${attachmentTypeId}/`,
  )
}

export const getAttachmentTypes = async (
  riskLevel: string,
): Promise<AxiosResponse<AttachmentType[]>> => {
  return await axios.get(
    `/proxy/procurement/v1/attachment-types/?risk_level=${riskLevel}`,
  )
}

export const createAttachmentType = async (
  data: CreateAttachmentTypeRequest,
): Promise<AxiosResponse<AttachmentType>> => {
  return await axios.post('/proxy/procurement/v1/attachment-types/', data)
}

export const updateAttachmentType = async (
  id: string,
  data: UpdateAttachmentTypeRequest,
): Promise<AxiosResponse<AttachmentType>> => {
  return await axios.patch(
    `/proxy/procurement/v1/attachment-types/${id}/`,
    data,
  )
}

export const deleteAttachmentType = async (
  id: string,
): Promise<AxiosResponse<void>> => {
  return await axios.delete(`/proxy/procurement/v1/attachment-types/${id}/`)
}

export const getSupplierResponsibilityMatrix = async (
  supplierId: string,
): Promise<AxiosResponse<ResponsibilityMatrixData>> => {
  return await axios.get(
    `/proxy/procurement/v1/responsibility-matrix/${supplierId}/`,
  )
}

export const updateResponsibilityMatrix = async (
  supplierId: number,
  matrixData: ResponsibilityMatrixData,
): Promise<AxiosResponse<ResponsibilityMatrixData>> => {
  return await axios.patch(
    `/proxy/procurement/v1/responsibility-matrix/${supplierId}/`,
    matrixData,
  )
}

export const downloadSupplierAttachment = async (
  attachmentId: string,
): Promise<AxiosResponse<Blob>> => {
  return await axios.get(
    `/proxy/procurement/v1/attachments/${attachmentId}/download/`,
    {
      responseType: 'blob',
    },
  )
}

export const downloadSupplierAttachmentHistory = async (
  historyId: string,
): Promise<AxiosResponse<Blob>> => {
  return await axios.get(
    `/proxy/procurement/v1/attachments/history-download/${historyId}/`,
    {
      responseType: 'blob',
    },
  )
}
