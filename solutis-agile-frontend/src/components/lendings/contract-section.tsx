// components/lendings/contract-sections.tsx
'use client'

import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Flex,
  Group,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core'
import { FileDown, RotateCcw } from 'lucide-react'
import type { MutableRefObject } from 'react'

import { FileUploadSection } from '@/components/lendings/file-upload-section'
import { useThemeColors } from '@/hooks/useThemeColors'

// ---- Types ---------------------------------------------------------------
export type ContractSectionProps = {
  lendingData: {
    signedDate?: string | null
  } | null
  canEdit: boolean
  isSubmitting: boolean
  file: File | null
  setFile: (file: File | null) => void
  clearFile: () => void
  resetRef?: MutableRefObject<() => void> | null
  onDownloadLendingContract: () => void
  onRecreateLendingContract: (kind?: 'revoke') => void
  onDownloadVerification: () => void
}

// ---- Helpers -------------------------------------------------------------
const formatBadgeDate = (value?: string | null) => (value ? value : '')

// ---- UI Sections ---------------------------------------------------------
export function ContractSection(props: ContractSectionProps) {
  const {
    lendingData,
    canEdit,
    isSubmitting,
    file,
    setFile,
    clearFile,
    resetRef,
    onDownloadLendingContract,
    onRecreateLendingContract,
    onDownloadVerification,
  } = props

  const { getSecondaryTextColor } = useThemeColors()

  const isSigned = Boolean(lendingData?.signedDate)
  const canGenerate = !isSigned && canEdit && !isSubmitting
  const canDownloadSigned = isSigned && !isSubmitting

  return (
    <Card withBorder radius="lg" p="md">
      <Group justify="space-between" align="center">
        <Group>
          <Title order={4}>Contrato</Title>
          <Badge color={isSigned ? 'green' : 'yellow'} variant="light">
            {isSigned
              ? `Assinado em ${formatBadgeDate(lendingData?.signedDate)}`
              : 'Rascunho'}
          </Badge>
        </Group>
        <Group gap="xs">
          <Tooltip label="Visualizar Verificação">
            <ActionIcon
              variant="light"
              aria-label="Visualizar Verificação"
              onClick={onDownloadVerification}
              disabled={isSubmitting}
            >
              <FileDown size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip
            label={
              isSigned ? 'Recriar contrato (já assinado)' : 'Recriar contrato'
            }
          >
            <ActionIcon
              variant="light"
              aria-label="Recriar contrato"
              onClick={() => onRecreateLendingContract()}
              disabled={!canGenerate}
            >
              <RotateCcw size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Visualizar Contrato">
            <ActionIcon
              variant="light"
              aria-label="Visualizar Contrato"
              onClick={onDownloadLendingContract}
              disabled={!canGenerate}
            >
              <FileDown size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      <Divider my="sm" />

      <Stack gap="xs">
        <Text size="sm" c={getSecondaryTextColor()}>
          Faça o download, colete as assinaturas e carregue o PDF assinado.
          Tamanho máx.: 5MB.
        </Text>

        <Group wrap="wrap">
          <Button
            type="button"
            color="gray"
            radius="md"
            size="xs"
            onClick={onDownloadLendingContract}
            disabled={!canGenerate}
          >
            <FileDown size={16} />
            &nbsp;Visualizar Contrato
          </Button>
          <Button
            type="button"
            color="gray"
            radius="md"
            size="xs"
            onClick={() => onRecreateLendingContract()}
            disabled={!canGenerate}
          >
            <RotateCcw size={16} />
            &nbsp;Recriar Contrato
          </Button>
          <Button
            type="button"
            color="gray"
            radius="md"
            size="xs"
            onClick={onDownloadVerification}
            disabled={isSubmitting}
          >
            <FileDown size={16} />
            &nbsp;Visualizar Verificação
          </Button>
        </Group>

        <FileUploadSection
          title="Contrato"
          description="Clique abaixo para enviar o contrato de comodato assinado"
          file={file}
          onFileChange={setFile}
          onClearFile={clearFile}
          resetRef={resetRef as any}
          disabled={!canEdit || isSubmitting}
        />

        <Flex align="flex-start" gap="md">
          <Button
            type="button"
            variant="outline"
            radius="md"
            size="xs"
            onClick={onDownloadLendingContract}
            disabled={!canDownloadSigned}
          >
            <FileDown size={16} />
            &nbsp;Visualizar Contrato
          </Button>
          {isSigned && (
            <Box>
              <Text size="xs" c={getSecondaryTextColor()}>
                Assinado em
              </Text>
              <Text size="xs">{lendingData?.signedDate}</Text>
            </Box>
          )}
        </Flex>
      </Stack>
    </Card>
  )
}
