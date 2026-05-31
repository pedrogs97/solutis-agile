import {
  type ComboboxItem,
  Loader,
  MultiSelect as MantineMultiSelect,
  type MultiSelectProps as MantineMultiSelectProps,
} from '@mantine/core'
import {
  type FieldValues,
  useController,
  type UseControllerProps,
} from 'react-hook-form'

export type MultiSelectProps<T extends FieldValues> = UseControllerProps<T> &
  Omit<MantineMultiSelectProps, 'value' | 'defaultValue'> & {
    isLoading?: boolean
    onSearchChange?: (value: string) => void
    onOptionsSelected?: (options: ComboboxItem[]) => void | undefined
  }

export default function MultiSelect<T extends FieldValues>({
  name,
  control,
  defaultValue,
  rules,
  shouldUnregister,
  onChange,
  ...props
}: MultiSelectProps<T>) {
  const {
    field: { value, onChange: fieldOnChange, ...field },
    fieldState,
  } = useController<T>({
    name,
    control,
    defaultValue,
    rules,
    shouldUnregister,
  })

  const noResults = props.data ? undefined : 'Nenhum resultado encontrado'
  const nothingFoundMessage = () => (
    <div>{props.isLoading ? 'Carregando...' : noResults}</div>
  )

  return (
    <MantineMultiSelect
      value={props.isLoading ? [] : value}
      onChange={(value: string[]) => {
        const options = props.data?.filter((option: any) =>
          value.includes(option.value),
        ) as ComboboxItem[]
        props.onOptionsSelected && props.onOptionsSelected(options)
        fieldOnChange(value)
        onChange?.(value)
      }}
      leftSection={props.isLoading && <Loader color="blue" size="xs" />}
      disabled={props.isLoading}
      searchable
      withScrollArea
      onSearchChange={(value) => {
        props.onSearchChange && props.onSearchChange(value)
      }}
      nothingFoundMessage={nothingFoundMessage()}
      error={fieldState.error?.message}
      {...field}
      {...props}
    />
  )
}
