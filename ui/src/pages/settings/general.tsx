import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowDownCircle,
  CheckCircle2,
  Clock,
  Download,
  GitBranch,
  GitCommit,
  History,
  Radio,
  RefreshCw,
  RotateCcw,
  Save,
  Smartphone,
  Sparkles,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { InfoHint } from '@/components/ui/info-hint'
import { cn } from '@/lib/utils'
import {
  getAppSettings,
  getSystemVersion,
  syncSystem,
  updateAppSettings,
  type SyncSystemResult,
} from '@/api/settings'

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default function SettingsGeneralPage() {
  const queryClient = useQueryClient()
  const { data: settings, isLoading } = useQuery({
    queryKey: ['app-settings'],
    queryFn: getAppSettings,
  })

  const [autoRejectCall, setAutoRejectCall] = useState(false)
  const [autoMarkRead, setAutoMarkRead] = useState(false)
  const [autoLikeStatus, setAutoLikeStatus] = useState(true)
  const [autoLikeStatusEmoji, setAutoLikeStatusEmoji] = useState('💚')
  const [autoDownloadMedia, setAutoDownloadMedia] = useState(true)
  const [ignoreStatusMedia, setIgnoreStatusMedia] = useState(false)
  const [presencePulseEnabled, setPresencePulseEnabled] = useState(true)
  const [presenceOnConnect, setPresenceOnConnect] = useState('unavailable')
  const [autoReplyMessage, setAutoReplyMessage] = useState('')

  const [syncResult, setSyncResult] = useState<SyncSystemResult | null>(null)
  const [showSyncModal, setShowSyncModal] = useState(false)

  useEffect(() => {
    if (settings) {
      setAutoRejectCall(settings.auto_reject_call ?? false)
      setAutoMarkRead(settings.auto_mark_read ?? false)
      setAutoLikeStatus(settings.auto_like_status ?? true)
      setAutoLikeStatusEmoji(settings.auto_like_status_emoji || '💚')
      setAutoDownloadMedia(settings.auto_download_media ?? true)
      setIgnoreStatusMedia(settings.ignore_status_media ?? false)
      setPresencePulseEnabled(settings.presence_pulse_enabled ?? true)
      setPresenceOnConnect(settings.presence_on_connect || 'unavailable')
      setAutoReplyMessage(settings.auto_reply_message || '')
    }
  }, [settings])

  const { data: versionInfo, refetch: refetchVersion, isFetching: isRefetching } = useQuery({
    queryKey: ['system-version'],
    queryFn: getSystemVersion,
  })

  const syncMutation = useMutation({
    mutationFn: syncSystem,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['system-version'] })
      setSyncResult(data)
      setShowSyncModal(true)
      toast.success(data.latest_commit ? `Sinkronisasi berhasil: ${data.latest_commit}` : 'Sinkronisasi berhasil')
    },
    onError: (err: any) => {
      toast.error('Gagal sinkronisasi: ' + (err?.message || 'Gagal git pull'))
    },
  })

  const mutation = useMutation({
    mutationFn: updateAppSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings'] })
      toast.success('Pengaturan disimpan')
    },
    onError: (err: any) => {
      toast.error('Gagal menyimpan: ' + (err?.message || 'Kesalahan sistem'))
    },
  })

  const handleSave = () => {
    mutation.mutate({
      auto_reject_call: autoRejectCall,
      auto_mark_read: autoMarkRead,
      auto_like_status: autoLikeStatus,
      auto_like_status_emoji: autoLikeStatusEmoji,
      auto_download_media: autoDownloadMedia,
      ignore_status_media: ignoreStatusMedia,
      presence_pulse_enabled: presencePulseEnabled,
      presence_on_connect: presenceOnConnect,
      auto_reply_message: autoReplyMessage.trim(),
    })
  }

  const handleReloadUI = () => {
    window.location.reload()
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    )
  }

  const recentCommits = versionInfo?.recent_commits || []
  const incomingCommits = versionInfo?.incoming_commits || []
  const hasUpdate = Boolean(versionInfo?.has_update || incomingCommits.length > 0)

  return (
    <div className="flex flex-col gap-4">
      <Card className="glass-card rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Radio className="size-4 text-primary" />
            <span>Respons Otomatis</span>
            <InfoHint
              title="Respons Otomatis"
              description="Konfigurasi otomatisasi panggilan dan berkas media."
              items={[
                'Tolak Panggilan: Menolak panggilan suara/video masuk otomatis.',
                'Tandai Dibaca: Mengirim laporan baca saat pesan diterima.',
                'Like Status: Otomatis melihat dan memberi reaksi emoji ke status kontak.',
                'Unduh Media: Mengunduh gambar & berkas ke penyimpanan server.',
                'Abaikan Status: Melewati unduhan status cerita kontak WhatsApp.',
                'Penyegaran Kehadiran: Menjaga sesi koneksi tetap online berkala.',
              ]}
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2.5">
          <div className="border-border/50 bg-muted/20 flex items-center justify-between rounded-lg border p-2.5">
            <Label htmlFor="reject-calls" className="font-medium text-xs">
              Tolak Panggilan Otomatis
            </Label>
            <Switch
              id="reject-calls"
              checked={autoRejectCall}
              onCheckedChange={setAutoRejectCall}
            />
          </div>

          <div className="border-border/50 bg-muted/20 flex items-center justify-between rounded-lg border p-2.5">
            <Label htmlFor="mark-read" className="font-medium text-xs">
              Tandai Dibaca Otomatis
            </Label>
            <Switch
              id="mark-read"
              checked={autoMarkRead}
              onCheckedChange={setAutoMarkRead}
            />
          </div>

          <div className="border-border/50 bg-muted/20 flex items-center justify-between rounded-lg border p-2.5">
            <div className="flex flex-col gap-0.5">
              <Label htmlFor="auto-like-status" className="font-medium text-xs">
                Like & Lihat Status Otomatis
              </Label>
              <span className="text-muted-foreground text-[11px]">
                Otomatis lihat dan sukai cerita WhatsApp kontak yang baru diperbarui.
              </span>
            </div>
            <Switch
              id="auto-like-status"
              checked={autoLikeStatus}
              onCheckedChange={setAutoLikeStatus}
            />
          </div>

          {autoLikeStatus && (
            <div className="border-border/50 bg-muted/20 flex flex-col gap-2 rounded-lg border p-2.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-like-emoji" className="font-medium text-xs">
                  Emoji Reaksi Status
                </Label>
                <span className="text-xs font-semibold">{autoLikeStatusEmoji}</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {['💚', '❤️', '👍', '🔥', '😍', '👏', '✨', '💯'].map((emo) => (
                  <button
                    key={emo}
                    type="button"
                    onClick={() => setAutoLikeStatusEmoji(emo)}
                    className={cn(
                      'flex size-8 items-center justify-center rounded-md border text-sm transition-all',
                      autoLikeStatusEmoji === emo
                        ? 'border-primary bg-primary/20 scale-105 shadow-sm'
                        : 'border-border/40 hover:bg-muted/40'
                    )}
                  >
                    {emo}
                  </button>
                ))}
                <Input
                  id="auto-like-emoji"
                  value={autoLikeStatusEmoji}
                  onChange={(e) => setAutoLikeStatusEmoji(e.target.value)}
                  placeholder="Emoji"
                  className="h-8 w-16 text-center text-xs"
                  maxLength={4}
                />
              </div>
            </div>
          )}

          <div className="border-border/50 bg-muted/20 flex items-center justify-between rounded-lg border p-2.5">
            <Label htmlFor="auto-download" className="font-medium text-xs">
              Unduh Media Otomatis
            </Label>
            <Switch
              id="auto-download"
              checked={autoDownloadMedia}
              onCheckedChange={setAutoDownloadMedia}
            />
          </div>

          <div className="border-border/50 bg-muted/20 flex items-center justify-between rounded-lg border p-2.5">
            <Label htmlFor="ignore-status" className="font-medium text-xs">
              Abaikan Status WhatsApp
            </Label>
            <Switch
              id="ignore-status"
              checked={ignoreStatusMedia}
              onCheckedChange={setIgnoreStatusMedia}
            />
          </div>

          <div className="border-border/50 bg-muted/20 flex items-center justify-between rounded-lg border p-2.5">
            <Label htmlFor="pulse-scheduler" className="font-medium text-xs">
              Penyegaran Kehadiran Berkala
            </Label>
            <Switch
              id="pulse-scheduler"
              checked={presencePulseEnabled}
              onCheckedChange={setPresencePulseEnabled}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">
            Kehadiran & Balasan
          </CardTitle>
          <CardDescription className="text-xs">
            Status koneksi akun dan teks balasan default ke pengirim.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="presence-mode" className="text-xs">
              Status Saat Terhubung
            </Label>
            <Select value={presenceOnConnect} onValueChange={setPresenceOnConnect}>
              <SelectTrigger id="presence-mode" className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Online (Available)</SelectItem>
                <SelectItem value="unavailable">Offline (Unavailable)</SelectItem>
                <SelectItem value="none">Tanpa Status</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="auto-reply-msg" className="text-xs">
              Pesan Balasan Global
            </Label>
            <Input
              id="auto-reply-msg"
              placeholder="Pesan"
              value={autoReplyMessage}
              onChange={(e) => setAutoReplyMessage(e.target.value)}
              className="text-xs"
            />
          </div>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={mutation.isPending}
            className="self-start h-8 text-xs gap-1.5 mt-1 btn-primary-theme"
          >
            <Save className="size-3.5" />
            {mutation.isPending ? 'Menyimpan…' : 'Simpan Perubahan'}
          </Button>
        </CardContent>
      </Card>

      <Card className="glass-card rounded-xl">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Smartphone className="size-4 text-emerald-500" />
                <span>Aplikasi Mobile Android</span>
                <InfoHint
                  title="Aplikasi GoWA Mobile"
                  description="Paket Android APK mandiri tanpa ketergantungan pihak ketiga."
                  items={[
                    'Kompatibel penuh di semua ponsel Android versi 5.0 hingga Android 15.',
                    'Dilengkapi tanda tangan multi-skema v1, v2, dan v3.',
                    'Dapat dipasang langsung (sideload) tanpa Google Play Store.',
                  ]}
                />
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Paket aplikasi Android mandiri dengan WebView ringan dan pengunduh berkas otomatis.
              </CardDescription>
            </div>
            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono">
                v1.1.0
              </Badge>
              <Badge variant="outline" className="text-[10px] font-mono">
                1.04 MB
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="border-border/50 bg-muted/20 flex flex-col gap-1 rounded-lg border p-2.5">
              <span className="text-muted-foreground text-[11px]">Kompatibilitas</span>
              <span className="font-semibold text-foreground text-xs">Android 5.0 – 15</span>
            </div>
            <div className="border-border/50 bg-muted/20 flex flex-col gap-1 rounded-lg border p-2.5">
              <span className="text-muted-foreground text-[11px]">Tanda Tangan</span>
              <span className="font-semibold text-foreground text-xs font-mono">v1, v2, v3 Verified</span>
            </div>
            <div className="border-border/50 bg-muted/20 flex flex-col gap-1 rounded-lg border p-2.5">
              <span className="text-muted-foreground text-[11px]">Ukuran Berkas</span>
              <span className="font-semibold text-foreground text-xs font-mono">1.04 MB</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 pt-1 border-t border-border/40">
            <a
              href="/statics/gowa.apk?v=1.1.0"
              download="gowa.apk"
              className="btn-primary-theme inline-flex items-center gap-2 px-3.5 h-8 text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Download className="size-3.5" />
              <span>Unduh APK Mobile (1.0 MB)</span>
            </a>
            <span className="text-muted-foreground text-[11px]">
              Dapat dipasang langsung di semua tipe ponsel Android.
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card rounded-xl overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <GitBranch className="size-4 text-primary" />
                <span>Pembaruan Sistem</span>
                <InfoHint
                  title="Pembaruan Sistem & GitHub"
                  description="Sinkronisasi kode backend dan frontend langsung dari repositori resmi."
                  items={[
                    'Klik Sinkronkan Sistem untuk menjalankan git pull otomatis di server VPS.',
                    'Gunakan Cek Pembaruan untuk melihat ketersediaan commit baru.',
                    'Gunakan Muat Ulang Tampilan jika frontend baru selesai dipasang.',
                  ]}
                />
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Sinkronkan backend dan bundle UI dari repositori GitHub resmi.
              </CardDescription>
            </div>

            {hasUpdate ? (
              <Badge variant="outline" className="border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] gap-1.5 self-start sm:self-auto py-0.5 px-2.5">
                <ArrowDownCircle className="size-3 animate-bounce" />
                <span>Pembaruan Tersedia di GitHub</span>
              </Badge>
            ) : (
              <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] gap-1.5 self-start sm:self-auto py-0.5 px-2.5">
                <CheckCircle2 className="size-3" />
                <span>Sistem & Frontend Terkini</span>
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-3.5">
          {hasUpdate && incomingCommits.length > 0 && (
            <div className="border border-amber-500/30 bg-amber-500/10 rounded-xl p-3 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                <Sparkles className="size-3.5" />
                <span>Ada {incomingCommits.length} Commit Pembaruan Siap Di-Pull:</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {incomingCommits.map((c) => (
                  <div key={c.hash} className="flex items-center gap-2 text-[11px] bg-background/60 rounded-lg p-2 border border-amber-500/20">
                    <span className="font-mono font-bold text-primary">{c.hash}</span>
                    <span className="text-foreground font-medium flex-1 truncate">{c.message}</span>
                    <span className="text-muted-foreground text-[10px] shrink-0">{c.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            <div className="border-border/50 bg-muted/20 flex flex-col gap-1 rounded-lg border p-2.5">
              <span className="text-muted-foreground text-[11px]">Versi Backend GoWA</span>
              <span className="font-semibold text-foreground font-mono">
                v{versionInfo?.app_version || '9.6.0'}
              </span>
            </div>

            <div className="border-border/50 bg-muted/20 flex flex-col gap-1 rounded-lg border p-2.5">
              <span className="text-muted-foreground text-[11px]">Cabang Git Aktif</span>
              <span className="font-semibold text-foreground font-mono flex items-center gap-1.5">
                <GitBranch className="size-3 text-primary" />
                <span>{versionInfo?.branch || 'main'}</span>
              </span>
            </div>

            <div className="border-border/50 bg-muted/20 flex flex-col gap-1 rounded-lg border p-2.5">
              <span className="text-muted-foreground text-[11px]">Frontend Single-File UI</span>
              <span className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                <span>{formatBytes(versionInfo?.ui_size)}</span>
                <span className="text-muted-foreground text-[10px]">({versionInfo?.ui_last_modified || 'Aktif'})</span>
              </span>
            </div>

            <div className="border-border/50 bg-muted/20 flex flex-col gap-1 rounded-lg border p-2.5 sm:col-span-2 md:col-span-3">
              <span className="text-muted-foreground text-[11px]">Commit Terakhir Diterapkan</span>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 shrink-0">
                  {versionInfo?.commit || '-'}
                </span>
                <span className="text-foreground text-xs font-medium truncate flex-1">
                  {versionInfo?.commit_msg || '-'}
                </span>
                {versionInfo?.commit_date && (
                  <span className="text-muted-foreground text-[10px] shrink-0 font-mono">
                    {versionInfo.commit_date}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/40">
            <Button
              size="sm"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="btn-primary-theme h-8 text-xs gap-1.5 shadow-xs"
            >
              <RefreshCw className={cn('size-3.5', syncMutation.isPending && 'animate-spin')} />
              <span>{syncMutation.isPending ? 'Menyinkronkan…' : 'Sinkronkan Sistem'}</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void refetchVersion()}
              disabled={isRefetching}
              className="h-8 text-xs gap-1.5"
            >
              <RefreshCw className={cn('size-3', isRefetching && 'animate-spin')} />
              <span>Cek Pembaruan</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleReloadUI}
              className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
              title="Muat ulang halaman agar aset antarmuka terbaru langsung aktif di peramban"
            >
              <RotateCcw className="size-3" />
              <span>Muat Ulang UI</span>
            </Button>
          </div>

          <div className="flex flex-col gap-2 pt-2 border-t border-border/40">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <History className="size-3.5 text-primary" />
                <span>Riwayat Pembaruan</span>
              </Label>
              <Badge variant="outline" className="text-[10px] font-mono">
                {recentCommits.length} Terakhir
              </Badge>
            </div>

            <div className="flex flex-col gap-1.5 rounded-xl border border-border/60 bg-muted/10 p-2 sm:p-3 max-h-72 overflow-y-auto">
              {recentCommits.length > 0 ? (
                recentCommits.map((item, idx) => (
                  <div
                    key={item.hash + idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 p-2 rounded-lg border border-border/50 bg-card/60 hover:bg-card/90 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex items-center gap-1 shrink-0">
                        <GitCommit className="size-3 text-muted-foreground" />
                        <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.2 rounded border border-primary/20">
                          {item.hash}
                        </span>
                      </div>
                      <span className="text-foreground text-xs font-medium truncate">
                        {item.message}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto text-[10px] text-muted-foreground shrink-0">
                      {idx === 0 && (
                        <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-[9px] py-0 bg-emerald-500/10">
                          Aktif
                        </Badge>
                      )}
                      {item.author && (
                        <span className="flex items-center gap-1">
                          <User className="size-2.5" />
                          <span>{item.author}</span>
                        </span>
                      )}
                      {item.date && (
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="size-2.5" />
                          <span>{item.date}</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  Belum ada log commit yang dapat dimuat.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showSyncModal} onOpenChange={setShowSyncModal}>
        <DialogContent className="w-full max-w-lg border-border/80 bg-card/95 backdrop-blur-xl sm:rounded-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-5" />
              <span>Sinkronisasi Berhasil Diterapkan</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Kode backend dan file bundle frontend telah disinkronkan ke versi terbaru dari GitHub.
            </DialogDescription>
          </DialogHeader>

          {syncResult && (
            <div className="flex flex-col gap-3 py-2 text-xs">
              <div className="border border-border/70 rounded-lg p-2.5 bg-muted/20 flex flex-col gap-1">
                <span className="text-muted-foreground text-[11px]">Commit Terkini:</span>
                <span className="font-mono text-xs font-bold text-primary">{syncResult.latest_commit}</span>
              </div>

              {syncResult.recent_commits && syncResult.recent_commits.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="font-semibold text-foreground text-xs">Daftar Ringkasan Pembaruan:</span>
                  <div className="flex flex-col gap-1 max-h-48 overflow-y-auto border border-border/60 rounded-lg p-2 bg-background/50">
                    {syncResult.recent_commits.map((c) => (
                      <div key={c.hash} className="flex items-start gap-1.5 text-[11px] py-1 border-b border-border/30 last:border-0">
                        <span className="font-mono font-bold text-primary shrink-0">{c.hash}</span>
                        <span className="text-foreground flex-1 break-words">{c.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Silakan muat ulang antarmuka agar semua perubahan visual dan logika baru langsung aktif di browser Anda.
              </p>
            </div>
          )}

          <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowSyncModal(false)}
              className="h-8 text-xs"
            >
              Tutup
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleReloadUI}
              className="btn-primary-theme h-8 gap-1.5 text-xs shadow-xs"
            >
              <RotateCcw className="size-3.5" />
              <span>Muat Ulang Halaman Sekarang</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
