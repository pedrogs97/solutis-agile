import { Loader, MultiSelect } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useController, useFormContext } from 'react-hook-form'

/**
 * Async MultiSelect for Mantine v8 + React Hook Form (React 19-ready)
 *
 * Features:
 * - Debounced, abortable fetches with per-query caching
 * - RHF integration via useFormContext/useController
 * - Optional preload on first open (popular options)
 * - Seed with initialOptions so edit forms render labels w/o fetching
 * - Change callback returns full selected Option[] and last change meta
 */

export type Option = { label: string; value: string; [key: string]: any }

export type Fetcher = (query: string) => Promise<Option[]>

type RHFAsyncMultiSelectProps = {
  name: string
  label?: string
  placeholder?: string
  fetcher: Fetcher
  debounceMs?: number
  minChars?: number // do not call backend until this many chars are typed
  nothingFound?: string
  disabled?: boolean
  clearable?: boolean
  preloadOnOpen?: boolean
  initialOptions?: Option[]
  /**
   * Fires whenever the selection changes. Provides full selected options and
   * a diff describing the last user action.
   */
  onOptionsChange?: (
    selected: Option[],
    change?: { type: 'add' | 'remove' | 'clear'; option?: Option | null },
  ) => void
  /**
   * Pass-through to Mantine MultiSelect's maxValues prop (limit selection size)
   */
  maxValues?: number
}

function useAbortableFetcher(fetcher: Fetcher) {
  const abortRef = useRef<AbortController | null>(null)

  const run = useCallback(
    async (query: string) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      try {
        const result = await fetcher(query)
        if (controller.signal.aborted) throw new Error('aborted')
        return result
      } finally {
        if (abortRef.current === controller) abortRef.current = null
      }
    },
    [fetcher],
  )

  useEffect(() => () => abortRef.current?.abort(), [])
  return run
}

const cacheKey = (q: string) => q.trim().toLowerCase()

export default function RHFAsyncMultiSelect(props: RHFAsyncMultiSelectProps) {
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
    onOptionsChange,
    maxValues,
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

  // Keep track of the previous RHF value to compute diffs on change
  const prevValuesRef = useRef<string[]>(Array.isArray(value) ? value : [])
  useEffect(() => {
    if (Array.isArray(value)) prevValuesRef.current = value
  }, [value])

  const allKnownOptions = useMemo(() => {
    const map = new Map<string, Option>()
    ;(initialOptions ?? []).forEach((o) => map.set(o.value, o))
    data.forEach((o) => map.set(o.value, o))
    return map
  }, [data, initialOptions])

  const mergeOptions = useCallback((incoming: Option[]) => {
    if (!incoming || incoming.length === 0) return
    setData((current) => {
      const map = new Map<string, Option>()
      current.forEach((o) => map.set(o.value, o))
      incoming.forEach((o) => map.set(o.value, o))
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
        // aborted or failed — ignore
      } finally {
        setLoading(false)
      }
    },
    [fetchAbortable],
  )

  // Seed dropdown with initial options (edit forms)
  useEffect(() => {
    if (initialOptions && initialOptions.length > 0) {
      mergeOptions(initialOptions)
    }
  }, [initialOptions, mergeOptions])

  // Preload on first open (e.g., popular results)
  useEffect(() => {
    if (opened && preloadOnOpen) load('')
  }, [opened, preloadOnOpen, load])

  // Debounced query effect
  useEffect(() => {
    if (!opened) return
    const trimmed = debounced.trim()
    if (trimmed.length >= minChars) {
      load(trimmed)
    } else if (trimmed.length === 0) {
      if (preloadOnOpen) load('')
      else setData([])
    }
  }, [debounced, minChars, opened, preloadOnOpen, load])

  return (
    <MultiSelect
      ref={ref}
      label={label}
      placeholder={placeholder}
      searchable
      clearable={clearable}
      disabled={disabled}
      data={data}
      value={(Array.isArray(value) ? value : []) as string[]}
      onChange={(next) => {
        onChange(next)
        if (onOptionsChange) {
          const prev = prevValuesRef.current
          const added = next.find((v) => !prev.includes(v))
          const removed = prev.find((v) => !next.includes(v))
          let change:
            | { type: 'add' | 'remove' | 'clear'; option?: Option | null }
            | undefined
          if (added)
            change = { type: 'add', option: allKnownOptions.get(added) ?? null }
          else if (removed)
            change = {
              type: 'remove',
              option: allKnownOptions.get(removed) ?? null,
            }
          else if (next.length === 0 && prev.length > 0)
            change = { type: 'clear', option: null }

          const selectedOptions = next
            .map((v) => allKnownOptions.get(v))
            .filter(Boolean) as Option[]
          onOptionsChange(selectedOptions, change)
        }
      }}
      onBlur={onBlur}
      onDropdownOpen={() => setOpened(true)}
      onDropdownClose={() => setOpened(false)}
      searchValue={search}
      onSearchChange={setSearch}
      nothingFoundMessage={loading ? 'Carregando...' : nothingFound}
      rightSection={loading ? <Loader size="xs" /> : null}
      rightSectionPointerEvents="none"
      comboboxProps={{ withinPortal: true, shadow: 'sm' }}
      error={error?.message}
      maxValues={maxValues}
    />
  )
}
