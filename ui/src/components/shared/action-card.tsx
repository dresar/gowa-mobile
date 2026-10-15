import type { ComponentType, ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function ActionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon?: ComponentType<{ className?: string }>
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <Card className="glass-card backdrop-blur-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <span className="flex size-7.5 shrink-0 items-center justify-center rounded-[var(--btn-radius,var(--radius))] border border-primary/30 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent text-primary shadow-2xs">
              <Icon className="size-3.5" />
            </span>
          )}
          <div>
            <CardTitle className="text-foreground text-sm font-semibold">{title}</CardTitle>
            {description && (
              <CardDescription className="text-muted-foreground text-xs">
                {description}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  )
}
