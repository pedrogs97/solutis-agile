export interface CostCenter {
  id: number

  code: string
  name: string
  classification: string
}

export interface EmployeeGender {
  id: number

  code: string
  description: string
}

export interface EmployeeNationality {
  id: number

  code: string
  description: string
}

export interface EmployeeRole {
  id: number

  code: string
  name: string
}

export interface EmployeeMaritalStatus {
  id: number

  code: string
  description: string
}

export interface EmployeeEducationalLevel {
  id: number

  code: string
  description: string
}

export interface Employee {
  id: number
  role?: EmployeeRole
  roleId?: number

  nationality?: EmployeeNationality
  nationalityId?: number

  maritalStatus?: EmployeeMaritalStatus
  maritalStatusId?: number

  gender?: EmployeeGender
  genderId?: number

  jobPosition?: string
  code: number
  fullName: string
  taxpayerIdentification: string
  nationalIdentification: string
  address: string
  cell_phone: string
  email: string
  birthday: Date
  status: string
  manager?: string
  legalPerson: boolean
  employerNumber?: string
  employerAddress?: string
  employerName?: string
  hasSolutisAsset?: boolean
  hasPersonalAsset?: boolean
  hasOtherAsset?: boolean
}
