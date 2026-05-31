import {
  Box,
  Card,
  Grid,
  Group as MantineRadioGroup,
  Input as MantineInput,
  Radio as MantineRadio,
  Stack,
  Table,
  Text,
  Title,
  useMantineTheme,
} from '@mantine/core'
import { type ChangeEvent } from 'react'

import { useThemeColors } from '@/hooks/useThemeColors'
import {
  type InventoryTermItemsIncorrectInteface,
  type TermInventory,
  useInventoryStore,
} from '@/store/persisted/useInventoryStore'

import { ChipTable } from './chip-table/chip-table'
import { ClothingTable } from './clothing-table/clothing-table'
import { ToolsTable } from './tools-table/tools-table'

export function TableTerms() {
  const {
    addTermInventory,
    addTermIncorrect,
    inventoryTermItems,
    termIncorrects,
    inventory,
    removeTermIncorrect,
    updateTermIncorrect,
    updateTermInventory,
  } = useInventoryStore()

  const theme = useMantineTheme()
  const {
    colorScheme,
    getPrimaryTextColor,
    getSecondaryTextColor,
    getTableRowEvenBackgroundColor,
    getTableRowOddBackgroundColor,
  } = useThemeColors()

  const headerBackground = colorScheme === 'dark' ? 'dark.6' : 'gray.0'
  const borderColor =
    colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3]

  const toolsTableItems =
    inventory?.employee.terms.filter((term) => term.type === 'Ferramentas') ??
    []
  const clothingTableItems =
    inventory?.employee.terms.filter((term) => term.type === 'Fardamento') ?? []
  const chipTableItems =
    inventory?.employee.terms.filter((term) => term.type === 'Chip') ?? []

  const addOrUpdadeLendingInventory = (termId: number, toConfirm: boolean) => {
    const item = inventoryTermItems.find((item) => item.termId === termId)
    if (item) {
      updateTermInventory({ ...item, confirm: toConfirm }, termId)
    } else {
      addTermInventory({ termId, confirm: toConfirm, justification: '' })
    }
  }

  const handleChangeRadio = (value: string, term: TermInventory) => {
    const toConfirm = value === '1'
    if (toConfirm) {
      removeTermIncorrect(term.id)
      addOrUpdadeLendingInventory(term.id, toConfirm)
    } else {
      addTermIncorrect({
        id: term.id,
        description: term.description,
        confirm: false,
        justification: '',
      })
      addOrUpdadeLendingInventory(term.id, toConfirm)
    }
  }

  const onChangeJustification = (
    e: ChangeEvent<HTMLInputElement>,
    term: InventoryTermItemsIncorrectInteface,
  ) => {
    updateTermIncorrect({ ...term, justification: e.target.value }, term.id)
    addOrUpdadeLendingInventory(term.id, false)
  }

  // Mobile card view for incorrect items
  const MobileIncorrectCard = ({
    term,
  }: {
    term: InventoryTermItemsIncorrectInteface
  }) => (
    <Card
      shadow="sm"
      p="md"
      radius="md"
      withBorder
      mb="sm"
      bg={colorScheme === 'dark' ? 'dark.6' : 'orange.0'}
    >
      <Stack gap="sm">
        <Title order={6} c={getPrimaryTextColor()}>
          {term.description}
        </Title>
        <Box>
          <Text size="xs" c={getSecondaryTextColor()}>
            Tipo de Contrato
          </Text>
          <Text size="sm" fw={500} c={getPrimaryTextColor()}>
            Termo de Responsabilidade
          </Text>
        </Box>
        <Box>
          <Text size="sm" fw={500} mb="xs" c={getPrimaryTextColor()}>
            As informações estão corretas?
          </Text>
          <MantineRadioGroup>
            <MantineRadio size="xs" label="Sim" variant="outline" disabled />
            <MantineRadio
              size="xs"
              label="Não"
              variant="outline"
              disabled
              checked
            />
          </MantineRadioGroup>
        </Box>
        <Box>
          <Text size="sm" fw={500} mb="xs" c={getPrimaryTextColor()}>
            Justificativa
          </Text>
          <MantineInput
            placeholder="Justificativa"
            value={term.justification}
            onChange={(e) => onChangeJustification(e, term)}
          />
        </Box>
      </Stack>
    </Card>
  )

  return (
    <>
      <Text ta="start" c={getPrimaryTextColor()} pl={24} size="md" fw={700}>
        Termo de Responsabilidade
      </Text>
      <Grid p={8}>
        <Stack gap="md" w="100%">
          {toolsTableItems.length > 0 && (
            <ToolsTable
              inventoryToolsTerms={toolsTableItems}
              handleChangeRadio={handleChangeRadio}
            />
          )}
          {clothingTableItems.length > 0 && (
            <ClothingTable
              inventoryToolsTerms={clothingTableItems}
              handleChangeRadio={handleChangeRadio}
            />
          )}
          {chipTableItems.length > 0 && (
            <ChipTable
              inventoryToolsTerms={chipTableItems}
              handleChangeRadio={handleChangeRadio}
            />
          )}
        </Stack>
      </Grid>
      <Grid p={8} mt={40}>
        <Stack gap="xs" mb={30}>
          <Text ta="start" c={getPrimaryTextColor()} pl={24} size="md" fw={700}>
            Informações incorretas
          </Text>
          <Text
            ta="start"
            c={getSecondaryTextColor()}
            pl={24}
            size="sm"
            fw={400}
          >
            Insira as informações acerca do item incorreto
          </Text>
        </Stack>

        {/* Desktop Table View for Incorrect Items */}
        <Box display={{ base: 'none', md: 'block' }}>
          <Table highlightOnHover withTableBorder>
            <Table.Thead style={{ borderBottomColor: borderColor }}>
              <Table.Tr bg={headerBackground}>
                <Table.Td>DESCRIÇÃO DO ATIVO</Table.Td>
                <Table.Td>TIPO DE CONTRATO</Table.Td>
                <Table.Td>JUSTIFICATIVA</Table.Td>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {termIncorrects.map((term, index) => (
                <Table.Tr
                  key={term.id}
                  bg={
                    index % 2 === 0
                      ? getTableRowEvenBackgroundColor()
                      : getTableRowOddBackgroundColor()
                  }
                >
                  <Table.Td>{term.description}</Table.Td>
                  <Table.Td>
                    <MantineRadioGroup>
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
                    </MantineRadioGroup>
                  </Table.Td>
                  <Table.Td>
                    <MantineInput
                      placeholder="Justificativa"
                      value={term.justification}
                      onChange={(e) => onChangeJustification(e, term)}
                    />
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Box>

        {/* Mobile Card View for Incorrect Items */}
        <Box display={{ base: 'block', md: 'none' }} p="sm">
          {termIncorrects.map((term) => (
            <MobileIncorrectCard key={term.id} term={term} />
          ))}
        </Box>
      </Grid>
    </>
  )
}
