import { Box, Card, Center, Flex, Text, Timeline } from '@mantine/core'

import { useThemeColors } from '@/hooks/useThemeColors'
import { type Term } from '@/types/Lending'
import {
  getLendingBadgeFromStatus,
  getLendingColorFromStatus,
  getLendingIconFromStatus,
} from '@/utils/getStatuses'

import ModalDetailsTerm from './modal/term-details'

const getSignedDate = (history: any) => {
  if (history.revokeSignedDate) return history.revokeSignedDate
  if (history.signedDate) return history.signedDate
  return '-'
}

interface TimelineTermsProps {
  opened: boolean
  close: () => void
  onDownloadDocument: Function
  termHistory: any
  termDetails: Term | null
  open: () => void
  setTermDetails: Function
  canViewTerms: boolean
}

export default function TimelineTerms({
  opened,
  open,
  close,
  onDownloadDocument,
  termHistory,
  termDetails,
  setTermDetails,
  canViewTerms,
}: Readonly<TimelineTermsProps>) {
  const { getSecondaryTextColor } = useThemeColors()
  return (
    <>
      <ModalDetailsTerm
        opened={opened}
        close={close}
        termDetails={termDetails}
        onDownloadDocument={onDownloadDocument}
      />
      <Text size="lg" fw={700} c={getSecondaryTextColor()}>
        Últimos Termos
      </Text>
      <Center>
        {canViewTerms && (
          <Timeline bulletSize={40} lineWidth={2} active={termHistory?.length}>
            {termHistory?.map((term: any) => (
              <Timeline.Item
                key={term.id}
                bullet={getLendingIconFromStatus(term.status)}
                color={getLendingColorFromStatus(term.status)}
                title={
                  <Flex align="center">
                    <Text tt="uppercase" fw={700} size="sm">
                      Data de Assinatura: {getSignedDate(term)}
                    </Text>
                    &nbsp;&nbsp;{getLendingBadgeFromStatus(term.status)}
                    <Text fw={700} tt="uppercase" size="sm">
                      {term.status || 'Não informado'}
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
                    setTermDetails(term)
                  }}
                >
                  <Flex justify="space-between">
                    <Text fw={700} tt="uppercase">
                      {term.type} #{term.number || '-'}
                    </Text>
                    <Text fw={700}></Text>
                  </Flex>
                  <Flex justify="space-between" mt={10}>
                    <Box>
                      <Text c="dimmed" size="sm">
                        Descrição
                      </Text>
                      <Text>{term.description ?? 'NÃO INFORMADO'}</Text>
                    </Box>
                    <Flex direction="column" align="flex-end">
                      <Text c="dimmed" size="sm">
                        Centro de Custo
                      </Text>
                      <Text>
                        {term.costCenter?.code} - {term.costCenter?.name}
                      </Text>
                    </Flex>
                  </Flex>
                  <Flex justify="space-between" mt={10}>
                    <Box>
                      <Text c="dimmed" size="sm">
                        Lotação
                      </Text>
                      <Text>{term.workload}</Text>
                    </Box>
                    <Flex direction="column" align="flex-end">
                      Projeto
                      <Text fw={700}>{term.project}</Text>
                    </Flex>
                  </Flex>
                </Card>
              </Timeline.Item>
            ))}
          </Timeline>
        )}
        {termHistory && termHistory.length === 0 && !canViewTerms ? (
          <Text>
            Não foram encontrados resultados de histórico de termos de
            responsabilidade
          </Text>
        ) : null}
      </Center>
    </>
  )
}
