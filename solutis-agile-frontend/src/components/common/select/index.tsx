// RHFSelect.tsx
import { Select, type SelectProps } from '@mantine/core'
import { useMemo } from 'react'
import {
  type Control,
  Controller,
  type ControllerProps,
  useFormContext,
} from 'react-hook-form'

/** Mantine option shape (or plain string) */
type Option =
  | string
  | { value: string; label: string; disabled?: boolean; group?: string }

/** Accept readonly arrays and a unified { data, isLoading } shape */
type OptionsInput =
  | ReadonlyArray<Option>
  | { data?: ReadonlyArray<Option>; isLoading?: boolean }

export type RHFSelectProps = Omit<
  SelectProps,
  'data' | 'name' | 'error' | 'value' | 'onChange'
> & {
  /** RHF field name */
  name: string
  /** If you don't use FormProvider, pass form.control here */
  control?: Control<any>
  /** Back-compat + static arrays */
  data?: ReadonlyArray<Option>
  /** Unified options input (static array or { data, isLoading }) */
  options?: OptionsInput
  /** Loading override (merged with options.isLoading) */
  loading?: boolean
  /** Validation rules passed to RHF Controller */
  rules?: ControllerProps['rules']
  /** Format field value for Mantine Select */
  formatValue?: (value: any) => string | null
  /** Parse Mantine Select value into form state */
  parseValue?: (value: string | null) => any
}

function normalizeOptions(
  input?: OptionsInput,
  fallback?: ReadonlyArray<Option>,
) {
  if (!input) return { data: fallback ?? [], isLoading: false as boolean }
  if (Array.isArray(input)) return { data: input, isLoading: false as boolean }
  return {
    data: (input as any).data ?? fallback ?? [],
    isLoading: Boolean((input as any).isLoading),
  }
}

/** Safe hook: try to read context, fall back to undefined if not inside FormProvider */
function useOptionalFormContextControl(): Control<any> | undefined {
  try {
    // will throw if not wrapped in FormProvider
    return useFormContext()?.control
  } catch {
    return undefined
  }
}

export default function RHFSelect({
  name,
  control,
  data: dataProp,
  options,
  loading,
  rules,
  formatValue,
  parseValue,
  ...mantineProps
}: RHFSelectProps) {
  const ctxControl = useOptionalFormContextControl()
  const ctl = control ?? ctxControl
  if (!ctl) {
    if (import.meta.env.NODE_ENV !== 'production') {
      // Helpful dev message

      console.warn(
        `RHFSelect("${name}") is used outside FormProvider: pass control={form.control}`,
      )
    }
  }

  const { data, isLoading } = useMemo(
    () => normalizeOptions(options, dataProp),
    [options, dataProp],
  )

  // Convert readonly -> mutable for Mantine Select
  const mutableData = useMemo(() => Array.from(data) as Option[], [data])
  const effectiveLoading = Boolean(loading ?? isLoading)

  return (
    <Controller
      name={name}
      control={ctl}
      rules={rules}
      render={({ field, fieldState }) => (
        <Select
          {...mantineProps}
          data={mutableData}
          value={formatValue ? formatValue(field.value) : (field.value ?? null)}
          onChange={(val) => field.onChange(parseValue ? parseValue(val) : val)}
          onBlur={field.onBlur}
          name={field.name}
          error={fieldState.error?.message}
          disabled={mantineProps.disabled || effectiveLoading}
          rightSection={
            effectiveLoading ? (
              <span className="mantine-loading-dots" />
            ) : (
              mantineProps.rightSection
            )
          }
          clearable={mantineProps.clearable ?? true}
          searchable={mantineProps.searchable ?? true}
          nothingFoundMessage={mantineProps.nothingFoundMessage ?? 'No options'}
          allowDeselect
          checkIconPosition="right"
          withCheckIcon
        />
      )}
    />
  )
}
