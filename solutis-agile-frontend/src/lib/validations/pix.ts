export type PixKeyType = 'cpf' | 'cnpj' | 'email' | 'phone' | 'random'

const normalizePixKeyForValidation = (pixKey: string): string => {
  // Accept common formatting characters (., -, /, spaces, parentheses, +)
  // by normalizing whitespace and trimming.
  return pixKey.trim().replace(/\s+/g, ' ')
}

const normalizeLabelForMatching = (label: string): string => {
  return label
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

export const pixKeyTypeFromLabel = (label: string): PixKeyType | null => {
  if (!label || label.trim().length === 0) return null

  const normalized = normalizeLabelForMatching(label)

  if (normalized.includes('cpf')) return 'cpf'
  if (normalized.includes('cnpj')) return 'cnpj'
  if (normalized.includes('email') || normalized.includes('e-mail'))
    return 'email'

  if (
    normalized.includes('telefone') ||
    normalized.includes('celular') ||
    normalized.includes('phone')
  ) {
    return 'phone'
  }

  if (
    normalized.includes('aleatoria') ||
    normalized.includes('aleatorio') ||
    normalized.includes('random') ||
    normalized.includes('uuid')
  ) {
    return 'random'
  }

  return null
}

/**
 * Validates if a CPF is valid
 */
const isValidCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/\D/g, '')

  if (cleanCPF.length !== 11 || /^(\d)\1{10}$/.test(cleanCPF)) {
    return false
  }

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i)
  }

  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i)
  }

  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0

  return remainder === parseInt(cleanCPF.charAt(10))
}

/**
 * Validates if a CNPJ is valid
 */
const isValidCNPJ = (cnpj: string): boolean => {
  const cleanCNPJ = cnpj.replace(/\D/g, '')

  if (cleanCNPJ.length !== 14 || /^(\d)\1{13}$/.test(cleanCNPJ)) {
    return false
  }

  let sum = 0
  let weight = 2

  for (let i = 11; i >= 0; i--) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weight
    weight = weight === 9 ? 2 : weight + 1
  }

  let remainder = sum % 11
  const digit1 = remainder < 2 ? 0 : 11 - remainder

  if (digit1 !== parseInt(cleanCNPJ.charAt(12))) return false

  sum = 0
  weight = 2

  for (let i = 12; i >= 0; i--) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weight
    weight = weight === 9 ? 2 : weight + 1
  }

  remainder = sum % 11
  const digit2 = remainder < 2 ? 0 : 11 - remainder

  return digit2 === parseInt(cleanCNPJ.charAt(13))
}

/**
 * Validates if an email is valid
 */
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 77
}

/**
 * Validates if a phone number is valid for PIX
 */
const isValidPhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/\D/g, '')
  // Brazilian phone numbers can be 10 or 11 digits (without country code)
  // or 12 or 13 digits (with +55 country code)
  return (
    (cleanPhone.length >= 10 && cleanPhone.length <= 11) ||
    (cleanPhone.length >= 12 && cleanPhone.length <= 13)
  )
}

/**
 * Validates if a random key is valid (UUID format)
 */
const isValidRandomKey = (key: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  const compactKey = key.replace(/-/g, '')
  const compactUuidRegex = /^[0-9a-f]{32}$/i
  return uuidRegex.test(key) || compactUuidRegex.test(compactKey)
}

/**
 * Gets the type of a PIX key
 */
export const getPixType = (pixKey: string): PixKeyType | null => {
  if (!pixKey || pixKey.trim().length === 0) {
    return null
  }

  const cleanKey = normalizePixKeyForValidation(pixKey)

  // Check if it's a CPF
  if (/^\d{11}$/.test(cleanKey.replace(/\D/g, '')) && isValidCPF(cleanKey)) {
    return 'cpf'
  }

  // Check if it's a CNPJ
  if (/^\d{14}$/.test(cleanKey.replace(/\D/g, '')) && isValidCNPJ(cleanKey)) {
    return 'cnpj'
  }

  // Check if it's an email
  if (cleanKey.includes('@') && isValidEmail(cleanKey)) {
    return 'email'
  }

  // Check if it's a phone (without requiring +55 prefix)
  const cleanPhone = cleanKey.replace(/\D/g, '')
  if (
    cleanPhone.length >= 10 &&
    cleanPhone.length <= 13 &&
    isValidPhone(cleanKey)
  ) {
    return 'phone'
  }

  // Check if it's a random key (UUID)
  if (isValidRandomKey(cleanKey)) {
    return 'random'
  }

  return null
}

/**
 * Validates if a PIX key is valid
 */
export const validatePixKey = (pixKey: string): boolean => {
  if (!pixKey || pixKey.trim().length === 0) {
    return false
  }

  return getPixType(normalizePixKeyForValidation(pixKey)) !== null
}

/**
 * Validates if the PIX key matches the specified type.
 *
 * Note: this does not depend on backend IDs. You should map the selected
 * domain option to a PixKeyType (e.g., via pixKeyTypeFromLabel()).
 */
export const validatePixKeyMatchesType = (
  pixKey: string,
  expectedType?: PixKeyType | null,
): boolean => {
  if (!pixKey || pixKey.trim().length === 0 || !expectedType) {
    return true // Skip validation if either field is empty
  }

  const normalizedPixKey = normalizePixKeyForValidation(pixKey)
  const actualType = getPixType(normalizedPixKey)
  return actualType === expectedType
}

/**
 * Gets validation message for PIX key
 */
export const getPixKeyValidationMessage = (
  pixKey: string,
  expectedType?: PixKeyType | null,
): string => {
  if (!pixKey || pixKey.trim().length === 0) {
    return ''
  }

  if (!validatePixKey(pixKey)) {
    return 'Chave PIX inválida'
  }

  if (expectedType && !validatePixKeyMatchesType(pixKey, expectedType)) {
    return 'Chave PIX não corresponde ao tipo selecionado'
  }

  return ''
}
