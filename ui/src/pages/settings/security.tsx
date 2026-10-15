import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { InfoHint } from '@/components/ui/info-hint'
import { changeAppPIN } from '@/api/settings'

export default function SettingsSecurityPage() {
  const [oldPin, setOldPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [showOldPin, setShowOldPin] = useState(false)
  const [showNewPin, setShowNewPin] = useState(false)
  const [showConfirmPin, setShowConfirmPin] = useState(false)

  const mutation = useMutation({
    mutationFn: changeAppPIN,
    onSuccess: () => {
      setOldPin('')
      setNewPin('')
      setConfirmPin('')
      toast.success('PIN diperbarui')
    },
    onError: (err: any) => {
      toast.error('Gagal mengganti PIN: ' + (err?.message || 'Kesalahan sistem'))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!oldPin || !newPin) {
      toast.error('Lengkapi semua kolom')
      return
    }
    if (newPin.length < 4) {
      toast.error('PIN baru minimal 4 angka')
      return
    }
    if (newPin !== confirmPin) {
      toast.error('Konfirmasi PIN tidak cocok')
      return
    }
    mutation.mutate({ old_pin: oldPin, new_pin: newPin })
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="glass-card rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="size-4 text-primary" />
            <span>Ubah PIN Akses</span>
            <InfoHint
              title="Keamanan PIN"
              description="PIN digunakan untuk autentikasi dasbor web dan enkripsi sesi."
              items={[
                'Minimal 4 digit angka numerik.',
                'Sesi aktif berlaku selama 30 hari.',
              ]}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="old-pin" className="text-xs">PIN Saat Ini</Label>
              <div className="relative">
                <Input
                  id="old-pin"
                  type={showOldPin ? 'text' : 'password'}
                  value={oldPin}
                  onChange={(e) => setOldPin(e.target.value)}
                  placeholder="PIN"
                  className="text-xs pr-8"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowOldPin(!showOldPin)}
                  className="text-muted-foreground hover:text-foreground absolute right-2.5 top-2"
                >
                  {showOldPin ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-pin" className="text-xs">PIN Baru</Label>
              <div className="relative">
                <Input
                  id="new-pin"
                  type={showNewPin ? 'text' : 'password'}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="PIN"
                  className="text-xs pr-8"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPin(!showNewPin)}
                  className="text-muted-foreground hover:text-foreground absolute right-2.5 top-2"
                >
                  {showNewPin ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirm-pin" className="text-xs">Konfirmasi PIN Baru</Label>
              <div className="relative">
                <Input
                  id="confirm-pin"
                  type={showConfirmPin ? 'text' : 'password'}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="PIN"
                  className="text-xs pr-8"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPin(!showConfirmPin)}
                  className="text-muted-foreground hover:text-foreground absolute right-2.5 top-2"
                >
                  {showConfirmPin ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              size="sm"
              disabled={mutation.isPending}
              className="mt-1 h-8 text-xs"
            >
              {mutation.isPending ? 'Memproses…' : 'Ganti PIN'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="glass-card rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Lock className="size-4 text-primary" />
            <span>Sesi Keamanan</span>
            <InfoHint
              title="Informasi Sesi"
              description="Kebijakan masa berlaku dan enkripsi token dasbor."
              items={[
                'Menggunakan autentikasi berbasis HMAC Token.',
                'Masa berlaku sesi login 30 hari.',
              ]}
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 text-xs">
          <div className="border-border/50 bg-muted/20 rounded-lg border p-2.5">
            <span className="text-muted-foreground text-[10px]">Autentikasi Sesi</span>
            <p className="font-mono font-medium">HMAC Token</p>
          </div>
          <div className="border-border/50 bg-muted/20 rounded-lg border p-2.5">
            <span className="text-muted-foreground text-[10px]">Masa Berlaku</span>
            <p className="font-mono font-medium">30 Hari</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
