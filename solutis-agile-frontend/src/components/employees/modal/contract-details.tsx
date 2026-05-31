import { Button, Flex, Grid, Modal, Text } from '@mantine/core'
import { DownloadCloud, FileDown } from 'lucide-react'

import { type Lending } from '@/types/Lending'

import { LendingModalHeader } from './lending-modal-header'

interface ModalContractDetailsProps {
  opened: boolean
  close: () => void
  contractDetails: Lending | null
  onDownloadDocument: Function
}

export default function ModalContractDetails({
  opened,
  close,
  contractDetails,
  onDownloadDocument,
}: Readonly<ModalContractDetailsProps>) {
  return (
    <Modal
      centered
      radius={'lg'}
      size="lg"
      opened={opened}
      onClose={close}
      title={
        <LendingModalHeader
          title="Comodato"
          identifier={contractDetails?.number}
          status={contractDetails?.status ?? null}
        />
      }
    >
      <Grid>
        <Grid.Col span={{ base: 12, xs: 4 }}>
          <Text c="dimmed" size="sm">
            Tipo do Ativo
          </Text>
          <Text>{contractDetails?.asset?.assetType}</Text>
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 4 }}>
          <Text c="dimmed" size="sm">
            Lotação
          </Text>
          <Text>{contractDetails?.workload?.name}</Text>
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 4 }}>
          <Flex direction="column" align="flex-end">
            <Text c="dimmed" size="sm">
              Centro de Custo
            </Text>
            <Text>
              {contractDetails?.costCenter?.code} -{' '}
              {contractDetails?.costCenter?.name}
            </Text>
          </Flex>
        </Grid.Col>
      </Grid>
      <Grid>
        <Grid.Col span={{ base: 12, xs: 4 }}>
          <Text c="dimmed" size="sm">
            Data de Assinatura
          </Text>
          <Text>{contractDetails?.signedDate?.toString() ?? '-'}</Text>
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 4 }}>
          <Text c="dimmed" size="sm">
            Origem
          </Text>
          <Text>{contractDetails?.location}</Text>
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
                disabled={!contractDetails?.documentRevoke}
                onClick={() => {
                  if (!contractDetails?.documentRevoke) return
                  onDownloadDocument(
                    contractDetails?.documentRevoke?.toString(),
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
                disabled={!contractDetails?.document}
                onClick={() => {
                  if (!contractDetails?.document) return
                  onDownloadDocument(contractDetails?.document?.toString())
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
