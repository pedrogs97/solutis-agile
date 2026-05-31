'use client'

import { useDomainOptions } from '@/hooks/useDomainOptions'

export const useCostCenterOptions = (enabled = true) => {
  const { costCenterOptions, isLoading, errors } = useDomainOptions({
    keys: ['costCenters'],
    enabled,
  })

  return {
    costCenterOptions: costCenterOptions ?? [],
    isLoading: isLoading.costCenters,
    error: errors.costCenters,
  }
}
