import { describe, expect, it } from 'vitest'

import {
  getPixKeyValidationMessage,
  getPixType,
  pixKeyTypeFromLabel,
  validatePixKey,
  validatePixKeyMatchesType,
} from './pix'

describe('PIX validation', () => {
  it('accepts empty pix key (message empty)', () => {
    expect(getPixKeyValidationMessage('', undefined)).toBe('')
    expect(getPixKeyValidationMessage('   ', undefined)).toBe('')
  })

  describe('getPixType / validatePixKey', () => {
    it('detects CPF with or without punctuation', () => {
      const cpf = '390.533.447-05'
      const cpfNoPunct = '39053344705'

      expect(getPixType(cpf)).toBe('cpf')
      expect(getPixType(cpfNoPunct)).toBe('cpf')
      expect(validatePixKey(cpf)).toBe(true)
      expect(validatePixKey(cpfNoPunct)).toBe(true)
    })

    it('does not classify an invalid CPF as cpf (and fails cpf type check)', () => {
      // 11 digits can also look like a phone, so the detector may classify as phone.
      expect(getPixType('111.111.111-11')).not.toBe('cpf')
      expect(validatePixKeyMatchesType('111.111.111-11', 'cpf')).toBe(false)
    })

    it('detects CNPJ with or without punctuation', () => {
      // 04.252.011/0001-10 (Google Brasil) is a commonly used valid sample
      const cnpj = '04.252.011/0001-10'
      const cnpjNoPunct = '04252011000110'

      expect(getPixType(cnpj)).toBe('cnpj')
      expect(getPixType(cnpjNoPunct)).toBe('cnpj')
      expect(validatePixKey(cnpj)).toBe(true)
      expect(validatePixKey(cnpjNoPunct)).toBe(true)
    })

    it('rejects invalid CNPJ', () => {
      expect(getPixType('00.000.000/0000-00')).toBe(null)
      expect(validatePixKey('00000000000000')).toBe(false)
    })

    it('detects email', () => {
      expect(getPixType('user@example.com')).toBe('email')
      expect(validatePixKey('user@example.com')).toBe(true)
      expect(getPixType('user@example')).toBe(null)
      expect(validatePixKey('user@example')).toBe(false)
    })

    it('detects phone with or without punctuation/country code', () => {
      expect(getPixType('(11) 99999-9999')).toBe('phone')
      expect(getPixType('11999999999')).toBe('phone')
      expect(getPixType('+55 (11) 99999-9999')).toBe('phone')

      expect(validatePixKey('(11) 99999-9999')).toBe(true)
      expect(validatePixKey('11999999999')).toBe(true)
      expect(validatePixKey('+55 (11) 99999-9999')).toBe(true)

      expect(getPixType('123')).toBe(null)
      expect(validatePixKey('123')).toBe(false)
    })

    it('detects random key (UUID) in dashed or compact form', () => {
      const dashed = '550e8400-e29b-41d4-a716-446655440000'
      const compact = '550e8400e29b41d4a716446655440000'

      expect(getPixType(dashed)).toBe('random')
      expect(getPixType(compact)).toBe('random')
      expect(validatePixKey(dashed)).toBe(true)
      expect(validatePixKey(compact)).toBe(true)

      expect(getPixType('not-a-uuid')).toBe(null)
      expect(validatePixKey('not-a-uuid')).toBe(false)
    })
  })

  describe('pixKeyTypeFromLabel (backend domain label mapping)', () => {
    it('maps common labels to PixKeyType', () => {
      expect(pixKeyTypeFromLabel('CPF')).toBe('cpf')
      expect(pixKeyTypeFromLabel('CNPJ')).toBe('cnpj')
      expect(pixKeyTypeFromLabel('E-mail')).toBe('email')
      expect(pixKeyTypeFromLabel('Email')).toBe('email')
      expect(pixKeyTypeFromLabel('Telefone')).toBe('phone')
      expect(pixKeyTypeFromLabel('Chave Aleatória')).toBe('random')
    })
  })

  describe('validatePixKeyMatchesType', () => {
    it('matches when expected type corresponds to detected key type', () => {
      expect(validatePixKeyMatchesType('390.533.447-05', 'cpf')).toBe(true)
      expect(validatePixKeyMatchesType('04252011000110', 'cnpj')).toBe(true)
      expect(validatePixKeyMatchesType('user@example.com', 'email')).toBe(true)
      expect(validatePixKeyMatchesType('(11) 99999-9999', 'phone')).toBe(true)
      expect(
        validatePixKeyMatchesType(
          '550e8400-e29b-41d4-a716-446655440000',
          'random',
        ),
      ).toBe(true)
    })

    it('fails when expected type does not correspond', () => {
      expect(validatePixKeyMatchesType('390.533.447-05', 'cnpj')).toBe(false)
      expect(validatePixKeyMatchesType('user@example.com', 'phone')).toBe(false)
      expect(validatePixKeyMatchesType('(11) 99999-9999', 'email')).toBe(false)
    })

    it('is lenient when either key or expectedType is empty', () => {
      expect(validatePixKeyMatchesType('', 'cpf')).toBe(true)
      expect(validatePixKeyMatchesType('390.533.447-05', undefined)).toBe(true)
    })
  })
})
