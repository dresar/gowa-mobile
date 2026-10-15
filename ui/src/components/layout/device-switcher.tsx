import { useEffect, useState } from 'react'
import { Plus, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { CreateDeviceDialog } from '@/features/devices/create-device-dialog'
import { useDevices } from '@/hooks/use-devices'
import { formatDeviceLabel } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useDeviceStore } from '@/stores/device'
import type { DeviceState } from '@/api/types'

const stateDots: Record<DeviceState, string> = {
  logged_in: 'bg-emerald-500 shadow-xs shadow-emerald-500/50',
  connected: 'bg-sky-500 shadow-xs shadow-sky-500/50',
  connecting: 'bg-amber-500 animate-pulse',
  disconnected: 'bg-muted-foreground/40',
}

export function DeviceSwitcher() {
  const { data: devices, isLoading } = useDevices()
  const selectedDeviceId = useDeviceStore((state) => state.selectedDeviceId)
  const selectDevice = useDeviceStore((state) => state.selectDevice)
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    if (!devices || devices.length === 0) return
    const exists = devices.some((device) => device.id === selectedDeviceId)
    if (!exists) selectDevice(devices[0]?.id ?? null)
  }, [devices, selectedDeviceId, selectDevice])

  if (isLoading) {
    return <Skeleton className="h-8 w-28 shrink-0 rounded-lg sm:w-36" />
  }

  if (!devices || devices.length === 0) {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCreateOpen(true)}
          className="h-8 shrink-0 gap-1.5 rounded-lg border-primary/30 bg-gradient-to-r from-primary/15 to-primary/10 text-xs font-semibold text-primary hover:border-primary/50 hover:from-primary/25 hover:to-primary/15"
        >
          <Plus className="size-3.5" />
          <span>Tambah</span>
        </Button>
        <CreateDeviceDialog open={createOpen} onOpenChange={setCreateOpen} />
      </>
    )
  }

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId)

  return (
    <>
      <Select value={selectedDeviceId ?? undefined} onValueChange={selectDevice}>
        <SelectTrigger
          size="sm"
          className={cn(
            'border-border/70 bg-card/70 hover:border-primary/40 h-8 w-fit max-w-[120px] shrink-0 overflow-hidden rounded-lg text-xs backdrop-blur-md transition-all sm:max-w-[160px] md:max-w-[190px]',
            !selectedDeviceId && 'border-amber-500/50 text-amber-500',
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
            {selectedDevice ? (
              <span
                className={cn('size-2 shrink-0 rounded-full', stateDots[selectedDevice.state])}
              />
            ) : (
              <Smartphone className="size-3.5 shrink-0 animate-pulse text-amber-500" />
            )}
            <SelectValue placeholder="Perangkat" className="min-w-0 flex-1 truncate block">
              {selectedDevice ? (
                <span
                  className="truncate block font-mono text-[11px]"
                  title={
                    selectedDevice.display_name
                      ? `${selectedDevice.display_name} (${selectedDevice.id})`
                      : selectedDevice.id
                  }
                >
                  {formatDeviceLabel(selectedDevice)}
                </span>
              ) : (
                <span className="truncate block font-semibold text-amber-500">Perangkat</span>
              )}
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent className="border-border/80 bg-popover/95 backdrop-blur-xl">
          {devices.map((device) => (
            <SelectItem key={device.id} value={device.id} className="text-xs">
              <span className={cn('size-2 shrink-0 rounded-full', stateDots[device.state])} />
              <div className="flex min-w-0 flex-1 flex-col truncate">
                <span className="truncate font-medium">
                  {device.display_name || formatDeviceLabel(device)}
                </span>
                <span className="text-muted-foreground truncate font-mono text-[10px]">
                  {device.phone_number || device.jid || device.id}
                </span>
              </div>
            </SelectItem>
          ))}
          <SelectSeparator />
          <div className="p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCreateOpen(true)}
              className="text-primary hover:bg-primary/10 h-7 w-full justify-start gap-1.5 rounded-md px-2 text-xs font-semibold"
            >
              <Plus className="size-3.5" />
              <span>Tambah</span>
            </Button>
          </div>
        </SelectContent>
      </Select>
      <CreateDeviceDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  )
}
