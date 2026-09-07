import { describe, expect, it } from 'vitest'

import type { PurchaseProcess } from '@/types/PurchaseProcess'
import {
  calcAutoGrossValue,
  calcCTA,
  calcEstimatedSavings,
  calcEvaluationIndex,
  calcItemTotal,
  calcPerformanceClassification,
  calcProcessValue,
  cnpjDigits,
  formatMoney,
  getLowestCtaSupplier,
  maskCnpj,
} from './usePurchaseProcessCalculations'

describe('usePurchaseProcessCalculations', () => {
  it('formats CNPJ and cleans digits correctly', () => {
    expect(cnpjDigits('12.345.678/0001-99')).toBe('12345678000199')
    expect(maskCnpj('12345678000199')).toBe('12.345.678/0001-99')
    expect(formatMoney(1250.5)).toContain('1.250,50')
  })

  it('calculates item total and automatic gross value from items matrix', () => {
    const item = {
      id: 'it_1',
      descricao: 'Item 1',
      qtd: 3,
      unidade: 'UN',
      precos: { f_1: 150.0, f_2: 200.0 },
    }
    expect(calcItemTotal(item, 'f_1')).toBe(450.0)
    expect(calcItemTotal(item, 'f_2')).toBe(600.0)

    const process: Partial<PurchaseProcess> = {
      itens: [
        item,
        {
          id: 'it_2',
          descricao: 'Item 2',
          qtd: 2,
          unidade: 'UN',
          precos: { f_1: 50.0, f_2: 40.0 },
        },
      ],
    }
    // f_1: 450 + 100 = 550
    // f_2: 600 + 80 = 680
    expect(calcAutoGrossValue(process, 'f_1')).toBe(550.0)
    expect(calcAutoGrossValue(process, 'f_2')).toBe(680.0)
  })

  it('calculates CTA (Custo Total de Aquisição) correctly with taxes, discounts and freight', () => {
    const process: Partial<PurchaseProcess> = {
      itens: [
        {
          id: 'it_1',
          descricao: 'Item 1',
          qtd: 1,
          unidade: 'UN',
          precos: { f_1: 1000.0 },
        },
      ],
      fornecedores: [
        {
          id: 'f_1',
          nome: 'Fornecedor A',
          cnpj: '',
          desconto: 50.0,
          impostos: 80.0,
          frete: 30.0,
          outros: 10.0,
          condPagamento: '',
          prazoEntrega: '',
          validadeProposta: '',
          garantia: '',
          obs: '',
        },
      ],
    }
    // CTA: 1000 - 50 + 80 + 30 + 10 = 1070
    expect(calcCTA(process, process.fornecedores![0])).toBe(1070.0)
  })

  it('identifies lowest CTA, highest CTA and estimated savings', () => {
    const process: Partial<PurchaseProcess> = {
      itens: [
        {
          id: 'it_1',
          descricao: 'Serviço Cloud',
          qtd: 1,
          unidade: 'UN',
          precos: { f_1: 1000.0, f_2: 1500.0 },
        },
      ],
      fornecedores: [
        {
          id: 'f_1',
          nome: 'Alfa',
          cnpj: '',
          desconto: 100.0,
          impostos: 0.0,
          frete: 0.0,
          outros: 0.0,
          condPagamento: '',
          prazoEntrega: '',
          validadeProposta: '',
          garantia: '',
          obs: '',
        },
        {
          id: 'f_2',
          nome: 'Beta',
          cnpj: '',
          desconto: 0.0,
          impostos: 0.0,
          frete: 0.0,
          outros: 0.0,
          condPagamento: '',
          prazoEntrega: '',
          validadeProposta: '',
          garantia: '',
          obs: '',
        },
      ],
      decisao: {
        fornecedorRecomendadoId: 'f_1',
        minimoAtingido: 'sim',
        motivoKey: '',
        justificativa: '',
        recomendacao: '',
        observacoes: '',
      },
    }
    // f_1 CTA: 900
    // f_2 CTA: 1500
    // Savings: 600
    const lowest = getLowestCtaSupplier(process)
    expect(lowest?.id).toBe('f_1')
    expect(calcProcessValue(process)).toBe(900.0)
    expect(calcEstimatedSavings(process)).toBe(600.0)
  })

  it('calculates supplier evaluation satisfaction index and classification', () => {
    const process: Partial<PurchaseProcess> = {
      avaliacao: {
        preenchida: true,
        razaoSocial: 'Alfa',
        cnpj: '',
        descritivoCompra: '',
        nfNumero: '',
        dataCompra: '',
        criterios: {
          qualidade: { nivel: 'Muito Satisfeito' }, // 1.0
          prazo: { nivel: 'Muito Satisfeito' }, // 1.0
          pagamento: { nivel: 'Satisfeito' }, // 0.9
          custo: { nivel: 'Satisfeito' }, // 0.9
          atendimento: { nivel: 'Muito Satisfeito' }, // 1.0
          logistica: { nivel: 'Satisfeito' }, // 0.9
        },
        avaliador: '',
        dataAvaliacao: '',
      },
    }
    // (1.0 + 1.0 + 0.9 + 0.9 + 1.0 + 0.9) / 6 = 5.7 / 6 = 0.95
    const idx = calcEvaluationIndex(process)
    expect(idx).toBe(0.95)
    expect(calcPerformanceClassification(idx)).toBe('Excelente')
  })
})
