import {
  Flex,
  Pagination as MantinePagination,
  type PaginationProps as MantinePaginationProps,
  Select,
  Text,
} from '@mantine/core'

interface PaginationProps extends MantinePaginationProps {
  totalOfItems: number
  pageSize: string
  onPageSizeChange: (value: string) => void
  pageSizeOptions?: string[]
}

const DEFAULT_PAGE_SIZE_OPTIONS = ['12', '24', '48']

export default function Pagination({
  value,
  onChange,
  totalOfItems = 0,
  total,
  disabled,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
}: Readonly<PaginationProps>) {
  // Ensure pageSize is always a string
  const pageSizeString = String(pageSize)

  // Helper for proper pluralization
  const getResultsText = (count: number) => {
    if (count === 0) return 'Nenhum resultado encontrado'
    if (count === 1) return '1 resultado encontrado'
    return `${count} resultados encontrados`
  }

  // Disable page size selector when total items fit in smallest page size
  const minPageSize = Number(pageSizeOptions[0] || 12)
  const isPageSizeDisabled = totalOfItems <= minPageSize

  return (
    <Flex justify="space-between" align="end" mt={10} wrap="wrap" gap={10}>
      <Text size="sm" c="dimmed">
        {getResultsText(totalOfItems)}
      </Text>
      <Flex align="center" wrap="wrap" gap={10}>
        <Flex align="center" gap={4}>
          <Text size="sm">Itens por página:</Text>
          <Select
            onChange={(value) => value && onPageSizeChange(value)}
            data={pageSizeOptions}
            value={pageSizeString}
            size="sm"
            checkIconPosition="right"
            w={75}
            disabled={isPageSizeDisabled || disabled}
            aria-label="Selecionar quantidade de itens por página"
          />
        </Flex>
        <MantinePagination
          value={value}
          onChange={onChange}
          total={total}
          disabled={disabled}
          size="sm"
          aria-label="Navegação de páginas"
        />
      </Flex>
    </Flex>
  )
}
