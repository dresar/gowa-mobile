import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  LayoutGrid,
  List,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Smartphone,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { leaveGroup, listMyGroups, type MyGroup } from '@/api/group'
import { EmptyState } from '@/components/shared/empty-state'
import { IdText } from '@/components/shared/id-text'
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
import { ErrorNotice } from '@/components/shared/error-notice'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { CreateDeviceDialog } from '@/features/devices/create-device-dialog'
import { useSelectedDevice } from '@/hooks/use-device-guard'
import { isDeviceNotFoundError, toApiError } from '@/lib/api-error'
import { formatDate } from '@/lib/format'

function shortId(jid: string): string {
  return jid.split('@')[0]
}

export function GroupDirectory({ onSelect }: { onSelect: (group: MyGroup) => void }) {
  const deviceId = useSelectedDevice()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 20
  const [leaveTarget, setLeaveTarget] = useState<MyGroup | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const {
    data: groups,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['groups', deviceId],
    queryFn: () => listMyGroups(deviceId || undefined),
    enabled: !!deviceId,
  })

  const leave = useMutation({
    mutationFn: leaveGroup,
    onSuccess: () => {
      toast.success(`Keluar dari ${leaveTarget?.Name || 'grup'}`)
      setLeaveTarget(null)
      void queryClient.invalidateQueries({ queryKey: ['groups'] })
    },
    onError: (mutationError) => toast.error(toApiError(mutationError).message),
  })

  const filtered = useMemo(() => {
    if (!groups) return []
    const term = search.trim().toLowerCase()
    if (!term) return groups
    return groups.filter(
      (group) => group.Name.toLowerCase().includes(term) || group.JID.toLowerCase().includes(term),
    )
  }, [groups, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const startIndex = (safePage - 1) * PAGE_SIZE
  const endIndex = Math.min(startIndex + PAGE_SIZE, filtered.length)
  const paginatedGroups = filtered.slice(startIndex, endIndex)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
          <Input
            className="pl-8 text-xs"
            placeholder="Cari nama grup atau JID…"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
          />
        </div>
        <div className="flex items-center gap-0.5 border rounded-lg p-0.5 bg-muted/20">
          <Button
            type="button"
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('grid')}
            className="size-7 rounded-md"
            title="Tampilan Grid"
          >
            <LayoutGrid className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('list')}
            className="size-7 rounded-md"
            title="Tampilan List"
          >
            <List className="size-3.5" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="h-8 text-xs gap-1.5">
          <RefreshCw className={isFetching ? 'size-3.5 animate-spin' : 'size-3.5'} />
          <span>Perbarui</span>
        </Button>
      </div>

      {error && isDeviceNotFoundError(error) ? (
        <EmptyState
          icon={Smartphone}
          title="Perangkat tidak ditemukan"
          hint="Sesi WhatsApp yang dipilih tidak tersedia. Silakan pilih perangkat aktif atau daftarkan baru."
          action={
            <Button
              size="sm"
              onClick={() => setCreateOpen(true)}
              className="h-8 gap-1.5 rounded-lg text-xs font-semibold shadow-xs"
            >
              <Plus className="size-3.5" />
              <span>Tambah</span>
            </Button>
          }
        />
      ) : error ? (
        <ErrorNotice
          title="Gagal memuat grup"
          error={error}
          onRetry={() => refetch()}
        />
      ) : null}

      {isLoading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      )}

      {groups && groups.length === 0 && (
        <EmptyState
          icon={Users}
          title="Belum ada grup"
          hint="Buat grup atau gabung melalui tautan undangan."
        />
      )}

      {groups && groups.length > 0 && filtered.length === 0 && (
        <EmptyState icon={Search} title="Tidak ditemukan" hint={`Tidak ada yang cocok dengan "${search}".`} />
      )}

      {paginatedGroups.length > 0 && (
        <div className={viewMode === 'grid' ? 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3' : 'flex flex-col gap-2.5'}>
          {paginatedGroups.map((group) => (
            <Card key={group.JID} className="card-lift cursor-pointer gap-0 py-0 border-border/70 hover:border-primary/40 transition-all">
              <CardContent
                className="flex items-center gap-3 p-3.5"
                onClick={() => onSelect(group)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onSelect(group)
                  }
                }}
              >
                <div className="bg-primary/10 font-heading text-primary flex size-10 shrink-0 items-center justify-center rounded-xl font-bold border border-primary/20">
                  {(group.Name || '#').slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-foreground">{group.Name || shortId(group.JID)}</p>
                  <IdText value={shortId(group.JID)} />
                  <p className="text-muted-foreground text-[11px] mt-0.5">
                    {group.Participants?.length ?? group.ParticipantCount ?? 0} anggota ·{' '}
                    {formatDate(group.GroupCreated)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Keluar dari ${group.Name || 'grup'}`}
                  className="size-7 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={(event) => {
                    event.stopPropagation()
                    setLeaveTarget(group)
                  }}
                >
                  <LogOut className="size-3.5" />
                </Button>
                <ChevronRight className="text-muted-foreground size-4 shrink-0" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filtered.length > PAGE_SIZE && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-1 py-1 text-xs">
          <p className="text-muted-foreground text-xs font-mono">
            {startIndex + 1}–{endIndex} / {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              disabled={safePage <= 1}
              onClick={() => setPage(1)}
              className="size-7 rounded-[6px]"
              title="Pertama"
            >
              <ChevronsLeft className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="size-7 rounded-[6px]"
              title="Sebelumnya"
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <div className="flex items-center px-2 py-0.5 rounded-[6px] border bg-muted/30 font-mono text-xs">
              <span className="font-semibold text-foreground">{safePage}</span>
              <span className="text-muted-foreground mx-1">/</span>
              <span className="text-muted-foreground">{totalPages}</span>
            </div>
            <Button
              variant="outline"
              size="icon"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="size-7 rounded-[6px]"
              title="Berikutnya"
            >
              <ChevronRight className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={safePage >= totalPages}
              onClick={() => setPage(totalPages)}
              className="size-7 rounded-[6px]"
              title="Terakhir"
            >
              <ChevronsRight className="size-3.5" />
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={!!leaveTarget} onOpenChange={(open) => !open && setLeaveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Keluar dari {leaveTarget?.Name || 'grup ini'}?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan dikeluarkan dari grup. Untuk bergabung kembali memerlukan undangan baru.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => leaveTarget && leave.mutate({ group_id: leaveTarget.JID })}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              Keluar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CreateDeviceDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
