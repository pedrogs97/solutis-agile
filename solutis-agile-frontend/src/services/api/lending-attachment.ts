import axios from '@/lib/axios'

export const uploadLendingAttachment = async (
  file: File,
  lendingId: string | number,
): Promise<any> => {
  const formData = new FormData()
  formData.append('attachment', file)
  formData.append('lendingId', lendingId.toString())
  return axios.post('/lendings-attachments', formData)
}
