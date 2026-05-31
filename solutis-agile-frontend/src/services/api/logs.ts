import { type QueryFunctionContext } from '@tanstack/react-query'

import axios from '@/lib/axios'

export const fetchLogs = async ({
  queryKey,
}: QueryFunctionContext<
  [
    string,
    {
      full_name?: string
      page: number
      size: string
    },
  ]
>) => {
  const [_, filters] = queryKey
  const { data } = await axios.get('/logs/', {
    params: {
      ...filters,
    },
  })
  return data
}
