import { MantineProvider } from '@mantine/core'
import { ModalsProvider } from '@mantine/modals'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useProfileStore } from '@/store/persisted/useProfileStore'

import RevokeTab from './revoke-tab'

const mockOnUploadSignedRevoke = vi.fn()
const mockOnDeleteRevokeDocument = vi.fn()
const mockOnDownloadRevokeContract = vi.fn()
const mockOnRecreateRevokeContract = vi.fn()
const mockOnTerminateContract = vi.fn()

let mockFileRevoke: File | null = null

vi.mock('@/hooks/lending/useRevokeTab', () => ({
  useRevokeTab: () => ({
    fileRevoke: mockFileRevoke,
    setFileRevoke: vi.fn(),
    clearRevokeFile: vi.fn(),
    resetRevokeRef: vi.fn(),
    isSubmitting: false,
    onTerminateContract: mockOnTerminateContract,
    onDownloadRevokeContract: mockOnDownloadRevokeContract,
    onRecreateRevokeContract: mockOnRecreateRevokeContract,
    onUploadSignedRevoke: mockOnUploadSignedRevoke,
    onDeleteRevokeDocument: mockOnDeleteRevokeDocument,
  }),
}))

vi.mock('@/hooks/useThemeColors', () => ({
  useThemeColors: () => ({
    getSecondaryTextColor: () => '#666',
  }),
}))

vi.mock('@/services/api/employee', () => ({
  fetchEmployeeSelect: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/components/lendings/witness-selection', () => ({
  WitnessSelection: () => <div data-testid="witness-selection" />,
}))

const setProfileGroup = (group: string) => {
  useProfileStore.setState({
    profile: {
      group,
      email: 'test@solutis.com.br',
      full_name: 'Test User',
      access_token: 'token',
      refresh_token: 'refresh',
      token_type: 'Bearer',
      expires_in: 3600,
      permissions: [],
    },
  })
}

const renderComponent = (lendingData: any) => {
  const fakeForm: any = {
    control: {},
    formState: { errors: {} },
    setError: vi.fn(),
    clearErrors: vi.fn(),
    getValues: vi.fn(),
  }

  return render(
    <MantineProvider>
      <ModalsProvider>
        <RevokeTab
          lendingId="123"
          lendingData={lendingData}
          canEdit={true}
          onInvalidate={vi.fn()}
          withDownloadNotification={vi.fn()}
          form={fakeForm}
        />
      </ModalsProvider>
    </MantineProvider>,
  )
}

describe('RevokeTab - MASTER group permissions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFileRevoke = null
  })

  afterEach(() => {
    cleanup()
  })

  it('hides remove option from non-master users when distrato is signed', () => {
    setProfileGroup('PADRAO')

    renderComponent({
      documentRevoke: 20,
      revokeSignedDate: '2026-09-02',
    })

    expect(screen.getByText('Visualizar Distrato Assinado')).toBeInTheDocument()
    expect(screen.queryByText('Remover Distrato')).not.toBeInTheDocument()
  })

  it('shows remove button to MASTER users when distrato is signed', () => {
    setProfileGroup('MASTER')

    renderComponent({
      documentRevoke: 20,
      revokeSignedDate: '2026-09-02',
    })

    expect(screen.getByText('Visualizar Distrato Assinado')).toBeInTheDocument()
    expect(screen.getByText('Remover Distrato')).toBeInTheDocument()
  })

  it('opens confirmation modal when MASTER clicks Remover Distrato', async () => {
    setProfileGroup('MASTER')

    renderComponent({
      documentRevoke: 20,
      revokeSignedDate: '2026-09-02',
    })

    const removeButton = screen.getByText('Remover Distrato')
    fireEvent.click(removeButton)

    expect(
      await screen.findByText('Confirmar Remoção do Distrato'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Deseja realmente remover o distrato assinado deste comodato? O arquivo será excluído com SoftDelete e o status retornará para distrato pendente.',
      ),
    ).toBeInTheDocument()
  })

  it('opens confirmation modal when MASTER submits replacement distrato file', async () => {
    setProfileGroup('MASTER')
    mockFileRevoke = new File(['dummy'], 'novo_distrato.pdf', {
      type: 'application/pdf',
    })

    renderComponent({
      documentRevoke: 20,
      revokeSignedDate: '2026-09-02',
    })

    const submitButton = screen.getByText('Confirmar envio')
    fireEvent.click(submitButton)

    expect(
      await screen.findByText('Confirmar Substituição de Arquivo'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Já existe um distrato assinado cadastrado. Deseja substituí-lo pelo novo arquivo? O arquivo anterior será substituído.',
      ),
    ).toBeInTheDocument()
  })
})
