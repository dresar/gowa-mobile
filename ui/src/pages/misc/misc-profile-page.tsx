import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { RefreshCw, Shield, Upload, User } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useSelectedDevice } from '@/hooks/use-device-guard'
import {
  changePushName,
  changeAvatar,
  getPrivacy,
  type PrivacyResponse,
} from '@/api/user'

export default function MiscProfilePage() {
  const queryClient = useQueryClient()
  const device = useSelectedDevice()

  const [pushName, setPushName] = useState('')
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  const { data: privacyData, isLoading: isLoadingPrivacy, refetch: refetchPrivacy } =
    useQuery<PrivacyResponse | null>({
      queryKey: ['user-privacy', device],
      queryFn: () => getPrivacy(device || undefined),
      enabled: Boolean(device),
    })

  const pushNameMutation = useMutation({
    mutationFn: changePushName,
    onSuccess: () => {
      toast.success('Nama tampilan berhasil diperbarui')
      setPushName('')
    },
    onError: (err: any) => {
      toast.error('Gagal memperbarui nama: ' + (err?.message || 'Error'))
    },
  })

  const avatarMutation = useMutation({
    mutationFn: changeAvatar,
    onSuccess: () => {
      toast.success('Foto profil berhasil diunggah')
      setAvatarFile(null)
      setAvatarPreview(null)
      queryClient.invalidateQueries({ queryKey: ['user-avatar'] })
    },
    onError: (err: any) => {
      toast.error('Gagal mengunggah foto profil: ' + (err?.message || 'Error'))
    },
  })

  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePushNameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!pushName.trim()) {
      toast.error('Nama tampilan tidak boleh kosong')
      return
    }
    pushNameMutation.mutate(pushName.trim())
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <PageHeader
        title="Profil & Privasi Akun"
        description="Perbarui nama tampilan push name dan foto profil akun WhatsApp Anda. Tinjau pengaturan privasi status, avatar, dan tanda terima pesan."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Card className="glass-card rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <User className="size-4 text-primary" />
                Ubah Nama Tampilan (Push Name)
              </CardTitle>
              <CardDescription className="text-xs">
                Perbarui nama yang dilihat oleh orang lain saat Anda mengirim pesan atau bergabung ke grup.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePushNameSubmit} className="flex flex-col gap-3 text-xs">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="push-name" className="text-xs">
                    Nama Baru
                  </Label>
                  <Input
                    id="push-name"
                    placeholder="Masukkan nama tampilan baru"
                    value={pushName}
                    onChange={(e) => setPushName(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <Button
                  type="submit"
                  size="sm"
                  disabled={pushNameMutation.isPending || !pushName.trim()}
                  className="w-full sm:w-auto h-8 text-xs gap-1.5 self-start"
                >
                  <User className="size-3.5" />
                  {pushNameMutation.isPending ? 'Menyimpan…' : 'Simpan Nama'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="glass-card rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Upload className="size-4 text-primary" />
                Unggah Foto Profil Baru
              </CardTitle>
              <CardDescription className="text-xs">
                Pilih berkas foto JPEG/PNG untuk mengganti foto profil akun WhatsApp aktif.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-xs">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarFileSelect}
              />

              <div className="flex items-center gap-3">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Preview"
                    className="size-16 rounded-xl object-cover border border-border"
                  />
                ) : (
                  <div className="border-border bg-muted/40 text-muted-foreground flex size-16 items-center justify-center rounded-xl border">
                    <User className="size-6 opacity-40" />
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => avatarInputRef.current?.click()}
                    className="h-7 text-xs gap-1"
                  >
                    <Upload className="size-3" />
                    Pilih Berkas Foto
                  </Button>
                  {avatarFile && (
                    <span className="text-muted-foreground text-[10px] truncate max-w-[200px]">
                      {avatarFile.name}
                    </span>
                  )}
                </div>
              </div>

              {avatarFile && (
                <Button
                  size="sm"
                  disabled={avatarMutation.isPending}
                  onClick={() => avatarMutation.mutate(avatarFile)}
                  className="w-full sm:w-auto h-8 text-xs gap-1.5 self-start mt-1"
                >
                  <Upload className="size-3.5" />
                  {avatarMutation.isPending ? 'Mengunggah…' : 'Terapkan Foto Profil'}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="glass-card rounded-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Shield className="size-4 text-primary" />
                  Setelan Privasi Akun
                </CardTitle>
                <CardDescription className="text-xs">
                  Konfigurasi visibilitas status, foto profil, dan info kontak di server WhatsApp.
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => void refetchPrivacy()}
                className="size-7 p-0 text-muted-foreground"
                title="Segarkan privasi"
              >
                <RefreshCw className="size-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingPrivacy ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-10 w-full rounded" />
                <Skeleton className="h-10 w-full rounded" />
                <Skeleton className="h-10 w-full rounded" />
              </div>
            ) : privacyData ? (
              <div className="grid gap-2 text-xs">
                {Object.entries(privacyData).map(([key, val]) => (
                  <div
                    key={key}
                    className="border-border/50 bg-muted/20 flex items-center justify-between rounded-lg border p-2.5"
                  >
                    <span className="font-medium text-foreground capitalize">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {String(val)}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-xs">Data setelan privasi tidak tersedia</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
