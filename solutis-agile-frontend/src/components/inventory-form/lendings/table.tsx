import {
  Box,
  Card,
  Grid,
  Group as MantineGroup,
  Input as MantineInput,
  Radio as MantineRadio,
  ScrollArea,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
  useMantineTheme,
} from '@mantine/core'
import { type ChangeEvent } from 'react'

import { useThemeColors } from '@/hooks/useThemeColors'
import {
  type InventoryLendingItemsIncorrectInteface,
  type LendingInventory,
  useInventoryStore,
} from '@/store/persisted/useInventoryStore'

interface MobileLendingCardProps {
  readonly lending: LendingInventory
  readonly accentColor: string
  readonly primaryTextColor: string
  readonly secondaryTextColor: string
  readonly cardBackground: string
  readonly radioValue: string
  readonly onRadioChange: (value: string) => void
  readonly incorrectItem?: InventoryLendingItemsIncorrectInteface
  readonly onJustificationChange: (value: string) => void
}

function MobileLendingCard({
  lending,
  accentColor,
  primaryTextColor,
  secondaryTextColor,
  cardBackground,
  radioValue,
  onRadioChange,
  incorrectItem,
  onJustificationChange,
}: Readonly<MobileLendingCardProps>) {
  return (
    <Card shadow="sm" p="md" radius="md" withBorder mb="sm" bg={cardBackground}>
      <Stack gap="sm">
        <Title order={6} c={primaryTextColor}>
          {lending.assetDescription}
        </Title>
        <SimpleGrid cols={2} spacing="xs">
          <Box>
            <Text size="xs" c={secondaryTextColor}>
              Patrimônio
            </Text>
            <Text size="sm" fw={500} c={primaryTextColor}>
              {lending.registerNumber}
            </Text>
          </Box>
          <Box>
            <Text size="xs" c={secondaryTextColor}>
              Série
            </Text>
            <Text size="sm" fw={500} c={primaryTextColor}>
              {lending.serialNumber}
            </Text>
          </Box>
          <Box>
            <Text size="xs" c={secondaryTextColor}>
              Executivo
            </Text>
            <Text size="sm" fw={500} c={primaryTextColor}>
              {lending.executive}
            </Text>
          </Box>
          <Box>
            <Text size="xs" c={secondaryTextColor}>
              Lotação
            </Text>
            <Text size="sm" fw={500} c={primaryTextColor}>
              {lending.location}
            </Text>
          </Box>
          <Box>
            <Text size="xs" c={secondaryTextColor}>
              Centro de Custo
            </Text>
            <Text size="sm" fw={500} c={primaryTextColor}>
              {lending.costCenter}
            </Text>
          </Box>
          <Box>
            <Text size="xs" c={secondaryTextColor}>
              BU
            </Text>
            <Text size="sm" fw={500} c={primaryTextColor}>
              {lending.bu}
            </Text>
          </Box>
          <Box>
            <Text size="xs" c={secondaryTextColor}>
              Office
            </Text>
            <Text size="sm" fw={500} c={primaryTextColor}>
              {lending.msOffice ? 'Sim' : 'Não'}
            </Text>
          </Box>
        </SimpleGrid>
        <Box>
          <Text size="sm" fw={500} mb="xs" c={primaryTextColor}>
            As informações estão corretas?
          </Text>
          <MantineRadio.Group
            color={accentColor}
            onChange={onRadioChange}
            variant="outline"
            value={radioValue}
          >
            <MantineGroup gap="xs">
              <MantineRadio size="xs" label="Sim" value="1" variant="outline" />
              <MantineRadio size="xs" label="Não" value="0" variant="outline" />
            </MantineGroup>
          </MantineRadio.Group>
        </Box>
        {incorrectItem && (
          <Box>
            <Text size="sm" fw={500} mb="xs" c={primaryTextColor}>
              Justificativa
            </Text>
            <MantineInput
              placeholder="Justificativa"
              value={incorrectItem.justification}
              onChange={(event) =>
                onJustificationChange(event.currentTarget.value)
              }
            />
          </Box>
        )}
      </Stack>
    </Card>
  )
}

interface MobileIncorrectCardProps {
  readonly lending: InventoryLendingItemsIncorrectInteface
  readonly primaryTextColor: string
  readonly cardBackground: string
  readonly onJustificationChange: (value: string) => void
}

function MobileIncorrectCard({
  lending,
  primaryTextColor,
  cardBackground,
  onJustificationChange,
}: Readonly<MobileIncorrectCardProps>) {
  return (
    <Card shadow="sm" p="md" radius="md" withBorder mb="sm" bg={cardBackground}>
      <Stack gap="sm">
        <Title order={6} c={primaryTextColor}>
          {lending.assetDescription}
        </Title>
        <Box>
          <Text size="sm" fw={500} mb="xs" c={primaryTextColor}>
            As informações estão corretas?
          </Text>
          <MantineGroup gap="xs">
            <MantineRadio size="xs" label="Sim" variant="outline" disabled />
            <MantineRadio
              size="xs"
              label="Não"
              variant="outline"
              disabled
              checked
            />
          </MantineGroup>
        </Box>
        <Box>
          <Text size="sm" fw={500} mb="xs" c={primaryTextColor}>
            Justificativa
          </Text>
          <MantineInput
            placeholder="Justificativa"
            value={lending.justification}
            onChange={(event) =>
              onJustificationChange(event.currentTarget.value)
            }
          />
        </Box>
      </Stack>
    </Card>
  )
}

export function TableLendings() {
  const {
    addLendingInventory,
    addLendingIncorrect,
    inventoryLendingItems,
    lendingIncorrects,
    inventory,
    removeLendingIncorrect,
    updateLendingIncorrect,
    updateLendingInventory,
  } = useInventoryStore()

  const theme = useMantineTheme()
  const {
    colorScheme,
    getCardBackgroundColor,
    getPrimaryTextColor,
    getSecondaryTextColor,
    getTableRowEvenBackgroundColor,
    getTableRowOddBackgroundColor,
  } = useThemeColors()

  const lendings = inventory?.employee?.lendings ?? []
  const headerBackground = colorScheme === 'dark' ? 'dark.6' : 'gray.0'
  const borderColor =
    colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3]
  const accentColor = theme.primaryColor ?? 'blue'
  const cardBackground = getCardBackgroundColor()
  const incorrectCardBackground = colorScheme === 'dark' ? 'dark.6' : 'orange.0'
  const primaryTextColor = getPrimaryTextColor()
  const secondaryTextColor = getSecondaryTextColor()

  const addOrUpdadeLendingInventory = (
    lendingId: number,
    toConfirm: boolean,
    justification: string = '',
  ) => {
    const item = inventoryLendingItems.find(
      (entry) => entry.lendingId === lendingId,
    )
    if (item) {
      updateLendingInventory(
        { ...item, confirm: toConfirm, justification },
        lendingId,
      )
    } else {
      addLendingInventory({ lendingId, confirm: toConfirm, justification })
    }
  }

  const updateJustificationValue = (
    lending: InventoryLendingItemsIncorrectInteface,
    justification: string,
  ) => {
    updateLendingIncorrect({ ...lending, justification }, lending.id)
    addOrUpdadeLendingInventory(lending.id, false, justification)
  }

  const handleChangeRadio = (value: string, lending: LendingInventory) => {
    const toConfirm = value === '1'
    if (toConfirm) {
      removeLendingIncorrect(lending.id)
      addOrUpdadeLendingInventory(lending.id, toConfirm)
    } else {
      addLendingIncorrect({
        id: lending.id,
        assetDescription: lending.assetDescription,
        confirm: false,
        justification: '',
      })
      addOrUpdadeLendingInventory(lending.id, toConfirm)
    }
  }

  const onChangeJustification = (
    event: ChangeEvent<HTMLInputElement>,
    lending: InventoryLendingItemsIncorrectInteface,
  ) => {
    updateJustificationValue(lending, event.target.value)
  }

  return (
    <>
      <Text ta="start" c={primaryTextColor} pl={24} size="md" fw={700}>
        Comodatos
      </Text>

      {/* Desktop */}
      <Box display={{ base: 'none', md: 'block' }}>
        <Grid p={8}>
          <ScrollArea>
            <Table withTableBorder highlightOnHover miw={800}>
              <Table.Thead style={{ borderBottomColor: borderColor }}>
                <Table.Tr bg={headerBackground}>
                  <Table.Td>DESCRIÇÃO DO ATIVO</Table.Td>
                  <Table.Td>N° PATRIMÔNIO</Table.Td>
                  <Table.Td>EXECUTIVO</Table.Td>
                  <Table.Td>LOTAÇÃO</Table.Td>
                  <Table.Td>CENTRO DE CUSTO</Table.Td>
                  <Table.Td>BU</Table.Td>
                  <Table.Td>N° SERIE</Table.Td>
                  <Table.Td>PACOTE OFFICE</Table.Td>
                  <Table.Td>AS INFORMAÇÕES ESTÃO CORRETAS</Table.Td>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {lendings.map((lending, index) => {
                  const selection = inventoryLendingItems.find(
                    (entry) => entry.lendingId === lending.id,
                  )
                  let radioValue = '1'
                  if (selection) {
                    radioValue = selection.confirm ? '1' : '0'
                  }

                  return (
                    <Table.Tr
                      key={lending.id}
                      bg={
                        index % 2 === 0
                          ? getTableRowEvenBackgroundColor()
                          : getTableRowOddBackgroundColor()
                      }
                    >
                      <Table.Td>{lending.assetDescription}</Table.Td>
                      <Table.Td>{lending.registerNumber}</Table.Td>
                      <Table.Td>{lending.executive}</Table.Td>
                      <Table.Td>{lending.location}</Table.Td>
                      <Table.Td>{lending.costCenter}</Table.Td>
                      <Table.Td>{lending.bu}</Table.Td>
                      <Table.Td>{lending.serialNumber}</Table.Td>
                      <Table.Td>{lending.msOffice ? 'Sim' : 'Não'}</Table.Td>
                      <Table.Td>
                        <MantineRadio.Group
                          color={accentColor}
                          style={{ maxWidth: '65%' }}
                          onChange={(value) =>
                            handleChangeRadio(value, lending)
                          }
                          variant="outline"
                          value={radioValue}
                        >
                          <MantineGroup gap="xs">
                            <MantineRadio
                              size="xs"
                              label="Sim"
                              value="1"
                              variant="outline"
                            />
                            <MantineRadio
                              size="xs"
                              label="Não"
                              value="0"
                              variant="outline"
                            />
                          </MantineGroup>
                        </MantineRadio.Group>
                      </Table.Td>
                    </Table.Tr>
                  )
                })}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Grid>
      </Box>

      {/* Mobile */}
      <Box display={{ base: 'block', md: 'none' }} p="sm">
        {lendings.map((lending) => {
          const currentSelection = inventoryLendingItems.find(
            (entry) => entry.lendingId === lending.id,
          )
          const incorrectItem = lendingIncorrects.find(
            (entry) => entry.id === lending.id,
          )
          let radioValue = '1'
          if (currentSelection) {
            radioValue = currentSelection.confirm ? '1' : '0'
          }

          return (
            <MobileLendingCard
              key={lending.id}
              lending={lending}
              accentColor={accentColor}
              primaryTextColor={primaryTextColor}
              secondaryTextColor={secondaryTextColor}
              cardBackground={cardBackground}
              radioValue={radioValue}
              onRadioChange={(value) => handleChangeRadio(value, lending)}
              incorrectItem={incorrectItem}
              onJustificationChange={(value) => {
                if (incorrectItem) {
                  updateJustificationValue(incorrectItem, value)
                }
              }}
            />
          )
        })}
      </Box>

      <Grid p={8} mt={40}>
        <Stack gap="xs" mb={30}>
          <Text ta="start" c={primaryTextColor} pl={24} size="md" fw={700}>
            Informações incorretas
          </Text>
          <Text ta="start" c={secondaryTextColor} pl={24} size="sm" fw={400}>
            Insira as informações acerca do item incorreto
          </Text>
        </Stack>

        {/* Desktop incorrect list */}
        <Box display={{ base: 'none', md: 'block' }}>
          <Table highlightOnHover withTableBorder>
            <Table.Thead style={{ borderBottomColor: borderColor }}>
              <Table.Tr bg={headerBackground}>
                <Table.Td>DESCRIÇÃO DO ATIVO</Table.Td>
                <Table.Td>AS INFORMAÇÕES ESTÃO CORRETAS</Table.Td>
                <Table.Td>JUSTIFICATIVA</Table.Td>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {lendingIncorrects.map((lending, index) => (
                <Table.Tr
                  key={lending.id}
                  bg={
                    index % 2 === 0
                      ? getTableRowEvenBackgroundColor()
                      : getTableRowOddBackgroundColor()
                  }
                >
                  <Table.Td>{lending.assetDescription}</Table.Td>
                  <Table.Td>
                    <MantineGroup gap="xs">
                      <MantineRadio
                        size="xs"
                        label="Sim"
                        variant="outline"
                        disabled
                      />
                      <MantineRadio
                        size="xs"
                        label="Não"
                        variant="outline"
                        disabled
                        checked
                      />
                    </MantineGroup>
                  </Table.Td>
                  <Table.Td>
                    <MantineInput
                      placeholder="Justificativa"
                      value={lending.justification}
                      onChange={(event) =>
                        onChangeJustification(event, lending)
                      }
                    />
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Box>

        {/* Mobile incorrect list */}
        <Box display={{ base: 'block', md: 'none' }} p="sm">
          {lendingIncorrects.map((lending) => (
            <MobileIncorrectCard
              key={lending.id}
              lending={lending}
              primaryTextColor={primaryTextColor}
              cardBackground={incorrectCardBackground}
              onJustificationChange={(value) =>
                updateJustificationValue(lending, value)
              }
            />
          ))}
        </Box>
      </Grid>
    </>
  )
}
