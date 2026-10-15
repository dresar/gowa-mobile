import axios from 'axios'
import type { ResponseData } from '@/api/types'
import { sameOriginBaseUrl } from '@/lib/url'
import { useConnection } from '@/stores/connection'

export interface UploadMediaResult {
  file_path: string
  file_url: string
  file_name: string
  file_size: number
  mime_type: string
}

export async function uploadMedia(file: File): Promise<UploadMediaResult> {
  const formData = new FormData()
  formData.append('file', file)

  const origin = typeof window !== 'undefined' ? sameOriginBaseUrl() : ''
  const baseUrl = useConnection.getState().baseUrl || origin || 'http://localhost:3000'
  const token = useConnection.getState().token

  const headers: Record<string, string> = {}
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await axios.post<ResponseData<UploadMediaResult>>(
    `${baseUrl}/app/media/upload`,
    formData,
    {
      headers,
      timeout: 60_000,
    },
  )

  if (response.data?.code !== 'SUCCESS' || !response.data?.results) {
    throw new Error(response.data?.message || 'Gagal mengunggah media')
  }

  return response.data.results
}
