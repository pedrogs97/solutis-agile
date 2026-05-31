import { zodResolver } from '@hookform/resolvers/zod'
import { notifications } from '@mantine/notifications'
import { useMutation, useQueries } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { AxiosError } from 'axios'
import { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'

import type { Option } from '@/components/common/async-select'
import {
  typeAccessoriesInput,
  typeComputerInputs,
  typeModelInput,
  typePatrimonialInputs,
  typePhoneInput,
  typeQuantityInput,
} from '@/constants/assetTypes'
import { useAbilityGuard } from '@/hooks/useAbilityGuard'
import axios from '@/lib/axios'
import { getErrorMessage } from '@/lib/utils'
import { assetSchema } from '@/lib/validations/asset'
import { fetchAssetStatus, fetchAssetTypes } from '@/services/api/asset'
import { type ErrorResponse } from '@/types/ApiResponse'
import { type Asset } from '@/types/Asset'

type FormDataAsset = z.input<typeof assetSchema>

const translatePattern = (value: string) =>
  value === 'PADRAO STUDIO' ? 'PADRÃO STUDIO' : value

const safeParseDate = (value: string | null | undefined): Date | undefined => {
  if (!value) return undefined
  const date = new Date(value)
  return isNaN(date.getTime()) ? undefined : date
}

const cleanPayloadByType = (
  data: Record<string, unknown>,
): Record<string, unknown> => {
  const typeId = data.typeId as string
  const cleaned = { ...data }

  // Patrimonial inputs: registerNumber, serialNumber
  if (!typePatrimonialInputs.includes(typeId)) {
    cleaned.registerNumber = null
    cleaned.serialNumber = null
  }

  // Model input: model
  if (!typeModelInput.includes(typeId)) {
    cleaned.model = null
  }

  // Computer inputs: pattern, operationalSystem, msOffice, configuration
  if (!typeComputerInputs.includes(typeId)) {
    cleaned.pattern = null
    cleaned.operationalSystem = null
    cleaned.msOffice = false
    cleaned.configuration = null
  }

  // Phone inputs: imei, lineNumber, operator
  if (!typePhoneInput.includes(typeId)) {
    cleaned.imei = null
    cleaned.lineNumber = null
    cleaned.operator = null
  }

  // Accessories input: accessories
  if (!typeAccessoriesInput.includes(typeId)) {
    cleaned.accessories = null
  }

  // Quantity input: quantity, unit
  if (!typeQuantityInput.includes(typeId)) {
    cleaned.quantity = null
    cleaned.unit = null
  }

  return cleaned
}

const emptyAssetValues: FormDataAsset = {
  typeId: '',
  statusId: '',
  description: '',
  value: 0,
  msOffice: false,
  active: true,
  registerNumber: '',
  serialNumber: '',
  model: '',
  unit: '',
  pattern: '',
  operationalSystem: '',
  imei: '',
  lineNumber: '',
  operator: '',
  configuration: '',
  accessories: '',
  observations: '',
  supplier: '',
  acquisitionDate: undefined,
  assuranceDate: undefined,
  invoiceNumber: '',
  depreciation: 0,
  code: undefined,
  discardReason: undefined,
  quantity: undefined,
  byAgile: undefined,
}

function normalizeAssetToForm(asset: Asset): FormDataAsset {
  return {
    typeId: asset.type?.id?.toString() ?? '',
    statusId:
      typeof asset.status === 'string'
        ? asset.status
        : (asset.status?.id?.toString() ?? ''),
    description: asset.description ?? '',
    value: asset.value ? Number(asset.value) : 0,
    msOffice: asset.msOffice ?? false,
    active: asset.active ?? true,
    registerNumber: asset.registerNumber ?? '',
    serialNumber: asset.serialNumber ?? '',
    model: asset.model ?? '',
    unit: asset.unit ?? '',
    pattern: translatePattern(asset.pattern ?? ''),
    operationalSystem: asset.operationalSystem ?? '',
    imei: asset.imei ?? '',
    lineNumber: asset.lineNumber ?? '',
    operator: asset.operator ?? '',
    configuration: asset.configuration ?? '',
    accessories: asset.accessories ?? '',
    observations: asset.observations ?? '',
    supplier: asset.supplier ?? '',
    acquisitionDate: safeParseDate(asset.acquisitionDate),
    assuranceDate: safeParseDate(asset.assuranceDate),
    invoiceNumber: asset.invoiceNumber ?? '',
    depreciation: asset.depreciation ?? 0,
    code: asset.code ?? undefined,
    discardReason: asset.discardReason ?? undefined,
    quantity: asset.quantity ?? undefined,
    byAgile: asset.byAgile ?? undefined,
  }
}

export default function useAssetDetail(id: string | null) {
  const [activeTab, setActiveTab] = useState<string | null>('general-data')
  const [hasInsurance, setHasInsurance] = useState<boolean>(false)
  const [employeesSelected, setEmployeesSelected] = useState<Option | null>(
    null,
  )
  const [canEdit, setCanEdit] = useState(false)
  const [canViewMaintenance, setCanViewMaintenance] = useState(false)
  const [canViewLendings, setCanViewLendings] = useState(false)

  const navigate = useNavigate()

  useAbilityGuard(
    (currentAbility) => {
      if (
        (id && currentAbility.cannot('view', 'asset')) ||
        (!id && currentAbility.cannot('add', 'asset'))
      ) {
        notifications.show({
          message: 'Usuário não possui permissão "Visualizar Ativo"',
        })
        navigate({ to: '/dashboard' })
        return
      }

      setCanEdit(currentAbility.can('edit', 'asset'))
      setCanViewMaintenance(currentAbility.can('view', 'maintenance'))
      setCanViewLendings(currentAbility.can('view', 'lending'))
    },
    [id, navigate],
  )

  const fetchAsset = async () => {
    if (!id) {
      return null
    }

    const { data } = await axios.get<Asset>(`/assets/${id}/`)

    return { ...data, assetType: data.type?.name ?? '' } as Asset
  }

  const [
    { data: asset },
    { data: assetTypes, isPending: isPendingAssetTypes },
    { data: assetStatus, isPending: isPendingAssetStatus },
  ] = useQueries({
    queries: [
      {
        queryKey: ['fetchAsset', id],
        queryFn: fetchAsset,
        enabled: Boolean(id),
      },
      {
        queryKey: ['fetchAssetTypes'],
        queryFn: fetchAssetTypes,
      },
      {
        queryKey: ['fetchAssetStatus'],
        queryFn: fetchAssetStatus,
      },
    ],
  })

  const formValues = useMemo<FormDataAsset>(
    () => (asset ? normalizeAssetToForm(asset) : { ...emptyAssetValues }),
    [asset],
  )

  const formAsset = useForm<FormDataAsset>({
    resolver: zodResolver(assetSchema),
    mode: 'onChange',
    shouldFocusError: true,
    values: formValues,
  })

  const assetType = useWatch({
    control: formAsset.control,
    name: 'typeId',
  })

  const validateGeneralData = () => {
    const typeId = formAsset.getValues('typeId') ?? ''
    const fields: Array<keyof FormDataAsset> = [
      'description',
      'typeId',
      'statusId',
    ]

    if (typePatrimonialInputs.includes(typeId)) {
      if (typeId !== '10') {
        fields.push('registerNumber')
      }
      fields.push('serialNumber')
    }

    if (typeAccessoriesInput.includes(typeId)) {
      fields.push('accessories')
    }

    if (typeComputerInputs.includes(typeId)) {
      fields.push('pattern', 'operationalSystem', 'configuration')
    }

    if (typePhoneInput.includes(typeId)) {
      fields.push('imei', 'lineNumber', 'operator')
    }

    if (typeModelInput.includes(typeId)) {
      fields.push('model')
    }

    void formAsset.trigger(fields, { shouldFocus: true }).then((isValid) => {
      if (isValid) {
        setActiveTab('financial-details')
      }
    })
  }

  useEffect(() => {
    setHasInsurance(Boolean(asset?.assuranceDate))
  }, [asset])

  // by_agile - se for true a gente pode editar o ativo, se não n pode
  const { mutate: mutateUpdateAsset } = useMutation({
    mutationKey: ['editAsset'],
    mutationFn: async (data: any) => {
      const { data: response } = await axios.patch(`/assets/${id}/`, data)
      return response
    },
    onSuccess: () => {
      notifications.show({
        title: 'Sucesso',
        message: 'Ativo editado com sucesso',
        color: 'green',
        autoClose: 5000,
      })
    },
    onError: (error: AxiosError<ErrorResponse[]>) => {
      const errors = error?.response?.data
      errors?.forEach(({ field, error }) => {
        formAsset.setError(field as keyof FormDataAsset, {
          type: 'custom',
          message: error,
        })
      })
      notifications.show({
        title: 'Erro',
        message: 'Não foi possível editar o ativo',
        color: 'red',
        autoClose: 5000,
      })
    },
  })

  const { mutate: mutateAddAsset } = useMutation({
    mutationKey: ['addAsset'],
    mutationFn: async (data: any) => {
      const { data: response } = await axios.post('/assets/', data)
      return response
    },
    onSuccess: (data: any) => {
      notifications.show({
        title: 'Sucesso',
        message: 'Ativo criado com sucesso',
        color: 'green',
        autoClose: 5000,
      })
      navigate({ to: `/assets/edit/${data.id}` })
    },
    onError: (error: AxiosError<ErrorResponse[]>) => {
      const errorMessage = getErrorMessage(error?.response?.data)
      if (typeof errorMessage === 'object') {
        formAsset.setError(errorMessage.field as keyof FormDataAsset, {
          type: 'custom',
          message: errorMessage.error,
        })
      }
    },
  })

  const onSubmit = (data: FormDataAsset) => {
    const acquisitionDate = data.acquisitionDate as Date | undefined
    const assuranceDate = data.assuranceDate as Date | undefined
    const dataCleaned = cleanPayloadByType(
      JSON.parse(
        JSON.stringify({
          ...data,
          acquisitionDate: acquisitionDate?.toISOString().split('T')[0],
          assuranceDate: assuranceDate?.toISOString().split('T')[0],
        }),
      ),
    )
    dataCleaned.description = (dataCleaned.description as string)
      .trim()
      .toUpperCase()
    dataCleaned.supplier = (dataCleaned.supplier as string).trim().toUpperCase()
    dataCleaned.code = dataCleaned.registerNumber?.toString().padStart(10, '0')
    if (dataCleaned.imei) {
      dataCleaned.imei = dataCleaned.imei.toString()
    }
    if (
      dataCleaned?.registerNumber &&
      dataCleaned.registerNumber.toString().length < 10
    ) {
      dataCleaned.registerNumber = dataCleaned.registerNumber
        ?.toString()
        .padStart(10, '0')
    }

    if (id) {
      mutateUpdateAsset(dataCleaned)
    } else {
      mutateAddAsset(dataCleaned)
    }
  }

  const formProps = {
    ...formAsset,
    errors: formAsset.formState.errors,
    validateGeneralData,
    onSubmit,
  }

  return {
    activeTab,
    hasInsurance,
    asset,
    assetType,
    assetStatus,
    isPendingAssetStatus,
    assetTypes,
    isPendingAssetTypes,
    setActiveTab,
    setHasInsurance,
    formAsset,
    formProps,
    employeesSelected,
    setEmployeesSelected,
    canEdit,
    canViewLendings,
    canViewMaintenance,
    onSubmit,
    validateGeneralData,
  }
}
