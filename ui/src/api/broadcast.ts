import type { Pagination } from '@/api/types'
import { http, results } from '@/lib/http'

export type CampaignStatus =
  | 'draft'
  | 'scheduled'
  | 'running'
  | 'paused'
  | 'completed'
  | 'cancelled'
  | 'failed'

export type RecipientStatus = 'pending' | 'sent' | 'failed' | 'skipped_not_wa'

export interface BroadcastCampaign {
  id: string
  name: string
  device_id: string
  message_template: string
  media_url?: string
  media_type?: string
  status: CampaignStatus
  scheduled_at?: string
  filter_unregistered: boolean
  min_delay: number
  max_delay: number
  batch_size: number
  batch_delay_min: number
  total_recipients: number
  sent_count: number
  failed_count: number
  skipped_count: number
  created_at: string
  started_at?: string
  completed_at?: string
  updated_at: string
}

export interface BroadcastRecipient {
  id: string
  campaign_id: string
  phone: string
  variables_json: string
  status: RecipientStatus
  sent_at?: string
  error_message?: string
  created_at: string
  updated_at: string
}

export interface RecipientInput {
  phone: string
  variables?: Record<string, string>
}

export interface CreateCampaignRequest {
  name: string
  device_id?: string
  message_template: string
  media_url?: string
  media_type?: string
  scheduled_at?: string
  filter_unregistered: boolean
  min_delay: number
  max_delay: number
  batch_size: number
  batch_delay_min: number
  recipients: RecipientInput[]
}

export interface CampaignFilter {
  status?: string
  device_id?: string
  search?: string
  limit?: number
  offset?: number
}

export interface CampaignListResponse {
  data: BroadcastCampaign[]
  pagination: Pagination
}

export interface CampaignDetailResponse {
  campaign: BroadcastCampaign
  recipients: BroadcastRecipient[]
  total: number
}

export interface WhatsAppCheckItem {
  phone: string
  jid: string
  is_in_wa: boolean
}

export interface WhatsAppCheckResponse {
  results: WhatsAppCheckItem[]
  valid_count: number
  total: number
}

export interface GenerateNumbersRequest {
  prefix: string
  digits: number
  count: number
  mode: 'random' | 'sequential'
  start_number?: string
}

export interface GenerateNumbersResponse {
  numbers: string[]
  count: number
}

export function listCampaigns(
  params: CampaignFilter = {},
  deviceId?: string,
): Promise<CampaignListResponse> {
  const config = {
    params,
    headers: deviceId ? { 'X-Device-Id': encodeURIComponent(deviceId) } : undefined,
  }
  return results<CampaignListResponse>(http.get('/app/broadcast/campaigns', config))
}

export function createCampaign(
  payload: CreateCampaignRequest,
  deviceId?: string,
): Promise<BroadcastCampaign> {
  const config = deviceId
    ? { headers: { 'X-Device-Id': encodeURIComponent(deviceId) } }
    : undefined
  return results<BroadcastCampaign>(http.post('/app/broadcast/campaigns', payload, config))
}

export function getCampaign(
  id: string,
  limit = 50,
  offset = 0,
  deviceId?: string,
): Promise<CampaignDetailResponse> {
  const config = {
    params: { limit, offset },
    headers: deviceId ? { 'X-Device-Id': encodeURIComponent(deviceId) } : undefined,
  }
  return results<CampaignDetailResponse>(
    http.get(`/app/broadcast/campaigns/${encodeURIComponent(id)}`, config),
  )
}

function campaignAction(
  id: string,
  action: 'pause' | 'resume' | 'cancel' | 'retry',
  deviceId?: string,
): Promise<void> {
  const config = deviceId
    ? { headers: { 'X-Device-Id': encodeURIComponent(deviceId) } }
    : undefined
  return http
    .post(`/app/broadcast/campaigns/${encodeURIComponent(id)}/${action}`, undefined, config)
    .then(() => undefined)
}

export const pauseCampaign = (id: string, deviceId?: string) =>
  campaignAction(id, 'pause', deviceId)

export const resumeCampaign = (id: string, deviceId?: string) =>
  campaignAction(id, 'resume', deviceId)

export const cancelCampaign = (id: string, deviceId?: string) =>
  campaignAction(id, 'cancel', deviceId)

export const retryCampaign = (id: string, deviceId?: string) =>
  campaignAction(id, 'retry', deviceId)

export interface DeviceQuotaResponse {
  device_id: string
  hourly_count: number
  daily_count: number
  hourly_limit: number
  daily_limit: number
  hourly_exceeded: boolean
  daily_exceeded: boolean
}

export function deleteCampaign(id: string, deviceId?: string): Promise<void> {
  const config = deviceId
    ? { headers: { 'X-Device-Id': encodeURIComponent(deviceId) } }
    : undefined
  return http
    .delete(`/app/broadcast/campaigns/${encodeURIComponent(id)}`, config)
    .then(() => undefined)
}

export function getDeviceQuota(deviceId?: string): Promise<DeviceQuotaResponse> {
  const config = {
    params: deviceId ? { device_id: deviceId } : undefined,
    headers: deviceId ? { 'X-Device-Id': encodeURIComponent(deviceId) } : undefined,
  }
  return results<DeviceQuotaResponse>(http.get('/app/broadcast/quota', config))
}

export function checkWhatsAppBulk(
  phones: string[],
  deviceId?: string,
): Promise<WhatsAppCheckResponse> {
  const config = deviceId
    ? { headers: { 'X-Device-Id': encodeURIComponent(deviceId) } }
    : undefined
  return results<WhatsAppCheckResponse>(
    http.post('/app/tools/whatsapp-check', { phones, device_id: deviceId || undefined }, config),
  )
}

export function generateNumbers(
  payload: GenerateNumbersRequest,
  deviceId?: string,
): Promise<GenerateNumbersResponse> {
  const config = deviceId
    ? { headers: { 'X-Device-Id': encodeURIComponent(deviceId) } }
    : undefined
  return results<GenerateNumbersResponse>(
    http.post('/app/tools/generate-numbers', payload, config),
  )
}
