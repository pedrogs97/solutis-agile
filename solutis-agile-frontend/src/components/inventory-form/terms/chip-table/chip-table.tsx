import {
  Box,
  Card,
  Group as MantineRadioGroup,
  Radio as MantineRadio,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
  useMantineTheme,
} from '@mantine/core'

import { useThemeColors } from '@/hooks/useThemeColors'
import { type TermInventory } from '@/store/persisted/useInventoryStore'

interface MobileChipCardProps {
  readonly term: TermInventory
  readonly accentColor: string
  readonly primaryTextColor: string
  readonly secondaryTextColor: string
  readonly cardBackground: string
  readonly handleChangeRadio: (value: string, term: TermInventory) => void
}

function MobileChipCardComponent({
  term,
  accentColor,
  primaryTextColor,
  secondaryTextColor,
  cardBackground,
  handleChangeRadio,
}: Readonly<MobileChipCardProps>) {
  return (
    <Card shadow="sm" p="md" radius="md" withBorder mb="sm" bg={cardBackground}>
      <Stack gap="sm">
        <Title order={6} c={primaryTextColor}>
          {term.description}
        </Title>
        <SimpleGrid cols={2} spacing="xs">
          <Box>
            <Text size="xs" c={secondaryTextColor}>
              Tipo
            </Text>
            <Text size="sm" fw={500} c={primaryTextColor}>
              {term.type}
            </Text>
          </Box>
          {Boolean(term.operator) && (
            <Box>
              <Text size="xs" c={secondaryTextColor}>
                Operadora
              </Text>
              <Text size="sm" fw={500} c={primaryTextColor}>
                {term.operator}
              </Text>
            </Box>
          )}
          {Boolean(term.lineNumber) && (
            <Box>
              <Text size="xs" c={secondaryTextColor}>
                Linha
              </Text>
              <Text size="sm" fw={500} c={primaryTextColor}>
                {term.lineNumber}
              </Text>
            </Box>
          )}
          {Boolean(term.value) && (
            <Box>
              <Text size="xs" c={secondaryTextColor}>
                Valor
              </Text>
              <Text size="sm" fw={500} c={primaryTextColor}>
                R$ {term.value?.toFixed(2)}
              </Text>
            </Box>
          )}
        </SimpleGrid>
        <Box>
          <Text size="sm" fw={500} mb="xs" c={primaryTextColor}>
            As informações estão corretas?
          </Text>
          <MantineRadio.Group
            color={accentColor}
            onChange={(value) => handleChangeRadio(value, term)}
            variant="outline"
            defaultValue="1"
          >
            <MantineRadioGroup>
              <MantineRadio size="xs" label="Sim" value="1" variant="outline" />
              <MantineRadio size="xs" label="Não" value="0" variant="outline" />
            </MantineRadioGroup>
          </MantineRadio.Group>
        </Box>
      </Stack>
    </Card>
  )
}

interface ChipTableProps {
  readonly inventoryToolsTerms: TermInventory[]
  handleChangeRadio: (value: string, term: TermInventory) => void
}

export function ChipTable({
  inventoryToolsTerms: _inventoryToolsTerms,
  handleChangeRadio,
}: Readonly<ChipTableProps>) {
  const theme = useMantineTheme()
  const {
    colorScheme,
    getCardBackgroundColor,
    getPrimaryTextColor,
    getSecondaryTextColor,
    getTableRowEvenBackgroundColor,
    getTableRowOddBackgroundColor,
  } = useThemeColors()

  const headerBackground = colorScheme === 'dark' ? 'dark.6' : 'gray.0'
  const borderColor =
    colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3]
  const accentColor = theme.primaryColor ?? 'blue'
  const primaryTextColor = getPrimaryTextColor()
  const secondaryTextColor = getSecondaryTextColor()
  const cardBackground = getCardBackgroundColor()

  return (
    <>
      <Text ta="start" c={primaryTextColor} pl={24} size="sm" fw={600} mb="md">
        Chips
      </Text>

      {/* Desktop Table View */}
      <Box display={{ base: 'none', md: 'block' }}>
        <Table withTableBorder highlightOnHover>
          <Table.Thead style={{ borderBottomColor: borderColor }}>
            <Table.Tr bg={headerBackground}>
              <Table.Td>DESCRIÇÃO DO ATIVO</Table.Td>
              <Table.Td>TIPO DE CONTRATO</Table.Td>
              <Table.Td>AS INFORMAÇÕES ESTÃO CORRETAS</Table.Td>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {_inventoryToolsTerms.map((term, index) => (
              <Table.Tr
                key={term.id}
                bg={
                  index % 2 === 0
                    ? getTableRowEvenBackgroundColor()
                    : getTableRowOddBackgroundColor()
                }
              >
                <Table.Td>{term.description}</Table.Td>
                <Table.Td>{term.type}</Table.Td>
                <Table.Td>
                  <MantineRadio.Group
                    color={accentColor}
                    style={{ maxWidth: '65%' }}
                    onChange={(value) => handleChangeRadio(value, term)}
                    variant="outline"
                  >
                    <MantineRadioGroup>
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
                    </MantineRadioGroup>
                  </MantineRadio.Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Box>

      {/* Mobile Card View */}
      <Box display={{ base: 'block', md: 'none' }} p="sm">
        {_inventoryToolsTerms.map((term) => (
          <MobileChipCardComponent
            key={term.id}
            term={term}
            accentColor={accentColor}
            primaryTextColor={primaryTextColor}
            secondaryTextColor={secondaryTextColor}
            cardBackground={cardBackground}
            handleChangeRadio={handleChangeRadio}
          />
        ))}
      </Box>
    </>
  )
}
