import axios, {
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'

import { ENVIRONMENT } from '@/constants/env'
import {
  hydrateAuthTokens,
  signIn,
  signOut,
} from '@/store/persisted/useAuthStore'
import { resetProfile } from '@/store/persisted/useProfileStore'

export const apiV1 = '/api/v1'

const logout = () => {
  signOut()
  resetProfile()
  window.location.href = '/login'
}

const interceptorsResponse = (
  value: AxiosResponse<any>,
): Promise<AxiosResponse<any>> => Promise.resolve(value)

const interceptorsRequestResponse = (
  value: InternalAxiosRequestConfig,
): InternalAxiosRequestConfig => {
  const token =
    hydrateAuthTokens().accessToken ?? localStorage.getItem('accessToken')

  if (value && value.headers) {
    value.headers.Authorization = token ? `Bearer ${token}` : ''
  }

  return value
}

const hasInvalidTokenDetail = (response?: AxiosResponse<any>): boolean => {
  if (!response) return false

  const detail = response.data?.detail
  if (typeof detail !== 'string') return false

  const normalizedDetail = detail.toLowerCase()

  return (
    normalizedDetail.includes('invalid token') ||
    normalizedDetail.includes('token expired')
  )
}

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
}

const interceptorRejected = async (
  value: AxiosError<any>,
): Promise<AxiosResponse<any>> => {
  try {
    if (axios.isAxiosError(value) && value.response) {
      const { response } = value
      const originalRequest = response.config as RetryableRequestConfig

      if (response.status === 403 && hasInvalidTokenDetail(response)) {
        logout()
        return await Promise.reject(value)
      }

      // reject the refresh token error
      if (response.status === 401 && response.config.url !== '/auth/login/') {
        if (
          originalRequest.url === '/auth/refresh-token/' ||
          originalRequest._retry
        ) {
          logout()
          return await Promise.reject(value)
        }

        if (hasInvalidTokenDetail(response)) {
          logout()
          return await Promise.reject(value)
        }

        const refreshToken =
          hydrateAuthTokens().refreshToken ??
          localStorage.getItem('refreshToken')

        if (!refreshToken) {
          logout()
          return await Promise.reject(value)
        }

        originalRequest._retry = true

        return await axios
          .post(
            '/auth/refresh-token/',
            {
              refreshToken: refreshToken,
            },
            {
              baseURL: `${ENVIRONMENT.baseURL}${apiV1}`,
            },
          )
          .then((res) => {
            signIn(res.data)
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${res.data.access_token}`
            }
            return instance(originalRequest)
          })
          .catch((err) => {
            logout()
            return Promise.reject(err)
          })
      }

      // when refresh token is expired
      if (response.status === 401 && response.config.url === '/login') {
        logout()
      }
    }
    return await Promise.reject(value)
  } catch (error) {
    return await Promise.reject(error)
  }
}

const instance = axios.create({
  baseURL: `${ENVIRONMENT.baseURL}${apiV1}`,
})

instance.interceptors.request.use(interceptorsRequestResponse)
instance.interceptors.response.use(interceptorsResponse, interceptorRejected)

export default instance
