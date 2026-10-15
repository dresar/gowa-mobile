import axios, { type AxiosInstance, type AxiosResponse } from 'axios'
import type { RegistryDevice, ResponseData } from '@/api/types'
import { basicAuthHeader, isDeviceNotFoundError, toApiError } from '@/lib/api-error'
import { queryClient } from '@/lib/query-client'
import { useConnection } from '@/stores/connection'
import { useDeviceStore } from '@/stores/device'

export const http: AxiosInstance = axios.create({ timeout: 45_000 })

http.interceptors.request.use((config) => {
  const { baseUrl, token, username, password } = useConnection.getState()
  config.baseURL = baseUrl ?? ''
  if (!config.headers.Authorization) {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    } else if (username && password) {
      config.headers.Authorization = basicAuthHeader(username, password)
    }
  }
  if (!config.headers['X-Device-Id']) {
    let deviceId = useDeviceStore.getState().selectedDeviceId
    const cachedDevices = queryClient.getQueryData<RegistryDevice[]>(['devices'])
    if (cachedDevices && cachedDevices.length > 0) {
      const exists = deviceId ? cachedDevices.some((d) => d.id === deviceId) : false
      if (!exists) {
        deviceId = cachedDevices[0].id
        useDeviceStore.getState().selectDevice(deviceId)
      }
    }
    if (deviceId) {
      config.headers['X-Device-Id'] = encodeURIComponent(deviceId)
    }
  }
  return config
})

http.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: unknown) => {
    const apiError = toApiError(error)
    if (apiError.status === 401) {
      useConnection.getState().markUnauthorized()
    }
    if (isDeviceNotFoundError(apiError)) {
      const current = useDeviceStore.getState().selectedDeviceId
      if (current) {
        useDeviceStore.getState().selectDevice(null)
      }
      void queryClient.invalidateQueries({ queryKey: ['devices'] })
    }
    return Promise.reject(apiError)
  },
)

export async function results<T>(request: Promise<AxiosResponse<ResponseData<T>>>): Promise<T> {
  const response = await request
  return response.data.results as T
}

export async function envelope<T>(
  request: Promise<AxiosResponse<ResponseData<T>>>,
): Promise<ResponseData<T>> {
  const response = await request
  return response.data
}
