import { MantineProvider } from '@mantine/core'
import { ModalsProvider } from '@mantine/modals'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useProfileStore } from '@/store/persisted/useProfileStore'

import ContractTab from './contract-tab'

const mockOnUploadSignedContract = vi.fn()
const mockOnDeleteContractDocument = vi.fn()
const mockOnDownloadContract = vi.fn()
const mockOnRecreateContract = vi.fn()
const mockOnDownloadVerification = vi.fn()

let mockFile: File | null = null

vi.mock('@/hooks/lending/useContractTab', () => ({
  useContractTab: () => ({
    file: mockFile,
    setFile: vi.fn(),
    clearFile: vi.fn(),
    resetRef: vi.fn(),
    isSubmitting: false,
    onDownloadContract: mockOnDownloadContract,
    onRecreateContract: mockOnRecreateContract,
    onUploadSignedContract: mockOnUploadSignedContract,
    onDeleteContractDocument: mockOnDeleteContractDocument,
    onDownloadVerification: mockOnDownloadVerification,
  }),
}))

vi.mock('@/hooks/useThemeColors', () => ({
  useThemeColors: () => ({
    getSecondaryTextColor: () => '#666',
  }),
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
  return render(
    <MantineProvider>
      <ModalsProvider>
        <ContractTab
          variant="edit"
          lendingId="123"
          lendingData={lendingData}
          canEdit={true}
          onInvalidate={vi.fn()}
          withDownloadNotification={vi.fn()}
          form={{} as any}
        />
      </ModalsProvider>
    </MantineProvider>,
  )
}

describe('ContractTab - MASTER group permissions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFile = null
  })

  afterEach(() => {
    cleanup()
  })

  it('hides remove and replacement options from non-master users when contract is signed', () => {
    setProfileGroup('PADRAO')

    renderComponent({
      signedDate: '2026-09-01',
      document: 10,
    })

    expect(screen.getByText('Visualizar Contrato Assinado')).toBeTruthy()
    expect(screen.queryByText('Remover Contrato')).toBeNull()
    expect(screen.queryByText('Substituir Contrato Assinado')).toBeNull()
  })

  it('shows remove button and replace upload section to MASTER users when contract is signed', () => {
    setProfileGroup('MASTER')

    renderComponent({
      signedDate: '2026-09-01',
      document: 10,
    })

    expect(screen.getByText('Visualizar Contrato Assinado')).toBeTruthy()
    expect(screen.getByText('Remover Contrato')).toBeTruthy()
    expect(screen.getByText('Substituir Contrato Assinado')).toBeTruthy()
  })

  it('opens confirmation modal when MASTER user clicks Remover Contrato', async () => {
    setProfileGroup('MASTER')

    renderComponent({
      signedDate: '2026-09-01',
      document: 10,
    })

    const removeButton = screen.getByText('Remover Contrato')
    fireEvent.click(removeButton)

    expect(
      await screen.findByText('Confirmar Remoção do Contrato'),
    ).toBeTruthy()
    expect(
      screen.getByText(
        'Deseja realmente remover o contrato assinado deste comodato? O arquivo será excluído com SoftDelete e o status retornará para pendente.',
      ),
    ).toBeTruthy()
  })

  it('opens confirmation modal when MASTER user submits a replacement file', async () => {
    setProfileGroup('MASTER')
    mockFile = new File(['dummy'], 'novo_contrato.pdf', {
      type: 'application/pdf',
    })

    renderComponent({
      signedDate: '2026-09-01',
      document: 10,
    })

    const submitButton = screen.getByText('Confirmar envio')
    fireEvent.click(submitButton)

    expect(
      await screen.findByText('Confirmar Substituição de Arquivo'),
    ).toBeTruthy()
    expect(
      screen.getByText(
        'Já existe um contrato assinado cadastrado. Deseja substituí-lo pelo novo arquivo? O arquivo anterior será substituído.',
      ),
    ).toBeTruthy()
  })
})
