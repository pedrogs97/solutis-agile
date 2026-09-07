import { describe, expect, it } from 'vitest'

describe('Asset Evaluation ESG & Financial Calculations', () => {
  function calculateReusePercentage(gross: number, reused: number): number {
    if (gross <= 0) return 0
    const pct = (reused / gross) * 100
    return Math.min(100, Math.max(0, parseFloat(pct.toFixed(1))))
  }

  function calculateEstimatedEconomy(netBookValue: number, reusePercentage: number): number {
    if (netBookValue <= 0 || reusePercentage <= 0) return 0
    return parseFloat(((netBookValue * (reusePercentage / 100))).toFixed(2))
  }

  it('calculates ESG reuse percentage correctly with valid weights', () => {
    // 2.5kg gross, 2.0kg reused -> 80%
    const pct = calculateReusePercentage(2.5, 2.0)
    expect(pct).toBe(80.0)
  })

  it('handles zero or negative gross weight without division by zero', () => {
    expect(calculateReusePercentage(0, 1.5)).toBe(0)
    expect(calculateReusePercentage(-5, 1.5)).toBe(0)
  })

  it('caps reuse percentage at 100%', () => {
    // Reused exceeds gross weight due to data entry mistake
    expect(calculateReusePercentage(2.0, 3.5)).toBe(100.0)
  })

  it('calculates estimated economy based on net book value and ESG percentage', () => {
    // Net book value R$ 1.500,00 with 60% reuse -> R$ 900,00
    const economy = calculateEstimatedEconomy(1500.0, 60.0)
    expect(economy).toBe(900.0)
  })

  it('returns zero economy if net book value or reuse percentage is zero', () => {
    expect(calculateEstimatedEconomy(0, 80.0)).toBe(0)
    expect(calculateEstimatedEconomy(1500.0, 0)).toBe(0)
  })
})
