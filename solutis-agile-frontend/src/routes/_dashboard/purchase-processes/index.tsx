'use client'

import {
  Button,
  Group,
  Tabs,
  Text,
} from '@mantine/core'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { BarChart3, List, PlusSquare } from 'lucide-react'
import { useState } from 'react'

import { Breadcrumbs } from '@/components/common/breadcrumbs'
import { PageSectionHeader } from '@/components/common/page-section-header'
import TableSkeleton from '@/components/common/skeletons/table-skeleton'
import { Can } from '@/components/providers/ability'
import { ExecutiveDashboard } from '@/components/purchase-processes/executive-dashboard'
import { ProcessTable } from '@/components/purchase-processes/process-table'
import { ServerError } from '@/components/server-error'

export const Route = createFileRoute('/_dashboard/purchase-processes/')({
  errorComponent: () => <ServerError />,
  pendingComponent: () => <TableSkeleton />,
  component: PurchaseProcessesIndexPage,
})

function PurchaseProcessesIndexPage() {
  const [activeTab, setActiveTab] = useState<string | null>('dashboard')
  const navigate = useNavigate()

  return (
    <>
      <Breadcrumbs />
      <PageSectionHeader
        title="Análise e Decisão de Compras (FO-AD-01)"
        actions={
          <Group>
            <Can I="add" a="supplier">
              <Button
                variant="filled"
                radius="md"
                color="green"
                leftSection={<PlusSquare size={16} />}
                onClick={() => navigate({ to: '/purchase-processes/new' as any })}
              >
                Novo Processo FO-AD-01
              </Button>
            </Can>
          </Group>
        }
      />

      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        variant="outline"
        radius="md"
        mb="md"
      >
        <Tabs.List>
          <Tabs.Tab value="dashboard" leftSection={<BarChart3 size={16} />}>
            <Text fw={600} size="sm">
              Painel Executivo
            </Text>
          </Tabs.Tab>

          <Tabs.Tab value="list" leftSection={<List size={16} />}>
            <Text fw={600} size="sm">
              Processos de Compra
            </Text>
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="dashboard" pt="md">
          <ExecutiveDashboard />
        </Tabs.Panel>

        <Tabs.Panel value="list" pt="md">
          <ProcessTable />
        </Tabs.Panel>
      </Tabs>
    </>
  )
}
