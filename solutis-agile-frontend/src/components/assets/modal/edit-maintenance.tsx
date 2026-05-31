import {
  Button,
  Center,
  CloseButton,
  FileButton,
  Flex,
  Grid,
  Group,
  Input as MantineInput,
  Modal,
  ScrollArea,
  ScrollAreaAutosize,
  Table,
  Text,
} from '@mantine/core'
import { DownloadCloud, UploadCloud } from 'lucide-react'
import {
  type FormEventHandler,
  type RefObject,
  useCallback,
  useMemo,
} from 'react'
import { FormProvider, type UseFormReturn } from 'react-hook-form'

import AsyncSelect, { type Option } from '@/components/common/async-select'
import DateInput from '@/components/common/date-input'
import Input from '@/components/common/input'
import NumberInput from '@/components/common/number-input'
import Select from '@/components/common/select'
import Switch from '@/components/common/switch'
import Textarea from '@/components/common/textarea'
import { type FormDataMaintenance } from '@/hooks/asset/useMaintenance'
import { fetchEmployeeSelect } from '@/services/api/employee'

interface ModalAddMaintenanceProps {
  opened: boolean
  close: () => void
  maintenanceActions: Option[] | undefined
  isPendingMaintenanceActions: boolean
  isErrorMaintenanceActions: any
  formMaintenance: UseFormReturn<FormDataMaintenance>
  onSubmitMaintenance: FormEventHandler<HTMLFormElement>
  isPendingOnSubmit: boolean
  resetRef: RefObject<() => void>
  attachmentFiles: File[]
  setAttachmentFiles: Function
  currentAttachmentFiles: File[]
  onDownloadAttachment: Function
  selectedEmployeeOption?: Option | null
  resetMaintenanceForm: () => void
}

export default function ModalEditMaintenance({
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
  currentAttachmentFiles,
  onDownloadAttachment,
  selectedEmployeeOption,
  resetMaintenanceForm,
}: Readonly<ModalAddMaintenanceProps>) {
  const clearFile = () => {
    setAttachmentFiles([])
    resetRef.current?.()
  }

  const onClose = () => {
    if (isPendingOnSubmit) return
    resetMaintenanceForm()
    clearFile()
    close()
  }

  const loadEmployees = useCallback(
    (query: string) => fetchEmployeeSelect(query),
    [fetchEmployeeSelect],
  )

  const initialEmployeeOptions = useMemo(() => {
    const base: Option[] = []
    if (
      selectedEmployeeOption &&
      !base.some((option) => option.value === selectedEmployeeOption.value)
    ) {
      base.push(selectedEmployeeOption)
    }
    return base
  }, [selectedEmployeeOption])

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      withCloseButton={false}
      closeOnClickOutside={false}
      closeOnEscape={false}
      title={
        <Text size="xl" fw={700}>
          Editar Manutenção
        </Text>
      }
      centered
      radius={'lg'}
      size="lg"
    >
      <ScrollArea h={700} scrollbars="y" p={12}>
        <FormProvider {...formMaintenance}>
          <form onSubmit={onSubmitMaintenance}>
            <Grid my={10}>
              <Grid.Col span={{ base: 12, xs: 5 }}>
                <Select
                  name="actionId"
                  label="Tipo de Manutenção"
                  placeholder="Selecione o tipo de Manutenção"
                  data={maintenanceActions}
                  loading={isPendingMaintenanceActions}
                  readOnly
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, xs: 7 }}>
                <AsyncSelect
                  name="employeeId"
                  label="Colaborador Responsável"
                  placeholder="Selecione o colaborador"
                  fetcher={loadEmployees}
                  debounceMs={400}
                  minChars={2}
                  preloadOnOpen
                  initialOptions={initialEmployeeOptions}
                />
              </Grid.Col>
            </Grid>
            <Grid my={10}>
              <Grid.Col span={{ base: 12, xs: 7 }}>
                <Input
                  name="glpiNumber"
                  label="N° do Chamado GLPI"
                  placeholder="Digite o n° GLPI"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 5 }}>
                <DateInput
                  name="openDateGlpi"
                  label="Data abertura GLPI"
                  placeholder=""
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
                  placeholder=""
                  valueFormat="DD/MM/YYYY"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, xs: 7 }}>
                <Input
                  name="supplierServiceOrder"
                  label="Ordem de serviço"
                  placeholder="Digite a ordem de serviço"
                  readOnly
                />
              </Grid.Col>
              <Grid.Col span={{ base: 5 }}>
                <NumberInput
                  name="value"
                  label="Valor da Manutenção"
                  placeholder="Digite o valor da manutenção"
                />
              </Grid.Col>
            </Grid>
            <Grid my={10}>
              <Grid.Col span={{ base: 12 }}>
                <Textarea
                  name="incidentDescription"
                  label="Descrição do Incidente"
                  placeholder="Digite o incidente"
                />
              </Grid.Col>
            </Grid>
            <Grid my={10} align="center">
              <Grid.Col span={{ base: 6 }}>
                <MantineInput.Wrapper label="Status">
                  <Flex justify="space-between">
                    <Switch
                      name="inProgress"
                      label="Em progresso"
                      disabled={!!formMaintenance.watch('close')}
                    />
                    <Switch name="close" label="Concluído" />
                  </Flex>
                </MantineInput.Wrapper>
              </Grid.Col>
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
            </Grid>
            <Grid my={10}>
              <Grid.Col span={{ base: 6 }}>
                <Switch name="hasAssurance" label="Tem garantia" />
              </Grid.Col>
            </Grid>
            <Grid my={10}>
              <Grid.Col span={{ base: 12 }}>
                <Textarea
                  name="resolution"
                  label="Resolução"
                  placeholder="Digite a resolução"
                />
              </Grid.Col>
            </Grid>
            <Grid my={10}>
              <Grid.Col span={{ base: 12 }} p="sm">
                <MantineInput.Wrapper label="">
                  <Text size="sm" mt="sm" fw={700}>
                    Arquivos enviados
                  </Text>
                  {currentAttachmentFiles && (
                    <ScrollAreaAutosize h={200} w="100%">
                      <Table>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th w={'50px'}></Table.Th>
                            <Table.Th>Nome do arquivo</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {currentAttachmentFiles?.map((file: any) => (
                            <Table.Tr key={file.fileName}>
                              <Table.Td align="center">
                                <Button
                                  size="xs"
                                  color="var(--mantine-color-text)"
                                  radius="md"
                                  type="button"
                                  onClick={() => onDownloadAttachment(file.id)}
                                >
                                  <DownloadCloud />
                                </Button>
                              </Table.Td>
                              <Table.Td>{file.fileName}</Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                      {currentAttachmentFiles.length === 0 && (
                        <Center>
                          <Text size="sm" mt="sm">
                            Nenhum arquivo enviado
                          </Text>
                        </Center>
                      )}
                    </ScrollAreaAutosize>
                  )}
                </MantineInput.Wrapper>
              </Grid.Col>
            </Grid>
            <hr />
            <Text size="sm" mt="sm" fw={700}>
              Adicionar novos arquivos
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
            <Flex my={15} justify="space-between">
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
