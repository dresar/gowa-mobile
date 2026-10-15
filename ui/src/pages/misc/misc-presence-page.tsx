import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Radio, Send } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { sendPresence, sendChatPresence } from '@/api/send'

export default function MiscPresencePage() {
  const [globalPresence, setGlobalPresence] = useState('available')
  const [targetPhone, setTargetPhone] = useState('')
  const [chatAction, setChatAction] = useState('composing')

  const globalPresenceMutation = useMutation({
    mutationFn: (type: string) => sendPresence({ type }),
    onSuccess: (_, type) => {
      toast.success(`Status kehadiran global diatur ke: ${type}`)
    },
    onError: (err: any) => {
      toast.error('Gagal mengatur kehadiran: ' + (err?.message || 'Error'))
    },
  })

  const chatPresenceMutation = useMutation({
    mutationFn: (payload: { phone: string; action: string }) => sendChatPresence(payload),
    onSuccess: (_, vars) => {
      toast.success(`Sinyal ${vars.action} terkirim ke ${vars.phone}`)
    },
    onError: (err: any) => {
      toast.error('Gagal mengirim sinyal chat: ' + (err?.message || 'Error'))
    },
  })

  const handleSendChatPresence = (e: React.FormEvent) => {
    e.preventDefault()
    const clean = targetPhone.replace(/[^0-9]/g, '')
    if (!clean) {
      toast.error('Masukkan nomor telepon target yang valid')
      return
    }
    chatPresenceMutation.mutate({ phone: clean, action: chatAction })
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <PageHeader
        title="Presensi & Status Kehadiran"
        description="Atur status online global ke server WhatsApp. Anda juga dapat mengirim sinyal sedang mengetik atau merekam audio ke kontak tertentu."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass-card rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Radio className="size-4 text-primary" />
              Kehadiran Global Akun
            </CardTitle>
            <CardDescription className="text-xs">
              Ubah status online perangkat di server WhatsApp agar kontak melihat Anda aktif atau tidak aktif.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-xs">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Pilih Status Kehadiran</Label>
              <Select value={globalPresence} onValueChange={setGlobalPresence}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Tersedia (Online)</SelectItem>
                  <SelectItem value="unavailable">Tidak Tersedia (Offline)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              size="sm"
              disabled={globalPresenceMutation.isPending}
              onClick={() => globalPresenceMutation.mutate(globalPresence)}
              className="w-full sm:w-auto h-8 text-xs gap-1.5 self-start"
            >
              <Radio className="size-3.5" />
              {globalPresenceMutation.isPending ? 'Mengirim…' : 'Terapkan Kehadiran'}
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Send className="size-4 text-primary" />
              Sinyal Interaksi Obrolan
            </CardTitle>
            <CardDescription className="text-xs">
              Kirim indikator interaksi langsung ke kontak obrolan tanpa mengirim pesan teks riil.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-xs">
            <form onSubmit={handleSendChatPresence} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="target-phone" className="text-xs">
                  Nomor Telepon Kontak
                </Label>
                <Input
                  id="target-phone"
                  placeholder="628123456789 (kode negara tanpa +)"
                  value={targetPhone}
                  onChange={(e) => setTargetPhone(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Jenis Sinyal</Label>
                <Select value={chatAction} onValueChange={setChatAction}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Pilih sinyal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="composing">Sedang Mengetik (Typing…)</SelectItem>
                    <SelectItem value="recording">Sedang Merekam Audio (Recording…)</SelectItem>
                    <SelectItem value="paused">Berhenti Interaksi (Idle)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                size="sm"
                disabled={chatPresenceMutation.isPending}
                className="w-full sm:w-auto h-8 text-xs gap-1.5 self-start mt-1"
              >
                <Send className="size-3.5" />
                {chatPresenceMutation.isPending ? 'Mengirim Sinyal…' : 'Kirim Sinyal'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
