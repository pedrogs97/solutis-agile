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
import { type FormEventHandler, type RefObject, useCallback } from 'react'
import { FormProvider, type UseFormReturn } from 'react-hook-form'

import AsyncSelect, { type Option } from '@/components/common/async-select'
import Input from '@/components/common/input'
import NumberInput from '@/components/common/number-input'
import Switch from '@/components/common/switch'
import Textarea from '@/components/common/textarea'
import { type FormDataUpgrade } from '@/hooks/asset/useUpgrade'
import { fetchEmployeeSelect } from '@/services/api/employee'

interface ModalEditUpgradeProps {
  opened: boolean
  close: () => void
  formUpgrade: UseFormReturn<FormDataUpgrade>
  onSubmitUpgrade: FormEventHandler<HTMLFormElement>
  resetRef: RefObject<() => void>
  attachmentFiles: File[]
  setAttachmentFiles: Function
  currentAttachmentFiles: File[]
  onDownloadAttachment: Function
  selectedEmployeeOption?: Option | null
}

export default function ModalEditUpgrade({
  opened,
  close,
  formUpgrade,
  onSubmitUpgrade,
  resetRef,
  attachmentFiles,
  setAttachmentFiles,
  currentAttachmentFiles,
  onDownloadAttachment,
}: Readonly<ModalEditUpgradeProps>) {
  const clearFile = () => {
    setAttachmentFiles([])
    resetRef.current?.()
  }

  const onClose = () => {
    if (formUpgrade.formState.isSubmitting) return
    formUpgrade.reset()
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
          Editar Melhoria
        </Text>
      }
      centered
      radius={'lg'}
      size="lg"
    >
      <ScrollArea h={700} scrollbars="y" p={12}>
        <FormProvider {...formUpgrade}>
          <form onSubmit={onSubmitUpgrade}>
            <Grid my={10}>
              <Grid.Col span={{ base: 12 }}>
                <AsyncSelect
                  name="employeeId"
                  label="Colaborador"
                  placeholder="Selecione o colaborador"
                  fetcher={loadEmployees}
                  debounceMs={400}
                  minChars={2}
                  preloadOnOpen
                />
              </Grid.Col>
            </Grid>
            <Grid my={10}>
              <Grid.Col span={{ base: 12, xs: 6 }}>
                <NumberInput
                  name="value"
                  label="Valor"
                  placeholder="Digite o valor"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, xs: 6 }}>
                <Input
                  name="supplier"
                  label="Fornecedor"
                  placeholder="Digite o fornecedor"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, xs: 6 }}>
                <Input
                  name="invoiceNumber"
                  label="Nota Fiscal"
                  placeholder="Digite o número da Nota fiscal"
                />
              </Grid.Col>
            </Grid>
            <Grid my={10}>
              <Grid.Col span={{ base: 12 }}>
                <Textarea
                  name="detailing"
                  label="Detalhamento"
                  placeholder="Digite o detalhamento"
                  maxLength={255}
                />
              </Grid.Col>
            </Grid>
            <Grid my={10}>
              <Grid.Col span={{ base: 6 }} ml={10}>
                <Grid justify="space-between">
                  <Switch
                    name="inProgress"
                    label="Em progresso"
                    disabled={!!formUpgrade.watch('close')}
                  />
                  <Switch name="close" label="Concluído" />
                </Grid>
              </Grid.Col>
            </Grid>
            <Grid my={10}>
              <Grid.Col span={{ base: 12 }}>
                <Textarea
                  name="observations"
                  label="Observações"
                  placeholder="Digite as observações"
                  maxLength={255}
                />
              </Grid.Col>
            </Grid>
            <Grid my={10}>
              <Grid.Col span={{ base: 12 }} p="sm">
                <MantineInput.Wrapper label="Arquivos carregados">
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
                            Nenhum arquivo carregado
                          </Text>
                        </Center>
                      )}
                    </ScrollAreaAutosize>
                  )}
                </MantineInput.Wrapper>
              </Grid.Col>
            </Grid>
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
                      Nenhum arquivo selecionado
                    </Text>
                  </Center>
                )}
              </ScrollArea>
            </Grid>
            <Flex mt={15} justify="space-between">
              <Button
                data-autofocus
                radius="md"
                color="red"
                variant="outline"
                onClick={() => {
                  onClose()
                  formUpgrade.setValue('employeeId', '')
                  formUpgrade.setValue('value', 0)
                  formUpgrade.setValue('detailing', '')
                  formUpgrade.setValue('supplier', '')
                  formUpgrade.setValue('invoiceNumber', '')
                  formUpgrade.setValue('observations', '')
                  formUpgrade.setValue('close', false)
                  formUpgrade.setValue('inProgress', false)
                }}
                disabled={formUpgrade?.formState?.isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                radius="md"
                type="submit"
                disabled={formUpgrade?.formState?.isSubmitting}
              >
                Confirmar
              </Button>
            </Flex>
          </form>
        </FormProvider>
      </ScrollArea>
    </Modal>
  )
}
