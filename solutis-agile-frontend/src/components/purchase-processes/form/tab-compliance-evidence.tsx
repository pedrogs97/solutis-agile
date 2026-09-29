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
  Title,
  Tooltip,
} from '@mantine/core'
import { Download, FileText, Paperclip, Trash2 } from 'lucide-react'

import { uid } from '@/hooks/purchase-process/usePurchaseProcessForm'
import type {
  ComplianceFile,
  ComplianceItem,
  PurchaseCompliance,
  PurchaseProcess,
} from '@/types/PurchaseProcess'

interface TabComplianceEvidenceProps {
  process: PurchaseProcess
  toggleComplianceCheck: (key: keyof PurchaseCompliance) => void
  addComplianceFile: (key: keyof PurchaseCompliance, file: ComplianceFile) => void
  removeComplianceFile: (key: keyof PurchaseCompliance, fileId: string) => void
  updateComplianceItem?: (key: keyof PurchaseCompliance, item: Partial<ComplianceItem>) => void
}

interface ComplianceCardConfig {
  key: keyof PurchaseCompliance
  title: string
  subtitle: string
}

const COMPLIANCE_ITEMS: ComplianceCardConfig[] = [
  {
    key: 'comprovacaoSolicitacao',
    title: 'Comprovação de Solicitação',
    subtitle: 'E-mail, chamado ou formulário interno que originou o pedido',
  },
  {
    key: 'autorizacaoCompra',
    title: 'Comprovação de Autorização da Compra',
    subtitle: 'Aprovação do gestor/alçada responsável',
  },
  {
    key: 'notaFiscal',
    title: 'Nota Fiscal',
    subtitle: 'Documento fiscal emitido pelo fornecedor escolhido',
  },
  {
    key: 'cotacoes',
    title: 'Cotações',
    subtitle: 'Propostas/orçamentos recebidos dos fornecedores',
  },
]

function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return ''
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function TabComplianceEvidence({
  process,
  toggleComplianceCheck,
  addComplianceFile,
  removeComplianceFile,
}: TabComplianceEvidenceProps) {
  const compliance = process.conformidade || {
    comprovacaoSolicitacao: { checked: false, arquivos: [] },
    autorizacaoCompra: { checked: false, arquivos: [] },
    notaFiscal: { checked: false, arquivos: [] },
    cotacoes: { checked: false, arquivos: [] },
  }

  // Contagem total de anexos
  const totalCount =
    (compliance.comprovacaoSolicitacao?.arquivos?.length || 0) +
    (compliance.autorizacaoCompra?.arquivos?.length || 0) +
    (compliance.notaFiscal?.arquivos?.length || 0) +
    (compliance.cotacoes?.arquivos?.length || 0)

  const handleFileUpload = (key: keyof PurchaseCompliance, file: File | null) => {
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      addComplianceFile(key, {
        id: uid('cf'),
        nome: file.name,
        tamanho: file.size,
        tipo: file.type,
        data: new Date().toISOString(),
        url: result,
      })
    }
    reader.readAsDataURL(file)
  }

  const handleDownload = (file: ComplianceFile) => {
    if (!file.url) return
    const link = document.createElement('a')
    link.href = file.url
    link.download = file.nome
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Card shadow="xs" radius="md" p="lg" withBorder>
      <Group justify="space-between" align="flex-start" mb="xs">
        <div>
          <Title order={4}>Conformidade & Evidências Obrigatórias</Title>
          <Text size="sm" c="dimmed" mt={4} maw={780}>
            Documentos comprobatórios do processo de compra — anexe os arquivos que hoje
            ficam salvos junto com o formulário físico no diretório de rede. Aceita PDF ou
            imagem (foto/scan); documentos do Word/Excel precisam ser convertidos para
            PDF antes de anexar.
          </Text>
        </div>

        <Badge
          color={totalCount > 0 ? 'blue' : 'gray'}
          size="lg"
          variant="light"
          radius="md"
        >
          {totalCount} anexo(s)
        </Badge>
      </Group>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md" mt="md">
        {COMPLIANCE_ITEMS.map((item) => {
          const itemData = compliance[item.key] || { checked: false, arquivos: [] }
          const arquivos = itemData.arquivos || []
          const hasFiles = arquivos.length > 0
          const isChecked = itemData.checked || hasFiles

          return (
            <Paper
              key={item.key}
              p="md"
              radius="md"
              withBorder
              bg="var(--mantine-color-gray-0)"
            >
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Checkbox
                  checked={isChecked}
                  onChange={() => toggleComplianceCheck(item.key)}
                  color="teal"
                  label={
                    <div>
                      <Text fw={600} size="sm">
                        {item.title}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {item.subtitle}
                      </Text>
                    </div>
                  }
                />

                <FileButton
                  onChange={(file) => handleFileUpload(item.key, file)}
                  accept="image/*,application/pdf"
                >
                  {(props) => (
                    <Button
                      {...props}
                      size="xs"
                      variant="subtle"
                      color="gray"
                      leftSection={<Paperclip size={14} />}
                    >
                      Anexar
                    </Button>
                  )}
                </FileButton>
              </Group>

              {/* Status ou lista de anexos */}
              {!hasFiles ? (
                <Text size="xs" c="dimmed" mt="xs" ml={32}>
                  Nenhum arquivo anexado ainda.
                </Text>
              ) : (
                <Stack gap={6} mt="xs" ml={32}>
                  {arquivos.map((arq) => (
                    <Paper
                      key={arq.id}
                      p="xs"
                      radius="sm"
                      withBorder
                      bg="var(--mantine-color-body)"
                    >
                      <Group justify="space-between" wrap="nowrap">
                        <Group gap="xs" wrap="nowrap" style={{ overflow: 'hidden' }}>
                          <FileText size={16} color="#495057" />
                          <div>
                            <Text size="xs" fw={500} truncate maw={220}>
                              {arq.nome}
                            </Text>
                            {arq.tamanho && (
                              <Text size="10px" c="dimmed">
                                {formatBytes(arq.tamanho)}
                              </Text>
                            )}
                          </div>
                        </Group>

                        <Group gap={4} wrap="nowrap">
                          {arq.url && (
                            <Tooltip label="Baixar arquivo">
                              <ActionIcon
                                size="sm"
                                variant="subtle"
                                color="blue"
                                onClick={() => handleDownload(arq)}
                              >
                                <Download size={14} />
                              </ActionIcon>
                            </Tooltip>
                          )}
                          <Tooltip label="Remover anexo">
                            <ActionIcon
                              size="sm"
                              variant="subtle"
                              color="red"
                              onClick={() => removeComplianceFile(item.key, arq.id)}
                            >
                              <Trash2 size={14} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Group>
                    </Paper>
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
