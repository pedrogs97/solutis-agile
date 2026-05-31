import {
  Input as MantineInput,
  type InputProps as MantineInputProps,
} from '@mantine/core'
import { Controller, useFormContext } from 'react-hook-form'
import { IMaskInput } from 'react-imask'

interface InputProps extends MantineInputProps {
  name: string
  label: string
  placeholder?: string
  mask?: string | { mask: string }[]
  component?: any
  type?: string
  readOnly?: boolean
  onAccept?: (value: string) => void
}

export default function Input({
  name,
  label,
  placeholder,
  disabled = false,
  mask,
  component,
  type = 'text',
  classNames,
  readOnly,
  ...props
}: Readonly<InputProps>) {
  const { control } = useFormContext()
  const isMaskedInput = component === IMaskInput

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const { onAccept, ...inputProps } = props
        const baseProps = {
          value: field.value ?? '',
          placeholder,
          error: fieldState.error?.message,
          disabled,
          component,
          mask,
          type,
          classNames,
          readOnly,
          ...inputProps,
        }

        return (
          <MantineInput.Wrapper label={label} error={fieldState.error?.message}>
            {isMaskedInput ? (
              <MantineInput
                {...baseProps}
                name={field.name}
                onBlur={field.onBlur}
                inputRef={field.ref}
                onAccept={(value: string) => {
                  field.onChange(value)
                  onAccept?.(value)
                }}
              />
            ) : (
              <MantineInput {...field} {...baseProps} />
            )}
          </MantineInput.Wrapper>
        )
      }}
    />
  )
}
