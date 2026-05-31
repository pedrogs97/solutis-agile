'use client'

import { Box, Group, rem, Text } from '@mantine/core'
import {
  Dropzone,
  type FileRejection,
  MS_EXCEL_MIME_TYPE,
} from '@mantine/dropzone'
import { notifications } from '@mantine/notifications'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { SheetIcon, Upload, X } from 'lucide-react'
import { useState } from 'react'

import FormSkeleton from '@/components/common/skeletons/form-skeleton'
import { ServerError } from '@/components/server-error'
import { importAssets } from '@/services/api/asset'

export const Route = createFileRoute('/_dashboard/assets/import/')({
  errorComponent: () => <ServerError />,
  pendingComponent: () => <FormSkeleton />,
  component: ImportAssets,
})

function ImportAssets() {
  const [errorMessages, setErrorMessages] = useState<string[] | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const onDrop = async (files: File[]) => {
    setLoading(true)
    setErrorMessages(null)
    const response = await importAssets(files[0])
    setLoading(false)
    if (response?.message === 'Arquivo enviado com sucesso.') {
      notifications.show({
        title: 'Sucesso',
        message: 'Arquivo enviado com sucesso.',
        color: 'blue',
      })
      navigate({ to: '/assets' })
    } else {
      setErrorMessages(
        response.error?.response?.data?.error
          ? [response.error?.response?.data?.error]
          : ['Erro ao importar o arquivo'],
      )
    }
  }

  const onReject = (files: FileRejection[]) => {
    const errors = files.map((file) => file.errors).flat()
    const messages = errors.map((error) => {
      if (error.code === 'file-invalid-type') {
        return 'Formato de arquivo inválido. Por favor, envie um arquivo .csv ou .xlsx'
      }

      if (error.code === 'file-too-large') {
        return 'O arquivo é muito grande. O tamanho máximo é de 5MB'
      }

      return 'Erro ao enviar o arquivo'
    })
    setErrorMessages(messages)
  }

  return (
    <Box maw={400} m="auto">
      <Text size="xl" mb={10}>
        Importar Ativos
      </Text>
      <Dropzone
        onDrop={onDrop}
        onReject={onReject}
        loading={loading}
        maxSize={5 * 1024 ** 2}
        maxFiles={1}
        accept={MS_EXCEL_MIME_TYPE}
      >
        <Group
          justify="center"
          gap="xl"
          mih={220}
          style={{ pointerEvents: 'none' }}
        >
          <Dropzone.Accept>
            <Upload
              style={{
                width: rem(52),
                height: rem(52),
                color: 'var(--mantine-color-blue-6)',
              }}
              strokeWidth={1.5}
            />
          </Dropzone.Accept>
          <Dropzone.Reject>
            <X
              style={{
                width: rem(52),
                height: rem(52),
                color: 'var(--mantine-color-red-6)',
              }}
              strokeWidth={1.5}
            />
          </Dropzone.Reject>
          <Dropzone.Idle>
            <SheetIcon
              style={{
                width: rem(52),
                height: rem(52),
                color: 'var(--mantine-color-dimmed)',
              }}
            />
          </Dropzone.Idle>

          <div>
            <Text size="lg" inline>
              Arraste e solte o arquivo aqui, ou clique para selecionar
            </Text>
            <Text size="sm" c="dimmed" inline mt={7}>
              Formatos suportados: .csv e .xlsx
            </Text>
          </div>
        </Group>
      </Dropzone>
      {errorMessages && (
        <Group mt={10} gap="sm">
          {errorMessages.map((message, index) => (
            <Text key={index} c="red" size="sm">
              {message}
            </Text>
          ))}
        </Group>
      )}
    </Box>
  )
}
