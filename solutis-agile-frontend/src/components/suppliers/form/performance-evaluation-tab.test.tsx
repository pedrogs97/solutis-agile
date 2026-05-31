import { MantineProvider } from '@mantine/core'
import { ModalsProvider } from '@mantine/modals'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import { useProfileStore } from '@/store/persisted/useProfileStore'

import { PerformanceEvaluationTab } from './performance-evaluation-tab'

const mockUseEvaluationCriteria = vi.fn()
const mockUseSupplierEvaluations = vi.fn()
const mockUseSupplierEvaluationDetail = vi.fn()
const mockUseCreateSupplierEvaluation = vi.fn()
const mockUseUpdateSupplierEvaluation = vi.fn()
const mockUseDeleteSupplierEvaluation = vi.fn()

vi.mock('@/hooks/evaluation/useEvaluations', () => ({
  useEvaluationCriteria: (...args: unknown[]) =>
    mockUseEvaluationCriteria(...args),
  useSupplierEvaluations: (...args: unknown[]) =>
    mockUseSupplierEvaluations(...args),
  useSupplierEvaluationDetail: (...args: unknown[]) =>
    mockUseSupplierEvaluationDetail(...args),
  useCreateSupplierEvaluation: (...args: unknown[]) =>
    mockUseCreateSupplierEvaluation(...args),
  useUpdateSupplierEvaluation: (...args: unknown[]) =>
    mockUseUpdateSupplierEvaluation(...args),
  useDeleteSupplierEvaluation: (...args: unknown[]) =>
    mockUseDeleteSupplierEvaluation(...args),
}))

const PERFORMANCE_TEST_TIMEOUT_MS = 15_000

const setProfileGroup = (group: string) => {
  useProfileStore.setState({
    profile: {
      group,
      email: 'tester@solutis.com.br',
      full_name: 'Tester',
      access_token: 'token',
      refresh_token: 'refresh',
      token_type: 'Bearer',
      expires_in: 3600,
      permissions: [],
    },
  })
}

const renderTab = () =>
  render(
    <MantineProvider>
      <ModalsProvider>
        <PerformanceEvaluationTab supplierId={1} />
      </ModalsProvider>
    </MantineProvider>,
  )

describe('PerformanceEvaluationTab', () => {
  let createMutateSpy: ReturnType<typeof vi.fn>
  let updateMutateSpy: ReturnType<typeof vi.fn>
  let deleteMutateSpy: ReturnType<typeof vi.fn>

  const clickNewEvaluationButton = () => {
    const buttons = screen.getAllByRole('button', { name: 'Nova Avaliação' })
    fireEvent.click(buttons[0]!)
  }

  const selectPeriodNumber = async (optionLabel: string) => {
    const periodInput = screen.getByPlaceholderText('Selecione o período')
    fireEvent.focus(periodInput)
    fireEvent.click(periodInput)
    const option = await screen.findByRole('option', { name: optionLabel })
    fireEvent.click(option)
  }

  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })

    class ResizeObserverMock {
      observe() {}
      unobserve() {}
      disconnect() {}
    }

    vi.stubGlobal('ResizeObserver', ResizeObserverMock)
  })

  beforeEach(() => {
    vi.clearAllMocks()
    setProfileGroup('MASTER')
    createMutateSpy = vi.fn()
    updateMutateSpy = vi.fn()
    deleteMutateSpy = vi.fn()

    mockUseEvaluationCriteria.mockReturnValue({
      data: [
        {
          id: 1,
          name: 'Qualidade',
          description: 'Critério de qualidade',
          weight: '1.00',
          order: 1,
        },
      ],
    })
    mockUseSupplierEvaluations.mockReturnValue({
      data: {
        results: [
          {
            id: 55,
            evaluationYear: 2026,
            periodType: 'QUADRIMESTER',
            periodNumber: 1,
            periodLabel: '1º Quadrimestre',
            evaluationDate: '2026-04-14',
            finalScore: '80.00',
            evaluatorName: 'João',
            comments: 'ok',
          },
        ],
        count: 1,
      },
      isLoading: false,
    })
    mockUseSupplierEvaluationDetail.mockReturnValue({
      data: {
        id: 55,
        evaluationYear: 2026,
        periodType: 'QUADRIMESTER',
        periodNumber: 1,
        periodLabel: '1º Quadrimestre',
        evaluationDate: '2026-04-14',
        finalScore: '80.00',
        evaluatorName: 'João',
        comments: 'ok',
        criterionScores: [
          {
            id: 1,
            criterion: {
              id: 1,
              name: 'Qualidade',
              description: 'Critério de qualidade',
              weight: '1.00',
              order: 1,
            },
            score: '60.00',
            comments: '',
          },
        ],
      },
      isFetching: false,
    })
    mockUseCreateSupplierEvaluation.mockReturnValue({
      mutate: createMutateSpy,
      isPending: false,
    })
    mockUseUpdateSupplierEvaluation.mockReturnValue({
      mutate: updateMutateSpy,
      isPending: false,
    })
    mockUseDeleteSupplierEvaluation.mockReturnValue({
      mutate: deleteMutateSpy,
      isPending: false,
    })
  })

  afterEach(() => {
    cleanup()
  })

  it(
    'shows navigation between list and add with percentual notation',
    async () => {
      renderTab()

      expect(
        screen.getByText('Histórico e relatórios de avaliação de desempenho'),
      ).toBeTruthy()
      expect(screen.getByText('80,00%')).toBeTruthy()
      expect(screen.queryByText('/5')).toBeNull()
      expect(
        screen.queryByRole('button', { name: 'Voltar para listagem' }),
      ).toBeNull()
      clickNewEvaluationButton()

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Voltar para listagem' }),
        ).toBeTruthy()
        expect(screen.getByText('0,00%')).toBeTruthy()
      })
    },
    PERFORMANCE_TEST_TIMEOUT_MS,
  )

  it(
    'shows view, edit, and delete buttons in table row actions',
    () => {
      renderTab()

      const rowButtons = screen
        .getAllByRole('button')
        .filter((btn) => btn.closest('td'))
      expect(rowButtons.length).toBeGreaterThanOrEqual(3)
    },
    PERFORMANCE_TEST_TIMEOUT_MS,
  )

  it(
    'returns to list view when canceling add form',
    async () => {
      renderTab()

      clickNewEvaluationButton()

      await waitFor(() => {
        expect(screen.getByText('Critérios de Avaliação')).toBeTruthy()
      })

      fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

      await waitFor(() => {
        expect(
          screen.getByText('Histórico e relatórios de avaliação de desempenho'),
        ).toBeTruthy()
        expect(
          screen.queryByRole('button', { name: 'Voltar para listagem' }),
        ).toBeNull()
      })
      expect(screen.queryByText('Critérios de Avaliação')).toBeNull()
    },
    PERFORMANCE_TEST_TIMEOUT_MS,
  )

  it(
    'returns to list after successful save (create)',
    async () => {
      createMutateSpy.mockImplementation((_payload, options) => {
        options?.onSuccess?.({}, {} as never, undefined)
      })

      renderTab()

      clickNewEvaluationButton()
      await selectPeriodNumber('1º Quadrimestre')
      fireEvent.change(screen.getByPlaceholderText('Nome do avaliador'), {
        target: { value: 'Maria' },
      })
      fireEvent.click(screen.getByRole('button', { name: 'Salvar Avaliação' }))

      await waitFor(() => {
        expect(createMutateSpy).toHaveBeenCalled()
        expect(
          screen.getByText('Histórico e relatórios de avaliação de desempenho'),
        ).toBeTruthy()
        expect(
          screen.queryByRole('button', { name: 'Voltar para listagem' }),
        ).toBeNull()
      })
    },
    PERFORMANCE_TEST_TIMEOUT_MS,
  )

  it(
    'allows non-master users to add but not edit or delete evaluations',
    async () => {
      setProfileGroup('ANALISTA')
      renderTab()

      const rowButtons = screen
        .getAllByRole('button')
        .filter((btn) => btn.closest('td'))
      expect(rowButtons).toHaveLength(1)

      clickNewEvaluationButton()
      await waitFor(() => {
        expect(screen.getByText('Nova Avaliação')).toBeTruthy()
        expect(screen.getByText('Critérios de Avaliação')).toBeTruthy()
      })
    },
    PERFORMANCE_TEST_TIMEOUT_MS,
  )

  it(
    'allows master users to confirm delete without password',
    async () => {
      renderTab()

      const rowButtons = screen
        .getAllByRole('button')
        .filter((btn) => btn.closest('td'))
      fireEvent.click(rowButtons[rowButtons.length - 1]!)

      await waitFor(() => {
        expect(screen.getByText('Excluir avaliação')).toBeTruthy()
      })

      fireEvent.click(
        screen.getByRole('button', { name: 'Confirmar exclusão' }),
      )

      await waitFor(() => {
        expect(deleteMutateSpy).toHaveBeenCalledWith(55)
      })
      expect(screen.queryByText('Autenticação Requerida')).toBeNull()
    },
    PERFORMANCE_TEST_TIMEOUT_MS,
  )

  it(
    'opens edit form when clicking edit button',
    async () => {
      renderTab()

      const rowButtons = screen
        .getAllByRole('button')
        .filter((btn) => btn.closest('td'))

      fireEvent.click(rowButtons[1]!)

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Voltar para listagem' }),
        ).toBeTruthy()
        expect(screen.getByText('Editar Avaliação')).toBeTruthy()
      })
    },
    PERFORMANCE_TEST_TIMEOUT_MS,
  )

  it(
    'saves edit directly without opening password modal',
    async () => {
      updateMutateSpy.mockImplementation((_payload, options) => {
        options?.onSuccess?.()
      })

      renderTab()

      const rowButtons = screen
        .getAllByRole('button')
        .filter((btn) => btn.closest('td'))
      fireEvent.click(rowButtons[1]!)

      await waitFor(() => {
        expect(screen.getByText('Editar Avaliação')).toBeTruthy()
      })

      fireEvent.click(screen.getByRole('button', { name: 'Salvar Avaliação' }))

      await waitFor(() => {
        expect(updateMutateSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 55,
            data: expect.objectContaining({
              supplier: 1,
              evaluatorName: 'João',
            }),
          }),
          expect.any(Object),
        )
      })
      expect(screen.queryByText('Autenticação Requerida')).toBeNull()
    },
    PERFORMANCE_TEST_TIMEOUT_MS,
  )
})
