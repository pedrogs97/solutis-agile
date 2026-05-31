import { describe, expect, it } from 'vitest'

import { getSupplierTabs } from './useSupplierForm'

describe('getSupplierTabs', () => {
  it('hides performance-evaluation and approval-workflow tabs in create mode', () => {
    const tabs = getSupplierTabs('create')

    expect(tabs.some((tab) => tab.value === 'performance-evaluation')).toBe(
      false,
    )
    expect(tabs.some((tab) => tab.value === 'approval-workflow')).toBe(false)
    expect(tabs.length).toBe(4)
  })

  it('keeps performance evaluation and approval-workflow tabs in edit mode', () => {
    const tabs = getSupplierTabs('edit')

    expect(tabs.some((tab) => tab.value === 'performance-evaluation')).toBe(
      true,
    )
    expect(tabs.some((tab) => tab.value === 'approval-workflow')).toBe(true)
    expect(tabs.length).toBe(6)
  })
})
