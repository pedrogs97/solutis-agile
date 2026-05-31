import { useCallback, useMemo, useState } from 'react'

export type MaybeString = string | null | undefined

export interface SignerPair {
  principalSigner: string
  employeeSigner: string
}

export interface SignerMissingMap {
  principalSigner: boolean
  employeeSigner: boolean
}

export interface SignerDefaultsSource {
  principalSigner?: MaybeString
  managerEmail?: MaybeString
  manager?: MaybeString
  employeeSigner?: MaybeString
  employeeEmail?: MaybeString
  employee?: { email?: MaybeString } | null
}

const coalesce = (...values: MaybeString[]): string => {
  const found = values.find((value) => value && value.trim().length > 0)
  return found ? found.trim() : ''
}

export const deriveSignerDefaults = (
  source?: SignerDefaultsSource | null,
): SignerPair => {
  if (!source) {
    return { principalSigner: '', employeeSigner: '' }
  }

  return {
    principalSigner: coalesce(
      source.principalSigner,
      source.managerEmail,
      source.manager,
    ),
    employeeSigner: coalesce(
      source.employeeSigner,
      source.employeeEmail,
      source.employee?.email,
    ),
  }
}

export const normalizeSignerPair = (
  pair?: Partial<SignerPair> | null,
): SignerPair => ({
  principalSigner: pair?.principalSigner?.trim() ?? '',
  employeeSigner: pair?.employeeSigner?.trim() ?? '',
})

export const validateSignerPair = (
  pair?: Partial<SignerPair> | null,
  options?: { onInvalid?: (missing: SignerMissingMap) => void },
) => {
  const normalized = normalizeSignerPair(pair)
  const missing: SignerMissingMap = {
    principalSigner: normalized.principalSigner.length === 0,
    employeeSigner: normalized.employeeSigner.length === 0,
  }
  const isValid = !missing.principalSigner && !missing.employeeSigner

  if (!isValid) {
    options?.onInvalid?.(missing)
  }

  return { ...normalized, isValid, missing }
}

const isSignerDefaultsSource = (
  value: unknown,
): value is SignerDefaultsSource => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const potential = value as Record<string, unknown>
  return (
    'principalSigner' in potential ||
    'managerEmail' in potential ||
    'manager' in potential ||
    'employeeSigner' in potential ||
    'employeeEmail' in potential ||
    'employee' in potential
  )
}

const resolveDefaults = (
  defaults?: Partial<SignerPair> | SignerDefaultsSource | null,
): SignerPair => {
  if (!defaults) {
    return { principalSigner: '', employeeSigner: '' }
  }

  if (isSignerDefaultsSource(defaults)) {
    return deriveSignerDefaults(defaults)
  }

  return normalizeSignerPair(defaults)
}

export interface UseSignerEmailsOptions {
  defaults?: Partial<SignerPair> | SignerDefaultsSource | null
}

export const useSignerEmails = (options?: UseSignerEmailsOptions) => {
  const initialDefaults = useMemo(
    () => resolveDefaults(options?.defaults ?? null),
    [options?.defaults],
  )

  const [principalSigner, setPrincipalSignerState] = useState(
    initialDefaults.principalSigner,
  )
  const [employeeSigner, setEmployeeSignerState] = useState(
    initialDefaults.employeeSigner,
  )

  const setPrincipalSigner = useCallback((value: string) => {
    setPrincipalSignerState(value)
  }, [])

  const setEmployeeSigner = useCallback((value: string) => {
    setEmployeeSignerState(value)
  }, [])

  const hydrateSigners = useCallback(
    (
      defaults: Partial<SignerPair> | SignerDefaultsSource | null | undefined,
      options: { overwrite?: boolean } = {},
    ) => {
      const resolved = resolveDefaults(defaults ?? null)

      setPrincipalSignerState((prev) => {
        if (options.overwrite || !prev.trim()) {
          return resolved.principalSigner
        }
        return prev
      })

      setEmployeeSignerState((prev) => {
        if (options.overwrite || !prev.trim()) {
          return resolved.employeeSigner
        }
        return prev
      })
    },
    [],
  )

  const getTrimmedSigners = useCallback(
    () => normalizeSignerPair({ principalSigner, employeeSigner }),
    [principalSigner, employeeSigner],
  )

  const validateSigners = useCallback(
    (options?: { onInvalid?: (missing: SignerMissingMap) => void }) =>
      validateSignerPair({ principalSigner, employeeSigner }, options),
    [principalSigner, employeeSigner],
  )

  const resetSigners = useCallback(() => {
    setPrincipalSignerState('')
    setEmployeeSignerState('')
  }, [])

  return {
    principalSigner,
    employeeSigner,
    setPrincipalSigner,
    setEmployeeSigner,
    hydrateSigners,
    getTrimmedSigners,
    validateSigners,
    resetSigners,
  }
}
