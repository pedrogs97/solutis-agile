import { type QueryFunctionContext } from '@tanstack/react-query'

import axios from '@/lib/axios'

export const fetchTerms = async ({
  queryKey,
}: QueryFunctionContext<
  [
    string,
    {
      doc_type__name?: string
      page?: number
      size?: string
    },
  ]
>) => {
  const [_, filters] = queryKey
  const { data } = await axios.get('/terms/', {
    params: {
      ...filters,
    },
  })
  return data
}

export const addTerm = async (data: any) => {
  const dataCleaned = JSON.parse(JSON.stringify(data))
  dataCleaned.typeId = data.type
  const { data: response } = await axios.post('/terms/', dataCleaned)

  return response
}
