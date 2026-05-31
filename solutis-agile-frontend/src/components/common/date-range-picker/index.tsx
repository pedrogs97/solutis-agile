import { DatePickerInput, type DatePickerInputProps } from '@mantine/dates'
import { useMemo } from 'react'
import { type Control, Controller, useFormContext } from 'react-hook-form'

type StoreAs = 'string-range' | 'date-range' | 'timestamp-range'

export type DateRangePickerProps = Omit<
  DatePickerInputProps<'range'>,
  'value' | 'onChange' | 'error' | 'name' | 'type'
> & {
  name: string
  control?: Control<any>
  /** How to store the value in RHF state (default: "string-range") */
  storeAs?: StoreAs
}

function useMaybeControl(): Control<any> | undefined {
  try {
    return useFormContext()?.control
  } catch {
    return undefined
  }
}

const toYMD = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const parseYMD = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

export function DateRangePicker({
  name,
  control,
  storeAs = 'string-range',
  ...mantineProps
}: DateRangePickerProps) {
  const ctxControl = useMaybeControl()
  const ctl = control ?? ctxControl

  return (
    <Controller
      name={name}
      control={ctl}
      render={({ field, fieldState }) => {
        // RHF -> Picker (expects [string|null, string|null] or null)
        const uiValue: [string | null, string | null] = useMemo(() => {
          const v = field.value
          if (!v) return [null, null]

          if (storeAs === 'string-range') {
            const [a, b] = v as [string | null, string | null]
            return [a ?? null, b ?? null]
          }

          if (storeAs === 'date-range') {
            const [a, b] = v as [Date | null, Date | null]
            return [a ? toYMD(a) : null, b ? toYMD(b) : null]
          }

          // timestamp-range
          const [a, b] = v as [number | null, number | null]
          return [
            a != null ? toYMD(new Date(a)) : null,
            b != null ? toYMD(new Date(b)) : null,
          ]
        }, [field.value, storeAs])

        // Picker -> RHF (convert tuple back to chosen storage)
        const handleChange = (value: [string | null, string | null] | null) => {
          if (!value) return field.onChange(null)
          const [a, b] = value

          if (storeAs === 'string-range')
            return field.onChange([a ?? null, b ?? null])

          if (storeAs === 'date-range') {
            return field.onChange([
              a ? parseYMD(a) : null,
              b ? parseYMD(b) : null,
            ] as [Date | null, Date | null])
          }

          // timestamp-range
          return field.onChange([
            a ? parseYMD(a).getTime() : null,
            b ? parseYMD(b).getTime() : null,
          ] as [number | null, number | null])
        }

        return (
          <DatePickerInput
            {...mantineProps}
            type="range"
            name={field.name}
            value={uiValue}
            onChange={handleChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            clearable={mantineProps.clearable ?? true}
          />
        )
      }}
    />
  )
}

export default DateRangePicker
