import { describe, expect, it } from 'vitest'
import { formatBytes, formatDay, formatDeviceLabel, formatNextRun, isZeroTime } from './format'

describe('isZeroTime', () => {
  it('treats Go zero time, epoch 0, empty, and garbage as zero', () => {
    expect(isZeroTime('0001-01-01T00:00:00Z')).toBe(true)
    expect(isZeroTime('1970-01-01T00:00:00Z')).toBe(true)
    expect(isZeroTime('')).toBe(true)
    expect(isZeroTime(undefined)).toBe(true)
    expect(isZeroTime('not-a-date')).toBe(true)
  })

  it('accepts real timestamps', () => {
    expect(isZeroTime('2026-07-14T06:00:00Z')).toBe(false)
  })
})

describe('formatDay', () => {
  it('passes unparseable input through untouched', () => {
    expect(formatDay('not-a-date')).toBe('not-a-date')
  })

  it('drops the time of day', () => {
    expect(formatDay('2026-07-14T06:00:00Z')).not.toContain(':')
  })
})

describe('formatBytes', () => {
  it('formats zero and negatives as 0 B', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(-5)).toBe('0 B')
  })

  it('formats bytes without decimals when whole', () => {
    expect(formatBytes(500)).toBe('500 B')
    expect(formatBytes(2000)).toBe('2 kB')
  })

  it('scales into MB and GB', () => {
    expect(formatBytes(50_000_000)).toBe('50 MB')
    expect(formatBytes(2_500_000_000)).toBe('2.5 GB')
  })
})

describe('formatDeviceLabel', () => {
  it('returns Device when device is null or undefined', () => {
    expect(formatDeviceLabel(null)).toBe('Perangkat')
    expect(formatDeviceLabel(undefined)).toBe('Perangkat')
  })

  it('uses display_name if available', () => {
    expect(formatDeviceLabel({ id: '12345', display_name: 'Work Phone' })).toBe('Work Phone')
  })

  it('abbreviates long UUIDs to 4...4 characters', () => {
    expect(formatDeviceLabel({ id: '26883318-fd31-4109-b368-c293f76f3964' })).toBe('2688...3964')
  })

  it('keeps short IDs intact', () => {
    expect(formatDeviceLabel({ id: 'device-1' })).toBe('device-1')
  })
})

describe('formatNextRun', () => {
  const baseNow = new Date('2026-10-05T12:00:00.000Z')

  it('handles null, undefined, and zero dates', () => {
    expect(formatNextRun(null, baseNow).relative).toBe('Tidak ada jadwal')
    expect(formatNextRun(undefined, baseNow).relative).toBe('Tidak ada jadwal')
    expect(formatNextRun('0001-01-01T00:00:00Z', baseNow).relative).toBe('Tidak ada jadwal')
  })

  it('formats in 15m for 15 minutes away', () => {
    const in15m = new Date(baseNow.getTime() + 15 * 60_000).toISOString()
    expect(formatNextRun(in15m, baseNow).relative).toBe('15m lagi')
  })

  it('formats due now for less than 1 minute', () => {
    const in30s = new Date(baseNow.getTime() + 30_000).toISOString()
    expect(formatNextRun(in30s, baseNow).relative).toBe('segera')
  })

  it('formats overdue for past times', () => {
    const past10m = new Date(baseNow.getTime() - 10 * 60_000).toISOString()
    expect(formatNextRun(past10m, baseNow).relative).toBe('10m terlambat')

    const past2h = new Date(baseNow.getTime() - 2 * 3600_000).toISOString()
    expect(formatNextRun(past2h, baseNow).relative).toBe('2j terlambat')

    const past3d = new Date(baseNow.getTime() - 72 * 3600_000).toISOString()
    expect(formatNextRun(past3d, baseNow).relative).toBe('3h terlambat')
  })

  it('formats tomorrow for next day', () => {
    const tomorrow = new Date(baseNow)
    tomorrow.setDate(baseNow.getDate() + 1)
    tomorrow.setHours(9, 0, 0, 0)
    const result = formatNextRun(tomorrow.toISOString(), baseNow)
    expect(result.relative).toMatch(/besok pukul 09:00|besok pukul 9:00/)
  })
})

