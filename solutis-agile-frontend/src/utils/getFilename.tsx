export const getFilename = (contentDisposition: string) => {
  let filename = 'Arquivo'
  if (contentDisposition.includes('filename*=utf-8')) {
    filename = contentDisposition.split("filename*=utf-8''")[1]
  } else {
    filename = contentDisposition.split('filename=')[1]
  }
  filename = filename.replace(/"/g, '')
  return filename
}
