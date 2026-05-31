import axios from '@/lib/axios'
import { type ActionMaintenance } from '@/types/Asset'

export const addMaintenance = async (data: any) => {
  const payload = {
    ...data,
    openDateSupplier: data.openDateSupplier || null,
    openDateGlpi: data.openDateGlpi || null,
  }

  const response = await axios.post('/maintenances/', payload)
  return response.data
}

export const updateMaintenance = async (data: any, id: number) => {
  const payload = {
    ...data,
    openDateSupplier: data.openDateSupplier || null,
    openDateGlpi: data.openDateGlpi || null,
  }
  const { data: response } = await axios.patch(`/maintenances/${id}`, payload)
  return response
}

export const uploadAttachments = async (id: string, files: File[]) => {
  const formData = new FormData()
  formData.append('maintenanceId', id)
  files.forEach((file) => {
    formData.append('files', file)
  })
  const response = await axios.post(
    `/maintenances/upload/maintenance/`,
    formData,
  )
  return response.data
}

export const fetchHistoryMaintenance = async ({
  pageParam,
  id,
}: {
  pageParam: number
  id: string
}) => {
  if (id) {
    const { data } = await axios.get('/maintenances/', {
      params: {
        asset__id: id,
        page: pageParam,
        size: 10,
      },
    })
    return data
  }
  return []
}

export const fetchMaintenanceActions = async () => {
  const { data } = await axios.get('/maintenances-actions/')
  const actions = data?.map((action: ActionMaintenance) => ({
    value: action.id?.toString(),
    label: action.name,
  }))
  return actions
}
