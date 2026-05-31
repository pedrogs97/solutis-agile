import { useMutation, type UseMutationResult } from '@tanstack/react-query'

import { addMaintenance } from '@/services/api/maintenance'

export const useMaintenance = (): UseMutationResult<any | undefined> => {
  return useMutation({
    mutationKey: ['addMaintenance'],
    mutationFn: addMaintenance,
  })
}
