import { useState } from 'react'
import { TZDate } from '@date-fns/tz'
import { CalendarIcon, InfoIcon, Timer, XIcon } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { ScheduleFields as ScheduleFieldsType } from '@/api/send'
import {
  atTime,
  nextMinute,
  parseIso,
} from '@/features/send/use-schedule-draft'
import { useAppInfo } from '@/hooks/use-app-info'

export type ScheduleDraft = ScheduleFieldsType

const WEEKDAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const ALL_WEEKDAYS = WEEKDAYS.map((_, day) => day)

const SCHEDULE_YEARS_AHEAD = 5
const PERMANENT_TIMEZONE = 'Asia/Jakarta'

const HOURS_24 = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES_60 = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

function endAfter(end: string | undefined, first: string | undefined) {
  return end && first && new Date(end) <= new Date(first) ? undefined : end
}

function DateTimeField({
  id,
  label,
  value,
  onChange,
  min,
  timeZone = PERMANENT_TIMEZONE,
  required,
}: {
  id: string
  label: string
  value: string | undefined
  onChange: (iso: string | undefined) => void
  min: Date
  timeZone?: string
  required?: boolean
}) {
  const [open, setOpen] = useState(false)
  const parsed = parseIso(value)
  const selected = parsed && new TZDate(parsed, timeZone)
  const zonedMin = new TZDate(min, timeZone)

  const selectedHour = selected ? String(selected.getHours()).padStart(2, '0') : '09'
  const selectedMinute = selected ? String(selected.getMinutes()).padStart(2, '0') : '00'

  const pickDay = (day: Date) => {
    const hours = selected ? selected.getHours() : 9
    const minutes = selected ? selected.getMinutes() : 0
    const next = atTime(day, hours, minutes, timeZone)
    onChange((next <= min ? nextMinute(min) : next).toISOString())
    setOpen(false)
  }

  const pickHour = (hourStr: string) => {
    const hours = parseInt(hourStr, 10)
    if (!Number.isFinite(hours)) return
    const minutes = selected ? selected.getMinutes() : 0
    const base = selected ?? zonedMin
    const next = atTime(base, hours, minutes, timeZone)
    onChange((next <= min ? nextMinute(min) : next).toISOString())
  }

  const pickMinute = (minStr: string) => {
    const minutes = parseInt(minStr, 10)
    if (!Number.isFinite(minutes)) return
    const hours = selected ? selected.getHours() : 9
    const base = selected ?? zonedMin
    const next = atTime(base, hours, minutes, timeZone)
    onChange((next <= min ? nextMinute(min) : next).toISOString())
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex flex-wrap items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id={id}
              type="button"
              variant="outline"
              data-empty={!selected}
              className="data-[empty=true]:text-muted-foreground min-w-[140px] flex-1 justify-between font-normal"
            >
              <CalendarIcon data-icon="inline-start" />
              <span className="flex-1 truncate text-left">
                {selected
                  ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeZone }).format(
                      selected,
                    )
                  : 'Pilih tanggal'}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={selected}
              defaultMonth={selected ?? zonedMin}
              captionLayout="dropdown"
              timeZone={timeZone}
              startMonth={zonedMin}
              endMonth={new TZDate(zonedMin.getFullYear() + SCHEDULE_YEARS_AHEAD, 11, 31, timeZone)}
              disabled={{ before: zonedMin }}
              onSelect={(day) => day && pickDay(day)}
            />
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-1 rounded-md border bg-background px-1.5 py-0.5">
          <Select
            value={selected ? selectedHour : undefined}
            onValueChange={pickHour}
            disabled={!selected}
          >
            <SelectTrigger
              className="h-8 w-14 border-0 bg-transparent px-1 font-mono text-xs shadow-none focus:ring-0"
              aria-label="Jam (24 Jam)"
            >
              <SelectValue placeholder="00" />
            </SelectTrigger>
            <SelectContent className="max-h-56">
              {HOURS_24.map((h) => (
                <SelectItem key={h} value={h} className="font-mono text-xs">
                  {h}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="font-mono font-bold text-xs text-muted-foreground">:</span>
          <Select
            value={selected ? selectedMinute : undefined}
            onValueChange={pickMinute}
            disabled={!selected}
          >
            <SelectTrigger
              className="h-8 w-14 border-0 bg-transparent px-1 font-mono text-xs shadow-none focus:ring-0"
              aria-label="Menit"
            >
              <SelectValue placeholder="00" />
            </SelectTrigger>
            <SelectContent className="max-h-56">
              {MINUTES_60.map((m) => (
                <SelectItem key={m} value={m} className="font-mono text-xs">
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-[10px] font-semibold text-muted-foreground px-1">WIB</span>
        </div>

        {!required && selected && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Hapus ${label.toLowerCase()}`}
            onClick={() => onChange(undefined)}
          >
            <XIcon />
          </Button>
        )}
      </div>
    </div>
  )
}

export function ScheduleFields({
  draft,
  patch,
}: {
  draft: ScheduleDraft
  patch: (change: Partial<ScheduleDraft>) => void
}) {
  const { data: info } = useAppInfo()
  const enabled = Boolean(draft.scheduled_at)
  const localTimezone = PERMANENT_TIMEZONE
  const recurrence = draft.recurrence || 'once'
  const now = new Date()
  const firstSend = parseIso(draft.scheduled_at)

  const [customValue, setCustomValue] = useState('')
  const [customUnit, setCustomUnit] = useState<'m' | 'h'>('m')

  if (!info?.scheduled_sends) return null

  const enable = (value: boolean) => {
    if (value) {
      const initial = new Date(Date.now() + 10 * 60_000)
      patch({ scheduled_at: initial.toISOString(), timezone: localTimezone })
    } else {
      patch({
        scheduled_at: undefined,
        recurrence: 'once',
        weekdays: undefined,
        day_of_month: undefined,
        end_at: undefined,
        occurrence_limit: undefined,
        timezone: localTimezone,
      })
    }
  }

  const applyQuickTimer = (minutes: number) => {
    const target = new Date(Date.now() + minutes * 60 * 1000)
    patch({
      scheduled_at: target.toISOString(),
      timezone: localTimezone,
      end_at: endAfter(draft.end_at, target.toISOString()),
    })
  }

  const applyCustomTimer = () => {
    const val = parseInt(customValue, 10)
    if (!isNaN(val) && val > 0) {
      const minutes = customUnit === 'h' ? val * 60 : val
      applyQuickTimer(minutes)
      setCustomValue('')
    }
  }

  const changeRecurrence = (value: ScheduleDraft['recurrence']) => {
    patch({
      recurrence: value,
      weekdays: value === 'weekly' ? draft.weekdays : undefined,
      day_of_month: value === 'monthly' ? draft.day_of_month : undefined,
      end_at: value === 'once' ? undefined : draft.end_at,
      occurrence_limit: value === 'once' ? undefined : draft.occurrence_limit,
      timezone: localTimezone,
    })
  }

  const selectedWeekdays = recurrence === 'daily' ? ALL_WEEKDAYS : (draft.weekdays ?? [])

  const changeWeekdays = (values: string[]) => {
    const days = values.map(Number).sort((a, b) => a - b)
    if (days.length === ALL_WEEKDAYS.length) patch({ recurrence: 'daily', weekdays: undefined })
    else patch({ recurrence: 'weekly', weekdays: days })
  }

  return (
    <div className="bg-muted/30 flex flex-col gap-3 rounded-lg border p-3">
      <div className="flex items-center gap-2">
        <Checkbox
          id="schedule-enabled"
          checked={enabled}
          onCheckedChange={(checked) => enable(checked === true)}
        />
        <Label htmlFor="schedule-enabled" className="font-medium cursor-pointer">
          Jadwalkan atau ulangi
        </Label>
      </div>

      {enabled && (
        <>
          <div className="flex flex-col gap-2 rounded-lg border bg-muted/40 p-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Timer className="size-3.5" />
                <span>Timer Cepat</span>
              </div>
              <span className="text-[11px] text-muted-foreground">Format 24 Jam WIB</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {[
                { label: '+10m', minutes: 10 },
                { label: '+30m', minutes: 30 },
                { label: '+1j', minutes: 60 },
                { label: '+2j', minutes: 120 },
              ].map((preset) => (
                <Button
                  key={preset.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2.5 rounded-md"
                  onClick={() => applyQuickTimer(preset.minutes)}
                >
                  {preset.label}
                </Button>
              ))}

              <div className="flex items-center gap-1.5 sm:ml-auto">
                <Input
                  type="number"
                  min={1}
                  placeholder="Durasi"
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      applyCustomTimer()
                    }
                  }}
                  className="h-7 w-20 text-xs px-2"
                />
                <Select
                  value={customUnit}
                  onValueChange={(u) => setCustomUnit(u as 'm' | 'h')}
                >
                  <SelectTrigger className="h-7 w-20 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="m" className="text-xs">Menit</SelectItem>
                    <SelectItem value="h" className="text-xs">Jam</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  size="sm"
                  className="h-7 text-xs px-2.5 rounded-md"
                  disabled={!customValue || parseInt(customValue, 10) <= 0}
                  onClick={applyCustomTimer}
                >
                  Terapkan
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <DateTimeField
              id="schedule-at"
              label="Waktu kirim"
              value={draft.scheduled_at}
              onChange={(iso) => patch({ scheduled_at: iso, end_at: endAfter(draft.end_at, iso) })}
              min={now}
              timeZone={localTimezone}
              required
            />
            <div className="flex flex-col gap-2">
              <Label>Pengulangan</Label>
              <Select
                value={recurrence}
                onValueChange={(value) => changeRecurrence(value as ScheduleDraft['recurrence'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">Sekali</SelectItem>
                  <SelectItem value="hourly">Setiap Jam</SelectItem>
                  <SelectItem value="every_2_hours">Setiap 2 Jam</SelectItem>
                  <SelectItem value="daily">Harian</SelectItem>
                  <SelectItem value="weekly">Mingguan</SelectItem>
                  <SelectItem value="monthly">Bulanan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {(recurrence === 'daily' || recurrence === 'weekly') && (
            <div className="flex flex-col gap-2">
              <Label>Hari</Label>
              <ToggleGroup
                type="multiple"
                variant="outline"
                size="sm"
                value={selectedWeekdays.map(String)}
                onValueChange={changeWeekdays}
              >
                {WEEKDAYS.map((label, day) => (
                  <ToggleGroupItem key={label} value={String(day)}>
                    {label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          )}

          {recurrence === 'monthly' && (
            <div className="flex flex-col gap-2 sm:max-w-xs">
              <Label htmlFor="schedule-day">Hari per bulan</Label>
              <Input
                id="schedule-day"
                type="number"
                min={1}
                max={31}
                value={draft.day_of_month ?? ''}
                onChange={(event) =>
                  patch({ day_of_month: Number(event.target.value) || undefined })
                }
                required
              />
            </div>
          )}

          {recurrence !== 'once' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <DateTimeField
                id="schedule-end"
                label="Tanggal akhir (opsional)"
                value={draft.end_at}
                onChange={(iso) => patch({ end_at: iso })}
                min={firstSend && firstSend > now ? firstSend : now}
                timeZone={localTimezone}
              />
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="schedule-count">Batas pengulangan</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label="Info batas"
                        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 rounded-full outline-none focus-visible:ring-3"
                      >
                        <InfoIcon className="size-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Hentikan jadwal setelah pengiriman sejumlah ini.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="schedule-count"
                  type="number"
                  min={1}
                  placeholder="Jumlah"
                  value={draft.occurrence_limit ?? ''}
                  onChange={(event) =>
                    patch({ occurrence_limit: Number(event.target.value) || undefined })
                  }
                />
              </div>
            </div>
          )}

          <p className="text-muted-foreground text-xs">
            Waktu otomatis WIB (Asia/Jakarta).
          </p>
        </>
      )}
    </div>
  )
}
