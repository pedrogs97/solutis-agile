import {
  CheckIcon,
  Combobox,
  type ComboboxItem,
  Group,
  Loader,
  Pill,
  PillsInput,
  type PillsInputFieldProps,
  useCombobox,
} from '@mantine/core'
import { useState } from 'react'
import { Controller } from 'react-hook-form'

type AsyncMultiselectProps = {
  name: string
  control: any
  options: ComboboxItem[]
  loading: boolean
  setSearch: (value: string) => void
  label: string
} & PillsInputFieldProps

export default function AsyncMultiselect({
  name,
  control,
  options,
  loading,
  setSearch,
  label,
  ...props
}: Readonly<AsyncMultiselectProps>) {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
    onDropdownOpen: () => combobox.updateSelectedOptionIndex('active'),
  })

  const [searchLocal, setSearchLocal] = useState('')
  const [selectedValues, setSelectedValues] = useState<ComboboxItem[]>([])

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const handleValueSelect = (value: string) => {
          if (selectedValues.map((v) => v.value).includes(value)) {
            setSelectedValues(selectedValues.filter((v) => v.value !== value))
            field.onChange(
              selectedValues.map((v) => v.value).filter((v) => v !== value),
            )
          } else {
            setSelectedValues([
              ...selectedValues,
              options.find((v) => v.value === value) as ComboboxItem,
            ])
            field.onChange([...selectedValues.map((v) => v.value), value])
          }
        }

        return (
          <Combobox
            store={combobox}
            onOptionSubmit={handleValueSelect}
            withinPortal={false}
          >
            <Combobox.DropdownTarget>
              <PillsInput onClick={() => combobox.openDropdown()} label={label}>
                <Pill.Group>
                  {loading && <Loader size={18} />}
                  {selectedValues.map((value) => (
                    <Pill
                      key={value.value}
                      withRemoveButton
                      onRemove={() => {
                        setSelectedValues(
                          selectedValues.filter((v) => v.value !== value.value),
                        )
                        field.onChange(
                          selectedValues
                            .map((v) => v.value)
                            .filter((v) => v !== value.value),
                        )
                      }}
                    >
                      {
                        selectedValues.find((v) => v.value === value.value)
                          ?.label
                      }
                    </Pill>
                  ))}

                  <Combobox.EventsTarget>
                    <PillsInput.Field
                      onFocus={() => combobox.openDropdown()}
                      onBlur={() => combobox.closeDropdown()}
                      value={searchLocal}
                      onChange={(event) => {
                        setSearchLocal(event.currentTarget.value)
                        setSearch(event.currentTarget.value)
                        combobox.updateSelectedOptionIndex()
                      }}
                      onKeyDown={(event) => {
                        if (
                          event.key === 'Backspace' &&
                          searchLocal.length === 0
                        ) {
                          event.preventDefault()
                          setSelectedValues(selectedValues.slice(0, -1))
                          field.onChange(selectedValues.slice(0, -1))
                        }
                      }}
                      {...props}
                    />
                  </Combobox.EventsTarget>
                </Pill.Group>
              </PillsInput>
            </Combobox.DropdownTarget>

            <Combobox.Dropdown>
              <Combobox.Options>
                {options?.length > 0 ? (
                  options?.map((option) => {
                    return (
                      <Combobox.Option
                        key={option.value}
                        value={option.value}
                        active={selectedValues
                          .map((v) => v.value)
                          .includes(option.value)}
                      >
                        <Group gap="sm">
                          {selectedValues
                            .map((v) => v.value)
                            .includes(option.value) ? (
                            <CheckIcon size={12} />
                          ) : null}
                          <span>{option.label}</span>
                        </Group>
                      </Combobox.Option>
                    )
                  })
                ) : (
                  <Combobox.Empty>
                    {loading
                      ? 'Carregando...'
                      : 'Nenhum resultado encontrado...'}
                  </Combobox.Empty>
                )}
              </Combobox.Options>
            </Combobox.Dropdown>
          </Combobox>
        )
      }}
    />
  )
}
