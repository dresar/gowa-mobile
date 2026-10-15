import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Bot,
  Briefcase,
  Heart,
  Phone,
  Save,
  Sparkles,
  Trash2,
  User,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  createAIPersona,
  deleteAIPersona,
  listAIPersonas,
  updateAIPersona,
  type BotAIPersona,
  type CreateAIPersonaPayload,
} from '@/api/bot'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

const PRESETS = [
  {
    id: 'khusus',
    label: 'Khusus',
    icon: Heart,
    prompt:
      'Balas santai, hangat, dan perhatian layaknya pasangan. Hindari gaya kaku bot.',
  },
  {
    id: 'keluarga',
    label: 'Keluarga',
    icon: User,
    prompt:
      'Balas akrab, santai, dan peduli khas percakapan keluarga di WhatsApp.',
  },
  {
    id: 'teman',
    label: 'Teman',
    icon: Users,
    prompt:
      'Balas santai, luwes, dan to the point ala obrolan teman sehari-hari.',
  },
  {
    id: 'klien',
    label: 'Profesional',
    icon: Briefcase,
    prompt:
      'Balas ramah, sopan, komunikatif, dan solutif untuk kebutuhan profesional.',
  },
]

export default function BotAIPersonaPage() {
  const navigate = useNavigate()
  const { phone } = useParams<{ phone?: string }>()
  const queryClient = useQueryClient()

  const isNew = !phone || phone === 'new'

  const [phoneNumber, setPhoneNumber] = useState('')
  const [contactName, setContactName] = useState('')
  const [relationship, setRelationship] = useState('khusus')
  const [customPrompt, setCustomPrompt] = useState('')
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true)
  const [useMemory, setUseMemory] = useState(true)
  const [isActive, setIsActive] = useState(true)
  const [existingPersona, setExistingPersona] = useState<BotAIPersona | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const { data: personas = [] } = useQuery({
    queryKey: ['bot-ai-personas'],
    queryFn: listAIPersonas,
  })

  useEffect(() => {
    if (!isNew && personas.length > 0) {
      const cleanTarget = phone.replace(/[^0-9]/g, '')
      const found = personas.find(
        (p) =>
          p.phone_number.replace(/[^0-9]/g, '') === cleanTarget ||
          p.phone_number === phone ||
          p.id.toString() === phone,
      )
      if (found) {
        setExistingPersona(found)
        setPhoneNumber(found.phone_number)
        const rawRel = (found.relationship || '').toLowerCase().trim()
        const cleanRel = rawRel === 'pacar' || !rawRel ? 'khusus' : rawRel
        setRelationship(cleanRel)
        setCustomPrompt(found.custom_prompt)
        setAutoReplyEnabled(found.auto_reply_enabled)
        setUseMemory(found.use_memory)
        setIsActive(found.is_active)
      } else {
        setPhoneNumber(cleanTarget || phone)
        setCustomPrompt(PRESETS[0].prompt)
      }
    } else if (isNew) {
      setCustomPrompt(PRESETS[0].prompt)
    }
  }, [isNew, phone, personas])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const cleanPhone = phoneNumber.replace(/[^0-9]/g, '')
      if (!cleanPhone) throw new Error('Nomor wajib diisi')
      if (!customPrompt.trim()) throw new Error('Prompt wajib diisi')

      const payload: CreateAIPersonaPayload = {
        phone_number: cleanPhone,
        contact_name: contactName.trim() || undefined,
        relationship: relationship.trim() || undefined,
        custom_prompt: customPrompt.trim(),
        auto_reply_enabled: autoReplyEnabled,
        use_memory: useMemory,
        is_active: isActive,
      }

      if (existingPersona) {
        return updateAIPersona(existingPersona.id, payload)
      }
      return createAIPersona(payload)
    },
    onSuccess: () => {
      toast.success(existingPersona ? 'Tersimpan' : 'Dibuat')
      void queryClient.invalidateQueries({ queryKey: ['bot-ai-personas'] })
      navigate('/bot/ai')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Gagal menyimpan')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!existingPersona) return
      return deleteAIPersona(existingPersona.id)
    },
    onSuccess: () => {
      toast.success('Dihapus')
      void queryClient.invalidateQueries({ queryKey: ['bot-ai-personas'] })
      navigate('/bot/ai')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Gagal menghapus')
    },
  })

  const applyPreset = (presetId: string) => {
    const p = PRESETS.find((item) => item.id === presetId)
    if (!p) return
    setRelationship(p.id)
    setCustomPrompt(p.prompt)
    toast.success('Preset diterapkan')
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => navigate('/bot/ai')}
            className="h-8 w-8 shrink-0 rounded-[6px]"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate">
              {isNew ? 'Persona Baru' : contactName || phoneNumber || 'Persona Kontak'}
            </h1>
            {!isNew && (
              <Badge
                variant={isActive ? 'default' : 'secondary'}
                className="text-[10px] shrink-0 font-medium px-1.5 py-0 rounded-[4px]"
              >
                {isActive ? 'Aktif' : 'Nonaktif'}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!isNew && existingPersona && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setDeleteConfirmOpen(true)}
              disabled={deleteMutation.isPending}
              className="h-8 w-8 sm:w-auto sm:px-2.5 text-xs text-destructive hover:bg-destructive/10 rounded-[6px]"
              title="Hapus"
            >
              <Trash2 className="size-3.5" />
              <span className="hidden sm:inline">Hapus</span>
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate('/bot/ai')}
            className="h-8 px-2.5 text-xs rounded-[6px]"
          >
            Batal
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="h-8 gap-1.5 px-3 bg-red-600 text-xs text-white hover:bg-red-700 rounded-[6px] shadow-xs font-medium"
          >
            <Save className="size-3.5" />
            <span>{saveMutation.isPending ? 'Menyimpan' : 'Simpan'}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="border-border/60 bg-card/50 backdrop-blur-md">
            <CardHeader className="pb-3 pt-4 px-4 sm:px-5">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User className="size-4 text-primary" />
                <span>Identitas Kontak</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-4 sm:px-5 pb-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="phone-input" className="text-xs font-semibold text-foreground">
                    Nomor WhatsApp
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="phone-input"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Nomor"
                      disabled={!isNew}
                      className="h-9 pl-8 font-mono text-xs rounded-[6px]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="name-input" className="text-xs font-semibold text-foreground">
                    Nama Kontak
                  </Label>
                  <Input
                    id="name-input"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Nama"
                    className="h-9 text-xs rounded-[6px]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rel-select" className="text-xs font-semibold text-foreground">
                  Relasi
                </Label>
                <Select value={relationship} onValueChange={setRelationship}>
                  <SelectTrigger id="rel-select" className="h-9 w-full text-xs rounded-[6px]">
                    <SelectValue placeholder="Relasi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="khusus">Khusus</SelectItem>
                    <SelectItem value="teman">Teman</SelectItem>
                    <SelectItem value="keluarga">Keluarga</SelectItem>
                    <SelectItem value="rekan">Rekan</SelectItem>
                    <SelectItem value="klien">Klien</SelectItem>
                    {relationship && !['khusus', 'teman', 'keluarga', 'rekan', 'klien'].includes(relationship) && (
                      <SelectItem value={relationship} className="capitalize">
                        {relationship}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/50 backdrop-blur-md">
            <CardHeader className="pb-3 pt-4 px-4 sm:px-5 flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Bot className="size-4 text-primary" />
                <span>Instruksi AI</span>
              </CardTitle>

              <div className="flex items-center gap-1.5">
                {PRESETS.map((p) => {
                  const Icon = p.icon
                  const active = relationship === p.id
                  return (
                    <Button
                      key={p.id}
                      type="button"
                      variant={active ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => applyPreset(p.id)}
                      className={`h-7 px-2 text-[11px] gap-1 rounded-[5px] ${
                        active ? 'font-semibold border-primary/40 bg-primary/10 text-primary' : ''
                      }`}
                    >
                      <Icon className="size-3" />
                      <span>{p.label}</span>
                    </Button>
                  )
                })}
              </div>
            </CardHeader>
            <CardContent className="space-y-3 px-4 sm:px-5 pb-5">
              <Textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Catatan persona khusus (misal: panggil 'Bang', suka bercanda, balas to the point)."
                rows={10}
                className="text-xs leading-relaxed font-sans rounded-[6px] resize-y"
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-border/60 bg-card/50 backdrop-blur-md">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Pengaturan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4">
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-2.5">
                <div>
                  <Label className="text-xs font-semibold text-foreground block cursor-pointer">
                    Balas Otomatis
                  </Label>
                  <span className="text-[11px] text-muted-foreground block">
                    Respon langsung tanpa prefix.
                  </span>
                </div>
                <Switch
                  checked={autoReplyEnabled}
                  onCheckedChange={setAutoReplyEnabled}
                  className="data-[state=checked]:bg-red-600"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-2.5">
                <div>
                  <Label className="text-xs font-semibold text-foreground block cursor-pointer">
                    Supermemory
                  </Label>
                  <span className="text-[11px] text-muted-foreground block">
                    Konteks riwayat percakapan.
                  </span>
                </div>
                <Switch
                  checked={useMemory}
                  onCheckedChange={setUseMemory}
                  className="data-[state=checked]:bg-red-600"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-2.5">
                <div>
                  <Label className="text-xs font-semibold text-foreground block cursor-pointer">
                    Status Aktif
                  </Label>
                  <span className="text-[11px] text-muted-foreground block">
                    Aktifkan aturan kontak ini.
                  </span>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={setIsActive}
                  className="data-[state=checked]:bg-red-600"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/50 backdrop-blur-md">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-primary" />
                <span>Ringkasan</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 px-4 pb-4 text-xs text-muted-foreground">
              <div className="flex justify-between py-1 border-b border-border/40">
                <span>Target</span>
                <span className="font-mono text-foreground">{phoneNumber || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span>Relasi</span>
                <span className="capitalize text-foreground">{relationship}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span>Panjang Prompt</span>
                <span className="font-mono text-foreground">{customPrompt.length} karakter</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Persona</AlertDialogTitle>
            <AlertDialogDescription>
              Hapus konfigurasi AI untuk {contactName || phoneNumber}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
