import { useQuery } from '@tanstack/react-query'
import { getPrivacy } from '@/api/user'
import { ErrorNotice } from '@/components/shared/error-notice'
import { Skeleton } from '@/components/ui/skeleton'
import { useSelectedDevice } from '@/hooks/use-device-guard'
import { isDeviceNotFoundError } from '@/lib/api-error'

export function PrivacyView() {
  const device = useSelectedDevice()
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['privacy', device],
    queryFn: () => getPrivacy(device || undefined),
    enabled: !!device,
  })

  if (isLoading) return <Skeleton className="h-32" />
  if (error) {
    if (isDeviceNotFoundError(error)) {
      return (
        <div className="border-border/70 bg-card/60 flex flex-col items-center justify-center gap-2 rounded-xl border p-8 text-center backdrop-blur-xl">
          <p className="text-foreground text-xs font-semibold">Device not found</p>
          <p className="text-muted-foreground max-w-xs text-[11px]">
            Please pair or select an active WhatsApp device to view privacy settings.
          </p>
        </div>
      )
    }
    return <ErrorNotice title="Failed to load privacy settings" error={error} onRetry={() => refetch()} />
  }
  if (!data) return null

  return (
    <div className="flex flex-col gap-2 text-sm">
      <Row label="Who can add to groups" value={data.group_add} />
      <Row label="Who can see last seen" value={data.last_seen} />
      <Row label="Who can see status" value={data.status} />
      <Row label="Who can see profile photo" value={data.profile} />
      <Row label="Read receipts" value={data.read_receipts} />
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono">{value || '—'}</span>
    </div>
  )
}
