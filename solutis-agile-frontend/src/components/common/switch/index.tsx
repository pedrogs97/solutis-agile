import {
  Switch as MantineSwitch,
  type SwitchProps as MantineSwitchProps,
} from '@mantine/core'
import { Controller, useFormContext } from 'react-hook-form'

interface SwitchProps extends MantineSwitchProps {
  name: string
  label: string
}

export default function Switch({
  name,
  label,
  disabled = false,
}: Readonly<SwitchProps>) {
  const { control } = useFormContext()
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <MantineSwitch
          label={label}
          error={fieldState.error?.message}
          disabled={disabled}
          {...field}
          onChange={(event) => {
            field.onChange(event.target.checked)
          }}
          checked={field.value}
        />
      )}
    />
  )
}
