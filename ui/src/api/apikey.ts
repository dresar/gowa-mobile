import { http, results } from '@/lib/http'

export interface ApiKeyItem {
  id: string
  name: string
  key_masked: string
  prefix: string
  created_at: string
  expires_at?: string
  last_used_at?: string
  permissions: string[]
}

export interface CreatedApiKey {
  id: string
  name: string
  key: string
  prefix: string
  created_at: string
  expires_at?: string
  permissions: string[]
}

export function listApiKeys(): Promise<ApiKeyItem[]> {
  return results<ApiKeyItem[]>(http.get('/api-keys'))
}

export function createApiKey(payload: {
  name: string
  permissions?: string[]
  expires_in_days?: number
}): Promise<CreatedApiKey> {
  return results<CreatedApiKey>(http.post('/api-keys', payload))
}

export function deleteApiKey(id: string): Promise<{ id: string }> {
  return results<{ id: string }>(http.delete(`/api-keys/${id}`))
}
