import { type QueryFunctionContext } from '@tanstack/react-query'

import { type Option } from '@/components/common/async-select'
import axios from '@/lib/axios'
import { type Employee } from '@/types/Employee'

export const fetchEmployeeSelect = async (
  name: string,
  id?: string,
  email?: string,
  ids?: string[],
): Promise<Option[]> => {
  const { data } = await axios.get('/people/employees-select/', {
    params: {
      search: name,
      size: 100,
      ...(id && { id }),
      ...(email && { email }),
      ...(ids && { ids: ids.filter(Boolean).join(',') }),
    },
  })

  return (
    data?.items?.map((item: Employee) => ({
      value: item.id?.toString() || '',
      label: item.fullName,
      email: item.email,
      legalPerson: item.legalPerson ?? false,
    })) ?? []
  )
}

export const fetchEmployeesList = async ({
  queryKey,
}: QueryFunctionContext<
  [
    string,
    {
      full_name__ilike?: string
      page?: number
      size?: string
    },
  ]
>) => {
  const [_, filters] = queryKey
  const { data } = await axios.get('/people/employees/', {
    params: {
      ...filters,
    },
  })
  return data
}

export const fetchEmployee = async (id: string) => {
  const { data } = await axios.get(`/people/employees/${id}/`)
  return data
}

export const addEmployee = async (data: any) => {
  const { data: response } = await axios.post('/people/employees/', data)
  return response
}

export const editEmployee = async (id: string, data: any) => {
  if (data.toLegalPerson) {
    const { data: response } = await axios.patch(
      `/people/employees/${id}/to-legal-person/`,
      data,
    )
    return response
  } else {
    const { data: response } = await axios.patch(
      `/people/employees/${id}/`,
      data,
    )
    return response
  }
}

export const fetchContractHistory = async ({
  queryKey,
}: QueryFunctionContext<[string, string | null | undefined]>) => {
  const [_, id] = queryKey
  const { data } = await axios.get(`/people/employees/history/lending/${id}/`)
  return data
}

export const fetchTermHistory = async ({
  queryKey,
}: QueryFunctionContext<[string, string | null | undefined]>) => {
  const [_, id] = queryKey
  const { data } = await axios.get(`/people/employees/history/term/${id}/`)
  return data
}
