import { useState, type ReactNode } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface InfoHintProps {
  title: string
  description?: string
  items?: string[]
  children?: ReactNode
  className?: string
}

export function InfoHint({
  title,
  description,
  items,
  children,
  className,
}: InfoHintProps) {
  const [open, setOpen] = useState(false)

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setOpen((prev) => !prev)
            }}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            className={cn(
              'inline-flex size-3.5 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary text-[9px] font-bold font-mono leading-none hover:bg-primary hover:text-primary-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all cursor-help select-none',
              className,
            )}
            aria-label={`Info: ${title}`}
          >
            !
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="center"
          sideOffset={6}
          className="z-50 max-w-[280px] flex flex-col gap-1 p-2.5 rounded-lg border border-border/80 bg-popover/95 text-popover-foreground shadow-xl backdrop-blur-md pointer-events-none text-left"
        >
          <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
            <span className="text-primary font-mono text-[10px]">!</span>
            <span>{title}</span>
          </div>
          {description && (
            <p className="text-[11px] text-muted-foreground leading-snug">
              {description}
            </p>
          )}
          {items && items.length > 0 && (
            <ul className="flex flex-col gap-0.5 pt-1 mt-0.5 border-t border-border/40 text-[10px] text-foreground/90">
              {items.map((it, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="size-1 rounded-full bg-primary shrink-0 mt-1.5" />
                  <span className="leading-tight">{it}</span>
                </li>
              ))}
            </ul>
          )}
          {children}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
