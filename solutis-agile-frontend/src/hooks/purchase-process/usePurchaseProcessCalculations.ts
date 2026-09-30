import { useMemo } from 'react'

import type {
  PurchaseItem,
  PurchaseProcess,
  PurchaseSupplier,
} from '@/types/PurchaseProcess'
import { CRITERIOS_AVALIACAO, NIVEIS_SATISFACAO } from '@/types/PurchaseProcess'

export function num(v: unknown): number {
  if (v == null || v === '') return 0
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

export function cnpjDigits(s: unknown): string {
  return String(s || '').replace(/\D/g, '')
}

export function maskCnpj(v: unknown): string {
  const d = cnpjDigits(v).slice(0, 14)
  let out = d.slice(0, 2)
  if (d.length > 2) out += '.' + d.slice(2, 5)
  if (d.length > 5) out += '.' + d.slice(5, 8)
  if (d.length > 8) out += '/' + d.slice(8, 12)
  if (d.length > 12) out += '-' + d.slice(12, 14)
  return out
}

export function formatMoney(v: unknown): string {
  const n = num(v)
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatDate(iso?: string | Date | null): string {
  if (!iso) return '—'
  if (iso instanceof Date) {
    if (isNaN(iso.getTime())) return '—'
    const day = String(iso.getDate()).padStart(2, '0')
    const month = String(iso.getMonth() + 1).padStart(2, '0')
    const year = iso.getFullYear()
    return `${day}/${month}/${year}`
  }

  const str = String(iso).trim()
  if (!str) return '—'

  // Se já estiver no formato brasileiro DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return str

  // Se for formato ISO iniciando em YYYY-MM-DD (ex.: 2026-09-29 ou 2026-09-29T...)
  // Extrai ano, mês e dia diretamente sem new Date() para evitar recuo de dia em fusos negativos (UTC-3)
  const ymdMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (ymdMatch) {
    const [, year, month, day] = ymdMatch
    return `${day}/${month}/${year}`
  }

  try {
    const d = new Date(str)
    if (isNaN(d.getTime())) return str
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  } catch {
    return str
  }
}

export function formatDateTime(iso?: string | Date | null): string {
  if (!iso) return '—'
  if (iso instanceof Date) {
    if (isNaN(iso.getTime())) return '—'
    return (
      iso.toLocaleDateString('pt-BR') +
      ' ' +
      iso.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    )
  }

  const str = String(iso).trim()
  if (!str) return '—'

  // Se for apenas data YYYY-MM-DD sem horário
  const ymdOnlyMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (ymdOnlyMatch) {
    const [, year, month, day] = ymdOnlyMatch
    return `${day}/${month}/${year}`
  }

  try {
    const d = new Date(str)
    if (isNaN(d.getTime())) return str
    return (
      d.toLocaleDateString('pt-BR') +
      ' ' +
      d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    )
  } catch {
    return str
  }
}

export function calcItemTotal(item: PurchaseItem, supplierId: string): number {
  const p = num(item.precos ? item.precos[supplierId] : 0)
  const q = num(item.qtd != null ? item.qtd : 1)
  return round2(q * p)
}

export function calcAutoGrossValue(
  proc: Partial<PurchaseProcess>,
  supplierId: string
): number {
  let sum = 0
  ;(proc.itens || []).forEach((it) => {
    sum += calcItemTotal(it, supplierId)
  })
  return round2(sum)
}

export function hasItemsWithDescription(proc: Partial<PurchaseProcess>): boolean {
  return (proc.itens || []).some((it) => (it.descricao || '').trim() !== '')
}

export function calcGrossValue(
  proc: Partial<PurchaseProcess>,
  forn: PurchaseSupplier
): number {
  if (hasItemsWithDescription(proc)) {
    return calcAutoGrossValue(proc, forn.id)
  }
  return round2(num(forn.valorBrutoManual))
}

export function calcCTA(
  proc: Partial<PurchaseProcess>,
  forn: PurchaseSupplier
): number {
  const vb = calcGrossValue(proc, forn)
  const desconto = num(forn.desconto)
  const impostos = num(forn.impostos)
  const frete = num(forn.frete)
  const outros = num(forn.outros)
  return round2(vb - desconto + impostos + frete + outros)
}

export function getFilledSuppliers(
  proc: Partial<PurchaseProcess>
): PurchaseSupplier[] {
  return (proc.fornecedores || []).filter((f) => (f.nome || '').trim() !== '')
}

export function getLowestCtaSupplier(
  proc: Partial<PurchaseProcess>
): PurchaseSupplier | null {
  const list = getFilledSuppliers(proc)
  if (!list.length) return null
  let best: PurchaseSupplier | null = null
  let bestVal = Infinity
  list.forEach((f) => {
    const v = calcCTA(proc, f)
    if (v < bestVal) {
      bestVal = v
      best = f
    }
  })
  return best
}

export function getHighestCtaSupplier(
  proc: Partial<PurchaseProcess>
): PurchaseSupplier | null {
  const list = getFilledSuppliers(proc)
  if (!list.length) return null
  let worst: PurchaseSupplier | null = null
  let worstVal = -Infinity
  list.forEach((f) => {
    const v = calcCTA(proc, f)
    if (v > worstVal) {
      worstVal = v
      worst = f
    }
  })
  return worst
}

export function getSelectedSupplier(
  proc: Partial<PurchaseProcess>
): PurchaseSupplier | null {
  const recId = proc.decisao?.fornecedorRecomendadoId
  const found = (proc.fornecedores || []).find((f) => f.id === recId)
  return found || getLowestCtaSupplier(proc)
}

export function calcProcessValue(proc: Partial<PurchaseProcess>): number {
  const f = getSelectedSupplier(proc)
  return f ? calcCTA(proc, f) : 0
}

export function calcEstimatedSavings(proc: Partial<PurchaseProcess>): number {
  const low = getLowestCtaSupplier(proc)
  const high = getHighestCtaSupplier(proc)
  if (low && high && low.id !== high.id) {
    const diff = calcCTA(proc, high) - calcCTA(proc, low)
    return round2(Math.max(0, diff))
  }
  return 0
}

export function calcEvaluationIndex(proc: Partial<PurchaseProcess>): number | null {
  const crit = proc.avaliacao?.criterios || {}
  const vals: number[] = []

  CRITERIOS_AVALIACAO.forEach((c) => {
    const nivel = crit[c.key]?.nivel
    const found = NIVEIS_SATISFACAO.find((n) => n.label === nivel)
    if (found) vals.push(found.valor)
  })

  if (!vals.length) return null
  const sum = vals.reduce((a, b) => a + b, 0)
  return round4(sum / CRITERIOS_AVALIACAO.length)
}

export function calcPerformanceClassification(
  idx: number | null
): 'Excelente' | 'Satisfatório' | 'Atenção' | 'Insatisfatório' | null {
  if (idx == null) return null
  if (idx >= 0.9) return 'Excelente'
  if (idx >= 0.8) return 'Satisfatório'
  if (idx >= 0.6) return 'Atenção'
  return 'Insatisfatório'
}

function round2(v: number): number {
  return Math.round(v * 100) / 100
}

function round4(v: number): number {
  return Math.round(v * 10000) / 10000
}

export function usePurchaseProcessCalculations(proc: Partial<PurchaseProcess>) {
  return useMemo(() => {
    const filledSuppliers = getFilledSuppliers(proc)
    const lowest = getLowestCtaSupplier(proc)
    const highest = getHighestCtaSupplier(proc)
    const selected = getSelectedSupplier(proc)
    const processValue = calcProcessValue(proc)
    const estimatedSavings = calcEstimatedSavings(proc)
    const evaluationIndex = calcEvaluationIndex(proc)
    const performanceClassification = calcPerformanceClassification(evaluationIndex)
    const hasItems = hasItemsWithDescription(proc)

    const ctaMap: Record<string, number> = {}
    const grossMap: Record<string, number> = {}
    ;(proc.fornecedores || []).forEach((f) => {
      ctaMap[f.id] = calcCTA(proc, f)
      grossMap[f.id] = calcGrossValue(proc, f)
    })

    return {
      filledSuppliers,
      lowest,
      highest,
      selected,
      processValue,
      estimatedSavings,
      evaluationIndex,
      performanceClassification,
      hasItems,
      ctaMap,
      grossMap,
      calcItemTotal: (item: PurchaseItem, supplierId: string) =>
        calcItemTotal(item, supplierId),
      calcCTA: (forn: PurchaseSupplier) => calcCTA(proc, forn),
      calcGrossValue: (forn: PurchaseSupplier) => calcGrossValue(proc, forn),
    }
  }, [proc])
}
