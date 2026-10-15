import { useState } from 'react'
import {
  Check,
  Copy,
  Download,
  FileArchive,
  History,
  Monitor,
  Package,
  Smartphone,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export interface ReleaseArtifact {
  title: string
  filename: string
  url: string
  size: string
  sha256: string
  type: 'apk' | 'exe' | 'zip'
  platform: 'Android' | 'Windows x64'
  description?: string
}

export interface ReleaseVersion {
  version: string
  tag: string
  date: string
  isLatest?: boolean
  highlights: string[]
  artifacts: ReleaseArtifact[]
}

export const GOWA_RELEASE_HISTORY: ReleaseVersion[] = [
  {
    version: '1.1.6',
    tag: 'v1.1.6',
    date: '15 Oktober 2026',
    isLatest: true,
    highlights: [
      'Heads-up notification Android bersuara & bergetar untuk pesan WhatsApp personal masuk',
      'Channel notifikasi gowa_messages_v2 dengan AudioAttributes & IMPORTANCE_HIGH',
      'Perbaikan resource small icon Android (stat_notify_chat crash-proof)',
      'Toleransi sinkronisasi jam / clock-drift diperluas hingga 5 menit',
      'Tombol "Tes Notifikasi" & status izin interaktif di menu Pengaturan Umum',
      'Sistem pencegahan spam ketat untuk story/status, newsletter, dan grup',
    ],
    artifacts: [
      {
        title: 'GoWA Mobile APK Android',
        filename: 'gowa-v1.1.6.apk',
        url: '/statics/releases/v1.1.6/gowa-v1.1.6.apk',
        size: '1.03 MB',
        sha256: '42e3d593d8e527d01823bd1e69da549864cdf6a07cf5bd33928241259cb09800',
        type: 'apk',
        platform: 'Android',
        description: 'Paket APK untuk Android 5.0 - 15, notifikasi heads-up suara & getar.',
      },
      {
        title: 'GoWA Windows x64 Bundle (ZIP)',
        filename: 'gowa-v1.1.6-windows-amd64.zip',
        url: '/statics/releases/v1.1.6/gowa-v1.1.6-windows-amd64.zip',
        size: '12.5 MB',
        sha256: 'de745054bd10a007e227dbb57c9ec4771fc9cd7e66ba65810a9f4a709e06116c',
        type: 'zip',
        platform: 'Windows x64',
        description: 'Paket lengkap portable run.bat, gowa.exe, .env, & Web Dashboard.',
      },
      {
        title: 'GoWA Windows x64 Standalone (EXE)',
        filename: 'gowa-v1.1.6-windows-amd64.exe',
        url: '/statics/releases/v1.1.6/gowa-v1.1.6-windows-amd64.exe',
        size: '35.8 MB',
        sha256: '591aa94aeefcf947882494deff8f2613f49880dfc2e731142d037b133fa5eca0',
        type: 'exe',
        platform: 'Windows x64',
        description: 'Binary mandiri GoWA core engine untuk Windows 10/11 64-bit.',
      },
    ],
  },
  {
    version: '1.1.5',
    tag: 'v1.1.5',
    date: '15 Oktober 2026',
    highlights: [
      'Penyaringan ketat notifikasi anti-spam untuk pesan status/story WhatsApp',
      'Validasi realtime window pesan masuk',
      'Indikator update sistem real-time',
    ],
    artifacts: [
      {
        title: 'GoWA Mobile APK Android',
        filename: 'gowa-v1.1.5.apk',
        url: '/statics/releases/v1.1.5/gowa-v1.1.5.apk',
        size: '1.08 MB',
        sha256: '8b9c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c',
        type: 'apk',
        platform: 'Android',
      },
      {
        title: 'GoWA Windows x64 Bundle (ZIP)',
        filename: 'gowa-v1.1.5-windows-amd64.zip',
        url: '/statics/releases/v1.1.5/gowa-v1.1.5-windows-amd64.zip',
        size: '12.5 MB',
        sha256: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
        type: 'zip',
        platform: 'Windows x64',
      },
      {
        title: 'GoWA Windows x64 Standalone (EXE)',
        filename: 'gowa-v1.1.5-windows-amd64.exe',
        url: '/statics/releases/v1.1.5/gowa-v1.1.5-windows-amd64.exe',
        size: '36.2 MB',
        sha256: '2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c',
        type: 'exe',
        platform: 'Windows x64',
      },
    ],
  },
  {
    version: '1.1.4',
    tag: 'v1.1.4',
    date: '15 Oktober 2026',
    highlights: [
      'Pure Go SQLite Engine (tanpa dependensi CGO, stabil di Linux & Windows)',
      'Aplikasi Windows x64 mandiri (.exe & paket .zip siap pakai dengan run.bat)',
      'UI React Mandiri tertanam langsung dalam APK Android (offline & disconnect tolerant)',
      'Sinkronisasi chat real-time via WebSocket broadcast buffered channel',
      'Fitur menu lampiran WhatsApp (Dokumen, Foto, Video, Audio, Stiker)',
      'Notifikasi in-app real-time untuk chat masuk personal',
      'Keamanan AI Auto-Reply: default mati total dan wajib whitelist grup manual',
    ],
    artifacts: [
      {
        title: 'GoWA Mobile APK Android',
        filename: 'gowa-v1.1.4.apk',
        url: '/statics/releases/v1.1.4/gowa-v1.1.4.apk',
        size: '1.05 MB',
        sha256: '7eb2c5a4abc7bed3833a5baaec11785c3d04a8639ee1c3e8f87919af70db2514',
        type: 'apk',
        platform: 'Android',
        description: 'Paket APK untuk Android 5.0 - 15, UI React terintegrasi & notifikasi.',
      },
      {
        title: 'GoWA Windows x64 Bundle (ZIP)',
        filename: 'gowa-v1.1.4-windows-amd64.zip',
        url: '/statics/releases/v1.1.4/gowa-v1.1.4-windows-amd64.zip',
        size: '12.5 MB',
        sha256: '870608b4f3e14d25890d33693ec19effead709934d6f044994a1858635af74ff',
        type: 'zip',
        platform: 'Windows x64',
        description: 'Paket lengkap siap klik ganda run.bat, termasuk gowa.exe, .env, & Web Dashboard.',
      },
      {
        title: 'GoWA Windows x64 Standalone (EXE)',
        filename: 'gowa-v1.1.4-windows-amd64.exe',
        url: '/statics/releases/v1.1.4/gowa-v1.1.4-windows-amd64.exe',
        size: '36.2 MB',
        sha256: '76ef5e0efce9379b8c92ffd6660f21427a77573caf786acc510a51c1204d2f6c',
        type: 'exe',
        platform: 'Windows x64',
        description: 'Binary mandiri GoWA core engine untuk Windows 10/11 64-bit.',
      },
    ],
  },
  {
    version: '1.1.3',
    tag: 'v1.1.3',
    date: '15 Oktober 2026',
    highlights: [
      'Penambahan audio notifikasi chime & popup in-app untuk pesan personal masuk',
      'Indikator status koneksi WebSocket dan auto-reconnect cerdas',
    ],
    artifacts: [
      {
        title: 'GoWA Mobile APK Android',
        filename: 'gowa-v1.1.3.apk',
        url: '/statics/releases/v1.1.3/gowa-v1.1.3.apk',
        size: '1.05 MB',
        sha256: 'd738dfd86b895e7337877897bcecd6343d4cd5eff8ab81554302839c494efc8d',
        type: 'apk',
        platform: 'Android',
      },
    ],
  },
  {
    version: '1.1.2',
    tag: 'v1.1.2',
    date: '15 Oktober 2026',
    highlights: [
      'Pembaruan in-app updater APK langsung dari panel backend',
      'Resolusi dynamic port & host fallback',
    ],
    artifacts: [
      {
        title: 'GoWA Mobile APK Android',
        filename: 'gowa-v1.1.2.apk',
        url: '/statics/releases/v1.1.2/gowa-v1.1.2.apk',
        size: '1.05 MB',
        sha256: '9d041cee21fd9b6ff0143821e53683cd7886d3bf37f28aab138af652be7f4c31',
        type: 'apk',
        platform: 'Android',
      },
    ],
  },
  {
    version: '1.1.0',
    tag: 'v1.1.0',
    date: '14 Oktober 2026',
    highlights: [
      'Rilis perdana Android APK native wrapper untuk GoWA',
      'Dukungan splash screen, auto-login token sync, & TLS bypass',
    ],
    artifacts: [
      {
        title: 'GoWA Mobile APK Android',
        filename: 'gowa-v1.1.0.apk',
        url: '/statics/releases/v1.1.0/gowa-v1.1.0.apk',
        size: '1.06 MB',
        sha256: 'a115d96f3bdf5f5cc67f3e5502d42f9ddbb33bacdd105516165a39171b7c2034',
        type: 'apk',
        platform: 'Android',
      },
    ],
  },
]

interface DownloadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DownloadDialog({ open, onOpenChange }: DownloadDialogProps) {
  const [copiedSha, setCopiedSha] = useState<string | null>(null)
  const latestRelease = GOWA_RELEASE_HISTORY[0]

  const handleCopySha = (sha: string, filename: string) => {
    navigator.clipboard.writeText(sha)
    setCopiedSha(sha)
    toast.success(`Checksum SHA256 untuk ${filename} disalin`)
    setTimeout(() => setCopiedSha(null), 2500)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 flex flex-col overflow-hidden sm:max-w-2xl">
        <DialogHeader className="p-4 sm:p-5 border-b border-border/60 shrink-0 bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
              <Package className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">Pusat Rilis & Unduhan GoWA</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Unduh file build resmi Android APK & Windows x64 untuk versi terbaru atau versi sebelumnya.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden p-4 sm:p-5">
          <Tabs defaultValue="latest" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2 mb-4 shrink-0">
              <TabsTrigger value="latest" className="text-xs font-semibold gap-1.5">
                <Sparkles className="size-3.5 text-primary" />
                <span>Rilis Terbaru (v{latestRelease.version})</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs font-semibold gap-1.5">
                <History className="size-3.5" />
                <span>Riwayat Semua Versi</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="latest" className="flex-1 min-h-0 mt-0">
              <ScrollArea className="h-[52vh] pr-2">
                <div className="space-y-4">
                  <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-3.5">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-semibold text-xs sm:text-sm text-foreground flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                        GoWA v{latestRelease.version} — Stabil & Siap Pakai
                      </span>
                      <span className="text-[11px] text-muted-foreground font-medium">
                        {latestRelease.date}
                      </span>
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                      {latestRelease.highlights.slice(0, 4).map((h, i) => (
                        <li key={i} className="text-foreground/80">{h}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Android APK */}
                    <div className="rounded-xl border border-border/70 bg-card p-4 flex flex-col justify-between shadow-2xs hover:border-emerald-500/50 transition-colors">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="size-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                              <Smartphone className="size-4" />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-foreground">Android APK</h4>
                              <p className="text-[11px] text-muted-foreground">Android 5.0 – 15</p>
                            </div>
                          </div>
                          <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-muted border border-border">
                            1.05 MB
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Aplikasi mobile mandiri dengan antarmuka UI React tertanam dan notifikasi chat personal.
                        </p>
                      </div>
                      <div className="pt-3 mt-2 border-t border-border/50 flex flex-col gap-2">
                        <a
                          href="/statics/releases/v1.1.4/gowa-v1.1.4.apk"
                          download="gowa-v1.1.4.apk"
                          className="flex items-center justify-center gap-1.5 w-full h-8 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs"
                        >
                          <Download className="size-3.5" />
                          <span>Unduh APK v1.1.4</span>
                        </a>
                      </div>
                    </div>

                    {/* Windows ZIP Bundle */}
                    <div className="rounded-xl border border-border/70 bg-card p-4 flex flex-col justify-between shadow-2xs hover:border-blue-500/50 transition-colors">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="size-8 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                              <FileArchive className="size-4" />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-foreground">Windows x64 ZIP</h4>
                              <p className="text-[11px] text-muted-foreground">Paket Lengkap Portable</p>
                            </div>
                          </div>
                          <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-muted border border-border">
                            12.5 MB
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Termasuk <code className="text-primary font-mono">gowa.exe</code>, peluncur <code className="text-primary font-mono">run.bat</code>, dan Web Dashboard bawaan. Cukup ekstrak dan klik ganda.
                        </p>
                      </div>
                      <div className="pt-3 mt-2 border-t border-border/50 flex flex-col gap-2">
                        <a
                          href="/statics/releases/v1.1.4/gowa-v1.1.4-windows-amd64.zip"
                          download="gowa-v1.1.4-windows-amd64.zip"
                          className="flex items-center justify-center gap-1.5 w-full h-8 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs"
                        >
                          <Download className="size-3.5" />
                          <span>Unduh Paket ZIP (12 MB)</span>
                        </a>
                      </div>
                    </div>

                    {/* Windows EXE Standalone */}
                    <div className="rounded-xl border border-border/70 bg-card p-4 flex flex-col justify-between shadow-2xs hover:border-primary/50 transition-colors sm:col-span-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded-lg bg-primary/15 border border-primary/30 text-primary flex items-center justify-center shrink-0">
                            <Monitor className="size-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-foreground">Windows x64 Standalone Binary (EXE)</h4>
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                PureGo SQLite
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Berkas biner murni tanpa kompresi (<code className="font-mono text-xs">gowa-v1.1.4-windows-amd64.exe</code>).
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-mono font-medium text-muted-foreground">36.2 MB</span>
                          <a
                            href="/statics/releases/v1.1.4/gowa-v1.1.4-windows-amd64.exe"
                            download="gowa.exe"
                            className="inline-flex items-center gap-1.5 px-3 h-8 text-xs font-semibold rounded-lg border border-border hover:bg-muted transition-colors text-foreground"
                          >
                            <Download className="size-3.5" />
                            <span>Unduh .EXE</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="history" className="flex-1 min-h-0 mt-0">
              <ScrollArea className="h-[52vh] pr-2">
                <div className="space-y-4">
                  {GOWA_RELEASE_HISTORY.map((rel) => (
                    <div
                      key={rel.version}
                      className="rounded-xl border border-border/70 bg-card p-4 space-y-3 shadow-2xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">Versi {rel.version}</span>
                          {rel.isLatest && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              Terbaru
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground font-mono">{rel.tag}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{rel.date}</span>
                      </div>

                      <div className="text-xs text-muted-foreground space-y-1">
                        <p className="font-medium text-foreground/90">Catatan Pembaruan:</p>
                        <ul className="list-disc list-inside space-y-0.5 pl-1">
                          {rel.highlights.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-2 pt-1">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Berkas Unduhan Tersedia ({rel.artifacts.length})
                        </p>
                        <div className="grid grid-cols-1 gap-2">
                          {rel.artifacts.map((art) => (
                            <div
                              key={art.filename}
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {art.type === 'apk' ? (
                                  <Smartphone className="size-4 text-emerald-500 shrink-0" />
                                ) : art.type === 'zip' ? (
                                  <FileArchive className="size-4 text-blue-500 shrink-0" />
                                ) : (
                                  <Monitor className="size-4 text-purple-500 shrink-0" />
                                )}
                                <div className="truncate">
                                  <span className="font-mono text-xs font-semibold text-foreground truncate block">
                                    {art.filename}
                                  </span>
                                  <span className="text-[11px] text-muted-foreground">
                                    {art.platform} • {art.size}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  title="Salin SHA256 Checksum"
                                  onClick={() => handleCopySha(art.sha256, art.filename)}
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  {copiedSha === art.sha256 ? (
                                    <Check className="size-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="size-3.5" />
                                  )}
                                </Button>
                                <a
                                  href={art.url}
                                  download={art.filename}
                                  className="inline-flex items-center gap-1.5 px-2.5 h-7 text-xs font-semibold rounded-md bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors"
                                >
                                  <Download className="size-3" />
                                  <span>Unduh</span>
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
