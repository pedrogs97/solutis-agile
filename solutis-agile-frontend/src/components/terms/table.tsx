'use client'

import { Flex, rem, ScrollArea, Table, Text } from '@mantine/core'
import { Link } from '@tanstack/react-router'
import { Forward } from 'lucide-react'

import undrawNoData from '@/assets/illustrations/undraw_no_data.svg'
import Image from '@/components/image'
import { useThemeColors } from '@/hooks/useThemeColors'
import { type Term } from '@/types/Lending'

import StatusPopover from '../common/status-popover'

export function TermsTable({ data }: { data: Term[] }) {
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
                N° CONTRATO
              </Text>
            </Table.Th>
            <Table.Th>
              <Text size="xs" fw={600} c={getSecondaryTextColor()}>
                TIPO DO TERMO
              </Text>
            </Table.Th>
            <Table.Th>
              <Text size="xs" fw={600} c={getSecondaryTextColor()}>
                DATA ASSINATURA
              </Text>
            </Table.Th>
            <Table.Th>
              <Text size="xs" fw={600} c={getSecondaryTextColor()}>
                DATA DE CRIAÇÃO
              </Text>
            </Table.Th>
            <Table.Th></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data?.map((term: Term) => {
            return (
              <Table.Tr key={term.id}>
                <Table.Td>{term?.employee?.fullName || 'N/A'}</Table.Td>
                <Table.Td style={{ display: 'flex', alignItems: 'center' }}>
                  {
                    <StatusPopover
                      status={term?.status ?? 'Não informado'}
                      number={term?.number ?? '-'}
                    />
                  }
                </Table.Td>
                <Table.Td>
                  {typeof term?.type === 'string'
                    ? term?.type
                    : term?.type?.name}
                </Table.Td>
                <Table.Td>
                  {term?.signedDate?.toString() ?? 'NÃO ASSINADO'}
                </Table.Td>
                <Table.Td>
                  {term?.createdAt?.toString() ?? 'NÃO INFORMADO'}
                </Table.Td>
                <Table.Td>
                  <Link to="/terms/edit/$id" params={{ id: String(term.id) }}>
                    <Forward size={16} color="var(--mantine-color-dimmed)" />
                  </Link>
                </Table.Td>
              </Table.Tr>
            )
          })}
          {!data ||
            (data?.length === 0 && (
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
                      Nenhum termo de responsabilidade encontrado
                    </Text>
                  </Flex>
                </Table.Td>
              </Table.Tr>
            ))}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  )
}
