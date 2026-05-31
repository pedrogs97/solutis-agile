import { Button, Flex, Grid, Modal, Text } from '@mantine/core'
import { type UseMutateFunction } from '@tanstack/react-query'
import { DownloadCloud } from 'lucide-react'

import { Can } from '@/components/providers/ability'
import { type Asset } from '@/types/Asset'
import { type Invoice } from '@/types/Invoice'

interface ModalDetailInvoiceProps {
  invoiceDetail: Invoice | null
  opened: boolean
  close: () => void
  openConfirmDeleteModal: Function
  downloadInvoice: (id: string) => Promise<void>
  onDownloadDocument: UseMutateFunction<any, unknown, string, unknown>
}

export default function ModalDetailInvoice({
  invoiceDetail,
  opened,
  close,
  openConfirmDeleteModal,
  downloadInvoice,
  onDownloadDocument,
}: Readonly<ModalDetailInvoiceProps>) {
  return (
    <Modal
      opened={opened}
      onClose={close}
      centered
      radius={'lg'}
      size="lg"
      title={
        <Text fw={700} tt="uppercase">
          Visualizar Nota Fiscal
        </Text>
      }
    >
      <Grid my={15}>
        <Grid.Col span={{ base: 12, xs: 3 }}>
          <Text c="dimmed" size="sm">
            N° da Notal Fiscal
          </Text>
          <Text>{invoiceDetail?.number}</Text>
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 4 }}>
          <Text c="dimmed" size="sm">
            Nome do Arquivo
          </Text>
          <Text>{invoiceDetail?.file_name ?? 'Não informado'}</Text>
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 4 }}>
          <Text c="dimmed" size="sm">
            Arquivo
          </Text>
          <Button
            radius="md"
            color="var(--mantine-color-text)"
            onClick={() => {
              if (!invoiceDetail?.id) return
              onDownloadDocument(invoiceDetail?.id.toString() || '')
            }}
            disabled={!invoiceDetail?.file_name}
          >
            <DownloadCloud />
            &nbsp;Visualizar
          </Button>
        </Grid.Col>
      </Grid>
      <Grid my={15}>
        <Grid.Col span={{ base: 12, xs: 4 }}>
          <Text c="dimmed" size="sm">
            Valor Total
          </Text>
          <Text>R$ {invoiceDetail?.totalValue.toLocaleString()}</Text>
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 4 }}>
          <Text c="dimmed" size="sm">
            Quantidade Total
          </Text>
          <Text>{invoiceDetail?.totalAssets}</Text>
        </Grid.Col>
      </Grid>
      <Grid my={15}>
        <Grid.Col span={{ base: 12, xs: 4 }}>
          <Text c="dimmed" size="sm">
            Arquivo
          </Text>
          <Button
            radius="md"
            onClick={() => {
              downloadInvoice(invoiceDetail?.id?.toString() ?? '')
            }}
            disabled={!invoiceDetail?.file_name}
          >
            Visualizar
          </Button>
        </Grid.Col>
      </Grid>
      <Grid justify="space-between" my={15}>
        <Grid.Col span={{ base: 12, xs: 12 }}>
          <Text c="dimmed" size="sm">
            Ativos
          </Text>
          {invoiceDetail?.assets?.length === 0 && (
            <Text>Nenhum ativo vinculado</Text>
          )}
          {invoiceDetail?.assets?.map((asset: Asset) => (
            <Text key={asset.id} fw={700}>
              {asset.registerNumber} - {asset.serialNumber}
            </Text>
          ))}
        </Grid.Col>
      </Grid>
      <Flex mt={15} justify="space-between">
        <Button radius="md" onClick={() => close()} color="gray">
          Cancelar
        </Button>
        <Can I="delete" a="invoice">
          <Button
            radius="md"
            onClick={() => {
              openConfirmDeleteModal(invoiceDetail?.id?.toString() ?? '')
            }}
            color="red"
          >
            Excluir
          </Button>
        </Can>
      </Flex>
    </Modal>
  )
}
