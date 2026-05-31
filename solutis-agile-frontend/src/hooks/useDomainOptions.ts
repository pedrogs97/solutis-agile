import { useQueries, type UseQueryResult } from '@tanstack/react-query'
import { useMemo } from 'react'

import axios from '@/lib/axios'
import * as domainApi from '@/services/api/domain'
import { type DomainOption } from '@/services/api/domain'
import type {
  CostCenter,
  EmployeeEducationalLevel,
  EmployeeGender,
  EmployeeMaritalStatus,
  EmployeeNationality,
  EmployeeRole,
} from '@/types/Employee'
import { type Workload } from '@/types/Lending'

const ONE_DAY_IN_MS = 1000 * 60 * 60 * 24

type DomainOptionKey =
  | 'classifications'
  | 'categories'
  | 'riskLevels'
  | 'supplierTypes'
  | 'supplierSituations'
  | 'pixTypes'
  | 'paymentMethods'
  | 'payerTypes'
  | 'businessSectors'
  | 'companySizes'
  | 'customerTypes'
  | 'taxpayerClassifications'
  | 'taxationRegimes'
  | 'taxationMethods'
  | 'icmsTaxpayers'
  | 'withholdingTaxes'
  | 'issWithholdings'
  | 'issRegimes'
  | 'incomeTypes'
  | 'publicEntities'
  | 'maritalStatus'
  | 'nationalities'
  | 'roles'
  | 'genders'
  | 'educationalLevels'
  | 'costCenters'
  | 'workloads'

const ALL_KEYS: DomainOptionKey[] = [
  'classifications',
  'categories',
  'riskLevels',
  'supplierTypes',
  'supplierSituations',
  'pixTypes',
  'paymentMethods',
  'payerTypes',
  'businessSectors',
  'companySizes',
  'customerTypes',
  'taxpayerClassifications',
  'taxationRegimes',
  'taxationMethods',
  'icmsTaxpayers',
  'withholdingTaxes',
  'issWithholdings',
  'issRegimes',
  'incomeTypes',
  'publicEntities',
  'maritalStatus',
  'nationalities',
  'roles',
  'genders',
  'educationalLevels',
  'costCenters',
  'workloads',
]

interface UseDomainOptionsConfig {
  keys?: DomainOptionKey[]
  enabled?: boolean
}

interface SelectOption {
  value: string
  label: string
}

type QueryResultData = DomainOption[] | SelectOption[]
type DomainQueryResult = UseQueryResult<QueryResultData, unknown>

interface QueryDefinition {
  queryKey: [string, string]
  queryFn: () => Promise<QueryResultData>
}

const mapToSelectOptions = <T>(
  values: T[] | null | undefined,
  mapper: (value: T) => SelectOption,
): SelectOption[] => {
  return (values ?? []).map(mapper)
}

const queryDefinitions: Record<DomainOptionKey, QueryDefinition> = {
  classifications: {
    queryKey: ['domain', 'classifications'],
    queryFn: async () => (await domainApi.getClassifications()).data,
  },
  categories: {
    queryKey: ['domain', 'categories'],
    queryFn: async () => (await domainApi.getCategories()).data,
  },
  riskLevels: {
    queryKey: ['domain', 'risk-levels'],
    queryFn: async () => (await domainApi.getRiskLevels()).data,
  },
  supplierTypes: {
    queryKey: ['domain', 'supplier-types'],
    queryFn: async () => (await domainApi.getSupplierTypes()).data,
  },
  supplierSituations: {
    queryKey: ['domain', 'supplier-situations'],
    queryFn: async () => (await domainApi.getSupplierSituations()).data,
  },
  pixTypes: {
    queryKey: ['domain', 'pix-types'],
    queryFn: async () => (await domainApi.getPixTypes()).data,
  },
  paymentMethods: {
    queryKey: ['domain', 'payment-methods'],
    queryFn: async () => (await domainApi.getPaymentMethods()).data,
  },
  payerTypes: {
    queryKey: ['domain', 'payer-types'],
    queryFn: async () => (await domainApi.getPayerTypes()).data,
  },
  maritalStatus: {
    queryKey: ['domain', 'marital-status'],
    queryFn: async () => {
      const { data } = await axios.get<EmployeeMaritalStatus[]>(
        '/people/marital-status/',
      )
      return mapToSelectOptions(data, (item) => ({
        value: String(item.id) ?? '',
        label: item.description,
      }))
    },
  },
  nationalities: {
    queryKey: ['domain', 'nationalities'],
    queryFn: async () => {
      const { data } = await axios.get<EmployeeNationality[]>(
        '/people/nationalities/',
      )
      return mapToSelectOptions(data, (item) => ({
        value: String(item.id) ?? '',
        label: item.description,
      }))
    },
  },
  roles: {
    queryKey: ['domain', 'roles'],
    queryFn: async () => {
      const { data } = await axios.get<EmployeeRole[]>('/people/roles/')
      return mapToSelectOptions(data, (item) => ({
        value: String(item.id) ?? '',
        label: item.name,
      }))
    },
  },
  genders: {
    queryKey: ['domain', 'genders'],
    queryFn: async () => {
      const { data } = await axios.get<EmployeeGender[]>('/people/genders/')
      return mapToSelectOptions(data, (item) => ({
        value: String(item.id) ?? '',
        label: item.description,
      }))
    },
  },
  educationalLevels: {
    queryKey: ['domain', 'educational-levels'],
    queryFn: async () => {
      const { data } = await axios.get<EmployeeEducationalLevel[]>(
        '/people/educational-level/',
      )
      return mapToSelectOptions(data, (item) => ({
        value: String(item.id) ?? '',
        label: item.description,
      }))
    },
  },
  businessSectors: {
    queryKey: ['domain', 'business-sectors'],
    queryFn: async () => (await domainApi.getBusinessSectors()).data,
  },
  companySizes: {
    queryKey: ['domain', 'company-sizes'],
    queryFn: async () => (await domainApi.getCompanySizes()).data,
  },
  customerTypes: {
    queryKey: ['domain', 'customer-types'],
    queryFn: async () => (await domainApi.getCustomerTypes()).data,
  },
  taxpayerClassifications: {
    queryKey: ['domain', 'taxpayer-classifications'],
    queryFn: async () => (await domainApi.getTaxpayerClassifications()).data,
  },
  taxationRegimes: {
    queryKey: ['domain', 'taxation-regimes'],
    queryFn: async () => (await domainApi.getTaxationRegimes()).data,
  },
  taxationMethods: {
    queryKey: ['domain', 'taxation-methods'],
    queryFn: async () => (await domainApi.getTaxationMethods()).data,
  },
  icmsTaxpayers: {
    queryKey: ['domain', 'icms-taxpayers'],
    queryFn: async () => (await domainApi.getIcmsTaxpayers()).data,
  },
  withholdingTaxes: {
    queryKey: ['domain', 'withholding-taxes'],
    queryFn: async () => (await domainApi.getWithholdingTaxes()).data,
  },
  issWithholdings: {
    queryKey: ['domain', 'iss-withholdings'],
    queryFn: async () => (await domainApi.getIssWithholdings()).data,
  },
  issRegimes: {
    queryKey: ['domain', 'iss-regimes'],
    queryFn: async () => (await domainApi.getIssRegimes()).data,
  },
  incomeTypes: {
    queryKey: ['domain', 'income-types'],
    queryFn: async () => (await domainApi.getIncomeTypes()).data,
  },
  publicEntities: {
    queryKey: ['domain', 'public-entities'],
    queryFn: async () => (await domainApi.getPublicEntities()).data,
  },
  costCenters: {
    queryKey: ['domain', 'cost-centers'],
    queryFn: async () => {
      const { data } = await axios.get<CostCenter[]>('/people/center-cost/', {
        params: {
          fields: 'id,name,code',
        },
      })
      return mapToSelectOptions(data, (item) => ({
        value: String(item.id) ?? '',
        label: `${item.name} - ${item.code}`,
      }))
    },
  },
  workloads: {
    queryKey: ['domain', 'workloads'],
    queryFn: async () => {
      const { data } = await axios.get<Workload[]>('/lendings-workloads/')
      return mapToSelectOptions(data, (item) => ({
        value: String(item.id) ?? '',
        label: item.name,
      }))
    },
  },
}

const formatOptionsForSelect = (
  options: DomainOption[] | undefined,
): SelectOption[] => {
  return (
    options?.map((option) => ({
      value: option.id.toString(),
      label: option.name,
    })) || []
  )
}

const formatSupplierSituationOptions = (
  options: DomainOption[] | undefined,
): SelectOption[] => {
  return (
    options?.map((option) => {
      const pendencyTypeName =
        (option as DomainOption & { pendencyType?: DomainOption | null })
          .pendencyType?.name ||
        (option as DomainOption & { pendency_type?: DomainOption | null })
          .pendency_type?.name

      return {
        value: option.id.toString(),
        label: pendencyTypeName
          ? `${option.name} - ${pendencyTypeName}`
          : option.name,
      }
    }) || []
  )
}

const getDomainList = (
  queryByKey: Record<DomainOptionKey, DomainQueryResult>,
  key: DomainOptionKey,
): DomainOption[] | undefined => {
  return queryByKey[key].data as DomainOption[] | undefined
}

const getSelectList = (
  queryByKey: Record<DomainOptionKey, DomainQueryResult>,
  key: DomainOptionKey,
): SelectOption[] => {
  return (queryByKey[key].data as SelectOption[] | undefined) ?? []
}

// Custom hook for domain options with React Query
export const useDomainOptions = (config?: UseDomainOptionsConfig) => {
  const isEnabled = config?.enabled ?? true
  const requestedKeys = useMemo(
    () =>
      isEnabled
        ? config?.keys && config.keys.length > 0
          ? config.keys
          : ALL_KEYS
        : [],
    [config?.keys, isEnabled],
  )

  const keySet = useMemo(() => new Set(requestedKeys), [requestedKeys])

  const queryResults = useQueries({
    queries: ALL_KEYS.map((key) => {
      const definition = queryDefinitions[key]
      return {
        queryKey: definition.queryKey,
        queryFn: definition.queryFn,
        staleTime: ONE_DAY_IN_MS,
        gcTime: ONE_DAY_IN_MS,
        enabled: keySet.has(key),
      }
    }),
  })

  const queryByKey = useMemo(() => {
    return ALL_KEYS.reduce(
      (acc, key, index) => {
        acc[key] = queryResults[index] as DomainQueryResult
        return acc
      },
      {} as Record<DomainOptionKey, DomainQueryResult>,
    )
  }, [queryResults])

  const classifications = getDomainList(queryByKey, 'classifications')
  const categories = getDomainList(queryByKey, 'categories')
  const riskLevels = getDomainList(queryByKey, 'riskLevels')
  const supplierTypes = getDomainList(queryByKey, 'supplierTypes')
  const supplierSituations = getDomainList(queryByKey, 'supplierSituations')
  const pixTypes = getDomainList(queryByKey, 'pixTypes')
  const paymentMethods = getDomainList(queryByKey, 'paymentMethods')
  const payerTypes = getDomainList(queryByKey, 'payerTypes')
  const businessSectors = getDomainList(queryByKey, 'businessSectors')
  const companySizes = getDomainList(queryByKey, 'companySizes')
  const customerTypes = getDomainList(queryByKey, 'customerTypes')
  const taxpayerClassifications = getDomainList(
    queryByKey,
    'taxpayerClassifications',
  )
  const taxationRegimes = getDomainList(queryByKey, 'taxationRegimes')
  const taxationMethods = getDomainList(queryByKey, 'taxationMethods')
  const icmsTaxpayers = getDomainList(queryByKey, 'icmsTaxpayers')
  const withholdingTaxes = getDomainList(queryByKey, 'withholdingTaxes')
  const issWithholdings = getDomainList(queryByKey, 'issWithholdings')
  const issRegimes = getDomainList(queryByKey, 'issRegimes')
  const incomeTypes = getDomainList(queryByKey, 'incomeTypes')
  const publicEntities = getDomainList(queryByKey, 'publicEntities')

  const maritalStatusOptions = getSelectList(queryByKey, 'maritalStatus')
  const nationalityOptions = getSelectList(queryByKey, 'nationalities')
  const roleOptions = getSelectList(queryByKey, 'roles')
  const genderOptions = getSelectList(queryByKey, 'genders')
  const educationalLevelOptions = getSelectList(queryByKey, 'educationalLevels')
  const costCenterOptions = getSelectList(queryByKey, 'costCenters')
  const workloadOptions = getSelectList(queryByKey, 'workloads')

  return {
    // Raw data
    classifications,
    categories,
    riskLevels,
    supplierTypes,
    supplierSituations,
    pixTypes,
    paymentMethods,
    payerTypes,
    maritalStatusOptions,
    nationalityOptions,
    roleOptions,
    genderOptions,
    educationalLevelOptions,
    businessSectors,
    companySizes,
    customerTypes,
    taxpayerClassifications,
    taxationRegimes,
    taxationMethods,
    icmsTaxpayers,
    withholdingTaxes,
    issWithholdings,
    issRegimes,
    incomeTypes,
    publicEntities,
    costCenterOptions,
    workloadOptions,

    // Formatted options for Select components
    classificationOptions: formatOptionsForSelect(classifications),
    categoryOptions: formatOptionsForSelect(categories),
    riskLevelOptions: formatOptionsForSelect(riskLevels),
    supplierTypeOptions: formatOptionsForSelect(supplierTypes),
    supplierSituationOptions:
      formatSupplierSituationOptions(supplierSituations),
    pixTypeOptions: formatOptionsForSelect(pixTypes),
    paymentMethodOptions: formatOptionsForSelect(paymentMethods),
    payerTypeOptions: formatOptionsForSelect(payerTypes),
    maritalStatus: maritalStatusOptions,
    nationalities: nationalityOptions,
    roles: roleOptions,
    genders: genderOptions,
    educationalLevels: educationalLevelOptions,
    businessSectorOptions: formatOptionsForSelect(businessSectors),
    companySizeOptions: formatOptionsForSelect(companySizes),
    customerTypeOptions: formatOptionsForSelect(customerTypes),
    taxpayerClassificationOptions: formatOptionsForSelect(
      taxpayerClassifications,
    ),
    taxationRegimeOptions: formatOptionsForSelect(taxationRegimes),
    taxationMethodOptions: formatOptionsForSelect(taxationMethods),
    icmsTaxpayerOptions: formatOptionsForSelect(icmsTaxpayers),
    withholdingTaxOptions: formatOptionsForSelect(withholdingTaxes),
    issWithholdingOptions: formatOptionsForSelect(issWithholdings),
    issRegimeOptions: formatOptionsForSelect(issRegimes),
    incomeTypeOptions: formatOptionsForSelect(incomeTypes),
    publicEntityOptions: formatOptionsForSelect(publicEntities),
    costCenters: costCenterOptions,
    workloads: workloadOptions,

    // Loading states
    isLoading: {
      classifications: queryByKey.classifications.isLoading,
      categories: queryByKey.categories.isLoading,
      riskLevels: queryByKey.riskLevels.isLoading,
      supplierTypes: queryByKey.supplierTypes.isLoading,
      supplierSituations: queryByKey.supplierSituations.isLoading,
      pixTypes: queryByKey.pixTypes.isLoading,
      paymentMethods: queryByKey.paymentMethods.isLoading,
      payerTypes: queryByKey.payerTypes.isLoading,
      maritalStatus: queryByKey.maritalStatus.isLoading,
      nationalities: queryByKey.nationalities.isLoading,
      roles: queryByKey.roles.isLoading,
      genders: queryByKey.genders.isLoading,
      educationalLevels: queryByKey.educationalLevels.isLoading,
      businessSectors: queryByKey.businessSectors.isLoading,
      companySizes: queryByKey.companySizes.isLoading,
      customerTypes: queryByKey.customerTypes.isLoading,
      taxpayerClassifications: queryByKey.taxpayerClassifications.isLoading,
      taxationRegimes: queryByKey.taxationRegimes.isLoading,
      taxationMethods: queryByKey.taxationMethods.isLoading,
      icmsTaxpayers: queryByKey.icmsTaxpayers.isLoading,
      withholdingTaxes: queryByKey.withholdingTaxes.isLoading,
      issWithholdings: queryByKey.issWithholdings.isLoading,
      issRegimes: queryByKey.issRegimes.isLoading,
      incomeTypes: queryByKey.incomeTypes.isLoading,
      publicEntities: queryByKey.publicEntities.isLoading,
      costCenters: queryByKey.costCenters.isLoading,
      workloads: queryByKey.workloads.isLoading,
    },

    // Error states
    errors: {
      classifications: queryByKey.classifications.error,
      categories: queryByKey.categories.error,
      riskLevels: queryByKey.riskLevels.error,
      supplierTypes: queryByKey.supplierTypes.error,
      supplierSituations: queryByKey.supplierSituations.error,
      pixTypes: queryByKey.pixTypes.error,
      paymentMethods: queryByKey.paymentMethods.error,
      payerTypes: queryByKey.payerTypes.error,
      maritalStatus: queryByKey.maritalStatus.error,
      nationalities: queryByKey.nationalities.error,
      roles: queryByKey.roles.error,
      genders: queryByKey.genders.error,
      educationalLevels: queryByKey.educationalLevels.error,
      businessSectors: queryByKey.businessSectors.error,
      companySizes: queryByKey.companySizes.error,
      customerTypes: queryByKey.customerTypes.error,
      taxpayerClassifications: queryByKey.taxpayerClassifications.error,
      taxationRegimes: queryByKey.taxationRegimes.error,
      taxationMethods: queryByKey.taxationMethods.error,
      icmsTaxpayers: queryByKey.icmsTaxpayers.error,
      withholdingTaxes: queryByKey.withholdingTaxes.error,
      issWithholdings: queryByKey.issWithholdings.error,
      issRegimes: queryByKey.issRegimes.error,
      incomeTypes: queryByKey.incomeTypes.error,
      publicEntities: queryByKey.publicEntities.error,
      costCenters: queryByKey.costCenters.error,
      workloads: queryByKey.workloads.error,
    },
  }
}
