import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  Check,
  Copy,
  Download,
  Hash,
  Loader2,
  Send,
  Sparkles,
  UserCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { generateNumbers, type GenerateNumbersRequest } from '@/api/broadcast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { exportToCsv, exportToTxt } from './spintax-helper'

const OPERATOR_PRESETS = [
  { label: 'Telkomsel (62812)', prefix: '62812' },
  { label: 'Telkomsel (62821)', prefix: '62821' },
  { label: 'Telkomsel (62852)', prefix: '62852' },
  { label: 'Indosat (62857)', prefix: '62857' },
  { label: 'Indosat (62856)', prefix: '62856' },
  { label: 'Indosat (62815)', prefix: '62815' },
  { label: 'XL Axiata (62878)', prefix: '62878' },
  { label: 'XL Axiata (62817)', prefix: '62817' },
  { label: 'XL Axiata (62819)', prefix: '62819' },
  { label: 'Smartfren (62881)', prefix: '62881' },
  { label: 'Smartfren (62888)', prefix: '62888' },
]

interface NumberGeneratorProps {
  onSendToBroadcast?: (numbers: string) => void
  onVerifyOnWA?: (numbers: string) => void
}

export function NumberGenerator({ onSendToBroadcast, onVerifyOnWA }: NumberGeneratorProps) {
  const [prefix, setPrefix] = useState('62812')
  const [digits, setDigits] = useState(7)
  const [count, setCount] = useState(50)
  const [mode, setMode] = useState<'random' | 'sequential'>('random')
  const [startNumber, setStartNumber] = useState('')
  const [generated, setGenerated] = useState<string[]>([])
  const [copied, setCopied] = useState(false)

  const generateMutation = useMutation({
    mutationFn: async () => {
      const payload: GenerateNumbersRequest = {
        prefix,
        digits: Number(digits) || 7,
        count: Number(count) || 50,
        mode,
        start_number: startNumber.trim() || undefined,
      }
      return generateNumbers(payload)
    },
    onSuccess: (data) => {
      setGenerated(data.numbers)
      toast.success(`${data.count} nomor telepon berhasil digenerate`)
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Gagal generate nomor telepon')
    },
  })

  const handleCopyAll = () => {
    if (generated.length === 0) return
    navigator.clipboard.writeText(generated.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success(`${generated.length} nomor berhasil disalin ke clipboard`)
  }

  const handleExportTxt = () => {
    if (generated.length === 0) return
    exportToTxt(`generated_${prefix}_${count}`, generated)
    toast.success('Daftar nomor berhasil diekspor ke TXT')
  }

  const handleExportCsv = () => {
    if (generated.length === 0) return
    const headers = ['Nomor Telepon']
    const rows = generated.map((n) => [n])
    exportToCsv(`generated_${prefix}_${count}`, headers, rows)
    toast.success('Daftar nomor berhasil diekspor ke CSV')
  }

  const handleTransferToBroadcast = () => {
    if (generated.length === 0) return
    if (onSendToBroadcast) {
      onSendToBroadcast(generated.join('\n'))
    }
  }

  const handleTransferToChecker = () => {
    if (generated.length === 0) return
    if (onVerifyOnWA) {
      onVerifyOnWA(generated.join('\n'))
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full min-w-0">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 flex flex-col gap-4">
          <Card className="border border-border/80 bg-card/60 backdrop-blur-md shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Hash className="size-4 text-primary" />
                Generator Nomor Telepon
              </CardTitle>
              <CardDescription className="text-xs">
                Buat daftar nomor telepon acak atau berurutan berdasarkan awalan operator Indonesia atau kustom.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label className="text-xs font-medium">Pilihan Awalan Operator (Prefix)</Label>
                <div className="flex flex-wrap gap-1.5">
                  {OPERATOR_PRESETS.map((op) => (
                    <Button
                      key={op.prefix}
                      type="button"
                      variant={prefix === op.prefix ? 'default' : 'outline'}
                      size="sm"
                      className="h-6 text-[11px] px-2"
                      onClick={() => setPrefix(op.prefix)}
                    >
                      {op.prefix}
                    </Button>
                  ))}
                </div>
                <Input
                  placeholder="Awalan Kustom (contoh: 62812)"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  className="h-9 text-xs mt-1 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="gen-digits" className="text-xs font-medium">
                    Jumlah Digit Akhir
                  </Label>
                  <Select value={String(digits)} onValueChange={(v) => setDigits(Number(v))}>
                    <SelectTrigger id="gen-digits" className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6" className="text-xs">6 Digit (11 Digit)</SelectItem>
                      <SelectItem value="7" className="text-xs">7 Digit (12 Digit)</SelectItem>
                      <SelectItem value="8" className="text-xs">8 Digit (13 Digit)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="gen-count" className="text-xs font-medium">
                    Total Dibuat
                  </Label>
                  <Select value={String(count)} onValueChange={(v) => setCount(Number(v))}>
                    <SelectTrigger id="gen-count" className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25" className="text-xs">25 Nomor</SelectItem>
                      <SelectItem value="50" className="text-xs">50 Nomor</SelectItem>
                      <SelectItem value="100" className="text-xs">100 Nomor</SelectItem>
                      <SelectItem value="250" className="text-xs">250 Nomor</SelectItem>
                      <SelectItem value="500" className="text-xs">500 Nomor</SelectItem>
                      <SelectItem value="1000" className="text-xs">1.000 Nomor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <Label className="text-xs font-medium">Metode Pembuatan</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={mode === 'random' ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 text-xs font-medium"
                    onClick={() => setMode('random')}
                  >
                    Acak (Random)
                  </Button>
                  <Button
                    type="button"
                    variant={mode === 'sequential' ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 text-xs font-medium"
                    onClick={() => setMode('sequential')}
                  >
                    Berurutan (Seq)
                  </Button>
                </div>
              </div>

              {mode === 'sequential' && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="start-num" className="text-xs font-medium">
                    Nomor Awal (Start Range)
                  </Label>
                  <Input
                    id="start-num"
                    placeholder={`Contoh: ${prefix}0000001`}
                    value={startNumber}
                    onChange={(e) => setStartNumber(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>
              )}

              <Button
                type="button"
                className="w-full h-10 font-semibold text-xs gap-2 mt-2"
                disabled={generateMutation.isPending || !prefix.trim()}
                onClick={() => generateMutation.mutate()}
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Membuat Nomor...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Generate Daftar Nomor
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-4">
          <Card className="border border-border/80 bg-card/60 backdrop-blur-md shadow-sm h-full flex flex-col">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-semibold">Hasil Generate Nomor</CardTitle>
                  <CardDescription className="text-xs">
                    {generated.length > 0
                      ? `${generated.length} nomor berhasil dibuat dan siap digunakan.`
                      : 'Pilih parameter di sebelah kiri lalu klik "Generate Daftar Nomor".'}
                  </CardDescription>
                </div>

                {generated.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px] gap-1"
                      onClick={handleCopyAll}
                    >
                      {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                      Salin
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px] gap-1"
                      onClick={handleExportTxt}
                    >
                      <Download className="size-3" />
                      TXT
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px] gap-1"
                      onClick={handleExportCsv}
                    >
                      <Download className="size-3" />
                      CSV
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4 flex-1 flex flex-col gap-4">
              {generated.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground gap-2">
                  <Hash className="size-10 stroke-[1.2] opacity-40" />
                  <p className="text-xs">Daftar nomor yang digenerate akan tampil di sini.</p>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg border border-primary/20 bg-primary/5">
                    <span className="text-xs font-semibold text-foreground">
                      Tindakan Cepat:
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        className="h-8 text-xs gap-1.5 font-semibold"
                        onClick={handleTransferToBroadcast}
                      >
                        <Send className="size-3.5" />
                        Kirim ke Broadcast Builder
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1.5"
                        onClick={handleTransferToChecker}
                      >
                        <UserCheck className="size-3.5" />
                        Periksa di Cek Nomor WA
                      </Button>
                    </div>
                  </div>

                  <div className="flex-1 max-h-[480px] overflow-y-auto border border-border/60 rounded-lg p-3 bg-muted/20 font-mono text-xs leading-relaxed grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {generated.map((num, idx) => (
                      <div
                        key={idx}
                        className="p-1.5 px-2.5 rounded border border-border/40 bg-background/50 flex items-center justify-between text-xs"
                      >
                        <span>{num}</span>
                        <span className="text-[10px] text-muted-foreground">{idx + 1}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
