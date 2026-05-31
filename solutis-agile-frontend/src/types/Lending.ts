import { type Asset } from './Asset'
import { type CostCenter, type Employee } from './Employee'

export interface DocumentType {
  id: number
  name: string
}

export interface Document {
  id: number
  docType: DocumentType | null
  docTypeId: number | null
  path: string | null
  fileName: string
}

export interface Workload {
  id: number
  name: string
}

export interface Witness {
  id: number
  employee: Employee
  employeeId: number
  lendings: Lending[]
  signed: Date | null
}

export interface LendingType {
  id: number
  name: string
}

export interface Lending {
  id: number
  employee: Employee
  employeeId: number
  asset: Asset
  assetId: number
  type: LendingType | string | null
  typeId: number
  document: Document | string | null
  documentRevokeId: number | null
  documentRevoke: Document | null
  documentId: number | null
  workload: Workload
  workloadId: number
  witnesses: Witness[]
  costCenter: CostCenter
  costCenterId: number
  number: string | null
  manager: string
  status?: string
  observations: string | null
  signedDate: Date | string | null
  glpiNumber: string | null
  goal: string | null
  project: string | null
  businessExecutive: string | null
  location: string | null
  createdAt: Date | string
}

export interface TermStatus {
  id: number
  name: string
}

export interface TermItemType {
  id: number
  name: string
}

// TermItem Interface
export interface TermItem {
  id: number
  description: string
  size: string | null
  quantity: number | null
  value: number | null
  term: Term
}

// Term Interface
export interface Term {
  id: number
  employee: Employee
  employeeId: number
  documentId: number | null
  document: Document | null
  documentRevokeId: number | null
  documentRevoke: Document | null
  workload: Workload | string
  workloadId: number | null
  status: string | null
  statusId: number | null
  costCenter: CostCenter
  costCenterId: number
  type: TermItemType | string | null
  typeId: number | null
  termItem: TermItem
  termItemId: number
  number: string | null
  manager: string
  businessExecutive: string | null
  project: string | null
  location: string | null
  observations: string | null
  signedDate: Date | null
  revokeSignedDate: Date | null
  createdAt: Date | string
}
