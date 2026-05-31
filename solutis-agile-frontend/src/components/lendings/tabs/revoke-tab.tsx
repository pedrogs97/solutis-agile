import { Box, Button, Grid, Group, Stack, Text } from '@mantine/core'
import { Check, FileDown, FileX2, RotateCcw, UploadCloud } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { FormProvider, type UseFormReturn, useWatch } from 'react-hook-form'

import { FileUploadSection } from '@/components/lendings/file-upload-section'
import { WitnessSelection } from '@/components/lendings/witness-selection'
import { useRevokeTab } from '@/hooks/lending/useRevokeTab'
import { useThemeColors } from '@/hooks/useThemeColors'
import { fetchEmployeeSelect } from '@/services/api/employee'

interface RevokeTabProps {
  lendingId?: string
  lendingData: any
  canEdit: boolean
  onInvalidate: () => void
  withDownloadNotification: any
  onValidationError?: (error: string | null) => void
  form: UseFormReturn<any>
}

export default function RevokeTab({
  lendingId,
  lendingData,
  canEdit,
  onInvalidate,
  withDownloadNotification,
  onValidationError,
  form,
}: RevokeTabProps) {
  const [witnessesErrorMessage, setWitnessesErrorMessage] = useState<
    string | null
  >(null)

  const handleWitnessValidation = useCallback(
    (error: string | null) => {
      if (error) {
        form.setError('witnessesRevokeId', {
          type: 'manual',
          message: error,
        } as any)
      } else {
        form.clearErrors('witnessesRevokeId')
      }
      setWitnessesErrorMessage(error)
      onValidationError?.(error)
    },
    [form, onValidationError],
  )

  const {
    fileRevoke,
    setFileRevoke,
    clearRevokeFile,
    resetRevokeRef,
    isSubmitting,
    onTerminateContract,
    onDownloadRevokeContract,
    onRecreateRevokeContract,
    onUploadSignedRevoke,
  } = useRevokeTab({
    lendingId,
    lendingData,
    onInvalidate,
    withDownloadNotification,
    form,
    onValidationError: handleWitnessValidation,
  })
  const { getSecondaryTextColor } = useThemeColors()

  const hasDistrato = Boolean(lendingData?.documentRevoke)
  const isDistratoSigned = Boolean(lendingData?.revokeSignedDate)

  const witnessesRevokeId = useWatch({
    control: form.control,
    name: 'witnessesRevokeId' as const,
  })
  const principalSigner = useWatch({
    control: form.control,
    name: 'principalSigner',
  })
  const employeeSigner = useWatch({
    control: form.control,
    name: 'employeeSigner',
  })

  const selectedWitnessesCount = Array.isArray(witnessesRevokeId)
    ? witnessesRevokeId.filter(
        (id: string) => typeof id === 'string' && id.trim() !== '',
      ).length
    : 0
  const canGenerate = selectedWitnessesCount === 2

  const fetchWitnessesOptions = useCallback(async (query: string) => {
    return await fetchEmployeeSelect(query)
  }, [])

  useEffect(() => {
    if (selectedWitnessesCount === 2 && witnessesErrorMessage) {
      handleWitnessValidation(null)
    }
  }, [selectedWitnessesCount, witnessesErrorMessage, handleWitnessValidation])

  const fieldError =
    (
      form.formState.errors?.witnessesRevokeId as
        | { message?: string }
        | undefined
    )?.message ?? null
  const displayedWitnessError = witnessesErrorMessage ?? fieldError

  return (
    <FormProvider {...form}>
      <Stack gap="md">
        <Box>
          <Text size="lg" fw={600} mb="xs">
            Gerenciamento do Distrato
          </Text>
          <Text size="sm" c={getSecondaryTextColor()} mb="md">
            Para efetuar o distrato do contrato de comodato, selecione as
            testemunhas, confirme e depois carregue o documento assinado.
          </Text>
        </Box>

        <Stack gap="md">
          <Grid>
            <WitnessSelection
              fetcher={fetchWitnessesOptions}
              witness1Name="witnessesRevokeId.0"
              witness2Name="witnessesRevokeId.1"
              readOnly={!canEdit || hasDistrato}
              witness1Value={
                lendingData?.witnesses?.slice(-2)[0]?.employee?.fullName ?? ''
              }
              witness2Value={
                lendingData?.witnesses?.slice(-1)[0]?.employee?.fullName ?? ''
              }
            />
          </Grid>
          {!hasDistrato && displayedWitnessError && (
            <Text size="xs" c="red">
              {displayedWitnessError}
            </Text>
          )}
        </Stack>

        {!hasDistrato ? (
          <Group gap="sm">
            <Button
              type="button"
              color="red"
              radius="md"
              size="sm"
              onClick={onTerminateContract}
              disabled={
                !canEdit ||
                isSubmitting ||
                !canGenerate ||
                !principalSigner?.trim() ||
                !employeeSigner?.trim()
              }
              loading={isSubmitting}
            >
              <FileX2 size={16} />
              &nbsp;Confirmar Distrato
            </Button>
          </Group>
        ) : (
          <>
            <FileUploadSection
              title="Distrato Assinado"
              description="Carregue o distrato assinado (PDF até 5MB)"
              file={fileRevoke}
              onFileChange={setFileRevoke}
              onClearFile={clearRevokeFile}
              resetRef={resetRevokeRef as any}
              disabled={!canEdit || isSubmitting || isDistratoSigned}
            />

            {!isDistratoSigned && (
              <Group gap="sm">
                <Button
                  type="button"
                  color="gray"
                  radius="md"
                  size="sm"
                  onClick={onRecreateRevokeContract}
                  disabled={!canEdit || isSubmitting}
                  loading={isSubmitting}
                >
                  <RotateCcw size={16} />
                  &nbsp;Recriar Distrato
                </Button>
                {fileRevoke && (
                  <Button
                    type="button"
                    color="green"
                    radius="md"
                    size="sm"
                    onClick={onUploadSignedRevoke}
                    disabled={!canEdit || isSubmitting}
                    loading={isSubmitting}
                  >
                    <UploadCloud size={16} />
                    &nbsp;Confirmar envio
                  </Button>
                )}
              </Group>
            )}

            <Group gap="sm">
              <Button
                type="button"
                variant="outline"
                color="red"
                radius="md"
                size="sm"
                onClick={onDownloadRevokeContract}
                disabled={!canEdit || isSubmitting}
                loading={isSubmitting}
              >
                <FileDown size={16} />
                &nbsp;
                {isDistratoSigned
                  ? 'Visualizar Distrato Assinado'
                  : 'Visualizar Distrato'}
              </Button>
              {isDistratoSigned && (
                <Box>
                  <Text size="xs" c={getSecondaryTextColor()}>
                    Status
                  </Text>
                  <Group gap="xs">
                    <Check size={16} color="green" />
                    <Text size="sm" c="green">
                      Assinado em {lendingData?.revokeSignedDate}
                    </Text>
                  </Group>
                </Box>
              )}
            </Group>
          </>
        )}
      </Stack>
    </FormProvider>
  )
}
