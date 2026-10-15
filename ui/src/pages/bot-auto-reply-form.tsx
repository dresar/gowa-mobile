import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ClipboardEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Bot,
  Check,
  ChevronRight,
  Globe,
  Heart,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  createRule,
  getRule,
  updateRule,
  type CreateRulePayload,
  type UpdateRulePayload,
} from '@/api/bot'
import { MediaUploadArea } from '@/components/shared/media-upload-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InfoHint } from '@/components/ui/info-hint'
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
import { cn } from '@/lib/utils'

export default function BotAutoReplyForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const isEdit = Boolean(id && !isNaN(Number(id)))
  const ruleId = isEdit ? Number(id) : null
  const queryClient = useQueryClient()

  const [triggers, setTriggers] = useState<string[]>([''])
  const [triggerType, setTriggerType] = useState<'exact' | 'contains' | 'starts_with' | 'regex'>('contains')
  const [recipientTargetType, setRecipientTargetType] = useState<'global' | 'special'>('global')
  const [specialRecipientPhones, setSpecialRecipientPhones] = useState('')
  const [scope, setScope] = useState<'all' | 'private' | 'group'>('all')
  const [responseType, setResponseType] = useState<'text' | 'media'>('text')
  const [responseContent, setResponseContent] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [isActive, setIsActive] = useState(true)

  const triggerInputRefs = useRef<(HTMLInputElement | null)[]>([])

  const { data: existingRule, isLoading: isLoadingExisting } = useQuery({
    queryKey: ['bot-rule', ruleId],
    queryFn: () => getRule(ruleId!),
    enabled: Boolean(isEdit && ruleId),
  })

  useEffect(() => {
    if (existingRule) {
      if (existingRule.trigger_value) {
        const splitTriggers = existingRule.trigger_value
          .split(/[\r\n]+/)
          .map((t) => t.trim())
          .filter(Boolean)
        setTriggers(splitTriggers.length > 0 ? splitTriggers : [''])
      } else {
        setTriggers([''])
      }

      setTriggerType(existingRule.trigger_type || 'contains')
      setScope(existingRule.scope || 'all')
      setResponseType(existingRule.response_type || 'text')
      setResponseContent(existingRule.response_content || '')
      setMediaUrl(existingRule.media_url || '')
      setIsActive(existingRule.is_active ?? true)

      const rec = existingRule.recipient_jid?.trim() || ''
      if (rec && rec !== 'all' && rec !== 'global') {
        setRecipientTargetType('special')
        setSpecialRecipientPhones(rec)
      } else {
        setRecipientTargetType('global')
        setSpecialRecipientPhones('')
      }
    }
  }, [existingRule])

  const addTriggerField = () => {
    setTriggers((prev) => [...prev, ''])
    setTimeout(() => {
      const lastIndex = triggers.length
      triggerInputRefs.current[lastIndex]?.focus()
    }, 50)
  }

  const updateTriggerField = (index: number, val: string) => {
    setTriggers((prev) => {
      const next = [...prev]
      next[index] = val
      return next
    })
  }

  const removeTriggerField = (index: number) => {
    setTriggers((prev) => {
      if (prev.length <= 1) return ['']
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleTriggerKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTriggerField()
    }
  }

  const handleTriggerPaste = (index: number, e: ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text')
    if (pastedText && pastedText.includes('\n')) {
      e.preventDefault()
      const lines = pastedText
        .split(/[\r\n]+/)
        .map((l) => l.trim())
        .filter(Boolean)
      if (lines.length > 0) {
        setTriggers((prev) => {
          const next = [...prev]
          next.splice(index, 1, ...lines)
          return next
        })
      }
    }
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const cleanTriggers = triggers
        .map((t) => t.trim())
        .filter(Boolean)

      if (cleanTriggers.length === 0) {
        throw new Error('Minimal harus ada 1 kata kunci / pemicu balasan')
      }
      if (!responseContent.trim()) {
        throw new Error('Konten teks atau keterangan balasan tidak boleh kosong')
      }
      if (responseType === 'media' && !mediaUrl.trim()) {
        throw new Error('Untuk tipe media, silakan unggah media atau masukkan URL media')
      }

      let finalRecipient: string | undefined = undefined
      if (recipientTargetType === 'special') {
        finalRecipient = specialRecipientPhones.trim() || undefined
      } else {
        finalRecipient = ''
      }

      const combinedTriggerValue = cleanTriggers.join('\n')

      if (isEdit && ruleId) {
        const payload: UpdateRulePayload = {
          trigger_type: triggerType,
          trigger_value: combinedTriggerValue,
          recipient_jid: finalRecipient,
          scope,
          response_type: responseType,
          response_content: responseContent.trim(),
          media_url: mediaUrl.trim() || undefined,
          is_active: isActive,
        }
        return updateRule(ruleId, payload)
      } else {
        const payload: CreateRulePayload = {
          trigger_type: triggerType,
          trigger_value: combinedTriggerValue,
          recipient_jid: finalRecipient,
          scope,
          response_type: responseType,
          response_content: responseContent.trim(),
          media_url: mediaUrl.trim() || undefined,
          is_active: isActive,
        }
        return createRule(payload)
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Aturan berhasil diperbarui' : 'Aturan berhasil ditambahkan')
      void queryClient.invalidateQueries({ queryKey: ['bot-rules'] })
      void queryClient.invalidateQueries({ queryKey: ['bot-rule', ruleId] })
      navigate('/bot/auto-replies')
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Gagal menyimpan aturan')
    },
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    saveMutation.mutate()
  }

  if (isEdit && isLoadingExisting) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Loader2 className="size-7 animate-spin text-primary" />
        <p className="text-muted-foreground text-xs">Memuat detail aturan balasan...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto w-full pb-12">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <button
            type="button"
            onClick={() => navigate('/bot/auto-replies')}
            className="hover:text-foreground transition-colors cursor-pointer"
          >
            Balasan Otomatis
          </button>
          <ChevronRight className="size-3.5" />
          <span className="text-foreground font-medium">
            {isEdit ? `Edit Aturan #${ruleId}` : 'Tambah Aturan Baru'}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => navigate('/bot/auto-replies')}
              title="Kembali ke daftar"
              className="size-8 rounded-lg shrink-0"
            >
              <ArrowLeft className="size-4" />
            </Button>
            <div>
              <h1 className="text-foreground text-lg sm:text-xl font-bold tracking-tight flex items-center gap-2">
                <Bot className="size-5 text-primary" />
                <span>{isEdit ? `Edit Aturan #${ruleId}` : 'Tambah Aturan'}</span>
              </h1>
              <p className="text-muted-foreground text-xs">
                {isEdit ? 'Ubah pemicu dan respon.' : 'Atur pemicu dan respon otomatis.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigate('/bot/auto-replies')}
              className="h-8 text-xs"
            >
              Batal
            </Button>
            <Button
              type="submit"
              form="auto-reply-form"
              size="sm"
              disabled={saveMutation.isPending}
              className="btn-primary-theme h-8 gap-1.5 px-3 text-xs shadow-xs"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Menyimpan…</span>
                </>
              ) : (
                <>
                  <Save className="size-3.5" />
                  <span>{isEdit ? 'Simpan' : 'Buat Aturan'}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <form id="auto-reply-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Card className="border-border/70 bg-card/60 rounded-xl shadow-xs backdrop-blur-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <CardTitle className="text-sm font-semibold">Pemicu Pesan</CardTitle>
                <InfoHint
                  title="Pemicu Pesan"
                  items={[
                    'Satu baris untuk setiap kata kunci pemicu',
                    'Tekan Enter untuk menambah baris baru',
                    'Bisa paste daftar beberapa baris langsung',
                  ]}
                />
              </div>
              <Badge variant="outline" className="text-[10px] font-mono">
                {triggers.filter((t) => t.trim().length > 0).length} Pemicu
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="flex flex-col gap-3 pt-0">
            <div className="flex flex-col gap-2">
              {triggers.map((trigger, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-muted/30 font-mono text-xs font-semibold text-muted-foreground">
                    {idx + 1}
                  </div>
                  <Input
                    ref={(el) => {
                      triggerInputRefs.current[idx] = el
                    }}
                    type="text"
                    placeholder={`Kata pemicu #${idx + 1}`}
                    value={trigger}
                    onChange={(e) => updateTriggerField(idx, e.target.value)}
                    onKeyDown={handleTriggerKeyDown}
                    onPaste={(e) => handleTriggerPaste(idx, e)}
                    className="h-8 text-xs flex-1"
                    autoFocus={idx === 0 && !isEdit}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    title="Hapus baris"
                    onClick={() => removeTriggerField(idx)}
                    disabled={triggers.length <= 1 && trigger === ''}
                    className="text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 size-8 shrink-0 rounded-lg"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTriggerField}
                className="h-7 text-xs gap-1.5 rounded-lg border-dashed border-primary/40 text-primary hover:bg-primary/10"
              >
                <Plus className="size-3.5" />
                <span>Pemicu</span>
              </Button>

              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">Pencocokan:</Label>
                <Select
                  value={triggerType}
                  onValueChange={(val: any) => setTriggerType(val)}
                >
                  <SelectTrigger className="h-7 w-38 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exact">Persis (Exact)</SelectItem>
                    <SelectItem value="contains">Mengandung</SelectItem>
                    <SelectItem value="starts_with">Diawali</SelectItem>
                    <SelectItem value="regex">Pola Regex</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/60 rounded-xl shadow-xs backdrop-blur-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold">Target Penerima</CardTitle>
              <InfoHint
                title="Target Penerima"
                items={[
                  'Global: Membalas semua pengirim yang cocok',
                  'Khusus Nomor: Hanya membalas nomor WhatsApp yang ditentukan',
                ]}
              />
            </div>
          </CardHeader>

          <CardContent className="flex flex-col gap-3.5 pt-0">
            <div className="grid gap-2.5 sm:grid-cols-2">
              <div
                onClick={() => setRecipientTargetType('global')}
                className={cn(
                  'cursor-pointer flex flex-col gap-1 rounded-xl border p-2.5 transition-all',
                  recipientTargetType === 'global'
                    ? 'border-primary bg-primary/10 shadow-xs'
                    : 'border-border/70 bg-card/40 hover:bg-card/70',
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="size-4 text-primary" />
                    <span className="text-xs font-semibold">Global</span>
                  </div>
                  {recipientTargetType === 'global' && <Check className="size-3.5 text-primary" />}
                </div>
                <p className="text-[11px] text-muted-foreground">Semua pengirim</p>
              </div>

              <div
                onClick={() => setRecipientTargetType('special')}
                className={cn(
                  'cursor-pointer flex flex-col gap-1 rounded-xl border p-2.5 transition-all',
                  recipientTargetType === 'special'
                    ? 'border-rose-500/60 bg-rose-500/10 shadow-xs'
                    : 'border-border/70 bg-card/40 hover:bg-card/70',
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="size-4 text-rose-500" />
                    <span className="text-xs font-semibold">Khusus Nomor</span>
                  </div>
                  {recipientTargetType === 'special' && <Check className="size-3.5 text-rose-500" />}
                </div>
                <p className="text-[11px] text-muted-foreground">Nomor tertentu</p>
              </div>
            </div>

            {recipientTargetType === 'special' && (
              <div className="flex flex-col gap-1 animate-in fade-in-50 duration-200">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="special-phones" className="text-xs font-semibold text-rose-500 dark:text-rose-400">
                    Nomor WhatsApp:
                  </Label>
                  <InfoHint
                    title="Format Nomor"
                    description="Gunakan format internasional tanpa plus, misal: 628123456789. Pisahkan koma jika multi nomor."
                  />
                </div>
                <Input
                  id="special-phones"
                  placeholder="628xxxxxxxxxx"
                  value={specialRecipientPhones}
                  onChange={(e) => setSpecialRecipientPhones(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>
            )}

            <div className="flex flex-col gap-1 pt-1">
              <Label className="text-xs font-semibold">Lingkup:</Label>
              <Select value={scope} onValueChange={(val: any) => setScope(val)}>
                <SelectTrigger className="h-8 text-xs w-full sm:w-60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Obrolan</SelectItem>
                  <SelectItem value="private">Hanya Pribadi</SelectItem>
                  <SelectItem value="group">Hanya Grup</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/60 rounded-xl shadow-xs backdrop-blur-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold">Respon & Media</CardTitle>
              <InfoHint
                title="Respon Pesan"
                items={[
                  'Teks: Balasan tertulis biasa',
                  'Media: Berkas atau gambar yang diunggah ke storage',
                ]}
              />
            </div>
          </CardHeader>

          <CardContent className="flex flex-col gap-3.5 pt-0">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Tipe:</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={responseType === 'text' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setResponseType('text')}
                  className={cn(
                    'h-7 text-xs rounded-lg',
                    responseType === 'text' && 'btn-primary-theme',
                  )}
                >
                  Teks
                </Button>
                <Button
                  type="button"
                  variant={responseType === 'media' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setResponseType('media')}
                  className={cn(
                    'h-7 text-xs rounded-lg',
                    responseType === 'media' && 'btn-primary-theme',
                  )}
                >
                  Media
                </Button>
              </div>
            </div>

            {responseType === 'media' && (
              <div className="border border-border/80 rounded-xl p-3 bg-muted/20 flex flex-col gap-2">
                <MediaUploadArea
                  value={mediaUrl}
                  onChange={setMediaUrl}
                  label="Area Upload Media"
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="response-content" className="text-xs font-semibold">
                {responseType === 'media' ? 'Keterangan Media:' : 'Pesan Balasan:'}
              </Label>
              <Textarea
                id="response-content"
                rows={4}
                placeholder="Pesan balasan..."
                value={responseContent}
                onChange={(e) => setResponseContent(e.target.value)}
                className="text-xs leading-relaxed"
                required
              />
              <span className="text-muted-foreground text-[11px] self-end">
                {responseContent.length} karakter
              </span>
            </div>

            <div className="border-t border-border/60 pt-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">Aktifkan Aturan</span>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate('/bot/auto-replies')}
            className="h-8 text-xs"
          >
            Batal
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={saveMutation.isPending}
            className="btn-primary-theme h-8 gap-1.5 px-4 text-xs shadow-xs"
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Menyimpan…</span>
              </>
            ) : (
              <>
                <Save className="size-3.5" />
                <span>{isEdit ? 'Simpan Perubahan' : 'Buat Aturan'}</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
