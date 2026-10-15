import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowDownCircle,
  Bell,
  CheckCircle2,
  Clock,
  FileArchive,
  GitBranch,
  GitCommit,
  History,
  Monitor,
  Package,
  Radio,
  RefreshCw,
  RotateCcw,
  Save,
  Smartphone,
  Sparkles,
  User,
  Volume2,
} from 'lucide-react'
import { toast } from 'sonner'
import { DownloadDialog } from '@/components/layout/download-dialog'
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
  const [showDownloadModal, setShowDownloadModal] = useState(false)

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
      const isAlreadyLatest = Boolean(
        data.already_up_to_date ||
        data.has_new_update === false ||
        data.output?.toLowerCase().includes('already up to date')
      )

      if (isAlreadyLatest) {
        setShowSyncModal(false)
        toast.info('Sistem sudah menggunakan versi terbaru')
      } else {
        setSyncResult(data)
        setShowSyncModal(true)
        toast.success(data.latest_commit ? `Pembaruan berhasil diterapkan: ${data.latest_commit}` : 'Pembaruan berhasil diterapkan')
      }
    },
    onError: (err: any) => {
      toast.error('Gagal sinkronisasi: ' + (err?.message || 'Gagal git pull'))
    },
  })

  const handleCheckUpdateManual = async () => {
    toast.info('Memeriksa pembaruan di GitHub...')
    try {
      const res = await refetchVersion()
      const latest = res.data
      const hasIncoming = Boolean(latest?.has_update || (latest?.incoming_commits && latest.incoming_commits.length > 0))
      if (hasIncoming) {
        const count = latest?.incoming_commits?.length || 1
        toast.success(`Ada pembaruan baru di GitHub (${count} commit baru siap disinkronkan)`)
      } else {
        toast.info('Sistem sudah menggunakan versi terbaru (tidak ada pembaruan)')
      }
    } catch {
      toast.error('Gagal memeriksa pembaruan')
    }
  }

  const handleSync = () => {
    if (!hasUpdate) {
      toast.info('Sistem sudah menggunakan versi terbaru')
      return
    }
    syncMutation.mutate()
  }

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

  const checkNotifPermissionText = () => {
    const mobile = (window as any).GoWAMobile || (window as any).Android
    if (mobile) {
      if (typeof mobile.hasNotificationPermission === 'function') {
        const allowed = mobile.hasNotificationPermission()
        return allowed ? (
          <span className="text-emerald-500 flex items-center gap-1">
            <CheckCircle2 className="size-3.5" /> Diizinkan di Android
          </span>
        ) : (
          <span className="text-amber-500 flex items-center gap-1">Belum Diizinkan</span>
        )
      }
      return (
        <span className="text-emerald-500 flex items-center gap-1">
          <CheckCircle2 className="size-3.5" /> Aktif di Android
        </span>
      )
    }
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        return (
          <span className="text-emerald-500 flex items-center gap-1">
            <CheckCircle2 className="size-3.5" /> Diizinkan (Aktif)
          </span>
        )
      }
      if (Notification.permission === 'denied') {
        return <span className="text-rose-500 flex items-center gap-1">Diblokir oleh Browser</span>
      }
      return <span className="text-amber-500 flex items-center gap-1">Menunggu Izin</span>
    }
    return <span className="text-muted-foreground">Tidak Didukung</span>
  }

  const handleTestNotification = () => {
    const mobile = (window as any).GoWAMobile || (window as any).Android
    if (mobile && typeof mobile.showNotification === 'function') {
      try {
        mobile.showNotification(
          'GoWA Tes Notifikasi',
          'Notifikasi pesan masuk personal berhasil aktif dengan suara & getar!',
          'test_notif'
        )
        if (typeof mobile.vibrate === 'function') {
          mobile.vibrate(250)
        }
        toast.success('Notifikasi tes berhasil dikirim ke layar!')
        return
      } catch (err) {
        console.error('Error invoking mobile showNotification', err)
      }
    }

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification('GoWA Tes Notifikasi', {
            body: 'Notifikasi browser GoWA aktif dan berfungsi!',
            tag: 'test_notif',
          })
          toast.success('Notifikasi tes berhasil ditampilkan!')
        } catch (e: any) {
          toast.error('Gagal menampilkan notifikasi: ' + e?.message)
        }
      } else {
        Notification.requestPermission().then((perm) => {
          if (perm === 'granted') {
            new Notification('GoWA Tes Notifikasi', {
              body: 'Notifikasi browser GoWA aktif dan berfungsi!',
              tag: 'test_notif',
            })
            toast.success('Izin berhasil diaktifkan & notifikasi tes dikirim!')
          } else {
            toast.error('Izin notifikasi belum diaktifkan di browser!')
          }
        })
      }
    } else {
      toast.error('Perangkat ini tidak mendukung Web Notification API')
    }
  }

  const handleRequestPermission = () => {
    const mobile = (window as any).GoWAMobile || (window as any).Android
    if (mobile?.requestNotificationPermission) {
      mobile.requestNotificationPermission()
      toast.info('Meminta izin notifikasi ke sistem Android...')
      return
    }
    if (typeof window !== 'undefined' && 'Notification' in window) {
      Notification.requestPermission().then((perm) => {
        if (perm === 'granted') {
          toast.success('Izin notifikasi berhasil diberikan!')
        } else {
          toast.error('Izin notifikasi ditolak!')
        }
      })
    } else {
      toast.info('Izin notifikasi tidak tersedia di platform ini')
    }
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
                <Bell className="size-4 text-primary" />
                <span>Notifikasi & Getar Real-time</span>
                <InfoHint
                  title="Notifikasi Masuk GoWA"
                  description="Pengaturan dan verifikasi notifikasi instan untuk pesan personal WhatsApp."
                  items={[
                    'Notifikasi heads-up langsung berbunyi dan bergetar ketika ada chat masuk personal.',
                    'Pesan grup, status/cerita WA, dan siaran otomatis disaring tanpa notifikasi untuk mencegah spam.',
                    'Gunakan tombol "Tes Notifikasi" untuk menguji apakah sistem Android/browser Anda berhasil membunyikan notifikasi.',
                  ]}
                />
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Uji langsung dering, getaran, dan status izin notifikasi di perangkat ini.
              </CardDescription>
            </div>
            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono">
                Heads-up Audio v2
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="border-border/50 bg-muted/20 flex flex-col gap-1 rounded-lg border p-2.5">
              <span className="text-muted-foreground text-[11px]">Mode Perangkat</span>
              <span className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                {(window as any).GoWAMobile || (window as any).Android ? (
                  <>
                    <Smartphone className="size-3.5 text-emerald-500" />
                    <span>Android Native App (GoWA Mobile v1.1.6)</span>
                  </>
                ) : (
                  <>
                    <Monitor className="size-3.5 text-blue-500" />
                    <span>Web Browser / Desktop</span>
                  </>
                )}
              </span>
            </div>
            <div className="border-border/50 bg-muted/20 flex flex-col gap-1 rounded-lg border p-2.5">
              <span className="text-muted-foreground text-[11px]">Status Izin Notifikasi</span>
              <span className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                {checkNotifPermissionText()}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/40">
            <Button
              type="button"
              size="sm"
              onClick={handleTestNotification}
              className="btn-primary-theme h-8 text-xs gap-1.5 shadow-xs"
            >
              <Volume2 className="size-3.5" />
              <span>Tes Notifikasi (Dering & Getar)</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRequestPermission}
              className="h-8 text-xs gap-1.5"
            >
              <Bell className="size-3.5 text-primary" />
              <span>Minta Izin Notifikasi</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card rounded-xl">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Package className="size-4 text-primary" />
                <span>Paket Aplikasi & Unduhan (Android & Windows)</span>
                <InfoHint
                  title="Aplikasi GoWA Multi-Platform"
                  description="Paket build aplikasi mandiri untuk Android APK dan Windows x64."
                  items={[
                    'Android APK v1.1.6: Dilengkapi notifikasi heads-up suara & getar untuk chat masuk personal.',
                    'Windows x64 ZIP: Paket portable mandiri dengan run.bat dan UI bawaan.',
                    'Windows Standalone EXE: Binary GoWA core tanpa CGO (Pure Go SQLite).',
                    'Riwayat Rilis: Semua versi sebelumnya (v1.1.0, v1.1.2, v1.1.3, v1.1.4, v1.1.5, v1.1.6) tetap tersimpan dan dapat diunduh.',
                  ]}
                />
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Unduh file build resmi untuk Android dan Windows atau akses arsip versi terdahulu.
              </CardDescription>
            </div>
            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono">
                v1.1.6 Terbaru
              </Badge>
              <Badge variant="outline" className="text-[10px] font-mono">
                PureGo SQLite
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="border-border/50 bg-muted/20 flex flex-col gap-1 rounded-lg border p-2.5">
              <span className="text-muted-foreground text-[11px]">Android APK (v1.1.6)</span>
              <span className="font-semibold text-foreground text-xs">1.08 MB • Android 5.0 – 15</span>
            </div>
            <div className="border-border/50 bg-muted/20 flex flex-col gap-1 rounded-lg border p-2.5">
              <span className="text-muted-foreground text-[11px]">Windows x64 Paket (ZIP)</span>
              <span className="font-semibold text-foreground text-xs">12.5 MB • EXE + UI + run.bat</span>
            </div>
            <div className="border-border/50 bg-muted/20 flex flex-col gap-1 rounded-lg border p-2.5">
              <span className="text-muted-foreground text-[11px]">Windows Standalone (.EXE)</span>
              <span className="font-semibold text-foreground text-xs font-mono">36.2 MB • 64-bit Binary</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/40">
            <a
              href="/statics/releases/v1.1.6/gowa-v1.1.6.apk"
              download="gowa-v1.1.6.apk"
              className="inline-flex items-center gap-1.5 px-3 h-8 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs"
            >
              <Smartphone className="size-3.5" />
              <span>Unduh APK Mobile (1.0 MB)</span>
            </a>
            <a
              href="/statics/releases/v1.1.6/gowa-v1.1.6-windows-amd64.zip"
              download="gowa-v1.1.6-windows-amd64.zip"
              className="inline-flex items-center gap-1.5 px-3 h-8 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs"
            >
              <FileArchive className="size-3.5" />
              <span>Unduh Paket Windows ZIP (12 MB)</span>
            </a>
            <a
              href="/statics/releases/v1.1.6/gowa-v1.1.6-windows-amd64.exe"
              download="gowa.exe"
              className="inline-flex items-center gap-1.5 px-3 h-8 text-xs font-semibold rounded-lg border border-border bg-card hover:bg-muted transition-colors text-foreground"
            >
              <Monitor className="size-3.5" />
              <span>Windows .EXE</span>
            </a>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowDownloadModal(true)}
              className="h-8 gap-1.5 text-xs font-semibold border-primary/30 text-primary hover:bg-primary/10 ml-auto"
            >
              <History className="size-3.5" />
              <span>Riwayat Semua Versi</span>
            </Button>
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
            {hasUpdate ? (
              <Button
                size="sm"
                onClick={handleSync}
                disabled={syncMutation.isPending}
                className="btn-primary-theme h-8 text-xs gap-1.5 shadow-xs"
              >
                <RefreshCw className={cn('size-3.5', syncMutation.isPending && 'animate-spin')} />
                <span>{syncMutation.isPending ? 'Menyinkronkan…' : 'Perbarui Sistem'}</span>
              </Button>
            ) : (
              <Button
                size="sm"
                disabled
                className="h-8 text-xs gap-1.5 opacity-80 cursor-not-allowed bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold"
                title="Sistem sudah berada di versi terbaru (tidak ada pembaruan di GitHub)"
              >
                <CheckCircle2 className="size-3.5 text-emerald-500" />
                <span>Sudah Versi Terbaru</span>
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={handleCheckUpdateManual}
              disabled={isRefetching}
              className="h-8 text-xs gap-1.5"
            >
              <RefreshCw className={cn('size-3', isRefetching && 'animate-spin')} />
              <span>{isRefetching ? 'Memeriksa…' : 'Cek Pembaruan'}</span>
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
      <DownloadDialog open={showDownloadModal} onOpenChange={setShowDownloadModal} />
    </div>
  )
}
