import { MantineProvider } from '@mantine/core'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { createRef, type ReactNode } from 'react'
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  ResponsibilityMatrixTab,
  type ResponsibilityMatrixTabRef,
} from './responsibility-matrix-tab'

const MATRIX_STORAGE_KEY = 'form_draft_supplier_matrix'
const DRAFT_TEST_TIMEOUT_MS = 10_000

type MatrixApiDataShape = {
  contract_request_requesting_area?: string
}

const readMatrixDraft = () => {
  const raw = localStorage.getItem(MATRIX_STORAGE_KEY)
  return raw ? (JSON.parse(raw) as Record<string, unknown>) : null
}

const clickFirstResponsibilityOption = (title: string) => {
  const options = screen.getAllByTitle(title)
  fireEvent.click(options[0])
}

const renderWithMantine = (ui: ReactNode) => {
  return render(<MantineProvider>{ui}</MantineProvider>)
}

describe('ResponsibilityMatrixTab draft behavior', () => {
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
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  afterAll(() => {
    vi.restoreAllMocks()
  })

  it(
    'does not overwrite existing draft while decision is pending',
    async () => {
      const existingDraft = {
        contractRequestRequestingArea: 'A',
      }
      localStorage.setItem(MATRIX_STORAGE_KEY, JSON.stringify(existingDraft))

      renderWithMantine(
        <ResponsibilityMatrixTab mode="create" draftDecision="pending" />,
      )

      clickFirstResponsibilityOption('R')

      await waitFor(() => {
        expect(readMatrixDraft()).toEqual(existingDraft)
      })
    },
    DRAFT_TEST_TIMEOUT_MS,
  )

  it(
    'restores stored draft and keeps autosave enabled after restore decision',
    async () => {
      const existingDraft = {
        contractRequestRequestingArea: 'C',
      }
      localStorage.setItem(MATRIX_STORAGE_KEY, JSON.stringify(existingDraft))

      const ref = createRef<ResponsibilityMatrixTabRef>()

      renderWithMantine(
        <ResponsibilityMatrixTab
          ref={ref}
          mode="create"
          draftDecision="restore"
        />,
      )

      await waitFor(() => {
        const matrixApiData = ref.current?.getMatrixData(1) as
          | MatrixApiDataShape
          | undefined
        if (!matrixApiData) {
          throw new Error('matrixApiData should be defined')
        }
        expect(matrixApiData.contract_request_requesting_area).toBe('C')
      })

      clickFirstResponsibilityOption('I')

      await waitFor(() => {
        expect(readMatrixDraft()?.contractRequestRequestingArea).toBe('I')
      })
    },
    DRAFT_TEST_TIMEOUT_MS,
  )

  it(
    'allows fresh autosave after discard decision',
    async () => {
      const existingDraft = {
        contractRequestRequestingArea: 'A',
      }
      localStorage.setItem(MATRIX_STORAGE_KEY, JSON.stringify(existingDraft))

      const { rerender } = renderWithMantine(
        <ResponsibilityMatrixTab mode="create" draftDecision="pending" />,
      )

      localStorage.removeItem(MATRIX_STORAGE_KEY)
      rerender(
        <MantineProvider>
          <ResponsibilityMatrixTab mode="create" draftDecision="discard" />
        </MantineProvider>,
      )

      clickFirstResponsibilityOption('C')

      await waitFor(() => {
        expect(readMatrixDraft()?.contractRequestRequestingArea).toBe('C')
      })
    },
    DRAFT_TEST_TIMEOUT_MS,
  )

  it(
    'does not overwrite existing draft on beforeunload while decision is pending',
    async () => {
      const existingDraft = {
        contractRequestRequestingArea: 'A',
      }
      localStorage.setItem(MATRIX_STORAGE_KEY, JSON.stringify(existingDraft))

      renderWithMantine(
        <ResponsibilityMatrixTab mode="create" draftDecision="pending" />,
      )

      clickFirstResponsibilityOption('R')
      fireEvent(window, new Event('beforeunload'))

      await waitFor(() => {
        expect(readMatrixDraft()).toEqual(existingDraft)
      })
    },
    DRAFT_TEST_TIMEOUT_MS,
  )
})
