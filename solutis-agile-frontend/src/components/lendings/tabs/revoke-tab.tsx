import { Box, Button, Grid, Group, Stack, Text } from '@mantine/core'
import { modals } from '@mantine/modals'
import { Check, FileDown, FileX2, RotateCcw, Trash2, UploadCloud } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { FormProvider, type UseFormReturn, useWatch } from 'react-hook-form'

import { FileUploadSection } from '@/components/lendings/file-upload-section'
import { WitnessSelection } from '@/components/lendings/witness-selection'
import { useRevokeTab } from '@/hooks/lending/useRevokeTab'
import { useThemeColors } from '@/hooks/useThemeColors'
import { fetchEmployeeSelect } from '@/services/api/employee'
import { useProfileStore } from '@/store/persisted/useProfileStore'

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
    onDeleteRevokeDocument,
  } = useRevokeTab({
    lendingId,
    lendingData,
    onInvalidate,
    withDownloadNotification,
    form,
    onValidationError: handleWitnessValidation,
  })
  const { getSecondaryTextColor } = useThemeColors()
  const profile = useProfileStore((state: any) => state.profile)
  const isMasterUser = profile?.group?.toUpperCase() === 'MASTER'

  const hasDistrato = Boolean(lendingData?.documentRevoke)
  const isDistratoSigned = Boolean(lendingData?.revokeSignedDate)

  const handleConfirmDeleteRevoke = () => {
    modals.openConfirmModal({
      title: 'Confirmar Remoção do Distrato',
      children: (
        <Text size="sm">
          Deseja realmente remover o distrato assinado deste comodato? O arquivo será excluído com SoftDelete e o status retornará para distrato pendente.
        </Text>
      ),
      labels: { confirm: 'Remover', cancel: 'Cancelar' },
      confirmProps: { color: 'red' },
      onConfirm: () => {
        onDeleteRevokeDocument()
      },
    })
  }

  const handleUploadSignedRevoke = () => {
    if (isDistratoSigned) {
      modals.openConfirmModal({
        title: 'Confirmar Substituição de Arquivo',
        children: (
          <Text size="sm">
            Já existe um distrato assinado cadastrado. Deseja substituí-lo pelo novo arquivo? O arquivo anterior será substituído.
          </Text>
        ),
        labels: { confirm: 'Substituir arquivo', cancel: 'Cancelar' },
        confirmProps: { color: 'blue' },
        onConfirm: () => {
          onUploadSignedRevoke()
        },
      })
    } else {
      onUploadSignedRevoke()
    }
  }

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
              title={
                isDistratoSigned
                  ? 'Substituir Distrato Assinado'
                  : 'Distrato Assinado'
              }
              description={
                isDistratoSigned
                  ? 'Carregue o novo distrato assinado para substituir o anterior (PDF até 5MB)'
                  : 'Carregue o distrato assinado (PDF até 5MB)'
              }
              file={fileRevoke}
              onFileChange={setFileRevoke}
              onClearFile={clearRevokeFile}
              resetRef={resetRevokeRef as any}
              disabled={!canEdit || isSubmitting || (!isMasterUser && isDistratoSigned)}
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
                    onClick={handleUploadSignedRevoke}
                    disabled={!canEdit || isSubmitting}
                    loading={isSubmitting}
                  >
                    <UploadCloud size={16} />
                    &nbsp;Confirmar envio
                  </Button>
                )}
              </Group>
            )}

            {isDistratoSigned && isMasterUser && fileRevoke && (
              <Group gap="sm">
                <Button
                  type="button"
                  color="green"
                  radius="md"
                  size="sm"
                  onClick={handleUploadSignedRevoke}
                  disabled={!canEdit || isSubmitting}
                  loading={isSubmitting}
                >
                  <UploadCloud size={16} />
                  &nbsp;Confirmar envio
                </Button>
                <Text size="sm" c="dimmed">
                  {fileRevoke.name}
                </Text>
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
              {isDistratoSigned && isMasterUser && (
                <Button
                  type="button"
                  variant="outline"
                  color="red"
                  radius="md"
                  size="sm"
                  onClick={handleConfirmDeleteRevoke}
                  disabled={!canEdit || isSubmitting}
                  loading={isSubmitting}
                >
                  <Trash2 size={16} />
                  &nbsp;Remover Distrato
                </Button>
              )}
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
