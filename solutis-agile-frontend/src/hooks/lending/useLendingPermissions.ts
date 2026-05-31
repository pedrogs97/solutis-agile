'use client'

import { notifications } from '@mantine/notifications'
import { useNavigate } from '@tanstack/react-router'
import { useMemo } from 'react'

import { useAbilityGuard } from '@/hooks/useAbilityGuard'
import { useProfileStore } from '@/store/persisted/useProfileStore'

interface UseLendingPermissionsParams {
  lendingId?: string | null
}

export function useLendingPermissions({
  lendingId,
}: Readonly<UseLendingPermissionsParams>) {
  const navigate = useNavigate()
  const profilePermissions = useProfileStore(
    (state) => state.profile?.permissions,
  )

  const { ability, isAbilityReady } = useAbilityGuard(
    (currentAbility) => {
      const shouldWaitForAbilityInitialization =
        Array.isArray(profilePermissions) &&
        profilePermissions.length > 0 &&
        (currentAbility as any)?.rules?.length === 0

      if (shouldWaitForAbilityInitialization) {
        return
      }

      if (!lendingId && currentAbility.cannot('add', 'lending')) {
        notifications.show({
          message:
            'Usuário não possui permissão "Adicionar Contrato de Comodato"',
        })
        navigate({ to: '/dashboard' })
        return
      }

      if (lendingId && currentAbility.cannot('view', 'lending')) {
        notifications.show({
          message:
            'Usuário não possui permissão "Visualizar Contrato de Comodato"',
        })
        navigate({ to: '/dashboard' })
      }
    },
    [lendingId, navigate, profilePermissions],
  )

  const permissions = useMemo(
    () => ({
      canEdit: isAbilityReady ? ability.can('edit', 'lending') : false,
      canDelete: isAbilityReady ? ability.can('delete', 'lending') : false,
    }),
    [ability, isAbilityReady],
  )
  return permissions
}
