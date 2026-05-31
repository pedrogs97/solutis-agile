'use client'

import { Flex, rem, ScrollArea, Table, Text } from '@mantine/core'

import undrawNoData from '@/assets/illustrations/undraw_no_data.svg'
import Image from '@/components/image'
import { useThemeColors } from '@/hooks/useThemeColors'

interface EmployeeReportTableProps {
  // data: Report[]
  data: any
}

export function EmployeeReportTable({ data }: EmployeeReportTableProps) {
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
              <Text size="xs" fw={600} c={getSecondaryTextColor()}>
                COLABORADOR
              </Text>
            </Table.Th>
            <Table.Th>
              <Text size="xs" fw={600} c={getSecondaryTextColor()}>
                CHAPA
              </Text>
            </Table.Th>
            <Table.Th>
              <Text size="xs" fw={600} c={getSecondaryTextColor()}>
                CARGO
              </Text>
            </Table.Th>
            <Table.Th>
              <Text size="xs" fw={600} c={getSecondaryTextColor()}>
                PROJETO
              </Text>
            </Table.Th>
            <Table.Th>
              <Text size="xs" fw={600} c={getSecondaryTextColor()}>
                CENTRO DE CUSTO
              </Text>
            </Table.Th>
            <Table.Th>
              <Text size="xs" fw={600} c={getSecondaryTextColor()}>
                GESTOR
              </Text>
            </Table.Th>
            <Table.Th>
              <Text size="xs" fw={600} c={getSecondaryTextColor()}>
                EXECUTIVO
              </Text>
            </Table.Th>
            <Table.Th>
              <Text size="xs" fw={600} c={getSecondaryTextColor()}>
                LOCAL DE TRABALHO
              </Text>
            </Table.Th>
            <Table.Th>
              <Text size="xs" fw={600} c={getSecondaryTextColor()}>
                DESCRIÇÃO DO EQUIPAMENTO
              </Text>
            </Table.Th>
            <Table.Th>
              <Text size="xs" fw={600} c={getSecondaryTextColor()}>
                PATRIMÔNIO
              </Text>
            </Table.Th>
            <Table.Th>
              <Text size="xs" fw={600} c={getSecondaryTextColor()}>
                PADRÃO EQUIPAMENTO
              </Text>
            </Table.Th>
            <Table.Th>
              <Text size="xs" fw={600} c={getSecondaryTextColor()}>
                STATUS
              </Text>
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data?.map((report: any) => (
            <Table.Tr key={report.id}>
              <Table.Td>{report.employee}</Table.Td>
              <Table.Td>{report.code}</Table.Td>
              <Table.Td>{report.role}</Table.Td>
              <Table.Td>{report.project}</Table.Td>
              <Table.Td>{report.cost_center}</Table.Td>
              <Table.Td>{report.manager}</Table.Td>
              <Table.Td>{report.executive}</Table.Td>
              <Table.Td>{report.workload}</Table.Td>
              <Table.Td>{report.equipment_description}</Table.Td>
              <Table.Td>{report.patrimony}</Table.Td>
              <Table.Td>{report.equipment_standard}</Table.Td>
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
