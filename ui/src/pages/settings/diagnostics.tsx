import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  CheckCircle2,
  Globe,
  LogOut,
  Server,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { InfoHint } from '@/components/ui/info-hint'
import { getAppSettings, pingServer } from '@/api/settings'
import { useConnection } from '@/stores/connection'

export default function SettingsDiagnosticsPage() {
  const baseUrl = useConnection((state) => state.baseUrl)
  const username = useConnection((state) => state.username)
  const disconnect = useConnection((state) => state.disconnect)

  const [pingLatency, setPingLatency] = useState<number | null>(null)
  const [isPinging, setIsPinging] = useState(false)

  const { data: settings, isLoading } = useQuery({
    queryKey: ['app-settings'],
    queryFn: getAppSettings,
  })

  const handlePing = async () => {
    setIsPinging(true)
    const start = performance.now()
    try {
      await pingServer()
      const latency = Math.round(performance.now() - start)
      setPingLatency(latency)
      toast.success(`Latensi server: ${latency}ms`)
    } catch {
      toast.error('Gagal menghubungi server')
    } finally {
      setIsPinging(false)
    }
  }

  const formatUptime = (seconds: number) => {
    if (!seconds) return 'Baru aktif'
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const parts = []
    if (days > 0) parts.push(`${days} hari`)
    if (hours > 0) parts.push(`${hours} jam`)
    parts.push(`${minutes} menit`)
    return parts.join(' ')
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="glass-card rounded-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Globe className="size-4 text-primary" />
                <span>Koneksi Gateway</span>
                <InfoHint
                  title="Koneksi Gateway"
                  description="Informasi alamat server dan sesi antarmuka aktif."
                  items={[
                    'URL Server: Alamat host backend yang sedang aktif.',
                    'Pengguna Sesi: Identitas token autentikasi saat ini.',
                    'Uji Ping: Pengukuran respon latensi jaringan real-time.',
                  ]}
                />
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handlePing}
                disabled={isPinging}
                className="h-7 text-xs gap-1.5"
              >
                <Activity className="size-3 text-primary" />
                {isPinging ? 'Menguji…' : pingLatency !== null ? `${pingLatency}ms` : 'Uji Ping'}
              </Button>
              <span className="flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                <CheckCircle2 className="size-3" />
                Terhubung
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2.5 text-xs">
          <div className="border-border/50 bg-muted/20 flex items-center justify-between gap-4 rounded-lg border p-2.5">
            <span className="text-muted-foreground font-medium">URL Server</span>
            <span className="text-foreground truncate font-mono">{baseUrl || window.location.origin}</span>
          </div>
          <div className="border-border/50 bg-muted/20 flex items-center justify-between gap-4 rounded-lg border p-2.5">
            <span className="text-muted-foreground font-medium">Pengguna Sesi</span>
            <span className="text-foreground font-mono">{username || 'PIN Session'}</span>
          </div>
          <div className="pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={disconnect}
              className="border-destructive/30 text-destructive hover:bg-destructive/10 h-8 gap-1.5 text-xs"
            >
              <LogOut className="size-3.5" />
              Putuskan Sesi
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Server className="size-4 text-primary" />
            <span>Diagnostik Sistem</span>
            <InfoHint
              title="Diagnostik Sistem"
              description="Metrik runtime internal server dan konfigurasi layanan."
              items={[
                'Versi Inti & OS sistem host.',
                'Port layanan dan uptime server.',
                'Status modul MCP dan scheduler pengiriman pesan.',
              ]}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-32 w-full rounded-lg" />
          ) : (
            <div className="grid gap-2.5 sm:grid-cols-2 text-xs">
              <div className="border-border/50 bg-muted/20 rounded-lg border p-2.5">
                <span className="text-muted-foreground text-[10px]">Versi Inti</span>
                <p className="text-foreground font-mono font-semibold">{settings?.version || 'v9.6.0'}</p>
              </div>
              <div className="border-border/50 bg-muted/20 rounded-lg border p-2.5">
                <span className="text-muted-foreground text-[10px]">Sistem Operasi</span>
                <p className="text-foreground font-mono font-semibold">{settings?.os || 'Linux/GOWA'}</p>
              </div>
              <div className="border-border/50 bg-muted/20 rounded-lg border p-2.5">
                <span className="text-muted-foreground text-[10px]">Port Layanan</span>
                <p className="text-foreground font-mono font-semibold">{settings?.app_port || '3000'}</p>
              </div>
              <div className="border-border/50 bg-muted/20 rounded-lg border p-2.5">
                <span className="text-muted-foreground text-[10px]">Waktu Nyala (Uptime)</span>
                <p className="text-foreground font-mono font-semibold">{formatUptime(settings?.uptime_seconds || 0)}</p>
              </div>
              <div className="border-border/50 bg-muted/20 rounded-lg border p-2.5">
                <span className="text-muted-foreground text-[10px]">Model Context Protocol (MCP)</span>
                <p className="font-semibold text-emerald-500">
                  {settings?.mcp_enabled ? 'Aktif (/mcp)' : 'Nonaktif'}
                </p>
              </div>
              <div className="border-border/50 bg-muted/20 rounded-lg border p-2.5">
                <span className="text-muted-foreground text-[10px]">Jadwal Pengiriman</span>
                <p className="font-semibold text-emerald-500">
                  {settings?.scheduled_sends ? 'Siap' : 'Nonaktif'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
