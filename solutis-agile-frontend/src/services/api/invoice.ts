import { type QueryFunctionContext } from '@tanstack/react-query'

import axios from '@/lib/axios'

export const fetchInvoices = async ({
  queryKey,
}: QueryFunctionContext<
  [
    string,
    {
      full_name?: string
      page?: number
      size?: string
    },
  ]
>) => {
  const [_, filters] = queryKey
  const { data } = await axios.get('/invoice/invoices/', {
    params: {
      ...filters,
    },
  })
  return data
}

export const deleteInvoice = async (id: string) => {
  const { data } = await axios.delete(`/invoice/invoices/${id}`)

  return data
}
