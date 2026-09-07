'use client'

import {
  Badge,
  Button,
  Group,
  Paper,
  Stack,
  Tabs,
  Text,
  Title,
} from '@mantine/core'
import { Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  FileText,
  Printer,
  Save,
} from 'lucide-react'

import { usePurchaseProcessForm } from '@/hooks/purchase-process/usePurchaseProcessForm'
import { PrintView } from '../print-view'
import { TabDecisionApproval } from './tab-decision-approval'
import { TabIdentification } from './tab-identification'
import { TabItemsDetail } from './tab-items-detail'
import { TabSupplierEvaluation } from './tab-supplier-evaluation'
import { TabSuppliersQuote } from './tab-suppliers-quote'

interface ProcessFormProps {
  id?: string
}

export function ProcessForm({ id }: ProcessFormProps) {
  const {
    process,
    activeTab,
    setActiveTab,
    isEditing,
    isLoadingProcess,
    saveStatus,
    isSaving,
    isDeciding,
    handleSave,
    handleDecide,
    updateIdentification,
    updateDecision,
    updateApproval,
    updateEvaluation,
    updateEvaluationCriterion,
    updateSupplier,
    addSupplier,
    removeSupplier,
    updateItem,
    updateItemPrice,
    addItem,
    removeItem,
    isIdentDone,
    isQuoteDone,
    isDecisionDone,
    isEvalDone,
  } = usePurchaseProcessForm(id)

  const handlePrint = () => {
    window.print()
  }

  if (isLoadingProcess) {
    return (
      <Paper p="xl" withBorder radius="md">
        <Text c="dimmed">Carregando dados do processo de compra...</Text>
      </Paper>
    )
  }

  const tabsOrder = ['ident', 'cotacao', 'itens', 'decisao', 'avaliacao']
  const currentIdx = tabsOrder.indexOf(activeTab)
  const prevTab = currentIdx > 0 ? tabsOrder[currentIdx - 1] : null
  const nextTab = currentIdx < tabsOrder.length - 1 ? tabsOrder[currentIdx + 1] : null

  return (
    <Stack gap="lg" className="no-print-wrap">
      {/* Top Header */}
      <Paper p="md" withBorder radius="md">
        <Group justify="space-between" align="center" wrap="wrap">
          <Group gap="sm">
            <Button
              component={Link}
              to={'/purchase-processes' as any}
              variant="subtle"
              color="gray"
              size="sm"
              leftSection={<ArrowLeft size={16} />}
            >
              Voltar aos Processos
            </Button>
            <div>
              <Group gap="xs">
                <Title order={3}>
                  {process.identificacao.objeto || (isEditing ? 'Processo de Compra' : 'Novo Processo de Compra')}
                </Title>
                <Badge
                  size="md"
                  variant="light"
                  color={
                    process.aprovacao.status === 'Aprovado'
                      ? 'green'
                      : process.aprovacao.status === 'Reprovado'
                        ? 'red'
                        : 'yellow'
                  }
                >
                  {process.aprovacao.status}
                </Badge>
              </Group>
              <Text size="xs" c="dimmed">
                Formulário FO-AD-01 — Análise e Decisão de Compras
              </Text>
            </div>
          </Group>

          <Group gap="xs">
            <Button
              variant="default"
              size="sm"
              leftSection={<Printer size={16} />}
              onClick={handlePrint}
            >
              Imprimir / PDF
            </Button>
            <Button
              color="green"
              size="sm"
              leftSection={<Save size={16} />}
              loading={isSaving}
              onClick={handleSave}
            >
              {saveStatus === 'saved' ? 'Salvo' : 'Salvar Processo'}
            </Button>
          </Group>
        </Group>
      </Paper>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onChange={(val) => setActiveTab(val || 'ident')}>
        <Tabs.List>
          <Tabs.Tab
            value="ident"
            leftSection={<FileText size={16} />}
            rightSection={isIdentDone ? <CheckCircle size={14} color="#40c057" /> : null}
          >
            1. Identificação
          </Tabs.Tab>

          <Tabs.Tab
            value="cotacao"
            rightSection={isQuoteDone ? <CheckCircle size={14} color="#40c057" /> : null}
          >
            2. Cotação de Fornecedores
          </Tabs.Tab>

          <Tabs.Tab value="itens">
            3. Detalhamento dos Itens
          </Tabs.Tab>

          <Tabs.Tab
            value="decisao"
            rightSection={isDecisionDone ? <CheckCircle size={14} color="#40c057" /> : null}
          >
            4. Decisão & Aprovação
          </Tabs.Tab>

          <Tabs.Tab
            value="avaliacao"
            rightSection={isEvalDone ? <CheckCircle size={14} color="#40c057" /> : null}
          >
            5. Avaliação do Fornecedor
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="ident" pt="md">
          <TabIdentification
            process={process}
            updateIdentification={updateIdentification}
            updateApproval={updateApproval}
          />
        </Tabs.Panel>

        <Tabs.Panel value="cotacao" pt="md">
          <TabSuppliersQuote
            process={process}
            updateSupplier={updateSupplier}
            addSupplier={addSupplier}
            removeSupplier={removeSupplier}
          />
        </Tabs.Panel>

        <Tabs.Panel value="itens" pt="md">
          <TabItemsDetail
            process={process}
            updateItem={updateItem}
            updateItemPrice={updateItemPrice}
            addItem={addItem}
            removeItem={removeItem}
          />
        </Tabs.Panel>

        <Tabs.Panel value="decisao" pt="md">
          <TabDecisionApproval
            process={process}
            updateDecision={updateDecision}
            updateApproval={updateApproval}
            handleDecide={handleDecide}
            isDeciding={isDeciding}
          />
        </Tabs.Panel>

        <Tabs.Panel value="avaliacao" pt="md">
          <TabSupplierEvaluation
            process={process}
            updateEvaluation={updateEvaluation}
            updateEvaluationCriterion={updateEvaluationCriterion}
          />
        </Tabs.Panel>
      </Tabs>

      {/* Footer Navigation */}
      <Paper p="md" withBorder radius="md">
        <Group justify="space-between">
          {prevTab ? (
            <Button
              variant="default"
              size="sm"
              leftSection={<ArrowLeft size={16} />}
              onClick={() => setActiveTab(prevTab)}
            >
              Etapa Anterior
            </Button>
          ) : (
            <div />
          )}

          <Group gap="sm">
            <Button
              color="green"
              size="sm"
              leftSection={<Save size={16} />}
              loading={isSaving}
              onClick={handleSave}
            >
              Salvar Processo
            </Button>
            {nextTab && (
              <Button
                color="blue"
                size="sm"
                rightSection={<ArrowRight size={16} />}
                onClick={() => setActiveTab(nextTab)}
              >
                Próxima Etapa
              </Button>
            )}
          </Group>
        </Group>
      </Paper>

      {/* Hidden Print Document for native window.print */}
      <PrintView process={process} />
    </Stack>
  )
}
