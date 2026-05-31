'use client'

import {
  ActionIcon,
  Badge,
  Flex,
  Menu,
  MenuDivider,
  rem,
  ScrollArea,
  Table,
  Text,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { MoreVertical } from 'lucide-react'

import undrawNoData from '@/assets/illustrations/undraw_no_data.svg'
import Image from '@/components/image'
import { useThemeColors } from '@/hooks/useThemeColors'
import axios from '@/lib/axios'
import { type User } from '@/types/User'

import { Can } from '../providers/ability'

export function UsersTable({ data, canEdit }: any) {
  const queryClient = useQueryClient()
  const { getSecondaryTextColor } = useThemeColors()

  const { mutate: mutateUpdateActiveUser } = useMutation({
    mutationKey: ['updateActiveUser'],
    mutationFn: async (data: any) => {
      const { data: response } = await axios.patch(`/auth/users/${data.id}`, {
        isActive: data.isActive,
      })
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fetchUsers'] })
      notifications.show({
        title: 'Sucesso',
        message: 'Usuário editado com sucesso',
        color: 'green',
        autoClose: 5000,
      })
    },
    onError: () => {
      notifications.show({
        title: 'Erro',
        message: 'Não foi possível editar o usuário',
        color: 'red',
        autoClose: 5000,
      })
    },
  })

  return (
    <ScrollArea>
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
                E-MAIL
              </Text>
            </Table.Th>
            <Table.Th>
              <Text size="xs" fw={600} c={getSecondaryTextColor()}>
                PERFIL
              </Text>
            </Table.Th>
            <Table.Th>
              <Text size="xs" fw={600} c={getSecondaryTextColor()}>
                DEPARTAMENTO
              </Text>
            </Table.Th>
            <Table.Th>
              <Text size="xs" fw={600} c={getSecondaryTextColor()}>
                GESTOR DIRETO
              </Text>
            </Table.Th>
            <Table.Th>
              <Text size="xs" fw={600} c={getSecondaryTextColor()}>
                STATUS
              </Text>
            </Table.Th>
            <Can I="view" a="user">
              <Table.Th></Table.Th>
            </Can>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data?.map((item: User) => {
            return (
              <Table.Tr key={item.id}>
                <Table.Td>
                  <Text size="sm" fw={700}>
                    {item.fullName ?? '-'}
                  </Text>
                </Table.Td>
                <Table.Td>{item.email}</Table.Td>
                <Table.Td>
                  {typeof item.group === 'string' ? item.group : '-'}
                </Table.Td>
                <Table.Td>{item.department}</Table.Td>
                <Table.Td>{item.manager}</Table.Td>
                <Table.Td>
                  {
                    <Badge
                      color={item.isActive ? 'green' : 'red'}
                      variant="light"
                      miw="80px"
                    >
                      • {item.isActive ? 'ATIVO' : 'INATIVO'}
                    </Badge>
                  }
                </Table.Td>
                <Can I="view" a="user">
                  <Table.Td align="center">
                    <Menu
                      trigger="click-hover"
                      openDelay={100}
                      closeDelay={300}
                      position="left"
                    >
                      <Menu.Target>
                        <ActionIcon variant="transparent" aria-label="options">
                          <MoreVertical
                            size={16}
                            color="var(--mantine-color-dimmed)"
                          />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown miw="150px">
                        <Link
                          to="/users/edit/$id"
                          params={{ id: String(item.id) }}
                          style={{
                            textDecoration: 'none',
                            color: 'var(--mantine-color-text)',
                          }}
                        >
                          <Menu.Item disabled={item.isStaff}>
                            {canEdit ? 'Editar' : 'Visualizar'}
                          </Menu.Item>
                        </Link>
                        <MenuDivider />
                        {canEdit && (
                          <Menu.Item
                            component="button"
                            onClick={() =>
                              mutateUpdateActiveUser({
                                id: item.id,
                                isActive: !item.isActive,
                              })
                            }
                            disabled={item.isStaff}
                          >
                            {item.isActive ? 'Inativar' : 'Ativar'}
                          </Menu.Item>
                        )}
                      </Menu.Dropdown>
                    </Menu>
                  </Table.Td>
                </Can>
              </Table.Tr>
            )
          })}
          {data?.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={5}>
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
