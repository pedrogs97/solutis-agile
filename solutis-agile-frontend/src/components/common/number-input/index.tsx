import {
  NumberInput as MantineNumberInput,
  type NumberInputProps as MantineNumberInputProps,
} from '@mantine/core'
import {
  Controller,
  type RegisterOptions,
  useFormContext,
} from 'react-hook-form'

interface NumberInputProps extends MantineNumberInputProps {
  name: string
  label: string
  placeholder?: string
  preffix?: string
  decimalScale?: number
  allowDecimal?: boolean
  thousandSeparator?: string
  rules?: RegisterOptions
}

export default function NumberInput({
  name,
  label,
  placeholder,
  preffix,
  decimalScale,
  allowDecimal,
  thousandSeparator,
  rules,
  disabled = false,
  ...props
}: Readonly<NumberInputProps>) {
  const { control } = useFormContext()
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <MantineNumberInput
          label={label}
          placeholder={placeholder}
          error={fieldState.error?.message}
          hideControls
          prefix={preffix ?? 'R$ '}
          allowNegative={false}
          decimalScale={decimalScale ?? 2}
          allowDecimal={allowDecimal ?? true}
          decimalSeparator=","
          thousandSeparator={thousandSeparator ?? '.'}
          disabled={disabled}
          {...field}
          {...props}
        />
      )}
    />
  )
}
