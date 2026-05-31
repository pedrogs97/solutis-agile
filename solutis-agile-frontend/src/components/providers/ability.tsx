'use client'

import { type AnyAbility } from '@casl/ability'
import { createContextualCan } from '@casl/react'
import { createContext, type FC, memo, type ReactNode } from 'react'

import { useAbilites } from '@/hooks/useAbilities'

const AbilityContext = createContext<AnyAbility>({} as AnyAbility)
const Can = createContextualCan(AbilityContext.Consumer)

const AbilityProvider: FC<{ children: ReactNode }> = memo(({ children }) => {
  const { abilities, isHydrated } = useAbilites()

  if (!isHydrated) {
    return null
  }

  return (
    <AbilityContext.Provider value={abilities}>
      {children}
    </AbilityContext.Provider>
  )
})

AbilityProvider.displayName = 'AbilityProvider'

export { AbilityContext, AbilityProvider, Can }
