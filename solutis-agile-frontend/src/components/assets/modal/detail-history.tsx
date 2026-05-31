'use client'

import { Button, Flex, Grid, Modal, Text } from '@mantine/core'
import { DownloadCloud, FileDown } from 'lucide-react'

import { type AssetHistory } from '@/types/Asset'
import { getLendingBadgeFromStatus } from '@/utils/getStatuses'

interface ModalDetailHistoryProps {
  opened: boolean
  close: () => void
  onDownloadDocument: Function
  contractHistoryToView: AssetHistory | null
}

export default function ModalDetailHistory({
  opened,
  close,
  contractHistoryToView,
  onDownloadDocument,
}: Readonly<ModalDetailHistoryProps>) {
  return (
    <Modal
      opened={opened}
      onClose={close}
      centered
      radius={'lg'}
      size="lg"
      title={
        <Flex align="center">
          <Text fw={700} tt="uppercase">
            {contractHistoryToView?.type?.toString()} | #
            {contractHistoryToView?.number ?? '-'} &nbsp;
          </Text>
          {getLendingBadgeFromStatus(contractHistoryToView?.status ?? '')}
          <Text fw={700} tt="uppercase">
            {contractHistoryToView?.status ?? 'Não informado'}
          </Text>
        </Flex>
      }
    >
      <Grid>
        <Grid.Col span={{ base: 12, xs: 4 }}>
          <Text c="dimmed" size="sm">
            Tipo do Ativo
          </Text>
          <Text>{contractHistoryToView?.asset}</Text>
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 4 }}>
          <Text c="dimmed" size="sm">
            Lotação
          </Text>
          <Text>{contractHistoryToView?.workload}</Text>
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 4 }}>
          <Flex direction="column" align="flex-end">
            <Text c="dimmed" size="sm">
              Centro de Custo
            </Text>
            <Text>
              {contractHistoryToView?.costCenter?.code} -{' '}
              {contractHistoryToView?.costCenter?.name}
            </Text>
          </Flex>
        </Grid.Col>
      </Grid>
      <Grid justify="space-between">
        <Grid.Col span={{ base: 12, xs: 4 }}>
          <Text c="dimmed" size="sm">
            Data de Assinatura
          </Text>
          <Text>{contractHistoryToView?.signedDate?.toString() ?? '-'}</Text>
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 4 }}>
          <Flex direction="column" align="flex-end">
            <Text c="dimmed" size="sm">
              Contrato
            </Text>

            <Flex>
              <Button
                type="button"
                variant="outline"
                color="red"
                radius="md"
                size="xs"
                disabled={!contractHistoryToView?.documentRevoke}
                onClick={() => {
                  if (!contractHistoryToView?.documentRevoke) return
                  onDownloadDocument(
                    contractHistoryToView?.documentRevoke?.toString(),
                  )
                }}
                mr={15}
              >
                <FileDown size={16} />
                &nbsp;Visualizar Distrato
              </Button>
              <Button
                ml={2}
                size="xs"
                color="var(--mantine-color-text)"
                radius="md"
                type="button"
                disabled={!contractHistoryToView?.document}
                onClick={() => {
                  if (!contractHistoryToView?.document) return
                  onDownloadDocument(
                    contractHistoryToView?.document?.toString(),
                  )
                }}
              >
                <DownloadCloud />
                &nbsp;Visualizar
              </Button>
            </Flex>
          </Flex>
        </Grid.Col>
      </Grid>
      <Flex direction={'row-reverse'} mt={15}>
        <Button radius="md" onClick={() => close()}>
          OK
        </Button>
      </Flex>
    </Modal>
  )
}
