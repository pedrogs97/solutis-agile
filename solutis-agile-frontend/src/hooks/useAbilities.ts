'use client'

import {
  type AnyAbility,
  type ExtractSubjectType,
  type MongoQuery,
  PureAbility,
  type Subject,
  type SubjectRawRule,
} from '@casl/ability'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

import { useProfileStore } from '@/store/persisted/useProfileStore'

const AbilityContext = createContext<AnyAbility>({} as AnyAbility)

type MongoQueryType = Record<string, unknown>
type SubjectRawRuleType = SubjectRawRule<
  string,
  ExtractSubjectType<Subject>,
  MongoQuery<MongoQueryType>
>

export type AbilityProps = SubjectRawRuleType[] | undefined

export interface CaslAbilitiesProps {
  abilities: PureAbility
  isHydrated: boolean
}

export const useAbilitiesContext = (): AnyAbility => useContext(AbilityContext)

export const useAbilites = (): CaslAbilitiesProps => {
  const [abilities, setAbilities] = useState<PureAbility>(new PureAbility())

  const profile = useProfileStore((state) => state.profile)
  const hasHydrated = useProfileStore((state) => state.hasHydrated)

  const updateAbilities = useCallback(
    (abilities: AbilityProps) => {
      const newAbilities = new PureAbility(abilities)
      setAbilities(newAbilities)
    },
    [setAbilities],
  )

  const previousPermissionsRef = useRef<string | null>(null)

  useEffect(() => {
    if (!hasHydrated) {
      return
    }

    const permissions = profile?.permissions ?? []
    const serializedPermissions = JSON.stringify(permissions)

    if (previousPermissionsRef.current === serializedPermissions) {
      return
    }

    previousPermissionsRef.current = serializedPermissions

    const pureAbilities = [] as SubjectRawRuleType[]
    permissions.forEach((permission: string) => {
      const splittedPermission = permission.split('_')
      const action = splittedPermission[splittedPermission.length - 1]
      const subject = splittedPermission
        .slice(1, splittedPermission.length - 1)
        .join('_')
      pureAbilities.push({ action, subject })
    })
    updateAbilities(pureAbilities)
  }, [hasHydrated, profile, updateAbilities])

  return { abilities, isHydrated: hasHydrated }
}
