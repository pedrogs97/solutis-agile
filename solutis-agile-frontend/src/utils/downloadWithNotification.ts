import { notifications } from '@mantine/notifications'
import axios, { type AxiosResponse } from 'axios'

import { downloadBlob } from '@/utils/downloadBlob'
import { getFilename } from '@/utils/getFilename'
import { openBlob } from '@/utils/openBlob'

interface DownloadOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  data?: unknown
  params?: Record<string, unknown>
  headers?: Record<string, string>
  filename?: string
  openInNewTab?: boolean
  successMessage?: string
  errorMessage?: string
  successColor?: string
  onFinally?: () => void
}

/**
 * Unified download utility that handles notifications, blob creation, and file download
 * Consolidates functionality from downloadBlob, downloadFile, and withDownloadNotification
 */
export async function downloadWithNotification({
  url,
  method = 'GET',
  data,
  params,
  headers,
  filename,
  openInNewTab = true,
  successMessage = 'Documento aberto em nova aba',
  errorMessage = 'Não foi possível abrir o arquivo',
  successColor = 'blue',
  onFinally,
}: DownloadOptions): Promise<string> {
  const idNotification = notifications.show({
    loading: true,
    title: 'Abrindo documento',
    message: 'Preparando o documento, aguarde um momento...',
    autoClose: false,
    withCloseButton: false,
  })

  try {
    const resolvedFilename = await downloadBlob({
      url,
      method,
      data,
      params,
      headers,
      filename,
      openInNewTab,
    })

    notifications.update({
      id: idNotification,
      loading: false,
      title: successMessage,
      message: successMessage,
      color: successColor,
      autoClose: 5000,
    })

    return resolvedFilename
  } catch (error: unknown) {
    if (
      axios.isAxiosError(error) &&
      error.response?.data instanceof Blob &&
      error.response?.headers?.['content-type']?.includes('application/json')
    ) {
      try {
        const text = await error.response.data.text()
        const parsed = JSON.parse(text)
        // Normalize FastAPI-style payloads: sometimes detail is the list.
        const normalized =
          parsed && typeof parsed === 'object' && 'detail' in parsed
            ? (parsed as { detail: unknown }).detail
            : parsed
        ;(error.response as any).data = normalized
      } catch {
        // Ignore JSON parsing errors and keep the original blob.
      }
    }
    notifications.update({
      id: idNotification,
      loading: false,
      title: 'Erro ao abrir arquivo',
      message: errorMessage,
      color: 'red',
      autoClose: 500,
    })
    throw error
  } finally {
    onFinally?.()
  }
}

/**
 * Alternative function that works with an existing AxiosResponse
 * Useful for cases where the request has already been made
 */
export function downloadFromResponse(
  response: AxiosResponse,
  successMessage = 'Documento aberto em nova aba',
  errorMessage = 'Não foi possível abrir o arquivo',
): void {
  try {
    const filename = getFilename(response.headers['content-disposition'])

    const blob = new Blob([response.data], {
      type: response.headers['content-type'] ?? 'application/octet-stream',
    })

    openBlob({
      blob,
      filename,
      contentType: response.headers['content-type'],
      preferNewTab: true,
    })

    notifications.show({
      title: successMessage,
      message: 'Documento aberto em nova aba',
      color: 'blue',
      autoClose: 5000,
    })
  } catch (error) {
    notifications.show({
      title: 'Erro',
      message: errorMessage,
      color: 'red',
      autoClose: 5000,
    })
    throw error
  }
}
