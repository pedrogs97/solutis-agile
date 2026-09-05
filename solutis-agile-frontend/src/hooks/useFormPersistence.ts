'use client'

import { useCallback, useEffect, useRef } from 'react'
import {
  type FieldValues,
  type Path,
  type PathValue,
  type UseFormReturn,
} from 'react-hook-form'

interface UseFormPersistenceOptions<T extends FieldValues> {
  form: UseFormReturn<T>
  key: string
  enabled?: boolean
  debounceMs?: number
  excludeFields?: (keyof T)[]
}

interface PersistedData<T> {
  data: Partial<T>
  timestamp: number
  version: string
}

// Metadados para campos assíncronos (AsyncSelect)
export interface AsyncFieldMetadata {
  value: string
  label: string
  [key: string]: unknown
}

interface PersistedMetadata {
  fields: Record<string, AsyncFieldMetadata>
  timestamp: number
  version: string
}

const PERSISTENCE_VERSION = '1.0'
const DEFAULT_DEBOUNCE_MS = 1000

const hasMeaningfulDraftValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return false

  if (typeof value === 'string') {
    return value.trim().length > 0
  }

  if (typeof value === 'number') {
    return !Number.isNaN(value)
  }

  if (typeof value === 'boolean') {
    return value
  }

  if (value instanceof Date) {
    return !Number.isNaN(value.getTime())
  }

  if (Array.isArray(value)) {
    return value.some((item) => hasMeaningfulDraftValue(item))
  }

  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).some((item) =>
      hasMeaningfulDraftValue(item),
    )
  }

  return false
}

// Helper para definir valores aninhados no formulário
const setNestedValues = <T extends FieldValues>(
  form: UseFormReturn<T>,
  data: Record<string, unknown>,
  prefix = '',
) => {
  Object.entries(data).forEach(([key, value]) => {
    const fieldPath = prefix ? `${prefix}.${key}` : key

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      // Se é um objeto aninhado, recursivamente define os valores
      setNestedValues(form, value as Record<string, unknown>, fieldPath)
    } else if (value !== undefined) {
      // Define o valor do campo
      form.setValue(fieldPath as Path<T>, value as PathValue<T, Path<T>>, {
        shouldValidate: false,
        shouldDirty: false,
        shouldTouch: false,
      })
    }
  })
}

export function useFormPersistence<T extends FieldValues>({
  form,
  key,
  enabled = true,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  excludeFields = [],
}: UseFormPersistenceOptions<T>) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const storageKey = `form_draft_${key}`
  const metadataKey = `form_draft_${key}_metadata`

  // Save async field metadata (label, value, etc.)
  const saveAsyncFieldMeta = useCallback(
    (fieldName: string, metadata: AsyncFieldMetadata | null) => {
      if (!enabled) return

      try {
        const stored = localStorage.getItem(metadataKey)
        let persistedMetadata: PersistedMetadata = {
          fields: {},
          timestamp: Date.now(),
          version: PERSISTENCE_VERSION,
        }

        if (stored) {
          const parsed = JSON.parse(stored) as PersistedMetadata
          if (parsed.version === PERSISTENCE_VERSION) {
            persistedMetadata = parsed
          }
        }

        if (metadata) {
          persistedMetadata.fields[fieldName] = metadata
        } else {
          delete persistedMetadata.fields[fieldName]
        }

        persistedMetadata.timestamp = Date.now()
        localStorage.setItem(metadataKey, JSON.stringify(persistedMetadata))
      } catch (error) {
        console.warn('Failed to save async field metadata:', error)
      }
    },
    [enabled, metadataKey],
  )

  // Get async field metadata
  const getAsyncFieldMeta = useCallback(
    (fieldName: string): AsyncFieldMetadata | null => {
      if (!enabled) return null

      try {
        const stored = localStorage.getItem(metadataKey)
        if (!stored) return null

        const persistedMetadata: PersistedMetadata = JSON.parse(stored)
        if (persistedMetadata.version !== PERSISTENCE_VERSION) return null

        return persistedMetadata.fields[fieldName] || null
      } catch {
        return null
      }
    },
    [enabled, metadataKey],
  )

  // Get all async fields metadata
  const getAllAsyncFieldsMeta = useCallback((): Record<
    string,
    AsyncFieldMetadata
  > => {
    if (!enabled) return {}

    try {
      const stored = localStorage.getItem(metadataKey)
      if (!stored) return {}

      const persistedMetadata: PersistedMetadata = JSON.parse(stored)
      if (persistedMetadata.version !== PERSISTENCE_VERSION) return {}

      return persistedMetadata.fields
    } catch {
      return {}
    }
  }, [enabled, metadataKey])

  // Save form data to localStorage
  const saveToStorage = useCallback(
    (data: T) => {
      if (!enabled) return

      try {
        const filteredData = { ...data }

        // Remove excluded fields
        excludeFields.forEach((field) => {
          delete filteredData[field as string]
        })

        // Do not persist empty/default-only drafts
        if (!hasMeaningfulDraftValue(filteredData)) {
          localStorage.removeItem(storageKey)
          localStorage.removeItem(metadataKey)
          return
        }

        const persistedData: PersistedData<T> = {
          data: filteredData,
          timestamp: Date.now(),
          version: PERSISTENCE_VERSION,
        }

        localStorage.setItem(storageKey, JSON.stringify(persistedData))
      } catch (error) {
        console.warn('Failed to save form data to localStorage:', error)
      }
    },
    [enabled, excludeFields, storageKey, metadataKey],
  )

  // Load form data from localStorage
  const loadFromStorage = useCallback((): Partial<T> | null => {
    if (!enabled) return null

    try {
      const stored = localStorage.getItem(storageKey)
      if (!stored) return null

      const persistedData: PersistedData<T> = JSON.parse(stored)

      // Check if version matches
      if (persistedData.version !== PERSISTENCE_VERSION) {
        localStorage.removeItem(storageKey)
        return null
      }

      if (!hasMeaningfulDraftValue(persistedData.data)) {
        localStorage.removeItem(storageKey)
        localStorage.removeItem(metadataKey)
        return null
      }

      return persistedData.data
    } catch (error) {
      console.warn('Failed to load form data from localStorage:', error)
      return null
    }
  }, [enabled, storageKey, metadataKey])

  // Clear persisted data
  const clearStorage = useCallback(() => {
    try {
      localStorage.removeItem(storageKey)
      localStorage.removeItem(metadataKey)
    } catch (error) {
      console.warn('Failed to clear form data from localStorage:', error)
    }
  }, [storageKey, metadataKey])

  // Check if there's persisted data
  const hasDraft = useCallback((): boolean => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (!stored) return false

      const persistedData: PersistedData<T> = JSON.parse(stored)
      const isValid =
        persistedData.version === PERSISTENCE_VERSION &&
        hasMeaningfulDraftValue(persistedData.data)

      if (!isValid) {
        localStorage.removeItem(storageKey)
        localStorage.removeItem(metadataKey)
      }

      return isValid
    } catch {
      return false
    }
  }, [storageKey, metadataKey])

  // Get timestamp of persisted data
  const getDraftTimestamp = useCallback((): Date | null => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (!stored) return null

      const persistedData: PersistedData<T> = JSON.parse(stored)

      if (
        persistedData.version !== PERSISTENCE_VERSION ||
        !hasMeaningfulDraftValue(persistedData.data)
      ) {
        localStorage.removeItem(storageKey)
        localStorage.removeItem(metadataKey)
        return null
      }

      return new Date(persistedData.timestamp)
    } catch {
      return null
    }
  }, [storageKey, metadataKey])

  // Restore form data from storage
  const restoreDraft = useCallback(() => {
    const savedData = loadFromStorage()
    if (savedData) {
      // Usa setValue para cada campo, preservando a estrutura e valores padrão
      setNestedValues(form, savedData as Record<string, unknown>)
    }
  }, [form, loadFromStorage])

  // Debounced save on form changes
  useEffect(() => {
    if (!enabled) return

    const subscription = form.watch((data) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        saveToStorage(data as T)
      }, debounceMs)
    })

    return () => {
      subscription.unsubscribe()
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [form, enabled, debounceMs, saveToStorage])

  // Save before page unload
  useEffect(() => {
    if (!enabled) return

    const handleBeforeUnload = () => {
      const data = form.getValues()
      saveToStorage(data)
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [form, enabled, saveToStorage])

  return {
    hasDraft,
    getDraftTimestamp,
    restoreDraft,
    clearStorage,
    saveToStorage: () => saveToStorage(form.getValues()),
    // Funções para campos assíncronos (AsyncSelect)
    saveAsyncFieldMeta,
    getAsyncFieldMeta,
    getAllAsyncFieldsMeta,
  }
}
