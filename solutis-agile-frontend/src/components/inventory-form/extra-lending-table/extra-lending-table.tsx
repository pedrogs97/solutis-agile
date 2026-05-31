import {
  ActionIcon,
  Box,
  Button,
  Card,
  Input,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
  useMantineTheme,
} from '@mantine/core'
import { Plus, Trash2 } from 'lucide-react'
import { type ChangeEvent, useState } from 'react'

import { useThemeColors } from '@/hooks/useThemeColors'
import {
  type InventoryExtraLending,
  useInventoryStore,
} from '@/store/persisted/useInventoryStore'

interface MobileExtraLendingCardProps {
  readonly item: InventoryExtraLending
  readonly primaryTextColor: string
  readonly secondaryTextColor: string
  readonly cardBackground: string
  readonly onRemove: (registerNumber: string) => void
}

function MobileExtraLendingCard({
  item,
  primaryTextColor,
  secondaryTextColor,
  cardBackground,
  onRemove,
}: Readonly<MobileExtraLendingCardProps>) {
  return (
    <Card shadow="sm" p="md" radius="md" withBorder mb="sm" bg={cardBackground}>
      <Stack gap="sm">
        <Box pos="relative">
          <Title order={6} c={primaryTextColor}>
            {item.description || 'Sem descrição'}
          </Title>
          <ActionIcon
            variant="light"
            color="red"
            radius="xl"
            size="sm"
            pos="absolute"
            right={0}
            top={0}
            onClick={() => onRemove(item.registerNumber)}
            aria-label="Remover ativo adicional"
          >
            <Trash2 size={14} />
          </ActionIcon>
        </Box>
        <SimpleGrid cols={2} spacing="xs">
          <Box>
            <Text size="xs" c={secondaryTextColor}>
              Patrimônio
            </Text>
            <Text size="sm" fw={500} c={primaryTextColor}>
              {item.registerNumber || 'Não informado'}
            </Text>
          </Box>
          <Box>
            <Text size="xs" c={secondaryTextColor}>
              Nº Série
            </Text>
            <Text size="sm" fw={500} c={primaryTextColor}>
              {item.serialNumber || 'Não informado'}
            </Text>
          </Box>
        </SimpleGrid>
      </Stack>
    </Card>
  )
}

export function ExtraLendingTable() {
  const { invertoryExtraLendings, addExtraLending, removeExtraLending } =
    useInventoryStore()
  const theme = useMantineTheme()
  const {
    colorScheme,
    getCardBackgroundColor,
    getPrimaryTextColor,
    getSecondaryTextColor,
    getTableRowEvenBackgroundColor,
    getTableRowOddBackgroundColor,
  } = useThemeColors()
  const [newExtraLending, setNewExtraLending] = useState<InventoryExtraLending>(
    {
      description: '',
      registerNumber: '',
      serialNumber: '',
    },
  )

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewExtraLending({
      ...newExtraLending,
      [e.target.name]: e.target.value,
    })
  }

  const handleAddExtraLending = () => {
    if (
      newExtraLending.description ||
      newExtraLending.registerNumber ||
      newExtraLending.serialNumber
    ) {
      addExtraLending(newExtraLending)
      setNewExtraLending({
        description: '',
        registerNumber: '',
        serialNumber: '',
      })
    }
  }

  const handleRemoveItem = (registerNumber: string) => {
    removeExtraLending(registerNumber)
  }

  const headerBackground = colorScheme === 'dark' ? 'dark.6' : 'gray.0'
  const borderColor =
    colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3]
  const primaryTextColor = getPrimaryTextColor()
  const secondaryTextColor = getSecondaryTextColor()
  const cardBackground = getCardBackgroundColor()
  const formCardBackground = colorScheme === 'dark' ? 'dark.6' : 'gray.0'

  return (
    <>
      <Text ta="start" c={primaryTextColor} pl={24} size="sm" fw={600} mb="md">
        Ativos Adicionais
      </Text>

      {/* Desktop Table View */}
      <Box display={{ base: 'none', md: 'block' }}>
        <Table withTableBorder>
          <Table.Thead style={{ borderBottomColor: borderColor }}>
            <Table.Tr bg={headerBackground}>
              <Table.Td>DESCRIÇÃO DO ATIVO</Table.Td>
              <Table.Td>N° PATRIMÔNIO</Table.Td>
              <Table.Td>N° SERIE</Table.Td>
              <Table.Td></Table.Td>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td w="75%">
                <Input
                  name="description"
                  onChange={handleChange}
                  value={newExtraLending.description}
                  placeholder="Descrição do ativo"
                />
              </Table.Td>
              <Table.Td>
                <Input
                  name="registerNumber"
                  onChange={handleChange}
                  value={newExtraLending.registerNumber}
                  placeholder="N° Patrimônio"
                />
              </Table.Td>
              <Table.Td>
                <Input
                  name="serialNumber"
                  onChange={handleChange}
                  value={newExtraLending.serialNumber}
                  placeholder="N° Série"
                />
              </Table.Td>
              <Table.Td align="right">
                <ActionIcon
                  variant="light"
                  radius="xl"
                  onClick={handleAddExtraLending}
                  color="blue"
                  aria-label="Adicionar novo ativo adicional"
                >
                  <Plus />
                </ActionIcon>
              </Table.Td>
            </Table.Tr>
            {invertoryExtraLendings.map((item, index) => (
              <Table.Tr
                key={item.registerNumber}
                bg={
                  index % 2 === 0
                    ? getTableRowEvenBackgroundColor()
                    : getTableRowOddBackgroundColor()
                }
              >
                <Table.Td>{item.description}</Table.Td>
                <Table.Td>{item.registerNumber}</Table.Td>
                <Table.Td>{item.serialNumber}</Table.Td>
                <Table.Td align="right">
                  <ActionIcon
                    variant="light"
                    color="red"
                    radius="xl"
                    onClick={() => handleRemoveItem(item.registerNumber)}
                    aria-label={`Remover ativo adicional ${item.description}`}
                  >
                    <Trash2 size={14} />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Box>

      {/* Mobile Card View */}
      <Box display={{ base: 'block', md: 'none' }} p="sm">
        {/* Add new item form */}
        <Card
          shadow="sm"
          p="md"
          radius="md"
          withBorder
          mb="sm"
          bg={formCardBackground}
        >
          <Stack gap="sm">
            <Title order={6} c={primaryTextColor}>
              Adicionar Ativo
            </Title>
            <Input
              name="description"
              onChange={handleChange}
              value={newExtraLending.description}
              placeholder="Descrição do ativo"
            />
            <Input
              name="registerNumber"
              onChange={handleChange}
              value={newExtraLending.registerNumber}
              placeholder="N° Patrimônio"
            />
            <Input
              name="serialNumber"
              onChange={handleChange}
              value={newExtraLending.serialNumber}
              placeholder="N° Série"
            />
            <Button
              variant="filled"
              color="blue"
              radius="md"
              onClick={handleAddExtraLending}
              leftSection={<Plus size={16} />}
              fullWidth
            >
              Adicionar Ativo
            </Button>
          </Stack>
        </Card>

        {/* Existing items */}
        {invertoryExtraLendings.map((item) => (
          <MobileExtraLendingCard
            key={item.registerNumber}
            item={item}
            primaryTextColor={primaryTextColor}
            secondaryTextColor={secondaryTextColor}
            cardBackground={cardBackground}
            onRemove={handleRemoveItem}
          />
        ))}
      </Box>
    </>
  )
}
