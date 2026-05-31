/**
 * Kubb HTTP client adapter.
 *
 * Wraps the existing axios instance so all generated API calls share
 * the same auth interceptors and token-refresh logic defined in lib/axios.
 *
 * Generated code imports this file via the `importPath` option in kubb.config.ts.
 * Do NOT import this file directly in application code — use the generated hooks
 * in src/api/generated/hooks instead.
 */

import type { AxiosRequestConfig, AxiosResponse } from 'axios'

import instance from '@/lib/axios'

export type RequestConfig<TData = unknown> = {
  baseURL?: string
  url: string
  method: 'GET' | 'PUT' | 'PATCH' | 'POST' | 'DELETE' | 'OPTIONS' | 'HEAD'
  params?: object
  data?: TData | FormData
  responseType?: AxiosRequestConfig['responseType']
  signal?: AbortSignal
  headers?: AxiosRequestConfig['headers']
}

export type ResponseConfig<TData = unknown> = {
  data: TData
  status: number
  statusText: string
  headers?: AxiosResponse['headers']
}

export async function client<TData, _TError = unknown, TVariables = unknown>(
  config: RequestConfig<TVariables>,
): Promise<ResponseConfig<TData>> {
  // Generated paths use /api/v1/ prefix; rewrite to /proxy/procurement/v1/
  // so the manager proxy (baseURL already includes /api/v1) routes correctly:
  // instance baseURL + /proxy/procurement/v1/... → manager → procurement :8001
  const url = config.url.replace(/^\/api\/v1\//, '/proxy/procurement/v1/')

  const { data, status, statusText, headers } = await instance<TData>({
    url,
    method: config.method,
    params: config.params,
    data: config.data,
    responseType: config.responseType,
    signal: config.signal,
    headers: config.headers,
  })

  return { data, status, statusText, headers }
}

export type Client = typeof client

export type ResponseErrorConfig<_TError = unknown> = _TError

export default client
