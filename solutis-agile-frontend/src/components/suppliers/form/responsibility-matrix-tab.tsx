'use client'

import { Badge, Box, Card, Group, Stack, Table, Text } from '@mantine/core'
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'

import { type ResponsibilityMatrixData } from '@/services/api/supplier'

const MATRIX_STORAGE_KEY = 'form_draft_supplier_matrix'

type ResponsibilityType = 'A' | 'R' | 'C' | 'I' | 'A/R' | '-'

const RESPONSIBILITY_TYPES = {
  A: {
    label: 'Accountable',
    color: 'blue',
    description: 'Responsável pela atividade.',
  },
  R: {
    label: 'Responsible',
    color: 'green',
    description: 'Realiza/executa a atividade.',
  },
  C: {
    label: 'Consulted',
    color: 'purple',
    description: 'Consulta para a tomada de decisão.',
  },
  I: {
    label: 'Informed',
    color: 'orange',
    description: 'Informado sobre o andamento ou resultado.',
  },
}

const AREAS = [
  'ÁREA SOLICITANTE',
  'ADMINISTRATIVO/CADASTRO',
  'JURÍDICO',
  'FINANCEIRO',
  'INTEGRIDADE/COMPLIANCE',
  'DIRETORIA/GESTÃO',
]

const ACTIVITIES_CONFIG = [
  {
    name: 'Solicitação e justificativa de contratação',
    apiKey: 'contract_request',
  },
  {
    name: 'Análise de documentos cadastrais do fornecedor',
    apiKey: 'document_analysis',
  },
  {
    name: 'Consulta de risco e verificação de integridade do fornecedor (due diligence)',
    apiKey: 'risk_consultation',
  },
  {
    name: 'Avaliação de desempenho e classificação de risco do fornecedor',
    apiKey: 'risk_assessment',
  },
  {
    name: 'Criação e/ou atualização do cadastro no sistema (Ágile, etc.)',
    apiKey: 'system_registration',
  },
  {
    name: 'Envio e recebimento da ficha cadastral/declarações',
    apiKey: 'form_handling',
  },
  {
    name: 'Elaboração de minuta contratual',
    apiKey: 'contract_draft',
  },
  {
    name: 'Validação de cláusulas de compliance, LGPD, trabalho análogo, etc.',
    apiKey: 'compliance_validation',
  },
  {
    name: 'Aprovação final para contratação',
    apiKey: 'final_approval',
  },
  {
    name: 'Envio de contrato para assinatura',
    apiKey: 'contract_signing',
  },
  {
    name: 'Armazenamento e gestão documental do contrato',
    apiKey: 'document_management',
  },
  {
    name: 'Liberação para pagamentos/faturamento',
    apiKey: 'payment_release',
  },
  {
    name: 'Acompanhamento da execução do contrato.',
    apiKey: 'contract_execution_monitoring',
  },
]

const AREA_API_MAPPING = {
  'ÁREA SOLICITANTE': 'requesting_area',
  'ADMINISTRATIVO/CADASTRO': 'administrative',
  JURÍDICO: 'legal',
  FINANCEIRO: 'financial',
  'INTEGRIDADE/COMPLIANCE': 'integrity',
  'DIRETORIA/GESTÃO': 'board',
}

// Convert snake_case to camelCase for API
const toCamelCase = (str: string): string => {
  return str.replace(/_([a-z])/g, (_match, letter) => letter.toUpperCase())
}

// Convert camelCase to snake_case for API
const toSnakeCase = (str: string): string => {
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '') // Remove leading underscore if any
}

// Selectable button group for responsibility selection
interface ResponsibilityButtonGroupProps {
  value: ResponsibilityType
  onChange: (value: ResponsibilityType) => void
}

const ResponsibilityButtonGroup = ({
  value,
  onChange,
}: ResponsibilityButtonGroupProps) => {
  const options: ResponsibilityType[] = ['-', 'A', 'R', 'C', 'I', 'A/R']

  const getOptionStyle = (option: ResponsibilityType) => {
    const isSelected = value === option

    let color = 'var(--mantine-color-gray-6)'

    if (option === '-') {
      color = 'var(--mantine-color-gray-7)'
    } else if (option === 'A') {
      color = 'var(--mantine-color-blue-6)'
    } else if (option === 'R') {
      color = 'var(--mantine-color-green-6)'
    } else if (option === 'C') {
      color = 'var(--mantine-color-violet-6)'
    } else if (option === 'I') {
      color = 'var(--mantine-color-orange-6)'
    } else if (option === 'A/R') {
      color = 'var(--mantine-color-indigo-6)'
    }

    return {
      backgroundColor: isSelected ? color : 'var(--mantine-color-default)',
      color: isSelected
        ? 'var(--mantine-color-white)'
        : 'var(--mantine-color-text)',
      border: `1px solid ${
        isSelected ? color : 'var(--mantine-color-default-border)'
      }`,
      borderRadius: '50%',
      fontSize: '9px',
      fontWeight: 600,
      cursor: 'pointer',
      width: '24px',
      height: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease',
      userSelect: 'none' as const,
      boxShadow: isSelected ? '0 1px 3px rgba(0, 0, 0, 0.25)' : 'none',
    }
  }

  return (
    <Group gap={2} justify="center" wrap="nowrap">
      {options.map((option) => (
        <Box
          key={option}
          style={getOptionStyle(option)}
          onClick={() => onChange(option)}
          title={
            option === 'A/R'
              ? 'Accountable/Responsible'
              : option === '-'
                ? 'None'
                : option
          }
        >
          <Text size="xs" fw={600} style={{ lineHeight: 1 }}>
            {option === '-' ? '−' : option === 'A/R' ? 'AR' : option}
          </Text>
        </Box>
      ))}
    </Group>
  )
}

export interface ResponsibilityMatrixTabRef {
  getMatrixData: (supplierId: number) => ResponsibilityMatrixData
  clearDraft: () => void
}

export type MatrixDraftDecision = 'pending' | 'restore' | 'discard' | 'none'

interface ResponsibilityMatrixTabProps {
  initialData?: ResponsibilityMatrixData
  mode?: 'create' | 'edit'
  draftDecision?: MatrixDraftDecision
}

const hasMeaningfulMatrixDraft = (
  data:
    | Omit<
        ResponsibilityMatrixData,
        'supplier' | 'id' | 'createdAt' | 'updatedAt'
      >
    | null
    | undefined,
): boolean => {
  if (!data) return false

  return Object.values(data).some((value) => {
    if (typeof value !== 'string') return false
    const normalized = value.trim()
    return normalized.length > 0 && normalized !== '-'
  })
}

// Função auxiliar para carregar dados do localStorage
const loadMatrixFromStorage = (): Omit<
  ResponsibilityMatrixData,
  'supplier' | 'id' | 'createdAt' | 'updatedAt'
> | null => {
  try {
    const stored = localStorage.getItem(MATRIX_STORAGE_KEY)
    if (!stored) return null

    const parsed = JSON.parse(stored) as Omit<
      ResponsibilityMatrixData,
      'supplier' | 'id' | 'createdAt' | 'updatedAt'
    >

    if (!hasMeaningfulMatrixDraft(parsed)) {
      localStorage.removeItem(MATRIX_STORAGE_KEY)
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export const ResponsibilityMatrixTab = forwardRef<
  ResponsibilityMatrixTabRef,
  ResponsibilityMatrixTabProps
>(({ initialData, mode = 'create', draftDecision = 'none' }, ref) => {
  const [matrixData, setMatrixData] = useState<
    Omit<
      ResponsibilityMatrixData,
      'supplier' | 'id' | 'createdAt' | 'updatedAt'
    >
  >(() => {
    // No modo de criação, verificar se deve restaurar do localStorage
    if (mode === 'create' && draftDecision === 'restore') {
      const savedData = loadMatrixFromStorage()
      if (savedData) return savedData
    }

    // Initialize with initial data if provided, otherwise with empty values
    if (initialData) {
      const {
        supplier: _supplier,
        id: _id,
        createdAt: _createdAt,
        updatedAt: _updatedAt,
        ...matrixDataWithoutSupplier
      } = initialData

      // The API returns camelCase, but our interface expects camelCase too
      // No conversion needed, just remove the non-matrix fields
      const sanitizedMatrix = {} as Omit<
        ResponsibilityMatrixData,
        'supplier' | 'id' | 'createdAt' | 'updatedAt'
      >

      Object.entries(matrixDataWithoutSupplier).forEach(([key, value]) => {
        sanitizedMatrix[key as keyof typeof sanitizedMatrix] =
          (value as ResponsibilityType) && value !== ''
            ? (value as ResponsibilityType)
            : '-'
      })

      return sanitizedMatrix
    }

    // Initialize with all fields empty using camelCase format
    const emptyMatrix = {} as Omit<
      ResponsibilityMatrixData,
      'supplier' | 'id' | 'createdAt' | 'updatedAt'
    >
    ACTIVITIES_CONFIG.forEach((activity) => {
      Object.values(AREA_API_MAPPING).forEach((areaKey) => {
        // Convert snake_case internal key to camelCase for the interface
        const camelCaseKey = toCamelCase(
          `${activity.apiKey}_${areaKey}`,
        ) as keyof Omit<
          ResponsibilityMatrixData,
          'supplier' | 'id' | 'createdAt' | 'updatedAt'
        >
        emptyMatrix[camelCaseKey] = '-'
      })
    })
    return emptyMatrix
  })

  const updateResponsibility = (
    activityKey: string,
    area: string,
    value: ResponsibilityType,
  ) => {
    // Build camelCase field key for the interface
    const snakeCaseKey = `${activityKey}_${
      AREA_API_MAPPING[area as keyof typeof AREA_API_MAPPING]
    }`
    const fieldKey = toCamelCase(snakeCaseKey) as keyof Omit<
      ResponsibilityMatrixData,
      'supplier' | 'id' | 'createdAt' | 'updatedAt'
    >

    setMatrixData((prev) => ({
      ...prev,
      [fieldKey]: value || '-',
    }))
  }

  const getResponsibilityValue = (
    activityKey: string,
    area: string,
  ): ResponsibilityType => {
    // Build camelCase field key for the interface
    const snakeCaseKey = `${activityKey}_${
      AREA_API_MAPPING[area as keyof typeof AREA_API_MAPPING]
    }`
    const fieldKey = toCamelCase(snakeCaseKey) as keyof Omit<
      ResponsibilityMatrixData,
      'supplier' | 'id' | 'createdAt' | 'updatedAt'
    >
    return (matrixData[fieldKey] as ResponsibilityType) || '-'
  }

  // Restaurar dados do localStorage quando usuário escolhe restaurar rascunho
  useEffect(() => {
    if (mode === 'create' && draftDecision === 'restore') {
      const savedData = loadMatrixFromStorage()
      if (savedData) {
        setMatrixData(savedData)
      }
    }
  }, [mode, draftDecision])

  // Salvar dados no localStorage quando mudam (apenas no modo de criação)
  // IMPORTANTE: Não salvar enquanto houver rascunho existente e o usuário não tiver decidido restaurar
  useEffect(() => {
    if (mode === 'create') {
      const hasStoredDraft = loadMatrixFromStorage() !== null
      // Se existe um rascunho e o usuário ainda não decidiu restaurar, não sobrescrevemos
      if (hasStoredDraft && draftDecision === 'pending') {
        return
      }
      try {
        if (hasMeaningfulMatrixDraft(matrixData)) {
          localStorage.setItem(MATRIX_STORAGE_KEY, JSON.stringify(matrixData))
        } else {
          localStorage.removeItem(MATRIX_STORAGE_KEY)
        }
      } catch (error) {
        console.warn('Failed to save matrix data to localStorage:', error)
      }
    }
  }, [matrixData, mode, draftDecision])

  // Garantir persistência mesmo em fechamento abrupto da aba
  useEffect(() => {
    if (mode !== 'create') return

    const handleBeforeUnload = () => {
      try {
        const hasStoredDraft = loadMatrixFromStorage() !== null
        // Não sobrescrever se existe rascunho e usuário ainda não decidiu
        if (hasStoredDraft && draftDecision === 'pending') {
          return
        }
        if (hasMeaningfulMatrixDraft(matrixData)) {
          localStorage.setItem(MATRIX_STORAGE_KEY, JSON.stringify(matrixData))
        } else {
          localStorage.removeItem(MATRIX_STORAGE_KEY)
        }
      } catch (error) {
        console.warn('Failed to persist matrix data before unload:', error)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [matrixData, mode, draftDecision])

  // Limpar dados do localStorage
  const clearDraft = () => {
    try {
      localStorage.removeItem(MATRIX_STORAGE_KEY)
    } catch (error) {
      console.warn('Failed to clear matrix data from localStorage:', error)
    }
  }

  // Expose the getMatrixData function through the ref
  useImperativeHandle(ref, () => ({
    getMatrixData: (supplierId: number) => {
      // Transform camelCase keys to snake_case for the API
      const apiData: any = {}
      Object.keys(matrixData).forEach((camelCaseKey) => {
        const snakeCaseKey = toSnakeCase(camelCaseKey)
        const value = matrixData[camelCaseKey as keyof typeof matrixData] || '-'
        apiData[snakeCaseKey] = value
      })

      return {
        ...apiData,
        supplier: supplierId,
      }
    },
    clearDraft,
  }))

  return (
    <Stack gap="md">
      {/* Legend */}
      <Card withBorder p="sm" radius="md">
        <Text size="sm" fw={600} mb="xs">
          Matriz de responsabilidade
        </Text>
        <Text size="xs" c="dimmed" mb="md">
          Última atualização: dd/mm/aaaa
        </Text>

        <Group gap="xl">
          {Object.entries(RESPONSIBILITY_TYPES).map(([key, config]) => (
            <Group key={key} gap="xs">
              <Badge color={config.color} variant="filled" size="sm">
                {key}
              </Badge>
              <Text size="xs">{config.description}</Text>
            </Group>
          ))}
        </Group>
      </Card>

      {/* Responsibility Matrix Table */}
      <Card withBorder p={0} radius="md">
        <Box style={{ overflowX: 'auto' }}>
          <Table
            striped
            highlightOnHover
            withTableBorder
            withColumnBorders
            style={{ minWidth: '1000px', fontSize: '12px' }}
          >
            <Table.Thead>
              <Table.Tr>
                <Table.Th
                  style={{
                    backgroundColor: 'var(--mantine-color-default)',
                    fontWeight: 600,
                    fontSize: '12px',
                    minWidth: '200px',
                    maxWidth: '250px',
                    padding: '12px 8px',
                  }}
                >
                  ATIVIDADE
                </Table.Th>
                {AREAS.map((area) => (
                  <Table.Th
                    key={area}
                    style={{
                      backgroundColor: 'var(--mantine-color-default)',
                      fontWeight: 600,
                      fontSize: '10px',
                      textAlign: 'center',
                      width: '150px',
                      minWidth: '150px',
                      maxWidth: '150px',
                      padding: '12px 8px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {area}
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {ACTIVITIES_CONFIG.map((activity, activityIndex) => (
                <Table.Tr key={activityIndex}>
                  <Table.Td
                    style={{
                      fontWeight: 500,
                      fontSize: '11px',
                      padding: '12px 8px',
                      borderRight:
                        '2px solid var(--mantine-color-default-border)',
                    }}
                  >
                    {activity.name}
                  </Table.Td>
                  {AREAS.map((area) => (
                    <Table.Td
                      key={area}
                      style={{
                        textAlign: 'center',
                        padding: '12px 8px',
                        verticalAlign: 'middle',
                        width: '160px',
                        minWidth: '160px',
                        maxWidth: '160px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <ResponsibilityButtonGroup
                        value={getResponsibilityValue(activity.apiKey, area)}
                        onChange={(value) =>
                          updateResponsibility(activity.apiKey, area, value)
                        }
                      />
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Box>
      </Card>
    </Stack>
  )
})

ResponsibilityMatrixTab.displayName = 'ResponsibilityMatrixTab'
