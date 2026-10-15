import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Eye, EyeOff, MessageSquare, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { InfoHint } from '@/components/ui/info-hint'
import { getAppSettings, updateAppSettings } from '@/api/settings'

export default function SettingsChatwootPage() {
  const queryClient = useQueryClient()
  const { data: settings, isLoading } = useQuery({
    queryKey: ['app-settings'],
    queryFn: getAppSettings,
  })

  const [chatwootEnabled, setChatwootEnabled] = useState(false)
  const [chatwootUrl, setChatwootUrl] = useState('')
  const [chatwootAccountId, setChatwootAccountId] = useState(0)
  const [chatwootInboxId, setChatwootInboxId] = useState(0)
  const [chatwootApiToken, setChatwootApiToken] = useState('')
  const [showToken, setShowToken] = useState(false)

  useEffect(() => {
    if (settings) {
      setChatwootEnabled(settings.chatwoot_enabled ?? false)
      setChatwootUrl(settings.chatwoot_url || '')
      setChatwootAccountId(settings.chatwoot_account_id || 0)
      setChatwootInboxId(settings.chatwoot_inbox_id || 0)
      setChatwootApiToken(settings.chatwoot_api_token || '')
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
      chatwoot_enabled: chatwootEnabled,
      chatwoot_url: chatwootUrl.trim(),
      chatwoot_account_id: Number(chatwootAccountId) || 0,
      chatwoot_inbox_id: Number(chatwootInboxId) || 0,
      chatwoot_api_token: chatwootApiToken.trim(),
    })
  }

  if (isLoading) {
    return <Skeleton className="h-72 w-full rounded-xl" />
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="glass-card rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <MessageSquare className="size-4 text-primary" />
            <span>Integrasi Chatwoot</span>
            <InfoHint
              title="Integrasi Chatwoot"
              description="Hubungkan pesan WhatsApp ke platform multi-agen Chatwoot."
              items={[
                'Meneruskan pesan masuk ke antrean inbox Chatwoot.',
                'Isi URL Server, Account ID, Inbox ID, dan API Token Chatwoot.',
              ]}
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3.5">
          <div className="border-border/50 bg-muted/20 flex items-center justify-between rounded-lg border p-2.5">
            <Label htmlFor="chatwoot-active" className="font-medium text-xs">
              Aktifkan Chatwoot
            </Label>
            <Switch
              id="chatwoot-active"
              checked={chatwootEnabled}
              onCheckedChange={setChatwootEnabled}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="chatwoot-url" className="text-xs">Server URL</Label>
            <Input
              id="chatwoot-url"
              value={chatwootUrl}
              onChange={(e) => setChatwootUrl(e.target.value)}
              placeholder="URL"
              className="font-mono text-xs"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="chatwoot-acc" className="text-xs">Account ID</Label>
              <Input
                id="chatwoot-acc"
                type="number"
                value={chatwootAccountId || ''}
                onChange={(e) => setChatwootAccountId(Number(e.target.value))}
                placeholder="ID"
                className="font-mono text-xs"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="chatwoot-inbox" className="text-xs">Inbox ID</Label>
              <Input
                id="chatwoot-inbox"
                type="number"
                value={chatwootInboxId || ''}
                onChange={(e) => setChatwootInboxId(Number(e.target.value))}
                placeholder="ID"
                className="font-mono text-xs"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="chatwoot-token" className="text-xs">Token Akses API</Label>
            <div className="relative">
              <Input
                id="chatwoot-token"
                type={showToken ? 'text' : 'password'}
                value={chatwootApiToken}
                onChange={(e) => setChatwootApiToken(e.target.value)}
                placeholder="Token"
                className="font-mono text-xs pr-8"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="text-muted-foreground hover:text-foreground absolute right-2.5 top-2"
              >
                {showToken ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
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
