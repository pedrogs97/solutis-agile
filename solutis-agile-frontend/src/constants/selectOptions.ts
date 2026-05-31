/**
 * Constants for lending contract management
 */

export const BUSINESS_UNITS = ['ADS', 'CSA', 'BPS', 'CORP'] as const

export const CONTRACT_LOCATIONS = ['Salvador - BA', 'São Paulo - SP'] as const

export const PRINCIPAL_SIGNERS = [
  {
    label: 'Beatriz Cunha',
    value: 'beatriz.cunha@solutis.com.br',
  },
  {
    label: 'Thomas Lichtenberger',
    value: 'thomas.lichtenberger@solutis.com.br',
  },
  {
    label: 'Carla Virginia',
    value: 'carla.anunciacao@solutis.com.br',
  },
] as const

export const FILE_UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB in bytes
  ACCEPTED_TYPES: '.pdf',
  MAX_VERIFICATION_IMAGES: 8,
} as const

export const FORM_FIELD_LIMITS = {
  OBSERVATIONS_MAX_LENGTH: 255,
  TEXTAREA_ROWS: 7,
} as const

export const LEGAL_PERSON_OPTIONS = [
  { value: 'true', label: 'Pessoa Jurídica' },
  { value: 'false', label: 'Pessoa Física' },
] as const

export const CLOTH_SIZES = ['PP', 'P', 'M', 'G', 'GG', 'XG'] as const

export const YES_NO_OPTIONS = [
  { value: '', label: '' },
  { value: '1', label: 'Sim' },
  { value: '0', label: 'Não' },
]
