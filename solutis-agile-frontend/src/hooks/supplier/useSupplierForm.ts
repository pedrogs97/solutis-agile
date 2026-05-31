'use client'

import { notifications } from '@mantine/notifications'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { type RefObject, useEffect, useMemo, useState } from 'react'
import { type FieldErrors, type Resolver, useForm } from 'react-hook-form'

import { createSupplier as apiCreateSupplier } from '@/api/generated/clients/createSupplier.ts'
import { patchSupplier as apiPatchSupplier } from '@/api/generated/clients/patchSupplier.ts'
import { getSupplierQueryKey } from '@/api/generated/hooks/useGetSupplier.ts'
import { listSuppliersQueryKey } from '@/api/generated/hooks/useListSuppliers.ts'
import { type ResponsibilityMatrixTabRef } from '@/components/suppliers/form/responsibility-matrix-tab'
import { useDomainOptions } from '@/hooks/useDomainOptions'
import { useFormPersistence } from '@/hooks/useFormPersistence'
import { normalizeApiErrors } from '@/lib/api-errors'
import {
  supplierFormValuesToCreatePayload,
  supplierFormValuesToUpdatePayload,
} from '@/lib/supplier-mappers'
import {
  getPixType,
  pixKeyTypeFromLabel,
  validatePixKey,
  validatePixKeyMatchesType,
} from '@/lib/validations/pix'
import { type DomainOption } from '@/services/api/domain'
import {
  type ResponsibilityMatrixData,
  saveResponsibilityMatrix,
  updateResponsibilityMatrix,
  uploadSupplierAttachment,
} from '@/services/api/supplier'
import {
  SUPPLIER_FORM_DEFAULT_VALUES,
  type SupplierFormValues,
} from '@/types/supplier-form'
import { fetchCep } from '@/utils/cep'

/** Canonical form data type — re-exported for consumers that still use this name. */
export type SupplierFormData = SupplierFormValues

export interface UploadedFile {
  id: string
  documentId: string
  file: File
  uploadDate: Date
}

export interface SupplierFormTab {
  value: string
  label: string
  step: number
}

export const TABS: SupplierFormTab[] = [
  { value: 'general-data', label: 'Dados Gerais', step: 1 },
  { value: 'additional-data', label: 'Dados Adicionais', step: 2 },
  { value: 'attachments', label: 'Anexos', step: 3 },
  {
    value: 'responsibility-matrix',
    label: 'Matriz de Responsabilidade',
    step: 4,
  },
  {
    value: 'approval-workflow',
    label: 'Fluxo de Aprovação',
    step: 5,
  },
  {
    value: 'performance-evaluation',
    label: 'Avaliação de Desempenho',
    step: 6,
  },
]

export const getSupplierTabs = (mode: 'create' | 'edit'): SupplierFormTab[] => {
  if (mode === 'create') {
    return TABS.filter(
      (tab) =>
        tab.value !== 'performance-evaluation' &&
        tab.value !== 'approval-workflow',
    )
  }
  return TABS
}

const STEP_FIELDS: Record<number, readonly string[]> = {
  1: [
    'classification',
    'category',
    'riskLevel',
    'type',
    'situation',
    'legalName',
    'tradeName',
    'taxId',
    'stateBusinessRegistration',
    'municipalBusinessRegistration',
    'address.postalCode',
    'address.street',
    'address.neighbourhood',
    'address.city',
    'address.state',
    'address.number',
    'address.complement',
    'contact.name',
    'contact.email',
    'contact.phone',
    'organizationalDetails.businessSector',
    'fiscalDetails.simplesNacionalParticipant',
    'companyInformation.companySize',
  ],
  2: [
    'contract.objectContract',
    'contract.executedActivities',
    'contract.contractStartDate',
    'contract.contractEndDate',
    'contract.contractType',
    'contract.contractPeriod',
    'contract.warningContractPeriod',
    'paymentDetails.paymentFrequency',
    'paymentDetails.paymentDate',
    'paymentDetails.contractTotalValue',
    'paymentDetails.contractMonthlyValue',
    'paymentDetails.bank',
    'paymentDetails.bankCode',
    'paymentDetails.agency',
    'paymentDetails.checkingAccount',
    'paymentDetails.pixKey',
    'paymentDetails.paymentMethod',
    'paymentDetails.pixKeyType',
    'organizationalDetails.costCenter',
    'organizationalDetails.businessUnit',
    'organizationalDetails.responsibleExecutive',
    'organizationalDetails.responsibleManager',
  ],
  3: [],
  4: [],
  5: [],
  6: [],
}

const STEPS_WITH_FORM_VALIDATION = [1, 2] as const

const supplierFormResolver: Resolver<SupplierFormValues> = (
  values,
  _context,
  options,
) => {
  const errors: Record<string, { type: string; message: string }> = {}
  const resolverFieldNames =
    options?.names && options.names.length > 0
      ? options.names
      : Object.keys(options?.fields ?? {})

  const shouldValidateField = (fieldName: string) => {
    if (!resolverFieldNames || resolverFieldNames.length === 0) {
      return true
    }
    return resolverFieldNames.some(
      (name) =>
        name === fieldName ||
        name.startsWith(`${fieldName}.`) ||
        fieldName.startsWith(`${name}.`),
    )
  }

  const setError = (field: string, message: string, type = 'validation') => {
    if (!shouldValidateField(field)) return
    errors[field] = { type, message }
  }

  const isEmpty = (value: unknown) =>
    value === undefined ||
    value === null ||
    (typeof value === 'string' && value.trim().length === 0)

  const setRequired = (field: string, value: unknown, message: string) => {
    if (isEmpty(value)) {
      setError(field, message, 'required')
    }
  }

  const setMaxLength = (
    field: string,
    value: unknown,
    maxLength: number,
    message: string,
  ) => {
    if (isEmpty(value)) return
    const normalized = String(value).trim()
    if (normalized.length > maxLength) {
      setError(field, message, 'maxLength')
    }
  }

  setRequired('legalName', values.legalName, 'Razão Social é obrigatória.')
  setRequired('taxId', values.taxId, 'CPF/CNPJ é obrigatório.')
  setRequired('riskLevel', values.riskLevel, 'Nível de risco é obrigatório.')

  setRequired(
    'address.postalCode',
    values.address?.postalCode,
    'CEP é obrigatório.',
  )
  setRequired('address.number', values.address?.number, 'Número é obrigatório.')
  setRequired(
    'address.street',
    values.address?.street,
    'Logradouro é obrigatório.',
  )
  setRequired(
    'address.neighbourhood',
    values.address?.neighbourhood,
    'Bairro é obrigatório.',
  )
  setRequired('address.city', values.address?.city, 'Cidade é obrigatória.')
  setRequired('address.state', values.address?.state, 'Estado é obrigatório.')

  setRequired(
    'contact.name',
    values.contact?.name,
    'Nome do contato é obrigatório.',
  )
  setRequired('contact.phone', values.contact?.phone, 'Telefone é obrigatório.')

  const normalizedPhone = String(values.contact?.phone || '').replace(/\D/g, '')
  if (
    normalizedPhone.length > 0 &&
    normalizedPhone.length !== 10 &&
    normalizedPhone.length !== 11
  ) {
    setError('contact.phone', 'Telefone deve conter DDD + 8 ou 9 dígitos')
  }

  setMaxLength(
    'stateBusinessRegistration',
    values.stateBusinessRegistration,
    20,
    'Inscrição Estadual deve ter no máximo 20 caracteres',
  )
  setMaxLength(
    'municipalBusinessRegistration',
    values.municipalBusinessRegistration,
    20,
    'Inscrição Municipal deve ter no máximo 20 caracteres',
  )
  setMaxLength(
    'address.complement',
    values.address?.complement,
    255,
    'Complemento deve ter no máximo 255 caracteres',
  )
  setMaxLength(
    'contract.contractType',
    values.contract?.contractType,
    50,
    'Tipo de Contrato deve ter no máximo 50 caracteres',
  )
  setMaxLength(
    'contract.contractPeriod',
    values.contract?.contractPeriod,
    50,
    'Período do Contrato deve ter no máximo 50 caracteres',
  )
  setMaxLength(
    'contract.objectContract',
    values.contract?.objectContract,
    255,
    'Objeto do Contrato deve ter no máximo 255 caracteres',
  )
  setMaxLength(
    'contract.warningContractPeriod',
    values.contract?.warningContractPeriod,
    3,
    'Aviso Prévio de Contrato deve ter no máximo 3 caracteres',
  )
  setMaxLength(
    'paymentDetails.paymentDate',
    values.paymentDetails?.paymentDate,
    100,
    'Data de Pagamento deve ter no máximo 100 caracteres',
  )
  setMaxLength(
    'paymentDetails.bank',
    values.paymentDetails?.bank,
    50,
    'Banco deve ter no máximo 50 caracteres',
  )
  setMaxLength(
    'paymentDetails.bankCode',
    values.paymentDetails?.bankCode,
    50,
    'Código do Banco deve ter no máximo 50 caracteres',
  )
  setMaxLength(
    'paymentDetails.agency',
    values.paymentDetails?.agency,
    20,
    'Agência deve ter no máximo 20 caracteres',
  )
  setMaxLength(
    'paymentDetails.checkingAccount',
    values.paymentDetails?.checkingAccount,
    20,
    'C/C deve ter no máximo 20 caracteres',
  )
  setMaxLength(
    'organizationalDetails.costCenter',
    values.organizationalDetails?.costCenter,
    50,
    'Centro de Custo deve ter no máximo 50 caracteres',
  )
  setMaxLength(
    'organizationalDetails.businessUnit',
    values.organizationalDetails?.businessUnit,
    100,
    'BU deve ter no máximo 100 caracteres',
  )
  setMaxLength(
    'organizationalDetails.responsibleExecutive',
    values.organizationalDetails?.responsibleExecutive,
    255,
    'Executivo Responsável deve ter no máximo 255 caracteres',
  )
  setMaxLength(
    'organizationalDetails.responsibleManager',
    values.organizationalDetails?.responsibleManager,
    255,
    'Gestor Responsável deve ter no máximo 255 caracteres',
  )
  setMaxLength(
    'companyInformation.nit',
    values.companyInformation?.nit,
    20,
    'NIT deve ter no máximo 20 caracteres',
  )

  if (Object.keys(errors).length > 0) {
    return { values: {}, errors } as ReturnType<Resolver<SupplierFormValues>>
  }
  return { values, errors: {} }
}

// Custom validation function for PIX fields
export type PixValidationErrorField =
  | 'paymentDetails.pixKey'
  | 'paymentDetails.pixKeyType'

export type PixValidationResult =
  | true
  | { field: PixValidationErrorField; message: string }

export const validatePixFields = (
  pixKey: string,
  pixKeyType: number | string | undefined,
  pixTypes?: DomainOption[],
): PixValidationResult => {
  const normalizedPixKey = (pixKey ?? '').trim()
  const hasPixKey = normalizedPixKey.length > 0
  const hasPixKeyType =
    pixKeyType !== undefined &&
    pixKeyType !== null &&
    String(pixKeyType).trim().length > 0

  if (!hasPixKey && !hasPixKeyType) {
    return true
  }

  if (hasPixKey && !hasPixKeyType) {
    return {
      field: 'paymentDetails.pixKeyType',
      message: 'Tipo da chave PIX é obrigatório quando a chave PIX é informada',
    }
  }

  if (!hasPixKey && hasPixKeyType) {
    return true
  }

  const normalizedPixKeyType =
    typeof pixKeyType === 'string' ? parseInt(pixKeyType, 10) : pixKeyType

  if (!normalizedPixKeyType || Number.isNaN(normalizedPixKeyType)) {
    return {
      field: 'paymentDetails.pixKeyType',
      message: 'Tipo da chave PIX inválido',
    }
  }

  if (!validatePixKey(normalizedPixKey)) {
    return { field: 'paymentDetails.pixKey', message: 'Chave PIX inválida' }
  }

  if (pixTypes && pixTypes.length > 0) {
    const selectedPixType = pixTypes.find(
      (t) => String(t.id) === String(normalizedPixKeyType),
    )

    if (!selectedPixType) {
      return {
        field: 'paymentDetails.pixKeyType',
        message: 'Tipo da chave PIX inválido',
      }
    }

    const expectedType = pixKeyTypeFromLabel(selectedPixType.name)

    if (
      expectedType &&
      !validatePixKeyMatchesType(normalizedPixKey, expectedType)
    ) {
      const detected = getPixType(normalizedPixKey)
      const detectedLabel =
        detected === 'cpf'
          ? 'CPF'
          : detected === 'cnpj'
            ? 'CNPJ'
            : detected === 'email'
              ? 'E-mail'
              : detected === 'phone'
                ? 'Telefone'
                : detected === 'random'
                  ? 'Chave Aleatória'
                  : 'desconhecido'

      return {
        field: 'paymentDetails.pixKey',
        message: `Chave PIX não corresponde ao tipo ${selectedPixType.name} (detectado: ${detectedLabel})`,
      }
    }
  }

  return true
}

interface UseSupplierFormProps {
  mode: 'create' | 'edit'
  supplierId?: string
  initialData?: SupplierFormValues
  responsibilityMatrixInitialData?: ResponsibilityMatrixData
  onGetResponsibilityMatrixData?: (
    supplierId: number,
  ) => Promise<ResponsibilityMatrixData>
  matrixTabRef?: RefObject<ResponsibilityMatrixTabRef>
}

export function useSupplierForm({
  mode,
  supplierId,
  initialData,
  responsibilityMatrixInitialData,
  onGetResponsibilityMatrixData,
}: UseSupplierFormProps) {
  const { pixTypes } = useDomainOptions({ keys: ['pixTypes'] })
  const tabs = useMemo(() => getSupplierTabs(mode), [mode])

  const [activeTab, setActiveTab] = useState('general-data')
  const [currentStep, setCurrentStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [attachmentFiles, setAttachmentFiles] = useState<UploadedFile[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const defaultValues = useMemo(
    () => initialData ?? SUPPLIER_FORM_DEFAULT_VALUES,
    [initialData],
  )

  const form = useForm<SupplierFormValues>({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues,
    resolver: supplierFormResolver,
  })

  const formPersistence = useFormPersistence({
    form,
    key: supplierId ? `supplier_edit_${supplierId}` : 'supplier_create',
    enabled: mode === 'create',
    debounceMs: 1500,
  })

  const clearAllDrafts = () => {
    formPersistence.clearStorage()
    try {
      localStorage.removeItem('form_draft_supplier_matrix')
    } catch (error) {
      console.warn('Failed to clear matrix draft:', error)
    }
  }

  const isBlankValue = (value: unknown): boolean =>
    value === undefined ||
    value === null ||
    (typeof value === 'string' && value.trim().length === 0)

  const getHttpStatus = (error: unknown): number | undefined => {
    return (error as { response?: { status?: number } })?.response?.status
  }

  const persistResponsibilityMatrix = async (
    supplierId: number,
    mode: 'create' | 'edit',
  ) => {
    if (!onGetResponsibilityMatrixData) return

    const matrixPayload = await onGetResponsibilityMatrixData(supplierId)
    const hasMeaningfulMatrixValue = Object.entries(matrixPayload).some(
      ([key, value]) =>
        key !== 'supplier' &&
        key !== 'id' &&
        key !== 'createdAt' &&
        key !== 'updatedAt' &&
        !isBlankValue(value) &&
        String(value).trim() !== '-',
    )
    const hasExistingMatrix = Boolean(responsibilityMatrixInitialData)

    if (
      !hasMeaningfulMatrixValue &&
      (mode === 'create' || !hasExistingMatrix)
    ) {
      return
    }

    if (mode === 'create') {
      await saveResponsibilityMatrix(matrixPayload)
      return
    }

    try {
      await updateResponsibilityMatrix(supplierId, matrixPayload)
    } catch (error) {
      if (getHttpStatus(error) === 404) {
        await saveResponsibilityMatrix(matrixPayload)
        return
      }
      throw error
    }
  }

  function getFieldsForStep(step: number) {
    return STEP_FIELDS[step] ?? []
  }

  const getAllValidationFields = () => {
    return Array.from(
      new Set(
        STEPS_WITH_FORM_VALIDATION.flatMap((step) => getFieldsForStep(step)),
      ),
    )
  }

  const validateWarningContractPeriod = (
    showNotification: boolean,
  ): boolean => {
    const warningOnPeriod = form.getValues('contract.warningOnPeriod') as
      | boolean
      | string
      | undefined
    const warningContractPeriod = form.getValues(
      'contract.warningContractPeriod',
    )
    const isWarningOnPeriodEnabled =
      warningOnPeriod === true || warningOnPeriod === 'true'

    if (isWarningOnPeriodEnabled) {
      if (
        !warningContractPeriod ||
        String(warningContractPeriod).trim().length === 0
      ) {
        const message =
          'Aviso Prévio de Contrato é obrigatório quando "Tem Aviso Prévio de Contrato" é Sim.'

        form.setError('contract.warningContractPeriod', {
          type: 'custom',
          message,
        })

        if (showNotification) {
          notifications.show({
            title: 'Erro de validação',
            message,
            color: 'red',
            autoClose: 5000,
          })
        }

        return false
      }

      return true
    }

    if (
      warningContractPeriod &&
      String(warningContractPeriod).trim().length > 0
    ) {
      form.setValue('contract.warningContractPeriod', '')
    }
    form.clearErrors('contract.warningContractPeriod')
    return true
  }

  const toCamelCase = (value: string) =>
    value.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())

  const normalizeFieldPath = (path: string) =>
    path
      .split('.')
      .map((part) => toCamelCase(part))
      .join('.')

  const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    !!value && typeof value === 'object' && !Array.isArray(value)

  const isErrorMetaObject = (
    value: unknown,
  ): value is Record<string, unknown> => {
    if (!isPlainObject(value)) return false
    const keys = Object.keys(value)
    if (keys.length === 0) return false
    const allowedKeys = new Set(['field', 'message', 'code', 'detail'])
    return keys.every((key) => allowedKeys.has(key))
  }

  const extractErrorMessage = (value: unknown): string | null => {
    if (typeof value === 'string') return value
    if (Array.isArray(value)) {
      for (const item of value) {
        const message = extractErrorMessage(item)
        if (message) return message
      }
      return null
    }
    if (isPlainObject(value)) {
      if (typeof value.field === 'string' && value.field.trim()) {
        return value.field
      }
      if (typeof value.message === 'string' && value.message.trim()) {
        return value.message
      }
      if (typeof value.detail === 'string' && value.detail.trim()) {
        return value.detail
      }
    }
    return null
  }

  const collectFieldErrors = (
    value: unknown,
    path = '',
  ): { path: string; message: string }[] => {
    if (value === null || value === undefined) return []

    if (typeof value === 'string') {
      return path ? [{ path, message: value }] : []
    }

    if (Array.isArray(value)) {
      const message = extractErrorMessage(value)
      if (message && path) {
        return [{ path, message }]
      }
      return value.flatMap((item) => collectFieldErrors(item, path))
    }

    if (isPlainObject(value)) {
      if (isErrorMetaObject(value)) {
        const message = extractErrorMessage(value)
        return message && path ? [{ path, message }] : []
      }

      return Object.entries(value).flatMap(([key, val]) => {
        const nextPath = path ? `${path}.${key}` : key
        if (isErrorMetaObject(val)) {
          const message = extractErrorMessage(val)
          return message ? [{ path: nextPath, message }] : []
        }
        if (typeof val === 'string') {
          return [{ path: nextPath, message: val }]
        }
        if (Array.isArray(val)) {
          const message = extractErrorMessage(val)
          if (message) {
            return [{ path: nextPath, message }]
          }
        }
        return collectFieldErrors(val, nextPath)
      })
    }

    return []
  }

  const resolveStepForFieldPath = (fieldPath: string): number | null => {
    for (let step = 1; step <= tabs.length; step += 1) {
      const fields = getFieldsForStep(step) as readonly string[]
      if (
        fields.some(
          (field) =>
            fieldPath === field ||
            fieldPath.startsWith(`${field}.`) ||
            field.startsWith(`${fieldPath}.`),
        )
      ) {
        return step
      }
    }
    return null
  }

  const navigateToStep = (step: number) => {
    const tab = tabs.find((item) => item.step === step)
    if (!tab) return
    setCurrentStep(tab.step)
    setActiveTab(tab.value)
  }

  const focusFieldPath = (fieldPath: string) => {
    window.setTimeout(() => {
      try {
        form.setFocus(fieldPath as Parameters<typeof form.setFocus>[0])
      } catch {
        // ignored: some custom fields don't expose focus to RHF
      }

      const escapedFieldPath =
        typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
          ? CSS.escape(fieldPath)
          : fieldPath
      const fieldElement = document.querySelector(
        `[name="${escapedFieldPath}"]`,
      ) as HTMLElement | null
      fieldElement?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 160)
  }

  const getFirstFormError = (
    value: unknown,
    path = '',
  ): { path: string; message: string } | null => {
    if (!value || typeof value !== 'object') return null

    const entries = Object.entries(value as Record<string, unknown>)
    for (const [key, nestedValue] of entries) {
      const nextPath = path ? `${path}.${key}` : key

      if (
        nestedValue &&
        typeof nestedValue === 'object' &&
        'message' in (nestedValue as Record<string, unknown>) &&
        typeof (nestedValue as Record<string, unknown>).message === 'string'
      ) {
        const message = String(
          (nestedValue as Record<string, unknown>).message,
        ).trim()
        if (message) {
          return { path: nextPath, message }
        }
      }

      const nested = getFirstFormError(nestedValue, nextPath)
      if (nested) return nested
    }

    return null
  }

  const showValidationNotification = (message?: string) => {
    notifications.show({
      title: 'Erro de validação',
      message: message || 'Corrija os campos destacados.',
      color: 'red',
      autoClose: 5000,
    })
  }

  const focusFirstInvalidField = (showNotification: boolean) => {
    const firstError = getFirstFormError(
      form.formState.errors as FieldErrors<SupplierFormValues>,
    )
    if (!firstError) {
      if (showNotification) {
        showValidationNotification()
      }
      return false
    }

    const step = resolveStepForFieldPath(firstError.path)
    if (step) {
      navigateToStep(step)
    }

    focusFieldPath(firstError.path)

    if (showNotification) {
      showValidationNotification(firstError.message)
    }

    return true
  }

  const markStepAsCompleted = (step: number) => {
    if (step < 1 || step > tabs.length) return
    setCompletedSteps((previous) =>
      previous.includes(step) ? previous : [...previous, step],
    )
  }

  const markFormAsSaved = () => {
    const currentValues = form.getValues()
    form.reset(currentValues)
  }

  const applyApiErrors = (error: unknown) => {
    const data =
      (error as { response?: { data?: unknown }; data?: unknown })?.response
        ?.data ?? (error as { data?: unknown })?.data
    if (!data || typeof data !== 'object') return false

    const normalized = normalizeApiErrors(data)
    if (normalized.length > 0) {
      normalized.forEach(({ field, error: msg }) => {
        if (field === 'general') return
        const path = normalizeFieldPath(field)
        form.setError(path as Parameters<typeof form.setError>[0], {
          type: 'server',
          message: msg,
        })
      })

      const firstWithField = normalized.find(({ field }) => field !== 'general')
      if (firstWithField) {
        const path = normalizeFieldPath(firstWithField.field)
        const step = resolveStepForFieldPath(path)
        if (step) {
          navigateToStep(step)
          focusFieldPath(path)
        }
      }

      const firstError = normalized[0]
      notifications.show({
        title: 'Erro',
        message: firstError?.error ?? 'Corrija os campos destacados.',
        color: 'red',
        autoClose: 5000,
      })
      return true
    }

    const collected = collectFieldErrors(data)
    if (collected.length === 0) {
      const fallbackMessage = extractErrorMessage(data)
      if (fallbackMessage) {
        notifications.show({
          title: 'Erro',
          message: fallbackMessage,
          color: 'red',
          autoClose: 5000,
        })
      }
      return false
    }

    const normalizedFromDrf = collected.map(({ path, message }) => ({
      path: normalizeFieldPath(path),
      message,
    }))

    normalizedFromDrf.forEach(({ path, message }) => {
      form.setError(path as Parameters<typeof form.setError>[0], {
        type: 'server',
        message,
      })
    })

    const firstError = normalizedFromDrf[0]
    const step = firstError ? resolveStepForFieldPath(firstError.path) : null

    if (step && firstError) {
      navigateToStep(step)
      focusFieldPath(firstError.path)
    }

    notifications.show({
      title: 'Erro',
      message: firstError?.message ?? 'Corrija os campos destacados.',
      color: 'red',
      autoClose: 5000,
    })

    return true
  }

  useEffect(() => {
    if (initialData?.address?.postalCode) {
      fetchCep(initialData.address.postalCode).then(async (data) => {
        if (data) {
          form.setValue('address.street', data.logradouro || '')
          form.setValue('address.neighbourhood', data.bairro || '')
          form.setValue('address.state', data.uf || '')
          form.setValue('address.city', data.localidade || '')
          await form.trigger('address')
        }
      })
    }
  }, [initialData])

  // Create supplier mutation
  const { mutateAsync: createSupplier, isPending: isCreating } = useMutation({
    mutationFn: (data: SupplierFormValues) =>
      apiCreateSupplier(supplierFormValuesToCreatePayload(data)),
    onSuccess: async (response) => {
      const newSupplierId = response.id!

      if (attachmentFiles.length > 0 && newSupplierId) {
        try {
          await Promise.all(
            attachmentFiles.map((file) =>
              uploadSupplierAttachment(
                newSupplierId.toString(),
                file.documentId,
                file.file,
              ),
            ),
          )
          setAttachmentFiles([])
        } catch (error) {
          console.error('Error uploading attachments:', error)
        }
      }

      try {
        await persistResponsibilityMatrix(newSupplierId, 'create')
      } catch (error) {
        console.error('Error saving responsibility matrix:', error)
        notifications.show({
          title: 'Atenção',
          message:
            'Fornecedor criado, mas houve falha ao salvar a matriz de responsabilidade.',
          color: 'yellow',
          autoClose: 7000,
        })
      }

      notifications.show({
        title: 'Sucesso',
        message: 'Fornecedor criado com sucesso',
        color: 'green',
        autoClose: 5000,
      })
      queryClient.invalidateQueries({ queryKey: listSuppliersQueryKey() })
      clearAllDrafts()
      navigate({ to: '/suppliers' })
    },
    onError: (error: unknown) => {
      console.error('Error creating supplier:', error)
      if (!applyApiErrors(error)) {
        notifications.show({
          title: 'Erro',
          message: 'Erro ao criar fornecedor. Tente novamente.',
          color: 'red',
          autoClose: 5000,
        })
      }
    },
  })

  // Update supplier mutation
  interface UpdateSupplierMutationInput {
    payload: Partial<SupplierFormValues>
    persistAttachments?: boolean
    persistResponsibilityMatrix?: boolean
  }

  const { mutateAsync: updateSupplierData, isPending: isUpdating } =
    useMutation({
      mutationFn: ({ payload }: UpdateSupplierMutationInput) =>
        apiPatchSupplier(
          Number(supplierId!),
          supplierFormValuesToUpdatePayload(payload),
        ),
      onSuccess: async (response, variables) => {
        const updatedSupplierId = response.id!

        if (
          variables.persistAttachments &&
          attachmentFiles.length > 0 &&
          updatedSupplierId
        ) {
          try {
            await Promise.all(
              attachmentFiles.map((file) =>
                uploadSupplierAttachment(
                  updatedSupplierId.toString(),
                  file.documentId,
                  file.file,
                ),
              ),
            )
            setAttachmentFiles([])
          } catch (error) {
            console.error('Error uploading attachments:', error)
          }
        }

        if (variables.persistResponsibilityMatrix) {
          try {
            await persistResponsibilityMatrix(updatedSupplierId, 'edit')
          } catch (error) {
            console.error('Error updating responsibility matrix:', error)
            notifications.show({
              title: 'Atenção',
              message: 'Matriz de responsabilidade não preenchida.',
              color: 'yellow',
              autoClose: 7000,
            })
          }
        }

        notifications.show({
          title: 'Sucesso',
          message: 'Fornecedor atualizado com sucesso',
          color: 'green',
          autoClose: 5000,
        })
        queryClient.invalidateQueries({ queryKey: listSuppliersQueryKey() })
        queryClient.invalidateQueries({
          queryKey: getSupplierQueryKey(Number(supplierId)),
        })
      },
      onError: (error: unknown) => {
        console.error('Error updating supplier:', error)
        if (!applyApiErrors(error)) {
          notifications.show({
            title: 'Erro',
            message: 'Erro ao atualizar fornecedor. Tente novamente.',
            color: 'red',
            autoClose: 5000,
          })
        }
      },
    })

  const validateStepSpecificRules = (
    step: number,
    showNotification: boolean,
  ): boolean => {
    if (step !== 2) {
      return true
    }

    if (!validateWarningContractPeriod(showNotification)) {
      return false
    }

    const data = form.getValues()
    const pixKey = data.paymentDetails?.pixKey ?? ''
    const pixKeyType = data.paymentDetails?.pixKeyType
    const pixValidation = validatePixFields(
      pixKey,
      pixKeyType as string | number | undefined,
      pixTypes,
    )

    if (pixValidation !== true) {
      form.setError(pixValidation.field, {
        type: 'custom',
        message: pixValidation.message,
      })
      if (showNotification) {
        showValidationNotification(pixValidation.message)
      }
      return false
    }

    return true
  }

  const validateStep = async (
    step: number,
    options?: { showNotification?: boolean; focusOnError?: boolean },
  ) => {
    const showNotification = options?.showNotification ?? false
    const focusOnError = options?.focusOnError ?? false
    const fieldsToValidate = getFieldsForStep(step)
    const isStepFormValid =
      fieldsToValidate.length > 0
        ? await form.trigger(
            fieldsToValidate as Parameters<typeof form.trigger>[0],
            { shouldFocus: false },
          )
        : true
    const isStepSpecificValid = validateStepSpecificRules(
      step,
      showNotification && !focusOnError,
    )
    const isValid = isStepFormValid && isStepSpecificValid

    if (!isValid && focusOnError) {
      focusFirstInvalidField(showNotification)
    }

    if (!isValid && showNotification && !focusOnError) {
      showValidationNotification()
    }

    return isValid
  }

  const validateCurrentStep = async (options?: {
    showNotification?: boolean
    focusOnError?: boolean
  }) => {
    return validateStep(currentStep, options)
  }

  const validateAllSteps = async () => {
    const allFields = getAllValidationFields()
    const baseFormValidation =
      allFields.length > 0
        ? await form.trigger(allFields as Parameters<typeof form.trigger>[0], {
            shouldFocus: false,
          })
        : true

    if (!baseFormValidation) {
      return false
    }

    for (const step of STEPS_WITH_FORM_VALIDATION) {
      if (!validateStepSpecificRules(step, false)) {
        return false
      }
    }

    return true
  }

  const handleSaveProgress = async () => {
    setIsValidating(true)
    const isFormValid = await validateAllSteps()

    if (!isFormValid) {
      setIsValidating(false)
      focusFirstInvalidField(true)
      return
    }

    setCompletedSteps((previous) =>
      Array.from(new Set([...previous, ...STEPS_WITH_FORM_VALIDATION])),
    )

    const data = form.getValues()
    setIsSaving(true)
    setIsValidating(false)

    try {
      await updateSupplierData({
        payload: data,
        persistAttachments: true,
        persistResponsibilityMatrix: true,
      })
      markFormAsSaved()
    } catch (error) {
      console.error('Error saving progress:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleNextStep = async () => {
    const isValid = await validateCurrentStep({
      showNotification: true,
      focusOnError: true,
    })

    if (!isValid) {
      return
    }

    markStepAsCompleted(currentStep)

    if (currentStep < tabs.length) {
      const nextStep = currentStep + 1
      const nextTab = tabs.find((tab) => tab.step === nextStep)
      if (nextTab) {
        setCurrentStep(nextStep)
        setActiveTab(nextTab.value)
      }
    }
  }

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1
      const prevTab = tabs.find((tab) => tab.step === prevStep)
      if (prevTab) {
        setCurrentStep(prevStep)
        setActiveTab(prevTab.value)
      }
    }
  }

  const handleTabChange = (tab: string | null) => {
    if (!tab) return

    const targetTab = tabs.find((t) => t.value === tab)
    if (!targetTab) return

    if (mode === 'edit') {
      setActiveTab(tab)
      setCurrentStep(targetTab.step)
    } else {
      if (
        completedSteps.includes(targetTab.step) ||
        targetTab.step === currentStep ||
        targetTab.step === currentStep + 1
      ) {
        setCurrentStep(targetTab.step)
        setActiveTab(tab)
      }
    }
  }

  const handleFinalSubmit = async () => {
    setIsValidating(true)
    const isValid = await validateAllSteps()

    if (!isValid) {
      setIsValidating(false)
      focusFirstInvalidField(true)
      return
    }

    setCompletedSteps((previous) =>
      Array.from(new Set([...previous, ...STEPS_WITH_FORM_VALIDATION])),
    )

    const data = form.getValues()
    setIsValidating(false)

    try {
      if (mode === 'create') {
        await createSupplier(data)
      } else {
        await updateSupplierData({
          payload: data,
          persistAttachments: true,
          persistResponsibilityMatrix: true,
        })
        markFormAsSaved()
      }
    } catch (error) {
      console.error(
        `Error ${mode === 'create' ? 'creating' : 'updating'} supplier:`,
        error,
      )
    }
  }

  const isPendingMutation = mode === 'create' ? isCreating : isUpdating
  const isPending = isPendingMutation || isValidating

  const isLastStep = currentStep === tabs.length
  const isFirstStep = currentStep === 1

  return {
    tabs,
    form,
    activeTab,
    currentStep,
    completedSteps,
    attachmentFiles,
    setAttachmentFiles,
    isSaving,
    responsibilityMatrixInitialData,
    handleNextStep,
    handlePreviousStep,
    handleTabChange,
    handleFinalSubmit,
    handleSaveProgress,
    isPending,
    isLastStep,
    isFirstStep,
    validateCurrentStep,
    formPersistence,
    clearAllDrafts,
  }
}
