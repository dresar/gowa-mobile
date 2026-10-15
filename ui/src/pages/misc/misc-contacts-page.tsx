import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  BookUser,
  CalendarClock,
  Check,
  Copy,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
  User,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useSelectedDevice } from '@/hooks/use-device-guard'
import { listContacts, type ContactsResponse, type Contact } from '@/api/user'
import { getSavedContacts, saveContact, deleteSavedContact, type SavedContact } from '@/api/contacts'

export default function MiscContactsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const device = useSelectedDevice()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'wa' | 'saved'>('saved')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newPhone, setNewPhone] = useState('')
  const [newName, setNewName] = useState('')
  const [newNote, setNewNote] = useState('')

  const {
    data: contactsData,
    isLoading: isWaLoading,
    refetch: refetchWa,
    isFetching: isWaFetching,
  } = useQuery<ContactsResponse | null>({
    queryKey: ['user-contacts', device],
    queryFn: () => listContacts(device || undefined),
    enabled: Boolean(device),
  })

  const {
    data: savedContacts = [],
    isLoading: isSavedLoading,
    refetch: refetchSaved,
    isFetching: isSavedFetching,
  } = useQuery<SavedContact[]>({
    queryKey: ['saved-contacts'],
    queryFn: getSavedContacts,
  })

  const saveMutation = useMutation({
    mutationFn: saveContact,
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['saved-contacts'] })
      toast.success(`Kontak "${saved.name}" berhasil disimpan ke database`)
      setAddDialogOpen(false)
      setNewPhone('')
      setNewName('')
      setNewNote('')
    },
    onError: (err: any) => {
      toast.error('Gagal menyimpan kontak: ' + (err?.message || 'Kesalahan'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSavedContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-contacts'] })
      toast.success('Kontak dihapus dari database')
    },
    onError: (err: any) => {
      toast.error('Gagal menghapus: ' + (err?.message || 'Kesalahan'))
    },
  })

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} disalin ke papan klip`)
  }

  const allContacts: Contact[] = contactsData?.data || []
  const filteredWaContacts = allContacts.filter((c) => {
    const q = search.toLowerCase()
    return c.name?.toLowerCase().includes(q) || c.jid?.toLowerCase().includes(q)
  })

  const filteredSavedContacts = savedContacts.filter((c) => {
    const q = search.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.note && c.note.toLowerCase().includes(q))
    )
  })

  const handleExportCsv = () => {
    const dataToExport = activeTab === 'saved' ? savedContacts : allContacts
    if (dataToExport.length === 0) {
      toast.error('Tidak ada kontak untuk diekspor')
      return
    }
    const rows = ['Name,Phone,Note']
    if (activeTab === 'saved') {
      savedContacts.forEach((c) => {
        const safeName = (c.name || 'Unnamed').replace(/"/g, '""')
        const safeNote = (c.note || '').replace(/"/g, '""')
        rows.push(`"${safeName}","${c.phone}","${safeNote}"`)
      })
    } else {
      allContacts.forEach((c) => {
        const phone = c.jid?.split('@')[0] || ''
        const safeName = (c.name || 'Unnamed').replace(/"/g, '""')
        rows.push(`"${safeName}","${phone}",""`)
      })
    }
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `contacts-${activeTab}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Daftar kontak berhasil diekspor ke CSV')
  }

  const handleCopyAllPhones = () => {
    const list = activeTab === 'saved' ? savedContacts.map((c) => c.phone) : allContacts.map((c) => c.jid?.split('@')[0]).filter(Boolean)
    if (list.length === 0) return
    copyToClipboard(list.join(', '), `${list.length} nomor kontak`)
  }

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const clean = newPhone.replace(/[^0-9]/g, '')
    if (!clean) {
      toast.error('Nomor telepon wajib diisi')
      return
    }
    saveMutation.mutate({
      phone: clean,
      name: newName.trim() || clean,
      note: newNote.trim() || undefined,
    })
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <PageHeader
        title="Direktori Kontak"
        description="Kelola buku kontak server dan cari kontak WhatsApp untuk kirim pesan cepat atau penjadwalan otomatis."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {activeTab === 'saved' && (
              <Button
                size="sm"
                onClick={() => setAddDialogOpen(true)}
                className="h-8 text-xs gap-1.5"
              >
                <Plus className="size-3.5" />
                Tambah Kontak
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              disabled={isWaFetching || isSavedFetching}
              onClick={() => {
                if (activeTab === 'saved') void refetchSaved()
                else void refetchWa()
              }}
              className="h-8 text-xs gap-1.5"
            >
              <RefreshCw className={`size-3.5 ${isWaFetching || isSavedFetching ? 'animate-spin' : ''}`} />
              Segarkan
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={activeTab === 'saved' ? savedContacts.length === 0 : allContacts.length === 0}
              onClick={handleExportCsv}
              className="h-8 text-xs gap-1.5"
            >
              <FileSpreadsheet className="size-3.5" />
              Ekspor CSV
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={activeTab === 'saved' ? savedContacts.length === 0 : allContacts.length === 0}
              onClick={handleCopyAllPhones}
              className="h-8 text-xs gap-1.5"
            >
              <Copy className="size-3.5" />
              Salin Semua
            </Button>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'wa' | 'saved')}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <TabsList className="h-8 p-0.5">
            <TabsTrigger value="saved" className="text-xs gap-1.5 px-3 h-7">
              <BookUser className="size-3.5" />
              Buku Kontak Server ({savedContacts.length})
            </TabsTrigger>
            <TabsTrigger value="wa" className="text-xs gap-1.5 px-3 h-7">
              <Users className="size-3.5" />
              Kontak WhatsApp ({allContacts.length})
            </TabsTrigger>
          </TabsList>

          <div className="relative w-full sm:w-64">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
            <Input
              placeholder="Cari nama atau nomor…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs h-8"
            />
          </div>
        </div>

        <TabsContent value="saved" className="mt-4">
          <Card className="glass-card rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <BookUser className="size-4 text-primary" />
                Buku Kontak Tersimpan di Server (JSON / Database)
              </CardTitle>
              <CardDescription className="text-xs">
                Nomor kontak yang tersimpan permanen agar form pesan terjadwal dan pengiriman tidak perlu mengetik ulang.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isSavedLoading ? (
                <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : filteredSavedContacts.length === 0 ? (
                <div className="text-muted-foreground flex flex-col items-center justify-center py-10 text-center gap-2">
                  <BookUser className="size-8 opacity-40" />
                  <p className="text-xs font-medium">Belum ada kontak tersimpan</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAddDialogOpen(true)}
                    className="h-7 text-xs gap-1 mt-1"
                  >
                    <Plus className="size-3" />
                    Tambah Kontak Pertama
                  </Button>
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 max-h-[600px] overflow-y-auto pr-1">
                  {filteredSavedContacts.map((contact) => (
                    <div
                      key={contact.phone}
                      className="border-border/60 bg-muted/20 hover:bg-muted/40 flex items-center justify-between gap-2 rounded-lg border p-2.5 text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="border-border bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full border font-semibold text-[10px]">
                          {contact.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-foreground truncate">
                            {contact.name}
                          </span>
                          <span className="font-mono text-muted-foreground text-[10px] truncate">
                            +{contact.phone}
                          </span>
                          {contact.note && (
                            <span className="text-muted-foreground text-[10px] truncate italic">
                              {contact.note}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => navigate(`/scheduled?phone=${contact.phone}`)}
                          className="size-7 text-muted-foreground hover:text-amber-500"
                          title="Jadwalkan pesan"
                        >
                          <CalendarClock className="size-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => navigate(`/messaging?phone=${contact.phone}`)}
                          className="size-7 text-muted-foreground hover:text-primary"
                          title="Kirim pesan"
                        >
                          <Send className="size-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => copyToClipboard(contact.phone, 'Nomor')}
                          className="size-7 text-muted-foreground hover:text-foreground"
                          title="Salin nomor"
                        >
                          <Copy className="size-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(contact.phone)}
                          disabled={deleteMutation.isPending}
                          className="size-7 text-muted-foreground hover:text-destructive"
                          title="Hapus kontak"
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wa" className="mt-4">
          <Card className="glass-card rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Users className="size-4 text-primary" />
                Daftar Kontak WhatsApp ({allContacts.length})
              </CardTitle>
              <CardDescription className="text-xs">
                Cari kontak yang terhubung di sesi WhatsApp aktif Anda.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isWaLoading ? (
                <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : filteredWaContacts.length === 0 ? (
                <div className="text-muted-foreground flex flex-col items-center justify-center py-10 text-center gap-2">
                  <User className="size-8 opacity-40" />
                  <p className="text-xs font-medium">Tidak ada kontak WhatsApp yang cocok</p>
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 max-h-[600px] overflow-y-auto pr-1">
                  {filteredWaContacts.map((contact) => {
                    const phone = contact.jid?.split('@')[0] || ''
                    return (
                      <div
                        key={contact.jid}
                        className="border-border/60 bg-muted/20 hover:bg-muted/40 flex items-center justify-between gap-2 rounded-lg border p-2.5 text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="border-border bg-background flex size-8 shrink-0 items-center justify-center rounded-full border text-muted-foreground font-semibold text-[10px]">
                            {contact.name ? contact.name.slice(0, 2).toUpperCase() : 'WA'}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-foreground truncate">
                              {contact.name || 'Tanpa Nama'}
                            </span>
                            <span className="font-mono text-muted-foreground text-[10px] truncate">
                              +{phone}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              saveMutation.mutate({
                                phone,
                                name: contact.name || phone,
                              })
                            }}
                            className="size-7 text-muted-foreground hover:text-emerald-500"
                            title="Simpan ke buku kontak server"
                          >
                            <UserCheck className="size-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => navigate(`/scheduled?phone=${phone}`)}
                            className="size-7 text-muted-foreground hover:text-amber-500"
                            title="Jadwalkan pesan"
                          >
                            <CalendarClock className="size-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => navigate(`/messaging?phone=${phone}`)}
                            className="size-7 text-muted-foreground hover:text-primary"
                            title="Kirim pesan"
                          >
                            <Send className="size-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => copyToClipboard(phone, 'Nomor')}
                            className="size-7 text-muted-foreground hover:text-foreground"
                            title="Salin nomor"
                          >
                            <Copy className="size-3" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSaveSubmit} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold flex items-center gap-1.5">
                <UserPlus className="size-4 text-primary" />
                Tambah Kontak Baru
              </DialogTitle>
              <DialogDescription className="text-xs">
                Simpan nomor kontak baru ke database server agar mudah diakses saat mengirim atau menjadwalkan pesan.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <Label htmlFor="new-phone" className="text-xs">Nomor Telepon (WhatsApp)</Label>
                <Input
                  id="new-phone"
                  placeholder="Contoh: 6281234567890"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="h-8 text-xs font-mono"
                  required
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor="new-name" className="text-xs">Nama Kontak</Label>
                <Input
                  id="new-name"
                  placeholder="Contoh: Budi Santoso"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="h-8 text-xs"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor="new-note" className="text-xs">Catatan Tambahan (Opsional)</Label>
                <Input
                  id="new-note"
                  placeholder="Contoh: Pelanggan Setia / Kantor"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAddDialogOpen(false)}
                className="h-8 text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={saveMutation.isPending || !newPhone.trim()}
                className="h-8 text-xs gap-1.5"
              >
                <Check className="size-3.5" />
                {saveMutation.isPending ? 'Menyimpan...' : 'Simpan Kontak'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
