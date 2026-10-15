import { useState } from 'react'
import { Check, CircleUserRound, Copy, ShieldCheck, Smartphone } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { StateBadge } from '@/features/devices/state-badge'
import { useDeviceAvatar } from '@/hooks/use-device-avatar'
import { useDevices } from '@/hooks/use-devices'
import { useSelectedDevice } from '@/hooks/use-device-guard'
import { formatDate } from '@/lib/format'

export function MyProfileCard() {
  const deviceId = useSelectedDevice()
  const { data: devices } = useDevices()
  const device = devices?.find((item) => item.id === deviceId)
  const avatar = useDeviceAvatar(device)
  const [copied, setCopied] = useState(false)

  const copyJid = () => {
    if (!device?.jid && !device?.phone_number) return
    const text = device.jid || device.phone_number || ''
    void navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('JID copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="border-border/70 bg-card/70 shadow-xs backdrop-blur-xl">
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-center gap-4">
          <div className="relative shrink-0">
            <Avatar className="border-border/80 size-16 border-2 shadow-xs sm:size-18">
              {avatar.data?.url && <AvatarImage src={avatar.data.url} alt="My avatar" />}
              <AvatarFallback className="bg-muted/50">
                {avatar.isLoading ? (
                  <Skeleton className="size-full rounded-full" />
                ) : (
                  <CircleUserRound className="text-muted-foreground size-8" />
                )}
              </AvatarFallback>
            </Avatar>
            {device?.state === 'logged_in' && (
              <span className="border-background absolute -right-0.5 -bottom-0.5 size-4 rounded-full border-2 bg-emerald-500 shadow-xs shadow-emerald-500/50" />
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-heading text-foreground truncate text-base font-bold sm:text-lg">
                {device?.display_name || 'No push name configured'}
              </h2>
              {device && <StateBadge state={device.state} />}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground font-mono text-xs">
                {device?.phone_number || device?.jid || 'Unpaired session'}
              </span>
              {(device?.jid || device?.phone_number) && (
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={copyJid}
                  className="text-muted-foreground hover:text-foreground h-5 gap-1 rounded px-1.5 text-[10px]"
                >
                  {copied ? (
                    <Check className="size-3 text-emerald-500" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </Button>
              )}
            </div>

            <div className="text-muted-foreground flex flex-wrap items-center gap-3 pt-0.5 text-[11px]">
              <div className="flex items-center gap-1">
                <Smartphone className="text-primary size-3" />
                <span>
                  Slot: <span className="text-foreground font-mono">{deviceId}</span>
                </span>
              </div>
              {device?.created_at && (
                <div className="flex items-center gap-1">
                  <ShieldCheck className="size-3 text-red-500" />
                  <span>Created {formatDate(device.created_at)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
