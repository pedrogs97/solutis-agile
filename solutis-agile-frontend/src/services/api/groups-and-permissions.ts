import { type QueryFunctionContext } from '@tanstack/react-query'

import axios from '@/lib/axios'

export const fetchGroupsAndPermissions = async ({
  queryKey,
}: QueryFunctionContext<
  [
    string,
    {
      name__ilike?: string
      page?: number
      size?: string
    },
  ]
>) => {
  const [_, filters] = queryKey
  const { data } = await axios.get('/auth/groups/', {
    params: {
      ...filters,
    },
  })
  return data
}

export const editGroup = async (id: string, data: any) => {
  const { data: response } = await axios.patch(`/auth/groups/${id}`, data)
  return response
}

export const fetchPermissions = async () => {
  const { data } = await axios.get(`/auth/permissions/`)
  return data
}

export const fetchGroup = async (id: string) => {
  const { data } = await axios.get(`/auth/groups/${id}/`)
  return data
}
