import type { PureAbility } from '@casl/ability'
import { useAbility } from '@casl/react'
import { type DependencyList, useEffect } from 'react'

import { AbilityContext } from '@/components/providers/ability'
import { useProfileStore } from '@/store/persisted/useProfileStore'

interface AbilityGuardResult {
  ability: PureAbility
  isAbilityReady: boolean
}

export function useAbilityGuard(
  effect: (ability: PureAbility) => void | (() => void),
  deps: DependencyList = [],
): AbilityGuardResult {
  const ability = useAbility(AbilityContext) as PureAbility
  const isAbilityReady = useProfileStore((state) => state.hasHydrated)

  useEffect(() => {
    if (!isAbilityReady) {
      return
    }

    return effect(ability)
  }, [ability, isAbilityReady, ...deps])

  return { ability, isAbilityReady }
}
