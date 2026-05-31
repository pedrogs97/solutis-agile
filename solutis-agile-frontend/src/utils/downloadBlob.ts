import axios from '@/lib/axios'
import { getFilename } from '@/utils/getFilename'
import { openBlob } from '@/utils/openBlob'

interface DownloadBlobOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  data?: unknown
  params?: Record<string, unknown>
  headers?: Record<string, string>
  filename?: string
  openInNewTab?: boolean
}

export async function downloadBlob({
  url,
  method = 'GET',
  data,
  params,
  headers,
  filename,
  openInNewTab = true,
}: Readonly<DownloadBlobOptions>) {
  const response = await axios.request<Blob>({
    url,
    method,
    data,
    params,
    headers,
    responseType: 'blob',
  })

  const resolvedFilename =
    filename || getFilename(response.headers['content-disposition'])

  const blob = new Blob([response.data], {
    type: response.headers['content-type'] ?? 'application/octet-stream',
  })

  openBlob({
    blob,
    filename: resolvedFilename,
    contentType: response.headers['content-type'],
    preferNewTab: openInNewTab,
  })

  return resolvedFilename
}
