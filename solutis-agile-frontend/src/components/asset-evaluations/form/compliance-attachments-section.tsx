'use client'

import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Checkbox,
  FileButton,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { FileText, Paperclip, Trash2, Upload } from 'lucide-react'

import type { AssetEvaluationAttachment } from '@/types/AssetEvaluation'

interface ComplianceAttachmentsSectionProps {
  attachments?: AssetEvaluationAttachment[]
  pendingUploads?: { file: File; checklistKey?: string }[]
  onAddPendingUpload?: (file: File, checklistKey?: string) => void
  onRemovePendingUpload?: (index: number) => void
  readOnly?: boolean
}

const CHECKLIST_ITEMS = [
  { key: 'foto-antes-depois', label: 'Fotografias (antes e após desmontagem)' },
  { key: 'etiqueta-patrimonial', label: 'Etiqueta patrimonial legível' },
  { key: 'numero-serie', label: 'Foto do Nº de série do fabricante' },
  { key: 'nota-fiscal', label: 'Nota fiscal ou documento de origem' },
  { key: 'ordem-servico', label: 'Ordem de serviço / diagnóstico de assistência' },
  { key: 'laudo-tecnico', label: 'Laudo técnico de irrecuperabilidade' },
  { key: 'certificado-destinacao', label: 'Certificado de destinação final / Reciclagem' },
  { key: 'registro-pesagem', label: 'Comprovante / Registro de pesagem' },
]

export function ComplianceAttachmentsSection({
  attachments = [],
  pendingUploads = [],
  onAddPendingUpload,
  onRemovePendingUpload,
  readOnly = false,
}: Readonly<ComplianceAttachmentsSectionProps>) {
  const totalCount = attachments.length + pendingUploads.length

  return (
    <Card shadow="xs" radius="md" p="lg" withBorder>
      <Group justify="space-between" mb="md">
        <Group>
          <ThemeIcon size="lg" radius="md" color="blue" variant="light">
            <Paperclip size={20} />
          </ThemeIcon>
          <div>
            <Title order={4}>6. Conformidade & Evidências Obrigatórias</Title>
            <Text size="xs" c="dimmed">
              Documentos comprobatórios, fotos e laudos de auditoria
            </Text>
          </div>
        </Group>

        <Badge color={totalCount > 0 ? 'blue' : 'gray'} size="lg">
          {totalCount} anexo(s)
        </Badge>
      </Group>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        {CHECKLIST_ITEMS.map((item) => {
          const itemAttachments = attachments.filter(
            (a) => a.checklist_key === item.key
          )
          const itemPending = pendingUploads.filter(
            (p) => p.checklistKey === item.key
          )
          const hasFiles = itemAttachments.length > 0 || itemPending.length > 0

          return (
            <Paper key={item.key} p="sm" radius="md" withBorder bg="var(--mantine-color-gray-0)">
              <Group justify="space-between">
                <Checkbox
                  label={item.label}
                  checked={hasFiles}
                  readOnly
                  color="teal"
                />

                {!readOnly && onAddPendingUpload && (
                  <FileButton
                    onChange={(file) => {
                      if (file) onAddPendingUpload(file, item.key)
                    }}
                    accept="image/*,application/pdf"
                  >
                    {(props) => (
                      <Button
                        {...props}
                        size="xs"
                        variant="subtle"
                        leftSection={<Upload size={14} />}
                      >
                        Anexar
                      </Button>
                    )}
                  </FileButton>
                )}
              </Group>

              {/* Lista de anexos existentes do item */}
              {hasFiles && (
                <Stack gap={4} mt="xs">
                  {itemAttachments.map((att) => (
                    <Group key={att.id} justify="space-between" p={4}>
                      <Group gap={6}>
                        <FileText size={14} color="gray" />
                        <Text size="xs" truncate maw={240}>
                          {att.file_name}
                        </Text>
                      </Group>
                      <Badge size="xs" color="teal">
                        Salvo
                      </Badge>
                    </Group>
                  ))}

                  {itemPending.map((p, idx) => (
                    <Group key={idx} justify="space-between" p={4}>
                      <Group gap={6}>
                        <FileText size={14} color="blue" />
                        <Text size="xs" truncate maw={240}>
                          {p.file.name}
                        </Text>
                      </Group>
                      <Group gap={4}>
                        <Badge size="xs" color="blue">
                          Pendente
                        </Badge>
                        {onRemovePendingUpload && (
                          <ActionIcon
                            size="xs"
                            color="red"
                            variant="subtle"
                            onClick={() => onRemovePendingUpload(idx)}
                          >
                            <Trash2 size={12} />
                          </ActionIcon>
                        )}
                      </Group>
                    </Group>
                  ))}
                </Stack>
              )}
            </Paper>
          )
        })}
      </SimpleGrid>
    </Card>
  )
}
