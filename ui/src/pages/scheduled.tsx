import { useState, useEffect, type ComponentType } from 'react'
import { useSearchParams } from 'react-router-dom'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileCode,
  FileSpreadsheet,
  LayoutGrid,
  List,
  Loader2,
  Pause,
  Play,
  Plus,
  Search,
  Upload,
  XCircle,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  exportSchedulesToJson,
  exportSchedulesToCsv,
  ImportScheduleDialog,
} from '@/features/schedule/import-export-dialog'
import {
  listSchedules,
  pauseSchedule,
  resumeSchedule,
  cancelSchedule,
  type ScheduledSend,
  type ScheduleStatus,
} from '@/api/schedule'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorNotice } from '@/components/shared/error-notice'
import { PageHeader } from '@/components/shared/page-header'
import { PhoneNumberPicker } from '@/components/shared/phone-number-picker'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { CreateDeviceDialog } from '@/features/devices/create-device-dialog'
import { DeviceGuard, useSelectedDevice } from '@/hooks/use-device-guard'
import { useActionMutation } from '@/hooks/use-action-mutation'
import { isDeviceNotFoundError } from '@/lib/api-error'
import { formatDate, formatNextRun } from '@/lib/format'
import { sendText } from '@/api/send'
import { ScheduleFields } from '@/features/send/schedule-fields'
import { useScheduleDraft } from '@/features/send/use-schedule-draft'

const PAGE_SIZE = 25

const STATUS_FILTERS: { value: ScheduleStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'active', label: 'Aktif' },
  { value: 'running', label: 'Berjalan' },
  { value: 'paused', label: 'Dijeda' },
  { value: 'completed', label: 'Selesai' },
  { value: 'failed', label: 'Gagal' },
  { value: 'cancelled', label: 'Dibatalkan' },
]

const MESSAGE_TYPES: { value: string; label: string }[] = [
  { value: 'text', label: 'Teks' },
  { value: 'image', label: 'Gambar' },
  { value: 'video', label: 'Video' },
  { value: 'audio', label: 'Audio' },
  { value: 'file', label: 'Dokumen' },
  { value: 'sticker', label: 'Stiker' },
  { value: 'contact', label: 'Kontak' },
  { value: 'link', label: 'Tautan' },
  { value: 'location', label: 'Lokasi' },
  { value: 'poll', label: 'Polling' },
  { value: 'forward', label: 'Teruskan' },
]

type ScheduleAction = 'pause' | 'resume' | 'cancel'

function ScheduleStatusBadge({ status }: { status: ScheduledSend['status'] }) {
  switch (status) {
    case 'active':
      return (
        <Badge variant="emerald" className="gap-1.5 font-semibold">
          <span className="size-1.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/80 animate-pulse" />
          <span>Aktif</span>
        </Badge>
      )
    case 'running':
      return (
        <Badge variant="ruby" className="gap-1.5 font-semibold">
          <Loader2 className="size-3 animate-spin text-red-500" />
          <span>Berjalan</span>
        </Badge>
      )
    case 'paused':
      return (
        <Badge
          variant="outline"
          className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1.5 font-semibold"
        >
          <span className="size-1.5 rounded-full bg-amber-500" />
          <span>Dijeda</span>
        </Badge>
      )
    case 'completed':
      return (
        <Badge variant="secondary" className="gap-1.5 font-semibold">
          <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
          <span>Selesai</span>
        </Badge>
      )
    case 'failed':
      return (
        <Badge variant="destructive" className="gap-1.5 font-semibold">
          <XCircle className="size-3" />
          <span>Gagal</span>
        </Badge>
      )
    case 'cancelled':
      return (
        <Badge variant="outline" className="text-muted-foreground gap-1.5">
          <span className="size-1.5 rounded-full bg-muted-foreground/40" />
          <span>Dibatalkan</span>
        </Badge>
      )
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

function IconAction({
  icon: Icon,
  label,
  variant = 'outline',
  disabled,
  onClick,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  variant?: 'outline' | 'destructive'
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={variant}
          size="icon-sm"
          aria-label={label}
          disabled={disabled}
          onClick={onClick}
        >
          <Icon />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

function ScheduleRow({
  item,
  busy,
  run,
}: {
  item: ScheduledSend
  busy: boolean
  run: (action: ScheduleAction, id: string) => void
}) {
  const canCancel = item.status === 'active' || item.status === 'paused' || item.status === 'failed'

  return (
    <TableRow>
      <TableCell className="max-w-[16rem] font-medium">
        <div className="truncate" title={item.phone}>
          <span className="text-muted-foreground capitalize">{item.message_type}</span> ·{' '}
          {item.phone}
        </div>
      </TableCell>
      <TableCell className="max-w-[18rem]">
        <div className="truncate">{item.summary || 'Scheduled message'}</div>
        {item.last_error && (
          <div className="text-destructive truncate text-xs" title={item.last_error}>
            {item.last_error}
          </div>
        )}
      </TableCell>
      <TableCell>
        <ScheduleStatusBadge status={item.status} />
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        {item.next_run_at ? (
          <div className="flex flex-col" title={formatDate(item.next_run_at)}>
            <span className="text-foreground text-xs font-semibold">
              {formatNextRun(item.next_run_at).relative}
            </span>
            <span className="text-muted-foreground font-mono text-[10px]">
              {formatDate(item.next_run_at)}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground text-xs">No next run</span>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground hidden lg:table-cell">
        <div>{item.recurrence}</div>
        {item.timezone && <div className="text-xs">{item.timezone}</div>}
      </TableCell>
      <TableCell className="text-muted-foreground hidden md:table-cell">
        <div>
          {item.occurrence_count}
          {item.occurrence_limit ? `/${item.occurrence_limit}` : ''}
        </div>
        {/* Attempts only earn a slot once a run has actually failed. */}
        {item.attempts > 0 && <div className="text-xs">{item.attempts} attempts</div>}
      </TableCell>
      <TableCell>
        <div className="flex justify-end gap-1">
          {item.status === 'paused' && (
            <IconAction
              icon={Play}
              label="Resume"
              disabled={busy}
              onClick={() => run('resume', item.id)}
            />
          )}
          {item.status === 'active' && (
            <IconAction
              icon={Pause}
              label="Pause"
              disabled={busy}
              onClick={() => run('pause', item.id)}
            />
          )}
          {canCancel && (
            <IconAction
              icon={XCircle}
              label="Cancel"
              variant="destructive"
              disabled={busy}
              onClick={() => run('cancel', item.id)}
            />
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}

function ScheduleCard({
  item,
  busy,
  run,
}: {
  item: ScheduledSend
  busy: boolean
  run: (action: ScheduleAction, id: string) => void
}) {
  const canCancel = item.status === 'active' || item.status === 'paused' || item.status === 'failed'

  return (
    <Card className="glass-card border-border/70 rounded-xl overflow-hidden shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between">
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex flex-col">
            <span className="text-[11px] font-mono text-muted-foreground uppercase">{item.message_type}</span>
            <span className="text-sm font-semibold text-foreground truncate" title={item.phone}>{item.phone}</span>
          </div>
          <ScheduleStatusBadge status={item.status} />
        </div>

        <p className="text-xs text-muted-foreground line-clamp-3 bg-muted/20 p-2.5 rounded-lg border border-border/40 min-h-[54px]">
          {item.summary || 'Pesan terjadwal'}
        </p>

        {item.last_error && (
          <div className="text-[11px] text-destructive bg-destructive/10 p-2 rounded border border-destructive/20 truncate" title={item.last_error}>
            {item.last_error}
          </div>
        )}

        <div className="flex flex-col gap-1 text-[11px] text-muted-foreground pt-1 border-t border-border/40">
          <div className="flex items-center justify-between">
            <span>Jadwal:</span>
            <span className="font-semibold text-foreground">
              {item.next_run_at ? formatNextRun(item.next_run_at).relative : '-'}
            </span>
          </div>
          {item.recurrence && (
            <div className="flex items-center justify-between font-mono text-[10px]">
              <span>Ulang:</span>
              <span>{item.recurrence}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-[10px]">
            <span>Terkirim:</span>
            <span>{item.occurrence_count} kali</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-border/30">
          {item.status === 'active' && (
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => run('pause', item.id)}
              className="h-7 text-xs px-2.5 rounded-[5px] gap-1"
            >
              <Pause className="size-3" />
              <span>Jeda</span>
            </Button>
          )}
          {item.status === 'paused' && (
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => run('resume', item.id)}
              className="h-7 text-xs px-2.5 rounded-[5px] gap-1"
            >
              <Play className="size-3" />
              <span>Lanjut</span>
            </Button>
          )}
          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => run('cancel', item.id)}
              className="h-7 text-xs px-2 rounded-[5px] text-destructive hover:bg-destructive/10"
              title="Batalkan"
            >
              <XCircle className="size-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ScheduleTable({ device }: { device: string }) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<ScheduleStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [messageType, setMessageType] = useState('all')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid')
  const [offset, setOffset] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const query = useQuery({
    queryKey: ['schedules', device, status, search, messageType, offset],
    queryFn: () =>
      listSchedules(
        {
          status: status === 'all' ? undefined : status,
          search: search || undefined,
          message_type: messageType === 'all' ? undefined : messageType,
          limit: PAGE_SIZE,
          offset,
        },
        device,
      ),
    enabled: Boolean(device),
    refetchInterval: 10_000,
    placeholderData: keepPreviousData,
  })
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ['schedules', device] })

  const pause = useActionMutation((id: string) => pauseSchedule(id, device), {
    successMessage: 'Schedule paused',
  })
  const resume = useActionMutation((id: string) => resumeSchedule(id, device), {
    successMessage: 'Schedule resumed',
  })
  const cancel = useActionMutation((id: string) => cancelSchedule(id, device), {
    successMessage: 'Schedule cancelled',
  })

  const pendingId = pause.isPending
    ? pause.variables
    : resume.isPending
      ? resume.variables
      : cancel.isPending
        ? cancel.variables
        : undefined

  const run = (action: ScheduleAction, id: string) => {
    const options = { onSettled: refresh }
    if (action === 'pause') pause.mutate(id, options)
    else if (action === 'resume') resume.mutate(id, options)
    else if (window.confirm('Cancel this schedule?')) cancel.mutate(id, options)
  }

  const rows = query.data?.data ?? []
  const total = query.data?.pagination.total ?? 0
  const [searchParams, setSearchParams] = useSearchParams()
  const initialPhone = searchParams.get('phone') || ''
  const [newScheduleOpen, setNewScheduleOpen] = useState(Boolean(initialPhone))
  const [importOpen, setImportOpen] = useState(false)

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Terjadwal"
        description="Pesan tertunda dan berulang."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={() => setNewScheduleOpen(true)}
              className="h-8 gap-1.5 rounded-lg text-xs font-semibold shadow-xs"
            >
              <Plus className="size-3.5" />
              <span>Jadwalkan</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 rounded-lg text-xs font-semibold shadow-xs"
                >
                  <Upload className="size-3.5" />
                  <span>Data</span>
                  <ChevronDown className="size-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => setImportOpen(true)}
                  className="gap-2 text-xs font-medium cursor-pointer"
                >
                  <Upload className="size-3.5 text-primary" />
                  <span>Impor Berkas (CSV/JSON)</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={rows.length === 0}
                  onClick={() => exportSchedulesToJson(rows)}
                  className="gap-2 text-xs font-medium cursor-pointer"
                >
                  <FileCode className="size-3.5 text-cyan-500" />
                  <span>Ekspor JSON</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={rows.length === 0}
                  onClick={() => exportSchedulesToCsv(rows)}
                  className="gap-2 text-xs font-medium cursor-pointer"
                >
                  <FileSpreadsheet className="size-3.5 text-emerald-500" />
                  <span>Ekspor CSV (Excel)</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="w-full sm:w-auto sm:hidden">
              <Select
                value={status}
                onValueChange={(value) => {
                  if (!value) return
                  setStatus(value as ScheduleStatus | 'all')
                  setOffset(0)
                }}
              >
                <SelectTrigger className="h-8 w-full text-xs" aria-label="Filter status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FILTERS.map((filter) => (
                    <SelectItem key={filter.value} value={filter.value} className="text-xs">
                      {filter.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex"
              value={status}
              onValueChange={(value) => {
                if (!value) return
                setStatus(value as ScheduleStatus | 'all')
                setOffset(0)
              }}
            >
              {STATUS_FILTERS.map((filter) => (
                <ToggleGroupItem key={filter.value} value={filter.value} className="text-xs px-2.5 h-8">
                  {filter.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="text-muted-foreground absolute top-2.5 left-2 size-4" />
          <Input
            className="pl-8"
            placeholder="Cari"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setOffset(0)
            }}
          />
        </div>
        <Select
          value={messageType}
          onValueChange={(value) => {
            setMessageType(value)
            setOffset(0)
          }}
        >
          <SelectTrigger className="w-44" aria-label="Tipe pesan">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua tipe</SelectItem>
            {MESSAGE_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-0.5 border rounded-lg p-0.5 bg-muted/20">
          <Button
            type="button"
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('list')}
            className="size-7 rounded-md"
            title="Tampilan Tabel"
          >
            <List className="size-3.5" />
          </Button>
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
        </div>
      </div>
      {query.error && isDeviceNotFoundError(query.error) ? (
        <EmptyState
          icon={CalendarClock}
          title="Perangkat tidak ditemukan"
          hint="Sesi WhatsApp yang dipilih tidak tersedia. Silakan daftar atau pilih perangkat aktif."
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
      ) : query.error ? (
        <ErrorNotice
          title="Gagal memuat jadwal"
          error={query.error}
          onRetry={() => void query.refetch()}
        />
      ) : null}
      {query.isLoading && (
        <div className="flex flex-col gap-2 rounded-lg border p-2">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-9" />
          ))}
        </div>
      )}
      {query.data && rows.length === 0 && (
        <EmptyState
          icon={CalendarClock}
          title="Belum ada jadwal"
          hint={
            status === 'all' && messageType === 'all' && !search
              ? 'Mulai jadwalkan pesan otomatis Anda sekarang.'
              : 'Tidak ada yang cocok dengan filter ini.'
          }
          action={
            <Button
              size="sm"
              onClick={() => setNewScheduleOpen(true)}
              className="h-8 gap-1.5 rounded-lg text-xs font-semibold shadow-xs"
            >
              <Plus className="size-3.5" />
              <span>Jadwalkan</span>
            </Button>
          }
        />
      )}
      {rows.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {rows.map((item) => (
            <ScheduleCard key={item.id} item={item} busy={pendingId === item.id} run={run} />
          ))}
        </div>
      )}
      {rows.length > 0 && viewMode === 'list' && (
        <div className="glass-card border-border/70 overflow-hidden rounded-xl border shadow-xs backdrop-blur-xl">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tujuan</TableHead>
                <TableHead>Pesan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Jadwal kirim</TableHead>
                <TableHead className="hidden lg:table-cell">Pengulangan</TableHead>
                <TableHead className="hidden md:table-cell">Terkirim</TableHead>
                <TableHead className="sr-only">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((item) => (
                <ScheduleRow key={item.id} item={item} busy={pendingId === item.id} run={run} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {(total > PAGE_SIZE || offset > 0) && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-1 py-1 text-xs">
          <p className="text-muted-foreground text-xs font-mono">
            {offset + 1}–{offset + rows.length} / {total}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              disabled={offset === 0}
              onClick={() => setOffset(0)}
              className="size-7 rounded-[6px]"
              title="Pertama"
            >
              <ChevronsLeft className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              className="size-7 rounded-[6px]"
              title="Sebelumnya"
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <div className="flex items-center px-2 py-0.5 rounded-[6px] border bg-muted/30 font-mono text-xs">
              <span className="font-semibold text-foreground">{Math.floor(offset / PAGE_SIZE) + 1}</span>
              <span className="text-muted-foreground mx-1">/</span>
              <span className="text-muted-foreground">{Math.max(1, Math.ceil(total / PAGE_SIZE))}</span>
            </div>
            <Button
              variant="outline"
              size="icon"
              disabled={offset + PAGE_SIZE >= total}
              onClick={() => setOffset(offset + PAGE_SIZE)}
              className="size-7 rounded-[6px]"
              title="Berikutnya"
            >
              <ChevronRight className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={offset + PAGE_SIZE >= total}
              onClick={() => {
                const lastOffset = Math.floor((total - 1) / PAGE_SIZE) * PAGE_SIZE
                setOffset(Math.max(0, lastOffset))
              }}
              className="size-7 rounded-[6px]"
              title="Terakhir"
            >
              <ChevronsRight className="size-3.5" />
            </Button>
          </div>
        </div>
      )}
      <CreateDeviceDialog open={createOpen} onOpenChange={setCreateOpen} />
      <CreateScheduleDialog
        device={device}
        open={newScheduleOpen}
        initialPhone={initialPhone}
        onOpenChange={(op) => {
          setNewScheduleOpen(op)
          if (!op && searchParams.get('phone')) {
            searchParams.delete('phone')
            setSearchParams(searchParams, { replace: true })
          }
        }}
        onSuccess={refresh}
      />
      <ImportScheduleDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onSuccess={refresh}
      />
    </div>
  )
}

function CreateScheduleDialog({
  open,
  onOpenChange,
  onSuccess,
  device,
  initialPhone = '',
}: {
  device?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  initialPhone?: string
}) {
  const [phone, setPhone] = useState(initialPhone)
  const [message, setMessage] = useState('')
  const { draft, patch, reset: resetSchedule } = useScheduleDraft()

  useEffect(() => {
    if (initialPhone) setPhone(initialPhone)
  }, [initialPhone])

  const mutation = useActionMutation(
    (payload: Parameters<typeof sendText>[0]) => sendText(payload),
    {
      successMessage: 'Pesan berhasil dijadwalkan!',
      onSuccess: () => {
        setPhone('')
        setMessage('')
        resetSchedule()
        onOpenChange(false)
        onSuccess()
      },
    },
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone || !message) return
    mutation.mutate({
      phone: phone.trim(),
      message: message.trim(),
      ...draft,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Jadwalkan Pesan</DialogTitle>
            <DialogDescription>
              Kirim pesan otomatis pada waktu yang ditentukan.
            </DialogDescription>
          </DialogHeader>

          <PhoneNumberPicker
            id="sched-phone"
            value={phone}
            onChange={setPhone}
            deviceId={device}
            required
            label="Nomor Tujuan (Pilih Kontak / Riwayat)"
            placeholder="628xxxxxxxxxx"
          />

          <div className="flex flex-col gap-2">
            <Label htmlFor="sched-msg">Pesan</Label>
            <Textarea
              id="sched-msg"
              placeholder="Pesan"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>

          <div className="rounded-lg border p-3 bg-muted/20">
            <ScheduleFields draft={draft} patch={patch} />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || !phone || !message}
            >
              {mutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function ScheduledPage() {
  const device = useSelectedDevice()
  if (!device) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Terjadwal"
          description="Pesan tertunda dan berulang."
        />
        <DeviceGuard />
      </div>
    )
  }
  return <ScheduleTable key={device} device={device} />
}
