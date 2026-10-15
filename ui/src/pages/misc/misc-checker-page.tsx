import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Building,
  CheckCircle2,
  Copy,
  ExternalLink,
  Search,
  Send,
  User,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useSelectedDevice } from '@/hooks/use-device-guard'
import {
  checkUser,
  getUserInfo,
  getUserAvatar,
  getBusinessProfile,
  type UserInfoResponse,
  type BusinessProfileResponse,
} from '@/api/user'

export default function MiscCheckerPage() {
  const navigate = useNavigate()
  const device = useSelectedDevice()
  const [phoneInput, setPhoneInput] = useState('')
  const [checkedPhone, setCheckedPhone] = useState<string | null>(null)

  const { data: checkResult, isLoading: isChecking } = useQuery({
    queryKey: ['check-user', checkedPhone],
    queryFn: () => (checkedPhone ? checkUser(checkedPhone) : null),
    enabled: Boolean(checkedPhone),
  })

  const { data: userInfo } = useQuery<UserInfoResponse | null>({
    queryKey: ['user-info', checkedPhone],
    queryFn: () => (checkedPhone ? getUserInfo(checkedPhone) : null),
    enabled: Boolean(checkedPhone && checkResult?.is_on_whatsapp),
  })

  const { data: userAvatar } = useQuery({
    queryKey: ['user-avatar', checkedPhone, device],
    queryFn: () =>
      checkedPhone ? getUserAvatar({ phone: checkedPhone }, device || undefined) : null,
    enabled: Boolean(checkedPhone && checkResult?.is_on_whatsapp),
  })

  const { data: businessProfile } = useQuery<BusinessProfileResponse | null>({
    queryKey: ['user-business', checkedPhone],
    queryFn: () => (checkedPhone ? getBusinessProfile(checkedPhone) : null),
    enabled: Boolean(checkedPhone && checkResult?.is_on_whatsapp),
  })

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault()
    const clean = phoneInput.replace(/[^0-9]/g, '')
    if (!clean) {
      toast.error('Masukkan nomor telepon yang valid')
      return
    }
    setCheckedPhone(clean)
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} disalin ke papan klip`)
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <PageHeader
        title="Cek Nomor WhatsApp"
        description="Periksa validitas nomor telepon di WhatsApp dan ambil rincian profilnya. Masukkan nomor lengkap dengan kode negara untuk memeriksa status akun."
      />

      <Card className="glass-card rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Search className="size-4 text-primary" />
            Validasi Nomor & Info Akun
          </CardTitle>
          <CardDescription className="text-xs">
            Ketahui seketika apakah nomor terdaftar, foto profil, nama terverifikasi, dan jenis akun bisnis.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form onSubmit={handleCheck} className="flex flex-col sm:flex-row items-center gap-2 max-w-lg">
            <Input
              placeholder="Contoh: 628123456789 (kode negara tanpa +)"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              className="text-xs font-mono"
            />
            <Button
              type="submit"
              size="sm"
              disabled={isChecking}
              className="w-full sm:w-auto h-8 text-xs shrink-0 gap-1.5"
            >
              <Search className="size-3.5" />
              {isChecking ? 'Memeriksa…' : 'Cek Nomor'}
            </Button>
          </form>

          {isChecking && (
            <div className="flex flex-col gap-2 pt-2">
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          )}

          {!isChecking && checkedPhone && checkResult && (
            <div className="border-border/60 bg-muted/20 flex flex-col gap-3 rounded-xl border p-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-foreground">
                    +{checkedPhone}
                  </span>
                  {checkResult.is_on_whatsapp ? (
                    <Badge className="bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/30 gap-1">
                      <CheckCircle2 className="size-3" />
                      Terdaftar di WhatsApp
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-destructive border-destructive/30 gap-1">
                      <XCircle className="size-3" />
                      Tidak Terdaftar
                    </Badge>
                  )}
                </div>

                {checkResult.is_on_whatsapp && (
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      onClick={() => navigate(`/messaging?phone=${checkedPhone}`)}
                      className="h-7 text-xs gap-1"
                    >
                      <Send className="size-3" />
                      Kirim Pesan
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(`${checkedPhone}@s.whatsapp.net`, 'JID WhatsApp')}
                      className="h-7 text-xs gap-1"
                    >
                      <Copy className="size-3" />
                      Salin JID
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`https://wa.me/${checkedPhone}`, '_blank')}
                      className="h-7 text-xs gap-1"
                    >
                      <ExternalLink className="size-3" />
                      Buka WA
                    </Button>
                  </div>
                )}
              </div>

              {checkResult.is_on_whatsapp && (
                <div className="grid gap-3 sm:grid-cols-2 pt-1">
                  <div className="flex items-start gap-3">
                    {userAvatar?.url ? (
                      <div className="relative group shrink-0">
                        <img
                          src={userAvatar.url}
                          alt="Avatar"
                          className="size-16 rounded-xl object-cover border border-border shadow-xs"
                        />
                        <button
                          type="button"
                          onClick={() => window.open(userAvatar.url, '_blank')}
                          className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                        >
                          <ExternalLink className="size-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="border-border bg-muted/50 text-muted-foreground flex size-16 shrink-0 items-center justify-center rounded-xl border">
                        <User className="size-7 opacity-50" />
                      </div>
                    )}

                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="font-semibold text-foreground text-sm truncate">
                        {userInfo?.data?.[0]?.verified_name || userInfo?.data?.[0]?.name || 'Tanpa Nama'}
                      </span>
                      {userInfo?.data?.[0]?.status && (
                        <p className="text-muted-foreground text-[11px] line-clamp-2 italic">
                          "{userInfo.data[0].status}"
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {businessProfile && (
                          <Badge variant="secondary" className="text-[10px] gap-1">
                            <Building className="size-2.5" />
                            Akun Bisnis
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {businessProfile && (
                    <div className="border-border/50 bg-background/60 flex flex-col gap-1.5 rounded-lg border p-2.5">
                      <span className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wide">
                        Profil Bisnis
                      </span>
                      {businessProfile.email && (
                        <span className="text-muted-foreground text-[11px]">
                          Email: {businessProfile.email}
                        </span>
                      )}
                      {businessProfile.address && (
                        <span className="text-muted-foreground text-[11px]">
                          Alamat: {businessProfile.address}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
