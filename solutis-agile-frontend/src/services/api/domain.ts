import { type AxiosResponse } from 'axios'

import axios from '@/lib/axios'

// Common interface for domain entities
export interface DomainOption {
  id: number
  name: string
  description?: string
}

// Domain Classifications
export const getClassifications = async (): Promise<
  AxiosResponse<DomainOption[]>
> => {
  return await axios.get('/proxy/procurement/v1/domain/classifications/')
}

export const getCategories = async (): Promise<
  AxiosResponse<DomainOption[]>
> => {
  return await axios.get('/proxy/procurement/v1/domain/categories/')
}

export const getRiskLevels = async (): Promise<
  AxiosResponse<DomainOption[]>
> => {
  return await axios.get('/proxy/procurement/v1/domain/risk-levels/')
}

// Supplier Types and Situations
export const getSupplierTypes = async (): Promise<
  AxiosResponse<DomainOption[]>
> => {
  return await axios.get('/proxy/procurement/v1/domain/supplier-types/')
}

export const getSupplierSituations = async (): Promise<
  AxiosResponse<DomainOption[]>
> => {
  return await axios.get('/proxy/procurement/v1/domain/supplier-situations/')
}

// Payment Related
export const getPixTypes = async (): Promise<AxiosResponse<DomainOption[]>> => {
  return await axios.get('/proxy/procurement/v1/domain/pix-types/')
}

export const getPaymentMethods = async (): Promise<
  AxiosResponse<DomainOption[]>
> => {
  return await axios.get('/proxy/procurement/v1/domain/payment-methods/')
}

export const getPayerTypes = async (): Promise<
  AxiosResponse<DomainOption[]>
> => {
  return await axios.get('/proxy/procurement/v1/domain/payer-types/')
}

// Business and Company
export const getBusinessSectors = async (): Promise<
  AxiosResponse<DomainOption[]>
> => {
  return await axios.get('/proxy/procurement/v1/domain/business-sectors/')
}

export const getCompanySizes = async (): Promise<
  AxiosResponse<DomainOption[]>
> => {
  return await axios.get('/proxy/procurement/v1/domain/company-sizes/')
}

export const getCustomerTypes = async (): Promise<
  AxiosResponse<DomainOption[]>
> => {
  return await axios.get('/proxy/procurement/v1/domain/customer-types/')
}

// Tax Related
export const getTaxpayerClassifications = async (): Promise<
  AxiosResponse<DomainOption[]>
> => {
  return await axios.get(
    '/proxy/procurement/v1/domain/taxpayer-classifications/',
  )
}

export const getTaxationRegimes = async (): Promise<
  AxiosResponse<DomainOption[]>
> => {
  return await axios.get('/proxy/procurement/v1/domain/taxation-regimes/')
}

export const getTaxationMethods = async (): Promise<
  AxiosResponse<DomainOption[]>
> => {
  return await axios.get('/proxy/procurement/v1/domain/taxation-methods/')
}

export const getIcmsTaxpayers = async (): Promise<
  AxiosResponse<DomainOption[]>
> => {
  return await axios.get('/proxy/procurement/v1/domain/icms-taxpayers/')
}

export const getWithholdingTaxes = async (): Promise<
  AxiosResponse<DomainOption[]>
> => {
  return await axios.get('/proxy/procurement/v1/domain/withholding-taxes/')
}

// ISS Related
export const getIssWithholdings = async (): Promise<
  AxiosResponse<DomainOption[]>
> => {
  return await axios.get('/proxy/procurement/v1/domain/iss-withholdings/')
}

export const getIssRegimes = async (): Promise<
  AxiosResponse<DomainOption[]>
> => {
  return await axios.get('/proxy/procurement/v1/domain/iss-regimes/')
}

// Income and Public Entity
export const getIncomeTypes = async (): Promise<
  AxiosResponse<DomainOption[]>
> => {
  return await axios.get('/proxy/procurement/v1/domain/income-types/')
}

export const getPublicEntities = async (): Promise<
  AxiosResponse<DomainOption[]>
> => {
  return await axios.get('/proxy/procurement/v1/domain/public-entities/')
}
