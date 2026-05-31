'use client'

import { Badge, Flex, rem, ScrollArea, Table, Text } from '@mantine/core'
import { Link } from '@tanstack/react-router'
import { Forward } from 'lucide-react'

import undrawNoData from '@/assets/illustrations/undraw_no_data.svg'
import Image from '@/components/image'
import { useThemeColors } from '@/hooks/useThemeColors'
import { type Employee } from '@/types/Employee'

import { Can } from '../providers/ability'
import PopoverLegalPerson from './popover-legal-person'

interface EmployeesTableProps {
  data: Employee[]
}

export function EmployeesTable({ data }: EmployeesTableProps) {
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
                NOME COMPLETO
              </Text>
            </Table.Th>
            <Table.Th>
              <Text size="xs" fw={600} c={getSecondaryTextColor()}>
                E-MAIL PESSOAL
              </Text>
            </Table.Th>
            <Table.Th>
              <Text size="xs" fw={600} c={getSecondaryTextColor()}>
                CARGO
              </Text>
            </Table.Th>
            <Table.Th>
              <Text size="xs" fw={600} c={getSecondaryTextColor()}>
                STATUS
              </Text>
            </Table.Th>
            <Can I="view" a="employee">
              <Table.Th></Table.Th>
            </Can>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data?.map((item) => {
            return (
              <Table.Tr key={item.id}>
                <Table.Td>
                  <Text
                    size="sm"
                    fw={700}
                    style={{ display: 'flex', alignItems: 'center' }}
                  >
                    {item.legalPerson && <PopoverLegalPerson />}
                    {item.fullName}
                  </Text>
                </Table.Td>
                <Table.Td>{item.email}</Table.Td>
                <Table.Td>
                  {item.role?.name || item.jobPosition || 'N/A'}
                </Table.Td>
                <Table.Td>
                  {
                    <Badge
                      color={item.status === 'Ativo' ? 'green' : 'red'}
                      variant="light"
                      miw="100px"
                    >
                      • {item.status}
                    </Badge>
                  }
                </Table.Td>
                <Can I="view" a="employee">
                  <Table.Td>
                    <Link
                      to="/employees/edit/$id"
                      params={{ id: String(item.id) }}
                    >
                      <Forward size={16} color="var(--mantine-color-dimmed)" />
                    </Link>
                  </Table.Td>
                </Can>
              </Table.Tr>
            )
          })}
          {data?.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={4}>
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
                    Nenhum usuário encontrado
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
