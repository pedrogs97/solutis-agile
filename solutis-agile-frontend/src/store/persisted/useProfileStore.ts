import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Profile {
  group: string
  email: string
  full_name: string
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  permissions: string[]
}

interface ProfileState {
  profile: Profile | null | undefined
  hasHydrated: boolean
  hydrateProfile: () => Profile | null
  updateProfile: (profile: Profile | undefined) => void
  resetProfile: () => void
  setHydrated: () => void
}

export const useProfileStore = create(
  persist<ProfileState>(
    (set, get) => ({
      profile: undefined,
      hasHydrated: false,
      hydrateProfile: () => {
        return (get().profile ?? null) as Profile | null
      },
      updateProfile: (profile: Profile | undefined) => set({ profile }),
      resetProfile: () => set({ profile: null }),
      setHydrated: () => set({ hasHydrated: true }),
    }),
    {
      name: 'profile-store',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated?.()
      },
    },
  ),
)

export const resetProfile = () => useProfileStore.getState().resetProfile()
export const updateProfile = (profile: Profile | undefined) =>
  useProfileStore.getState().updateProfile(profile)
export const getProfile = () => useProfileStore.getState().hydrateProfile()
