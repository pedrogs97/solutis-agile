'use client'

import {
  ActionIcon,
  Button,
  Grid,
  Paper,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core'
import { Plus, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { useCostCenterOptions } from '@/hooks/useCostCenterOptions'
import type { PurchaseProcess } from '@/types/PurchaseProcess'
import {
  CATEGORIAS,
  MODALIDADES,
  RISCOS,
  STATUS_LIST,
  TIPOS_CONTRATACAO,
} from '@/types/PurchaseProcess'

interface TabIdentificationProps {
  process: PurchaseProcess
  updateIdentification: (field: keyof PurchaseProcess['identificacao'], value: any) => void
  updateApproval: (field: keyof PurchaseProcess['aprovacao'], value: any) => void
}

export function TabIdentification({
  process,
  updateIdentification,
  updateApproval,
}: TabIdentificationProps) {
  const i = process.identificacao
  const apr = process.aprovacao

  const { costCenterOptions } = useCostCenterOptions()
  const [showSecondCostCenter, setShowSecondCostCenter] = useState(Boolean(i.centroCusto2))

  useEffect(() => {
    if (i.centroCusto2) {
      setShowSecondCostCenter(true)
    }
  }, [i.centroCusto2])

  const selectCostCenterData = useMemo(() => {
    const options = (costCenterOptions || []).map((o) => ({
      value: o.label || o.value,
      label: o.label || o.value,
    }))
    if (i.centroCusto && !options.some((o) => o.value === i.centroCusto)) {
      options.unshift({ value: i.centroCusto, label: i.centroCusto })
    }
    return options
  }, [costCenterOptions, i.centroCusto])

  const selectCostCenterData2 = useMemo(() => {
    const options = (costCenterOptions || []).map((o) => ({
      value: o.label || o.value,
      label: o.label || o.value,
    }))
    if (i.centroCusto2 && !options.some((o) => o.value === i.centroCusto2)) {
      options.unshift({ value: i.centroCusto2, label: i.centroCusto2 })
    }
    return options
  }, [costCenterOptions, i.centroCusto2])

  return (
    <Paper withBorder radius="md" p="lg">
      <Stack gap="md">
        <div>
          <Title order={4}>1. Identificação da Contratação</Title>
          <Text size="sm" c="dimmed">
            Dados cadastrais do processo de compra ou contratação de serviço.
          </Text>
        </div>

        <Grid gutter="md">
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <TextInput
              label="Data da Solicitação"
              type="date"
              value={i.data || ''}
              onChange={(e) => updateIdentification('data', e.currentTarget.value)}
              required
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <Select
              label="Categoria"
              value={i.categoria}
              onChange={(val) => updateIdentification('categoria', val || 'Normal')}
              data={CATEGORIAS.map((c) => ({ value: c, label: c }))}
              required
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <Select
              label="Modalidade"
              value={i.modalidade}
              onChange={(val) => updateIdentification('modalidade', val || 'Produto')}
              data={MODALIDADES.map((m) => ({ value: m, label: m }))}
              required
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <Stack gap={4}>
              <Select
                label="Centro de Custo"
                placeholder="Selecione o centro de custo"
                value={i.centroCusto || null}
                onChange={(val) => updateIdentification('centroCusto', val || '')}
                data={selectCostCenterData}
                searchable
                clearable
              />
              {!showSecondCostCenter && (
                <Button
                  variant="subtle"
                  size="compact-xs"
                  color="blue"
                  leftSection={<Plus size={12} />}
                  onClick={() => setShowSecondCostCenter(true)}
                  style={{ alignSelf: 'flex-start' }}
                >
                  + Adicionar outro centro de custo
                </Button>
              )}
            </Stack>
          </Grid.Col>

          {showSecondCostCenter && (
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Select
                label="Centro de Custo 2 (Adicional)"
                placeholder="Selecione o segundo centro de custo"
                value={i.centroCusto2 || null}
                onChange={(val) => updateIdentification('centroCusto2', val || '')}
                data={selectCostCenterData2}
                searchable
                clearable
                rightSection={
                  <ActionIcon
                    size="xs"
                    color="gray"
                    variant="subtle"
                    onClick={() => {
                      updateIdentification('centroCusto2', '')
                      setShowSecondCostCenter(false)
                    }}
                    title="Remover segundo centro de custo"
                  >
                    <X size={14} />
                  </ActionIcon>
                }
              />
            </Grid.Col>
          )}

          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <Select
              label="Tipo de Contratação"
              value={i.tipoContratacao}
              onChange={(val) => updateIdentification('tipoContratacao', val || 'Compra nova')}
              data={TIPOS_CONTRATACAO.map((t) => ({ value: t, label: t }))}
              required
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <Select
              label="Nível de Risco"
              description="Para priorização de análise"
              value={i.risco}
              onChange={(val) => updateIdentification('risco', val || 'Baixo')}
              data={RISCOS.map((r) => ({ value: r, label: r }))}
              required
            />
          </Grid.Col>
        </Grid>

        <Textarea
          label="Objeto da Contratação"
          placeholder="Descreva detalhadamente o que está sendo comprado ou contratado..."
          minRows={3}
          value={i.objeto || ''}
          onChange={(e) => updateIdentification('objeto', e.currentTarget.value)}
          required
        />

        <Textarea
          label="Observações"
          placeholder="Observações complementares ou notas gerais sobre este processo de compra..."
          minRows={2}
          value={i.observacao || ''}
          onChange={(e) => updateIdentification('observacao', e.currentTarget.value)}
        />

        <Grid gutter="md">
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <TextInput
              label="Solicitante (Área / Pessoa)"
              placeholder="Ex.: TI / Pedro Santos"
              value={i.solicitante || ''}
              onChange={(e) => updateIdentification('solicitante', e.currentTarget.value)}
              required
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <TextInput
              label="Comprador Responsável"
              placeholder="Ex.: Ana Ribeiro"
              value={i.compradorResponsavel || ''}
              onChange={(e) => updateIdentification('compradorResponsavel', e.currentTarget.value)}
              required
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <Select
              label="Status Geral"
              description="Atualizado na decisão de aprovação"
              value={apr.status}
              onChange={(val) => updateApproval('status', val || 'Pendente')}
              data={STATUS_LIST.map((s) => ({ value: s, label: s }))}
            />
          </Grid.Col>
        </Grid>
      </Stack>
    </Paper>
  )
}
