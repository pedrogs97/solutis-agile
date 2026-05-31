import { DateInput, type DateInputProps } from '@mantine/dates'
import { format, parse } from 'date-fns'
import { Controller, useFormContext } from 'react-hook-form'

interface DatePickerProps extends DateInputProps {
  name: string
  label: string
  placeholder?: string
  valueFormat: string
}

const normalizeDateValue = (value: unknown) => {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value === 'string') {
    const parsed = parse(value, 'dd/MM/yyyy', new Date())
    if (!Number.isNaN(parsed.getTime())) return parsed
    const fallback = new Date(value)
    return Number.isNaN(fallback.getTime()) ? null : fallback
  }
  return null
}

const toDateString = (value: unknown) => {
  if (!value) return ''
  const parsed = normalizeDateValue(value)
  return parsed ? format(parsed, 'dd/MM/yyyy') : ''
}

export default function DatePicker({
  name,
  label,
  placeholder,
  disabled = false,
  valueFormat,
  maxDate,
  classNames,
  ...props
}: Readonly<DatePickerProps>) {
  const { control } = useFormContext()
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <DateInput
          value={normalizeDateValue(field.value)}
          onChange={(date) => field.onChange(toDateString(date))}
          onBlur={field.onBlur}
          ref={field.ref}
          name={field.name}
          placeholder={placeholder}
          label={label}
          error={fieldState.error?.message}
          valueFormat={valueFormat}
          maxDate={maxDate}
          disabled={disabled}
          classNames={classNames}
          {...props}
        />
      )}
    />
  )
}
