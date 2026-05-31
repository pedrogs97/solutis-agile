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
import useUpgrade from '@/hooks/asset/useUpgrade'
import { useThemeColors } from '@/hooks/useThemeColors'
import { type AssetUpgrade } from '@/types/Asset'
import {
  getColorFromStatus,
  getIconFromStatus,
  getStatusService,
} from '@/utils/getStatuses'

import { ModalAddUpgrade, ModalEditUpgrade } from '../modal'

interface TimelineUpgradesProps {
  assetId: string
}

export default function TimelineUpgrades({
  assetId,
}: Readonly<TimelineUpgradesProps>) {
  const {
    historyUpgrade,
    isPendingHistoryUpgrade,
    isErrorHistoryUpgrade,
    fetchNextPageHistoryUpgrade,
    hasNextPageHistoryUpgrade,
    isFetchingNextPageHistoryUpgrade,
    isFetchingHistoryUpgrade,
    isOpenedAddUpgrade,
    openAddUpgrade,
    closeAddUpgrade,
    isOpenedEditUpgrade,
    openEditUpgrade,
    closeEditUpgrade,
    onSubmit,
    onDownloadAttachment,
    setIdToEdit,
    formUpgrade,
    resetRef,
    attachmentFiles,
    setAttachmentFiles,
    currentAttachmentFiles,
    setCurrentAttachmentFiles,
  } = useUpgrade(assetId)
  const { getSecondaryTextColor } = useThemeColors()
  const [selectedEmployeeOption, setSelectedEmployeeOption] =
    useState<Option | null>(null)

  const timelineItems = (historyUpgrade?.pages ?? []).flatMap((group: any) =>
    (group?.items ?? []).map((upgrade: AssetUpgrade) => (
      <Timeline.Item
        key={upgrade.id}
        bullet={getIconFromStatus(upgrade.status)}
        color={getColorFromStatus(upgrade.status)}
      >
        <Card
          shadow="sm"
          padding="lg"
          radius="md"
          withBorder
          style={{ cursor: 'pointer' }}
          onClick={() => {
            setIdToEdit(upgrade.id)
            if (upgrade.employee?.id) {
              setSelectedEmployeeOption({
                value: upgrade.employee.id.toString(),
                label: upgrade.employee.fullName ?? '',
              })
            } else {
              setSelectedEmployeeOption(null)
            }
            openEditUpgrade()
            setCurrentAttachmentFiles((upgrade?.attachments as []) ?? [])
            formUpgrade.setValue('employeeId', upgrade.employee.id.toString())
            formUpgrade.setValue('value', upgrade.value ?? 0)
            formUpgrade.setValue('supplier', upgrade.supplier ?? '')
            formUpgrade.setValue('invoiceNumber', upgrade.invoiceNumber ?? '')
            formUpgrade.setValue('detailing', upgrade.detailing ?? '')
            formUpgrade.setValue('close', !!upgrade.closeDate)
            formUpgrade.setValue('observations', upgrade.observations ?? '')
            formUpgrade.setValue(
              'inProgress',
              upgrade.status === 'Em progresso',
            )
            setAttachmentFiles([])
          }}
        >
          <Flex align="center" wrap="wrap">
            {getStatusService(upgrade.status ?? '')}{' '}
            <Text fw={700} tt="uppercase" size="sm">
              {upgrade.status ?? 'Não informado'}
            </Text>
          </Flex>
          <Flex justify="space-between" mt={10}>
            <Box>
              <Text c="dimmed" size="sm">
                Fornecedor
              </Text>
              <Text>{upgrade.supplier ?? '-'}</Text>
            </Box>
          </Flex>
          <Flex justify="space-between" mt={10}>
            <Box>
              <Text c="dimmed" size="sm">
                Data Abertura
              </Text>
              <Text>{upgrade.openDate ?? '-'}</Text>
            </Box>
            <Flex direction="column" align="flex-end">
              <Text c="dimmed" size="sm">
                Data de Fechamento
              </Text>
              <Text>{upgrade.closeDate ?? upgrade.status}</Text>
            </Flex>
          </Flex>
        </Card>
      </Timeline.Item>
    )),
  )

  return (
    <>
      <ModalAddUpgrade
        opened={isOpenedAddUpgrade}
        close={() => {
          closeAddUpgrade()
          setSelectedEmployeeOption(null)
        }}
        formUpgrade={formUpgrade}
        onSubmitUpgrade={onSubmit}
        resetRef={resetRef as any}
        attachmentFiles={attachmentFiles}
        setAttachmentFiles={setAttachmentFiles}
      />
      <ModalEditUpgrade
        opened={isOpenedEditUpgrade}
        close={() => {
          closeEditUpgrade()
          setSelectedEmployeeOption(null)
        }}
        formUpgrade={formUpgrade}
        onSubmitUpgrade={onSubmit}
        resetRef={resetRef as any}
        attachmentFiles={attachmentFiles}
        setAttachmentFiles={setAttachmentFiles}
        currentAttachmentFiles={currentAttachmentFiles}
        onDownloadAttachment={onDownloadAttachment}
        selectedEmployeeOption={selectedEmployeeOption}
      />
      <Flex justify="space-between">
        <Text size="lg" fw={700} c={getSecondaryTextColor()}>
          Últimas Melhorias
        </Text>
        <Can I="add" a="maintenance">
          <Button
            color="blue"
            radius="md"
            onClick={() => {
              setIdToEdit(null)
              setSelectedEmployeeOption(null)
              openAddUpgrade()
            }}
          >
            <GitPullRequestCreate />
            &nbsp;Nova melhoria
          </Button>
        </Can>
      </Flex>

      <Flex justify="center" direction="column" align="center">
        {isPendingHistoryUpgrade && (
          <Loader color="blue" size="sm" style={{ marginBottom: 16 }} />
        )}

        {isErrorHistoryUpgrade && (
          <Text mb={16}>
            Não foi possível carregar o histórico de melhorias
          </Text>
        )}

        {timelineItems.length > 0 ? (
          <Timeline bulletSize={40} lineWidth={2} miw="40%">
            {timelineItems}
          </Timeline>
        ) : (
          !isPendingHistoryUpgrade &&
          !isErrorHistoryUpgrade && <Text>Nenhuma melhoria registrada.</Text>
        )}
        <Center>
          {!hasNextPageHistoryUpgrade && (
            <Text mt={15}>Não há mais melhorias para este ativo</Text>
          )}
          {(isFetchingNextPageHistoryUpgrade || isFetchingHistoryUpgrade) && (
            <Loader color="blue" mt={15} />
          )}
          {!hasNextPageHistoryUpgrade ||
          isFetchingNextPageHistoryUpgrade ||
          historyUpgrade?.pages[0]?.items?.length === 0 ? null : (
            <ActionIcon
              onClick={() => fetchNextPageHistoryUpgrade()}
              size="lg"
              radius="xl"
              mt={15}
              variant="outline"
              disabled={
                !hasNextPageHistoryUpgrade || isFetchingNextPageHistoryUpgrade
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
