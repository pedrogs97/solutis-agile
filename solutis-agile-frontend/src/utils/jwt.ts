export function parseJwt(token: string) {
  if (typeof token !== 'string' || token.trim().length === 0) {
    throw new Error('Token is empty.')
  }

  const parts = token.split('.')
  if (parts.length < 2 || !parts[1]) {
    throw new Error('Token is not a valid JWT.')
  }

  const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
  const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')

  try {
    const jsonPayload = decodeURIComponent(
      window
        .atob(paddedBase64)
        .split('')
        .map(function (char) {
          return '%' + ('00' + char.charCodeAt(0).toString(16)).slice(-2)
        })
        .join(''),
    )

    return JSON.parse(jsonPayload)
  } catch {
    throw new Error('Token payload is invalid.')
  }
}
