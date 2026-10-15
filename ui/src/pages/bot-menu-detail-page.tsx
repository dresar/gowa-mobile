import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Copy,
  Eye,
  EyeOff,
  Globe,
  Key,
  Plus,
  Save,
  Smartphone,
  Terminal,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
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
import { useDevices } from '@/hooks/use-devices'
import { useSelectedDevice } from '@/hooks/use-device-guard'
import { useDeviceStore } from '@/stores/device'
import {
  BOT_FEATURES,
  DEFAULT_FACTS,
  DEFAULT_QUOTES,
  getStoredFeatureConfig,
  saveStoredFeatureConfig,
  type FactItem,
  type QuoteItem,
  type StoredFeatureConfig,
} from '@/lib/bot-features-data'

export default function BotMenuDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const selectedDeviceId = useSelectedDevice()
  const selectDevice = useDeviceStore((state) => state.selectDevice)
  const { data: devices = [] } = useDevices()

  const feature = BOT_FEATURES.find((f) => f.id === id)

  const [command, setCommand] = useState('')
  const [alias, setAlias] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [autoTyping, setAutoTyping] = useState(false)
  const [applyToAllDevices, setApplyToAllDevices] = useState(true)

  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [customEndpoint, setCustomEndpoint] = useState('')

  const [weatherCity, setWeatherCity] = useState('Jakarta')
  const [weatherProvider, setWeatherProvider] = useState('bmkg')

  const [newsCategory, setNewsCategory] = useState('nasional')
  const [newsProvider, setNewsProvider] = useState('newsapi')

  const [quakeMinMag, setQuakeMinMag] = useState('all')
  const [quakeTsunamiAlert, setQuakeTsunamiAlert] = useState(true)

  const [dirCheckNum, setDirCheckNum] = useState(true)
  const [dirUserInfo, setDirUserInfo] = useState(true)
  const [dirAvatar, setDirAvatar] = useState(true)
  const [dirBusiness, setDirBusiness] = useState(true)

  const [quotes, setQuotes] = useState<QuoteItem[]>(() => {
    try {
      const saved = localStorage.getItem('bot_quotes_db_v1')
      if (saved) return JSON.parse(saved)
    } catch {
    }
    return DEFAULT_QUOTES
  })
  const [newQuoteText, setNewQuoteText] = useState('')
  const [newQuoteAuthor, setNewQuoteAuthor] = useState('')

  const [facts, setFacts] = useState<FactItem[]>(() => {
    try {
      const saved = localStorage.getItem('bot_facts_db_v1')
      if (saved) return JSON.parse(saved)
    } catch {
    }
    return DEFAULT_FACTS
  })
  const [newFactCategory, setNewFactCategory] = useState('sains')
  const [newFactText, setNewFactText] = useState('')
  const [factFilterTab, setFactFilterTab] = useState('semua')

  const [currBase, setCurrBase] = useState('USD')
  const [currTarget, setCurrTarget] = useState('IDR')

  const [prayerCity, setPrayerCity] = useState('Jakarta')

  const [quranTranslation, setQuranTranslation] = useState(true)
  const [quranLatin, setQuranLatin] = useState(true)

  const [wikiLang, setWikiLang] = useState('id')
  const [trTargetLang, setTrTargetLang] = useState('id')

  const [antiLinkAction, setAntiLinkAction] = useState('delete')
  const [antiLinkWhitelist, setAntiLinkWhitelist] = useState('')

  const [welcomeTpl, setWelcomeTpl] = useState(
    'Selamat datang {name} di grup {group}! Silakan baca deskripsi ya.',
  )
  const [farewellTpl, setFarewellTpl] = useState(
    'Sampai jumpa {name}, terima kasih telah bergabung.',
  )

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    const mainEl = document.querySelector('main')
    if (mainEl) mainEl.scrollTop = 0
  }, [id])

  useEffect(() => {
    if (!feature) return
    const cfg = getStoredFeatureConfig(feature.id, selectedDeviceId)
    setCommand(cfg.command || feature.command)
    setAlias(cfg.alias || feature.alias || '')
    setIsActive(cfg.isActive ?? true)
    setAutoTyping(cfg.autoTyping ?? feature.autoTyping ?? false)

    if (cfg.custom) {
      if (cfg.custom.apiKey !== undefined) setApiKey(cfg.custom.apiKey)
      else if (cfg.custom.weatherApiKey !== undefined) setApiKey(cfg.custom.weatherApiKey)
      else if (cfg.custom.newsApiKey !== undefined) setApiKey(cfg.custom.newsApiKey)

      if (cfg.custom.endpoint !== undefined) setCustomEndpoint(cfg.custom.endpoint)
      if (cfg.custom.weatherCity !== undefined) setWeatherCity(cfg.custom.weatherCity)
      if (cfg.custom.weatherProvider !== undefined) setWeatherProvider(cfg.custom.weatherProvider)
      if (cfg.custom.newsCategory !== undefined) setNewsCategory(cfg.custom.newsCategory)
      if (cfg.custom.newsProvider !== undefined) setNewsProvider(cfg.custom.newsProvider)
      if (cfg.custom.quakeMinMag !== undefined) setQuakeMinMag(cfg.custom.quakeMinMag)
      if (cfg.custom.quakeTsunamiAlert !== undefined) setQuakeTsunamiAlert(cfg.custom.quakeTsunamiAlert)
      if (cfg.custom.dirCheckNum !== undefined) setDirCheckNum(cfg.custom.dirCheckNum)
      if (cfg.custom.dirUserInfo !== undefined) setDirUserInfo(cfg.custom.dirUserInfo)
      if (cfg.custom.dirAvatar !== undefined) setDirAvatar(cfg.custom.dirAvatar)
      if (cfg.custom.dirBusiness !== undefined) setDirBusiness(cfg.custom.dirBusiness)
      if (cfg.custom.currBase !== undefined) setCurrBase(cfg.custom.currBase)
      if (cfg.custom.currTarget !== undefined) setCurrTarget(cfg.custom.currTarget)
      if (cfg.custom.prayerCity !== undefined) setPrayerCity(cfg.custom.prayerCity)
      if (cfg.custom.quranTranslation !== undefined) setQuranTranslation(cfg.custom.quranTranslation)
      if (cfg.custom.quranLatin !== undefined) setQuranLatin(cfg.custom.quranLatin)
      if (cfg.custom.wikiLang !== undefined) setWikiLang(cfg.custom.wikiLang)
      if (cfg.custom.trTargetLang !== undefined) setTrTargetLang(cfg.custom.trTargetLang)
      if (cfg.custom.antiLinkAction !== undefined) setAntiLinkAction(cfg.custom.antiLinkAction)
      if (cfg.custom.antiLinkWhitelist !== undefined) setAntiLinkWhitelist(cfg.custom.antiLinkWhitelist)
      if (cfg.custom.welcomeTpl !== undefined) setWelcomeTpl(cfg.custom.welcomeTpl)
      if (cfg.custom.farewellTpl !== undefined) setFarewellTpl(cfg.custom.farewellTpl)
    }
  }, [feature, selectedDeviceId])

  if (!feature) {
    return (
      <div className="mx-auto max-w-xl py-12 text-center space-y-3">
        <h2 className="text-base font-bold text-foreground">Fitur tidak ditemukan</h2>
        <Button size="sm" onClick={() => navigate('/bot/menu')}>
          Kembali
        </Button>
      </div>
    )
  }

  const FeatureIcon = feature.icon

  const handleSave = () => {
    const updated: StoredFeatureConfig = {
      command: command.trim(),
      alias: alias.trim(),
      isActive,
      autoTyping,
      custom: {
        apiKey: apiKey.trim(),
        endpoint: customEndpoint.trim(),
        weatherCity: weatherCity.trim(),
        weatherProvider,
        newsCategory,
        newsProvider,
        quakeMinMag,
        quakeTsunamiAlert,
        dirCheckNum,
        dirUserInfo,
        dirAvatar,
        dirBusiness,
        currBase,
        currTarget,
        prayerCity: prayerCity.trim(),
        quranTranslation,
        quranLatin,
        wikiLang,
        trTargetLang,
        antiLinkAction,
        antiLinkWhitelist: antiLinkWhitelist.trim(),
        welcomeTpl: welcomeTpl.trim(),
        farewellTpl: farewellTpl.trim(),
      },
    }

    saveStoredFeatureConfig(feature.id, updated, selectedDeviceId, applyToAllDevices)
    toast.success('Pengaturan disimpan')
  }

  const handleResetToDefault = () => {
    setCommand(feature.command)
    setAlias(feature.alias || '')
    setIsActive(true)
    setAutoTyping(feature.autoTyping)
    setApiKey('')
    setCustomEndpoint('')
    setWeatherCity('Jakarta')
    setWeatherProvider('bmkg')
    setNewsCategory('nasional')
    setNewsProvider('newsapi')
    setQuakeMinMag('all')
    setQuakeTsunamiAlert(true)
    toast.success('Direset ke default')
  }

  const handleAddQuote = () => {
    if (!newQuoteText.trim()) {
      toast.error('Kutipan kosong')
      return
    }
    const item: QuoteItem = {
      id: Date.now().toString(),
      quote: newQuoteText.trim(),
      author: newQuoteAuthor.trim() || 'Anonim',
    }
    const updated = [item, ...quotes]
    setQuotes(updated)
    try {
      localStorage.setItem('bot_quotes_db_v1', JSON.stringify(updated))
    } catch {
    }
    setNewQuoteText('')
    setNewQuoteAuthor('')
    toast.success('Kutipan ditambahkan')
  }

  const handleDeleteQuote = (quoteId: string) => {
    const updated = quotes.filter((q) => q.id !== quoteId)
    setQuotes(updated)
    try {
      localStorage.setItem('bot_quotes_db_v1', JSON.stringify(updated))
    } catch {
    }
    toast.success('Kutipan dihapus')
  }

  const handleAddFact = () => {
    if (!newFactText.trim()) {
      toast.error('Teks fakta kosong')
      return
    }
    const item: FactItem = {
      id: Date.now().toString(),
      category: newFactCategory.trim().toLowerCase(),
      fact: newFactText.trim(),
    }
    const updated = [item, ...facts]
    setFacts(updated)
    try {
      localStorage.setItem('bot_facts_db_v1', JSON.stringify(updated))
    } catch {
    }
    setNewFactText('')
    toast.success('Fakta ditambahkan')
  }

  const handleDeleteFact = (factId: string) => {
    const updated = facts.filter((f) => f.id !== factId)
    setFacts(updated)
    try {
      localStorage.setItem('bot_facts_db_v1', JSON.stringify(updated))
    } catch {
    }
    toast.success('Fakta dihapus')
  }

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText(customEndpoint || feature.endpoint)
    toast.success('Endpoint disalin')
  }

  return (
    <div className="w-full space-y-3 pb-8">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => navigate('/bot/menu')}
            className="size-8 shrink-0 rounded-[6px]"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="size-7 rounded-[var(--btn-radius,6px)] bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FeatureIcon className="size-4" />
            </div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate">
              {feature.name}
            </h1>
            <Badge
              variant={isActive ? 'default' : 'secondary'}
              className="text-[10px] shrink-0 font-medium px-1.5 py-0 rounded-[4px]"
            >
              {isActive ? 'Aktif' : 'Nonaktif'}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetToDefault}
            className="h-8 px-2.5 text-xs rounded-[6px]"
          >
            Reset
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate('/bot/menu')}
            className="h-8 px-2.5 text-xs rounded-[6px]"
          >
            Batal
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            className="h-8 gap-1.5 px-3 bg-red-600 text-xs text-white hover:bg-red-700 rounded-[6px] shadow-xs font-medium"
          >
            <Save className="size-3.5" />
            <span>Simpan</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-3">
        <div className="space-y-3.5 lg:col-span-2">
          <Card className="border-border/60 bg-card/50 backdrop-blur-md">
            <CardHeader className="pb-3 pt-4 px-4 sm:px-5">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Terminal className="size-4 text-primary" />
                <span>Pemicu Perintah</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-4 sm:px-5 pb-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="cmd-input" className="text-xs font-semibold text-foreground">
                    Perintah Utama
                  </Label>
                  <Input
                    id="cmd-input"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    placeholder="Perintah"
                    className="h-9 font-mono text-xs rounded-[6px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="alias-input" className="text-xs font-semibold text-foreground">
                    Alias Perintah
                  </Label>
                  <Input
                    id="alias-input"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    placeholder="Alias"
                    className="h-9 text-xs rounded-[6px]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/50 backdrop-blur-md">
            <CardHeader className="pb-3 pt-4 px-4 sm:px-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Globe className="size-4 text-primary" />
                  <span>Integrasi API Langsung</span>
                </CardTitle>
                <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/30 bg-emerald-500/10">
                  {feature.apiStatus}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 px-4 sm:px-5 pb-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1 p-2.5 rounded-lg border border-border/50 bg-muted/20">
                  <span className="text-[11px] text-muted-foreground block font-medium">Provider API</span>
                  <span className="text-foreground font-semibold block">{feature.provider}</span>
                </div>
                <div className="space-y-1 p-2.5 rounded-lg border border-border/50 bg-muted/20">
                  <span className="text-[11px] text-muted-foreground block font-medium">Metode Eksekusi</span>
                  <span className="text-foreground font-semibold block">REST API Native (Go Core)</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Endpoint API</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyEndpoint}
                    className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-foreground gap-1"
                  >
                    <Copy className="size-3" />
                    <span>Salin</span>
                  </Button>
                </div>
                <Input
                  value={customEndpoint || feature.endpoint}
                  onChange={(e) => setCustomEndpoint(e.target.value)}
                  placeholder={feature.endpoint}
                  className="h-9 font-mono text-xs rounded-[6px]"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Key className="size-3 text-muted-foreground" />
                    <span>Kunci API (API Key)</span>
                  </Label>
                  <span className="text-[10px] text-muted-foreground">
                    {feature.provider.includes('Bebas') || feature.provider.includes('Resmi') || feature.provider.includes('Open Data')
                      ? 'Opsional / Khusus'
                      : 'Wajib'}
                  </span>
                </div>
                <div className="relative">
                  <Input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Kunci"
                    className="h-9 font-mono text-xs pr-9 rounded-[6px]"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-1 top-1 size-7 text-muted-foreground hover:text-foreground"
                  >
                    {showApiKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </Button>
                </div>
                <span className="text-[11px] text-muted-foreground block leading-tight">
                  {feature.provider.includes('Bebas') || feature.provider.includes('Resmi') || feature.provider.includes('Open Data')
                    ? 'Layanan ini menggunakan API terbuka gratis resmi. Kosongkan jika memakai kuota default.'
                    : 'Masukkan token atau API key untuk otentikasi ke provider terkait.'}
                </span>
              </div>
            </CardContent>
          </Card>

          {feature.id === 'earthquake' && (
            <Card className="border-border/60 bg-card/50 backdrop-blur-md">
              <CardHeader className="pb-3 pt-4 px-4 sm:px-5">
                <CardTitle className="text-sm font-semibold">Pengaturan Gempa BMKG</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 px-4 sm:px-5 pb-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Filter Magnitudo Minimum</Label>
                  <Select value={quakeMinMag} onValueChange={setQuakeMinMag}>
                    <SelectTrigger className="h-9 w-full text-xs rounded-[6px]">
                      <SelectValue placeholder="Magnitudo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Gempa Terkini</SelectItem>
                      <SelectItem value="3">Magnitudo &ge; 3.0 SR</SelectItem>
                      <SelectItem value="5">Magnitudo &ge; 5.0 SR (Peringatan)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-2.5">
                  <div>
                    <Label className="text-xs font-semibold block cursor-pointer">
                      Peringatan Tsunami
                    </Label>
                    <span className="text-[11px] text-muted-foreground block">
                      Tampilkan status peringatan dini potensi tsunami dari BMKG.
                    </span>
                  </div>
                  <Switch checked={quakeTsunamiAlert} onCheckedChange={setQuakeTsunamiAlert} />
                </div>
              </CardContent>
            </Card>
          )}

          {feature.id === 'weather' && (
            <Card className="border-border/60 bg-card/50 backdrop-blur-md">
              <CardHeader className="pb-3 pt-4 px-4 sm:px-5">
                <CardTitle className="text-sm font-semibold">Prakiraan Cuaca</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 px-4 sm:px-5 pb-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Kota Default</Label>
                    <Input
                      value={weatherCity}
                      onChange={(e) => setWeatherCity(e.target.value)}
                      placeholder="Jakarta"
                      className="h-9 text-xs rounded-[6px]"
                    />
                    <span className="text-[11px] text-muted-foreground block">
                      Dipakai jika perintah dikirim tanpa nama lokasi.
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Provider Cuaca</Label>
                    <Select value={weatherProvider} onValueChange={setWeatherProvider}>
                      <SelectTrigger className="h-9 w-full text-xs rounded-[6px]">
                        <SelectValue placeholder="Provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bmkg">BMKG Indonesia (Resmi)</SelectItem>
                        <SelectItem value="openweather">OpenWeatherMap (Kustom)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="rounded-lg border border-border/50 bg-muted/15 p-3 text-xs space-y-1.5">
                  <span className="font-semibold text-foreground block">Auto-Deteksi Wilayah Dinamis</span>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Pengguna bebas mencari lokasi mana pun di seluruh Indonesia (desa, kecamatan, kabupaten, atau kota). Bot langsung mendeteksi database wilayah BMKG secara otomatis.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {feature.id === 'news' && (
            <Card className="border-border/60 bg-card/50 backdrop-blur-md">
              <CardHeader className="pb-3 pt-4 px-4 sm:px-5">
                <CardTitle className="text-sm font-semibold">Konfigurasi Berita</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 px-4 sm:px-5 pb-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Kategori Default</Label>
                    <Select value={newsCategory} onValueChange={setNewsCategory}>
                      <SelectTrigger className="h-9 w-full text-xs rounded-[6px]">
                        <SelectValue placeholder="Kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nasional">Nasional</SelectItem>
                        <SelectItem value="teknologi">Teknologi</SelectItem>
                        <SelectItem value="bisnis">Bisnis</SelectItem>
                        <SelectItem value="olahraga">Olahraga</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Provider Berita</Label>
                    <Select value={newsProvider} onValueChange={setNewsProvider}>
                      <SelectTrigger className="h-9 w-full text-xs rounded-[6px]">
                        <SelectValue placeholder="Provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newsapi">NewsAPI</SelectItem>
                        <SelectItem value="rss">Portal RSS Terbuka</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {feature.id === 'directory' && (
            <Card className="border-border/60 bg-card/50 backdrop-blur-md">
              <CardHeader className="pb-3 pt-4 px-4 sm:px-5">
                <CardTitle className="text-sm font-semibold">Layanan Direktori</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-4 sm:px-5 pb-5">
                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-2.5">
                  <div>
                    <Label className="text-xs font-semibold">Cek Nomor</Label>
                    <span className="text-[11px] text-muted-foreground block">
                      Periksa pendaftaran nomor di WhatsApp (.cek).
                    </span>
                  </div>
                  <Switch checked={dirCheckNum} onCheckedChange={setDirCheckNum} />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-2.5">
                  <div>
                    <Label className="text-xs font-semibold">Info Pengguna</Label>
                    <span className="text-[11px] text-muted-foreground block">
                      Tampilkan JID, LID, dan status publik (.info).
                    </span>
                  </div>
                  <Switch checked={dirUserInfo} onCheckedChange={setDirUserInfo} />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-2.5">
                  <div>
                    <Label className="text-xs font-semibold">Foto Profil</Label>
                    <span className="text-[11px] text-muted-foreground block">
                      Ambil foto profil avatar WhatsApp (.avatar).
                    </span>
                  </div>
                  <Switch checked={dirAvatar} onCheckedChange={setDirAvatar} />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-2.5">
                  <div>
                    <Label className="text-xs font-semibold">Profil Bisnis</Label>
                    <span className="text-[11px] text-muted-foreground block">
                      Katalog dan kategori WhatsApp Business (.bisnis).
                    </span>
                  </div>
                  <Switch checked={dirBusiness} onCheckedChange={setDirBusiness} />
                </div>
              </CardContent>
            </Card>
          )}

          {feature.id === 'currency' && (
            <Card className="border-border/60 bg-card/50 backdrop-blur-md">
              <CardHeader className="pb-3 pt-4 px-4 sm:px-5">
                <CardTitle className="text-sm font-semibold">Pasangan Mata Uang</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 px-4 sm:px-5 pb-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Mata Uang Asal</Label>
                    <Input
                      value={currBase}
                      onChange={(e) => setCurrBase(e.target.value.toUpperCase())}
                      placeholder="USD"
                      className="h-9 font-mono text-xs rounded-[6px]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Mata Uang Tujuan</Label>
                    <Input
                      value={currTarget}
                      onChange={(e) => setCurrTarget(e.target.value.toUpperCase())}
                      placeholder="IDR"
                      className="h-9 font-mono text-xs rounded-[6px]"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {feature.id === 'prayer-time' && (
            <Card className="border-border/60 bg-card/50 backdrop-blur-md">
              <CardHeader className="pb-3 pt-4 px-4 sm:px-5">
                <CardTitle className="text-sm font-semibold">Jadwal Sholat</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 px-4 sm:px-5 pb-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Kota Default</Label>
                  <Input
                    value={prayerCity}
                    onChange={(e) => setPrayerCity(e.target.value)}
                    placeholder="Jakarta"
                    className="h-9 text-xs rounded-[6px]"
                  />
                  <span className="text-[11px] text-muted-foreground block">
                    Data mengacu pada hisab Kementerian Agama RI.
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {feature.id === 'quran' && (
            <Card className="border-border/60 bg-card/50 backdrop-blur-md">
              <CardHeader className="pb-3 pt-4 px-4 sm:px-5">
                <CardTitle className="text-sm font-semibold">Format Tampilan Al-Qur'an</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-4 sm:px-5 pb-5">
                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-2.5">
                  <div>
                    <Label className="text-xs font-semibold">Terjemahan Indonesia</Label>
                    <span className="text-[11px] text-muted-foreground block">
                      Tampilkan arti ayat dalam bahasa Indonesia.
                    </span>
                  </div>
                  <Switch checked={quranTranslation} onCheckedChange={setQuranTranslation} />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-2.5">
                  <div>
                    <Label className="text-xs font-semibold">Teks Transliterasi Latin</Label>
                    <span className="text-[11px] text-muted-foreground block">
                      Sertakan ejaan latin untuk mempermudah bacaan.
                    </span>
                  </div>
                  <Switch checked={quranLatin} onCheckedChange={setQuranLatin} />
                </div>
              </CardContent>
            </Card>
          )}

          {feature.id === 'wiki' && (
            <Card className="border-border/60 bg-card/50 backdrop-blur-md">
              <CardHeader className="pb-3 pt-4 px-4 sm:px-5">
                <CardTitle className="text-sm font-semibold">Ensiklopedia Wikipedia</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 px-4 sm:px-5 pb-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Bahasa Utama</Label>
                  <Select value={wikiLang} onValueChange={setWikiLang}>
                    <SelectTrigger className="h-9 w-full text-xs rounded-[6px]">
                      <SelectValue placeholder="Bahasa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="id">Bahasa Indonesia (id)</SelectItem>
                      <SelectItem value="en">English (en)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {feature.id === 'translate' && (
            <Card className="border-border/60 bg-card/50 backdrop-blur-md">
              <CardHeader className="pb-3 pt-4 px-4 sm:px-5">
                <CardTitle className="text-sm font-semibold">Sasaran Terjemahan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 px-4 sm:px-5 pb-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Bahasa Tujuan Default</Label>
                  <Select value={trTargetLang} onValueChange={setTrTargetLang}>
                    <SelectTrigger className="h-9 w-full text-xs rounded-[6px]">
                      <SelectValue placeholder="Bahasa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="id">Indonesia (id)</SelectItem>
                      <SelectItem value="en">Inggris (en)</SelectItem>
                      <SelectItem value="ar">Arab (ar)</SelectItem>
                      <SelectItem value="ja">Jepang (ja)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {feature.id === 'quote' && (
            <Card className="border-border/60 bg-card/50 backdrop-blur-md">
              <CardHeader className="pb-3 pt-4 px-4 sm:px-5">
                <CardTitle className="text-sm font-semibold">Database Kata Mutiara</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 px-4 sm:px-5 pb-5">
                <div className="flex flex-col gap-2 p-3 bg-muted/30 rounded-lg border border-border/50">
                  <Input
                    value={newQuoteText}
                    onChange={(e) => setNewQuoteText(e.target.value)}
                    placeholder="Kutipan"
                    className="h-8 text-xs rounded-md"
                  />
                  <div className="flex gap-2">
                    <Input
                      value={newQuoteAuthor}
                      onChange={(e) => setNewQuoteAuthor(e.target.value)}
                      placeholder="Penulis"
                      className="h-8 text-xs rounded-md flex-1"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddQuote}
                      className="h-8 px-3 text-xs rounded-md bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Plus className="size-3.5" />
                      <span>Tambah</span>
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {quotes.map((q) => (
                    <div
                      key={q.id}
                      className="flex items-start justify-between gap-2 p-2.5 rounded-lg border border-border/50 bg-card/40 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="italic text-foreground line-clamp-2">"{q.quote}"</p>
                        <span className="text-[10px] text-muted-foreground font-medium block mt-0.5">
                          — {q.author}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteQuote(q.id)}
                        className="size-6 text-muted-foreground hover:text-destructive shrink-0"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {feature.id === 'facts' && (
            <Card className="border-border/60 bg-card/50 backdrop-blur-md">
              <CardHeader className="pb-3 pt-4 px-4 sm:px-5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Database Fakta Unik</CardTitle>
                  <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/30 bg-emerald-500/10">
                    {facts.length} Fakta
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 px-4 sm:px-5 pb-5">
                <div className="flex flex-wrap gap-1.5 pb-1">
                  {['semua', 'sains', 'hewan', 'antariksa', 'tubuh', 'sejarah', 'bumi', 'teknologi'].map((cat) => (
                    <Button
                      key={cat}
                      type="button"
                      variant={factFilterTab === cat ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFactFilterTab(cat)}
                      className={`h-7 px-2.5 text-[11px] rounded-[5px] ${
                        factFilterTab === cat ? 'bg-red-600 text-white hover:bg-red-700' : ''
                      }`}
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Button>
                  ))}
                </div>

                <div className="flex flex-col gap-2 p-3 bg-muted/30 rounded-lg border border-border/50">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Select value={newFactCategory} onValueChange={setNewFactCategory}>
                      <SelectTrigger className="h-8 w-full sm:w-32 text-xs rounded-md">
                        <SelectValue placeholder="Kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sains">Sains</SelectItem>
                        <SelectItem value="hewan">Hewan</SelectItem>
                        <SelectItem value="antariksa">Antariksa</SelectItem>
                        <SelectItem value="tubuh">Tubuh</SelectItem>
                        <SelectItem value="sejarah">Sejarah</SelectItem>
                        <SelectItem value="bumi">Bumi</SelectItem>
                        <SelectItem value="teknologi">Teknologi</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={newFactText}
                      onChange={(e) => setNewFactText(e.target.value)}
                      placeholder="Tulis fakta unik baru..."
                      className="h-8 text-xs rounded-md flex-1"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddFact}
                      className="h-8 px-3 text-xs rounded-md bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                    >
                      <Plus className="size-3.5" />
                      <span>Tambah</span>
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {facts
                    .filter((f) => factFilterTab === 'semua' || f.category === factFilterTab)
                    .map((f) => (
                      <div
                        key={f.id}
                        className="flex items-start justify-between gap-2 p-2.5 rounded-lg border border-border/50 bg-card/40 text-xs"
                      >
                        <div className="min-w-0 space-y-1">
                          <p className="text-foreground leading-snug">{f.fact}</p>
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 uppercase">
                            {f.category}
                          </Badge>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteFact(f.id)}
                          className="size-6 text-muted-foreground hover:text-destructive shrink-0"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    ))}
                </div>

                <div className="rounded-lg border border-border/50 bg-muted/15 p-2.5 text-[11px] text-muted-foreground">
                  💡 Bot mengeksekusi fakta langsung dari database lokal ini (&lt;10ms). Jika topik tidak ditemukan, server otomatis mengambil fakta online dan menerjemahkannya ke Bahasa Indonesia.
                </div>
              </CardContent>
            </Card>
          )}

          {feature.id === 'antilink' && (
            <Card className="border-border/60 bg-card/50 backdrop-blur-md">
              <CardHeader className="pb-3 pt-4 px-4 sm:px-5">
                <CardTitle className="text-sm font-semibold">Aturan Anti-Link</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 px-4 sm:px-5 pb-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Tindakan</Label>
                  <Select value={antiLinkAction} onValueChange={setAntiLinkAction}>
                    <SelectTrigger className="h-9 w-full text-xs rounded-[6px]">
                      <SelectValue placeholder="Tindakan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="delete">Hapus Pesan</SelectItem>
                      <SelectItem value="kick">Keluarkan Pengirim</SelectItem>
                      <SelectItem value="warn">Peringatan Saja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Whitelist Domain</Label>
                  <Textarea
                    value={antiLinkWhitelist}
                    onChange={(e) => setAntiLinkWhitelist(e.target.value)}
                    placeholder="Domain"
                    rows={2}
                    className="text-xs font-mono rounded-[6px]"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {feature.id === 'welcome-farewell' && (
            <Card className="border-border/60 bg-card/50 backdrop-blur-md">
              <CardHeader className="pb-3 pt-4 px-4 sm:px-5">
                <CardTitle className="text-sm font-semibold">Template Grup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 px-4 sm:px-5 pb-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Template Sambutan</Label>
                  <Textarea
                    value={welcomeTpl}
                    onChange={(e) => setWelcomeTpl(e.target.value)}
                    placeholder="Sambutan"
                    rows={2}
                    className="text-xs rounded-[6px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Template Pamitan</Label>
                  <Textarea
                    value={farewellTpl}
                    onChange={(e) => setFarewellTpl(e.target.value)}
                    placeholder="Pamitan"
                    rows={2}
                    className="text-xs rounded-[6px]"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-3.5">
          <Card className="border-border/60 bg-card/50 backdrop-blur-md">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Status Fitur
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4">
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-2.5">
                <div>
                  <Label className="text-xs font-semibold text-foreground block cursor-pointer">
                    Aktifkan Fitur
                  </Label>
                  <span className="text-[11px] text-muted-foreground block">
                    Respon perintah di chat.
                  </span>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={setIsActive}
                  className="data-[state=checked]:bg-red-600"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-2.5">
                <div>
                  <Label className="text-xs font-semibold text-foreground block cursor-pointer">
                    Auto-Typing
                  </Label>
                  <span className="text-[11px] text-muted-foreground block">
                    Simulasi mengetik sebelum balas.
                  </span>
                </div>
                <Switch
                  checked={autoTyping}
                  onCheckedChange={setAutoTyping}
                  className="data-[state=checked]:bg-red-600"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/50 backdrop-blur-md">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                <Smartphone className="size-3.5 text-primary" />
                <span>Multi-Akun</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4 text-xs">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Akun Saat Ini</Label>
                {devices.length > 0 ? (
                  <Select
                    value={selectedDeviceId || devices[0]?.id || ''}
                    onValueChange={(val) => selectDevice(val)}
                  >
                    <SelectTrigger className="h-8.5 w-full text-xs rounded-[6px]">
                      <SelectValue placeholder="Pilih akun" />
                    </SelectTrigger>
                    <SelectContent>
                      {devices.map((d) => (
                        <SelectItem key={d.id} value={d.id} className="text-xs">
                          {d.display_name || d.id} ({d.phone_number || 'Aktif'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-[11px] text-muted-foreground p-2 rounded-md bg-muted/30 border border-border/40">
                    Belum ada akun WhatsApp terhubung.
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-2.5">
                <div>
                  <Label className="text-xs font-semibold block cursor-pointer">
                    Semua Akun
                  </Label>
                  <span className="text-[11px] text-muted-foreground block">
                    Terapkan seragam ke seluruh sesi.
                  </span>
                </div>
                <Switch
                  checked={applyToAllDevices}
                  onCheckedChange={setApplyToAllDevices}
                  className="data-[state=checked]:bg-red-600"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/50 backdrop-blur-md">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-semibold text-foreground">
                Informasi Sistem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 px-4 pb-4 text-xs text-muted-foreground">
              <div className="flex justify-between py-1 border-b border-border/40">
                <span>ID</span>
                <span className="font-mono text-foreground">{feature.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span>Kategori</span>
                <span className="text-foreground">{feature.category}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span>Eksekusi</span>
                <span className="text-foreground">Native Go REST</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span>Latensi</span>
                <span className="text-foreground">{feature.latency}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
