export const ENVIRONMENT = {
  baseURL: import.meta.env.VITE_BASE_API_URL || '',
  flowAppURL: import.meta.env.VITE_FLOW_APP_URL || 'http://localhost:3001',
  enableSSO: import.meta.env.VITE_ENABLE_SSO === 'true',
  azureClientId: import.meta.env.VITE_AZURE_CLIENT_ID || '',
  azureTenantId: import.meta.env.VITE_AZURE_TENANT_ID || '',
  azureRedirectUri:
    import.meta.env.VITE_AZURE_REDIRECT_URI ||
    (typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback/azure`
      : ''),
}
