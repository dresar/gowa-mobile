import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  CheckCircle2,
  Copy,
  Download,
  Loader2,
  PhoneCall,
  Send,
  UserCheck,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { checkWhatsAppBulk, type WhatsAppCheckItem } from '@/api/broadcast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useDeviceStore } from '@/stores/device'
import { useDevices } from '@/hooks/use-devices'
import { cleanPhone, exportToCsv, exportToTxt } from './spintax-helper'

interface NumberCheckerProps {
  initialNumbers?: string
  onSendToBroadcast?: (phones: string) => void
}

export function NumberChecker({ initialNumbers, onSendToBroadcast }: NumberCheckerProps) {
  const { selectedDeviceId } = useDeviceStore()
  const { data: devices } = useDevices()
  const [deviceId, setDeviceId] = useState(selectedDeviceId || '')
  const [rawInput, setRawInput] = useState(initialNumbers || '')
  const [results, setResults] = useState<WhatsAppCheckItem[]>([])
  const [filterValidOnly, setFilterValidOnly] = useState(false)

  useEffect(() => {
    if (selectedDeviceId && !deviceId) {
      setDeviceId(selectedDeviceId)
    }
  }, [selectedDeviceId, deviceId])

  useEffect(() => {
    if (!deviceId && devices && devices.length > 0) {
      setDeviceId(devices[0].id)
    }
  }, [devices, deviceId])

  useEffect(() => {
    if (initialNumbers) {
      setRawInput(initialNumbers)
    }
  }, [initialNumbers])

  const parseInputNumbers = (): string[] => {
    const lines = rawInput.split(/[\r\n,;\t]+/)
    const seen = new Set<string>()
    const out: string[] = []
    for (const line of lines) {
      const p = cleanPhone(line)
      if (p.length >= 8 && !seen.has(p)) {
        seen.add(p)
        out.push(p)
      }
    }
    return out
  }

  const checkMutation = useMutation({
    mutationFn: async () => {
      const phones = parseInputNumbers()
      if (phones.length === 0) {
        throw new Error('Masukkan minimal satu nomor telepon valid untuk diperiksa')
      }
      return checkWhatsAppBulk(phones, deviceId || selectedDeviceId || undefined)
    },
    onSuccess: (data) => {
      setResults(data.results)
      toast.success(
        `Pemeriksaan selesai: ${data.valid_count} dari ${data.total} nomor terdaftar di WhatsApp`,
      )
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Gagal memeriksa status nomor WhatsApp')
    },
  })

  const validNumbers = results.filter((r) => r.is_in_wa)
  const invalidNumbers = results.filter((r) => !r.is_in_wa)
  const displayed = filterValidOnly ? validNumbers : results

  const handleExportCsv = (validOnly = false) => {
    const items = validOnly ? validNumbers : results
    if (items.length === 0) {
      toast.error('Tidak ada data untuk diekspor')
      return
    }
    const headers = ['Nomor Telepon', 'WhatsApp JID', 'Terdaftar di WA']
    const rows = items.map((r) => [r.phone, r.jid || '', r.is_in_wa ? 'Ya' : 'Tidak'])
    exportToCsv(
      validOnly ? 'valid_whatsapp_numbers' : 'whatsapp_check_results',
      headers,
      rows,
    )
    toast.success('Hasil berhasil diekspor ke CSV')
  }

  const handleExportTxt = () => {
    if (validNumbers.length === 0) {
      toast.error('Tidak ada nomor valid untuk diekspor')
      return
    }
    exportToTxt(
      'nomor_valid_wa',
      validNumbers.map((v) => v.phone),
    )
    toast.success('Daftar nomor valid diekspor ke TXT')
  }

  const handleCopyValid = () => {
    if (validNumbers.length === 0) {
      toast.error('Tidak ada nomor valid untuk disalin')
      return
    }
    navigator.clipboard.writeText(validNumbers.map((v) => v.phone).join('\n'))
    toast.success(`${validNumbers.length} nomor valid disalin ke clipboard`)
  }

  const handleTransferToBroadcast = () => {
    if (validNumbers.length === 0) {
      toast.error('Tidak ada nomor valid untuk dikirim ke broadcast')
      return
    }
    const text = validNumbers.map((v) => v.phone).join('\n')
    if (onSendToBroadcast) {
      onSendToBroadcast(text)
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full min-w-0">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 flex flex-col gap-4">
          <Card className="border border-border/80 bg-card/60 backdrop-blur-md shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <UserCheck className="size-4 text-primary" />
                Validasi Kontak Aktif WhatsApp
              </CardTitle>
              <CardDescription className="text-xs">
                Periksa apakah daftar nomor telepon terdaftar sebagai akun WhatsApp aktif menggunakan query protokol resmi.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="checker-device" className="text-xs font-medium">
                  Perangkat Pengirim
                </Label>
                <Select value={deviceId} onValueChange={setDeviceId}>
                  <SelectTrigger id="checker-device" className="h-9 text-xs">
                    <SelectValue placeholder="Pilih perangkat WhatsApp" />
                  </SelectTrigger>
                  <SelectContent>
                    {devices?.map((d) => (
                      <SelectItem key={d.id} value={d.id} className="text-xs">
                        {d.display_name || d.id} {d.phone_number ? `(${d.phone_number})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="checker-input" className="text-xs font-medium">
                  Daftar Nomor Telepon
                </Label>
                <Textarea
                  id="checker-input"
                  placeholder="Tempel nomor telepon di sini (satu per baris atau dipisah koma)...&#10;Contoh:&#10;08123456789&#10;6285712345678&#10;+628789012345"
                  value={rawInput}
                  onChange={(e) => setRawInput(e.target.value)}
                  className="font-mono text-xs min-h-[160px] leading-relaxed"
                />
                <span className="text-[11px] text-muted-foreground">
                  Terdeteksi: {parseInputNumbers().length} nomor unik
                </span>
              </div>

              <Button
                type="button"
                className="w-full h-10 font-semibold text-xs gap-2"
                disabled={checkMutation.isPending || parseInputNumbers().length === 0}
                onClick={() => checkMutation.mutate()}
              >
                {checkMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Memeriksa Kontak di WA...
                  </>
                ) : (
                  <>
                    <PhoneCall className="size-4" />
                    Periksa Status WhatsApp
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {results.length > 0 && (
            <Card className="border border-border/80 bg-card/60 backdrop-blur-md shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Ringkasan Hasil</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 flex flex-col gap-0.5">
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="size-3" /> Terdaftar di WA
                    </span>
                    <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {validNumbers.length}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/5 flex flex-col gap-0.5">
                    <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
                      <XCircle className="size-3" /> Tidak Terdaftar
                    </span>
                    <span className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400">
                      {invalidNumbers.length}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t border-border/60">
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    className="h-8 text-xs gap-1.5 font-semibold"
                    onClick={handleTransferToBroadcast}
                    disabled={validNumbers.length === 0}
                  >
                    <Send className="size-3.5" />
                    Kirim Valid ke Broadcast Builder
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                    onClick={handleCopyValid}
                    disabled={validNumbers.length === 0}
                  >
                    <Copy className="size-3.5" />
                    Salin {validNumbers.length} Nomor Valid
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                    onClick={() => handleExportCsv(true)}
                    disabled={validNumbers.length === 0}
                  >
                    <Download className="size-3.5" />
                    Ekspor Nomor Valid (CSV)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                    onClick={handleExportTxt}
                    disabled={validNumbers.length === 0}
                  >
                    <Download className="size-3.5" />
                    Ekspor Nomor Valid (TXT)
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2 flex flex-col gap-4">
          <Card className="border border-border/80 bg-card/60 backdrop-blur-md shadow-sm h-full flex flex-col">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-semibold">Tabel Hasil Verifikasi</CardTitle>
                  <CardDescription className="text-xs">
                    Status registrasi akun WhatsApp dan format JID resmi.
                  </CardDescription>
                </div>

                {results.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant={filterValidOnly ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 text-[11px]"
                      onClick={() => setFilterValidOnly((prev) => !prev)}
                    >
                      {filterValidOnly ? 'Tampilkan Semua' : 'Hanya Yang Valid'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px] gap-1"
                      onClick={() => handleExportCsv(false)}
                    >
                      <Download className="size-3" />
                      Semua (CSV)
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto max-h-[600px]">
              <Table>
                <TableHeader className="bg-muted/30 sticky top-0">
                  <TableRow className="border-border/60">
                    <TableHead className="text-xs">Nomor Telepon</TableHead>
                    <TableHead className="text-xs">WhatsApp JID</TableHead>
                    <TableHead className="text-xs text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-16 text-xs text-muted-foreground">
                        Tempel nomor telepon di sebelah kiri dan klik &quot;Periksa Status WhatsApp&quot; untuk memulai.
                      </TableCell>
                    </TableRow>
                  ) : displayed.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-12 text-xs text-muted-foreground">
                        Tidak ada data yang sesuai filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayed.map((item, idx) => (
                      <TableRow key={idx} className="border-border/60 hover:bg-muted/30 text-xs">
                        <TableCell className="font-mono font-medium">{item.phone}</TableCell>
                        <TableCell className="font-mono text-muted-foreground">
                          {item.jid || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.is_in_wa ? (
                            <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/30 bg-emerald-500/10 gap-1">
                              <CheckCircle2 className="size-2.5" />
                              Terdaftar
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-rose-500 border-rose-500/30 bg-rose-500/10 gap-1">
                              <XCircle className="size-2.5" />
                              Tidak Ada
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
