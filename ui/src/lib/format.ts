export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'kB', 'MB', 'GB']
  const power = Math.min(Math.floor(Math.log10(bytes) / 3), units.length - 1)
  const value = bytes / 1000 ** power
  return `${value % 1 === 0 ? value : value.toFixed(1)} ${units[power]}`
}

const dateFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

/**
 * True for missing/zero timestamps: gowa stores Go's zero time
 * (0001-01-01) on chat rows created from contact sync before any
 * message exists, and epoch 0 is equally meaningless to display.
 */
export function isZeroTime(iso: string | null | undefined): boolean {
  if (!iso) return true
  const millis = new Date(iso).getTime()
  return Number.isNaN(millis) || millis <= 0
}

export function formatDate(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? iso : dateFormat.format(date)
}

const dayFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })

/** Calendar date only, for metadata where the time of day adds nothing. */
export function formatDay(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? iso : dayFormat.format(date)
}

/** Formats a device label concisely, abbreviating long UUIDs to 'xxxx...xxxx'. */
export function formatDeviceLabel(
  device?: { id: string; display_name?: string } | null,
): string {
  if (!device) return 'Perangkat'
  if (device.display_name && device.display_name.trim().length > 0) {
    return device.display_name.trim()
  }
  const id = device.id
  if (id.length > 13) {
    return `${id.slice(0, 4)}...${id.slice(-4)}`
  }
  return id
}

export function formatNextRun(
  iso: string | null | undefined,
  baseNow?: Date,
): { relative: string; absolute: string } {
  if (!iso || isZeroTime(iso)) {
    return { relative: 'Tidak ada jadwal', absolute: '' }
  }
  const target = new Date(iso)
  if (Number.isNaN(target.getTime())) {
    return { relative: 'Tanggal tidak valid', absolute: iso }
  }
  const now = baseNow ?? new Date()
  const diffMs = target.getTime() - now.getTime()
  const diffSec = Math.round(diffMs / 1000)
  const diffMin = Math.round(diffSec / 60)
  const diffHours = Math.round(diffMin / 60)

  const hours = String(target.getHours()).padStart(2, '0')
  const minutes = String(target.getMinutes()).padStart(2, '0')
  const timeStr = `${hours}:${minutes}`

  const isToday =
    target.getDate() === now.getDate() &&
    target.getMonth() === now.getMonth() &&
    target.getFullYear() === now.getFullYear()

  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  const isTomorrow =
    target.getDate() === tomorrow.getDate() &&
    target.getMonth() === tomorrow.getMonth() &&
    target.getFullYear() === tomorrow.getFullYear()

  let relative = ''
  if (diffMs < -60_000) {
    const pastMin = Math.abs(diffMin)
    if (pastMin < 60) {
      relative = `${pastMin}m terlambat`
    } else if (Math.abs(diffHours) < 24) {
      relative = `${Math.abs(diffHours)}j terlambat`
    } else {
      const pastDays = Math.round(Math.abs(diffHours) / 24)
      relative = `${pastDays}h terlambat`
    }
  } else if (diffMs < 60_000) {
    relative = 'segera'
  } else if (diffMin < 60) {
    relative = `${diffMin}m lagi`
  } else if (isToday) {
    relative = `hari ini pukul ${timeStr}`
  } else if (isTomorrow) {
    relative = `besok pukul ${timeStr}`
  } else {
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    if (diffDays <= 6) {
      const weekday = new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(target)
      relative = `${weekday} pukul ${timeStr}`
    } else {
      relative = `${diffDays}h lagi`
    }
  }

  return {
    relative,
    absolute: formatDate(iso),
  }
}
