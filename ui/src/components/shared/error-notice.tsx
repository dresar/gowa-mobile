import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toApiError } from '@/lib/api-error'
import { cn } from '@/lib/utils'

export function ErrorNotice({
  title = 'Terjadi kesalahan',
  error,
  onRetry,
  className,
}: {
  title?: string
  error: unknown
  onRetry?: () => void
  className?: string
}) {
  const apiError = toApiError(error)

  return (
    <div
      className={cn(
        'border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-3 rounded-xl border p-4 text-xs backdrop-blur-md',
        className,
      )}
    >
      <div className="border-destructive/30 bg-destructive/20 text-destructive flex size-8 shrink-0 items-center justify-center rounded-lg border shadow-2xs">
        <AlertCircle className="size-4" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-heading text-xs font-semibold text-destructive">{title}</span>
          {apiError.status > 0 && (
            <span className="font-mono text-[10px] text-destructive/70">
              HTTP {apiError.status}
            </span>
          )}
        </div>
        <p className="text-destructive/90 text-xs leading-relaxed break-words">{apiError.message}</p>
        {onRetry && (
          <div className="pt-1.5">
            <Button
              size="xs"
              variant="outline"
              onClick={onRetry}
              className="border-destructive/30 bg-destructive/15 text-destructive hover:bg-destructive/25 hover:text-destructive h-7 gap-1.5 rounded-md text-xs font-medium"
            >
              <RefreshCw className="size-3" />
              <span>Coba Lagi</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
