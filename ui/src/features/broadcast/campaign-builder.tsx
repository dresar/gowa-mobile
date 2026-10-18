import { useState, useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Clock,
  Info,
  Loader2,
  Paperclip,
  RefreshCw,
  Send,
  ShieldAlert,
  Sparkles,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import { createCampaign, getDeviceQuota, type CreateCampaignRequest } from '@/api/broadcast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { InfoHint } from '@/components/ui/info-hint'
import { useDeviceStore } from '@/stores/device'
import { useDevices } from '@/hooks/use-devices'
import { evaluateSpintaxClient, parseVCardContacts, sanitizePhoneList } from './spintax-helper'

interface CampaignBuilderProps {
  initialRecipients?: string
  onSuccessRedirect?: (campaignId: string) => void
}

export function CampaignBuilder({ initialRecipients, onSuccessRedirect }: CampaignBuilderProps) {
  const queryClient = useQueryClient()
  const { selectedDeviceId } = useDeviceStore()
  const { data: devices } = useDevices()

  const [name, setName] = useState('')
  const [deviceId, setDeviceId] = useState(selectedDeviceId || '')
  const [recipientText, setRecipientText] = useState(initialRecipients || '')
  const [messageTemplate, setMessageTemplate] = useState(
    '{Halo|Hai|Selamat pagi} {Kak|Bapak|Ibu} {{name}}, kami memiliki penawaran {spesial|menarik} untuk Anda!',
  )
  const [mediaUrl, setMediaUrl] = useState('')
  const [mediaType, setMediaType] = useState<'image' | 'document'>('image')
  const [filterUnregistered, setFilterUnregistered] = useState(true)
  const [minDelay, setMinDelay] = useState(5)
  const [maxDelay, setMaxDelay] = useState(15)
  const [batchSize, setBatchSize] = useState(25)
  const [batchDelayMin, setBatchDelayMin] = useState(3)
  const [scheduleMode, setScheduleMode] = useState<'now' | 'scheduled'>('now')
  const [scheduledAt, setScheduledAt] = useState('')

  const [spintaxPreview, setSpintaxPreview] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (initialRecipients) {
      setRecipientText(initialRecipients)
    }
  }, [initialRecipients])

  useEffect(() => {
    if (selectedDeviceId && !deviceId) {
      setDeviceId(selectedDeviceId)
    }
  }, [selectedDeviceId, deviceId])

  const { data: quota } = useQuery({
    queryKey: ['broadcast-quota', deviceId],
    queryFn: () => getDeviceQuota(deviceId),
    enabled: Boolean(deviceId),
    refetchInterval: 15000,
  })

  const parsed = sanitizePhoneList(recipientText)
  const recipientCount = parsed.phones.length
  const hourlyCount = quota?.hourly_count ?? 0
  const dailyCount = quota?.daily_count ?? 0
  const hourlyLimit = quota?.hourly_limit ?? 200
  const dailyLimit = quota?.daily_limit ?? 1000
  const projectedHourly = hourlyCount + recipientCount
  const projectedDaily = dailyCount + recipientCount
  const isDailyWarning = projectedDaily > dailyLimit || Boolean(quota?.daily_exceeded)
  const isHourlyWarning = projectedHourly > hourlyLimit || Boolean(quota?.hourly_exceeded)

  const handleInsertPlaceholder = (placeholder: string) => {
    setMessageTemplate((prev) => prev + ' ' + placeholder)
  }

  const handleInsertSpintax = (spintax: string) => {
    setMessageTemplate((prev) => prev + ' ' + spintax)
  }

  const handleTestSpintax = () => {
    const evaluated = evaluateSpintaxClient(messageTemplate)
    const sample = evaluated
      .replace(/{{name}}/g, 'Budi')
      .replace(/{{phone}}/g, '6281234567890')
      .replace(/{{var1}}/g, 'VIP')
      .replace(/{{var2}}/g, 'Diskon 20%')
      .replace(/{{date}}/g, new Date().toISOString().split('T')[0])
      .replace(/{{time}}/g, '14:30')
    setSpintaxPreview(sample)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      const content = evt.target?.result as string
      if (content) {
        if (
          file.name.toLowerCase().endsWith('.vcf') ||
          content.toUpperCase().includes('BEGIN:VCARD')
        ) {
          const contacts = parseVCardContacts(content)
          const lines = contacts
            .map((c) => (c.name ? `${c.phone}, ${c.name}` : c.phone))
            .join('\n')
          setRecipientText((prev) => (prev ? prev + '\n' + lines : lines))
          toast.success(`File VCF ${file.name} berhasil diurai (${contacts.length} kontak)`)
        } else {
          setRecipientText((prev) => (prev ? prev + '\n' + content : content))
          toast.success(`File ${file.name} berhasil dibaca`)
        }
      }
    }
    reader.readAsText(file)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error('Nama kampanye wajib diisi')
      if (!messageTemplate.trim()) throw new Error('Template pesan wajib diisi')
      if (parsed.phones.length === 0) throw new Error('Minimal 1 nomor penerima valid diperlukan')

      const payload: CreateCampaignRequest = {
        name: name.trim(),
        device_id: deviceId || undefined,
        message_template: messageTemplate,
        media_url: mediaUrl.trim() || undefined,
        media_type: mediaUrl.trim() ? mediaType : undefined,
        filter_unregistered: filterUnregistered,
        min_delay: Number(minDelay) || 5,
        max_delay: Number(maxDelay) || 15,
        batch_size: Number(batchSize) || 25,
        batch_delay_min: Number(batchDelayMin) || 3,
        scheduled_at:
          scheduleMode === 'scheduled' && scheduledAt.trim()
            ? new Date(scheduledAt).toISOString()
            : undefined,
        recipients: parsed.phones.map((p) => ({
          phone: p.phone,
          variables: {
            ...(p.name ? { name: p.name } : {}),
            ...(p.var1 ? { var1: p.var1 } : {}),
            ...(p.var2 ? { var2: p.var2 } : {}),
          },
        })),
      }

      return createCampaign(payload, deviceId)
    },
    onSuccess: (data) => {
      toast.success(
        data.status === 'scheduled'
          ? 'Kampanye berhasil dijadwalkan!'
          : 'Kampanye broadcast berhasil diluncurkan!',
      )
      void queryClient.invalidateQueries({ queryKey: ['broadcast-campaigns'] })
      setName('')
      setRecipientText('')
      if (onSuccessRedirect) {
        onSuccessRedirect(data.id)
      }
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Gagal membuat kampanye broadcast')
    },
  })

  return (
    <div className="flex flex-col gap-6 w-full min-w-0">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="border border-border/80 bg-card/60 backdrop-blur-md shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Send className="size-4 text-primary" />
                Informasi & Sasaran Kampanye
              </CardTitle>
              <CardDescription className="text-xs">
                Tentukan nama kampanye dan pilih perangkat pengirim WhatsApp.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="camp-name" className="text-xs font-medium">
                    Nama Kampanye <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="camp-name"
                    placeholder="Contoh: Flash Sale Akhir Bulan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="camp-device" className="text-xs font-medium">
                    Perangkat Pengirim
                  </Label>
                  <Select value={deviceId} onValueChange={setDeviceId}>
                    <SelectTrigger id="camp-device" className="h-9 text-xs">
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
              </div>

              {deviceId && quota && (
                <div className="p-2.5 rounded-lg border border-border/80 bg-muted/30 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {isDailyWarning ? (
                      <Badge variant="destructive" className="text-[11px] py-0.5 px-2 gap-1 font-medium">
                        <ShieldAlert className="size-3" />
                        Peringatan Kuota Harian ({projectedDaily}/{dailyLimit})
                      </Badge>
                    ) : isHourlyWarning ? (
                      <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[11px] py-0.5 px-2 gap-1 font-medium">
                        <ShieldAlert className="size-3" />
                        Peringatan Kuota Jam ({projectedHourly}/{hourlyLimit})
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[11px] py-0.5 px-2 gap-1 font-medium">
                        <Sparkles className="size-3" />
                        Status Kuota Aman
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      Terkirim: <strong className="font-mono text-foreground">{hourlyCount}</strong>/{hourlyLimit}/jam, <strong className="font-mono text-foreground">{dailyCount}</strong>/{dailyLimit}/hari
                    </span>
                  </div>
                  {recipientCount > 0 && (
                    <span className="text-[11px] text-muted-foreground font-mono">
                      Proyeksi: +{recipientCount} penerima
                    </span>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-2 pt-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="camp-recipients" className="text-xs font-medium flex items-center gap-1.5">
                    Daftar Nomor Penerima <span className="text-destructive">*</span>
                    <InfoHint
                      title="Format Masukan Penerima"
                      description="Satu nomor per baris. Mendukung pemisah koma/tab untuk variabel nama dan tambahan."
                      items={[
                        'Format tunggal: 08123456789 atau 628123456789',
                        'Format dengan variabel: 628123456789, Budi, Pelanggan, Diskon20',
                        'Otomatis menormalkan 08xx ke kode negara 62',
                      ]}
                    />
                  </Label>
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.txt,.vcf"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px] gap-1"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="size-3" />
                      Import CSV / TXT / VCF
                    </Button>
                  </div>
                </div>

                <Textarea
                  id="camp-recipients"
                  placeholder="628123456789, Budi&#10;085712345678, Siti&#10;628789012345, Ahmad"
                  value={recipientText}
                  onChange={(e) => setRecipientText(e.target.value)}
                  className="font-mono text-xs min-h-[140px] leading-relaxed"
                />

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Badge variant="outline" className="text-[11px] bg-primary/5 text-primary border-primary/20">
                    Valid: {parsed.phones.length} nomor
                  </Badge>
                  {parsed.duplicates > 0 && (
                    <Badge variant="outline" className="text-[11px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                      {parsed.duplicates} Duplikat dibersihkan
                    </Badge>
                  )}
                  {parsed.invalid > 0 && (
                    <Badge variant="outline" className="text-[11px] bg-destructive/10 text-destructive border-destructive/20">
                      {parsed.invalid} Format tidak valid
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/30">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold flex items-center gap-1.5">
                    Pre-Flight Filter Akun WhatsApp
                    <InfoHint
                      title="Filter Nomor Aktif"
                      description="Memeriksa terlebih dahulu apakah nomor terdaftar di WhatsApp sebelum mengirimkan pesan. Menghindari kegagalan pengiriman beruntun yang memicu flag spam."
                    />
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Lewati nomor yang tidak terdaftar di WhatsApp secara otomatis
                  </span>
                </div>
                <Switch
                  checked={filterUnregistered}
                  onCheckedChange={setFilterUnregistered}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/80 bg-card/60 backdrop-blur-md shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                Template Pesan & Variasi Spintax
              </CardTitle>
              <CardDescription className="text-xs">
                Gunakan Spintax dan placeholder dinamis agar setiap pesan unik dan tidak terdeteksi sebagai spam.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[11px] text-muted-foreground mr-1 self-center">Variabel:</span>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-6 text-[11px] px-2"
                  onClick={() => handleInsertPlaceholder('{{name}}')}
                >
                  + &#123;&#123;name&#125;&#125;
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-6 text-[11px] px-2"
                  onClick={() => handleInsertPlaceholder('{{phone}}')}
                >
                  + &#123;&#123;phone&#125;&#125;
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-6 text-[11px] px-2"
                  onClick={() => handleInsertPlaceholder('{{var1}}')}
                >
                  + &#123;&#123;var1&#125;&#125;
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-6 text-[11px] px-2"
                  onClick={() => handleInsertPlaceholder('{{var2}}')}
                >
                  + &#123;&#123;var2&#125;&#125;
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-6 text-[11px] px-2"
                  onClick={() => handleInsertPlaceholder('{{date}}')}
                >
                  + &#123;&#123;date&#125;&#125;
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-6 text-[11px] px-2"
                  onClick={() => handleInsertPlaceholder('{{time}}')}
                >
                  + &#123;&#123;time&#125;&#125;
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-6 text-[11px] px-2 text-primary border-primary/30"
                  onClick={() => handleInsertSpintax('{Halo|Hai|Selamat pagi}')}
                >
                  + Spintax &#123;A|B|C&#125;
                </Button>
              </div>

              <div className="flex flex-col gap-1.5">
                <Textarea
                  placeholder="Tulis pesan template di sini..."
                  value={messageTemplate}
                  onChange={(e) => setMessageTemplate(e.target.value)}
                  className="font-mono text-xs min-h-[130px] leading-relaxed"
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold flex items-center gap-1.5">
                    Uji Variasi Spintax (Live Preview)
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[11px] gap-1"
                    onClick={handleTestSpintax}
                  >
                    <RefreshCw className="size-3" />
                    Acak Contoh
                  </Button>
                </div>
                {spintaxPreview && (
                  <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 text-xs font-mono leading-relaxed text-foreground break-words">
                    {spintaxPreview}
                  </div>
                )}
              </div>

              <div className="border-t border-border/60 pt-3 flex flex-col gap-3">
                <span className="text-xs font-semibold flex items-center gap-1.5">
                  <Paperclip className="size-3.5 text-muted-foreground" />
                  Lampiran Media (Opsional)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <Input
                      placeholder="URL Gambar atau Dokumen (https://...)"
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div>
                    <Select value={mediaType} onValueChange={(v) => setMediaType(v as 'image' | 'document')}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="image" className="text-xs">Gambar (Image)</SelectItem>
                        <SelectItem value="document" className="text-xs">Dokumen (Document)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="border border-border/80 bg-card/60 backdrop-blur-md shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ShieldAlert className="size-4 text-amber-500" />
                Anti-Ban Protection Engine
              </CardTitle>
              <CardDescription className="text-xs">
                Parameter dispersi delay acak dan jeda burst untuk menyerupai pola interaksi manusia.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="min-delay" className="text-xs font-medium flex items-center gap-1">
                    Min Delay (dtk)
                    <InfoHint
                      title="Jeda Minimal"
                      description="Batas bawah interval acak sebelum mengirim pesan berikutnya."
                    />
                  </Label>
                  <Input
                    id="min-delay"
                    type="number"
                    min={2}
                    max={60}
                    value={minDelay}
                    onChange={(e) => setMinDelay(Number(e.target.value))}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="max-delay" className="text-xs font-medium flex items-center gap-1">
                    Max Delay (dtk)
                    <InfoHint
                      title="Jeda Maksimal"
                      description="Batas atas interval acak. Jitter diterapkan merata antara min dan max delay."
                    />
                  </Label>
                  <Input
                    id="max-delay"
                    type="number"
                    min={3}
                    max={120}
                    value={maxDelay}
                    onChange={(e) => setMaxDelay(Number(e.target.value))}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="batch-size" className="text-xs font-medium flex items-center gap-1">
                    Jeda Tiap (Pesan)
                    <InfoHint
                      title="Ukuran Batch / Burst"
                      description="Sistem akan istirahat otomatis setiap N pesan terkirim untuk memecah pola pengiriman agresif."
                    />
                  </Label>
                  <Input
                    id="batch-size"
                    type="number"
                    min={5}
                    max={100}
                    value={batchSize}
                    onChange={(e) => setBatchSize(Number(e.target.value))}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="batch-min" className="text-xs font-medium flex items-center gap-1">
                    Durasi Jeda (Mnt)
                    <InfoHint
                      title="Durasi Istirahat Batch"
                      description="Lama waktu jeda istirahat (dalam menit) sebelum memulai batch berikutnya."
                    />
                  </Label>
                  <Input
                    id="batch-min"
                    type="number"
                    min={1}
                    max={30}
                    value={batchDelayMin}
                    onChange={(e) => setBatchDelayMin(Number(e.target.value))}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed flex flex-col gap-1.5">
                <div className="font-semibold flex items-center gap-1">
                  <Info className="size-3 text-amber-500" />
                  Rekomendasi Quota & Batas Anti-Ban
                </div>
                <p>
                  Untuk nomor baru, batasi maks 50-100 pesan/hari. Untuk nomor yang telah aktif & memiliki interaksi 2 arah, batas aman adalah maks 200 pesan/jam dan 1000 pesan/hari.
                </p>
                {quota && (
                  <div className="mt-1 pt-2 border-t border-amber-500/20 flex flex-col gap-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Terkirim 1 Jam Terakhir:</span>
                      <span className={`font-mono font-medium ${projectedHourly > hourlyLimit ? 'text-destructive font-bold' : ''}`}>
                        {hourlyCount} / {hourlyLimit} {recipientCount > 0 ? `(+${recipientCount})` : ''}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Terkirim 24 Jam Terakhir:</span>
                      <span className={`font-mono font-medium ${projectedDaily > dailyLimit ? 'text-destructive font-bold' : ''}`}>
                        {dailyCount} / {dailyLimit} {recipientCount > 0 ? `(+${recipientCount})` : ''}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/80 bg-card/60 backdrop-blur-md shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Clock className="size-4 text-primary" />
                Jadwal Pengiriman
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="radio"
                    name="scheduleMode"
                    value="now"
                    checked={scheduleMode === 'now'}
                    onChange={() => setScheduleMode('now')}
                    className="text-primary"
                  />
                  <span>Kirim Langsung Sekarang</span>
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="radio"
                    name="scheduleMode"
                    value="scheduled"
                    checked={scheduleMode === 'scheduled'}
                    onChange={() => setScheduleMode('scheduled')}
                    className="text-primary"
                  />
                  <span>Jadwalkan Waktu Tertentu</span>
                </label>
              </div>

              {scheduleMode === 'scheduled' && (
                <div className="flex flex-col gap-1.5 pt-2">
                  <Label htmlFor="sched-datetime" className="text-xs font-medium">
                    Waktu Eksekusi
                  </Label>
                  <Input
                    id="sched-datetime"
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              )}

              <Button
                type="button"
                className="w-full h-10 mt-2 font-semibold text-xs gap-2"
                disabled={createMutation.isPending || parsed.phones.length === 0}
                onClick={() => createMutation.mutate()}
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Menyimpan Kampanye...
                  </>
                ) : (
                  <>
                    <Send className="size-4" />
                    {scheduleMode === 'scheduled' ? 'Jadwalkan Kampanye' : 'Luncurkan Broadcast Sekarang'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
