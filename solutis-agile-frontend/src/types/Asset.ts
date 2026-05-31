import { type Invoice } from './Invoice'

export interface AssetType {
  id: number
  code: string
  groupCode: string
  name: string
  acronym: string | null
}

export interface AssetStatus {
  id: number
  name: string
}

export interface ActionMaintenance {
  id: number
  name: string
}

export type Asset = {
  id: number
  type: AssetType
  assetType?: string
  typeId: number
  statusId: number | null
  status: AssetStatus | string | null
  invoiceNumber: string | null
  invoices: Invoice[]
  code: string | null
  registerNumber: string | null
  description: string | null
  supplier: string | null
  assuranceDate: string | null
  observations: string | null
  discardReason: string | null
  pattern: string | null
  operationalSystem: string | null
  serialNumber: string | null
  imei: string | null
  acquisitionDate: string | null
  value: number | null
  depreciation: number | null
  msOffice: boolean | null
  lineNumber: string | null
  operator: string | null
  model: string | null
  accessories: string | null
  configuration: string | null
  quantity: number | null
  unit: string | null
  active: boolean | null
  byAgile: boolean | null
  maintenanceStatus: string
  upgradeStatus: string
  alert: string
}

export interface AssetUpgrade {
  id: number
  status: string
  openDate: string
  closeDate: string | null
  value: number | null
  detailing: string | null
  supplier: string | null
  invoiceNumber: string | null
  asset: {
    id: number
    description: string | null
    registerNumber: string | null
    assetType: string | null
  }
  employee: {
    id: number
    code: string | null
    fullName: string
    registration: string | null
  }
  observations: string | null
  attachments: {
    id: number
    path: string | null
    fileName: string
  }[]
}

export interface AssetMaintenance {
  id: number
  action: {
    id: number
    name: string
  }
  status: string
  openDate: string
  closeDate: string | null
  glpiNumber: string | null
  openDateGlpi: string | null
  supplierServiceOrder: string | null
  openDateSupplier: string | null
  supplierNumber: string | null
  resolution: string | null
  incidentDescription: string | null
  asset: {
    id: number
    description: string | null
    registerNumber: string | null
    assetType: string | null
  }
  employee: {
    id: number
    code: string | null
    fullName: string
    registration: string | null
  }
  observations: string | null
  attachments:
    | {
        id: number
        path: string | null
        fileName: string
      }[]
    | []
  criticality: {
    id: number
    name: string
  }
  value: number
}

export interface AssetHistory {
  id: number
  employee: {
    id: number
    code: string | null
    fullName: string
    registration: string
  }
  asset: number
  number: string | null
  document: number | null
  documentRevoke: number | null
  workload: string
  witnesses: [number]
  costCenter: {
    code: string
    name: string
  }
  type: string
  status: string | null
  observations: string | null
  signedDate: string | null
  revokeSignedDate: string | null
  glpiNumber: string | null
  project: string
}
