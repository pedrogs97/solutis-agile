import {
  Alert,
  Box,
  Button,
  Flex,
  Grid,
  Group,
  Stack,
  Text,
} from '@mantine/core'
import { Check, FileDown, FileX2 } from 'lucide-react'
import type { MutableRefObject } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { FormProvider, type UseFormReturn, useWatch } from 'react-hook-form'

import { FileUploadSection } from '@/components/lendings/file-upload-section'
import { WitnessSelection } from '@/components/lendings/witness-selection'
import { useThemeColors } from '@/hooks/useThemeColors'
import { fetchEmployeeSelect } from '@/services/api/employee'

interface TermRevokeTabProps {
  termData?: {
    documentRevoke?: string | null
    revokeSignedDate?: string | null
  } | null
  canEdit: boolean
  fileRevoke: File | null
  onFileChange: (file: File | null) => void
  onClearFile: () => void
  resetRef: MutableRefObject<(() => void) | null>
  onConfirmDistrato: () => void
  onDownloadDistrato: () => void
  onConfirmUpload: () => void
  isSubmitting: boolean
  principalSigner: string
  employeeSigner: string
  form: UseFormReturn<any>
}

export default function RevokeTab({
  termData,
  canEdit,
  fileRevoke,
  onFileChange,
  onClearFile,
  resetRef,
  onConfirmDistrato,
  onDownloadDistrato,
  onConfirmUpload,
  isSubmitting,
  principalSigner,
  employeeSigner,
  form,
}: Readonly<TermRevokeTabProps>) {
  const { getSecondaryTextColor } = useThemeColors()

  const hasDistrato = Boolean(termData?.documentRevoke)
  const isDistratoSigned = Boolean(termData?.revokeSignedDate)
  const [witnessesErrorMessage, setWitnessesErrorMessage] = useState<
    string | null
  >(null)

  const witnessesRevokeId = useWatch({
    control: form.control,
    name: 'witnessesRevokeId' as const,
  })
  const selectedWitnessesCount = Array.isArray(witnessesRevokeId)
    ? witnessesRevokeId.filter(
        (id: string) => typeof id === 'string' && id.trim() !== '',
      ).length
    : 0
  const canConfirmDistrato =
    selectedWitnessesCount === 2 &&
    Boolean(principalSigner.trim()) &&
    Boolean(employeeSigner.trim()) &&
    !isSubmitting &&
    canEdit

  const fetchWitnessesOptions = useCallback(async (query: string) => {
    return await fetchEmployeeSelect(query)
  }, [])

  useEffect(() => {
    if (selectedWitnessesCount === 2 && witnessesErrorMessage) {
      setWitnessesErrorMessage(null)
      form.clearErrors('witnessesRevokeId')
    }
  }, [selectedWitnessesCount, witnessesErrorMessage, form])

  const fieldError =
    (
      form.formState.errors?.witnessesRevokeId as
        | { message?: string }
        | undefined
    )?.message ?? null
  const displayedWitnessError = witnessesErrorMessage ?? fieldError

  const handleConfirmDistrato = () => {
    const witnessIds = Array.isArray(witnessesRevokeId)
      ? witnessesRevokeId.filter(
          (id: string) => typeof id === 'string' && id.trim() !== '',
        )
      : []

    if (witnessIds.length < 2) {
      const errorMessage = 'Necessário selecionar 2 testemunhas'
      setWitnessesErrorMessage(errorMessage)
      form.setError('witnessesRevokeId', {
        type: 'manual',
        message: errorMessage,
      } as any)
      return
    }

    setWitnessesErrorMessage(null)
    form.clearErrors('witnessesRevokeId')
    onConfirmDistrato()
  }

  return (
    <FormProvider {...form}>
      <Stack gap="md">
        <Alert variant="light" color="orange">
          <Text size="sm">
            Para efetuar o distrato do termo de responsabilidade, selecione as
            testemunhas, confirme e, em seguida, carregue o documento assinado.
          </Text>
        </Alert>

        {!hasDistrato && (
          <Stack gap="sm">
            <Grid>
              <WitnessSelection
                fetcher={fetchWitnessesOptions}
                witness1Name="witnessesRevokeId.0"
                witness2Name="witnessesRevokeId.1"
                readOnly={!canEdit}
              />
            </Grid>
            {displayedWitnessError && (
              <Text size="xs" c="red">
                {displayedWitnessError}
              </Text>
            )}
          </Stack>
        )}

        {!hasDistrato ? (
          <Box style={{ width: 'fit-content' }}>
            <Button
              type="button"
              radius="md"
              color="red"
              size="sm"
              onClick={handleConfirmDistrato}
              disabled={!canConfirmDistrato}
              loading={isSubmitting}
            >
              <FileX2 size={16} />
              &nbsp; Confirmar Distrato
            </Button>
          </Box>
        ) : (
          <>
            <FileUploadSection
              title="Distrato Assinado"
              description="Carregue o distrato assinado (PDF até 5MB)"
              file={fileRevoke}
              onFileChange={onFileChange}
              onClearFile={onClearFile}
              resetRef={resetRef as any}
              disabled={!canEdit || isSubmitting || isDistratoSigned}
            />

            {fileRevoke && !isDistratoSigned && (
              <Group gap="sm" mt="md">
                <Button
                  type="button"
                  radius="md"
                  color="green"
                  size="sm"
                  onClick={onConfirmUpload}
                  loading={isSubmitting}
                >
                  <Check size={16} />
                  &nbsp; Confirmar envio
                </Button>
                <Text size="sm" c={getSecondaryTextColor()}>
                  {fileRevoke?.name}
                </Text>
              </Group>
            )}

            <Flex align="center" gap="md" mt="md">
              <Button
                type="button"
                variant="outline"
                color="red"
                radius="md"
                size="sm"
                onClick={onDownloadDistrato}
                disabled={!hasDistrato || isSubmitting}
              >
                <FileDown size={16} />
                &nbsp;{' '}
                {isDistratoSigned
                  ? 'Visualizar Distrato Assinado'
                  : 'Visualizar Distrato'}
              </Button>
              {isDistratoSigned && (
                <Box>
                  <Text size="xs" c={getSecondaryTextColor()}>
                    Status
                  </Text>
                  <Text size="sm" c="green" fw={600}>
                    <Check size={14} style={{ display: 'inline' }} /> Assinado
                    em {termData?.revokeSignedDate}
                  </Text>
                </Box>
              )}
            </Flex>
          </>
        )}
      </Stack>
    </FormProvider>
  )
}
