import { zodResolver } from '@hookform/resolvers/zod'
import { useDisclosure } from '@mantine/hooks'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import {
  type QueryFunctionContext,
  useQueries,
  useQuery,
} from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { parse } from 'date-fns'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'

import { useAbilityGuard } from '@/hooks/useAbilityGuard'
import { useDomainOptions } from '@/hooks/useDomainOptions'
import { useSubmittingMutation } from '@/hooks/useSubmittingMutation'
import { cepMask, phoneMask, rgMask, taxpayerMask } from '@/lib/utils'
import {
  employeeAddressSchema,
  employeeSchema,
} from '@/lib/validations/employee'
import {
  addEmployee,
  editEmployee,
  fetchContractHistory,
  fetchEmployee,
  fetchEmployeesList,
  fetchTermHistory,
} from '@/services/api/employee'
import type { Lending, Term } from '@/types/Lending'
import { getStateByUF } from '@/utils/getStateByUF'

import usePagination from '../usePagination'

interface FormFilter {
  full_name__ilike?: string
  legal_person?: boolean
  page?: number
  size?: string
}

interface IUseEmployee {
  searchParams?: FormFilter
  isDetail?: boolean
  id?: string | null
}

export type FormEmployeeData = z.infer<typeof employeeSchema>

export type FormEmployeeAddressData = z.infer<typeof employeeAddressSchema>

export default function useEmployee({
  searchParams,
  isDetail,
  id,
}: IUseEmployee) {
  const [activeStep, setActiveStep] = useState<number>(0)
  const [activeTab, setActiveTab] = useState<string | null>('0')
  const [contractDetails, setContractDetails] = useState<Lending | null>(null)
  const [termDetails, setTermDetails] = useState<Term | null>(null)
  const [filterOpened, { toggle: toggleFilter }] = useDisclosure(false)
  const [
    modalContractOpened,
    { open: openContractModal, close: closeContractModal },
  ] = useDisclosure(false)
  const [modalTermOpened, { open: openTermModal, close: closeTermModal }] =
    useDisclosure(false)
  const navigate = useNavigate()
  const [canEdit, setCanEdit] = useState<boolean>(false)
  const [canViewContracts, setCanViewContracts] = useState<boolean>(false)
  const [canViewTerms, setCanViewTerms] = useState<boolean>(false)

  useAbilityGuard(
    (currentAbility) => {
      if (
        (!isDetail && currentAbility.cannot('view', 'employee')) ||
        (id && currentAbility.cannot('view', 'employee'))
      ) {
        notifications.show({
          message: 'Usuário não possui permissão "Visualizar Colaboradores"',
        })
        navigate({ to: '/dashboard' })
        return
      }

      if (isDetail && !id && currentAbility.cannot('add', 'employee')) {
        notifications.show({
          message: 'Usuário não possui permissão "Adicionar Colaborador"',
        })
        navigate({ to: '/dashboard' })
        return
      }

      setCanEdit(currentAbility.can('edit', 'employee'))
      setCanViewContracts(currentAbility.can('view', 'lending'))
      setCanViewTerms(currentAbility.can('view', 'term'))
    },
    [id, isDetail, navigate],
  )

  const formFilter = useForm<FormFilter>({
    defaultValues: {
      full_name__ilike: searchParams?.full_name__ilike,
      page: searchParams?.page,
      size: searchParams?.size,
    },
  })

  const {
    page,
    onPageChange,
    onSearch,
    filters,
    onClearFilters,
    pageSize,
    onPageSizeChange,
  } = usePagination({
    searchParams,
    formFilter,
    invalidateQueryKey: 'fetchEmployees',
  })

  const form = useForm<z.infer<typeof employeeSchema>>({
    resolver: zodResolver(employeeSchema) as any,
    mode: 'onChange',
  })

  const formAddress = useForm<z.infer<typeof employeeAddressSchema>>({
    resolver: zodResolver(employeeAddressSchema),
  })

  const {
    maritalStatus,
    nationalities,
    roles,
    genders,
    educationalLevels,
    costCenters,
    isLoading: domainLoading,
    errors: domainErrors,
  } = useDomainOptions({
    keys: [
      'maritalStatus',
      'nationalities',
      'roles',
      'genders',
      'educationalLevels',
      'costCenters',
    ],
  })

  const isPendingMaritalStatus = domainLoading.maritalStatus
  const isPendingNationality = domainLoading.nationalities
  const isPendingRoles = domainLoading.roles
  const isErrorRoles = domainErrors.roles
  const isPendingGenders = domainLoading.genders
  const isPendingEducationalLevels = domainLoading.educationalLevels
  const isPendingCostCenters = domainLoading.costCenters

  const openConfirmAddModal = (data: FormEmployeeData) =>
    modals.openConfirmModal({
      id: 'confirm-add-employee-modal',
      title: 'Confirmação de dados',
      children: 'Deseja confirmar os dados e adicionar um novo colaborador?',
      centered: true,
      labels: { confirm: 'Confirmar', cancel: 'Cancelar' },
      onCancel: () => modals.close('confirm-add-employee-modal'),
      onConfirm: () => mutateAddEmployee(data),
    })

  const openConfirmEditModal = (data: FormEmployeeData) =>
    modals.openConfirmModal({
      id: 'confirm-edit-employee-modal',
      title: 'Confirmação de dados',
      children: 'Deseja confirmar os dados e editar este colaborador?',
      centered: true,
      labels: { confirm: 'Confirmar', cancel: 'Cancelar' },
      onCancel: () => modals.close('confirm-edit-employee-modal'),
      onConfirm: () => mutateEditEmployee(data),
    })

  const fetchAddressByCEP = async ({
    queryKey,
  }: QueryFunctionContext<[string, string | null | undefined]>) => {
    const [_, postalCode] = queryKey
    if (!postalCode || postalCode.length < 9) {
      formAddress.setValue('address.street', '')
      formAddress.setValue('address.complement', '')
      formAddress.setValue('address.neighbourhood', '')
      formAddress.setValue('address.city', '')
      formAddress.setValue('address.state', '')
      formAddress.clearErrors()
      return {}
    } else {
      const response = await fetch(
        `https://viacep.com.br/ws/${postalCode}/json/`,
      )
      const data = await response.json()
      formAddress.setValue(
        'address.street',
        data.logradouro?.toUpperCase() ?? '',
      )
      formAddress.setValue(
        'address.neighbourhood',
        data.bairro?.toUpperCase() ?? '',
      )
      formAddress.setValue('address.city', data.localidade?.toUpperCase() ?? '')
      formAddress.setValue('address.state', getStateByUF(data.uf))
      formAddress.clearErrors()
      formAddress.trigger()
      return data
    }
  }
  const fetchEmployeeData = async () => {
    const data = await fetchEmployee(id!)
    const address = data.address.split(';')
    const street = address[0]
    const number = address[1]
    const complement = address[2]
    const neighbourhood = address[3]
    const city = address[4]
    const state = address[5]
    const postalCode = cepMask(address[7])
    const addressObj = {
      street,
      complement,
      number,
      neighbourhood,
      city,
      state,
      postalCode,
    }
    const parsedBirthdayDate = parse(data.birthday, 'dd/MM/yyyy', new Date())
    const parsedEmployerContractDate = data.employerContractDate
      ? parse(data.employerContractDate, 'dd/MM/yyyy', new Date())
      : undefined
    const parsedEmployerEndContractDate = data.employerEndContractDate
      ? parse(data.employerEndContractDate, 'dd/MM/yyyy', new Date())
      : undefined
    form.reset({
      fullName: data.fullName,
      birthday: parsedBirthdayDate,
      taxpayerIdentification: taxpayerMask(data.taxpayerIdentification),
      nationalIdentification: rgMask(data.nationalIdentification),
      nationalityId: data?.nationality?.id?.toString(),
      maritalStatusId: data?.maritalStatus?.id?.toString(),
      cellPhone: phoneMask(data.cellPhone),
      educationalLevelId: data?.educationalLevel?.id?.toString(),
      status: data.status,
      manager: data.manager,
      email: data.email,
      role: data?.role?.id?.toString(),
      genderId: data?.gender?.id?.toString(),
      registration: data.registration,
      jobPosition: data.jobPosition,
      employerContractDate: parsedEmployerContractDate,
      employerEndContractDate: parsedEmployerEndContractDate,
      employerContractObject: data.employerContractObject || '',
      employerName: data.employerName,
      employerNumber: data.employerNumber,
      hasSolutisAsset: data.hasSolutisAsset ?? false,
      hasPersonalAsset: data.hasPersonalAsset ?? false,
      hasOtherAsset: data.hasOtherAsset ?? false,
    })
    formAddress.reset({
      address: addressObj,
    })

    // form.setValue("code" , data.code)

    return data
  }

  const onDownloadDocument = async (documentId: string) => {
    const { downloadWithNotification } =
      await import('@/utils/downloadWithNotification')

    await downloadWithNotification({
      url: `/documents/download/${documentId}/`,
      openInNewTab: true,
      successMessage: 'Documento aberto em nova aba',
      errorMessage: 'Não foi possível abrir o documento',
    })
  }

  const { isPending: isPendingAddEmployee, mutate: mutateAddEmployee } =
    useSubmittingMutation({
      mutationKey: ['createEmployee'],
      mutationFn: addEmployee,
      form,
      successMessage: 'Colaborador criado com sucesso',
      errorMessage: 'Não foi possível criar o colaborador',
      successColor: 'teal',
      onSuccess: () => {
        navigate({ to: '/employees' })
      },
    })

  const { isPending: isPendingEditEmployee, mutate: mutateEditEmployee } =
    useSubmittingMutation({
      mutationKey: ['editEmployee'],
      mutationFn: (data: FormEmployeeData) => editEmployee(id!, data),
      form,
      successMessage: 'Colaborador editado com sucesso',
      errorMessage: 'Não foi possível editar o colaborador',
      onSuccess: () => {
        navigate({ to: '/employees' })
      },
    })

  const onSubmitEmployeeData = async () => {
    if (activeStep === 0) {
      if (Object.keys(form.formState.errors).length > 0) {
        return
      }
      setActiveStep(1)
    }
  }

  const onSubmitEmployeeAddressData = async (data: FormEmployeeAddressData) => {
    const dataCleaned = JSON.parse(
      JSON.stringify({
        ...data,
        ...form.getValues(),
      }),
    )

    const street = dataCleaned.address?.street ?? ''
    const number = dataCleaned.address?.number ?? ''
    const complement = dataCleaned.address?.complement ?? ''
    const neighbourhood = dataCleaned.address?.neighbourhood ?? ''
    const city = dataCleaned.address?.city ?? ''
    const state = dataCleaned.address?.state ?? ''
    const rawCep = dataCleaned.address?.postalCode ?? ''
    const cep = rawCep.replace(/\D/g, '')

    dataCleaned.address =
      `${street};${number};${complement};${neighbourhood};${city};${state};Brasil;${cep}`.toUpperCase()

    dataCleaned.birthday = dataCleaned.birthday
      ? dataCleaned.birthday.split('T')[0]
      : null

    dataCleaned.employerContractDate = dataCleaned.employerContractDate
      ? dataCleaned.employerContractDate.split('T')[0]
      : null
    if (!dataCleaned.employerContractDate) delete dataCleaned.employerContractDate

    dataCleaned.employerEndContractDate = dataCleaned.employerEndContractDate
      ? dataCleaned.employerEndContractDate.split('T')[0]
      : null
    if (!dataCleaned.employerEndContractDate) delete dataCleaned.employerEndContractDate

    dataCleaned.nationalIdentification =
      dataCleaned.nationalIdentification?.replace(/\D/g, '') ?? ''
    dataCleaned.taxpayerIdentification =
      dataCleaned.taxpayerIdentification?.replace(/\D/g, '') ?? ''

    dataCleaned.employerNumber = dataCleaned.employerNumber
      ? dataCleaned.employerNumber.replace(/\D/g, '')
      : null
    if (!dataCleaned.employerNumber) delete dataCleaned.employerNumber

    if (!dataCleaned.role) delete dataCleaned.role
    if (!dataCleaned.jobPosition) delete dataCleaned.jobPosition

    dataCleaned.fullName = dataCleaned.fullName
      ? dataCleaned.fullName.toUpperCase()
      : ''
    dataCleaned.cellPhone = dataCleaned.cellPhone
      ? dataCleaned.cellPhone.replace(/\D/g, '')
      : ''

    if (id) {
      delete dataCleaned.status // Status não é editável
      openConfirmEditModal(dataCleaned)
    } else if (id === null && activeStep === 1) {
      openConfirmAddModal(dataCleaned)
    }
  }

  const { isPending, error, data } = useQuery({
    queryKey: [
      'fetchEmployees',
      {
        ...filters,
        page: page,
        size: pageSize,
      },
    ],
    queryFn: fetchEmployeesList,
    enabled: !isDetail,
  })

  const [
    { data: contractHistory, isPending: isPendingContractHistory },
    { data: termHistory },
    { data: employee },
  ] = useQueries({
    queries: [
      {
        queryKey: ['fetchContractHistory', id],
        queryFn: fetchContractHistory,
        enabled: !!id,
      },
      {
        queryKey: ['fetchTermHistory', id],
        queryFn: fetchTermHistory,
        enabled: !!id,
      },
      {
        queryKey: ['fetchEmployee'],
        queryFn: () => fetchEmployeeData(),
        enabled: !!id,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: false,
      },
    ],
  })

  const toPJ = useWatch({
    control: form.control,
    name: 'toLegalPerson',
  })

  const { isPending: _isPendingAddress, isError: _isErrorAddress } = useQuery({
    queryKey: ['fetchAddress', formAddress.watch('address.postalCode')],
    queryFn: fetchAddressByCEP,
    enabled:
      !!isDetail && !!formAddress.formState?.dirtyFields?.address?.postalCode,
  })

  return {
    formFilter,
    onSearch,
    onClearFilters,
    pageSize,
    onPageSizeChange,
    onPageChange,
    filterOpened,
    toggleFilter,
    page,
    data,
    isPending,
    error,
    activeStep,
    setActiveStep,
    activeTab,
    setActiveTab,
    onDownloadDocument,
    form,
    formAddress,
    onSubmitEmployeeData,
    onSubmitEmployeeAddressData,
    isPendingAddEmployee,
    isPendingEditEmployee,
    openConfirmAddModal,
    openConfirmEditModal,
    employee,
    contractHistory,
    isPendingContractHistory,
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
    costCenters,
    isPendingCostCenters,
    contractDetails,
    setContractDetails,
    modalContractOpened,
    openContractModal,
    closeContractModal,
    termHistory,
    termDetails,
    setTermDetails,
    modalTermOpened,
    openTermModal,
    closeTermModal,
    canEdit,
    canViewContracts,
    canViewTerms,
    toPJ,
  }
}
