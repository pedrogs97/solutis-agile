'use client'

import {
  Box,
  Button,
  Card,
  Center,
  Flex,
  Grid,
  Loader,
  Text,
  Timeline,
} from '@mantine/core'

import useContractHistory from '@/hooks/asset/useContractHistory'
import { useThemeColors } from '@/hooks/useThemeColors'
import { type AssetHistory } from '@/types/Asset'
import {
  getLendingBadgeFromStatus,
  getLendingColorFromStatus,
  getLendingIconFromStatus,
} from '@/utils/getStatuses'

import { ModalDetailHistory } from '../modal'

interface TimelineContractsProps {
  assetId: string
  canViewLendings: boolean
}

export default function TimelineContracts({
  assetId,
  canViewLendings,
}: Readonly<TimelineContractsProps>) {
  const {
    historyLending,
    isPendingHistoryLending,
    isErrorHistoryLending,
    isOpenHistory,
    closeHistory,
    openHistory,
    contractHistoryToView,
    setContractHistoryToView,
    onDownloadDocument,
    downloadAssetTimeline,
  } = useContractHistory(assetId)
  const { getSecondaryTextColor } = useThemeColors()

  const timelineItems =
    historyLending?.map((history: AssetHistory) => (
      <Timeline.Item
        key={history.id}
        bullet={getLendingIconFromStatus(history.status ?? '')}
        color={getLendingColorFromStatus(history.status ?? '')}
        title={
          <Flex align="center" wrap="wrap">
            <Text tt="uppercase" fw={700} size="sm">
              Data de Assinatura: {history.signedDate ?? '-'}
            </Text>
            &nbsp;&nbsp;
            {getLendingBadgeFromStatus(history.status ?? '')}
            <Text fw={700} tt="uppercase" size="sm">
              {history.status ?? 'Distrato Realizado'}
            </Text>
          </Flex>
        }
      >
        <Card
          shadow="sm"
          padding="lg"
          radius="md"
          withBorder
          miw="60%"
          style={{ cursor: 'pointer' }}
          onClick={() => {
            openHistory()
            setContractHistoryToView(history)
          }}
        >
          <Flex justify="space-between">
            <Text fw={700} tt="uppercase">
              {history.type} #{history.number ?? '-'}
            </Text>
            <Text fw={700}></Text>
          </Flex>
          <Flex justify="space-between" mt={10}>
            <Box w={250}>
              <Text c="dimmed" size="sm">
                Colaborador
              </Text>
              <Text truncate="end">{history.employee.fullName}</Text>
            </Box>
            <Flex direction="column" align="flex-end">
              <Text c="dimmed" size="sm">
                Centro de Custo
              </Text>
              <Text>
                {history.costCenter.code} - {history.costCenter.name}
              </Text>
            </Flex>
          </Flex>
          <Flex justify="space-between" mt={10}>
            <Box>
              <Text c="dimmed" size="sm">
                Lotação
              </Text>
              <Text>{history.workload}</Text>
            </Box>
            <Flex direction="column" align="flex-end">
              <Text c="dimmed" size="sm">
                GLPI
              </Text>
              <Text fw={700}>#{history.glpiNumber}</Text>
            </Flex>
          </Flex>
        </Card>
      </Timeline.Item>
    )) ?? []
  return (
    <>
      <ModalDetailHistory
        opened={isOpenHistory}
        close={closeHistory}
        contractHistoryToView={contractHistoryToView}
        onDownloadDocument={onDownloadDocument}
      />
      <Grid my={10}>
        <Grid.Col span={10}>
          <Text size="lg" fw={700} c={getSecondaryTextColor()}>
            Últimos Contratos
          </Text>
        </Grid.Col>
        <Grid.Col span={2}>
          <Button
            variant="light"
            onClick={() => downloadAssetTimeline(assetId)}
            disabled={!historyLending?.length}
          >
            Visualizar Histórico
          </Button>
        </Grid.Col>
      </Grid>

      <Center>
        {canViewLendings ? (
          <Flex direction="column" align="center" miw="60%">
            {isPendingHistoryLending && (
              <Loader color="blue" size="sm" style={{ marginBottom: 16 }} />
            )}

            {isErrorHistoryLending && (
              <Text mb={16}>
                Não foi possível carregar o histórico de contratos
              </Text>
            )}

            {timelineItems.length > 0 ? (
              <Timeline
                bulletSize={40}
                lineWidth={2}
                active={historyLending?.length}
              >
                {timelineItems}
              </Timeline>
            ) : (
              !isPendingHistoryLending &&
              !isErrorHistoryLending && <Text>Nenhum contrato registrado.</Text>
            )}
          </Flex>
        ) : historyLending && !historyLending.length ? (
          <Text>
            Não foram encontrados resultados de histórico de contratos
          </Text>
        ) : null}
      </Center>
    </>
  )
}
