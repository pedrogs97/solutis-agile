'use client'

import { Flex, rem, ScrollArea, Table, Text } from '@mantine/core'
import { Link } from '@tanstack/react-router'
import { Forward } from 'lucide-react'

import undrawNoData from '@/assets/illustrations/undraw_no_data.svg'
import Image from '@/components/image'
import { useThemeColors } from '@/hooks/useThemeColors'
import { type Lending } from '@/types/Lending'

import StatusPopover from '../common/status-popover'

export function ContractsTable({ data }: { data: Lending[] }) {
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
                Nº DE PATRIMONIO
              </Text>
            </Table.Th>
            <Table.Th>
              <Text size="xs" fw={600} c={getSecondaryTextColor()}>
                CHAMADO GLPI
              </Text>
            </Table.Th>
            <Table.Th>
              <Text size="xs" fw={600} c={getSecondaryTextColor()}>
                TIPO EQUIPAMENTO
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
          {data?.map((contract: Lending) => {
            return (
              <Table.Tr key={contract.id}>
                <Table.Td>{contract?.employee?.fullName || 'N/A'}</Table.Td>
                <Table.Td style={{ display: 'flex', alignItems: 'center' }}>
                  {
                    <StatusPopover
                      status={contract?.status}
                      number={contract?.number ?? '-'}
                    />
                  }
                </Table.Td>
                <Table.Td>{contract?.asset.registerNumber ?? 'N/A'}</Table.Td>
                <Table.Td>{contract?.glpiNumber ?? 'N/A'}</Table.Td>
                <Table.Td>{contract?.asset?.assetType}</Table.Td>
                <Table.Td>
                  {contract?.signedDate?.toString() ?? 'NÃO ASSINADO'}
                </Table.Td>
                <Table.Td>
                  {contract?.createdAt?.toString() ?? 'NÃO INFORMADO'}
                </Table.Td>
                <Table.Td>
                  <Link
                    to="/lendings/edit/$id"
                    params={{ id: String(contract.id) }}
                  >
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
                      Nenhum contrato de comodato encontrado
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
