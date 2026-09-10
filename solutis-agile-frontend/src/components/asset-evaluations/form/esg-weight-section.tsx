'use client'

import {
  Card,
  Grid,
  Group,
  NumberInput,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { Controller, type UseFormReturn } from 'react-hook-form'

import type { AssetEvaluationFormValues } from '@/types/AssetEvaluation'

interface EsgWeightSectionProps {
  form: UseFormReturn<AssetEvaluationFormValues>
  reusePercentage: number
  readOnly?: boolean
}

export function EsgWeightSection({
  form,
  reusePercentage,
  readOnly = false,
}: Readonly<EsgWeightSectionProps>) {
  const { control } = form

  return (
    <Card shadow="xs" radius="md" p="lg" withBorder>
      {/* Cabeçalho alinhado com o modelo FO-PAT-02 */}
      <Group mb="lg" gap="sm">
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            border: '1px solid light-dark(rgba(186, 230, 253, 0.9), rgba(56, 189, 248, 0.35))',
            backgroundColor: 'light-dark(rgba(240, 249, 255, 0.9), rgba(12, 74, 110, 0.25))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 14,
            color: 'light-dark(var(--mantine-color-blue-7), var(--mantine-color-blue-3))',
            flexShrink: 0,
          }}
        >
          4
        </div>
        <div>
          <Title order={4} fw={700} style={{ lineHeight: 1.2 }}>
            ESG &amp; controle de peso
          </Title>
          <Text size="xs" c="dimmed" mt={2}>
            Obrigatório — rastreabilidade ambiental da destinação
          </Text>
        </div>
      </Group>

      {/* Grid de 3 Colunas x 3 Linhas com todos os campos dinâmicos e persistidos */}
      <Grid gutter="md">
        {/* Linha 1: Pesos Bruto, Reaproveitado e Descartado */}
        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <Controller
            control={control}
            name="gross_weight"
            render={({ field }) => (
              <NumberInput
                label={
                  <span>
                    Peso bruto do ativo (kg) <Text component="span" c="red">*</Text>
                  </span>
                }
                min={0}
                step={0.01}
                decimalScale={2}
                allowNegative={false}
                value={field.value ?? 0}
                onChange={(val) => field.onChange(val === '' ? 0 : Number(val))}
                disabled={readOnly}
              />
            )}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <Controller
            control={control}
            name="reused_weight"
            render={({ field }) => (
              <NumberInput
                label="Peso total reaproveitado (kg)"
                min={0}
                step={0.01}
                decimalScale={2}
                allowNegative={false}
                value={field.value ?? 0}
                onChange={(val) => field.onChange(val === '' ? 0 : Number(val))}
                disabled={readOnly}
              />
            )}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <Controller
            control={control}
            name="discarded_weight"
            render={({ field }) => (
              <NumberInput
                label="Peso total descartado (kg)"
                min={0}
                step={0.01}
                decimalScale={2}
                allowNegative={false}
                value={field.value ?? 0}
                onChange={(val) => field.onChange(val === '' ? 0 : Number(val))}
                disabled={readOnly}
              />
            )}
          />
        </Grid.Col>

        {/* Linha 2: Reciclagem, Percentual Reativo e Empresa */}
        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <Controller
            control={control}
            name="recycle_weight"
            render={({ field }) => (
              <NumberInput
                label="Peso enviado para reciclagem (kg)"
                min={0}
                step={0.01}
                decimalScale={2}
                allowNegative={false}
                value={field.value ?? 0}
                onChange={(val) => field.onChange(val === '' ? 0 : Number(val))}
                disabled={readOnly}
              />
            )}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <TextInput
            label="Percentual de reaproveitamento"
            value={reusePercentage > 0 ? `${reusePercentage.toFixed(1)} %` : '0 %'}
            readOnly
            styles={{
              input: {
                fontFamily: 'monospace',
                fontWeight: 700,
                cursor: 'default',
              },
            }}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <Controller
            control={control}
            name="destination_company"
            render={({ field }) => (
              <TextInput
                label="Empresa responsável pela destinação"
                value={field.value || ''}
                onChange={field.onChange}
                disabled={readOnly}
              />
            )}
          />
        </Grid.Col>

        {/* Linha 3: CNPJ, Certificado e Manifesto MTR */}
        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <Controller
            control={control}
            name="destination_cnpj"
            render={({ field }) => (
              <TextInput
                label="CNPJ"
                placeholder="00.000.000/0000-00"
                value={field.value || ''}
                onChange={field.onChange}
                disabled={readOnly}
                styles={{
                  input: {
                    fontFamily: 'monospace',
                  },
                }}
              />
            )}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <Controller
            control={control}
            name="destination_certificate"
            render={({ field }) => (
              <TextInput
                label="Nº certificado de destinação final"
                value={field.value || ''}
                onChange={field.onChange}
                disabled={readOnly}
              />
            )}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <Controller
            control={control}
            name="waste_manifest"
            render={({ field }) => (
              <TextInput
                label="Manifesto de transporte de resíduos"
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
