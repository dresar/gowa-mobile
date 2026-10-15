import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  CheckCircle,
  CircleUserRound,
  KeyRound,
  MoreVertical,
  QrCode,
  RefreshCw,
  Send,
  Trash2,
  Unplug,
  Webhook,
} from 'lucide-react'
import { toast } from 'sonner'
import { logoutDevice, reconnectDevice, removeDevice } from '@/api/devices'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StateBadge } from '@/features/devices/state-badge'
import { DeviceWebhookDialog } from '@/features/devices/webhook-dialog'
import { useDeviceAvatar } from '@/hooks/use-device-avatar'
import { toApiError } from '@/lib/api-error'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useDeviceStore } from '@/stores/device'
import type { RegistryDevice } from '@/api/types'

export function DeviceCard({
  device,
  onLoginQr,
  onLoginCode,
}: {
  device: RegistryDevice
  onLoginQr: (device: RegistryDevice) => void
  onLoginCode: (device: RegistryDevice) => void
}) {
  const queryClient = useQueryClient()
  const selectedDeviceId = useDeviceStore((state) => state.selectedDeviceId)
  const selectDevice = useDeviceStore((state) => state.selectDevice)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [webhookOpen, setWebhookOpen] = useState(false)
  const selected = selectedDeviceId === device.id
  const avatar = useDeviceAvatar(device)

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['devices'] })

  const logout = useMutation({
    mutationFn: () => logoutDevice(device.id),
    onSuccess: () => {
      toast.success(`Logout requested for ${device.id}`)
      void invalidate()
    },
    onError: (error) => toast.error(toApiError(error).message),
  })

  const reconnect = useMutation({
    mutationFn: () => reconnectDevice(device.id),
    onSuccess: () => {
      toast.success(`Reconnect requested for ${device.id}`)
      void invalidate()
    },
    onError: (error) => toast.error(toApiError(error).message),
  })

  const remove = useMutation({
    mutationFn: () => removeDevice(device.id),
    onSuccess: () => {
      toast.success(`Device ${device.id} removed`)
      if (selected) selectDevice(null)
      void invalidate()
    },
    onError: (error) => toast.error(toApiError(error).message),
  })

  return (
    <Card
      className={cn(
        'card-lift glass-card border-border/70 gap-3 border transition-all duration-200',
        selected &&
          'border-primary/60 bg-gradient-to-br from-primary/15 via-primary/8 to-transparent shadow-lg ring-1 shadow-primary/20 ring-primary/40',
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-2 p-3.5 pb-1">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative">
            <Avatar className="border-border/80 size-10 border shadow-2xs">
              {avatar.data?.url && (
                <AvatarImage src={avatar.data.url} alt={device.display_name || device.id} />
              )}
              <AvatarFallback className="bg-muted/50">
                <CircleUserRound className="text-muted-foreground size-5" />
              </AvatarFallback>
            </Avatar>
            {device.state === 'logged_in' && (
              <span className="border-background absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 bg-emerald-500 shadow-xs shadow-emerald-500/50" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-foreground truncate text-xs font-semibold">
                {device.display_name || device.id}
              </p>
              {selected && (
                <span className="py-0.2 flex items-center gap-0.5 rounded-[var(--btn-radius,var(--radius))] border border-primary/40 bg-[image:var(--btn-bg)] px-1.5 text-[9px] font-bold text-white shadow-xs">
                  <CheckCircle className="size-2.5" />
                  Active
                </span>
              )}
            </div>
            <p className="text-muted-foreground truncate font-mono text-[10px]">
              {device.phone_number || device.jid || 'Unpaired session'}
            </p>
          </div>
        </div>
        <StateBadge state={device.state} />
      </CardHeader>

      <CardContent className="text-muted-foreground space-y-1 p-3.5 pt-0 text-[11px]">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground/80">Slot ID:</span>
          <span className="bg-muted/60 text-foreground rounded px-1.5 py-0.5 font-mono text-[10px]">
            {device.id}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground/80">Registered:</span>
          <span>{formatDate(device.created_at)}</span>
        </div>
      </CardContent>

      <CardFooter className="border-border/40 flex items-center justify-between gap-2 border-t p-3.5 pt-2">
        <div className="flex flex-1 items-center gap-1.5">
          <Button
            variant={selected ? 'default' : 'outline'}
            size="sm"
            onClick={() => selectDevice(device.id)}
            disabled={selected}
            className="h-8 flex-1 rounded-[6px] text-xs font-semibold active:scale-[0.98]"
          >
            {selected ? 'Active Scope' : 'Select'}
          </Button>

          {device.state === 'logged_in' ? (
            <Button
              asChild
              variant="outline"
              size="sm"
              onClick={() => selectDevice(device.id)}
              className="border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 h-8 flex-1 gap-1 rounded-[6px] text-xs font-semibold active:scale-[0.98]"
            >
              <Link to="/messaging">
                <Send className="size-3" />
                <span>Message</span>
              </Link>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onLoginQr(device)}
              className="border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 h-8 flex-1 gap-1 rounded-[6px] text-xs font-semibold active:scale-[0.98]"
            >
              <QrCode className="size-3.5" />
              <span>Pair QR</span>
            </Button>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Device actions"
              className="size-8 rounded-[6px]"
            >
              <MoreVertical className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="text-xs">
            <DropdownMenuItem onClick={() => onLoginQr(device)}>
              <QrCode className="text-primary size-3.5" /> Login with QR
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onLoginCode(device)}>
              <KeyRound className="size-3.5" /> Login with Pairing Code
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => reconnect.mutate()}>
              <RefreshCw className="size-3.5" /> Reconnect Session
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => logout.mutate()}>
              <Unplug className="size-3.5" /> Logout Device
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setWebhookOpen(true)}>
              <Webhook className="text-primary size-3.5" /> Webhook Setup
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setConfirmDelete(true)}
              className="text-destructive"
            >
              <Trash2 className="size-3.5" /> Delete Slot
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>

      <DeviceWebhookDialog device={device} open={webhookOpen} onOpenChange={setWebhookOpen} />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="glass-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete device {device.id}?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              This will permanently revoke the device slot and clear its WhatsApp credentials from
              GOWA.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs font-semibold">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => remove.mutate()}
              className="bg-destructive hover:bg-destructive/90 h-8 text-xs font-semibold text-white"
            >
              Delete Slot
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
