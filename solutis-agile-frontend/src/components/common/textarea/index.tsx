import {
  Textarea as MantineTextarea,
  type TextareaProps as MantineTextareaProps,
} from '@mantine/core'
import { Controller, useFormContext } from 'react-hook-form'

interface TextareaProps extends MantineTextareaProps {
  name: string
  label: string
  placeholder?: string
  maxLength?: number
  rows?: number
}

export default function Textarea({
  name,
  label,
  placeholder,
  disabled = false,
  maxLength,
  rows,
  ...props
}: Readonly<TextareaProps>) {
  const { control } = useFormContext()
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <MantineTextarea
          {...field}
          value={field.value ?? ''}
          label={label}
          placeholder={placeholder}
          error={fieldState.error?.message}
          disabled={disabled}
          maxLength={maxLength}
          rows={rows}
          {...props}
        />
      )}
    />
  )
}
