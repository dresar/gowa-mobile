import { useState, useRef, type ChangeEvent } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  FileCode,
  FileSpreadsheet,
  Loader2,
  Trash2,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import { sendText } from '@/api/send'
import type { ScheduledSend } from '@/api/schedule'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

export function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportSchedulesToJson(items: ScheduledSend[]) {
  if (items.length === 0) {
    toast.error('Tidak ada data jadwal untuk diekspor.')
    return
  }
  const exportData = items.map((item) => ({
    phone: item.phone,
    message: item.summary || 'Pesan Terjadwal',
    message_type: item.message_type,
    scheduled_at: item.scheduled_at || item.next_run_at || '',
    recurrence: item.recurrence || 'once',
    timezone: item.timezone || 'Asia/Jakarta',
    status: item.status,
  }))
  const dateStr = new Date().toISOString().slice(0, 10)
  downloadBlob(
    JSON.stringify(exportData, null, 2),
    `jadwal-pesan-${dateStr}.json`,
    'application/json',
  )
  toast.success(`${items.length} jadwal berhasil diekspor ke JSON`)
}

export function exportSchedulesToCsv(items: ScheduledSend[]) {
  if (items.length === 0) {
    toast.error('Tidak ada data jadwal untuk diekspor.')
    return
  }
  const headers = ['phone', 'message', 'type', 'scheduled_at', 'recurrence', 'timezone', 'status']
  const escapeCsv = (val: unknown) => {
    const s = String(val ?? '').replace(/"/g, '""')
    return `"${s}"`
  }
  const rows = items.map((item) =>
    [
      escapeCsv(item.phone),
      escapeCsv(item.summary || 'Pesan Terjadwal'),
      escapeCsv(item.message_type || 'text'),
      escapeCsv(item.scheduled_at || item.next_run_at || ''),
      escapeCsv(item.recurrence || 'once'),
      escapeCsv(item.timezone || 'Asia/Jakarta'),
      escapeCsv(item.status),
    ].join(','),
  )
  const csvContent = [headers.join(','), ...rows].join('\r\n')
  const dateStr = new Date().toISOString().slice(0, 10)
  downloadBlob(csvContent, `jadwal-pesan-${dateStr}.csv`, 'text/csv')
  toast.success(`${items.length} jadwal berhasil diekspor ke CSV`)
}

export function downloadScheduleCsvTemplate() {
  const content = [
    'phone,message,scheduled_at,recurrence,timezone',
    '628123456789,"Halo! Ini contoh pengingat terjadwal otomatis.",2026-10-15 09:00,once,Asia/Jakarta',
    '628987654321,"Laporan harian otomatis WhatsApp.",2026-10-15 17:00,daily,Asia/Jakarta',
  ].join('\r\n')
  downloadBlob(content, 'template-jadwal-pesan.csv', 'text/csv')
  toast.success('Templat CSV berhasil diunduh')
}

export function downloadScheduleJsonTemplate() {
  const sample = [
    {
      phone: '628123456789',
      message: 'Halo! Ini contoh pengingat terjadwal otomatis.',
      scheduled_at: '2026-10-15T09:00:00',
      recurrence: 'once',
      timezone: 'Asia/Jakarta',
    },
    {
      phone: '628987654321',
      message: 'Laporan harian otomatis WhatsApp.',
      scheduled_at: '2026-10-15T17:00:00',
      recurrence: 'daily',
      timezone: 'Asia/Jakarta',
    },
  ]
  downloadBlob(
    JSON.stringify(sample, null, 2),
    'template-jadwal-pesan.json',
    'application/json',
  )
  toast.success('Templat JSON berhasil diunduh')
}

export interface ParsedScheduleItem {
  phone: string
  message: string
  scheduled_at: string
  recurrence?: 'once' | 'hourly' | 'every_2_hours' | 'daily' | 'weekly' | 'monthly'
  timezone?: string
  isValid: boolean
  error?: string
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length < 2) return []
  const separator = lines[0].includes(';') && !lines[0].includes(',') ? ';' : ','

  const parseLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === separator && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }

  const rawHeaders = parseLine(lines[0])
  const headers = rawHeaders.map((h) =>
    h.toLowerCase().replace(/[^a-z0-9_]/g, ''),
  )

  const items: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i])
    if (values.every((v) => !v)) continue
    const obj: Record<string, string> = {}
    headers.forEach((h, idx) => {
      obj[h] = values[idx] ?? ''
    })
    items.push(obj)
  }
  return items
}

function cleanPhone(raw: string): string {
  let cleaned = raw.replace(/[^\d]/g, '')
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1)
  }
  return cleaned
}

function formatScheduleDateTime(raw: string): string {
  if (!raw) return ''
  const trimmed = raw.trim()
  if (trimmed.includes('T')) {
    return trimmed
  }
  const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2}(?::\d{2})?)$/)
  if (match) {
    const date = match[1]
    let time = match[2]
    if (time.length === 5) time += ':00'
    return `${date}T${time}`
  }
  return trimmed
}

function validateAndNormalize(rawItems: Record<string, unknown>[]): ParsedScheduleItem[] {
  return rawItems.map((item) => {
    const phoneRaw = String(item.phone || item.nomor || item.no_wa || item.recipient || '')
    const phone = cleanPhone(phoneRaw)
    const message = String(item.message || item.pesan || item.text || item.summary || '').trim()
    const scheduledRaw = String(item.scheduled_at || item.waktu || item.jadwal || item.send_at || '')
    const scheduled_at = formatScheduleDateTime(scheduledRaw)
    const rawRecurrence = String(item.recurrence || item.ulang || 'once').toLowerCase().trim()
    const allowedRecurrence = ['once', 'hourly', 'every_2_hours', 'daily', 'weekly', 'monthly']
    const recurrence = (
      allowedRecurrence.includes(rawRecurrence) ? rawRecurrence : 'once'
    ) as ParsedScheduleItem['recurrence']
    const timezone = String(item.timezone || item.zona_waktu || 'Asia/Jakarta').trim()

    let error = ''
    if (!phone || phone.length < 8) {
      error = 'Nomor telepon tidak valid (minimal 8 digit).'
    } else if (!message) {
      error = 'Isi pesan tidak boleh kosong.'
    } else if (!scheduled_at) {
      error = 'Waktu pengiriman wajib diisi (format YYYY-MM-DD HH:mm).'
    }

    return {
      phone,
      message,
      scheduled_at,
      recurrence,
      timezone,
      isValid: !error,
      error,
    }
  })
}

export function ImportScheduleDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const [activeTab, setActiveTab] = useState<'file' | 'paste'>('file')
  const [pasteText, setPasteText] = useState('')
  const [parsedItems, setParsedItems] = useState<ParsedScheduleItem[]>([])
  const [fileName, setFileName] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedCount, setProcessedCount] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = String(event.target?.result || '')
      processRawContent(content, file.name.endsWith('.json'))
    }
    reader.readAsText(file)
  }

  const processRawContent = (content: string, isJson: boolean) => {
    try {
      let rawList: Record<string, unknown>[] = []
      const trimmed = content.trim()
      if (isJson || trimmed.startsWith('[') || trimmed.startsWith('{')) {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) {
          rawList = parsed
        } else if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed.schedules)) rawList = parsed.schedules
          else if (Array.isArray(parsed.data)) rawList = parsed.data
        }
      } else {
        rawList = parseCsv(trimmed)
      }
      const validated = validateAndNormalize(rawList)
      setParsedItems(validated)
      if (validated.length === 0) {
        toast.error('Tidak ada baris jadwal yang terbaca.')
      } else {
        const validCount = validated.filter((v) => v.isValid).length
        toast.info(`Berhasil membaca ${validated.length} jadwal (${validCount} valid).`)
      }
    } catch (err: unknown) {
      toast.error('Gagal membaca data: ' + (err instanceof Error ? err.message : 'Format tidak sesuai'))
      setParsedItems([])
    }
  }

  const handlePasteProcess = () => {
    if (!pasteText.trim()) return
    processRawContent(pasteText, pasteText.trim().startsWith('[') || pasteText.trim().startsWith('{'))
  }

  const handleReset = () => {
    setParsedItems([])
    setFileName('')
    setPasteText('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const validItems = parsedItems.filter((i) => i.isValid)

  const handleExecuteImport = async () => {
    if (validItems.length === 0) return
    setIsProcessing(true)
    setProcessedCount(0)

    let successCount = 0
    let failCount = 0

    for (let i = 0; i < validItems.length; i++) {
      const item = validItems[i]
      try {
        await sendText({
          phone: item.phone,
          message: item.message,
          scheduled_at: item.scheduled_at,
          recurrence: item.recurrence,
          timezone: item.timezone,
        })
        successCount++
      } catch {
        failCount++
      }
      setProcessedCount(i + 1)
    }

    setIsProcessing(false)
    if (successCount > 0) {
      toast.success(`Berhasil mengimpor ${successCount} pesan terjadwal!${failCount > 0 ? ` (${failCount} gagal)` : ''}`)
      handleReset()
      onOpenChange(false)
      onSuccess()
    } else {
      toast.error('Gagal mengimpor jadwal. Periksa format dan status koneksi perangkat.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Impor Jadwal Pesan</DialogTitle>
          <DialogDescription>
            Unggah berkas CSV atau JSON untuk menjadwalkan banyak pesan sekaligus.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg border bg-muted/20">
            <span className="text-xs text-muted-foreground font-medium">Contoh format berkas:</span>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={downloadScheduleCsvTemplate}
                className="h-7 text-xs px-2.5 rounded-[5px] gap-1"
              >
                <FileSpreadsheet className="size-3 text-emerald-500" />
                <span>Templat CSV</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={downloadScheduleJsonTemplate}
                className="h-7 text-xs px-2.5 rounded-[5px] gap-1"
              >
                <FileCode className="size-3 text-cyan-500" />
                <span>Templat JSON</span>
              </Button>
            </div>
          </div>

          {parsedItems.length === 0 ? (
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as 'file' | 'paste')}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 w-full h-9">
                <TabsTrigger value="file" className="text-xs font-semibold">
                  Unggah Berkas
                </TabsTrigger>
                <TabsTrigger value="paste" className="text-xs font-semibold">
                  Tempel Teks (Paste)
                </TabsTrigger>
              </TabsList>

              <TabsContent value="file" className="pt-3">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center border-2 border-dashed border-border/80 rounded-xl p-8 hover:bg-muted/30 hover:border-primary/50 cursor-pointer transition-all"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.json,text/csv,application/json"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <Upload className="size-8 text-primary mb-2" />
                  <p className="text-xs font-semibold text-foreground">
                    Klik untuk memilih berkas CSV atau JSON
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Mendukung format CSV (koma / titik-koma) dan JSON
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="paste" className="pt-3 flex flex-col gap-2.5">
                <Textarea
                  placeholder='Tempel data CSV atau JSON di sini, contoh:&#10;phone,message,scheduled_at,recurrence&#10;628123456789,"Halo dunia",2026-10-15 10:00,once'
                  rows={6}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  className="font-mono text-xs"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handlePasteProcess}
                  disabled={!pasteText.trim()}
                  className="self-end h-8 text-xs font-semibold rounded-lg"
                >
                  Proses Data
                </Button>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-semibold">
                    Total: {parsedItems.length}
                  </Badge>
                  <Badge variant="emerald" className="text-xs font-semibold">
                    Valid: {validItems.length}
                  </Badge>
                  {parsedItems.length - validItems.length > 0 && (
                    <Badge variant="destructive" className="text-xs font-semibold">
                      Invalid: {parsedItems.length - validItems.length}
                    </Badge>
                  )}
                  {fileName && (
                    <span className="text-[11px] font-mono text-muted-foreground truncate max-w-32">
                      {fileName}
                    </span>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="h-7 text-xs text-muted-foreground hover:text-destructive gap-1 px-2"
                >
                  <Trash2 className="size-3" />
                  <span>Ulangi</span>
                </Button>
              </div>

              <div className="max-h-60 overflow-y-auto rounded-lg border border-border/60 divide-y divide-border/40 text-xs">
                {parsedItems.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 flex items-start justify-between gap-3 ${
                      item.isValid ? 'bg-card/50' : 'bg-destructive/10'
                    }`}
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      {item.isValid ? (
                        <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="size-3.5 text-destructive shrink-0 mt-0.5" />
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-foreground font-mono">
                          {item.phone || '(Nomor Kosong)'}
                        </span>
                        <span className="text-muted-foreground truncate max-w-sm">
                          {item.message || '(Pesan Kosong)'}
                        </span>
                        {item.error && (
                          <span className="text-[11px] text-destructive font-medium mt-0.5">
                            {item.error}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0 text-[11px] font-mono text-muted-foreground">
                      <span>{item.scheduled_at || '-'}</span>
                      <span className="capitalize">{item.recurrence}</span>
                    </div>
                  </div>
                ))}
              </div>

              {isProcessing && (
                <div className="flex flex-col gap-1.5 p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span>Sedang menjadwalkan pesan...</span>
                    <span>
                      {processedCount} / {validItems.length}
                    </span>
                  </div>
                  <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-200"
                      style={{
                        width: `${(processedCount / Math.max(1, validItems.length)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            disabled={isProcessing}
            onClick={() => {
              handleReset()
              onOpenChange(false)
            }}
          >
            Batal
          </Button>
          {parsedItems.length > 0 && (
            <Button
              type="button"
              disabled={isProcessing || validItems.length === 0}
              onClick={handleExecuteImport}
              className="gap-1.5"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <Upload className="size-3.5" />
                  <span>Jadwalkan {validItems.length} Pesan</span>
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
