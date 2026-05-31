'use client'

import { Button, Card, Flex, Tabs, Text } from '@mantine/core'
import { createFileRoute, useParams } from '@tanstack/react-router'
import { ArrowLeft, Check } from 'lucide-react'
import { FormProvider } from 'react-hook-form'

import { Breadcrumbs } from '@/components/common/breadcrumbs'
import { PageSectionHeader } from '@/components/common/page-section-header'
import FormSkeleton from '@/components/common/skeletons/form-skeleton'
import {
  AddressData,
  PersonalData,
  ProfessionalData,
} from '@/components/employees/form'
import TimelineContracts from '@/components/employees/timeline-contracts'
import TimelineTerms from '@/components/employees/timeline-terms'
import { ServerError } from '@/components/server-error'
import useEmployee from '@/hooks/employee/useEmployee'
import { useThemeColors } from '@/hooks/useThemeColors'

export const Route = createFileRoute('/_dashboard/employees/edit/$id')({
  errorComponent: () => <ServerError />,
  pendingComponent: () => <FormSkeleton />,
  component: EditEmployeePage,
})

function EditEmployeePage() {
  const { id } = useParams({ from: '/_dashboard/employees/edit/$id' })
  const {
    getSecondaryTextColor,
    getContentBackgroundColor,
    getCardBackgroundColor,
  } = useThemeColors()

  const {
    activeTab,
    setActiveTab,
    form,
    formAddress,
    onSubmitEmployeeData,
    onSubmitEmployeeAddressData,
    employee,
    maritalStatus,
    isPendingMaritalStatus,
    nationalities,
    isPendingNationality,
    roles,
    isPendingRoles,
    isErrorRoles,
    genders,
    isPendingGenders,
    educationalLevels,
    isPendingEducationalLevels,
    contractHistory,
    contractDetails,
    setContractDetails,
    modalContractOpened,
    openContractModal,
    closeContractModal,
    onDownloadDocument,
    modalTermOpened,
    openTermModal,
    closeTermModal,
    termHistory,
    termDetails,
    setTermDetails,
    canEdit,
    canViewContracts,
    canViewTerms,
    toPJ,
  } = useEmployee({
    isDetail: true,
    id,
  })

  return (
    <>
      <Breadcrumbs />
      <PageSectionHeader title="Editar colaborador" />
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
          defaultValue="personal-data"
          value={activeTab}
          onChange={setActiveTab}
        >
          <Tabs.List>
            <Tabs.Tab value="0" mb={20}>
              <Text size="sm" fw={700} c={getSecondaryTextColor()}>
                Dados Pessoais
              </Text>
            </Tabs.Tab>
            <Tabs.Tab value="1" mb={20}>
              <Text size="sm" fw={700} c={getSecondaryTextColor()}>
                Dados Profissionais
              </Text>
            </Tabs.Tab>
            <Tabs.Tab value="2" mb={20}>
              <Text size="sm" fw={700} c={getSecondaryTextColor()}>
                Endereço
              </Text>
            </Tabs.Tab>
            <Tabs.Tab value="3" mb={20}>
              <Text size="sm" fw={700} c={getSecondaryTextColor()}>
                Histórico de Contratos
              </Text>
            </Tabs.Tab>
            <Tabs.Tab value="4" mb={20}>
              <Text size="sm" fw={700} c={getSecondaryTextColor()}>
                Histórico de Termos
              </Text>
            </Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="0">
            <Text size="md" fw={700}>
              Dados Pessoais
            </Text>
            <FormProvider {...form}>
              <form onSubmit={form.handleSubmit(onSubmitEmployeeData)}>
                <PersonalData
                  form={form}
                  nationalities={nationalities}
                  isPendingNationality={isPendingNationality}
                  maritalStatus={maritalStatus}
                  isPendingMaritalStatus={isPendingMaritalStatus}
                  genders={genders}
                  isPendingGenders={isPendingGenders}
                  educationalLevels={educationalLevels}
                  isPendingEducationalLevels={isPendingEducationalLevels}
                  isEdit
                  isPJ={employee?.legalPerson}
                  canEdit={canEdit}
                />
              </form>
            </FormProvider>
          </Tabs.Panel>
          <Tabs.Panel value="1">
            <Text size="md" fw={700}>
              Dados Profissionais
            </Text>
            <FormProvider {...form}>
              <form onSubmit={form.handleSubmit(onSubmitEmployeeData)}>
                <ProfessionalData
                  form={form}
                  roles={roles}
                  isPendingRoles={isPendingRoles}
                  isErrorRoles={isErrorRoles}
                  isEdit
                  isPJ={employee?.legalPerson}
                  canEdit={canEdit}
                  toPJ={toPJ}
                />
              </form>
            </FormProvider>
          </Tabs.Panel>
          <Tabs.Panel value="2">
            <Text size="md" fw={700}>
              Endereço
            </Text>
            <FormProvider {...formAddress}>
              <form
                onSubmit={formAddress.handleSubmit(onSubmitEmployeeAddressData)}
              >
                <AddressData
                  form={formAddress}
                  isPJ={employee?.legalPerson}
                  isEdit
                  canEdit={canEdit}
                />
              </form>
            </FormProvider>
          </Tabs.Panel>
          <Tabs.Panel value="3">
            <TimelineContracts
              opened={modalContractOpened}
              open={openContractModal}
              close={closeContractModal}
              contractHistory={contractHistory}
              contractDetails={contractDetails}
              setContractDetails={setContractDetails}
              onDownloadDocument={onDownloadDocument}
              canViewContracts={canViewContracts}
            />
          </Tabs.Panel>
          <Tabs.Panel value="4">
            <TimelineTerms
              opened={modalTermOpened}
              open={openTermModal}
              close={closeTermModal}
              termHistory={termHistory}
              termDetails={termDetails}
              setTermDetails={setTermDetails}
              onDownloadDocument={onDownloadDocument}
              canViewTerms={canViewTerms}
            />
          </Tabs.Panel>
        </Tabs>

        <Flex
          justify="space-between"
          direction={activeTab === '0' ? 'row-reverse' : 'row'}
          mt={15}
        >
          {activeTab !== '0' && (
            <Button
              type="button"
              color="gray"
              variant="outline"
              radius="md"
              onClick={() => {
                setActiveTab((+activeTab! - 1)?.toString())
              }}
            >
              <ArrowLeft size={16} />
              &nbsp;Voltar
            </Button>
          )}
          {canEdit && (
            <Button
              type="button"
              variant="outline"
              radius="md"
              onClick={() =>
                formAddress.handleSubmit(onSubmitEmployeeAddressData)()
              }
            >
              Confirmar&nbsp;
              <Check size={16} />
            </Button>
          )}
        </Flex>
      </Card>
    </>
  )
}
