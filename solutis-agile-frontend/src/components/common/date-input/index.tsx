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
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === 'string') {
    const ymdMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (ymdMatch) {
      return new Date(
        parseInt(ymdMatch[1], 10),
        parseInt(ymdMatch[2], 10) - 1,
        parseInt(ymdMatch[3], 10),
        12,
        0,
        0
      )
    }
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
