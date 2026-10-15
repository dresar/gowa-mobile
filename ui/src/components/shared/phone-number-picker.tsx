import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  BookUser,
  Check,
  Clock,
  History,
  Search,
  Trash2,
  User,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { getSavedContacts, saveContact, deleteSavedContact } from '@/api/contacts'
import { listContacts } from '@/api/user'
import { listSchedules } from '@/api/schedule'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface PhoneNumberPickerProps {
  id?: string
  value: string
  onChange: (value: string) => void
  deviceId?: string
  required?: boolean
  label?: string
  placeholder?: string
  className?: string
}

export function PhoneNumberPicker({
  id = 'phone-picker',
  value,
  onChange,
  deviceId,
  required,
  label = 'Nomor Tujuan',
  placeholder = '628xxxxxxxxxx',
  className,
}: PhoneNumberPickerProps) {
  const queryClient = useQueryClient()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [saveName, setSaveName] = useState('')
  const [saveNote, setSaveNote] = useState('')

  const { data: savedContacts = [] } = useQuery({
    queryKey: ['saved-contacts'],
    queryFn: getSavedContacts,
    staleTime: 60 * 1000,
  })

  const { data: waContactsData } = useQuery({
    queryKey: ['wa-contacts', deviceId],
    queryFn: () => listContacts(deviceId),
    enabled: Boolean(deviceId),
    staleTime: 2 * 60 * 1000,
  })

  const { data: scheduleData } = useQuery({
    queryKey: ['schedules', deviceId],
    queryFn: () => listSchedules({ limit: 50 }, deviceId),
    enabled: Boolean(deviceId),
    staleTime: 60 * 1000,
  })

  const saveMutation = useMutation({
    mutationFn: saveContact,
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['saved-contacts'] })
      toast.success(`Kontak "${saved.name}" berhasil disimpan ke database`)
      setSaveDialogOpen(false)
      setSaveName('')
      setSaveNote('')
    },
    onError: (err: any) => {
      toast.error('Gagal menyimpan kontak: ' + (err?.message || 'Kesalahan'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSavedContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-contacts'] })
      toast.success('Kontak dihapus')
    },
    onError: (err: any) => {
      toast.error('Gagal menghapus: ' + (err?.message || 'Kesalahan'))
    },
  })

  const recentHistoryNumbers = useMemo(() => {
    const list: { phone: string; summary?: string }[] = []
    const seen = new Set<string>()

    if (scheduleData?.data) {
      for (const item of scheduleData.data) {
        const clean = item.phone.replace(/[^0-9]/g, '')
        if (clean && !seen.has(clean)) {
          seen.add(clean)
          list.push({ phone: clean, summary: item.summary })
        }
      }
    }
    return list.slice(0, 10)
  }, [scheduleData])

  const waContacts = useMemo(() => {
    if (!waContactsData?.data) return []
    return waContactsData.data.map((c) => {
      const clean = c.jid ? c.jid.split('@')[0].replace(/[^0-9]/g, '') : ''
      const name = c.name || clean
      return { phone: clean, name }
    }).filter((c) => Boolean(c.phone))
  }, [waContactsData])

  const filteredSaved = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return savedContacts
    return savedContacts.filter(
      (c) =>
        c.phone.includes(q) ||
        c.name.toLowerCase().includes(q) ||
        (c.note && c.note.toLowerCase().includes(q)),
    )
  }, [savedContacts, searchQuery])

  const filteredWA = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return waContacts.slice(0, 20)
    return waContacts.filter(
      (c) => c.phone.includes(q) || c.name.toLowerCase().includes(q),
    ).slice(0, 20)
  }, [waContacts, searchQuery])

  const filteredHistory = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return recentHistoryNumbers.slice(0, 10)
    return recentHistoryNumbers.filter(
      (c) => c.phone.includes(q) || (c.summary && c.summary.toLowerCase().includes(q)),
    ).slice(0, 10)
  }, [recentHistoryNumbers, searchQuery])

  const handleSelectPhone = (phoneNum: string) => {
    const clean = phoneNum.replace(/[^0-9]/g, '')
    onChange(clean)
    setPickerOpen(false)
  }

  const handleOpenSaveDialog = () => {
    const clean = value.replace(/[^0-9]/g, '')
    if (!clean) {
      toast.error('Masukkan nomor telepon terlebih dahulu')
      return
    }
    const existing = savedContacts.find((c) => c.phone === clean)
    setSaveName(existing?.name || '')
    setSaveNote(existing?.note || '')
    setSaveDialogOpen(true)
  }

  const handleConfirmSave = (e: React.FormEvent) => {
    e.preventDefault()
    const clean = value.replace(/[^0-9]/g, '')
    if (!clean) return
    saveMutation.mutate({
      phone: clean,
      name: saveName.trim() || clean,
      note: saveNote.trim() || undefined,
    })
  }

  const isCurrentValueSaved = useMemo(() => {
    const clean = value.replace(/[^0-9]/g, '')
    return savedContacts.some((c) => c.phone === clean)
  }, [value, savedContacts])

  const chips = useMemo(() => {
    const items: { phone: string; label: string }[] = []
    const seen = new Set<string>()

    for (const sc of savedContacts.slice(0, 4)) {
      if (!seen.has(sc.phone)) {
        seen.add(sc.phone)
        items.push({ phone: sc.phone, label: sc.name || sc.phone })
      }
    }

    for (const rh of recentHistoryNumbers) {
      if (items.length >= 4) break
      if (!seen.has(rh.phone)) {
        seen.add(rh.phone)
        items.push({ phone: rh.phone, label: rh.phone })
      }
    }

    return items
  }, [savedContacts, recentHistoryNumbers])

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-xs font-semibold text-foreground">
          {label}
        </Label>
        <div className="flex items-center gap-1.5">
          {value.trim() && !isCurrentValueSaved && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleOpenSaveDialog}
              className="h-6 px-1.5 text-[11px] text-primary hover:bg-primary/10 gap-1 rounded-[5px]"
            >
              <UserPlus className="size-3" />
              <span>Simpan Nomor</span>
            </Button>
          )}
          {value.trim() && isCurrentValueSaved && (
            <span className="text-[10px] text-emerald-500 font-medium flex items-center gap-0.5">
              <Check className="size-3" />
              Tersimpan
            </span>
          )}
        </div>
      </div>

      <div className="relative flex items-center">
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="h-9 pr-20 text-xs font-mono"
        />
        <div className="absolute right-1 flex items-center gap-0.5">
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => onChange('')}
              className="size-6 text-muted-foreground hover:text-foreground"
              title="Bersihkan"
            >
              <X className="size-3" />
            </Button>
          )}

          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2 text-[11px] gap-1 rounded-[6px] border-primary/30 text-primary hover:bg-primary/10"
                title="Buku Kontak & Riwayat"
              >
                <BookUser className="size-3.5" />
                <span className="hidden sm:inline">Kontak</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-80 sm:w-96 p-0 glass-card rounded-xl shadow-xl overflow-hidden"
            >
              <div className="border-b p-2.5 bg-muted/30">
                <div className="relative flex items-center">
                  <Search className="size-3.5 absolute left-2.5 text-muted-foreground" />
                  <Input
                    placeholder="Cari nama atau nomor telepon..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 pl-8 text-xs bg-background/80"
                    autoFocus
                  />
                  {searchQuery && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-1 size-6"
                    >
                      <X className="size-3" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-border/40 p-1">
                {filteredSaved.length > 0 && (
                  <div className="py-1">
                    <div className="px-2.5 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <UserCheck className="size-3 text-primary" />
                      Kontak Tersimpan ({filteredSaved.length})
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {filteredSaved.map((item) => (
                        <div
                          key={item.phone}
                          className="group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs hover:bg-accent/60 transition-colors cursor-pointer"
                          onClick={() => handleSelectPhone(item.phone)}
                        >
                          <div className="min-w-0 flex flex-col">
                            <span className="font-semibold text-foreground truncate">
                              {item.name}
                            </span>
                            <span className="font-mono text-[11px] text-muted-foreground">
                              +{item.phone}
                              {item.note ? ` · ${item.note}` : ''}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteMutation.mutate(item.phone)
                              }}
                              className="size-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Hapus kontak tersimpan"
                            >
                              <Trash2 className="size-3" />
                            </Button>
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-mono">
                              Pilih
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {filteredHistory.length > 0 && (
                  <div className="py-1">
                    <div className="px-2.5 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <History className="size-3 text-amber-500" />
                      Riwayat Terjadwal ({filteredHistory.length})
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {filteredHistory.map((item) => (
                        <div
                          key={item.phone}
                          className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs hover:bg-accent/60 transition-colors cursor-pointer"
                          onClick={() => handleSelectPhone(item.phone)}
                        >
                          <div className="min-w-0 flex flex-col">
                            <span className="font-mono text-[11px] font-semibold text-foreground">
                              +{item.phone}
                            </span>
                            {item.summary && (
                              <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                                {item.summary}
                              </span>
                            )}
                          </div>
                          <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                            Pakai
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {filteredWA.length > 0 && (
                  <div className="py-1">
                    <div className="px-2.5 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <User className="size-3 text-emerald-500" />
                      Kontak WhatsApp ({filteredWA.length})
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {filteredWA.map((item) => (
                        <div
                          key={item.phone}
                          className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs hover:bg-accent/60 transition-colors cursor-pointer"
                          onClick={() => handleSelectPhone(item.phone)}
                        >
                          <div className="min-w-0 flex flex-col">
                            <span className="font-semibold text-foreground truncate">
                              {item.name}
                            </span>
                            <span className="font-mono text-[11px] text-muted-foreground">
                              +{item.phone}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-mono">
                            Pilih
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {filteredSaved.length === 0 && filteredHistory.length === 0 && filteredWA.length === 0 && (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    Tidak ditemukan kontak yang cocok
                  </div>
                )}
              </div>

              <div className="border-t p-2 bg-muted/20 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Klik item untuk memilih nomor</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPickerOpen(false)}
                  className="h-6 px-2 text-[11px]"
                >
                  Tutup
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 pt-0.5">
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <Clock className="size-2.5" />
            Cepat:
          </span>
          {chips.map((c) => (
            <button
              key={c.phone}
              type="button"
              onClick={() => handleSelectPhone(c.phone)}
              className={cn(
                'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-colors border',
                value.replace(/[^0-9]/g, '') === c.phone
                  ? 'bg-primary/20 text-primary border-primary/40 font-semibold'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted/80 hover:text-foreground border-border/40',
              )}
            >
              <span className="truncate max-w-[90px]">{c.label}</span>
            </button>
          ))}
        </div>
      )}

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleConfirmSave} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold flex items-center gap-1.5">
                <UserPlus className="size-4 text-primary" />
                Simpan ke Buku Kontak
              </DialogTitle>
              <DialogDescription className="text-xs">
                Simpan nomor ini ke database server agar tidak perlu mengetik manual lagi.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <Label htmlFor="contact-phone" className="text-xs">Nomor Telepon</Label>
                <Input
                  id="contact-phone"
                  value={value.replace(/[^0-9]/g, '')}
                  disabled
                  className="h-8 text-xs font-mono bg-muted/40"
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor="contact-name" className="text-xs">Nama Kontak</Label>
                <Input
                  id="contact-name"
                  placeholder="Contoh: Budi Kantor"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  className="h-8 text-xs"
                  required
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor="contact-note" className="text-xs">Catatan Tambahan (Opsional)</Label>
                <Input
                  id="contact-note"
                  placeholder="Contoh: Manajer Operasional"
                  value={saveNote}
                  onChange={(e) => setSaveNote(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSaveDialogOpen(false)}
                className="h-8 text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={saveMutation.isPending || !saveName.trim()}
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
