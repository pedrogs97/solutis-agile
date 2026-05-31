'use client'

import { Card, Tabs, Text } from '@mantine/core'
import { createFileRoute, useParams } from '@tanstack/react-router'

import { FinancialDetails, GeneralData } from '@/components/assets/form'
import {
  TimelineContracts,
  TimelineMaintenances,
  TimelineUpgrades,
} from '@/components/assets/timeline'
import { Breadcrumbs } from '@/components/common/breadcrumbs'
import LoadingScreen from '@/components/common/loading-screen'
import { PageSectionHeader } from '@/components/common/page-section-header'
import { ServerError } from '@/components/server-error'
import useAssetDetail from '@/hooks/asset/useAssetDetail'
import { useThemeColors } from '@/hooks/useThemeColors'

export const Route = createFileRoute('/_dashboard/assets/edit/$id')({
  errorComponent: () => <ServerError />,
  pendingComponent: () => <LoadingScreen />,
  component: EditAssetPage,
})

function EditAssetPage() {
  const { id } = useParams({ from: '/_dashboard/assets/edit/$id' })
  const {
    getContentBackgroundColor,
    getCardBackgroundColor,
    getSecondaryTextColor,
  } = useThemeColors()
  const {
    activeTab,
    hasInsurance,
    asset,
    assetStatus,
    assetType,
    assetTypes,
    isPendingAssetTypes,
    isPendingAssetStatus,
    setActiveTab,
    setHasInsurance,
    formProps,
    canEdit,
    canViewLendings,
    canViewMaintenance,
    validateGeneralData,
  } = useAssetDetail(id)

  return (
    <>
      <Breadcrumbs />
      <PageSectionHeader title="Editar ativo" />
      <Card
        shadow="sm"
        p={20}
        style={{
          borderRadius: 25,
          minHeight: 350,
        }}
        bg={getContentBackgroundColor()}
      >
        <Tabs
          color={getCardBackgroundColor()}
          variant="pills"
          radius="md"
          defaultValue="general-data"
          value={activeTab}
          onChange={(tab) => {
            if (tab === 'financial-details') {
              validateGeneralData()
            } else {
              setActiveTab(tab)
            }
          }}
        >
          <Tabs.List mb={20}>
            <Tabs.Tab value="general-data">
              <Text size="sm" fw={700} c={getSecondaryTextColor()}>
                Dados Gerais
              </Text>
            </Tabs.Tab>
            <Tabs.Tab value="financial-details">
              <Text size="sm" fw={700} c={getSecondaryTextColor()}>
                Detalhes Financeiros
              </Text>
            </Tabs.Tab>
            <Tabs.Tab value="maintenances">
              <Text size="sm" fw={700} c={getSecondaryTextColor()}>
                Manutenção
              </Text>
            </Tabs.Tab>
            <Tabs.Tab value="upgrades">
              <Text size="sm" fw={700} c={getSecondaryTextColor()}>
                Melhoria
              </Text>
            </Tabs.Tab>
            <Tabs.Tab value="contracts">
              <Text size="sm" fw={700} c={getSecondaryTextColor()}>
                Comodato
              </Text>
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="general-data">
            <GeneralData
              asset={asset}
              assetStatus={assetStatus}
              assetType={assetType}
              assetTypes={assetTypes}
              isPendingAssetStatus={isPendingAssetStatus}
              isPendingAssetTypes={isPendingAssetTypes}
              isEdit={!!id}
              canEdit={canEdit}
              {...formProps}
            />
          </Tabs.Panel>
          <Tabs.Panel value="financial-details">
            <FinancialDetails
              asset={asset}
              hasInsurance={hasInsurance}
              setActiveTab={setActiveTab}
              setHasInsurance={setHasInsurance}
              isEdit={!!id}
              {...formProps}
            />
          </Tabs.Panel>
          <Tabs.Panel value="maintenances">
            {canViewMaintenance && <TimelineMaintenances assetId={id} />}
          </Tabs.Panel>
          <Tabs.Panel value="upgrades">
            {canViewMaintenance && <TimelineUpgrades assetId={id} />}
          </Tabs.Panel>
          <Tabs.Panel value="contracts">
            <TimelineContracts assetId={id} canViewLendings={canViewLendings} />
          </Tabs.Panel>
        </Tabs>
      </Card>
    </>
  )
}
