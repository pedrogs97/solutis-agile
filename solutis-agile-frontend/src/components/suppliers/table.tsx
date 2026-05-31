'use client'
import { Badge, Flex, ScrollArea, Table, Text } from '@mantine/core'
import { Link } from '@tanstack/react-router'
import { Forward } from 'lucide-react'

import undrawNoData from '@/assets/illustrations/undraw_no_data.svg'
import Image from '@/components/image'
import { Can } from '@/components/providers/ability'
import { cpfCnpjMask } from '@/lib/utils'
import { type SuppliersResponse } from '@/types/Supplier'
import { capitalize } from '@/utils/formatString'

interface SuppliersTableProps {
  data?: SuppliersResponse
}

const getStatusColor = (situation?: string | null) => {
  switch (situation) {
    case 'ATIVO':
      return 'green'
    case 'INATIVO':
      return 'red'
    case 'BLOQUEADO':
      return 'yellow'
    case 'PENDENTE':
      return 'orange'
    default:
      return 'gray'
  }
}

const getSituationLabel = (situation?: string | null) => {
  if (!situation) return 'Indefinido'
  return capitalize(situation)
}

const getRiskLevelLabel = (riskLevel?: string | null) => {
  if (!riskLevel) return '-'
  return capitalize(riskLevel)
}

const getRiskLevelColor = (riskLevel?: string | null) => {
  switch (riskLevel) {
    case 'BAIXO':
      return 'green'
    case 'MÉDIO':
      return 'yellow'
    case 'ALTO':
      return 'red'
    default:
      return 'gray'
  }
}

const formatDate = (dateString?: string | Date | null) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('pt-BR')
}

export function SuppliersTable({ data }: SuppliersTableProps) {
  if (!data?.results?.length) {
    return (
      <Flex direction="column" align="center" justify="center" mih={400}>
        <Image
          src={undrawNoData}
          alt="Nenhum fornecedor encontrado"
          width={200}
          height={200}
        />
        <Text c="dimmed" size="lg" mt="md">
          Nenhum fornecedor encontrado
        </Text>
      </Flex>
    )
  }

  return (
    <ScrollArea>
      <Table highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Razão Social</Table.Th>
            <Table.Th>CPF/CNPJ</Table.Th>
            <Table.Th>Situação</Table.Th>
            <Table.Th>Grau de Risco</Table.Th>
            <Table.Th>Início do Contrato</Table.Th>
            <Table.Th>Fim do Contrato</Table.Th>
            <Table.Th></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.results.map((supplier) => (
            <Table.Tr key={supplier.id}>
              <Table.Td>
                <Text size="sm">{supplier.legalName}</Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{cpfCnpjMask(supplier.taxId)}</Text>
              </Table.Td>
              <Table.Td>
                <Badge
                  color={getStatusColor(supplier.situation?.status.name)}
                  variant="light"
                >
                  {getSituationLabel(supplier.situation?.status.name)}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Badge
                  color={getRiskLevelColor(supplier.riskLevel?.name)}
                  variant="light"
                >
                  {getRiskLevelLabel(supplier.riskLevel?.name)}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Text size="sm">
                  {formatDate(supplier.contract?.contractStartDate)}
                </Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm">
                  {formatDate(supplier.contract?.contractEndDate)}
                </Text>
              </Table.Td>
              <Table.Td>
                <Can I="edit" a="supplier">
                  <Link
                    to="/suppliers/edit/$id"
                    params={{ id: String(supplier.id) }}
                  >
                    <Forward size={16} color="var(--mantine-color-dimmed)" />
                  </Link>
                </Can>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  )
}
