import type { ReactNode } from 'react'

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-foreground flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
            <span>{title}</span>
          </h1>
          {description && (
            <p className="text-muted-foreground hidden text-xs sm:block sm:text-sm">{description}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <div className="w-full h-px bg-gradient-to-r from-primary/35 via-primary/15 to-transparent mt-0.5" />
    </div>
  )
}
