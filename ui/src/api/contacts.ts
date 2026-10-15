import { http, results } from '@/lib/http'

export interface SavedContact {
  phone: string
  name: string
  note?: string
  created_at: string
  updated_at: string
}

export interface SaveContactPayload {
  phone: string
  name?: string
  note?: string
}

export function getSavedContacts(): Promise<SavedContact[]> {
  return results<SavedContact[]>(http.get('/app/contacts'))
}

export function saveContact(payload: SaveContactPayload): Promise<SavedContact> {
  return results<SavedContact>(http.post('/app/contacts', payload))
}

export function deleteSavedContact(phone: string): Promise<{ status: string }> {
  return results<{ status: string }>(http.delete(`/app/contacts/${encodeURIComponent(phone)}`))
}
