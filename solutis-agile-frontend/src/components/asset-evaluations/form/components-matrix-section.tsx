'use client'

import {
  ActionIcon,
  Autocomplete,
  Button,
  Card,
  Group,
  NumberInput,
  Select,
  Table,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { Cpu, Plus, Trash2 } from 'lucide-react'
import { UseFormReturn } from 'react-hook-form'

import type {
  AssetCatalogComponent,
  AssetEvaluationFormValues,
} from '@/types/AssetEvaluation'

interface ComponentsMatrixSectionProps {
  form: UseFormReturn<AssetEvaluationFormValues>
  catalogComponents?: AssetCatalogComponent[]
  onAddRow: () => void
  onRemoveRow: (index: number) => void
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
  onAddRow,
  onRemoveRow,
  readOnly = false,
}: Readonly<ComponentsMatrixSectionProps>) {
  const { register, setValue, watch } = form
  const components = watch('components') || []

  const catalogSuggestions = catalogComponents.map((c) => c.name)

  return (
    <Card shadow="xs" radius="md" p="lg" withBorder>
      <Group justify="space-between" mb="md">
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
          <Button
            size="xs"
            variant="light"
            color="teal"
            leftSection={<Plus size={16} />}
            onClick={onAddRow}
          >
            Adicionar Componente
          </Button>
        )}
      </Group>

      <Table.ScrollContainer minWidth={700}>
        <Table verticalSpacing="xs" striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ width: '30%' }}>Componente / Peça</Table.Th>
              <Table.Th style={{ width: '12%' }}>Qtd</Table.Th>
              <Table.Th style={{ width: '18%' }}>Condição</Table.Th>
              <Table.Th style={{ width: '22%' }}>Destino</Table.Th>
              <Table.Th style={{ width: '18%' }}>Observações</Table.Th>
              {!readOnly && <Table.Th style={{ width: '5%' }}></Table.Th>}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {components.map((item, index) => (
              <Table.Tr key={index}>
                <Table.Td>
                  <Autocomplete
                    data={catalogSuggestions}
                    placeholder="Ex.: RAM 16GB, SSD 512GB, Fonte..."
                    value={item.name || ''}
                    onChange={(val) => setValue(`components.${index}.name`, val)}
                    disabled={readOnly}
                  />
                </Table.Td>

                <Table.Td>
                  <NumberInput
                    min={1}
                    value={item.quantity || 1}
                    onChange={(val) =>
                      setValue(`components.${index}.quantity`, Number(val) || 1)
                    }
                    disabled={readOnly}
                  />
                </Table.Td>

                <Table.Td>
                  <Select
                    data={CONDITION_OPTIONS}
                    value={item.condition || 'Boa'}
                    onChange={(val) =>
                      setValue(`components.${index}.condition`, val || 'Boa')
                    }
                    disabled={readOnly}
                  />
                </Table.Td>

                <Table.Td>
                  <Select
                    data={DESTINATION_OPTIONS}
                    value={item.destination || 'Reaproveitamento interno'}
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
                    <ActionIcon
                      color="red"
                      variant="subtle"
                      onClick={() => onRemoveRow(index)}
                      disabled={components.length <= 1}
                    >
                      <Trash2 size={16} />
                    </ActionIcon>
                  </Table.Td>
                )}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Card>
  )
}
