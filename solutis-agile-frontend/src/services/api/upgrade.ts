import axios from '@/lib/axios'

export const addUpgrade = async (data: any) => {
  const { data: response } = await axios.post('/maintenances-upgrade/', data)
  return response
}

export const updateUpgrade = async (data: any, id: any) => {
  const { data: response } = await axios.patch(
    `/maintenances-upgrade/${id}/`,
    data,
  )
  return response
}

export const uploadAttachments = async (id: string, files: File[]) => {
  const formData = new FormData()
  formData.append('upgradeId', id)
  files.forEach((file) => {
    formData.append('files', file)
  })
  const response = await axios.post(`/maintenances/upload/upgrade/`, formData)
  return response.data
}

export const fetchHistoryUpgrade = async ({
  pageParam,
  id,
}: {
  pageParam: number
  id: string
}) => {
  if (id) {
    const { data } = await axios.get('/maintenances-upgrade/', {
      params: {
        asset__id: id,
        page: pageParam,
        size: 2,
      },
    })
    return data
  }
  return []
}
