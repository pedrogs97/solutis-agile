'use client'

import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { type UseFormReturn, useWatch } from 'react-hook-form'

import type {
  AnswerItem,
  VerificationPayload,
  VerificationQuestion,
} from '@/components/lendings/VerificationForm'
import { FILE_UPLOAD_CONFIG } from '@/constants/selectOptions'
import { fetchVerificationQuestions } from '@/services/api/lending-contract'
import { type Verification } from '@/types/Verification'

import type { FormDataLendingContract } from './types'

interface PreviewImage {
  url: string
  file: File
}

interface UseLendingVerificationParams {
  form: UseFormReturn<FormDataLendingContract>
  initialAnswers?: AnswerItem[]
}

const MAPPER_ASSET_TYPE = {
  NOTEBOOK: '1',
  DESKTOP: '2',
  MACBOOK: '14',
  'MAC MINI': '15',
}

function getMapperAssetType(assetType: string) {
  return MAPPER_ASSET_TYPE[assetType as keyof typeof MAPPER_ASSET_TYPE] ?? null
}

export function useLendingVerification({
  form,
  initialAnswers = [],
}: Readonly<UseLendingVerificationParams>) {
  const [verificationImages, setVerificationImages] = useState<PreviewImage[]>(
    [],
  )
  const [openLightBox, setOpenLightBox] = useState(false)
  const [activeTab, setActiveTab] = useState<string | null>('general-data')
  const [assetType, setAssetType] = useState<string | null>(null)
  const [formResetKey, setFormResetKey] = useState(0)
  const [verificationPayload, setVerificationPayload] =
    useState<VerificationPayload | null>(null)

  const assetId = useWatch({ control: form.control, name: 'assetId' })

  const hasVerification = useMemo(() => {
    return Boolean(assetId && assetId.trim() !== '')
  }, [assetId])

  const addVerificationImages = useCallback(
    (files: FileList | null) => {
      if (!files) return
      const MAX_IMAGES = FILE_UPLOAD_CONFIG.MAX_VERIFICATION_IMAGES
      const newImages: PreviewImage[] = []
      for (
        let index = 0;
        index < files.length &&
        verificationImages.length + newImages.length < MAX_IMAGES;
        index++
      ) {
        const file = files[index]
        if (file.type.startsWith('image/')) {
          newImages.push({ url: URL.createObjectURL(file), file })
        }
      }
      setVerificationImages((previous) =>
        [...previous, ...newImages].slice(0, MAX_IMAGES),
      )
    },
    [verificationImages],
  )

  const removeVerificationImage = useCallback((idx: number) => {
    setVerificationImages((previous) =>
      previous.filter((_, index) => index !== idx),
    )
  }, [])

  const normalizeQuestion = useCallback(
    (question: Verification): VerificationQuestion | null => {
      const options = Array.isArray(question.options)
        ? question.options
            .map((option) =>
              typeof option === 'string' ? option : (option?.name ?? ''),
            )
            .filter((option): option is string => option.length > 0)
        : []

      if (options.length === 0) {
        return null
      }

      const category =
        typeof question.category === 'string'
          ? question.category
          : (question.category?.name ?? '')

      const normalizedAssetType =
        typeof question.assetType === 'string'
          ? question.assetType
          : (question.assetType?.name ?? '')

      return {
        id: question.id,
        question: question.question,
        step: String(question.step ?? ''),
        category,
        assetType: normalizedAssetType,
        options,
      }
    },
    [],
  )

  const { data: verificationQuestions } = useQuery<Verification[]>({
    queryKey: ['fetchVerificationQuestions', assetType],
    queryFn: () =>
      fetchVerificationQuestions(getMapperAssetType(assetType ?? 'NOTEBOOK')),
    enabled: !!assetType,
  })

  const normalizedQuestions = useMemo(() => {
    if (!verificationQuestions || !assetType) return []

    return verificationQuestions
      .map(normalizeQuestion)
      .filter((question): question is VerificationQuestion => {
        return Boolean(question?.assetType === assetType)
      })
      .sort((a, b) => {
        const stepDiff = Number(a.step) - Number(b.step)
        if (stepDiff !== 0) return stepDiff
        return a.id - b.id
      })
  }, [assetType, normalizeQuestion, verificationQuestions])
  console.log(normalizedQuestions)
  const hasVerificationQuestions = useMemo(() => {
    return normalizedQuestions.length > 0
  }, [normalizedQuestions])

  const defaultAnswered = useMemo(() => {
    const source = verificationPayload?.answered ?? initialAnswers
    if (!source || source.length === 0) {
      return undefined
    }

    return source.reduce<Partial<Record<number, { answer?: string }>>>(
      (accumulator, item) => {
        accumulator[item.verificationId] = { answer: item.answer }
        return accumulator
      },
      {},
    )
  }, [initialAnswers, verificationPayload])

  const setVerificationAnswers = useCallback((payload: VerificationPayload) => {
    setVerificationPayload(payload)
  }, [])

  const resetVerificationFlow = useCallback(() => {
    setVerificationPayload(null)
    setVerificationImages([])
    setFormResetKey((value) => value + 1)
  }, [])

  const previousAssetTypeRef = useRef<string | null>(null)
  useEffect(() => {
    if (
      previousAssetTypeRef.current !== null &&
      previousAssetTypeRef.current !== assetType
    ) {
      resetVerificationFlow()
    }

    previousAssetTypeRef.current = assetType
  }, [assetType, resetVerificationFlow])

  const handleTabChange = useCallback(
    (tab: string | null) => {
      if (
        tab === 'general-data' &&
        Object.keys(form.formState.errors ?? {}).length > 0
      ) {
        return
      }
      setActiveTab(tab)
    },
    [form.formState.errors],
  )

  return {
    verificationImages,
    addVerificationImages,
    removeVerificationImage,
    openLightBox,
    setOpenLightBox,
    activeTab,
    setActiveTab,
    assetType,
    setAssetType,
    hasVerification,
    hasVerificationQuestions,
    handleTabChange,
    verificationQuestions: normalizedQuestions,
    defaultAnswered,
    setVerificationAnswers,
    verificationPayload,
    resetVerificationFlow,
    verificationFormKey: formResetKey,
  } as const
}
