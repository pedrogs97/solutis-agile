import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { SupplierOut } from '@/api/generated/types/SupplierOut.ts'
import {
  type ResponsibilityMatrixData,
  updateResponsibilityMatrix,
} from '@/services/api/supplier'

import { type SupplierFormData, useSupplierForm } from './useSupplierForm'

const { navigateMock, notificationShowMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  notificationShowMock: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
}))

vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: notificationShowMock,
  },
}))

vi.mock('@/hooks/useDomainOptions', () => ({
  useDomainOptions: () => ({
    pixTypes: [],
  }),
}))

vi.mock('@/hooks/useFormPersistence', () => ({
  useFormPersistence: () => ({
    hasDraft: vi.fn(() => false),
    restoreDraft: vi.fn(),
    clearStorage: vi.fn(),
    getDraftTimestamp: vi.fn(() => null),
  }),
}))

vi.mock('@/utils/cep', () => ({
  fetchCep: vi.fn(async () => null),
}))

// Mock the Kubb-generated API clients (these are what useSupplierForm actually calls)
vi.mock('@/api/generated/clients/createSupplier', () => ({
  createSupplier: vi.fn(),
}))

vi.mock('@/api/generated/clients/patchSupplier', () => ({
  patchSupplier: vi.fn(),
}))

// Mock only the services still used (responsibility matrix, attachments)
vi.mock('@/services/api/supplier', () => ({
  saveResponsibilityMatrix: vi.fn(),
  updateResponsibilityMatrix: vi.fn(),
  uploadSupplierAttachment: vi.fn(),
}))

// Import mocked clients after vi.mock declarations
import { createSupplier as mockCreateSupplier } from '@/api/generated/clients/createSupplier'
import { patchSupplier as mockPatchSupplier } from '@/api/generated/clients/patchSupplier'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

const supplierOut = (overrides: Partial<SupplierOut> = {}): SupplierOut => ({
  id: 10,
  legalName: 'Fornecedor Teste LTDA',
  taxId: '12345678000195',
  ...overrides,
})

const supplierFormData = (
  overrides: Partial<SupplierFormData> = {},
): SupplierFormData => ({
  classification: '1',
  category: '2',
  riskLevel: '3',
  type: '4',
  situation: undefined,
  legalName: 'Fornecedor Teste LTDA',
  tradeName: 'Fornecedor Teste',
  taxId: '12.345.678/0001-95',
  stateBusinessRegistration: '123456',
  municipalBusinessRegistration: '654321',
  address: {
    postalCode: '50000-000',
    street: 'Rua Unit',
    neighbourhood: 'Boa Vista',
    city: 'Recife',
    state: 'PE',
    number: 123,
    complement: 'Sala 4',
  },
  contact: {
    name: 'Ana Teste',
    email: 'ana.teste@example.com',
    phone: '(81) 99999-9999',
  },
  organizationalDetails: {
    businessSector: '5',
    costCenter: 'CC-01',
    businessUnit: 'BU Recife',
    responsibleExecutive: 'Exec Teste',
    responsibleManager: 'Gestor Teste',
  },
  fiscalDetails: {
    simplesNacionalParticipant: true,
  },
  companyInformation: {
    companySize: '6',
  },
  contract: {
    objectContract: 'Contrato de servicos',
    executedActivities: 'Atividades de teste',
    contractStartDate: '2026-05-01',
    contractEndDate: '2026-12-31',
    contractType: 'Mensal',
    contractPeriod: '12',
    hasContractRenewal: false,
    warningContractRenewal: false,
    warningContractPeriod: '',
    warningOnTermination: false,
    warningOnRenewal: false,
    warningOnPeriod: false,
  },
  paymentDetails: {
    paymentFrequency: 'Mensal',
    paymentDate: '05 de cada mês',
    contractTotalValue: '1.234,56',
    contractMonthlyValue: '123,45',
    bank: 'Banco Teste',
    bankCode: '001',
    agency: '1234',
    checkingAccount: '12345-6',
    pixKey: '',
    paymentMethod: '7',
    pixKeyType: undefined,
  },
  ...overrides,
})

const matrixPayload = {
  supplier: 10,
  contractRequestRequestingArea: 'R',
} as ResponsibilityMatrixData

describe('useSupplierForm submit/save', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(mockCreateSupplier).mockResolvedValue(supplierOut())
    vi.mocked(mockPatchSupplier).mockResolvedValue(supplierOut())
    vi.mocked(updateResponsibilityMatrix).mockResolvedValue(
      matrixPayload as never,
    )
  })

  it('creates supplier with normalized payload from form values', async () => {
    const { result } = renderHook(
      () =>
        useSupplierForm({
          mode: 'create',
        }),
      { wrapper: createWrapper() },
    )

    act(() => {
      result.current.form.reset(supplierFormData())
    })

    await act(async () => {
      await result.current.handleFinalSubmit()
    })

    await waitFor(() => {
      expect(mockCreateSupplier).toHaveBeenCalledTimes(1)
    })

    const payload = vi.mocked(mockCreateSupplier).mock.calls[0]![0]
    expect(payload).toMatchObject({
      classification: 1,
      category: 2,
      riskLevel: 3,
      type: 4,
      legalName: 'Fornecedor Teste LTDA',
      tradeName: 'Fornecedor Teste',
      taxId: '12345678000195',
      address: expect.objectContaining({
        postalCode: '50000000',
      }),
      contact: expect.objectContaining({
        phone: '81999999999',
      }),
      paymentDetails: expect.objectContaining({
        paymentDate: '05 de cada mês',
        contractTotalValue: 1234.56,
        contractMonthlyValue: 123.45,
        paymentMethod: 7,
      }),
      contract: expect.objectContaining({
        contractStartDate: '2026-05-01',
        contractEndDate: '2026-12-31',
      }),
    })
    expect(payload).not.toHaveProperty('situation')
    expect(navigateMock).toHaveBeenCalledWith({ to: '/suppliers' })
  })

  it('saves all tabs with full normalized payload on handleSaveProgress', async () => {
    const { result } = renderHook(
      () =>
        useSupplierForm({
          mode: 'edit',
          supplierId: '10',
          initialData: supplierFormData(),
        }),
      { wrapper: createWrapper() },
    )

    act(() => {
      result.current.form.setValue('legalName', 'Fornecedor Editado LTDA')
      result.current.form.setValue('contact.phone', '(81) 98888-7777')
    })

    await act(async () => {
      await result.current.handleSaveProgress()
    })

    await waitFor(() => {
      expect(mockPatchSupplier).toHaveBeenCalledTimes(1)
    })

    const [pk, payload] = vi.mocked(mockPatchSupplier).mock.calls[0]!
    expect(pk).toBe(10)
    expect(payload).toMatchObject({
      riskLevel: 3,
      legalName: 'Fornecedor Editado LTDA',
      contact: expect.objectContaining({
        phone: '81988887777',
      }),
      contract: expect.objectContaining({
        contractStartDate: '2026-05-01',
        contractEndDate: '2026-12-31',
      }),
      paymentDetails: expect.objectContaining({
        contractTotalValue: 1234.56,
        contractMonthlyValue: 123.45,
      }),
    })
    expect(payload).not.toHaveProperty('situation')
  })

  it('saves responsibility matrix from edit matrix tab', async () => {
    const getMatrixData = vi.fn(async () => matrixPayload)

    const { result } = renderHook(
      () =>
        useSupplierForm({
          mode: 'edit',
          supplierId: '10',
          initialData: supplierFormData(),
          responsibilityMatrixInitialData: matrixPayload,
          onGetResponsibilityMatrixData: getMatrixData,
        }),
      { wrapper: createWrapper() },
    )

    act(() => {
      result.current.handleTabChange('responsibility-matrix')
    })

    await waitFor(() => {
      expect(result.current.activeTab).toBe('responsibility-matrix')
    })

    await act(async () => {
      await result.current.handleSaveProgress()
    })

    await waitFor(() => {
      expect(getMatrixData).toHaveBeenCalledWith(10)
      expect(updateResponsibilityMatrix).toHaveBeenCalledWith(10, matrixPayload)
    })
  })
})
