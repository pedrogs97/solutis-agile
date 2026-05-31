import { notifications } from '@mantine/notifications'
import { type QueryFunctionContext } from '@tanstack/react-query'
import { AxiosError } from 'axios'

import axios from '@/lib/axios'
import { formatMoneyBRL } from '@/lib/utils'
import type { Asset, AssetHistory, AssetStatus, AssetType } from '@/types/Asset'

export const fetchHistoryLending = async ({
  queryKey,
}: QueryFunctionContext<[string, string | null | undefined]>) => {
  const [_, id] = queryKey
  if (id) {
    const { data } = await axios.get<[AssetHistory]>(`/assets/history/${id}/`)
    return data
  }
  return []
}

export const fetchAssets = async ({
  queryKey,
}: QueryFunctionContext<
  [
    string,
    {
      page?: number
      size?: string
    },
  ]
>) => {
  const [_, filters] = queryKey
  const { data } = await axios.get('/assets/', {
    params: {
      ...filters,
    },
  })
  return data
}

export const fetchAssetsSelect = async ({
  queryKey,
}: QueryFunctionContext<[string, string | null | undefined]>) => {
  const [_, search] = queryKey
  const { data } = await axios.get('/assets/', {
    params: {
      fields: 'id,register_number,value,serial_number',
      search,
      size: 100,
    },
  })
  const assets = data?.items?.map((asset: Asset) => ({
    value: asset.id?.toString(),
    label: `${asset.registerNumber} - ${asset.serialNumber} / ${formatMoneyBRL(asset.value)}`,
  }))
  return assets
}

export const fetchAssetTypes = async () => {
  const { data } = await axios.get('/assets-types/', {
    params: {
      fields: 'id,name',
    },
  })
  const types = data?.map((assetType: AssetType) => ({
    value: assetType.id?.toString(),
    label: assetType.name,
  }))
  return types
}

export const fetchAssetStatus = async () => {
  const { data } = await axios.get('/assets-status/')
  const status = data?.map((assetStatus: AssetStatus) => ({
    value: assetStatus.id?.toString(),
    label: assetStatus.name,
  }))
  return status
}

export const importAssets = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  try {
    const { data } = await axios.post('/assets/bulk-create/', formData)
    return data
  } catch (error) {
    if (error instanceof AxiosError) {
      notifications.show({
        title: 'Erro ao importar ativos',
        message:
          error.response?.data?.error || 'Verifique possíveis erros no arquivo',
        color: 'red',
      })
    } else {
      notifications.show({
        title: 'Erro ao importar ativos',
        message: 'Erro ao importar ativos',
        color: 'red',
      })
    }
  }
}

export const downloadAssetTimeline = async (id: string) => {
  const idNotification = notifications.show({
    loading: true,
    title: 'Abrindo histórico',
    message: 'O histórico está sendo preparado, aguarde um momento...',
    color: 'blue',
    autoClose: false,
    withCloseButton: false,
  })
  try {
    const response = await axios.get(`/report/asset-pdf/${id}/`, {
      responseType: 'blob',
    })
    const data = response.data
    const contentType = response.headers['content-type']
    const objectUrl = window.URL.createObjectURL(
      new Blob([data], { type: contentType }),
    )

    const openedWindow = window.open(objectUrl, '_blank', 'noopener,noreferrer')

    if (!openedWindow) {
      const anchor = document.createElement('a')
      anchor.href = objectUrl
      anchor.target = '_blank'
      anchor.rel = 'noopener noreferrer'
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
    }

    window.setTimeout(() => {
      window.URL.revokeObjectURL(objectUrl)
    }, 30000)

    notifications.update({
      id: idNotification,
      loading: false,
      autoClose: 1500,
      title: 'Histórico aberto em nova aba',
      message: 'Histórico aberto em nova aba',
      color: 'green',
    })
  } catch (error) {
    if (error instanceof AxiosError) {
      notifications.update({
        id: idNotification,
        loading: false,
        autoClose: 1500,
        title: 'Erro ao abrir histórico',
        message: error.response?.data?.error || 'Erro ao abrir histórico',
        color: 'red',
      })
    } else {
      notifications.update({
        id: idNotification,
        loading: false,
        autoClose: 1500,
        title: 'Erro ao abrir histórico',
        message: 'Erro ao abrir histórico. Contate o suporte',
        color: 'red',
      })
    }
  }
}
