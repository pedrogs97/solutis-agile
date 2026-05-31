import { type ErrorResponse } from '@/types/ApiResponse'

const DEFAULT_FIELD = 'general'

const toErrorResponse = (
  value: Record<string, unknown>,
): ErrorResponse | null => {
  const field = typeof value.field === 'string' ? value.field : DEFAULT_FIELD

  if (typeof value.error === 'string') {
    return { field, error: value.error }
  }

  if (typeof value.message === 'string') {
    return { field, error: value.message }
  }

  return null
}

export const normalizeApiErrors = (payload: unknown): ErrorResponse[] => {
  if (!payload) return []

  if (Array.isArray(payload)) {
    return payload.flatMap((item) => normalizeApiErrors(item))
  }

  if (typeof payload === 'string') {
    return [{ field: DEFAULT_FIELD, error: payload }]
  }

  if (typeof payload === 'object') {
    const value = payload as Record<string, unknown>

    if (
      'errors' in value &&
      Array.isArray(value.errors) &&
      value.errors.length > 0
    ) {
      return value.errors.flatMap((item) => normalizeApiErrors(item))
    }

    if ('detail' in value) {
      return normalizeApiErrors(value.detail)
    }

    const error = toErrorResponse(value)
    return error ? [error] : []
  }

  return []
}
