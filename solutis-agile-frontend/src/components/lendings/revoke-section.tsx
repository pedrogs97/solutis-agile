// components/lendings/contract-sections.tsx
'use client'

import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  Divider,
  Group,
  Stack,
  Stepper,
  Text,
  Title,
  Tooltip,
} from '@mantine/core'
import { Check, FileDown, FileX2, RotateCcw } from 'lucide-react'
import type { MutableRefObject } from 'react'

import { FileUploadSection } from '@/components/lendings/file-upload-section'
import { WitnessSelection } from '@/components/lendings/witness-selection'
import { useThemeColors } from '@/hooks/useThemeColors'

// ---- Types ---------------------------------------------------------------

export type RevokeSectionProps = {
  lendingData: {
    signedDate?: string | null
    documentRevoke?: string | null
    revokeSignedDate?: string | null
  } | null
  canEdit: boolean
  isSubmitting: boolean
  fileRevoke: File | null
  setFileRevoke: (file: File | null) => void
  clearRevokeFile: () => void
  resetRevokeRef?: MutableRefObject<() => void> | null
  onTerminateLendingContract: () => void
  onDownloadRevokeLendingContract: () => void
  onRecreateLendingContract: (kind?: 'revoke') => void
  fetchWitnessesOptions?: (
    search: string,
  ) => Promise<Array<{ label: string; value: string }>>
}

// ---- Helpers -------------------------------------------------------------
const formatBadgeDate = (value?: string | null) => (value ? value : '')

export function RevokeSection(props: RevokeSectionProps) {
  const {
    lendingData,
    canEdit,
    isSubmitting,
    fileRevoke,
    setFileRevoke,
    clearRevokeFile,
    resetRevokeRef,
    onTerminateLendingContract,
    onDownloadRevokeLendingContract,
    onRecreateLendingContract,
    fetchWitnessesOptions,
  } = props

  const { getSecondaryTextColor } = useThemeColors()

  if (!lendingData?.signedDate) return null // Mostrar somente após contrato assinado

  const hasRevokeDoc = Boolean(lendingData?.documentRevoke)
  const isRevokeSigned = Boolean(lendingData?.revokeSignedDate)

  // Stepper states: 0 (seleção/confirmar), 1 (doc gerado), 2 (upload), 3 (concluído)
  let step = 0
  if (hasRevokeDoc) step = 1
  if (fileRevoke) step = 2 // feedback visual de upload pronto
  if (isRevokeSigned) step = 3

  return (
    <Card withBorder radius="lg" p="md">
      <Group justify="space-between" align="center">
        <Group>
          <Title order={4}>Distrato</Title>
          <Badge
            color={isRevokeSigned ? 'green' : hasRevokeDoc ? 'blue' : 'yellow'}
            variant="light"
          >
            {isRevokeSigned
              ? `Assinado em ${formatBadgeDate(lendingData?.revokeSignedDate)}`
              : hasRevokeDoc
                ? 'Documento gerado'
                : 'Pendente'}
          </Badge>
        </Group>
        <Group gap="xs">
          <Tooltip label="Recriar Distrato">
            <ActionIcon
              variant="light"
              aria-label="Recriar Distrato"
              onClick={() => onRecreateLendingContract('revoke')}
              disabled={isRevokeSigned || !canEdit || isSubmitting}
            >
              <RotateCcw size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Visualizar Distrato">
            <ActionIcon
              variant="light"
              aria-label="Visualizar Distrato"
              onClick={onDownloadRevokeLendingContract}
              disabled={!hasRevokeDoc || isSubmitting}
            >
              <FileDown size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      <Divider my="sm" />

      <Alert variant="light" color="red" mb="md">
        <Text size="sm">
          Para efetuar o distrato do contrato de comodato, selecione as
          Testemunhas, confirme e, em seguida, carregue o documento assinado.
        </Text>
      </Alert>

      <Stepper active={step} size="sm" allowNextStepsSelect={false}>
        <Stepper.Step label="Testemunhas" description="Selecione e confirme">
          {!hasRevokeDoc && (
            <Stack>
              <WitnessSelection
                fetcher={fetchWitnessesOptions}
                witness1Name="witnessesRevokeId.0"
                witness2Name="witnessesRevokeId.1"
              />
              <Group>
                <Button
                  type="button"
                  radius="md"
                  color="red"
                  size="xs"
                  onClick={onTerminateLendingContract}
                  disabled={hasRevokeDoc || !canEdit || isSubmitting}
                  loading={isSubmitting}
                >
                  <FileX2 size={16} />
                  &nbsp;Confirmar Distrato
                </Button>
              </Group>
            </Stack>
          )}
        </Stepper.Step>

        <Stepper.Step label="Documento" description="Visualize o distrato">
          <Group>
            <Button
              type="button"
              variant="outline"
              color="red"
              radius="md"
              size="xs"
              onClick={onDownloadRevokeLendingContract}
              disabled={!hasRevokeDoc || isSubmitting}
            >
              <FileDown size={16} />
              &nbsp;Visualizar Distrato
            </Button>
            <Button
              type="button"
              color="gray"
              radius="md"
              size="xs"
              onClick={() => onRecreateLendingContract('revoke')}
              disabled={isRevokeSigned || !canEdit || isSubmitting}
            >
              <RotateCcw size={16} />
              &nbsp;Recriar Distrato
            </Button>
          </Group>
        </Stepper.Step>

        <Stepper.Step label="Upload" description="Envie o PDF assinado">
          <Stack>
            <FileUploadSection
              title="Distrato"
              description="Carregue o distrato assinado (PDF até 5MB)"
              file={fileRevoke}
              onFileChange={setFileRevoke}
              onClearFile={clearRevokeFile}
              resetRef={resetRevokeRef as any}
              disabled={!hasRevokeDoc || !canEdit || isSubmitting}
            />
            <Text size="xs" fs="italic" c="red">
              Somente arquivos PDF com no máximo 5MB
            </Text>
            {fileRevoke && <Text size="sm">{fileRevoke.name}</Text>}
          </Stack>
        </Stepper.Step>

        <Stepper.Completed>
          <Group align="center" gap="xs">
            <Check size={18} />
            <Text size="sm" c={getSecondaryTextColor()}>
              Distrato concluído. Assinado em {lendingData?.revokeSignedDate}
            </Text>
          </Group>
        </Stepper.Completed>
      </Stepper>
    </Card>
  )
}
