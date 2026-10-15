import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Sparkles,
  Sliders,
  ShieldCheck,
  ShieldAlert,
  Users,
  UserCheck,
  Plus,
  Trash2,
  Edit3,
  Save,
  Search,
  Eye,
  EyeOff,
  Bot,
  Database,
  Power,
  RotateCcw,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getAIConfig,
  updateAIConfig,
  resetAIConfig,
  listAIPersonas,
  deleteAIPersona,
  type BotAIPersona,
} from '@/api/bot'
import { listMyGroups } from '@/api/group'
import { Checkbox } from '@/components/ui/checkbox'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
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
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
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

const CASUAL_SLANG_PROMPT = `Balas chat WhatsApp dengan gaya santai, singkat, dan akrab layaknya teman. Hindari bahasa kaku atau robotik.`

export default function BotAIPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showKey, setShowKey] = useState(false)

  const [provider, setProvider] = useState('openai')
  const [baseUrl, setBaseUrl] = useState('https://router.bynara.id/v1')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('step-5-preview')
  const [systemPrompt, setSystemPrompt] = useState(CASUAL_SLANG_PROMPT)
  const [temperature, setTemperature] = useState(0.7)
  const [triggerPrefix, setTriggerPrefix] = useState('')
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false)
  const [accessMode, setAccessMode] = useState<'all' | 'allowlist' | 'blocklist'>('all')
  const [allowedJids, setAllowedJids] = useState('')
  const [blockedJids, setBlockedJids] = useState('')
  const [allowGroups, setAllowGroups] = useState(false)
  const [allowedGroups, setAllowedGroups] = useState('')
  const [isConfigLoaded, setIsConfigLoaded] = useState(false)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)

  const [searchPersona, setSearchPersona] = useState('')
  const [personaToDelete, setPersonaToDelete] = useState<BotAIPersona | null>(null)

  useQuery({
    queryKey: ['bot-ai-config'],
    queryFn: async () => {
      const cfg = await getAIConfig()
      if (!isConfigLoaded && cfg) {
        setProvider(cfg.provider || 'openai')
        setBaseUrl(cfg.base_url || 'https://router.bynara.id/v1')
        setApiKey(cfg.api_key || '')
        setModel(cfg.model || 'step-5-preview')
        setSystemPrompt(cfg.system_prompt || CASUAL_SLANG_PROMPT)
        setTemperature(cfg.temperature ?? 0.7)
        setTriggerPrefix(cfg.trigger_prefix || '')
        setAutoReplyEnabled(cfg.auto_reply_enabled ?? false)
        setAccessMode(cfg.access_mode || 'all')
        setAllowedJids(cfg.allowed_jids || '')
        setBlockedJids(cfg.blocked_jids || '')
        setAllowGroups(cfg.allow_groups ?? false)
        setAllowedGroups(cfg.allowed_groups || '')
        setIsConfigLoaded(true)
      }
      return cfg
    },
  })

  const { data: myGroups = [], isLoading: isLoadingGroups } = useQuery({
    queryKey: ['my-groups'],
    queryFn: () => listMyGroups(),
  })

  const { data: personas = [], isLoading: isLoadingPersonas } = useQuery({
    queryKey: ['bot-ai-personas'],
    queryFn: listAIPersonas,
  })

  const saveConfigMutation = useMutation({
    mutationFn: () =>
      updateAIConfig({
        provider: provider.trim(),
        base_url: baseUrl.trim(),
        api_key: apiKey.trim(),
        model: model.trim(),
        system_prompt: systemPrompt.trim(),
        temperature: Number(temperature),
        trigger_prefix: triggerPrefix.trim(),
        auto_reply_enabled: autoReplyEnabled,
        access_mode: accessMode,
        allowed_jids: allowedJids.trim(),
        blocked_jids: blockedJids.trim(),
        allow_groups: allowGroups,
        allowed_groups: allowedGroups.trim(),
      }),
    onSuccess: () => {
      toast.success('Pengaturan bot AI tersimpan')
      void queryClient.invalidateQueries({ queryKey: ['bot-ai-config'] })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Gagal menyimpan pengaturan')
    },
  })

  const resetConfigMutation = useMutation({
    mutationFn: () => resetAIConfig(),
    onSuccess: (cfg) => {
      setAutoReplyEnabled(false)
      setAllowGroups(false)
      setAllowedGroups('')
      if (cfg) {
        setProvider(cfg.provider || 'openai')
        setBaseUrl(cfg.base_url || 'https://router.bynara.id/v1')
        setModel(cfg.model || 'step-5-preview')
        setSystemPrompt(cfg.system_prompt || CASUAL_SLANG_PROMPT)
        setTemperature(cfg.temperature ?? 0.7)
        setTriggerPrefix(cfg.trigger_prefix || '')
      }
      toast.success('Bot AI telah di-reset ke status Mati Total (Default)')
      setResetDialogOpen(false)
      void queryClient.invalidateQueries({ queryKey: ['bot-ai-config'] })
      void queryClient.invalidateQueries({ queryKey: ['bot-group-rules'] })
      void queryClient.invalidateQueries({ queryKey: ['bot-ai-personas'] })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Gagal mereset konfigurasi AI')
    },
  })

  const deletePersonaMutation = useMutation({
    mutationFn: (id: number) => deleteAIPersona(id),
    onSuccess: () => {
      toast.success('Persona dihapus')
      setPersonaToDelete(null)
      void queryClient.invalidateQueries({ queryKey: ['bot-ai-personas'] })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Gagal menghapus persona')
    },
  })

  const filteredPersonas = useMemo(() => {
    if (!searchPersona.trim()) return personas
    const query = searchPersona.toLowerCase().trim()
    return personas.filter(
      (p) =>
        p.phone_number.toLowerCase().includes(query) ||
        p.contact_name.toLowerCase().includes(query) ||
        p.relationship.toLowerCase().includes(query) ||
        p.custom_prompt.toLowerCase().includes(query),
    )
  }, [personas, searchPersona])

  const [personaPage, setPersonaPage] = useState(1)
  const PERSONA_PAGE_SIZE = 20
  const totalPersonaPages = Math.max(1, Math.ceil(filteredPersonas.length / PERSONA_PAGE_SIZE))
  const safePersonaPage = Math.min(Math.max(1, personaPage), totalPersonaPages)
  const personaStart = (safePersonaPage - 1) * PERSONA_PAGE_SIZE
  const personaEnd = Math.min(personaStart + PERSONA_PAGE_SIZE, filteredPersonas.length)
  const paginatedPersonas = filteredPersonas.slice(personaStart, personaEnd)

  const parsedAllowedList = useMemo(() => {
    return allowedJids
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean)
  }, [allowedJids])

  const parsedAllowedGroups = useMemo(() => {
    return allowedGroups
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean)
  }, [allowedGroups])

  const toggleGroupSelection = (jid: string) => {
    const current = new Set(parsedAllowedGroups)
    if (current.has(jid)) {
      current.delete(jid)
    } else {
      current.add(jid)
    }
    setAllowedGroups(Array.from(current).join(', '))
  }

  return (
    <div className="w-full flex flex-col gap-4 max-w-6xl mx-auto pb-10">
      <PageHeader
        title="Asisten AI & Persona"
        description="Kelola otomatisasi kecerdasan buatan WhatsApp, aturan hak akses whitelist nomor, persona kontak khusus, dan memori percakapan otomatis."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setResetDialogOpen(true)}
              className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
            >
              <RotateCcw className="size-3.5" />
              <span>Reset AI (Mati Total)</span>
            </Button>
            <Badge
              variant="outline"
              className={
                autoReplyEnabled
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs gap-1 py-0.5 px-2 rounded-[5px]'
                  : 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs gap-1 py-0.5 px-2 rounded-[5px]'
              }
            >
              <Power className="size-3" />
              <span>{autoReplyEnabled ? 'Bot AI Aktif' : 'Bot AI Nonaktif'}</span>
            </Badge>
          </div>
        }
      />

      <Card className="glass-card rounded-xl border-primary/20">
        <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4">
          <div className="flex items-start gap-3">
            <div
              className={`size-10 rounded-xl flex items-center justify-center shrink-0 border ${
                autoReplyEnabled
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500'
                  : 'bg-rose-500/15 border-rose-500/30 text-rose-500'
              }`}
            >
              <Power className="size-5" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-foreground text-sm flex items-center gap-2">
                Saklar Utama Bot AI
                {autoReplyEnabled ? (
                  <Badge className="bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 text-[10px] py-0">
                    Aktif
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-[10px] py-0">
                    Nonaktif
                  </Badge>
                )}
              </span>
              <p className="text-muted-foreground text-xs">
                {autoReplyEnabled
                  ? 'Bot AI aktif dan siap merespons percakapan sesuai aturan akses.'
                  : 'Bot AI dinonaktifkan sepenuhnya. Seluruh pesan masuk tidak akan diproses oleh AI.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
            <Switch
              checked={autoReplyEnabled}
              onCheckedChange={(checked) => {
                setAutoReplyEnabled(checked)
                updateAIConfig({ auto_reply_enabled: checked })
                  .then(() => {
                    toast.success(
                      checked ? 'Bot AI diaktifkan' : 'Bot AI dinonaktifkan sepenuhnya',
                    )
                    void queryClient.invalidateQueries({ queryKey: ['bot-ai-config'] })
                  })
                  .catch(() => toast.error('Gagal memperbarui status bot'))
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="config" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-xs bg-muted/60 p-1 rounded-lg">
          <TabsTrigger value="config" className="gap-2 text-xs font-medium rounded-md py-1.5">
            <Sliders className="size-3.5" />
            <span>Pengaturan Bot</span>
          </TabsTrigger>
          <TabsTrigger value="personas" className="gap-2 text-xs font-medium rounded-md py-1.5">
            <Users className="size-3.5" />
            <span>Persona Kontak ({personas.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="mt-4 flex flex-col gap-4">
          <Card className="glass-card rounded-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" />
                <CardTitle className="text-sm font-semibold">Mode Akses & Hak Izin</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Batasi siapa saja yang boleh berinteraksi dengan AI di WhatsApp Anda.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium">Izin Pengguna</Label>
                  <Select
                    value={accessMode}
                    onValueChange={(v) => setAccessMode(v as 'all' | 'allowlist' | 'blocklist')}
                  >
                    <SelectTrigger className="h-9 w-full text-xs rounded-md">
                      <SelectValue placeholder="Pilih mode akses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">
                        Semua Kontak (Publik Bebas)
                      </SelectItem>
                      <SelectItem value="allowlist" className="text-xs">
                        Hanya Nomor Tertentu (Whitelist)
                      </SelectItem>
                      <SelectItem value="blocklist" className="text-xs">
                        Blokir Nomor Tertentu (Blacklist)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2 bg-muted/30 p-3 rounded-md border border-border/50 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-semibold flex items-center gap-1.5">
                        <Users className="size-3.5 text-primary" />
                        <span>Respons Pesan Grup (Default: Mati Total)</span>
                      </Label>
                      <p className="text-[11px] text-muted-foreground">
                        AI hanya aktif pada grup yang dipilih di bawah. Tanpa dipilih, grup tidak akan merespons AI sama sekali.
                      </p>
                    </div>
                    <Switch
                      checked={allowGroups}
                      onCheckedChange={setAllowGroups}
                      className="data-[state=checked]:bg-emerald-600"
                    />
                  </div>

                  {allowGroups && (
                    <div className="mt-3 flex flex-col gap-3 pt-3 border-t border-border/40">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground">
                          Daftar Grup yang Diizinkan Menggunakan AI
                        </span>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {parsedAllowedGroups.length} grup dipilih
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Pilih grup WhatsApp yang diizinkan berinteraksi dengan AI, atau tambahkan Group JID secara manual.
                      </p>

                      {isLoadingGroups ? (
                        <div className="text-xs text-muted-foreground py-2">Memuat daftar grup WhatsApp...</div>
                      ) : myGroups.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto p-1.5 border rounded-md bg-background/50">
                          {myGroups.map((g) => {
                            const isSelected = parsedAllowedGroups.includes(g.JID)
                            return (
                              <div
                                key={g.JID}
                                onClick={() => toggleGroupSelection(g.JID)}
                                className={`flex items-center gap-2 p-2 rounded-md border text-xs cursor-pointer transition-colors ${
                                  isSelected
                                    ? 'border-primary/50 bg-primary/10 text-foreground font-medium'
                                    : 'border-border/50 hover:bg-muted/40 text-muted-foreground'
                                }`}
                              >
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => toggleGroupSelection(g.JID)}
                                />
                                <div className="min-w-0 flex-1 flex flex-col">
                                  <span className="truncate">{g.Name || 'Grup Tanpa Nama'}</span>
                                  <span className="text-[10px] text-muted-foreground font-mono truncate">{g.JID}</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground py-1">
                          Tidak ditemukan grup terhubung. Masukkan JID grup secara manual di bawah.
                        </div>
                      )}

                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs font-medium">JID Grup Terpilih (Koma / Baris Baru)</Label>
                        <Textarea
                          placeholder="Contoh: 120363028123456789@g.us, 120363098765432100@g.us"
                          value={allowedGroups}
                          onChange={(e) => setAllowedGroups(e.target.value)}
                          className="text-xs font-mono min-h-[60px] rounded-md"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {accessMode === 'allowlist' && (
                <div className="border-border/60 bg-muted/20 flex flex-col gap-2.5 rounded-xl border p-3.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5 text-emerald-500" />
                      Daftar Nomor yang Diizinkan (Whitelist)
                    </Label>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {parsedAllowedList.length} nomor aktif
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Masukkan nomor telepon yang diizinkan menggunakan AI (pisahkan dengan koma atau baris baru). Kontak di luar daftar ini akan diabaikan.
                  </p>
                  <Textarea
                    placeholder="Contoh: 628123456789, 628987654321"
                    value={allowedJids}
                    onChange={(e) => setAllowedJids(e.target.value)}
                    className="text-xs font-mono min-h-[75px] rounded-md"
                  />
                  {parsedAllowedList.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {parsedAllowedList.map((num) => (
                        <Badge
                          key={num}
                          variant="secondary"
                          className="font-mono text-[10px] gap-1 py-0 px-1.5"
                        >
                          +{num.replace(/[^0-9]/g, '')}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {accessMode === 'blocklist' && (
                <div className="border-border/60 bg-muted/20 flex flex-col gap-2 rounded-xl border p-3.5">
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <ShieldAlert className="size-3.5 text-rose-500" />
                    Daftar Nomor yang Diblokir (Blacklist)
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Nomor-nomor ini tidak akan pernah dibalas oleh bot AI.
                  </p>
                  <Textarea
                    placeholder="Contoh: 62899999999, 62877777777"
                    value={blockedJids}
                    onChange={(e) => setBlockedJids(e.target.value)}
                    className="text-xs font-mono min-h-[75px] rounded-md"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card rounded-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" />
                  <CardTitle className="text-sm font-semibold">Gaya Bahasa & Memori Otomatis</CardTitle>
                </div>
                <Badge variant="secondary" className="text-[10px] gap-1">
                  <Database className="size-2.5 text-primary" />
                  Memori Otomatis Aktif
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Tentukan gaya obrolan santai berformat percakapan WhatsApp dan integrasi riwayat memori.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-foreground">Preset Gaya:</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setSystemPrompt(CASUAL_SLANG_PROMPT)}
                  className="h-7 text-[11px] gap-1 rounded-md"
                >
                  <Sparkles className="size-3 text-primary" />
                  Chat Santai & Singkatan WA
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setSystemPrompt(
                      'Kamu adalah sahabat karib yang sangat perhatian, santai, dan setia mendengarkan. Jawab singkat, akrab, dan gunakan bahasa sehari-hari tanpa basa-basi.',
                    )
                  }
                  className="h-7 text-[11px] rounded-md"
                >
                  Sahabat Karib
                </Button>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">Instruksi Sistem (System Prompt)</Label>
                <Textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Masukkan instruksi kepribadian AI..."
                  className="text-xs min-h-[120px] rounded-md leading-relaxed font-sans"
                />
              </div>

              <div className="border-border/50 bg-background/50 rounded-lg border p-3 flex items-start gap-2.5 text-xs">
                <Database className="size-4 text-primary shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-foreground">Penyimpanan Memori Otomatis</span>
                  <p className="text-muted-foreground text-[11px]">
                    Bot AI otomatis mengingat percakapan sebelumnya dan menyinkronkan konteks obrolan ke Supermemory tanpa memerlukan perintah manual.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card rounded-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Bot className="size-4 text-primary" />
                <CardTitle className="text-sm font-semibold">Koneksi Mesin AI</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Atur endpoint model AI, kunci API, dan parameter inferensi respons.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium">Penyedia (Provider)</Label>
                  <Input
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    placeholder="openai"
                    className="h-9 text-xs rounded-md"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium">Model AI</Label>
                  <Input
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="step-5-preview"
                    className="h-9 text-xs rounded-md font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium">Base URL</Label>
                  <Input
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://router.bynara.id/v1"
                    className="h-9 text-xs rounded-md font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium">Kunci API (API Key)</Label>
                  <div className="relative">
                    <Input
                      type={showKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="h-9 text-xs rounded-md font-mono pr-9"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 size-7 text-muted-foreground"
                    >
                      {showKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium">Temperatur (Kreativitas)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value) || 0.7)}
                    className="h-9 text-xs rounded-md font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium">Awalan Pemicu (Opsional)</Label>
                  <Input
                    value={triggerPrefix}
                    onChange={(e) => setTriggerPrefix(e.target.value)}
                    placeholder="Kosongkan jika auto-reply aktif"
                    className="h-9 text-xs rounded-md font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => saveConfigMutation.mutate()}
                  disabled={saveConfigMutation.isPending}
                  size="sm"
                  className="h-8 text-xs rounded-md gap-2 px-4 active:scale-[0.98] transition-all"
                >
                  <Save className="size-3.5" />
                  <span>{saveConfigMutation.isPending ? 'Menyimpan…' : 'Simpan Perubahan'}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personas" className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card/60 p-3 rounded-lg border border-border/60">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau nomor persona…"
                value={searchPersona}
                onChange={(e) => setSearchPersona(e.target.value)}
                className="pl-8 h-8 text-xs rounded-md"
              />
            </div>
            <Button
              onClick={() => navigate('/bot/ai/new')}
              size="sm"
              className="h-8 text-xs rounded-md gap-1.5 active:scale-[0.98] transition-all"
            >
              <Plus className="size-3.5" />
              <span>Tambah Persona</span>
            </Button>
          </div>

          {isLoadingPersonas ? (
            <div className="p-12 text-center text-xs text-muted-foreground border rounded-lg">
              Memuat data persona…
            </div>
          ) : filteredPersonas.length === 0 ? (
            <Card className="border-dashed border-border/80 bg-card/30 text-center py-12">
              <CardContent className="flex flex-col items-center justify-center gap-2">
                <Bot className="size-10 text-muted-foreground/40" />
                <h3 className="text-sm font-semibold text-foreground">Belum ada persona khusus</h3>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Buat persona khusus untuk nomor tertentu agar bot merespons dengan gaya spesifik (pacar, rekan kerja, keluarga).
                </p>
                <Button
                  onClick={() => navigate('/bot/ai/new')}
                  size="sm"
                  className="mt-2 h-8 text-xs rounded-md gap-1.5"
                >
                  <Plus className="size-3.5" />
                  <span>Tambah Persona</span>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paginatedPersonas.map((p) => (
                  <Card
                    key={p.id}
                    onClick={() => navigate('/bot/ai/' + p.phone_number)}
                    className={`border transition-all duration-200 relative overflow-hidden cursor-pointer ${
                      p.is_active
                        ? 'border-border/70 bg-card/60 shadow-xs hover:border-primary/40'
                        : 'border-border/40 bg-muted/20 opacity-75'
                    }`}
                  >
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="size-9 rounded-md bg-muted/80 flex items-center justify-center shrink-0 border border-border/50">
                            <UserCheck className="size-4 text-primary" />
                          </div>
                          <div className="min-w-0 flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-foreground truncate">
                                {p.contact_name || 'Tanpa Nama'}
                              </span>
                              {p.relationship && (
                                <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal">
                                  {p.relationship}
                                </Badge>
                              )}
                            </div>
                            <span className="text-[11px] font-mono text-muted-foreground">
                              +{p.phone_number}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate('/bot/ai/' + p.phone_number)
                            }}
                            className="size-7 text-muted-foreground hover:text-foreground"
                          >
                            <Edit3 className="size-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              setPersonaToDelete(p)
                            }}
                            className="size-7 text-muted-foreground hover:text-rose-500"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-1 flex flex-col gap-2">
                      <p className="text-[11px] text-muted-foreground line-clamp-2 italic bg-muted/30 p-2 rounded border border-border/40">
                        "{p.custom_prompt || 'Gaya default'}"
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                        <span className="flex items-center gap-1">
                          {p.use_memory && (
                            <Badge variant="secondary" className="text-[9px] py-0">
                              Memori Aktif
                            </Badge>
                          )}
                        </span>
                        <span>{p.auto_reply_enabled ? 'Auto-reply aktif' : 'Prefix manual'}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredPersonas.length > PERSONA_PAGE_SIZE && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-1 py-1 text-xs">
                  <p className="text-muted-foreground text-xs font-mono">
                    {personaStart + 1}–{personaEnd} / {filteredPersonas.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={safePersonaPage <= 1}
                      onClick={() => setPersonaPage(1)}
                      className="size-7 rounded-[6px]"
                      title="Pertama"
                    >
                      <ChevronsLeft className="size-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={safePersonaPage <= 1}
                      onClick={() => setPersonaPage((p) => Math.max(1, p - 1))}
                      className="size-7 rounded-[6px]"
                      title="Sebelumnya"
                    >
                      <ChevronLeft className="size-3.5" />
                    </Button>
                    <div className="flex items-center px-2 py-0.5 rounded-[6px] border bg-muted/30 font-mono text-xs">
                      <span className="font-semibold text-foreground">{safePersonaPage}</span>
                      <span className="text-muted-foreground mx-1">/</span>
                      <span className="text-muted-foreground">{totalPersonaPages}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={safePersonaPage >= totalPersonaPages}
                      onClick={() => setPersonaPage((p) => Math.min(totalPersonaPages, p + 1))}
                      className="size-7 rounded-[6px]"
                      title="Berikutnya"
                    >
                      <ChevronRight className="size-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={safePersonaPage >= totalPersonaPages}
                      onClick={() => setPersonaPage(totalPersonaPages)}
                      className="size-7 rounded-[6px]"
                      title="Terakhir"
                    >
                      <ChevronsRight className="size-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={Boolean(personaToDelete)}
        onOpenChange={(open) => !open && setPersonaToDelete(null)}
      >
        <AlertDialogContent className="p-5 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-semibold">Hapus Persona</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Konfigurasi persona khusus untuk {personaToDelete?.contact_name || personaToDelete?.phone_number} akan dihapus secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="h-8 text-xs rounded-md">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => personaToDelete && deletePersonaMutation.mutate(personaToDelete.id)}
              className="h-8 text-xs rounded-md bg-rose-600 hover:bg-rose-700 text-white"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={resetDialogOpen}
        onOpenChange={setResetDialogOpen}
      >
        <AlertDialogContent className="p-5 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-semibold">Reset AI ke Status Mati Total?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Tindakan ini akan mematikan auto-reply AI secara menyeluruh, menonaktifkan respons grup AI, dan menghapus seluruh whitelist grup. AI akan berada dalam status Mati Total (Default) sampai diaktifkan kembali secara eksplisit melalui /boost atau pengaturan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="h-8 text-xs rounded-md">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => resetConfigMutation.mutate()}
              disabled={resetConfigMutation.isPending}
              className="h-8 text-xs rounded-md bg-rose-600 hover:bg-rose-700 text-white"
            >
              {resetConfigMutation.isPending ? 'Mereset...' : 'Ya, Reset Mati Total'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
