import { downloadSupplierAttachment } from '@/services/api/supplier'
import { openBlob } from '@/utils/openBlob'

/**
 * Downloads a supplier attachment file
 * @param attachmentId - The ID of the attachment to download
 * @param fileName - The filename to save the file as
 */
export const downloadAttachment = async (
  attachmentId: string,
  fileName?: string,
) => {
  try {
    const response = await downloadSupplierAttachment(attachmentId)

    openBlob({
      blob: new Blob([response.data], {
        type: response.headers['content-type'] ?? 'application/octet-stream',
      }),
      filename: fileName || `attachment-${attachmentId}`,
      contentType: response.headers['content-type'],
      preferNewTab: (fileName || '').toLowerCase().endsWith('.pdf'),
    })
  } catch (error) {
    console.error('Error downloading attachment:', error)
    throw error
  }
}
