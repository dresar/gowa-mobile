import type { ReactNode, ComponentType } from 'react'
import { Card, CardContent } from '@/components/ui/card'

export function EmptyState({
  icon: Icon,
  title,
  hint,
  action,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  hint?: string
  action?: ReactNode
}) {
  return (
    <Card className="border-border/70 bg-card/60 border shadow-xs backdrop-blur-xl">
      <CardContent className="flex flex-col items-center gap-3.5 py-10 text-center">
        <div className="flex size-11 items-center justify-center rounded-[var(--btn-radius,var(--radius))] border border-primary/30 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent text-primary shadow-sm shadow-primary/15">
          <Icon className="size-5" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="font-heading text-foreground text-sm font-semibold tracking-tight">
            {title}
          </p>
          {hint && <p className="text-muted-foreground max-w-md text-xs leading-relaxed">{hint}</p>}
        </div>
        {action && <div className="mt-1">{action}</div>}
      </CardContent>
    </Card>
  )
}
