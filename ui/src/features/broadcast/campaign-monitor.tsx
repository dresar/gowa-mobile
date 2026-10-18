import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Eye,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  cancelCampaign,
  deleteCampaign,
  getCampaign,
  listCampaigns,
  pauseCampaign,
  resumeCampaign,
  retryCampaign,
  type BroadcastCampaign,
  type BroadcastRecipient,
  type CampaignStatus,
} from '@/api/broadcast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { onWsEvent } from '@/lib/events'
import { exportToCsv } from './spintax-helper'

const STATUS_MAP: Record<CampaignStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; className: string }> = {
  draft: { label: 'Draf', variant: 'outline', className: 'text-muted-foreground border-border' },
  scheduled: { label: 'Terjadwal', variant: 'outline', className: 'text-sky-500 border-sky-500/30 bg-sky-500/10' },
  running: { label: 'Berjalan', variant: 'default', className: 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10' },
  paused: { label: 'Dijeda', variant: 'secondary', className: 'text-amber-500 border-amber-500/30 bg-amber-500/10' },
  completed: { label: 'Selesai', variant: 'outline', className: 'text-blue-500 border-blue-500/30 bg-blue-500/10' },
  cancelled: { label: 'Dibatalkan', variant: 'outline', className: 'text-zinc-500 border-zinc-500/30 bg-zinc-500/10' },
  failed: { label: 'Gagal', variant: 'destructive', className: 'text-rose-500 border-rose-500/30 bg-rose-500/10' },
}

interface CampaignMonitorProps {
  selectedCampaignId?: string | null
}

export function CampaignMonitor({ selectedCampaignId }: CampaignMonitorProps) {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeDetailId, setActiveDetailId] = useState<string | null>(null)
  const [recipientStatusFilter, setRecipientStatusFilter] = useState('all')

  const { data: campaignList, isLoading, refetch } = useQuery({
    queryKey: ['broadcast-campaigns', statusFilter, searchTerm],
    queryFn: () =>
      listCampaigns({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm.trim() || undefined,
        limit: 50,
      }),
    refetchInterval: 5000,
  })

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['broadcast-campaign-detail', activeDetailId],
    queryFn: () => (activeDetailId ? getCampaign(activeDetailId, 200, 0) : null),
    enabled: !!activeDetailId,
  })

  useEffect(() => {
    return onWsEvent((event) => {
      if (event.code === 'CAMPAIGN_PROGRESS' || event.code === 'CAMPAIGN_UPDATED') {
        void queryClient.invalidateQueries({ queryKey: ['broadcast-campaigns'] })
        if (activeDetailId) {
          void queryClient.invalidateQueries({
            queryKey: ['broadcast-campaign-detail', activeDetailId],
          })
        }
      }
    })
  }, [queryClient, activeDetailId])

  const activeCampaign =
    (selectedCampaignId && campaignList?.data?.find((c) => c.id === selectedCampaignId)) ||
    campaignList?.data?.find((c) => c.status === 'running' || c.status === 'paused') ||
    campaignList?.data?.[0]

  const pauseMutation = useMutation({
    mutationFn: (id: string) => pauseCampaign(id),
    onSuccess: () => {
      toast.success('Kampanye berhasil dijeda')
      void queryClient.invalidateQueries({ queryKey: ['broadcast-campaigns'] })
    },
    onError: (err: any) => toast.error(err?.message || 'Gagal menjeda kampanye'),
  })

  const resumeMutation = useMutation({
    mutationFn: (id: string) => resumeCampaign(id),
    onSuccess: () => {
      toast.success('Kampanye berhasil dilanjutkan')
      void queryClient.invalidateQueries({ queryKey: ['broadcast-campaigns'] })
    },
    onError: (err: any) => toast.error(err?.message || 'Gagal melanjutkan kampanye'),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelCampaign(id),
    onSuccess: () => {
      toast.success('Kampanye berhasil dibatalkan')
      void queryClient.invalidateQueries({ queryKey: ['broadcast-campaigns'] })
    },
    onError: (err: any) => toast.error(err?.message || 'Gagal membatalkan kampanye'),
  })

  const retryMutation = useMutation({
    mutationFn: (id: string) => retryCampaign(id),
    onSuccess: () => {
      toast.success('Penerima gagal berhasil diantrekan ulang')
      void queryClient.invalidateQueries({ queryKey: ['broadcast-campaigns'] })
      if (activeDetailId) {
        void queryClient.invalidateQueries({
          queryKey: ['broadcast-campaign-detail', activeDetailId],
        })
      }
    },
    onError: (err: any) => toast.error(err?.message || 'Gagal mengantrekan ulang penerima'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCampaign(id),
    onSuccess: () => {
      toast.success('Kampanye berhasil dihapus')
      void queryClient.invalidateQueries({ queryKey: ['broadcast-campaigns'] })
      if (activeDetailId) {
        setActiveDetailId(null)
      }
    },
    onError: (err: any) => toast.error(err?.message || 'Gagal menghapus kampanye'),
  })

  const handleExportAuditCsv = (campaign: BroadcastCampaign, recipients: BroadcastRecipient[]) => {
    const headers = ['Nomor Telepon', 'Status', 'Waktu Kirim', 'Pesan Error', 'Variabel JSON']
    const rows = recipients.map((r) => [
      r.phone,
      r.status,
      r.sent_at || '',
      r.error_message || '',
      r.variables_json,
    ])
    exportToCsv(`audit_broadcast_${campaign.name.replace(/\s+/g, '_')}_${campaign.id.slice(0, 8)}`, headers, rows)
    toast.success('Audit log berhasil diekspor ke CSV')
  }

  const filteredRecipients = detailData?.recipients?.filter((r) => {
    if (recipientStatusFilter === 'all') return true
    return r.status === recipientStatusFilter
  })

  return (
    <div className="flex flex-col gap-6 w-full min-w-0">
      {activeCampaign && (
        <Card className="border border-primary/30 bg-primary/[0.02] backdrop-blur-md shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-bold">{activeCampaign.name}</CardTitle>
                  <Badge variant="outline" className={STATUS_MAP[activeCampaign.status]?.className}>
                    {STATUS_MAP[activeCampaign.status]?.label || activeCampaign.status}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  ID: {activeCampaign.id} • Dibuat: {new Date(activeCampaign.created_at).toLocaleString()}
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                {activeCampaign.status === 'running' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1 border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
                    onClick={() => pauseMutation.mutate(activeCampaign.id)}
                    disabled={pauseMutation.isPending}
                  >
                    <Pause className="size-3.5" />
                    Jeda
                  </Button>
                )}
                {activeCampaign.status === 'paused' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                    onClick={() => resumeMutation.mutate(activeCampaign.id)}
                    disabled={resumeMutation.isPending}
                  >
                    <Play className="size-3.5" />
                    Lanjutkan
                  </Button>
                )}
                {(activeCampaign.status === 'running' || activeCampaign.status === 'paused') && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                    onClick={() => cancelMutation.mutate(activeCampaign.id)}
                    disabled={cancelMutation.isPending}
                  >
                    <XCircle className="size-3.5" />
                    Batalkan
                  </Button>
                )}
                {activeCampaign.failed_count > 0 && activeCampaign.status !== 'running' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10"
                    onClick={() => retryMutation.mutate(activeCampaign.id)}
                    disabled={retryMutation.isPending}
                  >
                    <RotateCcw className="size-3.5" />
                    Ulangi Gagal ({activeCampaign.failed_count})
                  </Button>
                )}
                {['draft', 'cancelled', 'completed', 'failed'].includes(activeCampaign.status) && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      if (window.confirm(`Hapus kampanye "${activeCampaign.name}"?`)) {
                        deleteMutation.mutate(activeCampaign.id)
                      }
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="size-3.5" />
                    Hapus
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1"
                  onClick={() => setActiveDetailId(activeCampaign.id)}
                >
                  <Eye className="size-3.5" />
                  Audit Detail
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>Kemajuan Pengiriman</span>
                <span>
                  {Math.round(
                    activeCampaign.total_recipients > 0
                      ? ((activeCampaign.sent_count + activeCampaign.skipped_count + activeCampaign.failed_count) /
                          activeCampaign.total_recipients) *
                          100
                      : 0,
                  )}
                  %
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 rounded-full"
                  style={{
                    width: `${
                      activeCampaign.total_recipients > 0
                        ? ((activeCampaign.sent_count + activeCampaign.skipped_count + activeCampaign.failed_count) /
                            activeCampaign.total_recipients) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg border border-border/60 bg-card flex flex-col gap-0.5">
                <span className="text-[11px] text-muted-foreground font-medium">Total Sasaran</span>
                <span className="text-lg font-bold font-mono">{activeCampaign.total_recipients}</span>
              </div>
              <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 flex flex-col gap-0.5">
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="size-3" /> Berhasil Terkirim
                </span>
                <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {activeCampaign.sent_count}
                </span>
              </div>
              <div className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/5 flex flex-col gap-0.5">
                <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
                  <AlertCircle className="size-3" /> Gagal
                </span>
                <span className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400">
                  {activeCampaign.failed_count}
                </span>
              </div>
              <div className="p-3 rounded-lg border border-border/60 bg-muted/40 flex flex-col gap-0.5">
                <span className="text-[11px] text-muted-foreground font-medium">Dilewati (Bukan WA)</span>
                <span className="text-lg font-bold font-mono text-muted-foreground">
                  {activeCampaign.skipped_count}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border border-border/80 bg-card/60 backdrop-blur-md shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold">Riwayat Kampanye Broadcast</CardTitle>
              <CardDescription className="text-xs">
                Daftar seluruh kampanye yang telah dijadwalkan, sedang berjalan, atau selesai.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-48 sm:w-60">
                <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari kampanye..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8 pl-8 text-xs"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 text-xs w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Semua Status</SelectItem>
                  <SelectItem value="running" className="text-xs">Berjalan</SelectItem>
                  <SelectItem value="paused" className="text-xs">Dijeda</SelectItem>
                  <SelectItem value="completed" className="text-xs">Selesai</SelectItem>
                  <SelectItem value="scheduled" className="text-xs">Terjadwal</SelectItem>
                  <SelectItem value="failed" className="text-xs">Gagal</SelectItem>
                  <SelectItem value="cancelled" className="text-xs">Dibatalkan</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs"
                onClick={() => refetch()}
              >
                <RefreshCw className="size-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 hover:bg-transparent">
                  <TableHead className="text-xs">Nama Kampanye</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Terkirim / Total</TableHead>
                  <TableHead className="text-xs">Gagal / Skip</TableHead>
                  <TableHead className="text-xs">Waktu Dibuat</TableHead>
                  <TableHead className="text-xs text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                      <Loader2 className="size-4 animate-spin inline-block mr-2" />
                      Memuat daftar kampanye...
                    </TableCell>
                  </TableRow>
                ) : campaignList?.data?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                      Belum ada kampanye broadcast ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  campaignList?.data?.map((camp) => (
                    <TableRow key={camp.id} className="border-border/60 hover:bg-muted/40">
                      <TableCell className="font-medium text-xs">
                        <div className="flex flex-col">
                          <span>{camp.name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {camp.id.slice(0, 8)}...
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${STATUS_MAP[camp.status]?.className}`}>
                          {STATUS_MAP[camp.status]?.label || camp.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {camp.sent_count} / {camp.total_recipients}
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        <span className="text-rose-500">{camp.failed_count}</span> /{' '}
                        <span className="text-muted-foreground">{camp.skipped_count}</span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(camp.created_at).toLocaleDateString()} {new Date(camp.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-[11px] gap-1"
                            onClick={() => setActiveDetailId(camp.id)}
                          >
                            <Eye className="size-3" />
                            Detail
                          </Button>
                          {camp.status === 'running' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-[11px] text-amber-500"
                              onClick={() => pauseMutation.mutate(camp.id)}
                            >
                              <Pause className="size-3" />
                            </Button>
                          )}
                          {camp.status === 'paused' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-[11px] text-emerald-500"
                              onClick={() => resumeMutation.mutate(camp.id)}
                            >
                              <Play className="size-3" />
                            </Button>
                          )}
                          {['draft', 'cancelled', 'completed', 'failed'].includes(camp.status) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-[11px] text-destructive hover:bg-destructive/10"
                              title="Hapus Kampanye"
                              onClick={() => {
                                if (window.confirm(`Hapus kampanye "${camp.name}"?`)) {
                                  deleteMutation.mutate(camp.id)
                                }
                              }}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!activeDetailId} onOpenChange={(open) => !open && setActiveDetailId(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-6">
          <DialogHeader className="pb-3 border-b border-border/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  {detailData?.campaign?.name}
                  {detailData?.campaign && (
                    <Badge variant="outline" className={STATUS_MAP[detailData.campaign.status]?.className}>
                      {STATUS_MAP[detailData.campaign.status]?.label || detailData.campaign.status}
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="text-xs pt-1">
                  ID: {detailData?.campaign?.id} • Template: &quot;{detailData?.campaign?.message_template.slice(0, 60)}...&quot;
                </DialogDescription>
              </div>

              {detailData?.campaign && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1"
                    onClick={() =>
                      handleExportAuditCsv(detailData.campaign, detailData.recipients || [])
                    }
                  >
                    <Download className="size-3.5" />
                    Ekspor CSV
                  </Button>
                  {['draft', 'cancelled', 'completed', 'failed'].includes(
                    detailData.campaign.status,
                  ) && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        if (window.confirm(`Hapus kampanye "${detailData.campaign.name}"?`)) {
                          deleteMutation.mutate(detailData.campaign.id)
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="size-3.5" />
                      Hapus
                    </Button>
                  )}
                </div>
              )}
            </div>
          </DialogHeader>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Filter Status:</span>
              <Select value={recipientStatusFilter} onValueChange={setRecipientStatusFilter}>
                <SelectTrigger className="h-7 text-xs w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Semua Penerima</SelectItem>
                  <SelectItem value="sent" className="text-xs">Terkirim (Sent)</SelectItem>
                  <SelectItem value="failed" className="text-xs">Gagal (Failed)</SelectItem>
                  <SelectItem value="skipped_not_wa" className="text-xs">Bukan WhatsApp</SelectItem>
                  <SelectItem value="pending" className="text-xs">Menunggu (Pending)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              Menampilkan {filteredRecipients?.length || 0} dari {detailData?.recipients?.length || 0}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto border border-border/60 rounded-lg min-h-[300px]">
            <Table>
              <TableHeader className="bg-muted/30 sticky top-0">
                <TableRow className="border-border/60">
                  <TableHead className="text-xs">Nomor Penerima</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Waktu Eksekusi</TableHead>
                  <TableHead className="text-xs">Keterangan / Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detailLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-xs text-muted-foreground">
                      <Loader2 className="size-4 animate-spin inline-block mr-2" />
                      Memuat daftar penerima...
                    </TableCell>
                  </TableRow>
                ) : filteredRecipients?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-xs text-muted-foreground">
                      Tidak ada data penerima sesuai filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecipients?.map((rec) => (
                    <TableRow key={rec.id} className="border-border/60 text-xs">
                      <TableCell className="font-mono font-medium">{rec.phone}</TableCell>
                      <TableCell>
                        {rec.status === 'sent' && (
                          <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/30 bg-emerald-500/10">
                            Terkirim
                          </Badge>
                        )}
                        {rec.status === 'failed' && (
                          <Badge variant="outline" className="text-[10px] text-rose-500 border-rose-500/30 bg-rose-500/10">
                            Gagal
                          </Badge>
                        )}
                        {rec.status === 'skipped_not_wa' && (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground border-border bg-muted/40">
                            Bukan WA
                          </Badge>
                        )}
                        {rec.status === 'pending' && (
                          <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/30 bg-amber-500/10">
                            Menunggu
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {rec.sent_at ? new Date(rec.sent_at).toLocaleTimeString() : '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate" title={rec.error_message}>
                        {rec.error_message || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
