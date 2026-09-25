'use client'

import {
  Badge,
  Button,
  Card,
  Grid,
  Group,
  NumberInput,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
  Title,
  Tooltip,
} from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { useQuery } from '@tanstack/react-query'
import {
  Calculator,
  Calendar,
  Clock,
  Coins,
  FileSpreadsheet,
  HelpCircle,
  TrendingDown,
} from 'lucide-react'
import {
  Controller,
  type ControllerRenderProps,
  type UseFormReturn,
} from 'react-hook-form'

import {
  calculateNetBookValue,
  calculateUsageTime,
  formatDateToLocalYMD,
  formatMoneyBRL,
  parseLocalDateValue,
} from '@/lib/utils'
import { fetchDepreciationCategories } from '@/services/api/asset-evaluation'
import type {
  AssetDepreciationCategory,
  AssetEvaluationFormValues,
} from '@/types/AssetEvaluation'

interface FinancialSectionProps {
  form: UseFormReturn<AssetEvaluationFormValues>
  estimatedEconomy: number
  readOnly?: boolean
}

export function FinancialSection({
  form,
  estimatedEconomy,
  readOnly = false,
}: Readonly<FinancialSectionProps>) {
  const { control, setValue, getValues, watch } = form

  const watchedAcquisitionDate = watch('acquisition_date')
  const watchedAcquisitionValue = watch('acquisition_value')
  const watchedCategoryId = watch('depreciation_category_id')
  const watchedReferenceDate = watch('reference_date')
  const watchedResidualValue = watch('residual_value') ?? 0
  const watchedExpectedLifespan = watch('expected_lifespan') || '5 anos'
  const watchedWriteOffDate = watch('write_off_date')
  const watchedEvaluationDate = watch('evaluation_date')

  // Buscar tabela de categorias fiscais (Receita Federal)
  const { data: categories = [] } = useQuery<AssetDepreciationCategory[]>({
    queryKey: ['asset-depreciation-categories'],
    queryFn: fetchDepreciationCategories,
    staleTime: 1000 * 60 * 15,
  })

  const selectedCategory = categories.find(
    (c) => c.id === (watchedCategoryId ? Number(watchedCategoryId) : null)
  )

  // Determina vida útil em meses da categoria ou do texto
  const effectiveLifespanMonths =
    selectedCategory?.lifespan_months ?? watchedExpectedLifespan

  // Avaliação da fórmula contábil segundo especificação (Beatriz Cunha - 24/09/2026)
  const formulaResult = calculateNetBookValue(
    watchedAcquisitionValue,
    watchedAcquisitionDate,
    effectiveLifespanMonths,
    watchedReferenceDate,
    watchedResidualValue,
    watchedWriteOffDate
  )

  const handleApplyFormula = () => {
    setValue('net_book_value', formulaResult.netBookValue)
    setValue('monthly_depreciation', formulaResult.monthlyDepreciation)
    setValue('depreciated_months', formulaResult.depreciatedMonths)
    setValue('accumulated_depreciation', formulaResult.accumulatedDepreciation)
    setValue('residual_value', watchedResidualValue)

    if (selectedCategory) {
      setValue('depreciation_category_name', selectedCategory.name)
      setValue(
        'expected_lifespan',
        selectedCategory.lifespan_months === 0
          ? 'Não depreciável (0 meses)'
          : `${selectedCategory.lifespan_months} meses (${selectedCategory.annual_rate}% a.a.)`
      )
    }

    if (!getValues('usage_time') && watchedAcquisitionDate) {
      const usage = calculateUsageTime(
        watchedAcquisitionDate,
        watchedReferenceDate || watchedEvaluationDate
      )
      if (usage) setValue('usage_time', usage)
    }
  }

  const categorySelectData = categories.map((cat) => ({
    value: String(cat.id),
    label: `${cat.name} (${cat.annual_rate}% a.a. · ${cat.lifespan_months}m)`,
  }))

  return (
    <Card shadow="xs" radius="md" p="lg" withBorder>
      {/* Cabeçalho alinhado com o modelo FO-PAT-02 */}
      <Group justify="space-between" align="center" mb="lg">
        <Group gap="sm">
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border:
                '1px solid light-dark(rgba(186, 230, 253, 0.9), rgba(56, 189, 248, 0.35))',
              backgroundColor:
                'light-dark(rgba(240, 249, 255, 0.9), rgba(12, 74, 110, 0.25))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 14,
              color:
                'light-dark(var(--mantine-color-blue-7), var(--mantine-color-blue-3))',
              flexShrink: 0,
            }}
          >
            5
          </div>
          <div>
            <Title order={4} fw={700} style={{ lineHeight: 1.2 }}>
              Avaliação financeira & Cálculo contábil
            </Title>
            <Text size="xs" c="dimmed" mt={2}>
              Cálculo automático do valor contábil líquido (VCL) e parâmetros de depreciação
            </Text>
          </div>
        </Group>

        {!readOnly && (
          <Button
            size="xs"
            variant="light"
            color="blue"
            leftSection={<Calculator size={14} />}
            onClick={handleApplyFormula}
            title="Calcular e preencher campos contábeis no formulário"
          >
            Aplicar cálculo contábil
          </Button>
        )}
      </Group>

      {/* Grid de parâmetros de entrada */}
      <Grid gutter="md">
        {/* Categoria de Depreciação (Receita Federal IN RFB 1.700/2017) */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Controller
            control={control}
            name="depreciation_category_id"
            render={({ field }) => (
              <Select
                label="Categoria de depreciação fiscal (IN RFB 1.700/2017)"
                placeholder="Selecione a categoria do bem..."
                data={categorySelectData}
                value={field.value ? String(field.value) : null}
                onChange={(val) => {
                  const numVal = val ? parseInt(val, 10) : null
                  field.onChange(numVal)
                  const cat = categories.find((c) => c.id === numVal)
                  if (cat) {
                    setValue('depreciation_category_name', cat.name)
                    setValue(
                      'expected_lifespan',
                      cat.lifespan_months === 0
                        ? 'Não depreciável (0 meses)'
                        : `${cat.lifespan_months} meses (${cat.annual_rate}% a.a.)`
                    )
                  }
                }}
                clearable
                searchable
                disabled={readOnly}
              />
            )}
          />
        </Grid.Col>

        {/* Data de referência para fechamento contábil */}
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Controller
            control={control}
            name="reference_date"
            render={({ field }) => (
              <DateInput
                label="Data de referência"
                placeholder="dd/mm/aaaa"
                valueFormat="DD/MM/YYYY"
                rightSection={
                  <Calendar size={16} color="var(--mantine-color-gray-6)" />
                }
                clearable
                disabled={readOnly}
                value={parseLocalDateValue(field.value)}
                onChange={(val: any) => {
                  const ymd = formatDateToLocalYMD(val)
                  field.onChange(ymd)
                }}
              />
            )}
          />
        </Grid.Col>

        {/* Valor residual */}
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Controller
            control={control}
            name="residual_value"
            render={({
              field,
            }: {
              field: ControllerRenderProps<AssetEvaluationFormValues, 'residual_value'>
            }) => (
              <NumberInput
                label="Valor residual"
                placeholder="R$ 0,00"
                prefix="R$ "
                thousandSeparator="."
                decimalSeparator=","
                decimalScale={2}
                min={0}
                allowNegative={false}
                value={
                  field.value !== undefined && field.value !== null
                    ? field.value
                    : 0
                }
                onChange={(val: string | number) =>
                  field.onChange(val === '' ? 0 : Number(val))
                }
                disabled={readOnly}
              />
            )}
          />
        </Grid.Col>

        {/* F1-19: Data de aquisição do bem */}
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Controller
            control={control}
            name="acquisition_date"
            render={({ field }) => (
              <DateInput
                label="Data de aquisição do bem"
                placeholder="dd/mm/aaaa"
                valueFormat="DD/MM/YYYY"
                rightSection={
                  <Calendar size={16} color="var(--mantine-color-gray-6)" />
                }
                clearable
                disabled={readOnly}
                value={parseLocalDateValue(field.value)}
                onChange={(val: any) => {
                  const ymd = formatDateToLocalYMD(val)
                  field.onChange(ymd)
                  if (ymd) {
                    const usage = calculateUsageTime(
                      ymd,
                      getValues('reference_date') || getValues('evaluation_date')
                    )
                    if (usage) {
                      setValue('usage_time', usage)
                    }
                  }
                }}
              />
            )}
          />
        </Grid.Col>

        {/* F1-18: Valor de aquisição */}
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Controller
            control={control}
            name="acquisition_value"
            render={({
              field,
            }: {
              field: ControllerRenderProps<AssetEvaluationFormValues, 'acquisition_value'>
            }) => (
              <NumberInput
                label="Valor de aquisição"
                placeholder="R$"
                prefix="R$ "
                thousandSeparator="."
                decimalSeparator=","
                decimalScale={2}
                min={0}
                allowNegative={false}
                value={
                  field.value !== undefined &&
                  field.value !== null &&
                  field.value !== 0
                    ? field.value
                    : ''
                }
                onChange={(val: string | number) =>
                  field.onChange(val === '' ? 0 : Number(val))
                }
                disabled={readOnly}
              />
            )}
          />
        </Grid.Col>

        {/* F1-20: Tempo de utilização */}
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Controller
            control={control}
            name="usage_time"
            render={({
              field,
            }: {
              field: ControllerRenderProps<AssetEvaluationFormValues, 'usage_time'>
            }) => (
              <TextInput
                label="Tempo de utilização"
                placeholder="Ex.: 3 anos e 4 meses"
                value={field.value || ''}
                onChange={field.onChange}
                disabled={readOnly}
              />
            )}
          />
        </Grid.Col>

        {/* Vida útil prevista */}
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Controller
            control={control}
            name="expected_lifespan"
            render={({
              field,
            }: {
              field: ControllerRenderProps<AssetEvaluationFormValues, 'expected_lifespan'>
            }) => (
              <TextInput
                label="Vida útil prevista"
                placeholder="Ex.: 60 meses (20% a.a.)"
                value={field.value || ''}
                onChange={field.onChange}
                disabled={readOnly}
              />
            )}
          />
        </Grid.Col>
      </Grid>

      {/* Painel dos 4 novos campos calculados contábeis */}
      <Paper
        withBorder
        p="md"
        radius="md"
        mt="lg"
        style={{
          backgroundColor:
            'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))',
        }}
      >
        <Group justify="space-between" align="center" mb="sm">
          <Group gap="xs">
            <ThemeIcon color="blue" variant="light" size="sm">
              <FileSpreadsheet size={14} />
            </ThemeIcon>
            <Text size="sm" fw={700}>
              Demonstrativo de Depreciação Contábil Linear
            </Text>
            <Tooltip
              multiline
              w={320}
              label="Regra contábil oficial (IN RFB 1.700/2017): Depreciação mensal = (Valor aquisição - Valor residual) ÷ Vida útil (meses). O mês de aquisição conta como mês cheio. No último mês a acumulada fecha na base depreciável (ajuste de centavos)."
            >
              <HelpCircle
                size={14}
                color="var(--mantine-color-gray-6)"
                style={{ cursor: 'pointer' }}
              />
            </Tooltip>
          </Group>

          {formulaResult.isOutOfScope && (
            <Badge color="orange" size="sm" variant="light">
              100% Depreciado (Valor residual)
            </Badge>
          )}
          {selectedCategory?.lifespan_months === 0 && (
            <Badge color="teal" size="sm" variant="light">
              Terreno / Ativo não depreciável
            </Badge>
          )}
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
          {/* 1. Depreciação mensal */}
          <Paper p="sm" radius="md" withBorder>
            <Group gap="xs" mb={4}>
              <TrendingDown size={14} color="var(--mantine-color-blue-6)" />
              <Text size="xs" c="dimmed" fw={600}>
                Depreciação mensal
              </Text>
            </Group>
            <Text size="lg" fw={700} c="blue.7">
              {formatMoneyBRL(formulaResult.monthlyDepreciation)}
            </Text>
            <Text size="xs" c="dimmed">
              Base: {formatMoneyBRL(formulaResult.baseDepreciable)}
            </Text>
          </Paper>

          {/* 2. Meses depreciados */}
          <Paper p="sm" radius="md" withBorder>
            <Group gap="xs" mb={4}>
              <Clock size={14} color="var(--mantine-color-indigo-6)" />
              <Text size="xs" c="dimmed" fw={600}>
                Meses depreciados
              </Text>
            </Group>
            <Text size="lg" fw={700} c="indigo.7">
              {formulaResult.depreciatedMonths}{' '}
              <Text span size="xs" fw={500} c="dimmed">
                / {formulaResult.totalLifespanMonths} meses
              </Text>
            </Text>
            <Text size="xs" c="dimmed">
              Progresso: {formulaResult.depreciationPercentage}%
            </Text>
          </Paper>

          {/* 3. Depreciação acumulada */}
          <Paper p="sm" radius="md" withBorder>
            <Group gap="xs" mb={4}>
              <Coins size={14} color="var(--mantine-color-grape-6)" />
              <Text size="xs" c="dimmed" fw={600}>
                Depreciação acumulada
              </Text>
            </Group>
            <Text size="lg" fw={700} c="grape.7">
              {formatMoneyBRL(formulaResult.accumulatedDepreciation)}
            </Text>
            <Text size="xs" c="dimmed">
              {watchedWriteOffDate ? 'Interrompida na baixa' : 'Até a data de referência'}
            </Text>
          </Paper>

          {/* 4. Valor contábil líquido */}
          <Paper p="sm" radius="md" withBorder>
            <Group gap="xs" mb={4}>
              <Calculator size={14} color="var(--mantine-color-teal-6)" />
              <Text size="xs" c="dimmed" fw={600}>
                Valor contábil líquido (VCL)
              </Text>
            </Group>
            <Text size="lg" fw={700} c="teal.7">
              {formatMoneyBRL(formulaResult.netBookValue)}
            </Text>
            <Text size="xs" c="dimmed">
              Mínimo: {formatMoneyBRL(watchedResidualValue)}
            </Text>
          </Paper>
        </SimpleGrid>
      </Paper>

      {/* Grid final: Valor contábil líquido persistido e Economia estimada */}
      <Grid gutter="md" mt="md">
        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <Stack gap={4}>
            <Group justify="space-between" align="center">
              <Text size="sm" fw={500}>
                Valor contábil líquido (Registrado)
              </Text>
              {!readOnly && (
                <Button
                  size="compact-xs"
                  variant="subtle"
                  color="blue"
                  leftSection={<Calculator size={12} />}
                  onClick={handleApplyFormula}
                  title="Copiar valor calculado para o campo oficial"
                >
                  Sincronizar
                </Button>
              )}
            </Group>

            <Controller
              control={control}
              name="net_book_value"
              render={({
                field,
              }: {
                field: ControllerRenderProps<AssetEvaluationFormValues, 'net_book_value'>
              }) => (
                <NumberInput
                  placeholder="R$ 0,00"
                  prefix="R$ "
                  thousandSeparator="."
                  decimalSeparator=","
                  decimalScale={2}
                  min={0}
                  allowNegative={false}
                  value={
                    field.value !== undefined &&
                    field.value !== null &&
                    field.value !== 0
                      ? field.value
                      : ''
                  }
                  onChange={(val: string | number) =>
                    field.onChange(val === '' ? 0 : Number(val))
                  }
                  disabled={readOnly}
                />
              )}
            />
          </Stack>
        </Grid.Col>

        {/* F1-21: Economia estimada reativa */}
        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <Stack gap={4}>
            <TextInput
              label="Economia estimada pelo reaproveitamento"
              value={formatMoneyBRL(estimatedEconomy || 0)}
              readOnly
              styles={{
                input: {
                  fontWeight: 700,
                  cursor: 'default',
                  color: 'var(--mantine-color-teal-7)',
                },
              }}
            />
            <Text size="xs" c="dimmed">
              Calculado: valor contábil líquido × % reaproveitamento
            </Text>
          </Stack>
        </Grid.Col>

        {/* Justificativa técnica da decisão */}
        <Grid.Col span={12}>
          <Controller
            control={control}
            name="justification"
            render={({
              field,
            }: {
              field: ControllerRenderProps<AssetEvaluationFormValues, 'justification'>
            }) => (
              <Textarea
                label="Justificativa técnica da decisão"
                placeholder="Parecer técnico detalhado, motivos da viabilidade de reaproveitamento ou necessidade de baixa..."
                rows={3}
                value={field.value || ''}
                onChange={field.onChange}
                disabled={readOnly}
              />
            )}
          />
        </Grid.Col>
      </Grid>
    </Card>
  )
}
