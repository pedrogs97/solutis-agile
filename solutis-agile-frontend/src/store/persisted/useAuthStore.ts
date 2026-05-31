import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Tokens {
  accessToken: null | string
  expiresIn: null | number
  refreshToken: null | string
}

interface SignInTokens {
  access_token?: null | string
  expires_in?: null | number
  refresh_token?: null | string
}

interface AuthState {
  accessToken: Tokens['accessToken']
  expiresIn: Tokens['expiresIn']
  hydrateAuthTokens: () => Tokens
  refreshToken: Tokens['refreshToken']
  signIn: (tokens: SignInTokens) => void
  signOut: () => void
}

export const useAuthStore = create(
  persist<AuthState>(
    (set, get) => ({
      accessToken: null,
      expiresIn: null,
      hydrateAuthTokens: () => {
        return {
          accessToken: get().accessToken,
          expiresIn: get().expiresIn,
          refreshToken: get().refreshToken,
        }
      },
      refreshToken: null,
      signIn: ({ access_token, expires_in, refresh_token }) =>
        set({
          accessToken:
            typeof access_token === 'string' && access_token.trim()
              ? access_token
              : null,
          expiresIn: typeof expires_in === 'number' ? expires_in : null,
          refreshToken:
            typeof refresh_token === 'string' && refresh_token.trim()
              ? refresh_token
              : null,
        }),
      signOut: async () => {
        set({ accessToken: null, expiresIn: null, refreshToken: null })

        // Clear Localstorage
        localStorage.removeItem('auth-store')
        localStorage.removeItem('profile-store')
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
      },
    }),
    { name: 'auth-store' },
  ),
)

export default useAuthStore

export const signIn = (tokens: SignInTokens) =>
  useAuthStore.getState().signIn(tokens)
export const signOut = () => useAuthStore.getState().signOut()
export const hydrateAuthTokens = () =>
  useAuthStore.getState().hydrateAuthTokens()
