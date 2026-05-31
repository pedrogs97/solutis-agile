'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  Badge,
  Box,
  Button,
  Checkbox,
  Drawer,
  FileInput,
  Flex,
  Group,
  LoadingOverlay,
  Modal,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useQueryClient } from '@tanstack/react-query'
import {
  Download,
  Eye,
  Maximize,
  Minimize,
  Paperclip,
  Plus,
  Settings,
} from 'lucide-react'
import { forwardRef, useEffect, useRef, useState } from 'react'
import { Controller, useForm, useFormContext } from 'react-hook-form'
import { z } from 'zod'

import Select from '@/components/common/select'
import { Can } from '@/components/providers/ability'
import { useDomainOptions } from '@/hooks/useDomainOptions'
import { useThemeColors } from '@/hooks/useThemeColors'
import {
  type AttachmentType,
  createAttachmentType,
  type CreateAttachmentTypeRequest,
  deleteAttachmentType,
  downloadSupplierAttachment,
  downloadSupplierAttachmentHistory,
  getAttachmentTypes,
  getSupplierAttachmentVersions,
  type SupplierAttachmentVersion,
  updateAttachmentType,
  type UpdateAttachmentTypeRequest,
  uploadSupplierAttachment,
} from '@/services/api/supplier'

export interface UploadedFile {
  id: string
  documentId: string
  file: File
  uploadDate: Date
}

export interface AttachmentVersionItem {
  id: string
  downloadId: string
  attachmentTypeId: string
  attachmentTypeName: string
  fileName: string
  description: string | null
  isCurrent: boolean
  uploadedAt?: string
  source: 'local' | 'current' | 'history'
  localFile?: File
}

interface AttachmentsTabProps {
  files?: UploadedFile[]
  onFilesChange?: (files: UploadedFile[]) => void
  existingAttachments?: Array<{
    id: number
    attachmentTypeId?: string | number
    attachmentTypeName: string
    fileName: string
    description: string | null
  }>
  supplierId?: string
  isActive?: boolean
}

// Validation schema for attachment type form
const attachmentTypeSchema = z.object({
  name: z.string().min(1, 'O nome do tipo de anexo é obrigatório'),
  riskLevel: z.string().min(1, 'O grau de risco é obrigatório'),
})

type AttachmentTypeFormData = z.infer<typeof attachmentTypeSchema>

// Define accepted file types
const ACCEPTED_FILE_TYPES = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png']

let mammothModulePromise: Promise<typeof import('mammoth')> | null = null

const loadMammothModule = async () => {
  if (!mammothModulePromise) {
    mammothModulePromise = import('mammoth')
  }

  return mammothModulePromise
}

export const sortAttachmentVersions = (versions: AttachmentVersionItem[]) => {
  return [...versions].sort((a, b) => {
    if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1
    const dateA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0
    const dateB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0
    return dateB - dateA
  })
}

export const buildAttachmentVersionItems = (
  versionsFromApi: SupplierAttachmentVersion[],
  localUploadedFiles: UploadedFile[],
  attachmentTypeName: string,
  attachmentTypeId: string,
) => {
  const versions: AttachmentVersionItem[] = versionsFromApi.map((item) => {
    const source = item.source ?? (item.isCurrent ? 'current' : 'history')
    return {
      id: `${source}-${item.id}`,
      downloadId: String(item.downloadId ?? item.id),
      attachmentTypeId: String(item.attachmentTypeId),
      attachmentTypeName: item.attachmentTypeName,
      fileName: item.fileName || 'arquivo-sem-nome',
      description: item.description,
      isCurrent: item.isCurrent,
      uploadedAt: item.uploadedAt,
      source,
    }
  })

  for (const localFile of localUploadedFiles) {
    versions.unshift({
      id: `local-${localFile.id}`,
      downloadId: localFile.id,
      attachmentTypeId,
      attachmentTypeName,
      fileName: localFile.file.name,
      description: null,
      isCurrent: true,
      uploadedAt: localFile.uploadDate.toISOString(),
      source: 'local',
      localFile: localFile.file,
    })
  }

  return sortAttachmentVersions(versions)
}

export const AttachmentsTab = forwardRef<any, AttachmentsTabProps>(
  (
    {
      files,
      onFilesChange: _onFilesChange,
      existingAttachments,
      supplierId,
      isActive = true,
    },
    _ref,
  ) => {
    const queryClient = useQueryClient()
    const { watch } = useFormContext()
    const {
      getTableRowEvenBackgroundColor,
      getTableRowOddBackgroundColor,
      getPrimaryTextColor,
      getSecondaryTextColor,
    } = useThemeColors()
    const { riskLevelOptions, isLoading } = useDomainOptions({
      keys: ['riskLevels'],
      enabled: isActive,
    })
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(
      files || [],
    )

    // Keep local uploaded files in sync with parent's files if provided
    useEffect(() => {
      if (files !== undefined) {
        setUploadedFiles(files)
      }
    }, [files])
    const [selectedDocument, setSelectedDocument] = useState<string | null>(
      null,
    )
    const [drawerOpened, setDrawerOpened] = useState(false)
    const [documents, setDocuments] = useState<AttachmentType[]>([])
    const [isLoadingDocuments, setIsLoadingDocuments] = useState(false)

    // File attachment and viewing state variables
    const [attachModalOpened, setAttachModalOpened] = useState(false)
    const [viewModalOpened, setViewModalOpened] = useState(false)
    const [attachmentVersions, setAttachmentVersions] = useState<
      AttachmentVersionItem[]
    >([])
    const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
      null,
    )
    const [isLoadingVersions, setIsLoadingVersions] = useState(false)
    const [versionsError, setVersionsError] = useState<string | null>(null)
    const [isDownloadingVersion, setIsDownloadingVersion] = useState(false)
    const [isUploadingFiles, setIsUploadingFiles] = useState(false)
    const [selectedFiles, setSelectedFiles] = useState<File[]>([])
    const [selectedAttachment, setSelectedAttachment] = useState<{
      id: string
      name: string
      file: File | null
      url?: string
      type?: string
    } | null>(null)
    const [docxContent, setDocxContent] = useState<string>('')
    const [isLoadingDocx, setIsLoadingDocx] = useState<boolean>(false)
    const [isFetchingAttachment, setIsFetchingAttachment] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)

    useEffect(() => {
      const onFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement)
      }
      document.addEventListener('fullscreenchange', onFullscreenChange)
      return () =>
        document.removeEventListener('fullscreenchange', onFullscreenChange)
    }, [])

    const previewContainerRef = useRef<HTMLDivElement>(null)

    const toggleFullscreen = () => {
      if (!document.fullscreenElement && previewContainerRef.current) {
        previewContainerRef.current.requestFullscreen?.()
      } else if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }

    // CRUD state variables
    const [editingAttachmentType, setEditingAttachmentType] =
      useState<AttachmentType | null>(null)
    const [isCreating, setIsCreating] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [deleteModalOpened, setDeleteModalOpened] = useState(false)
    const [attachmentTypeToDelete, setAttachmentTypeToDelete] =
      useState<AttachmentType | null>(null)

    // React Hook Form setup
    const attachmentTypeForm = useForm<AttachmentTypeFormData>({
      resolver: zodResolver(attachmentTypeSchema),
      defaultValues: {
        name: '',
        riskLevel: '1',
      },
    })

    // Watch the risk level to determine which documents to show
    const riskLevel = watch('riskLevel') || '1'

    // Fetch attachment types from API when risk level changes
    useEffect(() => {
      if (!isActive) return
      fetchDocuments()
    }, [riskLevel, isActive])

    // Populate form when a document is selected (for viewing/editing)
    useEffect(() => {
      if (selectedDocument && !isCreating && !editingAttachmentType) {
        const doc = documents.find((d) => String(d.id) === selectedDocument)
        if (doc) {
          attachmentTypeForm.reset({
            name: doc.name,
            riskLevel: String(doc.riskLevel) || '1',
          })
        }
      }
    }, [
      selectedDocument,
      documents,
      isCreating,
      editingAttachmentType,
      attachmentTypeForm,
    ])

    // Helper function to check if a document has an existing attachment by document id
    const hasExistingAttachment = (documentId: string): boolean => {
      if (!existingAttachments) return false

      const normalizedDocumentId = String(documentId)
      return existingAttachments.some((attachment) => {
        if (attachment.attachmentTypeId === undefined) return false
        return String(attachment.attachmentTypeId) === normalizedDocumentId
      })
    }

    // Helper function to check if a document has an uploaded file
    const hasUploadedFile = (documentId: string): boolean => {
      return uploadedFiles.some(
        (file) => String(file.documentId) === String(documentId),
      )
    }

    // Combined function to check if a document has any attachment (existing or uploaded)
    const hasAttachment = (documentId: string): boolean => {
      const doc = documents.find((d) => String(d.id) === documentId)
      if (!doc) return false

      // Check for uploaded files
      const hasUploaded = hasUploadedFile(documentId)

      // Check for existing attachments (by document id)
      const hasExisting = hasExistingAttachment(documentId)

      return hasUploaded || hasExisting
    }

    // Checkbox handlers
    const handleDocumentSelect = (
      documentId: string | number,
      checked: boolean,
    ) => {
      if (checked) {
        // Only allow one selection at a time
        setSelectedDocument(String(documentId))
      } else {
        setSelectedDocument(null)
      }
    }

    // Function to convert DOCX to HTML using mammoth
    const convertDocxToHtml = async (file: File): Promise<string> => {
      setIsLoadingDocx(true)
      try {
        const arrayBuffer = await file.arrayBuffer()
        const mammoth = await loadMammothModule()
        const result = await mammoth.convertToHtml({ arrayBuffer })
        setIsLoadingDocx(false)
        return result.value
      } catch (error) {
        console.error('Error converting DOCX to HTML:', error)
        setIsLoadingDocx(false)
        return '<p>Erro ao carregar o documento DOCX.</p>'
      }
    }

    // CRUD Functions
    const fetchDocuments = async () => {
      if (!riskLevel) {
        return
      }

      setIsLoadingDocuments(true)
      try {
        const response = await getAttachmentTypes(riskLevel)
        setDocuments(response.data)
      } catch (error) {
        console.error('Error fetching attachment types:', error)
        notifications.show({
          title: 'Erro ao carregar documentos',
          message:
            'Não foi possível carregar a lista de documentos. Tente novamente.',
          color: 'red',
          autoClose: 5000,
        })
      } finally {
        setIsLoadingDocuments(false)
      }
    }

    const isDuplicateAttachmentName = (name: string) => {
      const normalizedName = name.trim().toUpperCase()

      // Check against existing documents fetched from the API
      if (
        documents.some(
          (doc) => doc.name.trim().toUpperCase() === normalizedName,
        )
      ) {
        return true
      }

      // Check against existing attachments already stored on the supplier
      if (
        existingAttachments?.some(
          (attachment) =>
            (attachment.attachmentTypeName ?? '').trim().toUpperCase() ===
            normalizedName,
        )
      ) {
        return true
      }

      return false
    }

    const startCreating = () => {
      setIsCreating(true)
      setEditingAttachmentType(null)
      setSelectedDocument(null)

      // Find valid risk level from options or use current form risk level
      const validRiskLevel =
        riskLevelOptions.find((option) => option.value === riskLevel)?.value ||
        riskLevelOptions[0]?.value ||
        '1'

      // Reset form with default values
      attachmentTypeForm.reset({
        name: '',
        riskLevel: validRiskLevel,
      })

      setDrawerOpened(true)
    }

    const handleSave = async (data: AttachmentTypeFormData) => {
      const trimmedName = data.name.trim()
      if (isDuplicateAttachmentName(trimmedName)) {
        notifications.show({
          title: 'Documento duplicado',
          message: 'Já existe um documento com este nome. Escolha outro nome.',
          color: 'orange',
          autoClose: 5000,
        })
        return
      }

      setIsSaving(true)
      try {
        if (isCreating) {
          const createData: CreateAttachmentTypeRequest = {
            name: data.name,
            riskLevel: data.riskLevel,
          }
          await createAttachmentType(createData)
          notifications.show({
            title: 'Sucesso',
            message: 'Tipo de anexo criado com sucesso.',
            color: 'green',
            autoClose: 3000,
          })
        } else if (editingAttachmentType) {
          const updateData: UpdateAttachmentTypeRequest = {
            name: data.name,
            riskLevel: data.riskLevel,
          }
          await updateAttachmentType(editingAttachmentType.id, updateData)
          notifications.show({
            title: 'Sucesso',
            message: 'Documento atualizado com sucesso.',
            color: 'green',
            autoClose: 3000,
          })
        }

        // Reset form and close drawer
        attachmentTypeForm.reset()
        setDrawerOpened(false)
        setIsCreating(false)
        setEditingAttachmentType(null)
        await fetchDocuments() // Reload the list
      } catch (error) {
        console.error('Error saving attachment type:', error)
        notifications.show({
          title: 'Erro ao salvar',
          message: 'Não foi possível salvar o tipo de anexo. Tente novamente.',
          color: 'red',
          autoClose: 5000,
        })
      } finally {
        setIsSaving(false)
      }
    }

    const startEditing = (doc: AttachmentType) => {
      setEditingAttachmentType(doc)
      setIsCreating(false)

      // Populate form with document data
      attachmentTypeForm.reset({
        name: doc.name,
        riskLevel: String(doc.riskLevel) || '1',
      })
    }

    const handleDelete = async () => {
      if (!attachmentTypeToDelete) return

      try {
        await deleteAttachmentType(attachmentTypeToDelete.id)
        notifications.show({
          title: 'Sucesso',
          message: 'Tipo de anexo excluído com sucesso.',
          color: 'green',
          autoClose: 3000,
        })
        setDeleteModalOpened(false)
        setAttachmentTypeToDelete(null)
        await fetchDocuments() // Reload the list
      } catch (error) {
        console.error('Error deleting attachment type:', error)
        notifications.show({
          title: 'Erro ao excluir',
          message: 'Não foi possível excluir o tipo de anexo. Tente novamente.',
          color: 'red',
          autoClose: 5000,
        })
      }
    }

    const confirmDelete = (attachmentType: AttachmentType) => {
      setAttachmentTypeToDelete(attachmentType)
      setDeleteModalOpened(true)
    }

    const handleAttachFile = async (files: File[]) => {
      if (!files.length || !selectedDocument) return

      const selectedDocumentObj = documents.find(
        (doc) => String(doc.id) === selectedDocument,
      )
      if (!selectedDocumentObj) return

      const validFiles: UploadedFile[] = []
      const invalidNames: string[] = []

      for (const file of files) {
        const fileExt = file.name.split('.').pop()?.toLowerCase()
        if (!fileExt || !ACCEPTED_FILE_TYPES.includes(`.${fileExt}`)) {
          invalidNames.push(file.name)
          continue
        }
        validFiles.push({
          id: `${Date.now()}-${file.name}`,
          documentId: selectedDocument,
          file,
          uploadDate: new Date(),
        })
      }

      if (invalidNames.length) {
        notifications.show({
          title: 'Formato não suportado',
          message: `Arquivo(s) ignorado(s): ${invalidNames.join(', ')}. Use PDF, DOC, DOCX, JPG, JPEG ou PNG.`,
          color: 'orange',
          autoClose: 5000,
        })
      }

      if (!validFiles.length) return

      if (supplierId) {
        // EDIT MODE: upload immediately, do not buffer in browser state
        setIsUploadingFiles(true)
        setAttachModalOpened(false)
        setSelectedFiles([])
        try {
          const results = await Promise.allSettled(
            validFiles.map((f) =>
              uploadSupplierAttachment(supplierId, f.documentId, f.file),
            ),
          )
          const succeeded = results.filter(
            (r) => r.status === 'fulfilled',
          ).length
          const failed = results.length - succeeded

          if (succeeded > 0) {
            queryClient.invalidateQueries({
              queryKey: ['supplier-attachments', supplierId],
            })
          }

          if (failed === 0) {
            notifications.show({
              title: 'Arquivo(s) enviado(s)',
              message: `${succeeded} arquivo(s) enviado(s) ao documento "${selectedDocumentObj.name}"`,
              color: 'green',
              autoClose: 3000,
            })
          } else if (succeeded > 0) {
            notifications.show({
              title: 'Envio parcial',
              message: `${succeeded} enviado(s), ${failed} falhou(aram). Tente novamente os arquivos com erro.`,
              color: 'orange',
              autoClose: 5000,
            })
          } else {
            notifications.show({
              title: 'Erro ao enviar',
              message: 'Falha ao enviar os arquivos. Tente novamente.',
              color: 'red',
              autoClose: 5000,
            })
          }
        } finally {
          setIsUploadingFiles(false)
        }
      } else {
        // ADD MODE: buffer in browser state, upload on final save
        const updatedFiles = [...uploadedFiles, ...validFiles]
        setUploadedFiles(updatedFiles)
        if (_onFilesChange) _onFilesChange(updatedFiles)

        setSelectedFiles([])
        setAttachModalOpened(false)

        notifications.show({
          title: 'Arquivo(s) anexado(s)',
          message: `${validFiles.length} arquivo(s) anexado(s) ao documento "${selectedDocumentObj.name}"`,
          color: 'green',
          autoClose: 3000,
        })
      }
    }

    const clearPreviewState = () => {
      if (selectedAttachment?.url) {
        URL.revokeObjectURL(selectedAttachment.url)
      }
      setSelectedAttachment(null)
      setDocxContent('')
      setIsLoadingDocx(false)
    }

    const formatUploadedAt = (date?: string) => {
      if (!date) return 'Sem data'
      const parsedDate = new Date(date)
      if (Number.isNaN(parsedDate.getTime())) return 'Sem data'

      return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(parsedDate)
    }

    const convertVersionToPreview = async (version: AttachmentVersionItem) => {
      clearPreviewState()
      setIsFetchingAttachment(true)
      try {
        if (version.source === 'local' && version.localFile) {
          const fileExt = version.localFile.name.split('.').pop()?.toLowerCase()
          const localUrl = URL.createObjectURL(version.localFile)
          setSelectedAttachment({
            id: version.id,
            name: version.fileName,
            file: version.localFile,
            url: localUrl,
            type: fileExt || '',
          })

          if (fileExt === 'docx') {
            const html = await convertDocxToHtml(version.localFile)
            setDocxContent(html)
          }
          return
        }

        const response =
          version.source === 'history'
            ? await downloadSupplierAttachmentHistory(version.downloadId)
            : await downloadSupplierAttachment(version.downloadId)
        const blob = response.data
        const url = URL.createObjectURL(blob)
        const fileExt = version.fileName.split('.').pop()?.toLowerCase()
        setSelectedAttachment({
          id: version.id,
          name: version.fileName,
          file: null,
          url,
          type: fileExt || '',
        })

        if (fileExt === 'docx') {
          const file = new File([blob], version.fileName, {
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          })
          const html = await convertDocxToHtml(file)
          setDocxContent(html)
        }
      } catch (error) {
        console.error('Error fetching attachment preview version:', error)
        notifications.show({
          title: 'Erro ao carregar anexo',
          message: 'Não foi possível carregar o anexo para visualização.',
          color: 'red',
          autoClose: 5000,
        })
      } finally {
        setIsFetchingAttachment(false)
      }
    }

    const handleDownloadSelectedVersion = async () => {
      if (!selectedVersionId) return
      const selectedVersion = attachmentVersions.find(
        (version) => version.id === selectedVersionId,
      )
      if (!selectedVersion) return

      if (selectedVersion.source === 'local' && selectedVersion.localFile) {
        const url = URL.createObjectURL(selectedVersion.localFile)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = selectedVersion.fileName
        document.body.appendChild(anchor)
        anchor.click()
        document.body.removeChild(anchor)
        URL.revokeObjectURL(url)
        return
      }

      setIsDownloadingVersion(true)
      try {
        const response =
          selectedVersion.source === 'history'
            ? await downloadSupplierAttachmentHistory(
                selectedVersion.downloadId,
              )
            : await downloadSupplierAttachment(selectedVersion.downloadId)

        const blob = response.data
        const url = URL.createObjectURL(blob)
        const extension = selectedVersion.fileName
          .split('.')
          .pop()
          ?.toLowerCase()
        const isPdf = extension === 'pdf'

        if (isPdf) {
          const openedWindow = window.open(url, '_blank', 'noopener,noreferrer')
          if (!openedWindow) {
            const anchor = document.createElement('a')
            anchor.href = url
            anchor.target = '_blank'
            anchor.rel = 'noopener noreferrer'
            document.body.appendChild(anchor)
            anchor.click()
            document.body.removeChild(anchor)
          }
        } else {
          const anchor = document.createElement('a')
          anchor.href = url
          anchor.download = selectedVersion.fileName
          document.body.appendChild(anchor)
          anchor.click()
          document.body.removeChild(anchor)
        }

        URL.revokeObjectURL(url)
      } catch (error) {
        console.error('Error downloading attachment version:', error)
        notifications.show({
          title: 'Erro ao baixar anexo',
          message: 'Não foi possível baixar a versão selecionada.',
          color: 'red',
          autoClose: 5000,
        })
      } finally {
        setIsDownloadingVersion(false)
      }
    }

    // Function to handle viewing a file
    const handleViewFile = async () => {
      if (!selectedDocument) return

      const selectedDocumentObj = documents.find(
        (doc) => String(doc.id) === selectedDocument,
      )
      if (!selectedDocumentObj) return

      const localFilesForDoc = uploadedFiles.filter(
        (file) => String(file.documentId) === selectedDocument,
      )

      setViewModalOpened(true)
      setIsLoadingVersions(true)
      setVersionsError(null)
      clearPreviewState()

      try {
        let versionsFromApi: SupplierAttachmentVersion[] = []
        if (supplierId) {
          const response = await getSupplierAttachmentVersions(
            supplierId,
            String(selectedDocumentObj.id),
          )
          versionsFromApi = response.data ?? []
        }

        const versions = buildAttachmentVersionItems(
          versionsFromApi,
          localFilesForDoc,
          selectedDocumentObj.name,
          String(selectedDocumentObj.id),
        )

        if (!versions.length) {
          setAttachmentVersions([])
          setSelectedVersionId(null)
          notifications.show({
            title: 'Nenhum anexo disponível',
            message: `Não há anexo disponível para o documento "${selectedDocumentObj.name}"`,
            color: 'orange',
            autoClose: 3000,
          })
          return
        }

        setAttachmentVersions(versions)
        const firstVersion = versions[0]
        setSelectedVersionId(firstVersion.id)
        await convertVersionToPreview(firstVersion)
      } catch (error) {
        console.error('Error fetching attachment versions:', error)
        setVersionsError('Não foi possível carregar o histórico de anexos.')
        notifications.show({
          title: 'Erro ao carregar histórico',
          message: 'Não foi possível carregar as versões do anexo.',
          color: 'red',
          autoClose: 5000,
        })
      } finally {
        setIsLoadingVersions(false)
      }
    }

    const getRiskLevelTitle = () => {
      switch (riskLevel) {
        case '1':
          return 'Documentação - Baixo Risco'
        case '2':
          return 'Documentação - Médio Risco'
        case '3':
          return 'Documentação - Alto Risco'
        default:
          return 'Documentação'
      }
    }

    return (
      <Box pos="relative">
        <LoadingOverlay visible={isLoadingDocuments} />

        {/* Risk level floating label */}
        <Box
          pos="absolute"
          top={-30}
          left={-20}
          bg={
            riskLevel === '3' ? 'red' : riskLevel === '2' ? 'orange' : 'green'
          }
          c="var(--mantine-color-white)"
          px="xs"
          py={4}
          h={30}
          w={30}
          style={{
            borderRadius: '4px 4px 0 0',
            fontSize: '11px',
            fontWeight: 600,
            transform: 'rotate(90deg)',
            transformOrigin: 'bottom left',
            zIndex: 10,
          }}
        ></Box>

        <Title
          order={3}
          mb="md"
          c={
            riskLevel === '3'
              ? 'var(--mantine-color-red-7)'
              : getPrimaryTextColor()
          }
        >
          &nbsp; &nbsp; {getRiskLevelTitle()}
        </Title>

        <Flex justify="space-between" align="center" mb="lg">
          <Text size="sm" c="gray.6"></Text>
          <Flex gap="md">
            <Can I="add" a="supplier">
              <Button
                variant="outline"
                color="blue"
                size="sm"
                leftSection={<Paperclip size={16} />}
                disabled={!selectedDocument}
                onClick={() => setAttachModalOpened(true)}
              >
                Anexar
              </Button>
            </Can>
            <Button
              variant="outline"
              color="blue"
              size="sm"
              leftSection={<Eye size={16} />} // Reverted to Eye icon
              disabled={
                !selectedDocument || !hasAttachment(selectedDocument || '')
              }
              onClick={handleViewFile}
              loading={isLoadingVersions || isFetchingAttachment}
            >
              Visualizar
            </Button>
            <Can I="edit" a="supplier">
              <Button
                variant="filled"
                color="blue"
                size="sm"
                leftSection={<Settings size={16} />}
                onClick={() => setDrawerOpened(true)}
              >
                Gerenciar
              </Button>
            </Can>
          </Flex>
        </Flex>

        {/* Document Table Layout */}
        <Box mb="lg">
          <Flex justify="space-between" align="center" mb="md">
            <Text fw={600} size="sm">
              DOCUMENTOS
            </Text>
          </Flex>

          {/* Mantine Table */}
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th></Table.Th>
                <Table.Th></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {Array.from(
                { length: Math.ceil(documents.length / 2) },
                (_, rowIndex) => {
                  const leftDoc = documents[rowIndex]
                  const rightDoc =
                    documents[rowIndex + Math.ceil(documents.length / 2)]

                  return (
                    <Table.Tr
                      key={`row-${rowIndex}`}
                      style={{
                        backgroundColor:
                          rowIndex % 2 === 0
                            ? getTableRowEvenBackgroundColor()
                            : getTableRowOddBackgroundColor(),
                      }}
                    >
                      {/* Left Column */}
                      <Table.Td>
                        {leftDoc && (
                          <Flex align="center" gap="sm">
                            <Checkbox
                              checked={selectedDocument === String(leftDoc.id)}
                              onChange={(event) =>
                                handleDocumentSelect(
                                  leftDoc.id,
                                  event.currentTarget.checked,
                                )
                              }
                            />
                            <Flex align="center" flex={1} gap="xs">
                              <Text
                                size="sm"
                                c={getSecondaryTextColor()}
                                fw={400}
                              >
                                {leftDoc.name}
                              </Text>
                              {hasAttachment(String(leftDoc.id)) && (
                                <Flex
                                  style={{ position: 'relative' }}
                                  title="Documento com anexo"
                                >
                                  <Paperclip
                                    size={14}
                                    color="var(--mantine-color-green-6)"
                                    style={{ flexShrink: 0 }}
                                  />
                                </Flex>
                              )}
                            </Flex>
                          </Flex>
                        )}
                      </Table.Td>

                      {/* Right Column */}
                      <Table.Td>
                        {rightDoc && (
                          <Flex align="center" gap="sm">
                            <Checkbox
                              checked={selectedDocument === String(rightDoc.id)}
                              onChange={(event) =>
                                handleDocumentSelect(
                                  rightDoc.id,
                                  event.currentTarget.checked,
                                )
                              }
                            />
                            <Flex align="center" flex={1} gap="xs">
                              <Text
                                size="sm"
                                c={getSecondaryTextColor()}
                                fw={400}
                              >
                                {rightDoc.name}
                              </Text>
                              {hasAttachment(String(rightDoc.id)) && (
                                <Flex
                                  style={{ position: 'relative' }}
                                  title="Documento com anexo"
                                >
                                  <Paperclip
                                    size={14}
                                    color="var(--mantine-color-green-6)"
                                    style={{ flexShrink: 0 }}
                                  />
                                </Flex>
                              )}
                            </Flex>
                          </Flex>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  )
                },
              )}
            </Table.Tbody>
          </Table>
        </Box>

        {/* Management Drawer */}
        <Drawer
          opened={drawerOpened}
          onClose={() => {
            attachmentTypeForm.reset()
            setDrawerOpened(false)
            setIsCreating(false)
            setEditingAttachmentType(null)
          }}
          position="right"
          size="lg"
        >
          <Text size="lg" fw={700} mb="md">
            Gerenciar
          </Text>

          <Flex justify="flex-start" align="center" mb="lg">
            <Can I="add" a="supplier">
              <Button
                variant="filled"
                color="blue"
                leftSection={<Plus size={16} />}
                onClick={startCreating}
              >
                Criar Novo
              </Button>
            </Can>
          </Flex>
          <Box>
            {(isCreating || selectedDocument) && (
              <>
                {/* Dynamic Title */}
                <Text size="md" fw={600} mb="md" c="blue.6">
                  {isCreating
                    ? 'Criar Novo Tipo de Anexo'
                    : editingAttachmentType
                      ? `Editar "${editingAttachmentType.name}"`
                      : selectedDocument
                        ? `Visualizar "${
                            documents.find(
                              (d) => String(d.id) === selectedDocument,
                            )?.name || ''
                          }"`
                        : ''}
                </Text>

                <form onSubmit={attachmentTypeForm.handleSubmit(handleSave)}>
                  <Stack gap="md">
                    <Controller
                      name="name"
                      control={attachmentTypeForm.control}
                      render={({ field, fieldState }) => (
                        <TextInput
                          {...field}
                          label="Nome do Tipo de Anexo"
                          placeholder="Digite o nome"
                          required
                          error={fieldState.error?.message}
                          readOnly={
                            !!(selectedDocument && !editingAttachmentType)
                          }
                          onClick={() => {
                            if (selectedDocument && !editingAttachmentType) {
                              const doc = documents.find(
                                (d) => String(d.id) === selectedDocument,
                              )
                              if (doc) startEditing(doc)
                            }
                          }}
                        />
                      )}
                    />

                    <Select
                      name="riskLevel"
                      control={attachmentTypeForm.control}
                      label="Grau de Risco"
                      placeholder="Selecione o grau de risco"
                      required
                      data={riskLevelOptions}
                      disabled={
                        isLoading.riskLevels ||
                        !!(selectedDocument && !editingAttachmentType)
                      }
                      loading={isLoading.riskLevels}
                      onClick={() => {
                        if (selectedDocument && !editingAttachmentType) {
                          const doc = documents.find(
                            (d) => String(d.id) === selectedDocument,
                          )
                          if (doc) startEditing(doc)
                        }
                      }}
                    />

                    <Group justify="flex-end" mt="lg">
                      {selectedDocument && !isCreating && (
                        <Can I="delete" a="supplier">
                          <Button
                            variant="outline"
                            color="red"
                            onClick={() => {
                              const doc = documents.find(
                                (d) => String(d.id) === selectedDocument,
                              )
                              if (doc) confirmDelete(doc)
                            }}
                          >
                            Excluir
                          </Button>
                        </Can>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => {
                          attachmentTypeForm.reset()
                          setEditingAttachmentType(null)
                          if (selectedDocument) {
                            setIsCreating(false)
                          } else {
                            setDrawerOpened(false)
                            setIsCreating(false)
                          }
                        }}
                      >
                        Cancelar
                      </Button>
                      {(isCreating || editingAttachmentType) && (
                        <Can I={isCreating ? 'add' : 'edit'} a="supplier">
                          <Button type="submit" color="blue" loading={isSaving}>
                            Salvar
                          </Button>
                        </Can>
                      )}
                    </Group>
                  </Stack>
                </form>
              </>
            )}
          </Box>
        </Drawer>

        {/* Delete Confirmation Modal */}
        <Modal
          opened={deleteModalOpened}
          onClose={() => setDeleteModalOpened(false)}
          title="Confirmar Exclusão"
          centered
        >
          <Text mb="lg">
            Tem certeza que deseja excluir o tipo de anexo &quot;
            {attachmentTypeToDelete?.name}&quot;? Esta ação não pode ser
            desfeita.
          </Text>

          <Group justify="flex-end">
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpened(false)}
            >
              Cancelar
            </Button>
            <Can I="delete" a="supplier">
              <Button color="red" onClick={handleDelete}>
                Excluir
              </Button>
            </Can>
          </Group>
        </Modal>

        {/* Attach File Modal */}
        <Modal
          opened={attachModalOpened}
          onClose={() => {
            setAttachModalOpened(false)
            setSelectedFiles([])
          }}
          title="Anexar Arquivo"
          centered
        >
          {selectedDocument && (
            <>
              <Text mb="lg">
                Selecione os arquivos que deseja anexar ao documento &quot;
                {documents.find((doc) => String(doc.id) === selectedDocument)
                  ?.name || ''}
                &quot;.
              </Text>

              <FileInput
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                placeholder="Clique para selecionar arquivos PDF, DOC, DOCX, JPG ou PNG"
                value={selectedFiles}
                onChange={(files) => setSelectedFiles(files ?? [])}
                mb="md"
              />

              <Group justify="flex-end">
                <Button
                  variant="outline"
                  disabled={isUploadingFiles}
                  onClick={() => {
                    setAttachModalOpened(false)
                    setSelectedFiles([])
                  }}
                >
                  Cancelar
                </Button>
                <Can I="add" a="supplier">
                  <Button
                    color="blue"
                    disabled={!selectedFiles.length || isUploadingFiles}
                    loading={isUploadingFiles}
                    onClick={() => handleAttachFile(selectedFiles)}
                  >
                    Anexar
                  </Button>
                </Can>
              </Group>
            </>
          )}
        </Modal>

        {/* View File Modal */}
        <Modal
          opened={viewModalOpened}
          onClose={() => {
            setViewModalOpened(false)
            clearPreviewState()
            setAttachmentVersions([])
            setSelectedVersionId(null)
            setVersionsError(null)
          }}
          title="Histórico de Anexos"
          size="xl"
          styles={{
            content: { width: '95vw', maxWidth: '1600px', maxHeight: '90vh' },
            body: {
              padding: '1rem',
              maxHeight: 'calc(90vh - 80px)',
              overflow: 'auto',
            },
            header: {
              padding: '1rem',
              borderBottom: '1px solid var(--mantine-color-default-border)',
            },
          }}
          centered
        >
          <Flex
            gap="lg"
            align="stretch"
            wrap="nowrap"
            style={{
              minHeight: '560px',
              height: 'calc(90vh - 120px)',
            }}
          >
            <Box
              style={{
                width: '280px',
                flex: '0 0 280px',
                border: '1px solid var(--mantine-color-default-border)',
                borderRadius: '12px',
                padding: '14px',
                overflowY: 'auto',
                backgroundColor: 'var(--mantine-color-default)',
              }}
            >
              <Text fw={700} size="sm" mb="sm" c="gray.8">
                Versões
              </Text>
              {isLoadingVersions ? (
                <Text size="sm" c="gray.7">
                  Carregando versões...
                </Text>
              ) : versionsError ? (
                <Text size="sm" c="red.7">
                  {versionsError}
                </Text>
              ) : !attachmentVersions.length ? (
                <Text size="sm" c="gray.7">
                  Nenhuma versão encontrada.
                </Text>
              ) : (
                <Stack gap="xs">
                  {attachmentVersions.map((version) => (
                    <Button
                      key={version.id}
                      fullWidth
                      size="compact-md"
                      radius="md"
                      variant={
                        selectedVersionId === version.id ? 'light' : 'subtle'
                      }
                      color={selectedVersionId === version.id ? 'blue' : 'dark'}
                      styles={{
                        root: {
                          border:
                            selectedVersionId === version.id
                              ? '1px solid var(--mantine-color-blue-6)'
                              : '1px solid var(--mantine-color-default-border)',
                          backgroundColor:
                            selectedVersionId === version.id
                              ? 'var(--mantine-color-blue-0)'
                              : 'var(--mantine-color-default)',
                          height: 'auto',
                          padding: '10px',
                        },
                        inner: {
                          justifyContent: 'flex-start',
                          width: '100%',
                        },
                        label: {
                          width: '100%',
                        },
                      }}
                      onClick={async () => {
                        setSelectedVersionId(version.id)
                        await convertVersionToPreview(version)
                      }}
                    >
                      <Stack
                        gap={4}
                        style={{ textAlign: 'left', width: '100%' }}
                      >
                        <Text
                          size="xs"
                          fw={600}
                          style={{
                            whiteSpace: 'normal',
                            wordBreak: 'break-word',
                            lineHeight: 1.3,
                          }}
                        >
                          {version.fileName}
                        </Text>

                        <Group
                          justify="space-between"
                          align="center"
                          gap="xs"
                          style={{ width: '100%' }}
                        >
                          <Text size="xs" c="gray.7">
                            {formatUploadedAt(version.uploadedAt)}
                          </Text>
                          <Group gap={4}>
                            {version.source === 'local' && (
                              <Badge color="blue" size="xs">
                                Atual (não salvo)
                              </Badge>
                            )}
                            {version.isCurrent &&
                              version.source !== 'local' && (
                                <Badge color="green" size="xs">
                                  Atual
                                </Badge>
                              )}
                          </Group>
                        </Group>
                      </Stack>
                    </Button>
                  ))}
                </Stack>
              )}
            </Box>

            <Box
              style={{
                flex: 1,
                minWidth: '300px',
                border: '1px solid var(--mantine-color-default-border)',
                borderRadius: '12px',
                padding: '14px',
                overflow: 'hidden',
                backgroundColor: 'var(--mantine-color-default)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {selectedAttachment ? (
                <Stack
                  gap="md"
                  align="center"
                  style={{ width: '100%', height: '100%' }}
                >
                  <Stack
                    gap="sm"
                    style={{
                      alignSelf: 'stretch',
                      width: '100%',
                      flexShrink: 0,
                    }}
                  >
                    <Text
                      fw={700}
                      style={{
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                        lineHeight: 1.3,
                      }}
                    >
                      {selectedAttachment.name}
                    </Text>
                    <Group gap="sm" align="center">
                      {['pdf', 'jpg', 'jpeg', 'png'].includes(
                        selectedAttachment.type || '',
                      ) && (
                        <Button
                          size="sm"
                          radius="md"
                          variant="light"
                          leftSection={<Maximize size={16} />}
                          onClick={toggleFullscreen}
                        >
                          Tela Cheia
                        </Button>
                      )}
                      <Button
                        size="sm"
                        radius="md"
                        leftSection={<Download size={16} />}
                        onClick={handleDownloadSelectedVersion}
                        loading={isDownloadingVersion}
                      >
                        Download
                      </Button>
                    </Group>
                  </Stack>

                  {selectedAttachment.file ? (
                    <Stack
                      align="center"
                      style={{
                        width: '100%',
                        height: '100%',
                        flex: 1,
                        overflow: 'hidden',
                        backgroundColor: 'var(--mantine-color-default)',
                        position: 'relative',
                      }}
                      ref={previewContainerRef}
                    >
                      {isFullscreen && (
                        <Button
                          pos="absolute"
                          top={16}
                          right={32}
                          style={{
                            zIndex: 9999,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          }}
                          color="red"
                          radius="md"
                          leftSection={<Minimize size={16} />}
                          onClick={toggleFullscreen}
                        >
                          Sair da Tela Cheia
                        </Button>
                      )}
                      {selectedAttachment.type &&
                        ['jpg', 'jpeg', 'png'].includes(
                          selectedAttachment.type,
                        ) && (
                          <Box
                            style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              border:
                                '1px solid var(--mantine-color-default-border)',
                              borderRadius: '8px',
                              padding: '20px',
                              backgroundColor: 'var(--mantine-color-default)',
                              overflow: 'hidden',
                            }}
                          >
                            <img
                              src={selectedAttachment.url}
                              alt="Anexo"
                              style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain',
                              }}
                            />
                          </Box>
                        )}

                      {selectedAttachment.type === 'pdf' && (
                        <Box
                          style={{
                            width: '100%',
                            height: '100%',
                            border:
                              '1px solid var(--mantine-color-default-border)',
                            borderRadius: '8px',
                            overflow: 'hidden',
                          }}
                        >
                          <iframe
                            src={`${selectedAttachment.url}#toolbar=1&navpanes=0&view=FitH`}
                            width="100%"
                            height="100%"
                            style={{ border: 'none' }}
                            title="PDF Preview"
                          >
                            <Box
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                height: '100%',
                                textAlign: 'center',
                                padding: '20px',
                              }}
                            >
                              <Text mb="md" size="lg">
                                Não foi possível exibir o PDF no navegador.
                              </Text>
                              <Text size="sm" c="gray.6" mb="md">
                                Clique no link abaixo para baixar o arquivo.
                              </Text>
                              <Button
                                component="a"
                                href={selectedAttachment.url}
                                download={selectedAttachment.name}
                                leftSection={<Download size={16} />}
                              >
                                Baixar PDF
                              </Button>
                            </Box>
                          </iframe>
                        </Box>
                      )}

                      {selectedAttachment.type &&
                        ['doc', 'docx'].includes(selectedAttachment.type) && (
                          <Box
                            style={{
                              width: '100%',
                              height: '100%',
                              border:
                                '1px solid var(--mantine-color-default-border)',
                              borderRadius: '8px',
                              backgroundColor: 'var(--mantine-color-default)',
                              overflow: 'auto',
                              padding: '20px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                            }}
                          >
                            {selectedAttachment.type === 'docx' ? (
                              isLoadingDocx ? (
                                <Box
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    height: '400px',
                                  }}
                                >
                                  <Text>Carregando documento DOCX...</Text>
                                </Box>
                              ) : (
                                <div
                                  dangerouslySetInnerHTML={{
                                    __html: docxContent,
                                  }}
                                  style={{
                                    zoom: '0.65',
                                    transform: 'scale(0.85)',
                                    transformOrigin: 'top left',
                                    width: '800px',
                                    maxWidth: 'none',
                                  }}
                                />
                              )
                            ) : (
                              <Box
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  height: '400px',
                                  textAlign: 'center',
                                }}
                              >
                                <Text mb="md" size="lg">
                                  Pré-visualização não disponível para arquivos
                                  DOC.
                                </Text>
                                <Text size="sm" c="gray.6">
                                  Use formato DOCX para melhor compatibilidade e
                                  visualização.
                                </Text>
                                <Text size="sm" c="gray.6" mt="xs">
                                  Use o botão Download no cabeçalho para baixar
                                  o arquivo.
                                </Text>
                              </Box>
                            )}
                          </Box>
                        )}

                      {selectedAttachment.type &&
                        !['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'].includes(
                          selectedAttachment.type,
                        ) && (
                          <Text>
                            Este tipo de arquivo não pode ser pré-visualizado.
                            Use o botão Download no cabeçalho para baixá-lo.
                          </Text>
                        )}
                    </Stack>
                  ) : selectedAttachment.url ? (
                    <Stack
                      align="center"
                      style={{
                        width: '100%',
                        height: '100%',
                        flex: 1,
                        overflow: 'hidden',
                        backgroundColor: 'var(--mantine-color-default)',
                        position: 'relative',
                      }}
                      ref={previewContainerRef}
                    >
                      {isFullscreen && (
                        <Button
                          pos="absolute"
                          top={16}
                          right={32}
                          style={{
                            zIndex: 9999,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          }}
                          color="red"
                          radius="md"
                          leftSection={<Minimize size={16} />}
                          onClick={toggleFullscreen}
                        >
                          Sair da Tela Cheia
                        </Button>
                      )}
                      {selectedAttachment.type &&
                        ['jpg', 'jpeg', 'png'].includes(
                          selectedAttachment.type,
                        ) && (
                          <Box
                            style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              border:
                                '1px solid var(--mantine-color-default-border)',
                              borderRadius: '8px',
                              padding: '20px',
                              backgroundColor: 'var(--mantine-color-default)',
                              overflow: 'hidden',
                            }}
                          >
                            <img
                              src={selectedAttachment.url}
                              alt="Anexo"
                              style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain',
                              }}
                            />
                          </Box>
                        )}

                      {selectedAttachment.type === 'pdf' && (
                        <Box
                          style={{
                            width: '100%',
                            height: '100%',
                            border:
                              '1px solid var(--mantine-color-default-border)',
                            borderRadius: '8px',
                            overflow: 'hidden',
                          }}
                        >
                          <iframe
                            src={`${selectedAttachment.url}#toolbar=1&navpanes=0&view=FitH`}
                            width="100%"
                            height="100%"
                            style={{ border: 'none' }}
                            title="PDF Preview"
                          />
                        </Box>
                      )}
                    </Stack>
                  ) : (
                    <Text color="red">
                      Não foi possível carregar o anexo. Verifique se o arquivo
                      ainda existe.
                    </Text>
                  )}
                </Stack>
              ) : (
                <Text size="sm" c="gray.7">
                  Selecione uma versão à esquerda para visualizar.
                </Text>
              )}
            </Box>
          </Flex>
        </Modal>
      </Box>
    )
  },
)

AttachmentsTab.displayName = 'AttachmentsTab'
