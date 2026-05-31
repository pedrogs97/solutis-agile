import { type QueryFunctionContext } from '@tanstack/react-query'

import axios from '@/lib/axios'
import { type Group } from '@/types/Auth'

export const fetchUser = async (id: string) => {
  const { data } = await axios.get(`/auth/users/${id}/`)
  return data
}

export const fetchUsers = async ({
  queryKey,
}: QueryFunctionContext<
  [
    string,
    {
      employee__full_name__ilike?: string
      page?: number
      size?: string
    },
  ]
>) => {
  const [_, filters] = queryKey
  const { data } = await axios.get('/auth/users/', {
    params: {
      ...filters,
    },
  })
  return data
}

export const addUser = async (data: any) => {
  const { data: response } = await axios.post('/auth/users/', data)
  return response
}

export const editUser = async (id: string, data: any) => {
  const { data: response } = await axios.patch(`/auth/users/${id}`, data)
  return response
}

export const fetchGroups = async () => {
  const { data } = await axios.get('/auth/groups-select/')
  const groups = data?.items?.map((group: Group) => ({
    value: group.id?.toString(),
    label: group.name,
  }))
  return groups
}

export const sendResetPasswordEmail = async (id: string) => {
  const { data } = await axios.post('/auth/send-new-password/', {
    user_id: id,
  })
  return data
}
