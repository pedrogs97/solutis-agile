import { Button, Flex, Grid, Modal, Text } from '@mantine/core'
import { DownloadCloud, FileDown } from 'lucide-react'

import { formatMoneyBRL } from '@/lib/utils'
import { type Term } from '@/types/Lending'

import { LendingModalHeader } from './lending-modal-header'

interface ModalTermDetailsProps {
  opened: boolean
  close: () => void
  termDetails: Term | null
  onDownloadDocument: Function
}

export default function ModalTermDetails({
  opened,
  close,
  termDetails,
  onDownloadDocument,
}: Readonly<ModalTermDetailsProps>) {
  return (
    <Modal
      centered
      radius={'lg'}
      size="lg"
      opened={opened}
      onClose={close}
      title={
        <LendingModalHeader
          title={termDetails?.type?.toString() ?? 'Termo'}
          identifier={termDetails?.number}
          status={termDetails?.status ?? null}
        />
      }
    >
      <Grid>
        <Grid.Col span={{ base: 12, xs: 4 }}>
          <Text c="dimmed" size="sm">
            Descrição
          </Text>
          <Text>{termDetails?.termItem?.description}</Text>
          {termDetails?.type === 'Fardamento' && (
            <>
              <Text c="dimmed" size="sm">
                Tamanho - {termDetails?.termItem?.size}
              </Text>
              <Text c="dimmed" size="sm">
                Quantidade - {termDetails?.termItem?.quantity}
              </Text>
              <Text c="dimmed" size="sm">
                Valor - {formatMoneyBRL(termDetails?.termItem?.value)}
              </Text>
            </>
          )}
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 4 }}>
          <Text c="dimmed" size="sm">
            Lotação
          </Text>
          <Text>
            {typeof termDetails?.workload === 'string'
              ? termDetails?.workload
              : termDetails?.workload?.name}
          </Text>
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 4 }}>
          <Flex direction="column" align="flex-end">
            <Text c="dimmed" size="sm">
              Centro de Custo
            </Text>
            <Text>
              {termDetails?.costCenter?.code} - {termDetails?.costCenter?.name}
            </Text>
          </Flex>
        </Grid.Col>
      </Grid>
      <Grid>
        <Grid.Col span={{ base: 12, xs: 4 }}>
          <Text c="dimmed" size="sm">
            Data de Assinatura
          </Text>
          <Text>{termDetails?.signedDate?.toString() ?? '-'}</Text>
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 4 }}>
          <Text c="dimmed" size="sm">
            Projeto
          </Text>
          <Text>{termDetails?.project}</Text>
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
                disabled={!termDetails?.documentRevoke}
                onClick={() => {
                  if (!termDetails?.documentRevoke) return
                  onDownloadDocument(termDetails?.documentRevoke?.toString())
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
                disabled={!termDetails?.document}
                onClick={() => {
                  if (!termDetails?.document) return
                  onDownloadDocument(termDetails?.document?.toString())
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
