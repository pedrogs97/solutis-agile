import { notifications } from '@mantine/notifications'
import { type AxiosResponse } from 'axios'

import { openBlob } from '@/utils/openBlob'

export const downloadFile = async (response: AxiosResponse) => {
  const disposition = response?.headers['content-disposition'] ?? ''
  const filename = disposition.split('filename=')[1]?.replace(/"/g, '')
  const contentType =
    response.headers['content-type'] ?? 'application/octet-stream'

  openBlob({
    blob: new Blob([response.data], { type: contentType }),
    filename,
    contentType,
    preferNewTab: true,
  })

  notifications.show({
    title: 'Documento aberto em nova aba',
    message: 'Documento aberto em nova aba',
    color: 'blue',
  })
}
