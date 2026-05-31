import { Box, Card, Center, Flex, Text, Timeline } from '@mantine/core'

import { useThemeColors } from '@/hooks/useThemeColors'
import { type Lending } from '@/types/Lending'
import {
  getLendingBadgeFromStatus,
  getLendingColorFromStatus,
  getLendingIconFromStatus,
} from '@/utils/getStatuses'

import ModalDetailsContract from './modal/contract-details'

const getSignedDate = (history: any) => {
  if (history.revokeSignedDate) return history.revokeSignedDate
  if (history.signedDate) return history.signedDate
  return '-'
}

interface TimelineContractsProps {
  opened: boolean
  close: () => void
  onDownloadDocument: Function
  contractHistory: any
  contractDetails: Lending | null
  open: () => void
  setContractDetails: Function
  canViewContracts: boolean
}

export default function TimelineContracts({
  opened,
  open,
  close,
  onDownloadDocument,
  contractHistory,
  contractDetails,
  setContractDetails,
  canViewContracts,
}: Readonly<TimelineContractsProps>) {
  const { getSecondaryTextColor } = useThemeColors()
  return (
    <>
      <ModalDetailsContract
        opened={opened}
        close={close}
        contractDetails={contractDetails}
        onDownloadDocument={onDownloadDocument}
      />
      <Text size="lg" fw={700} c={getSecondaryTextColor()}>
        Últimos Contratos
      </Text>
      <Center>
        {canViewContracts && (
          <Timeline
            bulletSize={40}
            lineWidth={2}
            active={contractHistory?.length}
          >
            {contractHistory?.map((contract: any) => (
              <Timeline.Item
                key={contract.id}
                bullet={getLendingIconFromStatus(contract.status)}
                color={getLendingColorFromStatus(contract.status)}
                title={
                  <Flex align="center">
                    <Text tt="uppercase" fw={700} size="sm">
                      Data de Assinatura: {getSignedDate(contract)}
                    </Text>
                    &nbsp;&nbsp;{getLendingBadgeFromStatus(contract.status)}
                    <Text fw={700} tt="uppercase" size="sm">
                      {contract.status || 'Não informado'}
                    </Text>
                  </Flex>
                }
              >
                <Card
                  shadow="sm"
                  padding="lg"
                  radius="md"
                  withBorder
                  miw={600}
                  style={{
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    open()
                    setContractDetails(contract)
                  }}
                >
                  <Flex justify="space-between">
                    <Text fw={700} tt="uppercase">
                      COMODATO #{contract.number || '-'}
                    </Text>
                    <Text fw={700}></Text>
                  </Flex>
                  <Flex justify="space-between" mt={10}>
                    <Box>
                      <Text c="dimmed" size="sm">
                        Tipo do Ativo
                      </Text>
                      <Text>{contract.asset?.assetType}</Text>
                    </Box>
                    <Flex direction="column" align="flex-end">
                      <Text c="dimmed" size="sm">
                        Centro de Custo
                      </Text>
                      <Text>
                        {contract.costCenter?.code} -{' '}
                        {contract.costCenter?.name}
                      </Text>
                    </Flex>
                  </Flex>
                  <Flex justify="space-between" mt={10}>
                    <Box>
                      <Text c="dimmed" size="sm">
                        Registro Patrimonial
                      </Text>
                      <Text>{contract.asset?.registerNumber}</Text>
                    </Box>
                    <Flex direction="column" align="flex-end">
                      <Text c="dimmed" size="sm">
                        GLPI
                      </Text>
                      <Text fw={700}>#{contract.glpiNumber}</Text>
                    </Flex>
                  </Flex>
                </Card>
              </Timeline.Item>
            ))}
          </Timeline>
        )}
        {contractHistory &&
        contractHistory.length === 0 &&
        !canViewContracts ? (
          <Text>
            Não foram encontrados resultados de histórico de contratos
          </Text>
        ) : null}
      </Center>
    </>
  )
}
