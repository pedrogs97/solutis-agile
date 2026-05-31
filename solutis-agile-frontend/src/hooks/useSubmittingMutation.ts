import { notifications } from '@mantine/notifications'
import {
  useMutation,
  type UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { type UseFormReturn } from 'react-hook-form'

import { normalizeApiErrors } from '@/lib/api-errors'
import { type ErrorResponse } from '@/types/ApiResponse'

interface UseSubmittingMutationOptions<
  TData,
  TError,
  TVariables,
  TContext,
> extends Omit<
  UseMutationOptions<TData, TError, TVariables, TContext>,
  'onError' | 'onSuccess'
> {
  form?: UseFormReturn<any>
  successMessage?: string | null
  errorMessage?: string
  successColor?: string
  invalidateQueryKeys?: string[]
  onSuccess?: (
    data: TData,
    variables: TVariables,
    context: TContext | undefined,
  ) => void | Promise<void>
  onError?: (
    error: TError,
    variables: TVariables,
    context: TContext | undefined,
  ) => void | Promise<void>
  onSettled?: (
    data: TData | undefined,
    error: TError | null,
    variables: TVariables,
    context: TContext | undefined,
  ) => void | Promise<void>
}

/**
 * Custom hook that wraps useMutation to handle common boilerplate:
 * - Manages isSubmitting state
 * - Maps backend errors to form fields
 * - Shows consistent notifications
 * - Invalidates queries on success
 */
export function useSubmittingMutation<
  TData = unknown,
  TError = AxiosError<ErrorResponse[]>,
  TVariables = void,
  TContext = unknown,
>({
  form,
  successMessage = 'Operação realizada com sucesso',
  errorMessage = 'Ocorreu um erro ao realizar a operação',
  successColor = 'green',
  invalidateQueryKeys = [],
  onSuccess,
  onError,
  onSettled,
  ...mutationOptions
}: UseSubmittingMutationOptions<TData, TError, TVariables, TContext>) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    ...mutationOptions,
    onSuccess: async (data, variables, context) => {
      // Show success notification
      if (successMessage) {
        notifications.show({
          title: 'Sucesso',
          message: successMessage,
          color: successColor,
          autoClose: 5000,
        })
      }

      // Invalidate specified queries
      if (invalidateQueryKeys.length > 0) {
        invalidateQueryKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: [key] })
        })
      }

      // Call custom onSuccess handler
      if (onSuccess) {
        await onSuccess(data, variables, context)
      }
    },
    onError: (error: TError, variables, context) => {
      const normalizedErrors =
        error instanceof AxiosError
          ? normalizeApiErrors(error.response?.data)
          : []

      // Handle form errors if form is provided
      if (form && normalizedErrors.length > 0) {
        normalizedErrors.forEach(({ field, error: fieldErrorMessage }) => {
          if (field === 'general') return
          form.setError(field as any, {
            type: 'custom',
            message: fieldErrorMessage,
          })
        })
      }

      // Show error notification
      notifications.show({
        title: 'Erro',
        message: normalizedErrors[0]?.error ?? errorMessage,
        color: 'red',
        autoClose: 5000,
      })

      // Call custom onError handler
      if (onError) {
        onError(error, variables, context)
      }
    },
    onSettled,
  })

  return mutation
}
