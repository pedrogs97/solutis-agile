'use client'

import { useAbility } from '@casl/react'
import {
  Box,
  Container,
  Divider,
  Grid,
  Input as MantineInput,
  NumberFormatter,
  Stack,
  Table,
  Text,
  Textarea,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { IMaskInput } from 'react-imask'

import { Breadcrumbs } from '@/components/common/breadcrumbs'
import { PageSectionHeader } from '@/components/common/page-section-header'
import FormSkeleton from '@/components/common/skeletons/form-skeleton'
import { AbilityContext } from '@/components/providers/ability'
import { ServerError } from '@/components/server-error'
import { useThemeColors } from '@/hooks/useThemeColors'
import { useInventoryStore } from '@/store/persisted/useInventoryStore'

export const Route = createFileRoute('/_dashboard/inventory/view/')({
  errorComponent: () => <ServerError />,
  pendingComponent: () => <FormSkeleton />,
  component: InventoryViewPage,
})

function InventoryViewPage() {
  const navigate = useNavigate()
  const { getContentBackgroundColor } = useThemeColors()
  const { invetoryToView } = useInventoryStore()
  const ability = useAbility(AbilityContext)

  const [toolsItems] = useState(
    invetoryToView?.terms?.filter((term) => term.type === 'Ferramentas') ?? [],
  )
  const [clothingItems] = useState(
    invetoryToView?.terms?.filter((term) => term.type === 'Fardamento') ?? [],
  )
  const [chipItems] = useState(
    invetoryToView?.terms?.filter((term) => term.type === 'Chip') ?? [],
  )

  useEffect(() => {
    if (ability.cannot('view', 'inventory') && !invetoryToView) {
      notifications.show({
        message: 'Usuário não possui permissão "Visualizar Inventário"',
      })
      navigate({ to: '/dashboard' })
    }
  }, [])

  return (
    <Container size="xl" p={8}>
      <Breadcrumbs />
      <PageSectionHeader title="Visualizar inventário" />
      <Box
        bg={getContentBackgroundColor()}
        style={{ borderRadius: 25, width: '100%' }}
        pb={24}
      >
        <Grid my={12} p={16}>
          <Grid.Col span={8}>
            <MantineInput.Wrapper label="Name">
              <MantineInput
                readOnly
                defaultValue={invetoryToView?.employee.fullName}
              />
            </MantineInput.Wrapper>
            <MantineInput.Wrapper label="Gestor">
              <MantineInput
                readOnly
                defaultValue={
                  invetoryToView?.employee.manager ?? 'Não informado'
                }
              />
            </MantineInput.Wrapper>
          </Grid.Col>
          <Grid.Col span={4}>
            <MantineInput.Wrapper label="Telefone">
              <MantineInput
                component={IMaskInput}
                mask="(00) 00000-0000"
                readOnly
                defaultValue={invetoryToView?.employee.phone ?? 'Não informado'}
              />
            </MantineInput.Wrapper>
            <MantineInput.Wrapper label="Email">
              <MantineInput
                readOnly
                defaultValue={invetoryToView?.employee.email ?? 'Não informado'}
              />
            </MantineInput.Wrapper>
          </Grid.Col>
        </Grid>
        <Stack gap="xl" pb={24}>
          <Text
            ta="start"
            c="var(--mantine-color-text)"
            pl={24}
            size="md"
            fw={700}
          >
            Comodatos
          </Text>
          <Grid p={8}>
            <Table withTableBorder highlightOnHover>
              <Table.Thead
                style={{
                  borderBottomColor: 'var(--mantine-color-default-border)',
                }}
              >
                <Table.Tr bg="var(--mantine-color-default)">
                  <Table.Td>DESCRIÇÃO DO ATIVO</Table.Td>
                  <Table.Td>N° PATRIMÔNIO</Table.Td>
                  <Table.Td>EXECUTIVO</Table.Td>
                  <Table.Td>LOTAÇÃO</Table.Td>
                  <Table.Td>CENTRO DE CUSTO</Table.Td>
                  <Table.Td>BU</Table.Td>
                  <Table.Td>N° SERIE</Table.Td>
                  <Table.Td>PACOTE OFFICE</Table.Td>
                  <Table.Td>INFORMAÇÕES CORRETAS</Table.Td>
                  <Table.Td>JUSTIFICATIVA</Table.Td>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {invetoryToView?.lendings.map((lending) => (
                  <Table.Tr key={lending.id}>
                    <Table.Td>{lending.assetDescription}</Table.Td>
                    <Table.Td>{lending.registerNumber}</Table.Td>
                    <Table.Td>{lending.executive}</Table.Td>
                    <Table.Td>{lending.location}</Table.Td>
                    <Table.Td>{lending.costCenter}</Table.Td>
                    <Table.Td>{lending.bu}</Table.Td>
                    <Table.Td>{lending.serialNumber}</Table.Td>
                    <Table.Td>{lending.msOffice ? 'Sim' : 'Não'}</Table.Td>
                    <Table.Td>{lending.confirm ? 'Sim' : 'Não'}</Table.Td>
                    <Table.Td>{lending.justification}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Grid>
          <Divider my="md" />
          <Text
            ta="start"
            c="var(--mantine-color-text)"
            pl={24}
            size="md"
            fw={700}
          >
            Termo de Responsabilidade
          </Text>
          <Grid p={8}>
            <Stack gap="md" w="100%">
              {toolsItems.length > 0 && (
                <Table withTableBorder highlightOnHover>
                  <Table.Thead
                    style={{
                      borderBottomColor: 'var(--mantine-color-default-border)',
                    }}
                  >
                    <Table.Tr bg="var(--mantine-color-default)">
                      <Table.Td>DESCRIÇÃO DO ATIVO</Table.Td>
                      <Table.Td>TIPO DE CONTRATO</Table.Td>
                      <Table.Td>INFORMAÇÕES CORRETAS</Table.Td>
                      <Table.Td>JUSTIFICATIVA</Table.Td>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {toolsItems.map((term) => (
                      <Table.Tr key={term.id}>
                        <Table.Td>{term.description}</Table.Td>
                        <Table.Td>{term.type}</Table.Td>
                        <Table.Td>{term.confirm ? 'SIM' : 'NÃO'}</Table.Td>
                        <Table.Td>{term.justification}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
              {clothingItems.length > 0 && (
                <Table withTableBorder highlightOnHover>
                  <Table.Thead
                    style={{
                      borderBottomColor: 'var(--mantine-color-default-border)',
                    }}
                  >
                    <Table.Tr bg="var(--mantine-color-default)">
                      <Table.Td>DESCRIÇÃO DO ATIVO</Table.Td>
                      <Table.Td>TIPO DE CONTRATO</Table.Td>
                      <Table.Td>TAMANHO</Table.Td>
                      <Table.Td>QUANTIDADE</Table.Td>
                      <Table.Td>VALOR</Table.Td>
                      <Table.Td>INFORMAÇÕES CORRETAS</Table.Td>
                      <Table.Td>JUSTIFICATIVA</Table.Td>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {clothingItems.map((term) => (
                      <Table.Tr key={term.id}>
                        <Table.Td>{term.description}</Table.Td>
                        <Table.Td>{term.type}</Table.Td>
                        <Table.Td>{term.size}</Table.Td>
                        <Table.Td>{term.quantity}</Table.Td>
                        <Table.Td>
                          <NumberFormatter
                            prefix="R$ "
                            value={term.value}
                            thousandSeparator="."
                            decimalSeparator=","
                            decimalScale={2}
                            fixedDecimalScale
                          />
                        </Table.Td>
                        <Table.Td>{term.confirm ? 'SIM' : 'NÃO'}</Table.Td>
                        <Table.Td>{term.justification}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
              {chipItems.length > 0 && (
                <Table withTableBorder highlightOnHover>
                  <Table.Thead
                    style={{
                      borderBottomColor: 'var(--mantine-color-default-border)',
                    }}
                  >
                    <Table.Tr bg="var(--mantine-color-default)">
                      <Table.Td>DESCRIÇÃO DO ATIVO</Table.Td>
                      <Table.Td>TIPO DE CONTRATO</Table.Td>
                      <Table.Td>N° DA LINHA</Table.Td>
                      <Table.Td>OPERADORA</Table.Td>
                      <Table.Td>INFORMAÇÕES CORRETAS</Table.Td>
                      <Table.Td>JUSTIFICATIVA</Table.Td>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {chipItems.map((term) => (
                      <Table.Tr key={term.id}>
                        <Table.Td>{term.description}</Table.Td>
                        <Table.Td>{term.type}</Table.Td>
                        <Table.Td>{term.lineNumber}</Table.Td>
                        <Table.Td>{term.operator}</Table.Td>
                        <Table.Td>{term.confirm ? 'SIM' : 'NÃO'}</Table.Td>
                        <Table.Td>{term.justification}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
            </Stack>
          </Grid>
          <Divider my="md" />
          <Text
            ta="start"
            c="var(--mantine-color-text)"
            pl={24}
            size="md"
            fw={700}
          >
            Ativos sem comodatado
          </Text>
          <Table withTableBorder>
            <Table.Thead
              style={{
                borderBottomColor: 'var(--mantine-color-default-border)',
              }}
            >
              <Table.Tr bg="var(--mantine-color-default)">
                <Table.Td>DESCRIÇÃO DO ATIVO</Table.Td>
                <Table.Td>N° PATRIMÔNIO</Table.Td>
                <Table.Td>N° SERIE</Table.Td>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {invetoryToView?.extraAssets.map((item) => (
                <Table.Tr key={item.id}>
                  <Table.Td>{item.description}</Table.Td>
                  <Table.Td>{item.registerNumber}</Table.Td>
                  <Table.Td>{item.serialNumber}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
          <Text
            ta="start"
            c="var(--mantine-color-text)"
            pl={24}
            size="md"
            fw={700}
          >
            Item sem termo
          </Text>
          {invetoryToView?.extraItems.map((item) => (
            <Textarea
              pl={16}
              pr={16}
              readOnly
              key={item.extraItems}
              value={item.extraItems}
            />
          ))}
        </Stack>
      </Box>
    </Container>
  )
}
