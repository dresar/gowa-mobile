import { http, results } from '@/lib/http'

export interface BotRule {
  id: number
  trigger_type: 'exact' | 'contains' | 'starts_with' | 'regex'
  trigger_value: string
  recipient_jid?: string
  scope: 'all' | 'private' | 'group'
  response_type: 'text' | 'media'
  response_content: string
  media_url?: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface CreateRulePayload {
  trigger_type: 'exact' | 'contains' | 'starts_with' | 'regex'
  trigger_value: string
  recipient_jid?: string
  scope: 'all' | 'private' | 'group'
  response_type: 'text' | 'media'
  response_content: string
  media_url?: string
  is_active?: boolean
}

export interface UpdateRulePayload {
  trigger_type?: 'exact' | 'contains' | 'starts_with' | 'regex'
  trigger_value?: string
  recipient_jid?: string
  scope?: 'all' | 'private' | 'group'
  response_type?: 'text' | 'media'
  response_content?: string
  media_url?: string
  is_active?: boolean
}

export interface BotGroupRule {
  id?: number
  group_jid: string
  anti_link_enabled: boolean
  welcome_enabled: boolean
  welcome_template: string
  farewell_enabled: boolean
  farewell_template: string
  ai_enabled?: boolean
  created_at?: string
  updated_at?: string
}

export interface UpsertGroupRulePayload {
  group_jid: string
  anti_link_enabled?: boolean
  welcome_enabled?: boolean
  welcome_template?: string
  farewell_enabled?: boolean
  farewell_template?: string
  ai_enabled?: boolean
}

export interface BotAIConfig {
  id?: number
  provider: string
  base_url: string
  api_key: string
  model: string
  system_prompt: string
  temperature: number
  trigger_prefix: string
  auto_reply_enabled: boolean
  access_mode?: 'all' | 'allowlist' | 'blocklist'
  allowed_jids?: string
  blocked_jids?: string
  allow_groups?: boolean
  allowed_groups?: string
  created_at?: string
  updated_at?: string
}

export interface UpdateAIConfigPayload {
  provider?: string
  base_url?: string
  api_key?: string
  model?: string
  system_prompt?: string
  temperature?: number
  trigger_prefix?: string
  auto_reply_enabled?: boolean
  access_mode?: 'all' | 'allowlist' | 'blocklist'
  allowed_jids?: string
  blocked_jids?: string
  allow_groups?: boolean
  allowed_groups?: string
}

export interface BotAIPersona {
  id: number
  phone_number: string
  contact_name: string
  relationship: string
  custom_prompt: string
  auto_reply_enabled: boolean
  use_memory: boolean
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface CreateAIPersonaPayload {
  phone_number: string
  contact_name?: string
  relationship?: string
  custom_prompt: string
  auto_reply_enabled?: boolean
  use_memory?: boolean
  is_active?: boolean
}

export interface UpdateAIPersonaPayload {
  phone_number?: string
  contact_name?: string
  relationship?: string
  custom_prompt?: string
  auto_reply_enabled?: boolean
  use_memory?: boolean
  is_active?: boolean
}

export interface AIChatMessage {
  role: string
  content: string
}

export interface AIChatRequest {
  message: string
  chat_history?: AIChatMessage[]
  model?: string
  temperature?: number
}

export interface AIChatResult {
  reply: string
  model: string
  latency_ms: number
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface BotTool {
  name: string
  description: string
}

export interface ExecuteToolPayload {
  tool: string
  parameters: Record<string, unknown>
}

export interface ToolResult {
  tool: string
  status: string
  latency_ms: number
  output: unknown
}

export interface BotEventLog {
  id: number
  event_type: 'auto_reply' | 'group_moderation' | 'ai_chat' | 'ai_tool' | 'error'
  rule_id?: number
  sender_jid: string
  group_jid: string
  incoming_message: string
  response_message: string
  latency_ms: number
  status: 'success' | 'failed' | 'ignored' | 'rate_limited'
  created_at: string
}

export interface LogsResponse {
  total: number
  limit: number
  offset: number
  logs: BotEventLog[]
}

const enc = encodeURIComponent

export async function listRules(params?: {
  active?: boolean | string
  scope?: string
  recipient_jid?: string
  search?: string
  limit?: number
  offset?: number
}): Promise<BotRule[]> {
  return (await results<BotRule[]>(http.get('/bot/rules', { params }))) ?? []
}

export async function autoTagSpecialRules(): Promise<{ updated: number }> {
  return results(http.post('/bot/rules/auto-tag-special'))
}


export async function clearAllRules(): Promise<{ all: boolean }> {
  return results(http.delete('/bot/rules?all=true'))
}

export async function bulkDeleteRules(ids: number[]): Promise<{ deleted_count: number; ids: number[] }> {
  return results(http.delete('/bot/rules', { data: { ids } }))
}

export async function createRule(payload: CreateRulePayload): Promise<BotRule> {
  return results(http.post('/bot/rules', payload))
}

export async function importRules(
  payload: CreateRulePayload[],
): Promise<{ total: number; imported: number }> {
  return results(http.post('/bot/rules/import', payload))
}

export async function getRule(id: number): Promise<BotRule> {
  return results(http.get(`/bot/rules/${id}`))
}

export async function updateRule(id: number, payload: UpdateRulePayload): Promise<BotRule> {
  return results(http.put(`/bot/rules/${id}`, payload))
}

export async function deleteRule(id: number): Promise<void> {
  await http.delete(`/bot/rules/${id}`)
}

export async function toggleRule(id: number): Promise<BotRule> {
  return results(http.patch(`/bot/rules/${id}/toggle`))
}

export async function listGroupRules(): Promise<BotGroupRule[]> {
  return (await results<BotGroupRule[]>(http.get('/bot/group-rules'))) ?? []
}

export async function getGroupRule(groupJid: string): Promise<BotGroupRule> {
  return results(http.get(`/bot/group-rules/${enc(groupJid)}`))
}

export async function upsertGroupRule(payload: UpsertGroupRulePayload): Promise<BotGroupRule> {
  return results(http.post('/bot/group-rules', payload))
}

export async function deleteGroupRule(groupJid: string): Promise<void> {
  await http.delete(`/bot/group-rules/${enc(groupJid)}`)
}

export async function getAIConfig(): Promise<BotAIConfig> {
  return results(http.get('/bot/ai/config'))
}

export async function updateAIConfig(payload: UpdateAIConfigPayload): Promise<BotAIConfig> {
  return results(http.put('/bot/ai/config', payload))
}

export async function resetAIConfig(): Promise<BotAIConfig> {
  return results(http.post('/bot/ai/reset'))
}

export async function listAIPersonas(): Promise<BotAIPersona[]> {
  return (await results<BotAIPersona[]>(http.get('/bot/ai/personas'))) ?? []
}

export async function getAIPersona(id: number): Promise<BotAIPersona> {
  return results(http.get(`/bot/ai/personas/${id}`))
}

export async function createAIPersona(payload: CreateAIPersonaPayload): Promise<BotAIPersona> {
  return results(http.post('/bot/ai/personas', payload))
}

export async function updateAIPersona(
  id: number,
  payload: UpdateAIPersonaPayload,
): Promise<BotAIPersona> {
  return results(http.put(`/bot/ai/personas/${id}`, payload))
}

export async function deleteAIPersona(id: number): Promise<void> {
  await http.delete(`/bot/ai/personas/${id}`)
}

export async function chatWithAI(payload: AIChatRequest): Promise<AIChatResult> {
  return results(http.post('/bot/ai/chat', payload))
}

export async function listTools(): Promise<BotTool[]> {
  return (await results<BotTool[]>(http.get('/bot/ai/tools'))) ?? []
}

export async function executeTool(payload: ExecuteToolPayload): Promise<ToolResult> {
  return results(http.post('/bot/ai/execute', payload))
}

export async function listLogs(params?: {
  event_type?: string
  status?: string
  group_jid?: string
  search?: string
  limit?: number
  offset?: number
}): Promise<LogsResponse> {
  return results(http.get('/bot/logs', { params }))
}

export async function clearLogs(): Promise<void> {
  await http.delete('/bot/logs')
}
