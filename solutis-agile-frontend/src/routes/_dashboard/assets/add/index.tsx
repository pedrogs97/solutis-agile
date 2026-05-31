'use client'

import { Card, Tabs, Text } from '@mantine/core'
import { createFileRoute } from '@tanstack/react-router'

import { FinancialDetails, GeneralData } from '@/components/assets/form'
import { Breadcrumbs } from '@/components/common/breadcrumbs'
import { PageSectionHeader } from '@/components/common/page-section-header'
import FormSkeleton from '@/components/common/skeletons/form-skeleton'
import { ServerError } from '@/components/server-error'
import useAssetDetail from '@/hooks/asset/useAssetDetail'
import { useThemeColors } from '@/hooks/useThemeColors'

export const Route = createFileRoute('/_dashboard/assets/add/')({
  errorComponent: () => <ServerError />,
  pendingComponent: () => <FormSkeleton />,
  component: AddAssetPage,
})

function AddAssetPage() {
  const {
    getContentBackgroundColor,
    getSecondaryTextColor,
    getCardBackgroundColor,
  } = useThemeColors()
  const {
    asset,
    activeTab,
    hasInsurance,
    assetStatus,
    assetType,
    assetTypes,
    isPendingAssetTypes,
    isPendingAssetStatus,
    setActiveTab,
    setHasInsurance,
    formProps,
    canEdit,
    validateGeneralData,
  } = useAssetDetail(null)

  return (
    <>
      <Breadcrumbs />
      <PageSectionHeader title="Novo ativo" />

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
          <Tabs.List>
            <Tabs.Tab value="general-data" mb={20}>
              <Text size="sm" fw={700} c={getSecondaryTextColor()}>
                Dados Gerais
              </Text>
            </Tabs.Tab>
            <Tabs.Tab value="financial-details" mb={20}>
              <Text size="sm" fw={700} c={getSecondaryTextColor()}>
                Detalhes Financeiros
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
              isEdit={false}
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
              isEdit={false}
              {...formProps}
            />
          </Tabs.Panel>
        </Tabs>
      </Card>
    </>
  )
}
