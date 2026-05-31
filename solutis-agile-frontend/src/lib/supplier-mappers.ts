/**
 * Typed boundary mappers between API types (Kubb-generated) and form values.
 *
 * These are the ONLY places where field-type conversions happen:
 *   - DomainRefOut  → string FK  (apiToSupplierFormValues)
 *   - string FK     → number     (supplierFormValuesToCreatePayload / UpdatePayload)
 *   - string amount → number     (same)
 *   - Date/string   → ISO string (same)
 */

import { format, parseISO } from 'date-fns'

import type { SupplierCreateIn } from '@/api/generated/types/SupplierCreateIn.ts'
import type { SupplierOut } from '@/api/generated/types/SupplierOut.ts'
import type { SupplierUpdateIn } from '@/api/generated/types/SupplierUpdateIn.ts'
import type { FormFkField, SupplierFormValues } from '@/types/supplier-form.ts'

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/** Convert a DomainRefOut (or plain number) coming from the API to a string FK
 *  suitable for a Select component. Returns null when the value is absent. */
function toFormFk(
  val: { id: number } | number | null | undefined,
): string | null {
  if (val == null) return null
  const id = typeof val === 'number' ? val : val.id
  return String(id)
}

/** Convert a form FK field (string|number|null|undefined) to the number the
 *  API expects, returning null for absent / empty values. */
function toApiId(val: FormFkField): number | null {
  if (val == null || val === '') return null
  const num = typeof val === 'number' ? val : parseInt(String(val), 10)
  return Number.isNaN(num) ? null : num
}

/** Parse a Brazilian-formatted decimal string ("1.234,56") or a plain English
 *  float string ("1234.56") into a number for the API. Returns null when empty. */
function parseDecimalString(val: string | null | undefined): number | null {
  if (!val) return null
  let normalized = val.trim()
  if (!normalized) return null
  // BR format: "1.234,56" → "1234.56"
  if (normalized.includes(',') && normalized.includes('.')) {
    normalized = normalized.replace(/\./g, '').replace(',', '.')
  } else if (normalized.includes(',')) {
    normalized = normalized.replace(',', '.')
  }
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

/** Format a Date or ISO string to "yyyy-MM-dd" for the API. Returns null when
 *  absent or unparseable. */
function formatDateForPayload(
  val: Date | string | null | undefined,
): string | null {
  if (!val) return null
  try {
    if (typeof val === 'string') {
      const isoMatch = val.match(/^(\d{4}-\d{2}-\d{2})/)
      if (isoMatch) return isoMatch[1]!
      const parsed = parseISO(val)
      return Number.isNaN(parsed.getTime())
        ? null
        : format(parsed, 'yyyy-MM-dd')
    }
    return Number.isNaN(val.getTime()) ? null : format(val, 'yyyy-MM-dd')
  } catch {
    return null
  }
}

/** Format a number for display in the form (plain string representation). */
function numberToFormString(val: number | null | undefined): string {
  if (val == null) return ''
  return String(val)
}

// ---------------------------------------------------------------------------
// Public mappers
// ---------------------------------------------------------------------------

/**
 * `SupplierOut` → `SupplierFormValues`
 *
 * Converts API response data to the shape that react-hook-form holds:
 *  - DomainRefOut FK objects  → string IDs for Select components
 *  - number monetary fields   → string representations for text inputs
 *  - ISO date strings         → Date objects (via parseISO)
 */
export function apiToSupplierFormValues(data: SupplierOut): SupplierFormValues {
  return {
    legalName: data.legalName,
    taxId: data.taxId,
    tradeName: data.tradeName ?? null,
    stateBusinessRegistration: data.stateBusinessRegistration ?? null,
    municipalBusinessRegistration: data.municipalBusinessRegistration ?? null,

    classification: toFormFk(data.classification),
    category: toFormFk(data.category),
    riskLevel: toFormFk(data.riskLevel),
    type: toFormFk(data.type),
    situation: toFormFk(
      (data.situation?.status as { id: number } | undefined | null) ??
        data.situation,
    ),

    address: data.address
      ? {
          postalCode: data.address.postalCode ?? null,
          number: data.address.number ?? null,
          complement: data.address.complement ?? null,
          street: data.address.street ?? null,
          city: data.address.city ?? null,
          state: data.address.state ?? null,
          neighbourhood: data.address.neighbourhood ?? null,
        }
      : undefined,

    contact: data.contact
      ? {
          name: data.contact.name ?? null,
          email: data.contact.email ?? null,
          phone: data.contact.phone != null ? String(data.contact.phone) : null,
        }
      : undefined,

    paymentDetails: data.paymentDetails
      ? {
          paymentFrequency: data.paymentDetails.paymentFrequency ?? null,
          paymentDate: data.paymentDetails.paymentDate ?? null,
          contractTotalValue: numberToFormString(
            data.paymentDetails.contractTotalValue,
          ),
          contractMonthlyValue: numberToFormString(
            data.paymentDetails.contractMonthlyValue,
          ),
          checkingAccount: data.paymentDetails.checkingAccount ?? null,
          bank: data.paymentDetails.bank ?? null,
          bankCode: data.paymentDetails.bankCode ?? null,
          agency: data.paymentDetails.agency ?? null,
          paymentMethod: toFormFk(data.paymentDetails.paymentMethod),
          pixKeyType: toFormFk(data.paymentDetails.pixKeyType),
          pixKey: data.paymentDetails.pixKey ?? null,
        }
      : undefined,

    organizationalDetails: data.organizationalDetails
      ? {
          costCenter: data.organizationalDetails.costCenter ?? null,
          businessUnit: data.organizationalDetails.businessUnit ?? null,
          responsibleExecutive:
            data.organizationalDetails.responsibleExecutive ?? null,
          responsibleManager:
            data.organizationalDetails.responsibleManager ?? null,
          payerType: toFormFk(data.organizationalDetails.payerType),
          businessSector: toFormFk(data.organizationalDetails.businessSector),
          taxpayerClassification: toFormFk(
            data.organizationalDetails.taxpayerClassification,
          ),
          publicEntity: toFormFk(data.organizationalDetails.publicEntity),
        }
      : undefined,

    fiscalDetails: data.fiscalDetails
      ? {
          issTaxpayer: data.fiscalDetails.issTaxpayer ?? null,
          simplesNacionalParticipant:
            data.fiscalDetails.simplesNacionalParticipant ?? null,
          cooperativeMember: data.fiscalDetails.cooperativeMember ?? null,
          issWithholding: toFormFk(data.fiscalDetails.issWithholding),
          issRegime: toFormFk(data.fiscalDetails.issRegime),
          withholdingTaxNature: toFormFk(
            data.fiscalDetails.withholdingTaxNature,
          ),
        }
      : undefined,

    companyInformation: data.companyInformation
      ? {
          companySize: toFormFk(data.companyInformation.companySize),
          icmsTaxpayer: toFormFk(data.companyInformation.icmsTaxpayer),
          taxationRegime: toFormFk(data.companyInformation.taxationRegime),
          incomeType: toFormFk(data.companyInformation.incomeType),
          taxationMethod: toFormFk(data.companyInformation.taxationMethod),
          customerType: toFormFk(data.companyInformation.customerType),
          nit: data.companyInformation.nit ?? null,
        }
      : undefined,

    contract: data.contract
      ? {
          objectContract: data.contract.objectContract ?? null,
          executedActivities: data.contract.executedActivities ?? null,
          contractStartDate: data.contract.contractStartDate
            ? parseISO(data.contract.contractStartDate)
            : null,
          contractEndDate: data.contract.contractEndDate
            ? parseISO(data.contract.contractEndDate)
            : null,
          contractType: data.contract.contractType ?? null,
          contractPeriod:
            data.contract.contractPeriod != null
              ? String(data.contract.contractPeriod)
              : null,
          hasContractRenewal: data.contract.hasContractRenewal ?? null,
          warningContractRenewal: data.contract.warningContractRenewal ?? null,
          warningContractPeriod:
            data.contract.warningContractPeriod != null
              ? String(data.contract.warningContractPeriod)
              : null,
          warningOnTermination: data.contract.warningOnTermination ?? null,
          warningOnRenewal: data.contract.warningOnRenewal ?? null,
          warningOnPeriod: data.contract.warningOnPeriod ?? null,
        }
      : undefined,
  }
}

// ---------------------------------------------------------------------------
// Internal payload builder — shared by create and update mappers
// ---------------------------------------------------------------------------

function buildAddressPayload(
  addr: SupplierFormValues['address'],
): SupplierCreateIn['address'] {
  if (!addr) return null
  return {
    postalCode: addr.postalCode ? addr.postalCode.replace(/[\s-]/g, '') : null,
    number: addr.number ?? null,
    complement: addr.complement || null,
    street: addr.street || null,
    city: addr.city || null,
    state: addr.state || null,
    neighbourhood: addr.neighbourhood || null,
  }
}

function buildContactPayload(
  contact: SupplierFormValues['contact'],
): SupplierCreateIn['contact'] {
  if (!contact) return null
  return {
    name: contact.name || null,
    email: contact.email || null,
    phone: contact.phone ? contact.phone.replace(/[()\s-]/g, '') : null,
  }
}

function buildPaymentDetailsPayload(
  pd: SupplierFormValues['paymentDetails'],
): SupplierCreateIn['paymentDetails'] {
  if (!pd) return null
  return {
    paymentFrequency: pd.paymentFrequency || null,
    paymentDate: pd.paymentDate || null,
    contractTotalValue: parseDecimalString(pd.contractTotalValue),
    contractMonthlyValue: parseDecimalString(pd.contractMonthlyValue),
    checkingAccount: pd.checkingAccount || null,
    bank: pd.bank || null,
    bankCode: pd.bankCode || null,
    agency: pd.agency || null,
    paymentMethod: toApiId(pd.paymentMethod),
    pixKeyType: toApiId(pd.pixKeyType),
    pixKey: pd.pixKey || null,
  }
}

function buildOrganizationalDetailsPayload(
  od: SupplierFormValues['organizationalDetails'],
): SupplierCreateIn['organizationalDetails'] {
  if (!od) return null
  return {
    costCenter: od.costCenter || null,
    businessUnit: od.businessUnit || null,
    responsibleExecutive: od.responsibleExecutive || null,
    responsibleManager: od.responsibleManager || null,
    businessSector: toApiId(od.businessSector),
    // payerType, taxpayerClassification, publicEntity hidden from current UI
  }
}

function buildFiscalDetailsPayload(
  fd: SupplierFormValues['fiscalDetails'],
): SupplierCreateIn['fiscalDetails'] {
  if (!fd) return null
  return {
    simplesNacionalParticipant: fd.simplesNacionalParticipant ?? null,
    // issTaxpayer, cooperativeMember, issWithholding, issRegime,
    // withholdingTaxNature are hidden from the current UI
  }
}

function buildCompanyInformationPayload(
  ci: SupplierFormValues['companyInformation'],
): SupplierCreateIn['companyInformation'] {
  if (!ci) return null
  return {
    companySize: toApiId(ci.companySize),
    // taxationRegime, nit, icmsTaxpayer, incomeType, taxationMethod,
    // customerType are hidden from the current UI
  }
}

function buildContractPayload(
  contract: SupplierFormValues['contract'],
): SupplierCreateIn['contract'] {
  if (!contract) return null
  return {
    objectContract: contract.objectContract || null,
    executedActivities: contract.executedActivities || null,
    contractStartDate: formatDateForPayload(contract.contractStartDate),
    contractEndDate: formatDateForPayload(contract.contractEndDate),
    contractType: contract.contractType || null,
    contractPeriod: contract.contractPeriod || null,
    hasContractRenewal: contract.hasContractRenewal ?? null,
    warningContractRenewal: contract.warningContractRenewal ?? null,
    warningContractPeriod: contract.warningContractPeriod || null,
    warningOnTermination: contract.warningOnTermination ?? null,
    warningOnRenewal: contract.warningOnRenewal ?? null,
    warningOnPeriod: contract.warningOnPeriod ?? null,
  }
}

/**
 * `SupplierFormValues` → `SupplierCreateIn`
 *
 * Converts form values to the create payload expected by the API:
 *  - FK string IDs → numbers
 *  - string monetary values → numbers
 *  - Date/string dates → ISO strings
 *  - Masks stripped from taxId, phone, postalCode
 *  - `situation` omitted (read-only on backend)
 *  - UI-hidden fields omitted
 */
export function supplierFormValuesToCreatePayload(
  form: SupplierFormValues,
): SupplierCreateIn {
  return {
    legalName: form.legalName,
    taxId: form.taxId.replace(/[.\-/]/g, ''),
    tradeName: form.tradeName || null,
    stateBusinessRegistration: form.stateBusinessRegistration || null,
    municipalBusinessRegistration: form.municipalBusinessRegistration || null,
    classification: toApiId(form.classification),
    category: toApiId(form.category),
    riskLevel: toApiId(form.riskLevel),
    type: toApiId(form.type),
    // situation intentionally omitted
    address: buildAddressPayload(form.address),
    contact: buildContactPayload(form.contact),
    paymentDetails: buildPaymentDetailsPayload(form.paymentDetails),
    organizationalDetails: buildOrganizationalDetailsPayload(
      form.organizationalDetails,
    ),
    fiscalDetails: buildFiscalDetailsPayload(form.fiscalDetails),
    companyInformation: buildCompanyInformationPayload(form.companyInformation),
    contract: buildContractPayload(form.contract),
  }
}

/**
 * `Partial<SupplierFormValues>` → `SupplierUpdateIn`
 *
 * Converts a partial form snapshot to the PATCH payload expected by the API.
 * Fields absent from `form` are omitted from the payload (not sent → not changed
 * on the server). This is used for step-by-step saves in edit mode.
 */
export function supplierFormValuesToUpdatePayload(
  form: Partial<SupplierFormValues>,
): SupplierUpdateIn {
  const payload: SupplierUpdateIn = {}

  if ('legalName' in form) payload.legalName = form.legalName ?? null
  if ('taxId' in form)
    payload.taxId = form.taxId ? form.taxId.replace(/[.\-/]/g, '') : null
  if ('tradeName' in form) payload.tradeName = form.tradeName || null
  if ('stateBusinessRegistration' in form)
    payload.stateBusinessRegistration = form.stateBusinessRegistration || null
  if ('municipalBusinessRegistration' in form)
    payload.municipalBusinessRegistration =
      form.municipalBusinessRegistration || null
  if ('classification' in form)
    payload.classification = toApiId(form.classification)
  if ('category' in form) payload.category = toApiId(form.category)
  if ('riskLevel' in form) payload.riskLevel = toApiId(form.riskLevel)
  if ('type' in form) payload.type = toApiId(form.type)
  // situation intentionally omitted

  if ('address' in form) payload.address = buildAddressPayload(form.address)
  if ('contact' in form) payload.contact = buildContactPayload(form.contact)
  if ('paymentDetails' in form)
    payload.paymentDetails = buildPaymentDetailsPayload(form.paymentDetails)
  if ('organizationalDetails' in form)
    payload.organizationalDetails = buildOrganizationalDetailsPayload(
      form.organizationalDetails,
    )
  if ('fiscalDetails' in form)
    payload.fiscalDetails = buildFiscalDetailsPayload(form.fiscalDetails)
  if ('companyInformation' in form)
    payload.companyInformation = buildCompanyInformationPayload(
      form.companyInformation,
    )
  if ('contract' in form) payload.contract = buildContractPayload(form.contract)

  return payload
}
