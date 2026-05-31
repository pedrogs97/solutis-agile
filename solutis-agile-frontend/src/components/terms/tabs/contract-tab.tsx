import { Box, Button, Flex, Group, Text } from '@mantine/core'
import { Check, FileDown } from 'lucide-react'
import type { MutableRefObject } from 'react'

import { FileUploadSection } from '@/components/lendings/file-upload-section'
import { useThemeColors } from '@/hooks/useThemeColors'

interface TermContractTabProps {
  termData?: {
    signedDate?: string | null
  } | null
  canEdit: boolean
  file: File | null
  onFileChange: (file: File | null) => void
  onClearFile: () => void
  resetRef: MutableRefObject<(() => void) | null>
  onDownloadContract: () => void
  onConfirmUpload: () => void
  isSubmitting: boolean
}

export default function ContractTab({
  termData,
  canEdit,
  file,
  onFileChange,
  onClearFile,
  resetRef,
  onDownloadContract,
  onConfirmUpload,
  isSubmitting,
}: Readonly<TermContractTabProps>) {
  const { getSecondaryTextColor } = useThemeColors()

  const isSigned = Boolean(termData?.signedDate)

  return (
    <Box>
      <Box mb="xl">
        <Text size="lg" fw={600} mb="xs">
          Gerenciamento do Contrato
        </Text>
        <Text size="sm" c={getSecondaryTextColor()} mb="md">
          {isSigned
            ? `Termo assinado em ${termData?.signedDate}`
            : 'Baixe o termo, colete as assinaturas e carregue o PDF assinado'}
        </Text>
      </Box>

      {!isSigned && (
        <>
          <Group gap="sm" mb="md">
            <Button
              type="button"
              variant="outline"
              radius="md"
              size="sm"
              onClick={onDownloadContract}
              disabled={isSubmitting}
            >
              <FileDown size={16} />
              &nbsp; Visualizar Termo
            </Button>
          </Group>

          <FileUploadSection
            title="Upload do Termo Assinado"
            description="Carregue o termo de responsabilidade assinado (PDF até 5MB)"
            file={file}
            onFileChange={onFileChange}
            onClearFile={onClearFile}
            resetRef={resetRef as any}
            disabled={!canEdit}
          />

          {file && (
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
                {file.name}
              </Text>
            </Group>
          )}
        </>
      )}

      {isSigned && (
        <Flex align="center" gap="md" mb="lg">
          <Button
            type="button"
            variant="outline"
            color="blue"
            radius="md"
            size="sm"
            onClick={onDownloadContract}
            disabled={isSubmitting}
          >
            <FileDown size={16} />
            &nbsp; Visualizar Termo Assinado
          </Button>
          <Box>
            <Text size="xs" c={getSecondaryTextColor()}>
              Status
            </Text>
            <Text size="sm" c="green" fw={600}>
              <Check size={14} style={{ display: 'inline' }} /> Assinado em{' '}
              {termData?.signedDate}
            </Text>
          </Box>
        </Flex>
      )}
    </Box>
  )
}
