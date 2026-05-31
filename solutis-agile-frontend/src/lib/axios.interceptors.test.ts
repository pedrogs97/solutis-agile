/* @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const signIn = vi.fn()
  const signOut = vi.fn()
  const hydrateAuthTokens = vi.fn(() => ({
    accessToken: 'old_access',
    refreshToken: 'old_refresh',
  }))
  const resetProfile = vi.fn()
  const requestUse = vi.fn()
  const responseUse = vi.fn()
  const instance = vi.fn()

  ;(instance as any).interceptors = {
    request: { use: requestUse },
    response: { use: responseUse },
  }

  const axiosDefault = {
    create: vi.fn(() => instance),
    isAxiosError: vi.fn(() => true),
    post: vi.fn(),
  }

  ;(globalThis as any).window = {
    location: { href: 'http://localhost/' },
  }

  return {
    axiosDefault,
    hydrateAuthTokens,
    instance,
    resetProfile,
    responseUse,
    signIn,
    signOut,
  }
})

vi.mock('axios', () => ({
  default: mocks.axiosDefault,
}))

vi.mock('@/constants/env', () => ({
  ENVIRONMENT: {
    baseURL: 'http://localhost:8000',
  },
}))

vi.mock('@/store/persisted/useAuthStore', () => ({
  hydrateAuthTokens: mocks.hydrateAuthTokens,
  signIn: mocks.signIn,
  signOut: mocks.signOut,
}))

vi.mock('@/store/persisted/useProfileStore', () => ({
  resetProfile: mocks.resetProfile,
}))

import '@/lib/axios'

const getRejectedInterceptor = () => {
  const useCalls = mocks.responseUse.mock.calls
  if (useCalls.length === 0) {
    throw new Error('Response interceptor was not registered')
  }
  return useCalls[0][1] as (error: any) => Promise<unknown>
}

const createAxiosError = (
  status: number,
  detail: string,
  url = '/resource',
) => ({
  response: {
    config: {
      headers: {},
      url,
    },
    data: { detail },
    status,
  },
})

describe('axios auth interceptor', () => {
  beforeEach(() => {
    mocks.signIn.mockClear()
    mocks.signOut.mockClear()
    mocks.resetProfile.mockClear()
    mocks.axiosDefault.post.mockClear()
    mocks.instance.mockClear()
    mocks.hydrateAuthTokens.mockClear()
    mocks.hydrateAuthTokens.mockReturnValue({
      accessToken: 'old_access',
      refreshToken: 'old_refresh',
    })
  })

  it('logs out when API returns 403 with invalid token detail', async () => {
    const rejected = getRejectedInterceptor()
    const error = createAxiosError(403, 'Invalid token.')

    await expect(rejected(error)).rejects.toBeDefined()
    expect(mocks.signOut).toHaveBeenCalledTimes(1)
    expect(mocks.resetProfile).toHaveBeenCalledTimes(1)
  })

  it('refreshes token and retries original request only once on 401', async () => {
    const rejected = getRejectedInterceptor()
    const originalError = createAxiosError(401, 'Unauthorized')

    mocks.axiosDefault.post.mockResolvedValueOnce({
      data: {
        access_token: 'new_access',
        refresh_token: 'new_refresh',
      },
    })
    mocks.instance.mockResolvedValueOnce({
      data: { ok: true },
      status: 200,
    })

    const result = await rejected(originalError)

    expect(mocks.axiosDefault.post).toHaveBeenCalledTimes(1)
    expect(mocks.signIn).toHaveBeenCalledWith({
      access_token: 'new_access',
      refresh_token: 'new_refresh',
    })
    expect(mocks.instance).toHaveBeenCalledTimes(1)
    expect((originalError.response.config as any)._retry).toBe(true)
    expect(result).toEqual({
      data: { ok: true },
      status: 200,
    })
  })

  it('logs out when 401 happens after retry flag is already set', async () => {
    const rejected = getRejectedInterceptor()
    const retriedError = createAxiosError(401, 'Unauthorized')
    ;(retriedError.response.config as any)._retry = true

    await expect(rejected(retriedError)).rejects.toBeDefined()
    expect(mocks.signOut).toHaveBeenCalledTimes(1)
    expect(mocks.resetProfile).toHaveBeenCalledTimes(1)
    expect(mocks.axiosDefault.post).not.toHaveBeenCalled()
  })
})
