'use client'

import {
  Box,
  Button,
  Collapse,
  Divider,
  Group,
  Paper,
  SimpleGrid,
  Tooltip,
} from '@mantine/core'
import {
  ChevronDown,
  Filter as FilterIcon,
  Search,
  X as ClearIcon,
} from 'lucide-react'
import { memo, type ReactNode, useId } from 'react'

type FilterSectionProps = {
  /** Controlled visibility */
  open: boolean
  onToggle: () => void

  /** Actions */
  onClear?: () => void
  onSubmit?: () => void | Promise<void>
  submitting?: boolean

  /** Layout */
  children: ReactNode
  cols?: number // default 4
  gap?: number | string // default "md"

  /** Labels / slots */
  submitLabel?: string
  clearLabel?: string
  toggleLabel?: string
  extraActions?: ReactNode // right-side extra actions (export, etc.)
}

const FilterSection = memo(function FilterSection({
  open,
  onToggle,
  onClear,
  onSubmit,
  submitting,
  children,
  cols = 4,
  gap = 'md',
  submitLabel = 'Pesquisar',
  clearLabel = 'Limpar',
  toggleLabel = 'Filtros',
  extraActions,
}: FilterSectionProps) {
  const regionId = useId()

  return (
    <Paper withBorder radius="md" p="md">
      {/* Toolbar */}
      <Group justify="space-between" wrap="nowrap" align="center">
        <Group gap="xs" wrap="nowrap">
          <Button
            size="xs"
            variant={open ? 'filled' : 'light'}
            radius="md"
            onClick={onToggle}
            aria-expanded={open}
            aria-controls={regionId}
            leftSection={<FilterIcon size={18} aria-hidden />}
            rightSection={
              <ChevronDown
                size={16}
                aria-hidden
                style={{
                  transition: 'transform 150ms ease',
                  transform: open ? 'rotate(180deg)' : undefined,
                }}
              />
            }
          >
            {toggleLabel}
          </Button>

          {onClear && (
            <Tooltip label={clearLabel} withArrow>
              <Button
                size="xs"
                variant="subtle"
                color="gray"
                radius="md"
                onClick={onClear}
                leftSection={<ClearIcon size={16} aria-hidden />}
              >
                {clearLabel}
              </Button>
            </Tooltip>
          )}
        </Group>

        {extraActions && <Group gap="xs">{extraActions}</Group>}
      </Group>

      {/* Collapsible content */}
      <Collapse in={open} keepMounted id={regionId}>
        <Divider my="md" />

        <Box
          component="form"
          aria-label="Filter form"
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit?.()
          }}
        >
          <SimpleGrid
            spacing={gap}
            cols={{ base: 1, sm: 1, md: 2, lg: 3, xl: cols }}
          >
            {/* Fields go here */}
            {children}

            {/* Full-width action row */}
            <Box
              style={{
                gridColumn: '1 / -1',
              }}
            >
              <Divider mb="sm" />
              <Group justify="end" align="center" wrap="wrap">
                <Button
                  type="submit"
                  size="xs"
                  radius="md"
                  loading={!!submitting}
                  leftSection={<Search size={16} aria-hidden />}
                >
                  {submitLabel}
                </Button>
              </Group>
            </Box>
          </SimpleGrid>
        </Box>
      </Collapse>
    </Paper>
  )
})

export default FilterSection
