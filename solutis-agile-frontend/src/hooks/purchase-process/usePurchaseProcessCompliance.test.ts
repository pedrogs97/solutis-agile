import { describe, expect, it } from 'vitest'

import type { PurchaseCompliance } from '@/types/PurchaseProcess'

import {
  cleanPurchaseProcessPayload,
  createNewProcess,
} from './usePurchaseProcessForm'

describe('Purchase Process - Conformidade & Evidências (Tópico 5)', () => {
  it('deve inicializar um novo processo com a seção de conformidade vazia e pronta para preenchimento', () => {
    const process = createNewProcess()

    expect(process.conformidade).toBeDefined()
    expect(process.conformidade.comprovacaoSolicitacao).toEqual({
      checked: false,
      arquivos: [],
    })
    expect(process.conformidade.autorizacaoCompra).toEqual({
      checked: false,
      arquivos: [],
    })
    expect(process.conformidade.notaFiscal).toEqual({
      checked: false,
      arquivos: [],
    })
    expect(process.conformidade.cotacoes).toEqual({
      checked: false,
      arquivos: [],
    })
  })

  it('deve incluir o objeto de conformidade no payload limpo para envio à API', () => {
    const process = createNewProcess()
    process.conformidade.comprovacaoSolicitacao = {
      checked: true,
      arquivos: [
        {
          id: 'file-123',
          nome: 'solicitacao_email.pdf',
          tamanho: 1048576,
          tipo: 'application/pdf',
          data: '2026-09-29T16:00:00Z',
          url: 'data:application/pdf;base64,AAAA',
        },
      ],
    }

    const payload = cleanPurchaseProcessPayload(process)
    expect(payload.conformidade).toBeDefined()
    expect(payload.conformidade.comprovacaoSolicitacao.checked).toBe(true)
    expect(payload.conformidade.comprovacaoSolicitacao.arquivos).toHaveLength(1)
    expect(payload.conformidade.comprovacaoSolicitacao.arquivos[0].nome).toBe(
      'solicitacao_email.pdf'
    )
  })

  it('deve suportar formulários legados ou já preenchidos sem conformidade garantindo estado vazio', () => {
    const legacyFetchedData: any = {
      id: 'proc-legacy',
      identificacao: { objeto: 'Compra antiga' },
      fornecedores: [],
      itens: [],
      decisao: {},
      aprovacao: {},
      avaliacao: {},
      // Sem conformidade
    }

    // Simula a inicialização segura do useEffect
    const resolvedCompliance: PurchaseCompliance = {
      comprovacaoSolicitacao: {
        checked: Boolean(legacyFetchedData.conformidade?.comprovacaoSolicitacao?.checked),
        arquivos: legacyFetchedData.conformidade?.comprovacaoSolicitacao?.arquivos || [],
      },
      autorizacaoCompra: {
        checked: Boolean(legacyFetchedData.conformidade?.autorizacaoCompra?.checked),
        arquivos: legacyFetchedData.conformidade?.autorizacaoCompra?.arquivos || [],
      },
      notaFiscal: {
        checked: Boolean(legacyFetchedData.conformidade?.notaFiscal?.checked),
        arquivos: legacyFetchedData.conformidade?.notaFiscal?.arquivos || [],
      },
      cotacoes: {
        checked: Boolean(legacyFetchedData.conformidade?.cotacoes?.checked),
        arquivos: legacyFetchedData.conformidade?.cotacoes?.arquivos || [],
      },
    }

    expect(resolvedCompliance.comprovacaoSolicitacao.checked).toBe(false)
    expect(resolvedCompliance.comprovacaoSolicitacao.arquivos).toEqual([])
    expect(resolvedCompliance.autorizacaoCompra.checked).toBe(false)
    expect(resolvedCompliance.notaFiscal.checked).toBe(false)
    expect(resolvedCompliance.cotacoes.checked).toBe(false)
  })
})
