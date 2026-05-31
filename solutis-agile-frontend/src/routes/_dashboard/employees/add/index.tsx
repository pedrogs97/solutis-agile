'use client'

import { Avatar, Button, Card, Center, Flex, Text } from '@mantine/core'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight, Check, ChevronRight, X } from 'lucide-react'
import { FormProvider } from 'react-hook-form'

import { Breadcrumbs } from '@/components/common/breadcrumbs'
import { PageSectionHeader } from '@/components/common/page-section-header'
import FormSkeleton from '@/components/common/skeletons/form-skeleton'
import {
  AddressData,
  PersonalData,
  ProfessionalData,
} from '@/components/employees/form'
import { ServerError } from '@/components/server-error'
import useEmployee from '@/hooks/employee/useEmployee'
import { useThemeColors } from '@/hooks/useThemeColors'

export const Route = createFileRoute('/_dashboard/employees/add/')({
  errorComponent: () => <ServerError />,
  pendingComponent: () => <FormSkeleton />,
  component: AddEmployeePage,
})

function AddEmployeePage() {
  const { getContentBackgroundColor } = useThemeColors()
  const navigate = useNavigate()
  const {
    activeStep,
    setActiveStep,
    form,
    formAddress,
    onSubmitEmployeeData,
    onSubmitEmployeeAddressData,
    isPendingAddEmployee,
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
    canEdit,
  } = useEmployee({
    isDetail: true,
    id: null,
  })

  return (
    <>
      <Breadcrumbs />
      <PageSectionHeader title="Novo colaborador" />
      <Card
        shadow="sm"
        p={20}
        style={{
          borderRadius: 25,
          minHeight: 500,
        }}
        bg={getContentBackgroundColor()}
      >
        <Center mb={20}>
          <Flex direction="column" justify="center" align="center" mr={30}>
            <Avatar
              variant="filled"
              color={activeStep === 0 ? 'blue' : 'green'}
              radius="xl"
            >
              {activeStep === 0 ? (
                <Text size="xl" fw={700}>
                  1
                </Text>
              ) : (
                <Check />
              )}
            </Avatar>
            <Text size="sm" fw={700}>
              Dados Gerais
            </Text>
          </Flex>
          <ChevronRight size={24} />
          <Flex direction="column" justify="center" align="center" ml={30}>
            <Avatar
              variant="filled"
              color={activeStep === 1 ? 'blue' : 'gray'}
              radius="xl"
            >
              {activeStep === 1 ? (
                <Text size="xl" fw={700}>
                  2
                </Text>
              ) : (
                <X />
              )}
            </Avatar>
            <Text size="sm" fw={700}>
              Endereço
            </Text>
          </Flex>
        </Center>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmitEmployeeData)}>
            {activeStep === 0 && (
              <>
                <Text size="md" fw={700}>
                  Dados Pessoais
                </Text>
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
                  isEdit={false}
                  isPJ={true}
                  canEdit={canEdit}
                />
                <Text size="md" fw={700}>
                  Dados Profissionais
                </Text>
                <Text size="sm" c="dimmed" mb={10}>
                  Preenchimento apenas para PJ
                </Text>
                <ProfessionalData
                  form={form}
                  roles={roles}
                  isPendingRoles={isPendingRoles}
                  isErrorRoles={isErrorRoles}
                  isEdit={false}
                  isPJ={true}
                  canEdit={canEdit}
                  toPJ={false}
                />
                <Flex justify="space-between">
                  <Button
                    type="button"
                    color="gray"
                    variant="outline"
                    radius="md"
                    onClick={() => {
                      navigate({ to: '/employees' })
                    }}
                  >
                    <ArrowLeft size={16} />
                    &nbsp;Voltar
                  </Button>
                  <Button type="submit" variant="outline" radius="md">
                    Próximo&nbsp;
                    <ArrowRight size={16} />
                  </Button>
                </Flex>
              </>
            )}
          </form>
        </FormProvider>
        <FormProvider {...formAddress}>
          <form
            onSubmit={formAddress.handleSubmit(onSubmitEmployeeAddressData)}
          >
            {activeStep === 1 && (
              <>
                <AddressData
                  form={formAddress}
                  isEdit={false}
                  isPJ={true}
                  canEdit={canEdit}
                />
                <Flex justify="space-between" mt="auto">
                  <Button
                    type="button"
                    variant="outline"
                    radius="md"
                    onClick={() => {
                      setActiveStep(0)
                    }}
                  >
                    <ArrowLeft size={16} />
                    &nbsp;Anterior
                  </Button>
                  <Button
                    type="submit"
                    variant="filled"
                    radius="md"
                    disabled={
                      isPendingAddEmployee || formAddress.formState.isSubmitting
                    }
                  >
                    Confirmar&nbsp;
                    <Check size={16} />
                  </Button>
                </Flex>
              </>
            )}
          </form>
        </FormProvider>
      </Card>
    </>
  )
}
