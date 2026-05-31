type OpenBlobOptions = {
  blob: Blob
  filename?: string
  contentType?: string | null
  preferNewTab?: boolean
}

const isPdfFile = (filename?: string, contentType?: string | null) => {
  if (contentType && contentType.toLowerCase().includes('pdf')) {
    return true
  }

  if (!filename) return false

  return filename.toLowerCase().endsWith('.pdf')
}

const revokeObjectUrlLater = (url: string) => {
  window.setTimeout(() => {
    window.URL.revokeObjectURL(url)
  }, 30000)
}

export function openBlob({
  blob,
  filename,
  contentType,
  preferNewTab = true,
}: OpenBlobOptions) {
  const objectUrl = window.URL.createObjectURL(blob)
  const shouldOpenNewTab = preferNewTab && isPdfFile(filename, contentType)

  if (shouldOpenNewTab) {
    const openedWindow = window.open(objectUrl, '_blank')

    if (openedWindow) {
      openedWindow.opener = null
    }

    if (!openedWindow) {
      const anchor = document.createElement('a')
      anchor.href = objectUrl
      anchor.target = '_blank'
      anchor.rel = 'noopener noreferrer'
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
    }

    revokeObjectUrlLater(objectUrl)
    return
  }

  const link = document.createElement('a')
  link.href = objectUrl
  if (filename) {
    link.setAttribute('download', decodeURIComponent(filename))
  } else {
    link.setAttribute('download', '')
  }
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  revokeObjectUrlLater(objectUrl)
}
