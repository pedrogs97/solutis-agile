import {
  Button,
  Center,
  CloseButton,
  FileButton,
  Flex,
  Grid,
  Group,
  Modal,
  ScrollArea,
  Table,
  Text,
} from '@mantine/core'
import { UploadCloud } from 'lucide-react'
import { type FormEventHandler, type RefObject, useCallback } from 'react'
import { FormProvider, type UseFormReturn } from 'react-hook-form'

import AsyncSelect from '@/components/common/async-select'
import DateInput from '@/components/common/date-input'
import Input from '@/components/common/input'
import Select from '@/components/common/select'
import Switch from '@/components/common/switch'
import Textarea from '@/components/common/textarea'
import { type FormDataMaintenance } from '@/hooks/asset/useMaintenance'
import { fetchEmployeeSelect } from '@/services/api/employee'

interface ModalAddMaintenanceProps {
  opened: boolean
  close: () => void
  maintenanceActions: any
  isPendingMaintenanceActions: boolean
  isErrorMaintenanceActions: any
  formMaintenance: UseFormReturn<FormDataMaintenance>
  onSubmitMaintenance: FormEventHandler<HTMLFormElement>
  isPendingOnSubmit: boolean
  resetRef: RefObject<() => void>
  attachmentFiles: File[]
  setAttachmentFiles: Function
  resetMaintenanceForm: () => void
}

export default function ModalAddMaintenance({
  opened,
  close,
  maintenanceActions,
  isPendingMaintenanceActions,
  formMaintenance,
  onSubmitMaintenance,
  isPendingOnSubmit,
  resetRef,
  attachmentFiles,
  setAttachmentFiles,
  resetMaintenanceForm,
}: Readonly<ModalAddMaintenanceProps>) {
  const clearFile = () => {
    setAttachmentFiles([])
    resetRef.current?.()
  }

  const onClose = () => {
    if (formMaintenance.formState.isSubmitting) return
    resetMaintenanceForm()
    clearFile()
    close()
  }

  const loadEmployees = useCallback(
    (query: string) => fetchEmployeeSelect(query),
    [fetchEmployeeSelect],
  )

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      withCloseButton={false}
      closeOnClickOutside={false}
      closeOnEscape={false}
      title={
        <Text size="xl" fw={700}>
          Nova Manutenção
        </Text>
      }
      centered
      radius={'lg'}
      size="600px"
    >
      <ScrollArea h={700} scrollbars="y" p={12}>
        <FormProvider {...formMaintenance}>
          <form onSubmit={onSubmitMaintenance}>
            <Grid my={10}>
              <Grid.Col span={{ base: 12, xs: 6 }}>
                <Select
                  name="actionId"
                  label="Tipo de Manutenção"
                  placeholder="Selecione o tipo de Manutenção"
                  data={maintenanceActions}
                  loading={isPendingMaintenanceActions}
                />
              </Grid.Col>
            </Grid>
            <Grid my={10}>
              <Grid.Col span={{ base: 12, xs: 12 }}>
                <AsyncSelect
                  name="employeeId"
                  label="Colaborador Responsável"
                  placeholder="Selecione o colaborador"
                  fetcher={loadEmployees}
                  debounceMs={400}
                  minChars={2}
                  preloadOnOpen
                />
              </Grid.Col>
            </Grid>
            <Grid my={10}>
              <Grid.Col span={{ base: 12, xs: 7 }}>
                <Input
                  name="glpiNumber"
                  label="N° do Chamado GLPI"
                  placeholder="Digite o n° do chamado GLPI"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 5 }}>
                <DateInput
                  name="openDateGlpi"
                  label="Data abertura GLPI"
                  valueFormat="DD/MM/YYYY"
                />
              </Grid.Col>
            </Grid>
            <Grid my={10}>
              <Grid.Col span={{ base: 12, xs: 7 }}>
                <Input
                  name="supplierNumber"
                  label="N° do Chamado do Fornecedor"
                  placeholder="Digite o n° Fornecedor"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 5 }}>
                <DateInput
                  name="openDateSupplier"
                  label="Data abertura Fornecedor"
                  valueFormat="DD/MM/YYYY"
                />
              </Grid.Col>
            </Grid>
            <Grid my={10} align="center">
              <Grid.Col span={{ base: 6 }}>
                <Select
                  data={[
                    { value: '1', label: 'Baixa' },
                    { value: '2', label: 'Média' },
                    { value: '3', label: 'Alta' },
                  ]}
                  label="Criticidade"
                  name="criticalityId"
                  placeholder="Selecione a criticidade"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 6 }}>
                <Switch name="hasAssurance" label="Tem garantia" />
              </Grid.Col>
            </Grid>
            <Grid my={10}>
              <Grid.Col span={{ base: 12 }}>
                <Textarea
                  name="incidentDescription"
                  label="Descrição do Incidente"
                  placeholder="Digite o incidente"
                  maxLength={255}
                  rows={5}
                />
              </Grid.Col>
            </Grid>
            <Text size="sm" mt="sm" fw={700}>
              Adicionar arquivos
            </Text>
            <Grid my={15}>
              <Group>
                <FileButton
                  resetRef={resetRef}
                  onChange={(newFiles) => {
                    setAttachmentFiles((prevFiles: File[]) => {
                      return [
                        ...prevFiles,
                        ...newFiles.filter(
                          (file) =>
                            !prevFiles.some((f) => f.name === file.name),
                        ),
                      ]
                    })
                  }}
                  accept=".pdf"
                  multiple
                >
                  {(props) => (
                    <Button
                      {...props}
                      size="xs"
                      color="var(--mantine-color-text)"
                      radius="md"
                      type="button"
                      ml={10}
                    >
                      <UploadCloud />
                      &nbsp;Carregar Arquivo(s)
                    </Button>
                  )}
                </FileButton>
                <Button
                  disabled={attachmentFiles.length <= 0}
                  color="red"
                  onClick={clearFile}
                  size="xs"
                  radius="md"
                  type="button"
                >
                  Limpar
                </Button>
              </Group>
            </Grid>
            <Text size="xs" fs="italic" c="red" mt={5}>
              Somente arquivos PDF com no máximo 5MB
            </Text>
            <Grid mt={10}>
              <ScrollArea h={200} w="100%">
                <Table mt={10}>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th w={'50px'}></Table.Th>
                      <Table.Th>Nome do arquivo</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {attachmentFiles?.map((file) => (
                      <Table.Tr key={file.name}>
                        <Table.Td align="center">
                          <CloseButton
                            size="xs"
                            onClick={() =>
                              setAttachmentFiles(
                                attachmentFiles.filter(
                                  (f) => f.name !== file.name,
                                ),
                              )
                            }
                          />
                        </Table.Td>
                        <Table.Td>{file.name}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
                {attachmentFiles.length === 0 && (
                  <Center>
                    <Text size="sm" mt="sm">
                      Nenhum arquivo carregado
                    </Text>
                  </Center>
                )}
              </ScrollArea>
            </Grid>
            <Flex my={25} justify="space-between">
              <Button
                data-autofocus
                radius="md"
                color="red"
                variant="outline"
                onClick={onClose}
                disabled={isPendingOnSubmit}
              >
                Cancelar
              </Button>
              <Button radius="md" type="submit" disabled={isPendingOnSubmit}>
                Confirmar
              </Button>
            </Flex>
          </form>
        </FormProvider>
      </ScrollArea>
    </Modal>
  )
}
