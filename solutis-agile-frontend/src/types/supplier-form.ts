/**
 * Canonical form value types for the supplier form.
 *
 * These types represent what react-hook-form holds at runtime, which differs
 * from the Kubb-generated API payload types in three intentional ways:
 *
 *  1. FK fields (selects) are `string | number | null` — Select components
 *     emit string option values; the API expects `number | null`.
 *     Conversion happens in supplier-mappers.ts at the payload boundary.
 *
 *  2. Monetary fields (contractTotalValue, contractMonthlyValue) are `string`
 *     in the form (e.g. "1.234,56") and `number | null` in the API.
 *
 *  3. Contract date fields are `Date | string | null` — edit mode converts ISO
 *     strings via parseISO(); create mode keeps them as strings.
 */

/** A foreign-key field as held by a Select component. */
export type FormFkField = string | number | null | undefined

export type SupplierAddressFormValues = {
  postalCode?: string | null
  number?: number | null
  complement?: string | null
  street?: string | null
  city?: string | null
  state?: string | null
  neighbourhood?: string | null
}

export type SupplierContactFormValues = {
  name?: string | null
  email?: string | null
  phone?: string | null
}

export type SupplierPaymentDetailsFormValues = {
  paymentFrequency?: string | null
  paymentDate?: string | null
  /** String in the form ("1.234,56"); converted to number at payload time. */
  contractTotalValue?: string | null
  /** String in the form; converted to number at payload time. */
  contractMonthlyValue?: string | null
  checkingAccount?: string | null
  bank?: string | null
  bankCode?: string | null
  agency?: string | null
  paymentMethod?: FormFkField
  pixKeyType?: FormFkField
  pixKey?: string | null
}

export type SupplierOrganizationalDetailsFormValues = {
  costCenter?: string | null
  businessUnit?: string | null
  responsibleExecutive?: string | null
  responsibleManager?: string | null
  payerType?: FormFkField
  businessSector?: FormFkField
  taxpayerClassification?: FormFkField
  publicEntity?: FormFkField
}

export type SupplierFiscalDetailsFormValues = {
  issTaxpayer?: boolean | null
  simplesNacionalParticipant?: boolean | null
  cooperativeMember?: boolean | null
  issWithholding?: FormFkField
  issRegime?: FormFkField
  withholdingTaxNature?: FormFkField
}

export type SupplierCompanyInformationFormValues = {
  companySize?: FormFkField
  icmsTaxpayer?: FormFkField
  taxationRegime?: FormFkField
  incomeType?: FormFkField
  taxationMethod?: FormFkField
  customerType?: FormFkField
  nit?: string | null
}

export type SupplierContractFormValues = {
  objectContract?: string | null
  executedActivities?: string | null
  /** Date (from parseISO in edit mode) or ISO string (create mode). */
  contractStartDate?: Date | string | null
  /** Date (from parseISO in edit mode) or ISO string (create mode). */
  contractEndDate?: Date | string | null
  contractType?: string | null
  contractPeriod?: string | null
  hasContractRenewal?: boolean | null
  warningContractRenewal?: boolean | null
  warningContractPeriod?: string | null
  warningOnTermination?: boolean | null
  warningOnRenewal?: boolean | null
  warningOnPeriod?: boolean | null
}

export type SupplierFormValues = {
  legalName: string
  taxId: string
  tradeName?: string | null
  stateBusinessRegistration?: string | null
  municipalBusinessRegistration?: string | null
  classification?: FormFkField
  category?: FormFkField
  riskLevel?: FormFkField
  type?: FormFkField
  /** Read-only on the backend — held in form for display, never sent in payloads. */
  situation?: FormFkField
  address?: SupplierAddressFormValues
  contact?: SupplierContactFormValues
  paymentDetails?: SupplierPaymentDetailsFormValues
  organizationalDetails?: SupplierOrganizationalDetailsFormValues
  fiscalDetails?: SupplierFiscalDetailsFormValues
  companyInformation?: SupplierCompanyInformationFormValues
  contract?: SupplierContractFormValues
}

export const SUPPLIER_FORM_DEFAULT_VALUES: SupplierFormValues = {
  legalName: '',
  taxId: '',
  tradeName: '',
  stateBusinessRegistration: '',
  municipalBusinessRegistration: '',
  classification: undefined,
  category: undefined,
  riskLevel: undefined,
  type: undefined,
  situation: undefined,
  address: {
    postalCode: '',
    number: undefined,
    complement: '',
    street: '',
    neighbourhood: '',
    city: '',
    state: '',
  },
  contact: {
    name: '',
    email: '',
    phone: '',
  },
  paymentDetails: {
    paymentFrequency: '',
    paymentDate: '',
    contractTotalValue: '',
    contractMonthlyValue: '',
    bank: '',
    bankCode: '',
    agency: '',
    checkingAccount: '',
    pixKey: '',
    paymentMethod: undefined,
    pixKeyType: undefined,
  },
  organizationalDetails: {
    costCenter: '',
    businessUnit: '',
    responsibleExecutive: '',
    responsibleManager: '',
    payerType: undefined,
    businessSector: undefined,
    taxpayerClassification: undefined,
    publicEntity: undefined,
  },
  fiscalDetails: {
    issTaxpayer: false,
    simplesNacionalParticipant: false,
    cooperativeMember: false,
    issWithholding: undefined,
    issRegime: undefined,
    withholdingTaxNature: undefined,
  },
  contract: {
    objectContract: '',
    executedActivities: '',
    contractStartDate: '',
    contractEndDate: '',
    contractType: '',
    contractPeriod: '',
    hasContractRenewal: false,
    warningContractRenewal: false,
    warningContractPeriod: '',
    warningOnTermination: false,
    warningOnRenewal: false,
    warningOnPeriod: false,
  },
  companyInformation: {
    taxationRegime: undefined,
    nit: '',
    companySize: undefined,
    icmsTaxpayer: undefined,
    incomeType: undefined,
    taxationMethod: undefined,
    customerType: undefined,
  },
}
