import {
  ActionIcon,
  Box,
  Button,
  Card,
  Center,
  Flex,
  Loader,
  Text,
  Timeline,
} from '@mantine/core'
import { GitPullRequestCreate, Plus } from 'lucide-react'
import { useState } from 'react'

import type { Option } from '@/components/common/async-select'
import { Can } from '@/components/providers/ability'
import useMaintenance from '@/hooks/asset/useMaintenance'
import { useThemeColors } from '@/hooks/useThemeColors'
import { type AssetMaintenance } from '@/types/Asset'
import {
  getColorFromStatus,
  getIconFromStatus,
  getStatusService,
} from '@/utils/getStatuses'

import ModalAddMaintenance from '../modal/add-maintenance'
import ModalEditMaintenance from '../modal/edit-maintenance'

interface TimelineMaintenancesProps {
  assetId: string
}

export default function TimelineMaintenances({
  assetId,
}: Readonly<TimelineMaintenancesProps>) {
  const {
    historyMaintenance,
    isPendingHistoryMaintenance,
    isErrorHistoryMaintenance,
    fetchNextPageHistoryMaintenance,
    hasNextPageHistoryMaintenance,
    isFetchingNextPageHistoryMaintenance,
    isFetchingHistoryMaintenance,
    isOpenedAddMaintenance,
    openAddMaintenance,
    closeAddMaintenance,
    isOpenedEditMaintenance,
    openEditMaintenance,
    closeEditMaintenance,
    setIdToEdit,
    formMaintenance,
    onSubmit,
    onDownloadAttachment,
    isPendingOnSubmit,
    maintenanceActions,
    isPendingMaintenanceActions,
    isErrorMaintenanceActions,
    resetRef,
    attachmentFiles,
    setAttachmentFiles,
    currentAttachmentFiles,
    setCurrentAttachmentFiles,
    resetMaintenanceForm,
  } = useMaintenance(assetId)
  const { getSecondaryTextColor } = useThemeColors()
  const [selectedEmployeeOption, setSelectedEmployeeOption] =
    useState<Option | null>(null)

  const maintenanceItems = (historyMaintenance?.pages ?? []).flatMap(
    (group: any) =>
      (group?.items ?? []).map((maintenance: AssetMaintenance) => (
        <Timeline.Item
          key={maintenance.id}
          bullet={getIconFromStatus(maintenance.status)}
          color={getColorFromStatus(maintenance.status)}
        >
          <Card
            shadow="sm"
            padding="lg"
            radius="md"
            withBorder
            style={{ cursor: 'pointer' }}
            onClick={() => {
              setIdToEdit(maintenance.id)
              if (maintenance.employee?.id) {
                setSelectedEmployeeOption({
                  value: maintenance.employee.id.toString(),
                  label: maintenance.employee.fullName ?? '',
                })
              } else {
                setSelectedEmployeeOption(null)
              }
              openEditMaintenance()
              setCurrentAttachmentFiles((maintenance?.attachments as []) ?? [])
              formMaintenance.setValue(
                'actionId',
                maintenance.action.id.toString(),
              )
              formMaintenance.setValue(
                'employeeId',
                maintenance.employee.id.toString(),
              )
              formMaintenance.setValue(
                'glpiNumber',
                maintenance.glpiNumber ?? '',
              )
              formMaintenance.setValue(
                'openDateGlpi',
                maintenance.openDateGlpi ?? '',
              )
              formMaintenance.setValue(
                'supplierNumber',
                maintenance.supplierNumber ?? '',
              )
              formMaintenance.setValue(
                'openDateSupplier',
                maintenance.openDateSupplier ?? '',
              )
              formMaintenance.setValue(
                'supplierServiceOrder',
                maintenance.supplierServiceOrder ?? '',
              )
              formMaintenance.setValue(
                'incidentDescription',
                maintenance.incidentDescription ?? '',
              )
              formMaintenance.setValue(
                'resolution',
                maintenance.resolution ?? '',
              )
              formMaintenance.setValue('close', !!maintenance.closeDate)
              formMaintenance.setValue(
                'inProgress',
                maintenance.status === 'Em progresso',
              )
              formMaintenance.setValue(
                'criticalityId',
                maintenance.criticality.id.toString(),
              )

              setAttachmentFiles([])
            }}
          >
            <Flex align="center" wrap="wrap">
              <Text tt="uppercase" fw={700} size="sm">
                {maintenance.action.name}
              </Text>
              &nbsp;&nbsp;{getStatusService(maintenance.status ?? '')}{' '}
              <Text fw={700} tt="uppercase" size="sm">
                {maintenance.status ?? 'Não informado'}
              </Text>
            </Flex>
            <Flex justify="space-between" mt={10}>
              <Box>
                <Text c="dimmed" size="sm">
                  Data Abertura
                </Text>
                <Text>{maintenance.openDate ?? '-'}</Text>
              </Box>
              <Flex direction="column" align="flex-end">
                <Text c="dimmed" size="sm">
                  Chamado GLPI
                </Text>
                <Text> #{maintenance.glpiNumber ?? '-'}</Text>
              </Flex>
            </Flex>
            <Flex justify="space-between" mt={10}>
              <Box>
                <Text c="dimmed" size="sm">
                  Chamado Fornecedor
                </Text>
                <Text>{maintenance.supplierNumber}</Text>
              </Box>
              <Flex direction="column" align="flex-end">
                <Text c="dimmed" size="sm">
                  Ordem de Serviço Gerado
                </Text>
                <Text>{maintenance.supplierServiceOrder}</Text>
              </Flex>
            </Flex>
          </Card>
        </Timeline.Item>
      )),
  )

  return (
    <>
      <ModalAddMaintenance
        opened={isOpenedAddMaintenance}
        close={() => {
          closeAddMaintenance()
          setSelectedEmployeeOption(null)
        }}
        maintenanceActions={maintenanceActions}
        isPendingMaintenanceActions={isPendingMaintenanceActions}
        isErrorMaintenanceActions={isErrorMaintenanceActions}
        formMaintenance={formMaintenance}
        onSubmitMaintenance={onSubmit}
        isPendingOnSubmit={isPendingOnSubmit}
        resetRef={resetRef as any}
        attachmentFiles={attachmentFiles}
        setAttachmentFiles={setAttachmentFiles}
        resetMaintenanceForm={resetMaintenanceForm}
      />
      <ModalEditMaintenance
        opened={isOpenedEditMaintenance}
        close={() => {
          closeEditMaintenance()
          setSelectedEmployeeOption(null)
        }}
        formMaintenance={formMaintenance}
        onSubmitMaintenance={onSubmit}
        isPendingOnSubmit={isPendingOnSubmit}
        maintenanceActions={maintenanceActions}
        isPendingMaintenanceActions={isPendingMaintenanceActions}
        isErrorMaintenanceActions={isErrorMaintenanceActions}
        resetRef={resetRef as any}
        attachmentFiles={attachmentFiles}
        setAttachmentFiles={setAttachmentFiles}
        currentAttachmentFiles={currentAttachmentFiles}
        onDownloadAttachment={onDownloadAttachment}
        selectedEmployeeOption={selectedEmployeeOption}
        resetMaintenanceForm={resetMaintenanceForm}
      />

      <Flex justify="space-between">
        <Text size="lg" fw={700} c={getSecondaryTextColor()}>
          Últimas Manutenções
        </Text>
        <Can I="add" a="maintenance">
          <Button
            color="blue"
            radius="md"
            type="button"
            onClick={() => {
              setIdToEdit(null)
              setSelectedEmployeeOption(null)
              openAddMaintenance()
            }}
          >
            <GitPullRequestCreate />
            &nbsp;Nova manutenção
          </Button>
        </Can>
      </Flex>

      <Flex justify="center" direction="column" align="center">
        {isPendingHistoryMaintenance && (
          <Loader color="blue" size="sm" style={{ marginBottom: 16 }} />
        )}

        {isErrorHistoryMaintenance && (
          <Text mb={16}>
            Não foi possível carregar o histórico de manutenções
          </Text>
        )}

        {maintenanceItems.length > 0 ? (
          <Timeline bulletSize={40} lineWidth={2} miw="40%">
            {maintenanceItems}
          </Timeline>
        ) : (
          !isPendingHistoryMaintenance &&
          !isErrorHistoryMaintenance && (
            <Text>Nenhuma manutenção registrada.</Text>
          )
        )}

        <Center>
          {!hasNextPageHistoryMaintenance && (
            <Text mt={15}>Não há mais manutenções para este ativo</Text>
          )}
          {(isFetchingNextPageHistoryMaintenance ||
            isFetchingHistoryMaintenance) && <Loader color="blue" mt={15} />}
          {!hasNextPageHistoryMaintenance ||
          isFetchingNextPageHistoryMaintenance ||
          historyMaintenance?.pages[0]?.items?.length === 0 ? null : (
            <ActionIcon
              onClick={() => fetchNextPageHistoryMaintenance()}
              size="lg"
              radius="xl"
              mt={15}
              variant="outline"
              disabled={
                !hasNextPageHistoryMaintenance ||
                isFetchingNextPageHistoryMaintenance
              }
            >
              <Plus />
            </ActionIcon>
          )}
        </Center>
      </Flex>
    </>
  )
}
