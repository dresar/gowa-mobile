import { useEffect, useRef, useState } from 'react'
import {
  Activity,
  BellRing,
  Blocks,
  Bot,
  CalendarClock,
  ChevronDown,
  Database,
  ExternalLink,
  Key,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  MessagesSquare,
  Monitor,
  Palette,
  PhoneOff,
  Radio,
  RefreshCw,
  ScrollText,
  Send,
  Settings,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Terminal,
  User,
  UserCheck,
  UserRound,
  Users,
  Webhook,
  Wrench,
} from 'lucide-react'
import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { DeviceSwitcher } from '@/components/layout/device-switcher'
import { DownloadDialog } from '@/components/layout/download-dialog'
import { Logo } from '@/components/layout/logo'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { PasskeyDialog } from '@/features/session/passkey-dialog'
import { useDevices } from '@/hooks/use-devices'
import { getSystemVersion } from '@/api/settings'
import { cn } from '@/lib/utils'
import { useConnection } from '@/stores/connection'

interface NavSubItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
}

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  baseTo?: string
  children?: NavSubItem[]
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: 'Ringkasan',
    items: [{ to: '/', label: 'Perangkat', icon: LayoutDashboard }],
  },
  {
    label: 'Pesan',
    items: [
      { to: '/messaging', label: 'Kirim Pesan', icon: Send },
      { to: '/scheduled', label: 'Terjadwal', icon: CalendarClock },
      { to: '/chats', label: 'Obrolan', icon: MessagesSquare },
    ],
  },
  {
    label: 'Otomasi & Bot',
    items: [
      { to: '/bot/auto-replies', label: 'Balasan Otomatis', icon: Bot },
      { to: '/bot/menu', label: 'Menu Perintah', icon: Terminal },
      { to: '/bot/ai', label: 'Asisten AI', icon: Sparkles },
      { to: '/bot/groups', label: 'Bot Grup', icon: ShieldCheck },
      { to: '/bot/logs', label: 'Log Bot', icon: ScrollText },
    ],
  },
  {
    label: 'Direktori',
    items: [
      { to: '/groups', label: 'Grup', icon: Users },
      { to: '/account', label: 'Akun', icon: UserRound },
    ],
  },
  {
    label: 'Integrasi',
    items: [
      { to: '/integrations', label: 'Webhook & MCP', icon: Blocks },
    ],
  },
  {
    label: 'Sistem',
    items: [
      {
        to: '/misc/checker',
        baseTo: '/misc',
        label: 'Utilitas & Saluran',
        icon: Wrench,
        children: [
          { to: '/misc/checker', label: 'Cek Nomor WA', icon: UserCheck },
          { to: '/misc/walink', label: 'Tautan & QR WA', icon: ExternalLink },
          { to: '/misc/presence', label: 'Presensi & Status', icon: Radio },
          { to: '/misc/contacts', label: 'Daftar Kontak', icon: Users },
          { to: '/misc/profile', label: 'Profil & Privasi', icon: User },
          { to: '/misc/channels', label: 'Saluran Newsletter', icon: BellRing },
          { to: '/misc/calls', label: 'Tolak Panggilan', icon: PhoneOff },
        ],
      },
      {
        to: '/settings/general',
        baseTo: '/settings',
        label: 'Pengaturan',
        icon: Settings,
        children: [
          { to: '/settings/general', label: 'Umum & WhatsApp', icon: Radio },
          { to: '/settings/api-keys', label: 'Kunci API', icon: Key },
          { to: '/settings/webhook', label: 'Webhook Gateway', icon: Webhook },
          { to: '/settings/ai', label: 'AI & Supermemory', icon: Sparkles },
          { to: '/settings/chatwoot', label: 'Chatwoot', icon: MessagesSquare },
          { to: '/settings/storage', label: 'Batas Media', icon: Database },
          { to: '/settings/security', label: 'Keamanan & PIN', icon: ShieldCheck },
          { to: '/settings/diagnostics', label: 'Diagnostik', icon: Activity },
          { to: '/settings/appearance', label: 'Tampilan', icon: Palette },
          { to: '/settings/auto-reply-templates', label: 'Template Balasan', icon: Sparkles },
        ],
      },
    ],
  },
]

const routeTitles: Record<string, { label: string; icon: typeof LayoutDashboard }> = {
  '/': { label: 'Perangkat', icon: LayoutDashboard },
  '/messaging': { label: 'Kirim Pesan', icon: Send },
  '/scheduled': { label: 'Terjadwal', icon: CalendarClock },
  '/chats': { label: 'Obrolan', icon: MessagesSquare },
  '/bot/auto-replies': { label: 'Balasan Otomatis', icon: Bot },
  '/bot/rules': { label: 'Balasan Otomatis', icon: Bot },
  '/bot/menu': { label: 'Menu Perintah', icon: Terminal },
  '/bot/ai': { label: 'Asisten AI', icon: Sparkles },
  '/bot/groups': { label: 'Bot Grup', icon: ShieldCheck },
  '/bot/logs': { label: 'Log Bot', icon: ScrollText },
  '/groups': { label: 'Grup', icon: Users },
  '/account': { label: 'Akun', icon: UserRound },
  '/integrations': { label: 'Integrasi Pengembang', icon: Blocks },
  '/webhook': { label: 'Integrasi Pengembang', icon: Blocks },
  '/mcp': { label: 'Integrasi Pengembang', icon: Blocks },
  '/misc': { label: 'Utilitas & Saluran', icon: Wrench },
  '/misc/checker': { label: 'Cek Nomor WA', icon: UserCheck },
  '/misc/walink': { label: 'Tautan & QR WA', icon: ExternalLink },
  '/misc/presence': { label: 'Presensi & Status', icon: Radio },
  '/misc/contacts': { label: 'Daftar Kontak', icon: Users },
  '/misc/profile': { label: 'Profil & Privasi', icon: User },
  '/misc/channels': { label: 'Saluran Newsletter', icon: BellRing },
  '/misc/calls': { label: 'Tolak Panggilan', icon: PhoneOff },
  '/settings': { label: 'Pengaturan', icon: Settings },
  '/settings/general': { label: 'Umum & WhatsApp', icon: Radio },
  '/settings/api-keys': { label: 'Kunci API', icon: Key },
  '/settings/webhook': { label: 'Webhook Gateway', icon: Webhook },
  '/settings/ai': { label: 'AI & Supermemory', icon: Sparkles },
  '/settings/chatwoot': { label: 'Chatwoot', icon: MessagesSquare },
  '/settings/storage': { label: 'Batas Media', icon: Database },
  '/settings/security': { label: 'Keamanan & PIN', icon: ShieldCheck },
  '/settings/diagnostics': { label: 'Diagnostik Server', icon: Activity },
  '/settings/appearance': { label: 'Tampilan & Tema', icon: Palette },
  '/settings/templates': { label: 'Template Auto-Reply', icon: Sparkles },
  '/bot/auto-replies/new': { label: 'Tambah Balasan Otomatis', icon: Bot },
}

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const { data: devices } = useDevices()
  const totalDevices = devices?.length ?? 0
  const location = useLocation()

  return (
    <nav className="flex flex-col gap-3.5">
      {navGroups.map((group) => (
        <div key={group.label} className="flex flex-col gap-0.5">
          <p className="text-muted-foreground/70 px-3 pb-1 text-[10px] font-semibold tracking-wider uppercase">
            {group.label}
          </p>
          {group.items.map((item) => {
            const hasChildren = Boolean(item.children && item.children.length > 0)
            const isBaseActive = item.baseTo
              ? location.pathname.startsWith(item.baseTo)
              : location.pathname === item.to
            const Icon = item.icon

            return (
              <div key={item.to} className="flex flex-col gap-0.5">
                <NavLink
                  to={item.to}
                  end={item.to === '/' || !item.baseTo}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'group/nav relative flex items-center gap-2.5 rounded-[7px] px-3 py-1.5 text-xs font-medium transition-all duration-150',
                      isActive || isBaseActive
                        ? 'border-y border-r border-l-2 border-primary border-primary/25 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent font-semibold text-primary shadow-2xs shadow-primary/15'
                        : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={cn(
                          'size-4 shrink-0 transition-colors',
                          isActive || isBaseActive
                            ? 'text-primary'
                            : 'text-muted-foreground group-hover/nav:text-foreground',
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                      {item.to === '/' && totalDevices > 0 && (
                        <span className="bg-muted/80 py-0.2 text-muted-foreground ml-auto rounded-full px-1.5 font-mono text-[10px] font-semibold">
                          {totalDevices}
                        </span>
                      )}
                      {hasChildren ? (
                        <ChevronDown
                          className={cn(
                            'ml-auto size-3 transition-transform text-muted-foreground',
                            isBaseActive ? 'rotate-180 text-primary' : '',
                          )}
                        />
                      ) : (
                        (isActive || isBaseActive) && (
                          <span className="ml-auto size-1.5 rounded-full bg-primary shadow-xs shadow-primary/80" />
                        )
                      )}
                    </>
                  )}
                </NavLink>

                {hasChildren && isBaseActive && item.children && (
                  <div className="ml-3 pl-3 border-l border-border/60 flex flex-col gap-0.5 py-1">
                    {item.children.map((child) => {
                      const ChildIcon = child.icon
                      const isChildActive = location.pathname === child.to
                      return (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          onClick={onNavigate}
                          className={cn(
                            'flex items-center gap-2 rounded-md px-2 py-1 text-[11px] font-medium transition-colors',
                            isChildActive
                              ? 'bg-primary/15 text-primary font-semibold'
                              : 'text-muted-foreground hover:bg-accent/40 hover:text-foreground',
                          )}
                        >
                          <ChildIcon className="size-3 shrink-0" />
                          <span className="truncate">{child.label}</span>
                        </NavLink>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </nav>
  )
}

export function AppShell() {
  const status = useConnection((state) => state.status)
  const isOffline = useConnection((state) => state.isOffline)
  const setOffline = useConnection((state) => state.setOffline)
  const recheckConnection = useConnection((state) => state.recheckConnection)
  const token = useConnection((state) => state.token)
  const baseUrl = useConnection((state) => state.baseUrl)
  const logout = useConnection((state) => state.logout)
  const location = useLocation()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false)
  const isNativeApp =
    typeof window !== 'undefined' &&
    Boolean(
      (window as any).GoWAMobile ||
        (window as any).Android ||
        (window as any).isGowaApk ||
        /GoWAMobile|wv|Android.*Version\/[0-9.]+/i.test(navigator.userAgent) ||
        window.location.protocol === 'file:'
    )
  const [isUpdating, setIsUpdating] = useState(false)
  const handleCheckUpdate = async () => {
    setIsUpdating(true)
    toast.info('Memeriksa ketersediaan pembaruan...')
    try {
      const ver = await getSystemVersion()
      const hasNew = Boolean(ver?.has_update || (ver?.incoming_commits && ver.incoming_commits.length > 0))
      if (hasNew) {
        if ('caches' in window) {
          const keys = await caches.keys()
          await Promise.all(keys.map((k) => caches.delete(k)))
        }
        toast.success('Pembaruan baru ditemukan! Memuat ulang antarmuka...')
        setTimeout(() => {
          setIsUpdating(false)
          window.location.reload()
        }, 700)
      } else {
        setIsUpdating(false)
        toast.info('Aplikasi sudah menggunakan versi terbaru')
      }
    } catch {
      setIsUpdating(false)
      toast.info('Aplikasi sudah menggunakan versi terbaru')
    }
  }
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const handleOnline = () => {
      void recheckConnection().then((ok) => {
        if (ok) toast.success('Koneksi terhubung kembali')
      })
    }
    const handleOffline = () => {
      setOffline(true)
      toast.warning('Koneksi internet terputus')
    }
    const handleConnError = (e: any) => {
      setOffline(true)
      if (e?.detail?.message) {
        toast.error(`Koneksi terputus: ${e.detail.message}`)
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('gowa:connection-error', handleConnError)

    let interval: ReturnType<typeof setInterval> | null = null
    if (isOffline) {
      interval = setInterval(() => {
        void recheckConnection().then((ok) => {
          if (ok) toast.success('Koneksi terhubung kembali')
        })
      }, 5000)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('gowa:connection-error', handleConnError)
      if (interval) clearInterval(interval)
    }
  }, [isOffline, recheckConnection, setOffline])

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [location.pathname])

  const currentRoute = routeTitles[location.pathname] ?? {
    label: 'Dasbor',
    icon: LayoutDashboard,
  }
  const CurrentIcon = currentRoute.icon

  if (status === 'booting') {
    return (
      <div className="ambient-glow bg-background relative flex min-h-svh items-center justify-center">
        <div className="relative z-10 flex flex-col items-center gap-3">
          <Loader2 className="size-6 animate-spin text-primary" />
          <p className="text-muted-foreground text-xs font-medium">Menghubungkan ke GOWA…</p>
        </div>
      </div>
    )
  }

  // Only kick to login if there is no token or baseUrl configured yet
  if (status !== 'connected' && (!token || !baseUrl)) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="ambient-glow bg-background relative flex h-[100dvh] w-full overflow-hidden">

      <aside className="border-sidebar-border/70 bg-sidebar/80 sticky top-0 z-20 hidden h-[100dvh] w-60 shrink-0 flex-col overflow-y-auto border-r backdrop-blur-xl md:flex select-none">
        <div className="border-sidebar-border/70 relative flex h-14 shrink-0 items-center border-b px-4">
          <Logo />
        </div>

        <ScrollArea className="flex-1 px-2.5 py-3">
          <NavContent />
        </ScrollArea>

        <div className="border-sidebar-border/70 shrink-0 border-t p-3 flex flex-col gap-2">
          {!isNativeApp ? (
            <div className="flex items-center gap-1.5 w-full">
              <a
                href="/statics/releases/v1.1.4/gowa-v1.1.4.apk"
                download="gowa-v1.1.4.apk"
                className="flex flex-1 items-center justify-center gap-1.5 h-8 text-xs font-semibold rounded-lg bg-emerald-600/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600/25 transition-colors"
                title="Download APK Mobile Android v1.1.4"
              >
                <Smartphone className="size-3.5" />
                <span>APK (1.0 MB)</span>
              </a>
              <button
                type="button"
                onClick={() => setDownloadDialogOpen(true)}
                className="flex items-center justify-center gap-1 px-2.5 h-8 text-xs font-semibold rounded-lg bg-blue-600/15 border border-blue-500/40 text-blue-600 dark:text-blue-400 hover:bg-blue-600/25 transition-colors cursor-pointer"
                title="Unduh Windows EXE & Riwayat Rilis"
              >
                <Monitor className="size-3.5" />
                <span>EXE / Rilis</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleCheckUpdate}
              disabled={isUpdating}
              className="flex items-center justify-center gap-1.5 w-full h-8 text-xs font-semibold rounded-lg bg-primary/15 border border-primary/40 text-primary hover:bg-primary/25 transition-colors cursor-pointer"
            >
              <RefreshCw className={cn('size-3.5', isUpdating && 'animate-spin')} />
              <span>{isUpdating ? 'Memperbarui...' : 'Periksa Pembaruan'}</span>
            </button>
          )}
          <div className="flex items-center justify-between gap-1.5">
            <div className="text-muted-foreground flex flex-1 items-center justify-between rounded-lg border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-2.5 py-1.5 text-[11px] backdrop-blur-xs">
              <div className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-primary shadow-xs shadow-primary/80" />
                <span>Core v9.6</span>
              </div>
              <span className="font-mono font-medium text-primary">PureGo</span>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              title="Keluar"
              onClick={() => void logout()}
              className="text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 size-8 shrink-0 rounded-lg"
            >
              <LogOut className="size-3.5" />
            </Button>
          </div>
        </div>
      </aside>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="left"
          className="border-sidebar-border/70 bg-sidebar/95 w-72 border-r p-0 backdrop-blur-xl flex flex-col"
        >
          <SheetHeader className="border-sidebar-border/70 border-b p-4 shrink-0">
            <SheetTitle asChild>
              <div>
                <Logo />
              </div>
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1 px-3 py-3 min-h-0">
            <NavContent onNavigate={() => setMobileNavOpen(false)} />
          </ScrollArea>
          <div className="border-sidebar-border/70 border-t p-3 shrink-0 flex flex-col gap-2">
            {!isNativeApp ? (
              <div className="flex items-center gap-1.5 w-full">
                <a
                  href="/statics/releases/v1.1.4/gowa-v1.1.4.apk"
                  download="gowa-v1.1.4.apk"
                  className="flex flex-1 items-center justify-center gap-1.5 h-8 text-xs font-semibold rounded-lg bg-emerald-600/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600/25 transition-colors"
                >
                  <Smartphone className="size-3.5" />
                  <span>APK (1.0 MB)</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setMobileNavOpen(false)
                    setDownloadDialogOpen(true)
                  }}
                  className="flex items-center justify-center gap-1 px-2.5 h-8 text-xs font-semibold rounded-lg bg-blue-600/15 border border-blue-500/40 text-blue-600 dark:text-blue-400 hover:bg-blue-600/25 transition-colors cursor-pointer"
                >
                  <Monitor className="size-3.5" />
                  <span>EXE / Rilis</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleCheckUpdate}
                disabled={isUpdating}
                className="flex items-center justify-center gap-1.5 w-full h-8 text-xs font-semibold rounded-lg bg-primary/15 border border-primary/40 text-primary hover:bg-primary/25 transition-colors cursor-pointer"
              >
                <RefreshCw className={cn('size-3.5', isUpdating && 'animate-spin')} />
                <span>{isUpdating ? 'Memperbarui...' : 'Periksa Pembaruan'}</span>
              </button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void logout()}
              className="text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 h-8 justify-start gap-2 px-2 text-xs rounded-lg"
            >
              <LogOut className="size-3.5" />
              <span>Keluar dari Akun</span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <div className="relative z-10 flex h-[100dvh] min-w-0 flex-1 flex-col overflow-hidden">
        {isOffline && (
          <div className="bg-amber-500/95 text-amber-950 dark:bg-amber-600/95 dark:text-white px-3 py-1.5 flex items-center justify-between text-xs z-50 shadow-sm border-b border-amber-600/30 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-block size-2 rounded-full bg-amber-900 dark:bg-amber-100 animate-ping shrink-0" />
              <span className="font-medium truncate text-[11px] sm:text-xs">
                Koneksi terputus · Mencoba menghubungkan kembali…
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                toast.info('Memeriksa koneksi server...')
                void recheckConnection().then((ok) => {
                  if (ok) toast.success('Koneksi terhubung kembali')
                  else toast.error('Server belum merespons')
                })
              }}
              className="ml-2 px-2 py-0.5 text-[10px] font-semibold bg-white/20 hover:bg-white/30 rounded shrink-0 cursor-pointer transition-colors"
            >
              Coba lagi
            </button>
          </div>
        )}
        <header className="border-border/60 bg-background/80 shrink-0 sticky top-0 z-40 flex h-14 items-center justify-between gap-2 border-b px-3 backdrop-blur-xl sm:gap-3 sm:px-6 select-none">
          <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-md border border-primary/30 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent text-primary shadow-2xs">
              <CurrentIcon className="size-3.5" />
            </div>
            <span className="text-foreground truncate text-xs font-semibold sm:text-sm">
              {currentRoute.label}
            </span>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            {!isNativeApp ? (
              <div className="hidden sm:flex items-center gap-1.5">
                <a
                  href="/statics/releases/v1.1.4/gowa-v1.1.4.apk"
                  download="gowa-v1.1.4.apk"
                  title="Download APK Mobile Android v1.1.4 (1.0 MB)"
                  className="inline-flex items-center gap-1.5 px-2.5 h-8 text-xs font-semibold rounded-lg bg-emerald-600/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600/25 transition-colors shrink-0"
                >
                  <Smartphone className="size-3.5" />
                  <span>APK (1.0 MB)</span>
                </a>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDownloadDialogOpen(true)}
                  title="Unduh Windows EXE & Riwayat Versi"
                  className="h-8 gap-1.5 px-2.5 text-xs font-semibold rounded-lg border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 shrink-0"
                >
                  <Monitor className="size-3.5" />
                  <span>EXE & Rilis</span>
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCheckUpdate}
                disabled={isUpdating}
                className="h-8 gap-1.5 px-2.5 text-xs font-semibold rounded-lg border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 shrink-0"
              >
                <RefreshCw className={cn('size-3.5', isUpdating && 'animate-spin')} />
                <span className="hidden sm:inline">Pembaruan</span>
              </Button>
            )}
            <div className="hidden md:flex items-center">
              <DeviceSwitcher />
            </div>
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              title="Keluar"
              onClick={() => void logout()}
              className="text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 h-8 gap-1.5 px-2 text-xs shrink-0 rounded-lg"
            >
              <LogOut className="size-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </Button>
          </div>
        </header>

        <main
          ref={mainRef}
          className={cn(
            'tech-grid flex-1 min-h-0 overflow-y-auto pb-6 md:pb-6',
            location.pathname === '/chats'
              ? 'p-2 sm:p-3 overflow-hidden flex flex-col pb-0 md:pb-0'
              : location.pathname.startsWith('/bot/menu')
                ? 'p-2.5 sm:p-3.5 md:p-4'
                : 'p-3 sm:p-4 md:p-6'
          )}
        >
          <div
            key={location.pathname}
            className={cn(
              'stagger flex flex-col',
              location.pathname === '/chats'
                ? 'w-full h-full flex-1 max-w-none'
                : location.pathname.startsWith('/bot/menu')
                  ? 'w-full max-w-none gap-3 sm:gap-3.5'
                  : 'w-full max-w-[1600px] mx-auto gap-3.5 sm:gap-4'
            )}
          >
            <Outlet />
          </div>
        </main>

        <nav className="border-border/70 bg-background/95 shrink-0 z-30 flex min-h-[72px] h-[calc(72px+env(safe-area-inset-bottom,0px))] items-center justify-around border-t px-2 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-xl md:hidden select-none shadow-lg">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="text-muted-foreground hover:text-foreground active:scale-95 flex flex-col items-center justify-center gap-1.5 text-xs font-medium transition-all py-2 px-1.5 min-w-[62px] cursor-pointer"
          >
            <Menu className="size-[22px] shrink-0" />
            <span className="truncate">Menu</span>
          </button>
          <NavLink
            to="/messaging"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-1.5 text-xs font-medium transition-all active:scale-95 py-2 px-1.5 min-w-[62px]',
                isActive ? 'font-bold text-primary scale-[1.03]' : 'text-muted-foreground',
              )
            }
          >
            <Send className="size-[22px] shrink-0" />
            <span className="truncate">Kirim</span>
          </NavLink>
          <NavLink
            to="/bot/auto-replies"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-1.5 text-xs font-medium transition-all active:scale-95 py-2 px-1.5 min-w-[62px]',
                isActive ? 'font-bold text-primary scale-[1.03]' : 'text-muted-foreground',
              )
            }
          >
            <Bot className="size-[22px] shrink-0" />
            <span className="truncate">Reply</span>
          </NavLink>
          <NavLink
            to="/chats"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-1.5 text-xs font-medium transition-all active:scale-95 py-2 px-1.5 min-w-[62px]',
                isActive ? 'font-bold text-primary scale-[1.03]' : 'text-muted-foreground',
              )
            }
          >
            <MessagesSquare className="size-[22px] shrink-0" />
            <span className="truncate">Obrolan</span>
          </NavLink>
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-1.5 text-xs font-medium transition-all active:scale-95 py-2 px-1.5 min-w-[62px]',
                isActive ? 'font-bold text-primary scale-[1.03]' : 'text-muted-foreground',
              )
            }
          >
            <Smartphone className="size-[22px] shrink-0" />
            <span className="truncate">Perangkat</span>
          </NavLink>
        </nav>
      </div>

      <PasskeyDialog />
      <DownloadDialog open={downloadDialogOpen} onOpenChange={setDownloadDialogOpen} />
    </div>
  )
}
