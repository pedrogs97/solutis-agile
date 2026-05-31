import { Button, Group, rem, Stack, Text } from '@mantine/core'
import { Dropzone } from '@mantine/dropzone'
import { File, Upload, X } from 'lucide-react'
import { useState } from 'react'

interface FileUploadProps {
  label: string
  description?: string
  helper?: string
  value: File | null
  onChange: (file: File | null) => void
  accept?: string[]
  maxSize?: number // in bytes
}

function FileUpload({
  label,
  description,
  helper,
  value,
  onChange,
  accept = [],
  maxSize = 5 * 1024 * 1024, // 5MB default
}: FileUploadProps) {
  const [error, setError] = useState<string | null>(null)

  const handleDrop = (files: File[]) => {
    if (files.length > 0) {
      setError(null)
      onChange(files[0])
    }
  }

  const handleReject = (rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0]
      if (rejection.errors[0]?.code === 'file-too-large') {
        setError(
          `Arquivo muito grande. Tamanho máximo: ${maxSize / (1024 * 1024)}MB`,
        )
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        setError('Tipo de arquivo não permitido')
      } else {
        setError('Erro ao carregar arquivo')
      }
    }
  }

  const handleRemove = () => {
    onChange(null)
    setError(null)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <Stack gap="xs">
      <div>
        <Text size="sm" fw={500} mb={4}>
          {label}
        </Text>
        {description && (
          <Text size="sm" c="dimmed">
            {description}
          </Text>
        )}
      </div>

      {!value ? (
        <Dropzone
          onDrop={handleDrop}
          onReject={handleReject}
          maxSize={maxSize}
          accept={accept}
          multiple={false}
          maw={600}
        >
          <Group
            justify="center"
            gap="md"
            mih={80}
            style={{ pointerEvents: 'none' }}
          >
            <Dropzone.Accept>
              <Upload
                style={{
                  width: rem(32),
                  height: rem(32),
                  color: 'var(--mantine-color-blue-6)',
                }}
                strokeWidth={1.5}
              />
            </Dropzone.Accept>
            <Dropzone.Reject>
              <X
                style={{
                  width: rem(32),
                  height: rem(32),
                  color: 'var(--mantine-color-red-6)',
                }}
                strokeWidth={1.5}
              />
            </Dropzone.Reject>
            <Dropzone.Idle>
              <Upload
                style={{
                  width: rem(32),
                  height: rem(32),
                  color: 'var(--mantine-color-dimmed)',
                }}
                strokeWidth={1.5}
              />
            </Dropzone.Idle>

            <div>
              <Text size="sm" inline>
                Arraste o arquivo aqui ou clique para selecionar
              </Text>
              {helper && (
                <Text size="xs" c="dimmed" inline mt={4}>
                  {helper}
                </Text>
              )}
            </div>
          </Group>
        </Dropzone>
      ) : (
        <Group
          justify="space-between"
          p="md"
          style={{
            border: '1px solid var(--mantine-color-gray-3)',
            borderRadius: 'var(--mantine-radius-sm)',
          }}
          maw={600}
        >
          <Group gap="sm">
            <File size={24} color="var(--mantine-color-blue-6)" />
            <div>
              <Text size="sm" fw={500}>
                {value.name}
              </Text>
              <Text size="xs" c="dimmed">
                {formatFileSize(value.size)}
              </Text>
            </div>
          </Group>
          <Button variant="subtle" color="red" size="xs" onClick={handleRemove}>
            Remover
          </Button>
        </Group>
      )}

      {error && (
        <Text size="sm" c="red">
          {error}
        </Text>
      )}
    </Stack>
  )
}

export default FileUpload
