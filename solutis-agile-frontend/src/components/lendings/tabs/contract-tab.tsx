import { Box, Button, Flex, Group, Stack, Text } from '@mantine/core'
import { modals } from '@mantine/modals'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileDown,
  RotateCcw,
  Trash2,
  UploadCloud,
} from 'lucide-react'
import { FormProvider, useForm, type UseFormReturn } from 'react-hook-form'

import { FileUploadSection } from '@/components/lendings/file-upload-section'
import { useContractTab } from '@/hooks/lending/useContractTab'
import { useThemeColors } from '@/hooks/useThemeColors'
import { useProfileStore } from '@/store/persisted/useProfileStore'

type CreateContractTabProps = {
  variant: 'create'
  file: File | null
  setFile: (file: File | null) => void
  clearFile: () => void
  resetRef: any
  isSubmitting: boolean
  hasVerification: boolean
  onBack: () => void
  onNext: () => void
}

type EditContractTabProps = {
  variant: 'edit'
  lendingId?: string
  lendingData: any
  canEdit: boolean
  onInvalidate: () => void
  withDownloadNotification: any
  form: UseFormReturn<any>
}

type ContractTabProps = CreateContractTabProps | EditContractTabProps

function CreateContractTab({
  file,
  setFile,
  clearFile,
  resetRef,
  isSubmitting,
  hasVerification,
  onBack,
  onNext,
}: CreateContractTabProps) {
  return (
    <Stack gap="md">
      <Text size="lg" fw={600} mb="xs">
        Anexos do Comodato
      </Text>

      <FileUploadSection
        title="Arquivo anexo (opcional)"
        description="Adicione um arquivo para anexar ao comodato (PDF até 5MB)"
        file={file}
        onFileChange={setFile}
        onClearFile={clearFile}
        resetRef={resetRef as any}
        disabled={isSubmitting}
      />

      <Flex justify="space-between" mt="md">
        <Button
          type="button"
          color="gray"
          variant="outline"
          radius="md"
          onClick={onBack}
          disabled={isSubmitting}
        >
          <ArrowLeft size={16} />
          &nbsp;Voltar
        </Button>

        <Button
          type="button"
          variant="outline"
          radius="md"
          onClick={onNext}
          disabled={isSubmitting}
          loading={isSubmitting}
        >
          {hasVerification ? 'Próximo' : 'Salvar'}&nbsp;
          {hasVerification ? <ArrowRight size={16} /> : <Check size={16} />}
        </Button>
      </Flex>
    </Stack>
  )
}

function EditContractTab({
  lendingId,
  lendingData,
  canEdit,
  onInvalidate,
  withDownloadNotification,
  form: formGeneralData,
}: EditContractTabProps) {
  const { getSecondaryTextColor } = useThemeColors()
  const form = useForm()
  const profile = useProfileStore((state: any) => state.profile)
  const isMasterUser = profile?.group?.toUpperCase() === 'MASTER'

  const {
    file,
    setFile,
    clearFile,
    resetRef,
    isSubmitting,
    onDownloadContract,
    onRecreateContract,
    onUploadSignedContract,
    onDeleteContractDocument,
    onDownloadVerification,
  } = useContractTab({
    lendingId,
    lendingData,
    onInvalidate,
    withDownloadNotification,
    form: formGeneralData,
  })
  const isSigned = Boolean(lendingData?.signedDate)
  const canGenerate = !isSigned && canEdit && !isSubmitting
  const canUpload = !isSigned && canEdit && !isSubmitting

  const handleConfirmDeleteContract = () => {
    modals.openConfirmModal({
      title: 'Confirmar Remoção do Contrato',
      children: (
        <Text size="sm">
          Deseja realmente remover o contrato assinado deste comodato? O arquivo será excluído com SoftDelete e o status retornará para pendente.
        </Text>
      ),
      labels: { confirm: 'Remover', cancel: 'Cancelar' },
      confirmProps: { color: 'red' },
      onConfirm: () => {
        onDeleteContractDocument()
      },
    })
  }

  const handleUploadContract = () => {
    if (isSigned) {
      modals.openConfirmModal({
        title: 'Confirmar Substituição de Arquivo',
        children: (
          <Text size="sm">
            Já existe um contrato assinado cadastrado. Deseja substituí-lo pelo novo arquivo? O arquivo anterior será substituído.
          </Text>
        ),
        labels: { confirm: 'Substituir arquivo', cancel: 'Cancelar' },
        confirmProps: { color: 'blue' },
        onConfirm: () => {
          onUploadSignedContract()
        },
      })
    } else {
      onUploadSignedContract()
    }
  }

  return (
    <FormProvider {...form}>
      <Stack gap="md">
        <Box>
          <Text size="lg" fw={600} mb="xs">
            Gerenciamento do Contrato
          </Text>
          <Text size="sm" c={getSecondaryTextColor()} mb="md">
            {isSigned
              ? `Contrato assinado em ${lendingData?.signedDate}`
              : 'Baixe o contrato, colete as assinaturas e carregue o PDF assinado'}
          </Text>
        </Box>

        {!isSigned && (
          <>
            <Group>
              <Button
                type="button"
                color="blue"
                radius="md"
                size="sm"
                onClick={onDownloadContract}
                disabled={!canGenerate}
                loading={isSubmitting}
              >
                <FileDown size={16} />
                &nbsp;Visualizar Contrato
              </Button>
              <Button
                type="button"
                color="gray"
                radius="md"
                size="sm"
                onClick={onRecreateContract}
                disabled={!canGenerate}
                loading={isSubmitting}
              >
                <RotateCcw size={16} />
                &nbsp;Recriar Contrato
              </Button>
              <Button
                type="button"
                color="grape"
                radius="md"
                size="sm"
                onClick={onDownloadVerification}
                disabled={isSubmitting}
                loading={isSubmitting}
              >
                <FileDown size={16} />
                &nbsp;Visualizar Verificação
              </Button>
            </Group>

            <FileUploadSection
              title="Carregar Contrato Assinado"
              description="Carregue o contrato assinado (PDF até 5MB)"
              file={file}
              onFileChange={setFile}
              onClearFile={clearFile}
              resetRef={resetRef as any}
              disabled={!canUpload}
            />

            {file && (
              <Group>
                <Button
                  type="button"
                  color="green"
                  radius="md"
                  size="sm"
                  onClick={handleUploadContract}
                  disabled={!file || isSubmitting}
                  loading={isSubmitting}
                >
                  <UploadCloud size={16} />
                  &nbsp;Confirmar envio
                </Button>
                <Text size="sm" c="dimmed">
                  {file.name}
                </Text>
              </Group>
            )}
          </>
        )}

        {isSigned && (
          <Stack gap="md">
            <Group>
              <Button
                type="button"
                variant="outline"
                color="blue"
                radius="md"
                size="sm"
                onClick={onDownloadContract}
                disabled={isSubmitting}
              >
                <FileDown size={16} />
                &nbsp;Visualizar Contrato Assinado
              </Button>
              {isMasterUser && (
                <Button
                  type="button"
                  variant="outline"
                  color="red"
                  radius="md"
                  size="sm"
                  onClick={handleConfirmDeleteContract}
                  disabled={isSubmitting}
                  loading={isSubmitting}
                >
                  <Trash2 size={16} />
                  &nbsp;Remover Contrato
                </Button>
              )}
              <Box>
                <Text size="xs" c={getSecondaryTextColor()}>
                  Status
                </Text>
                <Group gap="xs">
                  <Check size={16} color="green" />
                  <Text size="sm" c="green">
                    Assinado em {lendingData?.signedDate}
                  </Text>
                </Group>
              </Box>
            </Group>

            {isMasterUser && (
              <>
                <FileUploadSection
                  title="Substituir Contrato Assinado"
                  description="Carregue o novo contrato assinado para substituir o anterior (PDF até 5MB)"
                  file={file}
                  onFileChange={setFile}
                  onClearFile={clearFile}
                  resetRef={resetRef as any}
                  disabled={isSubmitting}
                />

                {file && (
                  <Group>
                    <Button
                      type="button"
                      color="green"
                      radius="md"
                      size="sm"
                      onClick={handleUploadContract}
                      disabled={!file || isSubmitting}
                      loading={isSubmitting}
                    >
                      <UploadCloud size={16} />
                      &nbsp;Confirmar envio
                    </Button>
                    <Text size="sm" c="dimmed">
                      {file.name}
                    </Text>
                  </Group>
                )}
              </>
            )}
          </Stack>
        )}
      </Stack>
    </FormProvider>
  )
}

export default function ContractTab(props: ContractTabProps) {
  if (props.variant === 'create') {
    return <CreateContractTab {...(props as CreateContractTabProps)} />
  }

  return <EditContractTab {...(props as EditContractTabProps)} />
}
