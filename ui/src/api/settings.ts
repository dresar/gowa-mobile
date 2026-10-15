import { http, results } from '@/lib/http'

export interface AppSettings {
  auto_reject_call: boolean
  auto_mark_read: boolean
  auto_like_status?: boolean
  auto_like_status_emoji?: string
  auto_download_media: boolean
  ignore_status_media: boolean
  presence_on_connect: string
  presence_pulse_enabled: boolean
  auto_reply_message: string
  webhook_url: string[]
  webhook_secret: string
  max_image_size: number
  max_file_size: number
  max_video_size: number
  max_download_size: number
  chatwoot_enabled: boolean
  chatwoot_url: string
  chatwoot_api_token?: string
  chatwoot_account_id: number
  chatwoot_inbox_id: number
  bot_ai_provider: string
  bot_ai_base_url: string
  bot_ai_model: string
  bot_ai_api_key?: string
  bot_ai_auto_reply_enabled: boolean
  supermemory_enabled: boolean
  supermemory_api_key?: string
  version: string
  os: string
  uptime_seconds: number
  app_port: string
  mcp_enabled: boolean
  scheduled_sends: boolean
}

export function getAppSettings(): Promise<AppSettings> {
  return results<AppSettings>(http.get('/app/settings'))
}

export function updateAppSettings(payload: Partial<AppSettings>): Promise<AppSettings> {
  return results<AppSettings>(http.put('/app/settings', payload))
}

export function changeAppPIN(payload: { old_pin: string; new_pin: string }): Promise<{ status: string }> {
  return results<{ status: string }>(http.post('/app/pin/change', payload))
}

export interface PingResponse {
  code: string
  message: string
  timestamp: number
}

export async function pingServer(): Promise<PingResponse> {
  const res = await http.get<PingResponse>('/app/ping')
  return res.data
}

export interface CommitItem {
  hash: string
  message: string
  date: string
  author?: string
}

export interface SystemVersionInfo {
  commit: string
  commit_msg: string
  commit_date: string
  branch: string
  remote_url: string
  has_update: boolean
  remote_commit: string
  remote_commit_msg?: string
  app_version: string
  recent_commits?: CommitItem[]
  incoming_commits?: CommitItem[]
  ui_last_modified?: string
  ui_size?: number
}

export interface SyncSystemResult {
  branch: string
  output: string
  latest_commit: string
  recent_commits?: CommitItem[]
  ui_updated?: boolean
  has_new_update?: boolean
  already_up_to_date?: boolean
}

export function getSystemVersion(): Promise<SystemVersionInfo> {
  return results<SystemVersionInfo>(http.get('/app/system/version'))
}

export function syncSystem(): Promise<SyncSystemResult> {
  return results<SyncSystemResult>(http.post('/app/system/sync'))
}
