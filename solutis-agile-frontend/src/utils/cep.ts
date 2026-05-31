interface CepData {
  erro?: boolean
  logradouro?: string
  bairro?: string
  localidade?: string
  uf?: string
  [key: string]: unknown
}

interface CepCacheEntry {
  data: CepData
  timestamp: number
}

const CEP_CACHE_TTL_MS = 1000 * 60 * 60 * 12
const cepCache = new Map<string, CepCacheEntry>()
const pendingRequests = new Map<string, Promise<CepData | undefined>>()

export const fetchCep = async (cep: string): Promise<CepData | undefined> => {
  const cleanCep = cep.replace(/\D/g, '')

  if (cleanCep.length !== 8) {
    return
  }

  const cached = cepCache.get(cleanCep)
  if (cached && Date.now() - cached.timestamp < CEP_CACHE_TTL_MS) {
    return cached.data
  }

  const pending = pendingRequests.get(cleanCep)
  if (pending) {
    return pending
  }

  const request = (async () => {
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
      const data = (await response.json()) as CepData

      if (!data.erro) {
        cepCache.set(cleanCep, {
          data,
          timestamp: Date.now(),
        })
        return data
      }
    } catch (error) {
      console.error('Error fetching CEP data:', error)
    } finally {
      pendingRequests.delete(cleanCep)
    }
  })()

  pendingRequests.set(cleanCep, request)
  return request
}
