'use client'

import {
  Box,
  Button,
  Flex,
  Grid,
  Paper,
  rem,
  Text,
  TextInput,
} from '@mantine/core'
import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { FileUp, XIcon } from 'lucide-react'
import { FormProvider } from 'react-hook-form'

import undrawNoData from '@/assets/illustrations/undraw_no_data.svg'
import { Breadcrumbs } from '@/components/common/breadcrumbs'
import ContentSection from '@/components/common/content-section'
import FilterSection from '@/components/common/filter-section'
import { PageSectionHeader } from '@/components/common/page-section-header'
import Pagination from '@/components/common/pagination'
import MiniCardSkeleton from '@/components/common/skeletons/mini-card-skeleton'
import Image from '@/components/image'
import ModalDetailInvoice from '@/components/invoice/modal/detail-invoice'
import { Can } from '@/components/providers/ability'
import { ServerError } from '@/components/server-error'
import useInvoiceList from '@/hooks/invoice/useInvoiceList'
import { useThemeColors } from '@/hooks/useThemeColors'
import type { Invoice } from '@/types/Invoice'

interface InvoicesSearch {
  search?: string
  page?: number
  size?: string
  number__ilike?: string
}

export const Route = createFileRoute('/_dashboard/invoices/')({
  validateSearch: (search: Record<string, unknown>): InvoicesSearch => ({
    search: typeof search.search === 'string' ? search.search : undefined,
    page: Number(search.page) || undefined,
    size: typeof search.size === 'string' ? search.size : undefined,
    number__ilike:
      typeof search.number__ilike === 'string'
        ? search.number__ilike
        : undefined,
  }),
  errorComponent: () => <ServerError />,
  pendingComponent: () => <MiniCardSkeleton />,
  component: InvoicesPage,
})

function InvoicesPage() {
  const searchParams = useSearch({ from: '/_dashboard/invoices/' })
  const navigate = useNavigate()
  const { getCardBackgroundColor, getSecondaryTextColor } = useThemeColors()

  const {
    filterOpened,
    toggleFilter,
    formFilter,
    page,
    onPageChange,
    onSearch,
    onClearFilters,
    pageSize,
    onPageSizeChange,
    isPending,
    error,
    data,
    invoiceDetail,
    setInvoiceDetail,
    modalDetailOpened,
    openDetailModal,
    closeDetailModal,
    openConfirmDeleteModal,

    downloadInvoice,
    onDownloadDocument,
  } = useInvoiceList({ searchParams })

  if (isPending) return <MiniCardSkeleton />
  if (error) return <ServerError />

  return (
    <>
      <ModalDetailInvoice
        invoiceDetail={invoiceDetail}
        opened={modalDetailOpened}
        close={closeDetailModal}
        openConfirmDeleteModal={openConfirmDeleteModal}
        downloadInvoice={downloadInvoice}
        onDownloadDocument={onDownloadDocument}
      />
      <Breadcrumbs />
      <PageSectionHeader
        title="Notas Fiscais"
        actions={
          <Can I="add" a="invoice">
            <Button
              variant="filled"
              radius="md"
              onClick={() => navigate({ to: '/invoices/import' as any })}
            >
              <FileUp />
              &nbsp;Importar Nota Fiscal
            </Button>
          </Can>
        }
      />
      <ContentSection
        footer={
          <Pagination
            pageSize={pageSize}
            onPageSizeChange={onPageSizeChange}
            value={page}
            onChange={onPageChange}
            totalOfItems={data.total}
            total={data.pages}
            disabled={isPending || data.length === 0}
          />
        }
      >
        <FormProvider {...formFilter}>
          <FilterSection
            open={filterOpened}
            onToggle={toggleFilter}
            onClear={onClearFilters}
            onSubmit={formFilter.handleSubmit(onSearch)}
            submitting={isPending}
            cols={4}
          >
            <TextInput
              label="Número da Nota Fiscal"
              {...formFilter.register('number__ilike')}
            />
          </FilterSection>
        </FormProvider>
        <Flex mt={10}>
          <Grid style={{ width: '100%' }}>
            {data?.items?.map((invoice: Invoice) => (
              <Grid.Col
                key={invoice.id}
                span={{ base: 12, xs: 12, sm: 6, md: 4, lg: 3 }}
              >
                <Paper
                  shadow="md"
                  radius="md"
                  p="lg"
                  bg={getCardBackgroundColor()}
                  mih={90}
                  miw={250}
                  mr={10}
                  style={{
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    setInvoiceDetail(invoice)
                    openDetailModal()
                  }}
                >
                  <Flex justify="space-between">
                    <Text size="lg" fw={700} c="blue" tt="uppercase">
                      #{invoice.number}
                    </Text>
                    <Can I="delete" a="invoice">
                      <Box
                        onClick={(e) => {
                          e.stopPropagation()
                          openConfirmDeleteModal(invoice.id?.toString())
                        }}
                        style={{
                          cursor: 'pointer',
                        }}
                      >
                        <XIcon size={20} color="red" />
                      </Box>
                    </Can>
                  </Flex>
                  {invoice?.assets?.length === 0 ? (
                    <Text size="sm" fw={700} c={getSecondaryTextColor()}>
                      Nenhum Item
                    </Text>
                  ) : (
                    <Text size="sm" fw={700} c={getSecondaryTextColor()}>
                      {invoice?.assets?.length === 1
                        ? '1 Item'
                        : `${invoice?.assets?.length} Itens`}
                    </Text>
                  )}
                </Paper>
              </Grid.Col>
            ))}
          </Grid>
        </Flex>
        {data?.items?.length === 0 && (
          <Flex
            w={'100%'}
            direction="column"
            align="center"
            justify="center"
            p={12}
            style={{ gap: rem(20) }}
          >
            <Image src={undrawNoData} alt="Empty" width={200} height={200} />
            <Text fw={500} c={getSecondaryTextColor()}>
              Nenhuma nota fiscal encontrada
            </Text>
          </Flex>
        )}
      </ContentSection>
    </>
  )
}
