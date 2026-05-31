import { Loader, Select } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useController, useFormContext } from 'react-hook-form'

/**
 * Reusable Async Select tied to React Hook Form using Mantine's <Select />
 * - Debounces user input so you don't hammer your backend on each keystroke
 * - Cancels in-flight requests when a new one starts
 * - Works with RHF via useFormContext/useController
 */

export type Option = { label: string; value: string; [key: string]: any }

export type Fetcher = (query: string) => Promise<Option[]>

type RHFAsyncSelectProps = {
  name: string
  label?: string
  placeholder?: string
  fetcher: Fetcher
  debounceMs?: number
  minChars?: number // do not call backend until this many chars are typed
  nothingFound?: string
  disabled?: boolean
  clearable?: boolean
  /**
   * Preload options when the dropdown first opens (without a query),
   * useful for showing "top results".
   */
  preloadOnOpen?: boolean
  /**
   * Optional initial options to seed the dropdown. Useful when editing forms
   * where the current value should be rendered without triggering a search.
   */
  initialOptions?: Option[]
  /**
   * Callback fired every time the user picks (or clears) an option. Handy
   * when the parent still needs the full option object alongside the value
   * stored in React Hook Form.
   */
  onOptionSelect?: (option: Option | null) => void
}

function useAbortableFetcher(fetcher: Fetcher) {
  const abortRef = useRef<AbortController | null>(null)

  const run = useCallback(
    async (query: string) => {
      // Abort previous in-flight request
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      try {
        const result = await fetcher(query)
        if (controller.signal.aborted) throw new Error('aborted')
        return result
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null
        }
      }
    },
    [fetcher],
  )

  useEffect(() => () => abortRef.current?.abort(), [])
  return run
}

const cacheKey = (q: string) => q.trim().toLowerCase()

export default function RHFAsyncSelect(props: RHFAsyncSelectProps) {
  const {
    name,
    label,
    placeholder = 'Digite para pesquisar...',
    fetcher,
    debounceMs = 400,
    minChars = 2,
    nothingFound = 'Nenhum resultado encontrado',
    disabled,
    clearable = true,
    preloadOnOpen = false,
    initialOptions,
    onOptionSelect,
  } = props

  const { control } = useFormContext()
  const {
    field: { value, onChange, onBlur, ref },
    fieldState: { error },
  } = useController({ name, control })

  const [opened, setOpened] = useState(false)
  const [search, setSearch] = useState('')
  const [debounced] = useDebouncedValue(search, debounceMs)
  const [data, setData] = useState<Option[]>([])
  const [loading, setLoading] = useState(false)

  const cached = useRef<Map<string, Option[]>>(new Map())
  const fetchAbortable = useAbortableFetcher(fetcher)

  const mergeOptions = useCallback((incoming: Option[]) => {
    if (!incoming || incoming.length === 0) return
    setData((current) => {
      const map = new Map<string, Option>()
      current.forEach((option) => {
        map.set(option.value, option)
      })
      incoming.forEach((option) => {
        map.set(option.value, option)
      })
      return Array.from(map.values())
    })
  }, [])

  const load = useCallback(
    async (q: string) => {
      const key = cacheKey(q)
      if (cached.current.has(key)) {
        setData(cached.current.get(key)!)
        return
      }
      setLoading(true)
      try {
        const res = await fetchAbortable(q)
        cached.current.set(key, res)
        setData(res)
      } catch {
        // ignore if aborted
      } finally {
        setLoading(false)
      }
    },
    [fetchAbortable],
  )

  useEffect(() => {
    if (initialOptions && initialOptions.length > 0) {
      mergeOptions(initialOptions)
    }
  }, [initialOptions, mergeOptions])

  // Preload on open (e.g., popular options)
  useEffect(() => {
    if (opened && preloadOnOpen) {
      load('')
    }
  }, [opened, preloadOnOpen, load])

  // Debounced query effect
  useEffect(() => {
    if (!opened) return
    if (debounced.trim().length >= minChars) {
      load(debounced)
    } else if (debounced.trim().length === 0) {
      // If cleared search, optionally show empty or preload set
      if (preloadOnOpen) load('')
      else setData([])
    }
  }, [debounced, minChars, opened, preloadOnOpen, load])

  return (
    <Select
      ref={ref}
      label={label}
      placeholder={placeholder}
      searchable
      clearable={clearable}
      disabled={disabled}
      data={data}
      value={value ?? null}
      onChange={(val) => {
        const nextValue = val ?? ''
        onChange(nextValue)
        if (onOptionSelect) {
          if (!nextValue) {
            onOptionSelect(null)
            return
          }
          const option = [...data, ...(initialOptions ?? [])].find(
            (item) => item.value === nextValue,
          ) as Option
          onOptionSelect(option ?? null)
        }
      }}
      onBlur={onBlur}
      onDropdownOpen={() => setOpened(true)}
      onDropdownClose={() => setOpened(false)}
      searchValue={search}
      onSearchChange={setSearch}
      nothingFoundMessage={loading ? 'Carregando...' : nothingFound}
      rightSection={loading ? <Loader size="xs" /> : null}
      // Improve keyboard UX when results are loading
      comboboxProps={{ withinPortal: true, shadow: 'sm' }}
      // Keep the input value while option selected
      error={error?.message}
    />
  )
}
