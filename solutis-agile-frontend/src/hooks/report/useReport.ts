import { useDisclosure } from '@mantine/hooks'
import { useQueries, useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'

import { useDomainOptions } from '@/hooks/useDomainOptions'
import type { ReportFormFilter } from '@/routes/_dashboard/reports'
import { fetchAssetStatus, fetchAssetTypes } from '@/services/api/asset'
import { fetchMaintenanceActions } from '@/services/api/maintenance'
import {
  fetchBusinessExecutiveSelect,
  fetchDashboardData,
  fetchPatternSelect,
  fetchProjectsSelect,
  fetchReports,
} from '@/services/api/report'

import { usePaginationReport } from './useReportPagination'

interface IUseReportsProps {
  searchParams: ReportFormFilter
}

export default function useReports({
  searchParams,
}: Readonly<IUseReportsProps>) {
  const [
    filterDrawerOpened,
    { open: openFilterDrawer, close: closeFilterDrawer },
  ] = useDisclosure(false)
  const [period, setPeriod] = useState<[Date | null, Date | null]>([
    // new Date(2020, 1, 1),
    // new Date(2024, 4, 1)
    null,
    null,
  ])
  const [searchBy, setSearchBy] = useState<string | null>(null)
  const [queryEnabled, setQueryEnabled] = useState(false)

  const {
    roles,
    costCenters,
    workloads,
    isLoading: domainLoading,
    errors: domainErrors,
  } = useDomainOptions({ keys: ['roles', 'costCenters', 'workloads'] })

  const isPendingRoles = domainLoading.roles
  const isErrorRoles = domainErrors.roles
  const isPendingCostCenter = domainLoading.costCenters
  const isErrorCostCenter = domainErrors.costCenters
  const isPendingWorkload = domainLoading.workloads
  const isErrorWorkloads = domainErrors.workloads

  const onSubmitFilterReport = async () => {
    if (period[0] === null || period[1] === null || !searchBy) return
    formFilterReport.setValue('start_date', format(period[0], 'yyyy-MM-dd'))
    formFilterReport.setValue('end_date', format(period[1], 'yyyy-MM-dd'))
    formFilterReport.setValue('isListResponse', true)

    if (searchBy === 'Colaborador') {
      formFilterReport.resetField('location')
      formFilterReport.resetField('assurance')
      formFilterReport.resetField('business_executives')
      formFilterReport.resetField('cost_center_ids')
      formFilterReport.resetField('bu')
      formFilterReport.resetField('asset_types')
    }
    if (searchBy === 'Equipamento') {
      formFilterReport.resetField('employees_ids')
      formFilterReport.resetField('projects')
      formFilterReport.resetField('business_executive')
      formFilterReport.resetField('workloads_ids')
      formFilterReport.resetField('register_number')
      formFilterReport.resetField('location')
      formFilterReport.resetField('assurance')
      formFilterReport.resetField('business_executives')
      formFilterReport.resetField('cost_center_ids')
      formFilterReport.resetField('bu')
      formFilterReport.resetField('asset_types')
    }
    if (searchBy === 'Padrão de Equipamento') {
      formFilterReport.resetField('employees_ids')
      formFilterReport.resetField('projects')
      formFilterReport.resetField('business_executive')
      formFilterReport.resetField('workloads_ids')
      formFilterReport.resetField('register_number')
      formFilterReport.resetField('patterns')
      formFilterReport.resetField('status_ids')
      formFilterReport.resetField('location')
      formFilterReport.resetField('assurance')
    }
    if (searchBy === 'Manutenção/Melhoria') {
      formFilterReport.resetField('employees_ids')
      formFilterReport.resetField('projects')
      formFilterReport.resetField('business_executive')
      formFilterReport.resetField('workloads_ids')
      formFilterReport.resetField('register_number')
      formFilterReport.resetField('location')
      formFilterReport.resetField('cost_center_ids')
      formFilterReport.resetField('bu')
      formFilterReport.resetField('assurance')
      formFilterReport.resetField('business_executives')
      formFilterReport.resetField('asset_types')
    }
    if (
      searchBy === 'Manutenção/Melhoria' &&
      formFilterReport.watch('maintenance_type') === 'upgrade'
    ) {
      formFilterReport.resetField('maintenance_type')
      formFilterReport.resetField('maintenance_action_ids')
    }
    if (searchBy === 'Estoque de Equipamento') {
      formFilterReport.resetField('patterns')
      formFilterReport.resetField('status_ids')
      formFilterReport.resetField('register_number')
      formFilterReport.resetField('cost_center_ids')
    }
    setQueryEnabled(true)
    closeFilterDrawer()
  }

  const onSubmitDownloadExcelSheet = () => {
    if (period[0] === null || period[1] === null || !searchBy) return
    formFilterReport.setValue('start_date', format(period[0], 'yyyy-MM-dd'))
    formFilterReport.setValue('end_date', format(period[1], 'yyyy-MM-dd'))
    formFilterReport.setValue('isListResponse', false)
    if (searchBy === 'Colaborador') {
      formFilterReport.resetField('location')
      formFilterReport.resetField('assurance')
      formFilterReport.resetField('business_executives')
      formFilterReport.resetField('asset_types')
      formFilterReport.resetField('maintenance_type')
    }
    if (searchBy === 'Equipamento') {
      formFilterReport.resetField('employees_ids')
      formFilterReport.resetField('projects')
      formFilterReport.resetField('business_executive')
      formFilterReport.resetField('workloads_ids')
      formFilterReport.resetField('register_number')
      formFilterReport.resetField('location')
      formFilterReport.resetField('assurance')
      formFilterReport.resetField('business_executives')
      formFilterReport.resetField('cost_center_ids')
      formFilterReport.resetField('bu')
      formFilterReport.resetField('asset_types')
      formFilterReport.resetField('maintenance_type')
    }
    if (searchBy === 'Padrão de Equipamento') {
      formFilterReport.resetField('employees_ids')
      formFilterReport.resetField('projects')
      formFilterReport.resetField('business_executive')
      formFilterReport.resetField('workloads_ids')
      formFilterReport.resetField('register_number')
      formFilterReport.resetField('patterns')
      formFilterReport.resetField('status_ids')
      formFilterReport.resetField('location')
      formFilterReport.resetField('assurance')
      formFilterReport.resetField('cost_center_ids')
      formFilterReport.resetField('bu')
      formFilterReport.resetField('maintenance_type')
    }
    if (searchBy === 'Manutenção/Melhoria') {
      formFilterReport.resetField('employees_ids')
      formFilterReport.resetField('projects')
      formFilterReport.resetField('business_executive')
      formFilterReport.resetField('workloads_ids')
      formFilterReport.resetField('register_number')
      formFilterReport.resetField('location')
      formFilterReport.resetField('cost_center_ids')
      formFilterReport.resetField('bu')
      formFilterReport.resetField('assurance')
      formFilterReport.resetField('business_executives')
      formFilterReport.resetField('asset_types')
    }
    if (
      searchBy === 'Manutenção/Melhoria' &&
      formFilterReport.watch('maintenance_type') === 'upgrade'
    ) {
      formFilterReport.resetField('maintenance_type')
      formFilterReport.resetField('maintenance_action_ids')
    }
    if (searchBy === 'Estoque de Equipamento') {
      formFilterReport.resetField('patterns')
      formFilterReport.resetField('status_ids')
      formFilterReport.resetField('register_number')
      formFilterReport.resetField('cost_center_ids')
    }
    setQueryEnabled(true)
    closeFilterDrawer()
  }

  const formFilterReport = useForm<ReportFormFilter>()

  const { page, onPageChange, onSearch, filters, onClearFilters } =
    usePaginationReport({
      searchParams,
      formFilterReport,
      invalidateQueryKey: 'fetchReports',
    })

  const { isPending, error, data } = useQuery({
    queryKey: [
      'fetchReports',
      {
        ...filters,
        page,
        searchBy,
        ...formFilterReport.getValues(),
      },
    ],
    queryFn: fetchReports,
    enabled: !!queryEnabled,
  })

  const [
    { data: projects, isPending: isPendingProjects, isError: isErrorProject },
    {
      data: businessExecutive,
      isPending: isPendingBusinessExecutive,
      isError: isErrorBusinessExecutive,
    }, // Gestor
    { data: pattern, isPending: isPendingPattern, isError: isErrorPattern },
    {
      data: assetTypes,
      isPending: isPendingAssetTypes,
      isError: isErrorAssetTypes,
    },
    {
      data: maintenanceActions,
      isPending: isPendingMaintenanceActions,
      isError: isErrorMaintenanceActions,
    },
    { data: dashboardData, isPending: isPendingDashboardData },
    {
      data: assetStatus,
      isPending: isPendingAssetStatus,
      isError: isErrorAssetStatus,
    },
  ] = useQueries({
    queries: [
      {
        queryKey: ['fetchProjectsSelect'],
        queryFn: fetchProjectsSelect,
      },
      {
        queryKey: ['fetchBusinessExecutiveSelect'],
        queryFn: fetchBusinessExecutiveSelect,
      },
      {
        queryKey: ['fetchPatternSelect'],
        queryFn: fetchPatternSelect,
      },
      {
        queryKey: ['fetchAssetTypes'],
        queryFn: fetchAssetTypes,
      },
      {
        queryKey: ['fetchMaintenanceActions'],
        queryFn: fetchMaintenanceActions,
      },
      {
        queryKey: ['fetchDashboard'],
        queryFn: fetchDashboardData,
      },
      {
        queryKey: ['fetchAssetStatus'],
        queryFn: fetchAssetStatus,
      },
    ],
  })

  const onDownloadExcelSheet = () => {
    formFilterReport.handleSubmit(onSubmitDownloadExcelSheet)()
  }

  const onSearchReportList = () => {
    formFilterReport.handleSubmit(onSubmitFilterReport)()
  }

  const clearAllFilters = () => {
    formFilterReport.reset()
    setPeriod([null, null])
    setSearchBy(null)
    onClearFilters()
    closeFilterDrawer()
  }

  const COLORS = [
    'var(--mantine-color-green-5)',
    'var(--mantine-color-red-5)',
    'var(--mantine-color-yellow-5)',
    'var(--mantine-color-orange-5)',
  ]
  const dataDashboardAsset = useMemo(
    () => [
      {
        label: 'Ativos',
        value: dashboardData?.totalAssets - dashboardData?.totalAssetsInactive,
      },
      { label: 'Inativos', value: dashboardData?.totalAssetsInactive },
    ],
    [dashboardData],
  )
  const dataDashboardLending = useMemo(
    () => [
      { label: 'Ativos', value: dashboardData?.totalLendingsActive },
      { label: 'Pendentes', value: dashboardData?.totalLendingsPending },
      { label: 'Distrato', value: dashboardData?.totalLendingsRevoke },
      {
        label: 'Distrato pendente',
        value: dashboardData?.totalLendingsRevokePending,
      },
    ],
    [dashboardData],
  )
  const dataDashboardMaintenance = useMemo(
    () => [
      {
        label: 'Resolvidos',
        value:
          dashboardData?.totalMaintenances -
          dashboardData?.totalMaintenancesPending,
      },
      { label: 'Pendentes', value: dashboardData?.totalMaintenancesPending },
    ],
    [dashboardData],
  )
  const dataDashboardUpgrade = useMemo(
    () => [
      {
        label: 'Resolvidos',
        value:
          +dashboardData?.totalUpgrade - +dashboardData?.totalUpgradePending,
      },
      { label: 'Pendentes', value: dashboardData?.totalUpgradePending },
    ],
    [dashboardData],
  )

  return {
    filterDrawerOpened,
    openFilterDrawer,
    closeFilterDrawer,
    onSubmitFilterReport,
    formFilterReport,
    searchBy,
    setSearchBy,
    period,
    setPeriod,
    page,
    onPageChange,
    onSearch,
    onClearFilters,
    queryEnabled,
    isListResponse: formFilterReport.watch('isListResponse'),
    isPending,
    error,
    data,
    projects,
    businessExecutive,
    pattern,
    workloads,
    assetTypes,
    maintenanceActions,
    isPendingProjects,
    isPendingBusinessExecutive,
    isPendingPattern,
    isPendingWorkload,
    isPendingAssetTypes,
    isPendingMaintenanceActions,
    isErrorProject,
    isErrorBusinessExecutive,
    isErrorPattern,
    isErrorWorkloads,
    isErrorAssetTypes,
    isErrorMaintenanceActions,
    watchMaintenanceType: formFilterReport.watch('maintenance_type'),
    roles,
    isPendingRoles,
    isErrorRoles,
    costCenter: costCenters,
    isPendingCostCenter,
    isErrorCostCenter,
    onDownloadExcelSheet,
    onSearchReportList,
    clearAllFilters,
    dataDashboardAsset,
    isPendingDashboardData,
    COLORS,
    dataDashboardLending,
    dataDashboardMaintenance,
    dataDashboardUpgrade,
    assetStatus,
    isPendingAssetStatus,
    isErrorAssetStatus,
  }
}
