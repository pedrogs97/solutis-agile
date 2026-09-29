import { describe, expect, it } from 'vitest'

function parseCurrencyOrNull(val: string | number | undefined | null): number | null {
  if (val === '' || val === null || val === undefined) return null
  if (typeof val === 'number') return Number.isNaN(val) ? null : val
  const str = String(val).trim()
  if (!str) return null

  let normalized = str
  if (str.includes(',') && str.includes('.')) {
    normalized = str.replace(/\./g, '').replace(',', '.')
  } else if (str.includes(',')) {
    normalized = str.replace(',', '.')
  } else if (str.includes('.')) {
    const parts = str.split('.')
    if (parts.length > 2) {
      normalized = str.replace(/\./g, '')
    } else {
      normalized = str
    }
  }

  const num = parseFloat(normalized)
  return Number.isNaN(num) ? null : num
}

describe('Purchase Process Currency Parsing (A-14 / N-09)', () => {
  it('handles empty and null values gracefully', () => {
    expect(parseCurrencyOrNull('')).toBeNull()
    expect(parseCurrencyOrNull(null)).toBeNull()
    expect(parseCurrencyOrNull(undefined)).toBeNull()
  })

  it('preserves native numbers without string corruption', () => {
    expect(parseCurrencyOrNull(12.5)).toBe(12.5)
    expect(parseCurrencyOrNull(0)).toBe(0)
    expect(parseCurrencyOrNull(1500.99)).toBe(1500.99)
  })

  it('parses brazilian decimal comma strings properly', () => {
    expect(parseCurrencyOrNull('12,50')).toBe(12.5)
    expect(parseCurrencyOrNull('0,75')).toBe(0.75)
    expect(parseCurrencyOrNull('1.250,50')).toBe(1250.5)
    expect(parseCurrencyOrNull('10.000,99')).toBe(10000.99)
  })

  it('parses standard dot decimal strings properly (numpad input)', () => {
    expect(parseCurrencyOrNull('12.50')).toBe(12.5)
    expect(parseCurrencyOrNull('100.25')).toBe(100.25)
    expect(parseCurrencyOrNull('0.99')).toBe(0.99)
  })
})
