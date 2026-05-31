import { ActionIcon, Flex, rem, ScrollArea, Table, Text } from '@mantine/core'
import { useNavigate } from '@tanstack/react-router'
import { EyeIcon } from 'lucide-react'

import undrawNoData from '@/assets/illustrations/undraw_no_data.svg'
import Image from '@/components/image'
import { useThemeColors } from '@/hooks/useThemeColors'
import {
  type InventoryView,
  useInventoryStore,
} from '@/store/persisted/useInventoryStore'
interface InventoryTableProps {
  data: any
}

export function InventoryTable({ data }: Readonly<InventoryTableProps>) {
  const { getContentBackgroundColor, getSecondaryTextColor } = useThemeColors()
  const { updateInventoryToView } = useInventoryStore()
  const navigate = useNavigate()

  const handleViewInventory = (inventory: InventoryView) => {
    updateInventoryToView(inventory)
    navigate({ to: '/inventory/view' })
  }

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
                TELEFONE
              </Text>
            </Table.Th>
            <Table.Th>
              <Text size="xs" fw={600} c={getSecondaryTextColor()}>
                ANO
              </Text>
            </Table.Th>
            <Table.Th>
              <Text size="xs" fw={600} c={getSecondaryTextColor()}>
                RESPONDIDO?
              </Text>
            </Table.Th>
            <Table.Th>
              <Text size="xs" fw={600} c={getSecondaryTextColor()}>
                POSSUI EXTRA?
              </Text>
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data?.items?.map((item: InventoryView, index: number) => {
            const hasExtra =
              item.extraAssets?.length > 0 || item.extraItems?.[0]
            const hasAnswred =
              item.lendings?.length > 0 || item.terms?.length > 0
            return (
              <Table.Tr key={index}>
                <Table.Td>{item.employee.fullName}</Table.Td>
                <Table.Td>{item.employee.phone}</Table.Td>
                <Table.Td>{item.year}</Table.Td>
                <Table.Td>{hasAnswred ? 'SIM' : 'NÃO'}</Table.Td>
                <Table.Td>{hasExtra ? 'SIM' : 'NÃO'}</Table.Td>
                <Table.Td>
                  <ActionIcon
                    variant="transparent"
                    disabled={!hasAnswred}
                    color="red"
                    radius="xl"
                    onClick={() => handleViewInventory(item)}
                  >
                    <EyeIcon />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            )
          })}
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
