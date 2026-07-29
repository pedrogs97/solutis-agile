import { describe, expect, it } from 'vitest'

import { normalizeApiErrors } from './api-errors'

describe('normalizeApiErrors', () => {
  it('should normalize FastAPI validation error format with loc array and msg', () => {
    const fastApiError = {
      detail: [
        {
          loc: ['body', 'role'],
          msg: 'Input should be a valid integer',
          type: 'int_parsing',
        },
        {
          loc: ['body', 'employerContractDate'],
          msg: 'Input should be a valid date',
          type: 'date_from_date_parsing',
        },
      ],
    }

    const normalized = normalizeApiErrors(fastApiError)
    expect(normalized).toEqual([
      { field: 'role', error: 'Input should be a valid integer' },
      { field: 'employerContractDate', error: 'Input should be a valid date' },
    ])
  })

  it('should normalize custom backend error format with field and error', () => {
    const customError = [
      { field: 'taxpayerIdentification', error: 'Colaborador já existe' },
    ]

    const normalized = normalizeApiErrors(customError)
    expect(normalized).toEqual([
      { field: 'taxpayerIdentification', error: 'Colaborador já existe' },
    ])
  })

  it('should normalize string error payload', () => {
    const stringError = 'Erro interno do servidor'
    const normalized = normalizeApiErrors(stringError)
    expect(normalized).toEqual([
      { field: 'general', error: 'Erro interno do servidor' },
    ])
  })
})
