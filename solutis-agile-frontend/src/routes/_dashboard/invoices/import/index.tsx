'use client'

import {
  Button,
  Card,
  Grid,
  Loader,
  MultiSelect,
  TextInput,
} from '@mantine/core'
import { createFileRoute } from '@tanstack/react-router'
import { Check } from 'lucide-react'
import { Controller } from 'react-hook-form'

import { Breadcrumbs } from '@/components/common/breadcrumbs'
import { PageSectionHeader } from '@/components/common/page-section-header'
import FormSkeleton from '@/components/common/skeletons/form-skeleton'
import FileUploadCard from '@/components/file-upload-card'
import { ServerError } from '@/components/server-error'
import useImportInvoice from '@/hooks/invoice/useImportInvoice'
import { useThemeColors } from '@/hooks/useThemeColors'

export const Route = createFileRoute('/_dashboard/invoices/import/')({
  errorComponent: () => <ServerError />,
  pendingComponent: () => <FormSkeleton />,
  component: ImportInvoicePage,
})

function ImportInvoicePage() {
  const { getContentBackgroundColor } = useThemeColors()
  const {
    assets,
    isPendingAssets,
    setSearchAssetValue,
    file,
    setFile,
    form,
    openConfirmModal,
    onSubmit,
    setErrorFile,
  } = useImportInvoice()

  return (
    <>
      <Breadcrumbs />
      <PageSectionHeader title="Importar nota fiscal" />
      <Card
        shadow="sm"
        p={20}
        style={{
          borderRadius: 25,
          minHeight: 350,
        }}
        bg={getContentBackgroundColor()}
      >
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Grid my={10}>
            <Grid.Col span={{ base: 12, xs: 12 }}>
              <FileUploadCard
                label="Nota Fiscal"
                description="Clique no botão abaixo e carregue a Nota Fiscal"
                helper="Somente arquivos PDF com no máximo 5MB"
                value={file}
                onChange={setFile}
                accept={['application/pdf']}
              />

              {/* <Text size="sm" c={getSecondaryTextColor()}>
                Nota Fiscal
              </Text>
              <Text size="sm" fs="italic" c={getSecondaryTextColor()}>
                Clique no botão abaixo e carregue a Nota Fiscal
              </Text>
              <Group>
                <FileButton
                  resetRef={resetRef}
                  onChange={setFile}
                  accept=".pdf"
                >
                  {(props) => (
                    <Button
                      {...props}
                      size="xs"
                      color="var(--mantine-color-text)"
                      radius="md"
                      type="button"
                    >
                      <UploadCloud />
                      &nbsp;Carregar
                    </Button>
                  )}
                </FileButton>
                <Button
                  disabled={!file}
                  color="red"
                  onClick={clearFile}
                  size="xs"
                  radius="md"
                  type="button"
                >
                  Limpar
                </Button>
              </Group>
              <Text size="xs" fs="italic" c="red" mt={5}>
                Somente arquivos PDF com no máximo 5MB
              </Text>
              {file && (
                <Text size="sm" mt="sm">
                  {file.name}
                </Text>
              )}
              {errorFile && (
                <Alert mt="sm" color="red" maw={300} fw={700}>
                  É necessário carregar um arquivo PDF
                </Alert>
              )} */}
            </Grid.Col>
          </Grid>
          <Grid my={10}>
            <Grid.Col span={{ base: 12, xs: 4 }}>
              <TextInput
                label="N° da Nota Fiscal"
                placeholder="Digite o n° da nota fiscal"
                {...form.register('number')}
              />
            </Grid.Col>
          </Grid>
          <Grid my={10}>
            <Grid.Col span={{ base: 12, xs: 12 }}>
              <Controller
                control={form.control}
                name="assetsId"
                render={({ field: { onChange, onBlur, value } }) => (
                  <MultiSelect
                    label="Ativos"
                    placeholder="Digite para pesquisar ativos"
                    data={assets ?? []}
                    searchable
                    clearable
                    onChange={onChange}
                    onBlur={onBlur}
                    value={value}
                    onSearchChange={(value) => {
                      setSearchAssetValue(value)
                    }}
                    nothingFoundMessage={
                      isPendingAssets
                        ? 'Carregando...'
                        : 'Nenhum ativo encontrado'
                    }
                    rightSection={
                      isPendingAssets && <Loader color="blue" size="xs" />
                    }
                  />
                )}
              />
            </Grid.Col>
          </Grid>
          <Button
            type="button"
            variant="outline"
            radius="md"
            style={{
              float: 'right',
            }}
            disabled={!form.formState.isValid}
            onClick={() => {
              if (!file) {
                setErrorFile(true)
                return
              }
              if (Object.keys(form.formState.errors).length > 0) {
                return
              }
              setErrorFile(false)
              openConfirmModal()
            }}
          >
            Confirmar&nbsp;
            <Check size={16} />
          </Button>
        </form>
      </Card>
    </>
  )
}
