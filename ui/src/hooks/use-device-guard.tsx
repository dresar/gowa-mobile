import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CircleUserRound, LayoutDashboard, Plus, QrCode, Smartphone } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { CreateDeviceDialog } from '@/features/devices/create-device-dialog'
import { StateBadge } from '@/features/devices/state-badge'
import { LoginQrDialog } from '@/features/session/login-qr-dialog'
import { useDeviceAvatar } from '@/hooks/use-device-avatar'
import { useDevices } from '@/hooks/use-devices'
import { useDeviceStore } from '@/stores/device'
import type { RegistryDevice } from '@/api/types'

function GuardDeviceCard({
  device,
  onSelect,
  onPair,
}: {
  device: RegistryDevice
  onSelect: (id: string) => void
  onPair: (device: RegistryDevice) => void
}) {
  const avatar = useDeviceAvatar(device)

  return (
    <Card className="card-lift border-border/70 bg-card/70 shadow-xs backdrop-blur-xl transition-all">
      <CardHeader className="flex flex-row items-start justify-between gap-2 p-3.5 pb-2">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="border-border/80 size-10 border shadow-2xs">
            {avatar.data?.url && (
              <AvatarImage src={avatar.data.url} alt={device.display_name || device.id} />
            )}
            <AvatarFallback className="bg-muted/50">
              <CircleUserRound className="text-muted-foreground size-5" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-foreground truncate text-xs font-semibold">
              {device.display_name || device.id}
            </p>
            <p className="text-muted-foreground truncate font-mono text-[10px]">
              {device.phone_number || device.jid || device.id}
            </p>
          </div>
        </div>
        <StateBadge state={device.state} />
      </CardHeader>
      <CardContent className="flex flex-col gap-2 p-3.5 pt-0">
        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <Button
            size="sm"
            onClick={() => onSelect(device.id)}
            className="h-8 rounded-[6px] text-xs font-semibold active:scale-[0.98]"
          >
            <span>Pilih</span>
          </Button>
          {device.state !== 'logged_in' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPair(device)}
              className="border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 h-8 gap-1 rounded-[6px] text-xs font-semibold active:scale-[0.98]"
            >
              <QrCode className="size-3.5" />
              <span>Pindai QR</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelect(device.id)}
              className="border-border/70 bg-muted/40 text-foreground hover:bg-muted/60 h-8 rounded-[6px] text-xs font-semibold active:scale-[0.98]"
            >
              <span>Hubungkan</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function DeviceGuard() {
  const { data: devices, isLoading } = useDevices()
  const selectDevice = useDeviceStore((state) => state.selectDevice)
  const [createOpen, setCreateOpen] = useState(false)
  const [qrDevice, setQrDevice] = useState<RegistryDevice | null>(null)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
        </div>
      </div>
    )
  }

  if (devices && devices.length > 0) {
    return (
      <div className="flex flex-col gap-4">
        <Card className="border-border/70 bg-card/60 shadow-xs backdrop-blur-xl">
          <CardHeader className="p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-gradient-to-br from-primary/20 to-primary/10 text-primary shadow-2xs">
                  <Smartphone className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold sm:text-base">
                    Pilih Sesi
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Pilih perangkat untuk halaman ini.
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreateOpen(true)}
                className="h-8 gap-1.5 self-start rounded-lg border-primary/30 text-xs font-semibold text-primary hover:border-primary/50 hover:bg-primary/10 sm:self-auto"
              >
                <Plus className="size-3.5" />
                <span>Tambah</span>
              </Button>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {devices.map((device) => (
            <GuardDeviceCard
              key={device.id}
              device={device}
              onSelect={selectDevice}
              onPair={setQrDevice}
            />
          ))}
        </div>

        <CreateDeviceDialog open={createOpen} onOpenChange={setCreateOpen} />
        <LoginQrDialog device={qrDevice} onOpenChange={(open) => !open && setQrDevice(null)} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="border-border/70 bg-card/60 shadow-xs backdrop-blur-xl">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center sm:py-12">
          <div className="relative flex size-14 items-center justify-center rounded-xl border border-primary/35 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent text-primary shadow-md shadow-primary/20">
            <Smartphone className="size-7" />
            <span className="absolute -top-1 -right-1 flex size-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/70 opacity-75" />
              <span className="relative inline-flex size-3 rounded-full bg-primary" />
            </span>
          </div>

          <div className="flex max-w-md flex-col gap-1.5">
            <h2 className="font-heading text-foreground text-base font-bold tracking-tight sm:text-lg">
              Belum Ada Perangkat Terhubung
            </h2>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Bagian ini memerlukan sesi WhatsApp aktif untuk membaca kontak, profil,
              dan aliran pesan.
            </p>
          </div>

          <div className="grid w-full max-w-xl gap-2.5 text-left sm:grid-cols-3">
            <div className="border-border/60 bg-muted/30 rounded-lg border p-3">
              <div className="text-foreground flex items-center gap-1.5 text-[11px] font-semibold">
                <span className="flex size-4 items-center justify-center rounded btn-primary-theme text-[10px] font-bold text-white shadow-2xs">
                  1
                </span>
                <span>Daftar Slot</span>
              </div>
              <p className="text-muted-foreground mt-1 text-[10px] leading-normal">
                Buat slot sesi di server backend Go.
              </p>
            </div>
            <div className="border-border/60 bg-muted/30 rounded-lg border p-3">
              <div className="text-foreground flex items-center gap-1.5 text-[11px] font-semibold">
                <span className="flex size-4 items-center justify-center rounded btn-primary-theme text-[10px] font-bold text-white shadow-2xs">
                  2
                </span>
                <span>Pasangkan HP</span>
              </div>
              <p className="text-muted-foreground mt-1 text-[10px] leading-normal">
                Pindai QR atau gunakan kode pairing WhatsApp.
              </p>
            </div>
            <div className="border-border/60 bg-muted/30 rounded-lg border p-3">
              <div className="text-foreground flex items-center gap-1.5 text-[11px] font-semibold">
                <span className="flex size-4 items-center justify-center rounded btn-primary-theme text-[10px] font-bold text-white shadow-2xs">
                  3
                </span>
                <span>Siap Digunakan</span>
              </div>
              <p className="text-muted-foreground mt-1 text-[10px] leading-normal">
                Kirim pesan, baca chat, dan kelola profil.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <Button
              onClick={() => setCreateOpen(true)}
              className="h-8 gap-1.5 rounded-lg text-xs font-semibold shadow-xs"
            >
              <Plus className="size-3.5" />
              <span>Daftar Slot</span>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-border/70 h-8 gap-1.5 rounded-lg text-xs font-semibold"
            >
              <Link to="/">
                <LayoutDashboard className="size-3.5" />
                <span>Lihat Perangkat</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <CreateDeviceDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}

export function useSelectedDevice(): string | null {
  const selectedDeviceId = useDeviceStore((state) => state.selectedDeviceId)
  const selectDevice = useDeviceStore((state) => state.selectDevice)
  const { data: devices, isSuccess } = useDevices()

  useEffect(() => {
    if (!isSuccess || !devices) return

    if (devices.length === 0) {
      if (selectedDeviceId !== null) {
        selectDevice(null)
      }
      return
    }

    const deviceExists = devices.some((d) => d.id === selectedDeviceId)
    if (!deviceExists) {
      selectDevice(devices[0].id)
    }
  }, [devices, isSuccess, selectedDeviceId, selectDevice])

  if (!isSuccess || !devices || devices.length === 0) {
    return null
  }

  const activeDevice = devices.find((d) => d.id === selectedDeviceId)
  return activeDevice ? activeDevice.id : (devices[0]?.id ?? null)
}
