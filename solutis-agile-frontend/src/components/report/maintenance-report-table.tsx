'use client'

import { Flex, rem, ScrollArea, Table, Text } from '@mantine/core'
import { format, parseISO } from 'date-fns'

import undrawNoData from '@/assets/illustrations/undraw_no_data.svg'
import Image from '@/components/image'
import { useThemeColors } from '@/hooks/useThemeColors'

interface MaintenanceReportTableProps {
  // data: Report[]
  data: any
}

export function MaintenanceReportTable({ data }: MaintenanceReportTableProps) {
  const { getContentBackgroundColor, getSecondaryTextColor } = useThemeColors()

  return (
    <ScrollArea
      bg={getContentBackgroundColor()}
      p={16}
      style={{ borderRadius: 25 }}
      mih={500}
    >
      <Table miw={800} verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>
              <Text size="xs" fw="600" c={getSecondaryTextColor()}>
                DATA DA ABERTURA DO CHAMADO
              </Text>
            </Table.Th>
            <Table.Th>
              <Text size="xs" fw="600" c={getSecondaryTextColor()}>
                DATA DE ENCERRAMENTO DO CHAMADO
              </Text>
            </Table.Th>
            <Table.Th>
              <Text size="xs" fw="600" c={getSecondaryTextColor()}>
                NÚMERO DO CHAMADO
              </Text>
            </Table.Th>
            <Table.Th>
              <Text size="xs" fw="600" c={getSecondaryTextColor()}>
                TIPO DE INCIDENTE
              </Text>
            </Table.Th>
            <Table.Th>
              <Text size="xs" fw="600" c={getSecondaryTextColor()}>
                DESCRIÇÃO DO INCIDENTE/MELHORIA
              </Text>
            </Table.Th>
            <Table.Th>
              <Text size="xs" fw="600" c={getSecondaryTextColor()}>
                DESCRIÇÃO DO EQUIPAMENTO
              </Text>
            </Table.Th>
            <Table.Th>
              <Text size="xs" fw="600" c={getSecondaryTextColor()}>
                NÚMERO DE SÉRIE / IMEI
              </Text>
            </Table.Th>
            <Table.Th>
              <Text size="xs" fw="600" c={getSecondaryTextColor()}>
                PATRIMÔNIO
              </Text>
            </Table.Th>
            <Table.Th>
              <Text size="xs" fw="600" c={getSecondaryTextColor()}>
                PADRÃO DO EQUIPAMENTO
              </Text>
            </Table.Th>
            <Table.Th>
              <Text size="xs" fw="600" c={getSecondaryTextColor()}>
                GARANTIA
              </Text>
            </Table.Th>
            <Table.Th>
              <Text size="xs" fw="600" c={getSecondaryTextColor()}>
                VALOR (R$)
              </Text>
            </Table.Th>
            <Table.Th>
              <Text size="xs" fw="600" c={getSecondaryTextColor()}>
                STATUS
              </Text>
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data?.map((report: any) => (
            <Table.Tr key={report.id}>
              <Table.Td>
                {report.opening_date
                  ? format(parseISO(report.opening_date), 'dd/MM/yyyy')
                  : 'Não informado'}
              </Table.Td>
              <Table.Td>
                {report.closing_date
                  ? format(parseISO(report.closing_date), 'dd/MM/yyyy')
                  : 'Não informado'}
              </Table.Td>
              <Table.Td>{report.call_number ?? '-'}</Table.Td>
              <Table.Td>{report.incident_type ?? '-'}</Table.Td>
              <Table.Td>{report.description ?? '-'}</Table.Td>
              <Table.Td>{report.equipment_description ?? '-'}</Table.Td>
              <Table.Td>{report.serial_number ?? '-'}</Table.Td>
              <Table.Td>{report.patrimony ?? '-'}</Table.Td>
              <Table.Td>{report.pattern ?? '-'}</Table.Td>
              <Table.Td>
                {report.assurance_date
                  ? format(parseISO(report.assurance_date), 'dd/MM/yyyy')
                  : 'Não informado'}
              </Table.Td>
              <Table.Td>{report.value}</Table.Td>
              <Table.Td>{report.status}</Table.Td>
            </Table.Tr>
          ))}
          {data?.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={12}>
                <Flex
                  w={'100%'}
                  direction="column"
                  align="center"
                  justify="center"
                  p={12}
                  style={{ gap: rem(20) }}
                >
                  <Image
                    src={undrawNoData}
                    alt="Empty"
                    width={200}
                    height={200}
                  />
                  <Text fw={500} c={getSecondaryTextColor()}>
                    Nenhum registro foi encontrado
                  </Text>
                </Flex>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  )
}
