import { describe, expect, it } from 'vitest'

import {
  buildAttachmentVersionItems,
  type UploadedFile,
} from './attachments-tab'

describe('buildAttachmentVersionItems', () => {
  it('keeps current and history versions distinct when backend ids collide', () => {
    const versions = buildAttachmentVersionItems(
      [
        {
          id: 1,
          downloadId: 1,
          source: 'current',
          attachmentTypeId: 9,
          attachmentTypeName: 'Contrato',
          fileName: 'contrato-v2.pdf',
          description: 'Atual',
          isCurrent: true,
          uploadedAt: '2026-05-09T12:00:00Z',
        },
        {
          id: 1,
          downloadId: 1,
          source: 'history',
          attachmentTypeId: 9,
          attachmentTypeName: 'Contrato',
          fileName: 'contrato-v1.pdf',
          description: 'Antigo',
          isCurrent: false,
          uploadedAt: '2026-05-08T12:00:00Z',
        },
      ],
      [],
      'Contrato',
      '9',
    )

    expect(versions.map((version) => version.id)).toEqual([
      'current-1',
      'history-1',
    ])
    expect(versions[0]).toMatchObject({
      source: 'current',
      downloadId: '1',
      fileName: 'contrato-v2.pdf',
    })
    expect(versions[1]).toMatchObject({
      source: 'history',
      downloadId: '1',
      fileName: 'contrato-v1.pdf',
    })
  })

  it('shows unsaved local file as its own current version', () => {
    const localFile = {
      id: 'draft-1',
      documentId: '9',
      file: new File(['draft'], 'contrato-local.pdf', {
        type: 'application/pdf',
      }),
      uploadDate: new Date('2026-05-10T12:00:00Z'),
    } satisfies UploadedFile

    const versions = buildAttachmentVersionItems(
      [
        {
          id: 2,
          attachmentTypeId: 9,
          attachmentTypeName: 'Contrato',
          fileName: 'contrato-salvo.pdf',
          description: 'Salvo',
          isCurrent: true,
          uploadedAt: '2026-05-09T12:00:00Z',
        },
      ],
      [localFile],
      'Contrato',
      '9',
    )

    expect(versions[0]).toMatchObject({
      id: 'local-draft-1',
      source: 'local',
      downloadId: 'draft-1',
      fileName: 'contrato-local.pdf',
    })
    expect(versions[1]).toMatchObject({
      id: 'current-2',
      source: 'current',
      fileName: 'contrato-salvo.pdf',
    })
  })
})
