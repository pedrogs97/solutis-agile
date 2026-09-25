'use client'

import {
  ActionIcon,
  Autocomplete,
  Button,
  Card,
  Group,
  NumberInput,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  ThemeIcon,
  Title,
  Tooltip,
} from '@mantine/core'
import { Cpu, Eraser, Plus, RotateCcw, Trash2 } from 'lucide-react'
import type { FieldArrayWithId, UseFormReturn } from 'react-hook-form'

import type {
  AssetCatalogComponent,
  AssetEvaluationFormValues,
} from '@/types/AssetEvaluation'

interface ComponentsMatrixSectionProps {
  form: UseFormReturn<AssetEvaluationFormValues>
  catalogComponents?: AssetCatalogComponent[]
  componentFields?: FieldArrayWithId<AssetEvaluationFormValues, 'components', 'id'>[]
  onAddRow: () => void
  onRemoveRow: (index: number) => void
  onClearRow?: (index: number) => void
  onClearAll?: () => void
  readOnly?: boolean
}

const CONDITION_OPTIONS = ['Boa', 'Regular', 'Danificada', 'Inservível']

const DESTINATION_OPTIONS = [
  'Reaproveitamento interno',
  'Estoque',
  'Doação',
  'Reciclagem',
  'Descarte',
]

export function ComponentsMatrixSection({
  form,
  catalogComponents = [],
  componentFields,
  onAddRow,
  onRemoveRow,
  onClearRow,
  onClearAll,
  readOnly = false,
}: Readonly<ComponentsMatrixSectionProps>) {
  const { register, setValue, watch } = form
  const watchedComponents = watch('components') || []

  // Prioriza componentFields do useFieldArray (para chaves id estáveis) ou fallback para watch
  const itemsToRender = componentFields && componentFields.length > 0
    ? componentFields
    : watchedComponents

  const catalogSuggestions = catalogComponents.map((c) => c.name)

  const handleClearRow = (index: number) => {
    if (onClearRow) {
      onClearRow(index)
    } else {
      setValue(`components.${index}.name`, '')
      setValue(`components.${index}.quantity`, 1)
      setValue(`components.${index}.condition`, 'Boa')
      setValue(`components.${index}.destination`, 'Reaproveitamento interno')
      setValue(`components.${index}.observations`, '')
    }
  }

  return (
    <Card shadow="xs" radius="md" p="lg" withBorder>
      <Group justify="space-between" mb="md" wrap="wrap" gap="sm">
        <Group>
          <ThemeIcon size="lg" radius="md" color="teal" variant="light">
            <Cpu size={20} />
          </ThemeIcon>
          <div>
            <Title order={4}>3. Matriz de Reaproveitamento de Componentes</Title>
            <Text size="xs" c="dimmed">
              Mapeie peças utilizáveis para estoque de manutenção e reuso interno
            </Text>
          </div>
        </Group>

        {!readOnly && (
          <Group gap="xs">
            {itemsToRender.length > 0 && onClearAll && (
              <Button
                size="xs"
                variant="subtle"
                color="gray"
                leftSection={<Eraser size={14} />}
                onClick={onClearAll}
              >
                Limpar Matriz
              </Button>
            )}
            <Button
              size="xs"
              variant="light"
              color="teal"
              leftSection={<Plus size={16} />}
              onClick={onAddRow}
            >
              Adicionar Componente
            </Button>
          </Group>
        )}
      </Group>

      {itemsToRender.length === 0 ? (
        <Paper p="lg" radius="md" withBorder bg="var(--mantine-color-gray-0)" ta="center">
          <Stack align="center" gap="xs">
            <Cpu size={32} color="var(--mantine-color-gray-5)" />
            <Text size="sm" fw={500} c="dimmed">
              Nenhum componente cadastrado para reaproveitamento
            </Text>
            <Text size="xs" c="dimmed" maw={400}>
              Caso o ativo seja totalmente descartado sem reaproveitamento de peças, você pode deixar esta seção sem itens.
            </Text>
            {!readOnly && (
              <Button
                size="xs"
                variant="outline"
                color="teal"
                leftSection={<Plus size={14} />}
                onClick={onAddRow}
                mt="xs"
              >
                Adicionar Primeira Peça
              </Button>
            )}
          </Stack>
        </Paper>
      ) : (
        <Table.ScrollContainer minWidth={750}>
          <Table verticalSpacing="xs" striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ width: '30%' }}>Componente / Peça</Table.Th>
                <Table.Th style={{ width: '12%' }}>Qtd</Table.Th>
                <Table.Th style={{ width: '18%' }}>Condição</Table.Th>
                <Table.Th style={{ width: '20%' }}>Destino</Table.Th>
                <Table.Th style={{ width: '15%' }}>Observações</Table.Th>
                {!readOnly && <Table.Th style={{ width: '5%', textAlign: 'center' }}>Ações</Table.Th>}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {itemsToRender.map((item, index) => {
                const currentItem = watchedComponents[index] || item
                const rowKey = (item as any).id || `comp-row-${index}`
                return (
                  <Table.Tr key={rowKey}>
                    <Table.Td>
                      <Autocomplete
                        data={catalogSuggestions}
                        placeholder="Ex.: RAM 16GB, SSD 512GB, Fonte..."
                        value={currentItem.name || ''}
                        onChange={(val) => setValue(`components.${index}.name`, val)}
                        disabled={readOnly}
                      />
                    </Table.Td>

                    <Table.Td>
                      <NumberInput
                        min={1}
                        value={currentItem.quantity || 1}
                        onChange={(val) =>
                          setValue(`components.${index}.quantity`, Number(val) || 1)
                        }
                        disabled={readOnly}
                      />
                    </Table.Td>

                    <Table.Td>
                      <Select
                        data={CONDITION_OPTIONS}
                        value={currentItem.condition || 'Boa'}
                        onChange={(val) =>
                          setValue(`components.${index}.condition`, val || 'Boa')
                        }
                        disabled={readOnly}
                      />
                    </Table.Td>

                    <Table.Td>
                      <Select
                        data={DESTINATION_OPTIONS}
                        value={currentItem.destination || 'Reaproveitamento interno'}
                        onChange={(val) =>
                          setValue(
                            `components.${index}.destination`,
                            val || 'Reaproveitamento interno'
                          )
                        }
                        disabled={readOnly}
                      />
                    </Table.Td>

                    <Table.Td>
                      <TextInput
                        placeholder="Detalhes..."
                        {...register(`components.${index}.observations`)}
                        disabled={readOnly}
                      />
                    </Table.Td>

                    {!readOnly && (
                      <Table.Td>
                        <Group gap={4} justify="center" wrap="nowrap">
                          <Tooltip label="Limpar campos desta linha">
                            <ActionIcon
                              color="gray"
                              variant="subtle"
                              size="sm"
                              onClick={() => handleClearRow(index)}
                            >
                              <RotateCcw size={14} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Remover componente">
                            <ActionIcon
                              color="red"
                              variant="subtle"
                              size="sm"
                              onClick={() => onRemoveRow(index)}
                            >
                              <Trash2 size={14} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Table.Td>
                    )}
                  </Table.Tr>
                )
              })}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}
    </Card>
  )
}
