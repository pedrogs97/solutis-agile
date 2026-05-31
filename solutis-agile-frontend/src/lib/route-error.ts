type RouteErrorDetails = {
  context?: string
  path?: string
  name?: string
  message?: string
  stack?: string
}

const normalizeError = (
  error: unknown,
): Omit<RouteErrorDetails, 'context' | 'path'> => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }

  if (typeof error === 'string') {
    return { message: error }
  }

  if (typeof error === 'object' && error !== null) {
    try {
      return { message: JSON.stringify(error) }
    } catch {
      return { message: 'Unserializable route error object' }
    }
  }

  return { message: String(error) }
}

export const logRouteError = (error: unknown, context?: string) => {
  const details: RouteErrorDetails = {
    context,
    path: typeof window !== 'undefined' ? window.location.pathname : undefined,
    ...normalizeError(error),
  }

  // Centralized logging for route and render failures.
  console.error('[RouteError]', details)
}
