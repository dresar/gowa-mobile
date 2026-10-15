import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Eye, EyeOff, Save, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { InfoHint } from '@/components/ui/info-hint'
import { getAppSettings, updateAppSettings } from '@/api/settings'

export default function SettingsAiPage() {
  const queryClient = useQueryClient()
  const { data: settings, isLoading } = useQuery({
    queryKey: ['app-settings'],
    queryFn: getAppSettings,
  })

  const [aiProvider, setAiProvider] = useState('openai')
  const [aiBaseUrl, setAiBaseUrl] = useState('')
  const [aiModel, setAiModel] = useState('')
  const [aiApiKey, setAiApiKey] = useState('')
  const [showAiKey, setShowAiKey] = useState(false)
  const [botAutoReply, setBotAutoReply] = useState(false)

  const [supermemoryEnabled, setSupermemoryEnabled] = useState(true)
  const [supermemoryKey, setSupermemoryKey] = useState('')
  const [showSmKey, setShowSmKey] = useState(false)

  useEffect(() => {
    if (settings) {
      setAiProvider(settings.bot_ai_provider || 'openai')
      setAiBaseUrl(settings.bot_ai_base_url || '')
      setAiModel(settings.bot_ai_model || '')
      setAiApiKey(settings.bot_ai_api_key || '')
      setBotAutoReply(settings.bot_ai_auto_reply_enabled ?? false)
      setSupermemoryEnabled(settings.supermemory_enabled ?? true)
      setSupermemoryKey(settings.supermemory_api_key || '')
    }
  }, [settings])

  const mutation = useMutation({
    mutationFn: updateAppSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings'] })
      toast.success('Pengaturan disimpan')
    },
    onError: (err: any) => {
      toast.error('Gagal menyimpan: ' + (err?.message || 'Kesalahan sistem'))
    },
  })

  const handleSave = () => {
    mutation.mutate({
      bot_ai_provider: aiProvider,
      bot_ai_base_url: aiBaseUrl.trim(),
      bot_ai_model: aiModel.trim(),
      bot_ai_api_key: aiApiKey.trim(),
      bot_ai_auto_reply_enabled: botAutoReply,
      supermemory_enabled: supermemoryEnabled,
      supermemory_api_key: supermemoryKey.trim(),
    })
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-44 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="glass-card rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="size-4 text-primary" />
            <span>Penyedia Model AI</span>
            <InfoHint
              title="Penyedia Model AI"
              description="Konfigurasi model AI untuk membalas pesan secara cerdas."
              items={[
                'Pilih penyedia: OpenAI, Claude, Gemini, Groq, Ollama, atau ByNara.',
                'Isi model, base URL, dan API Key yang valid.',
                'Aktifkan Balas Otomatis AI jika ingin model merespons pesan secara mandiri.',
              ]}
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3.5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Penyedia AI</Label>
              <Select value={aiProvider} onValueChange={setAiProvider}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                  <SelectItem value="gemini">Google Gemini</SelectItem>
                  <SelectItem value="groq">Groq</SelectItem>
                  <SelectItem value="ollama">Ollama</SelectItem>
                  <SelectItem value="bynara">ByNara Router</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ai-model" className="text-xs">Nama Model</Label>
              <Input
                id="ai-model"
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                placeholder="Model"
                className="font-mono text-xs"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ai-base-url" className="text-xs">Base URL</Label>
            <Input
              id="ai-base-url"
              value={aiBaseUrl}
              onChange={(e) => setAiBaseUrl(e.target.value)}
              placeholder="URL"
              className="font-mono text-xs"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ai-api-key" className="text-xs">API Key</Label>
            <div className="relative">
              <Input
                id="ai-api-key"
                type={showAiKey ? 'text' : 'password'}
                value={aiApiKey}
                onChange={(e) => setAiApiKey(e.target.value)}
                placeholder="Key"
                className="font-mono text-xs pr-8"
              />
              <button
                type="button"
                onClick={() => setShowAiKey(!showAiKey)}
                className="text-muted-foreground hover:text-foreground absolute right-2.5 top-2"
              >
                {showAiKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            </div>
          </div>

          <div className="border-border/50 bg-muted/20 flex items-center justify-between rounded-lg border p-2.5">
            <Label htmlFor="bot-auto-reply" className="font-medium text-xs">
              Balas Otomatis AI
            </Label>
            <Switch
              id="bot-auto-reply"
              checked={botAutoReply}
              onCheckedChange={setBotAutoReply}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <span>Integrasi Supermemory</span>
            <InfoHint
              title="Integrasi Supermemory"
              description="Penyimpanan memori jangka panjang konteks percakapan kontak."
              items={[
                'Sinkronisasi riwayat obrolan ke Supermemory.',
                'Memungkinkan AI mengingat preferensi user di setiap percakapan.',
              ]}
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3.5">
          <div className="border-border/50 bg-muted/20 flex items-center justify-between rounded-lg border p-2.5">
            <Label htmlFor="supermemory-switch" className="font-medium text-xs">
              Aktifkan Supermemory
            </Label>
            <Switch
              id="supermemory-switch"
              checked={supermemoryEnabled}
              onCheckedChange={setSupermemoryEnabled}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sm-key" className="text-xs">Supermemory API Key</Label>
            <div className="relative">
              <Input
                id="sm-key"
                type={showSmKey ? 'text' : 'password'}
                value={supermemoryKey}
                onChange={(e) => setSupermemoryKey(e.target.value)}
                placeholder="Key"
                className="font-mono text-xs pr-8"
              />
              <button
                type="button"
                onClick={() => setShowSmKey(!showSmKey)}
                className="text-muted-foreground hover:text-foreground absolute right-2.5 top-2"
              >
                {showSmKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            </div>
          </div>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={mutation.isPending}
            className="self-start h-8 text-xs gap-1.5 mt-1"
          >
            <Save className="size-3.5" />
            {mutation.isPending ? 'Menyimpan…' : 'Simpan Perubahan'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
