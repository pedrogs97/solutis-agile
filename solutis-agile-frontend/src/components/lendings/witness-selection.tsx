import { Grid, Text } from '@mantine/core'

import AsyncSelect, { type Option } from '@/components/common/async-select'
import { ReadOnlyField } from '@/components/common/read-only-field'

interface WitnessSelectionProps {
  readOnly?: boolean
  fetcher?: (search: string) => Promise<Array<{ label: string; value: string }>>
  witness1Name?: string
  witness2Name?: string
  witness1Value?: string
  witness2Value?: string
  // Initial options for draft restoration
  witness1InitialOptions?: Option[]
  witness2InitialOptions?: Option[]
  // Callbacks for metadata persistence
  onWitness1Select?: (option: Option | null) => void
  onWitness2Select?: (option: Option | null) => void
}

export function WitnessSelection({
  readOnly = false,
  fetcher,
  witness1Name = 'witnessesId.0',
  witness2Name = 'witnessesId.1',
  witness1Value,
  witness2Value,
  witness1InitialOptions,
  witness2InitialOptions,
  onWitness1Select,
  onWitness2Select,
}: WitnessSelectionProps) {
  if (readOnly) {
    return (
      <>
        <Grid.Col span={{ base: 5, xs: 4 }}>
          <ReadOnlyField label="Testemunha 1" value={witness1Value} />
        </Grid.Col>
        <Grid.Col span={{ base: 5, xs: 4 }}>
          <ReadOnlyField label="Testemunha 2" value={witness2Value} />
        </Grid.Col>
      </>
    )
  }

  if (!fetcher) {
    console.error(
      '[WitnessSelection] Missing "fetcher" prop while readOnly=false',
    )
    return (
      <Grid.Col span={12}>
        <Text c="red" size="sm">
          Não foi possível carregar o seletor de testemunhas. Atualize a página
          e tente novamente.
        </Text>
      </Grid.Col>
    )
  }

  return (
    <>
      <Grid.Col span={{ base: 5, xs: 4 }}>
        <AsyncSelect
          name={witness1Name}
          label="Testemunha 1"
          placeholder="Selecione a testemunha 1"
          fetcher={fetcher}
          initialOptions={witness1InitialOptions}
          onOptionSelect={onWitness1Select}
          debounceMs={2000}
          minChars={2}
          preloadOnOpen
        />
      </Grid.Col>
      <Grid.Col span={{ base: 5, xs: 4 }}>
        <AsyncSelect
          name={witness2Name}
          label="Testemunha 2"
          placeholder="Selecione a testemunha 2"
          fetcher={fetcher}
          initialOptions={witness2InitialOptions}
          onOptionSelect={onWitness2Select}
          debounceMs={2000}
          minChars={2}
          preloadOnOpen
        />
      </Grid.Col>
    </>
  )
}
