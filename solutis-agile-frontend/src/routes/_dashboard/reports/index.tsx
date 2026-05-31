'use client'

import {
  Box,
  Button,
  Checkbox,
  Drawer,
  Flex,
  Pagination,
  Select as MantineSelect,
  Text,
} from '@mantine/core'
import { DatePickerInput, type DatesRangeValue } from '@mantine/dates'
import { createFileRoute, useSearch } from '@tanstack/react-router'
import { parseISO } from 'date-fns'
import { Filter, Search, Sheet } from 'lucide-react'
import { useCallback } from 'react'
import { FormProvider } from 'react-hook-form'

import AsyncMultiselect from '@/components/common/async-multi-select/async-multi-select'
import { Breadcrumbs } from '@/components/common/breadcrumbs'
import Input from '@/components/common/input'
import MultiSelect from '@/components/common/multi-select'
import { PageSectionHeader } from '@/components/common/page-section-header'
import PieChart from '@/components/common/pie-chart'
import Select from '@/components/common/select'
import TableSkeleton from '@/components/common/skeletons/table-skeleton'
import { AssetReportTable } from '@/components/report/asset-report-table'
import { AssetStockReportTable } from '@/components/report/asset-stock-report-table'
import { EmployeeReportTable } from '@/components/report/employee-report-table'
import { MaintenanceReportTable } from '@/components/report/maintenance-report-table'
import { PatternReportTable } from '@/components/report/pattern-report-table'
import { ServerError } from '@/components/server-error'
import { BUSINESS_UNITS, CONTRACT_LOCATIONS } from '@/constants/selectOptions'
import useReports from '@/hooks/report/useReport'
import { useThemeColors } from '@/hooks/useThemeColors'
import { fetchEmployeeSelect } from '@/services/api/employee'

export interface ReportFormFilter {
  search?: string
  page?: number
  start_date: string
  end_date: string
  employees_ids: string[]
  roles_ids: string[]
  projects: string
  business_executive: string
  workloads_ids: string[]
  register_number: string
  patterns: string
  status_ids: string
  location: string[]
  business_executives: string[]
  cost_center_ids: string
  bu: string
  asset_types: string[]
  assurance: boolean
  isListResponse: boolean
  maintenance_type: string
  maintenance_action_ids: string
}

export const Route = createFileRoute('/_dashboard/reports/')({
  errorComponent: () => <ServerError />,
  pendingComponent: () => <TableSkeleton />,
  component: ReportsPage,
})

function ReportsPage() {
  const {
    getContentBackgroundColor,
    getSecondaryTextColor,
    getChartTextColor,
  } = useThemeColors()
  const searchParams = useSearch({ from: '/_dashboard/reports/' }) as any

  const parseDateValue = (value: Date | string | null) => {
    if (!value) return null
    if (value instanceof Date) return value
    return parseISO(value)
  }

  const handlePeriodChange = (value: DatesRangeValue) => {
    setPeriod([parseDateValue(value[0]), parseDateValue(value[1])])
  }

  const loadEmployees = useCallback(
    (query: string) => fetchEmployeeSelect(query),
    [fetchEmployeeSelect],
  )
  const {
    filterDrawerOpened,
    openFilterDrawer,
    closeFilterDrawer,
    searchBy,
    setSearchBy,
    period,
    setPeriod,
    formFilterReport,
    onSubmitFilterReport,
    queryEnabled,
    isListResponse,
    page,
    onPageChange,
    isPending,
    error,
    data,
    projects,
    businessExecutive,
    pattern,
    workloads,
    assetTypes,
    maintenanceActions,
    isPendingBusinessExecutive,
    isPendingAssetTypes,
    watchMaintenanceType,
    roles,
    costCenter,
    onDownloadExcelSheet,
    onSearchReportList,
    clearAllFilters,
    dataDashboardAsset,
    isPendingDashboardData,
    dataDashboardLending,
    COLORS,
    dataDashboardMaintenance,
    dataDashboardUpgrade,
    assetStatus,
  } = useReports({ searchParams })

  const isEmployeeSearch = searchBy === 'Colaborador'
  const isAssetSearch = searchBy === 'Equipamento'
  const isPatternSearch = searchBy === 'Padrão de Equipamento'
  const isMaintenanceSearch = searchBy === 'Manutenção/Melhoria'
  const isStockAssetSearch = searchBy === 'Estoque de Equipamento'

  const searchByOptions = [
    'Colaborador',
    'Equipamento',
    'Padrão de Equipamento',
    'Manutenção/Melhoria',
    'Estoque de Equipamento',
  ]

  if (isListResponse && isPending) return <TableSkeleton />
  if (isListResponse && error) return <ServerError />

  return (
    <>
      <Breadcrumbs />
      <PageSectionHeader title="Relatórios" />
      <Box
        bg={getContentBackgroundColor()}
        px={20}
        pt={15}
        style={{ borderRadius: 25 }}
        mih={500}
      >
        <Flex wrap="wrap">
          <MantineSelect
            value={searchBy}
            onChange={setSearchBy}
            miw="250"
            placeholder="Tipo de Consulta"
            data={searchByOptions}
            mr={5}
            mt={3}
          />
          <Button
            radius="md"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              openFilterDrawer()
            }}
            miw={200}
            mr={5}
            mt={3}
            type="button"
            disabled={!searchBy}
          >
            <Filter size={15} />
            &nbsp; Filtrar
          </Button>

          <Button
            radius="md"
            variant="filled"
            type="button"
            color="var(--mantine-color-green-6)"
            miw={200}
            mt={3}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onDownloadExcelSheet()
            }}
            disabled={!period[0] || !period[1] || !searchBy || !queryEnabled}
          >
            <Sheet size={15} />
            &nbsp; Download Planilha Excel
          </Button>
        </Flex>
        <Drawer
          opened={filterDrawerOpened}
          onClose={closeFilterDrawer}
          title=""
          position="right"
          closeOnClickOutside={false}
          closeOnEscape
        >
          <FormProvider {...formFilterReport}>
            <form
              onSubmit={formFilterReport.handleSubmit(onSubmitFilterReport)}
            >
              <Flex justify="space-between" my={15}>
                <Text size="lg" fw={700}>
                  Filtrar por data
                </Text>
                <Button
                  variant="outline"
                  size="compact-md"
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    clearAllFilters()
                  }}
                >
                  Limpar filtros
                </Button>
              </Flex>
              <DatePickerInput
                type="range"
                placeholder="Período inicial — Período final"
                value={period}
                onChange={handlePeriodChange}
                maxDate={new Date()}
                valueFormat="DD/MM/YYYY"
              />
              <MantineSelect
                value={searchBy}
                onChange={setSearchBy}
                miw="250"
                label="Tipo de Consulta"
                placeholder=""
                data={searchByOptions}
              />
              {isStockAssetSearch && (
                <>
                  <Input
                    label="Patrimônio"
                    name="register_number"
                    placeholder=""
                  />
                  <Select
                    label="Centro de custo"
                    name="cost_center_ids"
                    placeholder=""
                    data={costCenter}
                  />
                  <MultiSelect
                    label="Padrão do equipamento"
                    name="patterns"
                    placeholder=""
                    data={pattern}
                    searchable
                  />
                  <MultiSelect
                    label="Status"
                    name="status_ids"
                    placeholder=""
                    data={assetStatus}
                    searchable
                  />
                </>
              )}
              {isEmployeeSearch && (
                <>
                  <AsyncMultiselect
                    name="employees_ids"
                    label="Colaboradores"
                    fetcher={loadEmployees}
                  />
                  <Select name="roles_ids" label="Cargo" data={roles} />
                  <Select
                    label="Projeto"
                    name="projects"
                    placeholder=""
                    data={projects}
                    searchable
                  />
                  <Select
                    label="Gestor"
                    name="business_executive"
                    placeholder=""
                    data={businessExecutive}
                  />
                  <Select
                    label="Local de trabalho"
                    name="workloads_ids"
                    placeholder=""
                    data={workloads}
                  />
                  <Input
                    label="Patrimônio"
                    name="register_number"
                    placeholder=""
                  />
                  <Select
                    label="Centro de custo"
                    name="cost_center_ids"
                    placeholder=""
                    data={costCenter}
                  />
                  <Select
                    name="bu"
                    label="BU"
                    placeholder=""
                    data={BUSINESS_UNITS}
                  />
                  <MultiSelect
                    label="Padrão do equipamento"
                    name="patterns"
                    placeholder=""
                    data={pattern}
                    searchable
                  />
                </>
              )}
              {(isAssetSearch || isMaintenanceSearch || isStockAssetSearch) && (
                <Select
                  label="Padrão do equipamento"
                  name="patterns"
                  placeholder=""
                  data={pattern}
                />
              )}
              {(isEmployeeSearch || isAssetSearch || isMaintenanceSearch) && (
                <MultiSelect
                  label="Status"
                  name="status_ids"
                  placeholder=""
                  data={[
                    { label: 'Arquivo pendente', value: '1' },
                    { label: 'Ativo', value: '2' },
                    { label: 'Arquivo de distrato pendente', value: '3' },
                    { label: 'Distrato realizado', value: '4' },
                  ]}
                  searchable
                />
              )}
              {isAssetSearch && (
                <MultiSelect
                  name="location"
                  label="Origem do Contrato"
                  placeholder=""
                  data={CONTRACT_LOCATIONS}
                />
              )}
              {isPatternSearch && (
                <>
                  <MultiSelect
                    name="business_executives"
                    label="Gestores"
                    placeholder=""
                    data={businessExecutive}
                    searchable
                    isLoading={isPendingBusinessExecutive}
                  />
                  <MultiSelect
                    name="asset_types"
                    label="Tipo de equipamento"
                    placeholder=""
                    data={assetTypes}
                    searchable
                    isLoading={isPendingAssetTypes}
                  />
                </>
              )}
              {isMaintenanceSearch && (
                <Select
                  name="maintenance_type"
                  label="Tipo"
                  placeholder=""
                  data={[
                    {
                      label: 'Manutenção',
                      value: 'maintenance',
                    },
                    {
                      label: 'Melhoria',
                      value: 'upgrade',
                    },
                    {
                      label: 'Todos',
                      value: 'all',
                    },
                  ]}
                />
              )}
              {isMaintenanceSearch &&
                watchMaintenanceType === 'maintenance' && (
                  <MultiSelect
                    name="maintenance_action_ids"
                    label="Tipo de Manutenção"
                    placeholder=""
                    data={maintenanceActions}
                  />
                )}
              {(isAssetSearch || isMaintenanceSearch) && (
                <Checkbox
                  label={
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: 'var(--mantine-color-dimmed)',
                      }}
                    >{`Possui garantia? ${
                      formFilterReport.watch('assurance') ? 'Sim' : 'Não'
                    }`}</span>
                  }
                  checked={formFilterReport.watch('assurance')}
                  onChange={() =>
                    formFilterReport.setValue(
                      'assurance',
                      !formFilterReport.watch('assurance'),
                    )
                  }
                />
              )}

              <Button
                radius="md"
                variant="filled"
                type="button"
                color="var(--mantine-color-green-6)"
                fullWidth
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onDownloadExcelSheet()
                }}
                disabled={!period[0] || !period[1] || !searchBy}
              >
                <Sheet size={15} />
                &nbsp; Download Planilha Excel
              </Button>
              <Button
                radius="md"
                variant="filled"
                type="button"
                mt={10}
                fullWidth
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onSearchReportList()
                }}
                disabled={!period[0] || !period[1] || !searchBy}
              >
                <Search size={15} />
                &nbsp; Pesquisar
              </Button>
            </form>
          </FormProvider>
        </Drawer>
        {!isListResponse && !queryEnabled && !isPendingDashboardData ? (
          <Flex justify="space-between" mt={10} wrap={'wrap'} miw={'100%'}>
            <Flex
              justify="start"
              align="center"
              columnGap={2}
              direction="column"
              miw={300}
              mx="auto"
            >
              <Text size="lg" fw={700} mt={10} c={getSecondaryTextColor()}>
                Equipamentos
              </Text>

              <PieChart
                data={dataDashboardAsset || []}
                colors={COLORS.slice(0, (dataDashboardAsset || []).length)}
                legendTextColor={getChartTextColor()}
              />
            </Flex>
            <Flex
              justify="start"
              align="center"
              columnGap={2}
              direction="column"
              miw={300}
              mx="auto"
            >
              <Text size="lg" fw={700} mt={10} c={getSecondaryTextColor()}>
                Comodatos
              </Text>
              <PieChart
                data={dataDashboardLending || []}
                colors={COLORS.slice(0, (dataDashboardLending || []).length)}
                legendTextColor={getChartTextColor()}
              />
            </Flex>
            <Flex
              justify="start"
              align="center"
              columnGap={2}
              direction="column"
              miw={300}
              mx="auto"
            >
              <Text size="lg" fw={700} mt={10} c={getSecondaryTextColor()}>
                Manutenções
              </Text>
              <PieChart
                data={dataDashboardMaintenance || []}
                colors={COLORS.slice(
                  0,
                  (dataDashboardMaintenance || []).length,
                )}
                legendTextColor={getChartTextColor()}
              />
            </Flex>
            <Flex
              justify="start"
              align="center"
              columnGap={2}
              direction="column"
              miw={300}
              mx="auto"
            >
              <Text size="lg" fw={700} mt={10} c={getSecondaryTextColor()}>
                Melhorias
              </Text>
              <PieChart
                data={dataDashboardUpgrade || []}
                colors={COLORS.slice(0, (dataDashboardUpgrade || []).length)}
                legendTextColor={getChartTextColor()}
              />
            </Flex>
          </Flex>
        ) : null}
        {queryEnabled && isListResponse && searchBy === 'Colaborador' && (
          <EmployeeReportTable data={data?.items} />
        )}
        {queryEnabled && isListResponse && searchBy === 'Equipamento' && (
          <AssetReportTable data={data?.items} />
        )}
        {queryEnabled &&
          isListResponse &&
          searchBy === 'Estoque de Equipamento' && (
            <AssetStockReportTable data={data?.items} />
          )}
        {queryEnabled &&
          isListResponse &&
          searchBy === 'Padrão de Equipamento' && (
            <PatternReportTable data={data?.items} />
          )}
        {queryEnabled &&
          isListResponse &&
          searchBy === 'Manutenção/Melhoria' && (
            <MaintenanceReportTable data={data?.items} />
          )}
        <Flex justify="center" mt={10}>
          <Pagination
            value={page}
            onChange={onPageChange}
            total={data?.pages || 0}
            disabled={isPending || data?.items?.length === 0}
            size="sm"
          />
        </Flex>
      </Box>
    </>
  )
}
