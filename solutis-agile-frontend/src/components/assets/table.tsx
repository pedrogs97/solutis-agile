'use client'

import { Badge, Flex, rem, ScrollArea, Table, Text } from '@mantine/core'
import { Link } from '@tanstack/react-router'
import { format } from 'date-fns'
import { Forward } from 'lucide-react'

import undrawNoData from '@/assets/illustrations/undraw_no_data.svg'
import Image from '@/components/image'
import { Can } from '@/components/providers/ability'
import { useThemeColors } from '@/hooks/useThemeColors'

import PopoverAlert from './popover-alert'

const getStatus = (status: string) => {
  if (!status)
    return (
      <Badge color="gray" variant="light" miw="100px">
        • INDEFINIDO
      </Badge>
    )
  switch (status) {
    case 'Disponível':
      return (
        <Badge color="green" variant="light" miw="100px">
          • {status}
        </Badge>
      )
    case 'Comodato':
      return (
        <Badge color="yellow" variant="light" miw="100px">
          • {status}
        </Badge>
      )
    case 'Estoque SP':
      return (
        <Badge color="blue" variant="light" miw="100px">
          • {status}
        </Badge>
      )
    case 'Estoque BA':
      return (
        <Badge color="orange" variant="light" miw="100px">
          • {status}
        </Badge>
      )
    case 'Reservado':
      return (
        <Badge color="purple" variant="light" miw="100px">
          • {status}
        </Badge>
      )
    case 'Inativo':
      return (
        <Badge color="gray" variant="light" miw="100px">
          • {status}
        </Badge>
      )
    case 'Emprestimo':
      return (
        <Badge color="turquoise" variant="light" miw="100px">
          • {status}
        </Badge>
      )
    case 'Descarte':
      return (
        <Badge color="red" variant="light" miw="100px">
          • {status}
        </Badge>
      )
    default:
      return (
        <Badge color="gray" variant="light" miw="100px">
          • INDEFINIDO
        </Badge>
      )
  }
}

const getAssurance = (assuranceDate: string | null) => {
  if (assuranceDate) {
    return format(new Date(assuranceDate), 'dd/MM/yyyy')
  }
  return 'SEM GARANTIA'
}

export function AssetsTable({ data }: any) {
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
                DESCRIÇÃO
              </Text>
            </Table.Th>
            <Table.Th>
              <Text size="xs" fw={600} c={getSecondaryTextColor()}>
                STATUS DE MELHORIA
              </Text>
            </Table.Th>
            <Table.Th>
              <Text size="xs" fw={600} c={getSecondaryTextColor()}>
                STATUS DE MANUTENÇÃO
              </Text>
            </Table.Th>
            <Table.Th>
              <Text size="xs" fw={600} c={getSecondaryTextColor()}>
                Nº DE PATRIMONIO
              </Text>
            </Table.Th>
            <Table.Th>
              <Text size="xs" fw={600} c={getSecondaryTextColor()}>
                N° DE SÉRIE
              </Text>
            </Table.Th>
            <Table.Th>
              <Text size="xs" fw={600} c={getSecondaryTextColor()}>
                FORNECEDOR
              </Text>
            </Table.Th>
            <Table.Th>
              <Text size="xs" fw={600} c={getSecondaryTextColor()}>
                DATA AQUISIÇÃO
              </Text>
            </Table.Th>
            <Table.Th>
              <Text size="xs" fw={600} c={getSecondaryTextColor()}>
                GARANTIA
              </Text>
            </Table.Th>
            <Table.Th>
              <Text size="xs" fw={600} c={getSecondaryTextColor()}>
                N° NOTA FISCAL
              </Text>
            </Table.Th>
            <Table.Th>
              <Text size="xs" fw={600} c={getSecondaryTextColor()}>
                SITUAÇÃO
              </Text>
            </Table.Th>
            <Can I="view" a="asset">
              <Table.Th></Table.Th>
            </Can>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data?.map((item: any) => {
            return (
              <Table.Tr key={item.id}>
                <Table.Td>
                  <Text
                    size="sm"
                    style={{ display: 'flex', alignItems: 'center' }}
                  >
                    {item.description}
                    {item.alert !== '' && <PopoverAlert message={item.alert} />}
                  </Text>
                </Table.Td>
                <Table.Td>{item.upgradeStatus}</Table.Td>
                <Table.Td>{item.maintenanceStatus}</Table.Td>
                <Table.Td>{item.registerNumber}</Table.Td>
                <Table.Td>{item.serialNumber ?? '-'}</Table.Td>
                <Table.Td>{item.supplier}</Table.Td>
                <Table.Td>
                  {item.acquisitionDate
                    ? format(new Date(item.acquisitionDate), 'dd/MM/yyyy')
                    : '-'}
                </Table.Td>
                <Table.Td>{getAssurance(item.assuranceDate)}</Table.Td>
                <Table.Td>{item.invoiceNumber ?? '-'}</Table.Td>
                <Table.Td>
                  {typeof item.status === 'string'
                    ? getStatus(item.status)
                    : '-'}
                </Table.Td>
                <Can I="view" a="asset">
                  <Table.Td>
                    <Link to="/assets/edit/$id" params={{ id: item.id }}>
                      <Forward size={16} color="var(--mantine-color-dimmed)" />
                    </Link>
                  </Table.Td>
                </Can>
              </Table.Tr>
            )
          })}
          {data?.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={7}>
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
                    Nenhum ativo encontrado
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
