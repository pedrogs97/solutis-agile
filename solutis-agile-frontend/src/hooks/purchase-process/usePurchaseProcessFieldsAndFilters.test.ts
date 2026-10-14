import { describe, expect, it, vi } from 'vitest'

import axios from '../../lib/axios'
import { fetchPurchaseProcesses } from '../../services/api/purchase-process'
import {
  cleanPurchaseProcessPayload,
  createNewProcess,
} from './usePurchaseProcessForm'

vi.mock('../../lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('Purchase Process Fields and Filters', () => {
  it('inicializa identificacao com centroCusto2 e observacao vazios por padrao', () => {
    const process = createNewProcess()
    expect(process.identificacao.centroCusto).toBe('')
    expect(process.identificacao.centroCusto2).toBe('')
    expect(process.identificacao.observacao).toBe('')
  })

  it('preserva centroCusto2 e observacao ao limpar payload para envio a API', () => {
    const process = createNewProcess()
    process.identificacao.centroCusto = '1000 - TI'
    process.identificacao.centroCusto2 = '2000 - Inovação'
    process.identificacao.observacao = 'Compra autorizada pela diretoria para testes'

    const cleaned = cleanPurchaseProcessPayload(process)
    expect(cleaned.identificacao.centroCusto).toBe('1000 - TI')
    expect(cleaned.identificacao.centroCusto2).toBe('2000 - Inovação')
    expect(cleaned.identificacao.observacao).toBe(
      'Compra autorizada pela diretoria para testes'
    )
  })

  it('fetchPurchaseProcesses repassa periodo, dataInicio e dataFim como query params', async () => {
    const mockResponse = {
      data: {
        count: 1,
        items: [],
        page: 1,
        pageSize: 20,
        totalPages: 1,
      },
    }
    vi.mocked(axios.get).mockResolvedValueOnce(mockResponse)

    const filters = {
      search: 'Notebook',
      status: 'Aprovado',
      category: 'Normal',
      periodo: '30',
      dataInicio: '2026-09-01',
      dataFim: '2026-09-30',
      page: 1,
      pageSize: 20,
    }

    const result = await fetchPurchaseProcesses({
      queryKey: ['fetchPurchaseProcesses', filters],
      meta: undefined,
      signal: new AbortController().signal,
    } as any)

    expect(axios.get).toHaveBeenCalledWith(
      '/proxy/procurement/v1/purchase-processes/',
      {
        params: {
          search: 'Notebook',
          status: 'Aprovado',
          category: 'Normal',
          periodo: '30',
          data_inicio: '2026-09-01',
          data_fim: '2026-09-30',
          page: 1,
          page_size: 20,
          order_by: undefined,
        },
      }
    )
    expect(result).toEqual(mockResponse.data)
  })
})
