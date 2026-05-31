'use client'

import { Flex, rem, ScrollArea, Table, Text } from '@mantine/core'

import undrawNoData from '@/assets/illustrations/undraw_no_data.svg'
import Image from '@/components/image'
import { useThemeColors } from '@/hooks/useThemeColors'

interface AssetStockReportTableProps {
  // data: Report[]
  data: any
}

export function AssetStockReportTable({
  data,
}: Readonly<AssetStockReportTableProps>) {
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
                DESCRIÇÃO DO EQUIPAMENTO
              </Text>
            </Table.Th>
            <Table.Th>
              <Text size="xs" fw={600} c={getSecondaryTextColor()}>
                CENTRO DE CUSTO
              </Text>
            </Table.Th>
            <Table.Th>
              <Text size="xs" fw={600} c={getSecondaryTextColor()}>
                CENTRO DE CUSTO (CÓDIGO)
              </Text>
            </Table.Th>
            <Table.Th>
              <Text size="xs" fw={600} c={getSecondaryTextColor()}>
                STATUS
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
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data?.map((item: any) => (
            <Table.Tr key={item.id}>
              <Table.Td>{item.description}</Table.Td>
              <Table.Td>{item.cost_center}</Table.Td>
              <Table.Td>{item.cost_center_code}</Table.Td>
              <Table.Td>{item.status}</Table.Td>
              <Table.Td>{item.register_number}</Table.Td>
              <Table.Td>{item.pattern}</Table.Td>
            </Table.Tr>
          ))}
          {data?.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={6}>
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
