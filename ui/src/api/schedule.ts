import type { Pagination } from '@/api/types'
import { http, results } from '@/lib/http'

export type ScheduleStatus = 'active' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'

export interface ScheduledSend {
  id: string
  message_type: string
  phone: string
  summary?: string
  status: ScheduleStatus
  scheduled_at: string
  next_run_at?: string
  timezone: string
  recurrence: string
  weekdays?: number[]
  day_of_month?: number
  end_at?: string
  occurrence_limit?: number
  occurrence_count: number
  attempts: number
  last_run_at?: string
  last_message_id?: string
  last_error?: string
  created_at: string
  updated_at: string
}

export interface ScheduleListParams {
  status?: string
  search?: string
  message_type?: string
  limit?: number
  offset?: number
}

export interface ScheduleList {
  data: ScheduledSend[]
  pagination: Pagination
}

export function listSchedules(
  params: ScheduleListParams = {},
  deviceId?: string,
): Promise<ScheduleList> {
  const config = {
    params,
    headers: deviceId ? { 'X-Device-Id': encodeURIComponent(deviceId) } : undefined,
  }
  return results<ScheduleList>(http.get('/send/schedules', config))
}

function action(id: string, name: 'pause' | 'resume' | 'cancel', deviceId?: string): Promise<void> {
  const config = deviceId
    ? { headers: { 'X-Device-Id': encodeURIComponent(deviceId) } }
    : undefined
  return http
    .post(`/send/schedules/${encodeURIComponent(id)}/${name}`, undefined, config)
    .then(() => undefined)
}

export const pauseSchedule = (id: string, deviceId?: string) => action(id, 'pause', deviceId)
export const resumeSchedule = (id: string, deviceId?: string) => action(id, 'resume', deviceId)
export const cancelSchedule = (id: string, deviceId?: string) => action(id, 'cancel', deviceId)
