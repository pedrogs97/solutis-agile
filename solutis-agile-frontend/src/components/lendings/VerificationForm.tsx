import {
  Button,
  Divider,
  Group,
  Paper,
  Radio,
  SimpleGrid,
  Stack,
  Stepper,
  Text,
  Title,
} from '@mantine/core'
import { LayoutList } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

import VerificationImagesUpload, {
  type VerificationPreviewImage,
} from './VerificationImagesUpload'

/**
 * VerificationForm (multi-step, no internal scroll)
 * - React 19, Mantine v8, React Hook Form (single useForm)
 * - 4 steps navigated via Voltar/Avançar; only current step is shown
 * - Each step shows just the question title + radio options
 * - Submits payload with observations: '' (not used)
 */

export type VerificationQuestion = {
  id: number
  question: string
  step: string // e.g. "1" | "2"
  category: string
  assetType: string
  options: string[]
}

export type AnswerItem = {
  verificationId: number
  answer: string
  observations: string
}

export type VerificationPayload = {
  lendingId?: number
  typeId?: string | number
  answered: AnswerItem[]
}

export type VerificationFormProps = {
  questions: VerificationQuestion[]
  onSubmit: (payload: VerificationPayload) => void | Promise<void>
  images: VerificationPreviewImage[]
  onAddImages: (files: FileList | null) => void
  onRemoveImage: (idx: number) => void
  defaultAnswered?: Partial<Record<number, { answer?: string }>>
  onOpenGuide?: () => void
  lendingId?: number
  typeId?: string | number
  isBusy?: boolean
}

const STEP_TITLES: Record<string, string> = {
  '1': 'Notebook aberto',
  '2': 'Parte lateral',
  '3': 'Parte inferior',
  '4': 'Fonte de Alimentação / Carregador',
}

function groupByStep(questions: VerificationQuestion[]) {
  const map = new Map<string, VerificationQuestion[]>()
  const sorted = [...questions].sort((a, b) => {
    const stepDiff = Number(a.step) - Number(b.step)
    if (stepDiff !== 0) return stepDiff
    return a.id - b.id
  })
  for (const question of sorted) {
    const stepQuestions = map.get(question.step) ?? []
    stepQuestions.push(question)
    map.set(question.step, stepQuestions)
  }
  return map
}

export default function VerificationForm({
  questions,
  onSubmit,
  images,
  onAddImages,
  onRemoveImage,
  defaultAnswered,
  onOpenGuide,
  lendingId,
  typeId,
  isBusy = false,
}: VerificationFormProps) {
  type FormValues = { answers: Record<string, { answer: string }> }

  const defaultValues: FormValues = useMemo(() => {
    const entries = questions.map(
      (question) =>
        [
          String(question.id),
          { answer: defaultAnswered?.[question.id]?.answer ?? '' },
        ] as const,
    )
    return { answers: Object.fromEntries(entries) }
  }, [questions, defaultAnswered])

  const {
    control,
    handleSubmit,
    trigger,
    getValues,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues,
    mode: 'onTouched',
    reValidateMode: 'onChange',
  })

  const stepsMap = useMemo(() => groupByStep(questions), [questions])
  const stepKeys = useMemo(
    () => Array.from(stepsMap.keys()).sort((a, b) => Number(a) - Number(b)),
    [stepsMap],
  )

  const [active, setActive] = useState(0)

  const currentStepId = stepKeys[active]
  const currentQuestions = stepsMap.get(currentStepId) ?? []

  const goNext = async () => {
    const fieldNames = currentQuestions.map(
      (question) => `answers.${question.id}.answer` as const,
    )
    const valid = await trigger(fieldNames, { shouldFocus: true })
    if (!valid) return
    setActive((value) => Math.min(value + 1, stepKeys.length - 1))
  }

  const goBack = () => setActive((value) => Math.max(0, value - 1))

  const onFinalSubmit = handleSubmit(async () => {
    const fieldNames = currentQuestions.map(
      (question) => `answers.${question.id}.answer` as const,
    )
    const valid = await trigger(fieldNames, { shouldFocus: true })
    if (!valid) return

    const values = getValues()
    const answered: AnswerItem[] = questions
      .map((question) => ({
        verificationId: question.id,
        answer: values.answers[String(question.id)]?.answer ?? '',
        observations: '',
      }))
      .filter((item) => item.answer !== '')

    const payload: VerificationPayload = {
      lendingId,
      typeId,
      answered,
    }

    await onSubmit(payload)
  })

  const disableActions = isBusy || isSubmitting

  return (
    <Paper withBorder p="lg" radius="lg">
      <Stack gap="md">
        <Stack gap="xs">
          <div>
            <Title order={3}>Verificação do equipamento</Title>
            <Text c="dimmed" size="sm">
              Carregue as imagens do ativo e responda às perguntas de cada
              etapa.
            </Text>
          </div>
          {onOpenGuide && (
            <Button
              size="xs"
              variant="subtle"
              leftSection={<LayoutList size={16} />}
              onClick={onOpenGuide}
              style={{ alignSelf: 'flex-start' }}
            >
              Visualizar guia
            </Button>
          )}
        </Stack>

        <VerificationImagesUpload
          images={images}
          addImages={onAddImages}
          removeImage={onRemoveImage}
          disabled={disableActions}
        />

        <Stepper active={active} allowNextStepsSelect={false} size="sm">
          {stepKeys.map((key) => (
            <Stepper.Step
              key={key}
              label={STEP_TITLES[key] ?? `Etapa ${key}`}
            />
          ))}
          <Stepper.Completed>Finalização</Stepper.Completed>
        </Stepper>

        <Divider
          label={STEP_TITLES[currentStepId] ?? `Etapa ${currentStepId}`}
          labelPosition="left"
        />

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {currentQuestions.map((question) => (
            <Stack key={question.id} gap={6}>
              <Text fw={600}>{question.question}</Text>
              <Controller
                name={`answers.${question.id}.answer` as const}
                control={control}
                rules={{ required: 'Selecione uma opção' }}
                render={({ field, fieldState }) => (
                  <Radio.Group
                    {...field}
                    value={field.value ?? ''}
                    error={fieldState.error?.message}
                  >
                    <Stack mt={4} gap={6}>
                      {question.options.map((option) => (
                        <Radio
                          key={option}
                          value={option}
                          label={option}
                          disabled={disableActions}
                        />
                      ))}
                    </Stack>
                  </Radio.Group>
                )}
              />
            </Stack>
          ))}
        </SimpleGrid>

        <Group justify="space-between" mt="md">
          <Button
            variant="light"
            onClick={goBack}
            disabled={active === 0 || disableActions}
          >
            Voltar
          </Button>
          {active < stepKeys.length - 1 ? (
            <Button onClick={goNext} disabled={disableActions}>
              Avançar
            </Button>
          ) : (
            <Button
              onClick={onFinalSubmit}
              loading={isSubmitting}
              disabled={disableActions}
            >
              Enviar verificação
            </Button>
          )}
        </Group>
      </Stack>
    </Paper>
  )
}
