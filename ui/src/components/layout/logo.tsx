import logoUrl from '@/assets/gowa-logo.webp'
import { cn } from '@/lib/utils'

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5 select-none', className)}>
      <div className="relative flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/35 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-1 shadow-xs shadow-primary/20 backdrop-blur-xs">
        <img src={logoUrl} alt="GOWA" className="size-5.5 object-contain" />
        <span className="absolute -right-0.5 -bottom-0.5 flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/70 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-primary" />
        </span>
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="font-heading text-foreground text-sm font-bold tracking-tight">
            GOWA
          </span>
          <span className="py-0.2 rounded border border-primary/30 bg-gradient-to-r from-primary/20 to-primary/10 px-1 font-mono text-[9px] font-semibold text-primary">
            v9.6
          </span>
        </div>
        <span className="text-muted-foreground text-[10px] leading-none font-medium">
          WhatsApp Gateway
        </span>
      </div>
    </div>
  )
}
