import { AxiosError } from 'axios'
import type { ApiError, ResponseData } from '@/api/types'
import { b64encode } from '@/lib/url'

export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === 'object' &&
    value !== null &&
    !(value instanceof Error) &&
    typeof (value as ApiError).status === 'number' &&
    typeof (value as ApiError).code === 'string' &&
    typeof (value as ApiError).message === 'string'
  )
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof AxiosError) {
    const data = error.response?.data as Partial<ResponseData<unknown>> | undefined
    return {
      status: error.response?.status ?? 0,
      code: data?.code ?? (error.response ? 'HTTP_ERROR' : 'NETWORK_ERROR'),
      message: data?.message ?? error.message,
    }
  }
  if (isApiError(error)) return error
  return {
    status: 0,
    code: 'UNKNOWN',
    message: error instanceof Error ? error.message : String(error),
  }
}

export function basicAuthHeader(username: string, password: string): string {
  return `Basic ${b64encode(`${username}:${password}`)}`
}

export function isDeviceNotFoundError(error: unknown): boolean {
  if (!error) return false
  const apiError = toApiError(error)
  if (apiError.code === 'DEVICE_NOT_FOUND' || apiError.code === 'DEVICE_ID_REQUIRED') {
    return true
  }
  if (typeof apiError.message === 'string') {
    const msg = apiError.message.toLowerCase()
    return (
      msg.includes('device not found') ||
      msg.includes('device_id is required') ||
      msg.includes('device id is required') ||
      msg.includes('device identification required')
    )
  }
  return false
}
