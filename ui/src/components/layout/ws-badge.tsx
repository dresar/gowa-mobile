import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useWsStore, type WsStatus } from '@/lib/ws'
import { cn } from '@/lib/utils'

const labels: Record<WsStatus, string> = {
  connected: 'WebSocket Terhubung (Pembaruan realtime aktif)',
  connecting: 'WebSocket Menyambung…',
  disconnected: 'WebSocket Offline',
}

export function WsBadge() {
  const status = useWsStore((state) => state.status)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'flex h-7.5 shrink-0 items-center gap-1.5 rounded-lg border px-2 text-[11px] font-medium backdrop-blur-md transition-all select-none',
            status === 'connected' &&
              'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
            status === 'connecting' &&
              'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
            status === 'disconnected' && 'border-border/60 bg-muted/40 text-muted-foreground',
          )}
          aria-label={labels[status]}
        >
          <span className="relative flex size-2">
            {status === 'connected' && (
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={cn(
                'relative inline-flex size-2 rounded-full',
                status === 'connected' && 'bg-emerald-500',
                status === 'connecting' && 'animate-pulse bg-amber-500',
                status === 'disconnected' && 'bg-muted-foreground/50',
              )}
            />
          </span>
          <span className="hidden sm:inline">
            {status === 'connected' ? 'Aktif' : status === 'connecting' ? 'Menyambung' : 'Offline'}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent className="text-xs">{labels[status]}</TooltipContent>
    </Tooltip>
  )
}
