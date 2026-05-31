import { Button, FileButton, Group, Text } from '@mantine/core'
import { UploadCloud } from 'lucide-react'
import type { RefObject } from 'react'

import { FILE_UPLOAD_CONFIG } from '@/constants/selectOptions'
import { useThemeColors } from '@/hooks/useThemeColors'

interface FileUploadSectionProps {
  title: string
  description: string
  file: File | null
  onFileChange: (file: File | null) => void
  onClearFile: () => void
  resetRef: RefObject<() => void>
  disabled?: boolean
  acceptedTypes?: string
  maxSizeMB?: number
}

export function FileUploadSection({
  title,
  description,
  file,
  onFileChange,
  onClearFile,
  resetRef,
  disabled = false,
  acceptedTypes = FILE_UPLOAD_CONFIG.ACCEPTED_TYPES,
  maxSizeMB = FILE_UPLOAD_CONFIG.MAX_FILE_SIZE / (1024 * 1024),
}: FileUploadSectionProps) {
  const { getSecondaryTextColor } = useThemeColors()

  return (
    <>
      <Text size="sm" c={getSecondaryTextColor()}>
        {title}
      </Text>
      <Text size="sm" fs="italic" c={getSecondaryTextColor()}>
        {description}
      </Text>
      <Group>
        <FileButton
          resetRef={resetRef}
          onChange={onFileChange}
          accept={acceptedTypes}
          disabled={disabled}
        >
          {(props) => (
            <Button
              {...props}
              size="xs"
              color="var(--mantine-color-text)"
              radius="md"
              type="button"
              disabled={disabled}
            >
              <UploadCloud size={16} />
              &nbsp;Carregar
            </Button>
          )}
        </FileButton>
        <Button
          disabled={!file || disabled}
          color="red"
          onClick={onClearFile}
          size="xs"
          radius="md"
          type="button"
        >
          Limpar
        </Button>
      </Group>
      <Text size="xs" fs="italic" c="red">
        Somente arquivos {acceptedTypes.toUpperCase().replace('.', '')} com no
        máximo {maxSizeMB}MB
      </Text>
      {file && (
        <Text size="sm" mt="sm">
          {file.name}
        </Text>
      )}
    </>
  )
}
