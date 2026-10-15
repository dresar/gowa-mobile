import type { DeviceStatus, LoginQr, PairCode, RegistryDevice } from '@/api/types'
import { http, results } from '@/lib/http'

export interface AddDevicePayload {
  device_id?: string
  webhook_url?: string
  webhook_secret?: string
  webhook_events?: string
  webhook_insecure_skip_verify?: boolean
}

const enc = encodeURIComponent

export async function listDevices(): Promise<RegistryDevice[]> {
  const raw = (await results<RegistryDevice[]>(http.get('/devices'))) ?? []
  const sorted = [...raw].sort((a, b) => {
    const aNamed = !a.id.includes('@') && a.id !== 'default' ? 0 : 1
    const bNamed = !b.id.includes('@') && b.id !== 'default' ? 0 : 1
    if (aNamed !== bNamed) return aNamed - bNamed
    const aActive = a.state === 'logged_in' ? 0 : 1
    const bActive = b.state === 'logged_in' ? 0 : 1
    return aActive - bActive
  })
  const seen = new Set<string>()
  const deduplicated: RegistryDevice[] = []
  for (const d of sorted) {
    if (d.id === 'default') continue
    const rawKey = d.phone_number || (d.jid ? d.jid.split('@')[0].split(':')[0] : '')
    const key = rawKey || d.id
    if (seen.has(key)) continue
    seen.add(key)
    deduplicated.push(d)
  }
  return deduplicated
}

export async function addDevice(payload: AddDevicePayload): Promise<RegistryDevice> {
  return results(http.post('/devices', payload))
}

export async function removeDevice(deviceId: string): Promise<void> {
  await http.delete(`/devices/${enc(deviceId)}`)
}

export async function loginDevice(deviceId: string): Promise<LoginQr> {
  return results(http.get(`/devices/${enc(deviceId)}/login`))
}

export async function loginDeviceWithCode(deviceId: string, phone: string): Promise<PairCode> {
  return results(
    http.post(`/devices/${enc(deviceId)}/login/code`, undefined, { params: { phone } }),
  )
}

export async function logoutDevice(deviceId: string): Promise<void> {
  await http.post(`/devices/${enc(deviceId)}/logout`)
}

export async function reconnectDevice(deviceId: string): Promise<void> {
  await http.post(`/devices/${enc(deviceId)}/reconnect`)
}

export async function deviceStatus(deviceId: string): Promise<DeviceStatus> {
  return results(http.get(`/devices/${enc(deviceId)}/status`))
}

export interface DeviceWebhookConfig {
  device_id: string
  webhook_url: string
  webhook_secret: string
  webhook_events: string
  webhook_insecure_skip_verify: boolean
}

export interface UpdateDeviceWebhookPayload {
  /** Required by the API; an empty string disables the webhook. */
  webhook_url: string
  webhook_secret?: string
  webhook_events?: string
  webhook_insecure_skip_verify?: boolean
}

export async function getDeviceWebhook(deviceId: string): Promise<DeviceWebhookConfig> {
  return results(http.get(`/devices/${enc(deviceId)}/webhook`))
}

export async function updateDeviceWebhook(
  deviceId: string,
  payload: UpdateDeviceWebhookPayload,
): Promise<DeviceWebhookConfig> {
  return results(http.patch(`/devices/${enc(deviceId)}/webhook`, payload))
}

export interface TestWebhookPayload {
  webhook_url?: string
  webhook_secret?: string
  webhook_insecure_skip_verify?: boolean
  event_type?: string
}

export interface WebhookTestResult {
  url: string
  event: string
  latency_ms: number
  sent_payload: Record<string, unknown>
  status_code: number
  success: boolean
  response_body: string
  error?: string
}

export async function testDeviceWebhook(
  deviceId: string,
  payload: TestWebhookPayload,
): Promise<WebhookTestResult> {
  return results(http.post(`/devices/${enc(deviceId)}/webhook/test`, payload))
}

