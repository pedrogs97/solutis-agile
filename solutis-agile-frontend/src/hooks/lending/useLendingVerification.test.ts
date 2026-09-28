import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { describe, expect, it, vi } from 'vitest'

import { useLendingVerification } from './useLendingVerification'

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn((file: File) => `blob://mock/${file.name}`)

describe('useLendingVerification', () => {
  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    return ({ children }: { children: React.ReactNode }) => (
      React.createElement(QueryClientProvider, { client: queryClient }, children)
    )
  }

  it('accepts images by mime type and by file extension fallback', () => {
    const { result } = renderHook(
      () => {
        const form = useForm({ defaultValues: { assetId: '123' } })
        return useLendingVerification({ form })
      },
      { wrapper: createWrapper() },
    )

    const fileWithMime = new File(['content'], 'photo1.jpg', {
      type: 'image/jpeg',
    })
    const fileWithoutMime = new File(['content'], 'photo2.PNG', {
      type: '',
    })
    const nonImageFile = new File(['content'], 'doc.pdf', {
      type: 'application/pdf',
    })

    const fileList = [
      fileWithMime,
      fileWithoutMime,
      nonImageFile,
    ] as unknown as FileList

    act(() => {
      result.current.addVerificationImages(fileList)
    })

    expect(result.current.verificationImages).toHaveLength(2)
    expect(result.current.verificationImages[0].file.name).toBe('photo1.jpg')
    expect(result.current.verificationImages[1].file.name).toBe('photo2.PNG')
  })

  it('does not reset verification flow on initial assetType load', () => {
    const { result, rerender } = renderHook(
      ({ assetType }) => {
        const form = useForm({ defaultValues: { assetId: '123' } })
        const hook = useLendingVerification({ form })
        React.useEffect(() => {
          if (assetType) {
            hook.setAssetType(assetType)
          }
        }, [assetType])
        return hook
      },
      {
        wrapper: createWrapper(),
        initialProps: { assetType: '' },
      },
    )

    act(() => {
      result.current.setVerificationAnswers({
        typeId: '1',
        answered: [{ verificationId: 1, answer: 'Sim', observations: '' }],
      })
    })

    expect(result.current.verificationPayload).not.toBeNull()

    // Transition from '' to 'Notebook' should NOT wipe out answers
    rerender({ assetType: 'Notebook' })
    expect(result.current.verificationPayload).not.toBeNull()
  })
})
