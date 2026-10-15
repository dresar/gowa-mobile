import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save, Sparkles, Webhook } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { InfoHint } from '@/components/ui/info-hint'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { getAppSettings, updateAppSettings } from '@/api/settings'

export default function SettingsWebhookPage() {
  const queryClient = useQueryClient()
  const { data: settings, isLoading } = useQuery({
    queryKey: ['app-settings'],
    queryFn: getAppSettings,
  })

  const [webhookUrlsText, setWebhookUrlsText] = useState('')
  const [webhookSecretInput, setWebhookSecretInput] = useState('')

  useEffect(() => {
    if (settings) {
      setWebhookUrlsText(settings.webhook_url ? settings.webhook_url.join('\n') : '')
      setWebhookSecretInput(settings.webhook_secret || '')
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

  const handleRandomSecret = () => {
    const bytes = new Uint8Array(16)
    crypto.getRandomValues(bytes)
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
    setWebhookSecretInput('whsec_' + hex)
    toast.success('Kunci rahasia diacak')
  }

  const handleSave = () => {
    const urls = webhookUrlsText
      .split('\n')
      .map((u) => u.trim())
      .filter(Boolean)
    mutation.mutate({
      webhook_url: urls,
      webhook_secret: webhookSecretInput.trim(),
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
            <Webhook className="size-4 text-primary" />
            <span>Webhook Gateway</span>
            <InfoHint
              title="Webhook Gateway"
              items={[
                'Meneruskan pesan masuk dan update status koneksi ke URL Anda',
                'Header X-Hub-Signature-256 memuat HMAC-SHA256 untuk verifikasi payload',
                'Satu URL per baris jika mengirim ke beberapa server',
              ]}
            />
          </CardTitle>
          <CardDescription className="text-xs">
            Teruskan pesan masuk ke server eksternal.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="webhook-urls" className="text-xs">
              URL Tujuan
            </Label>
            <Textarea
              id="webhook-urls"
              rows={3}
              value={webhookUrlsText}
              onChange={(e) => setWebhookUrlsText(e.target.value)}
              placeholder="https://domain.com/api/webhook"
              className="font-mono text-xs"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="webhook-secret" className="text-xs">
              Kunci Rahasia
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="webhook-secret"
                value={webhookSecretInput}
                onChange={(e) => setWebhookSecretInput(e.target.value)}
                placeholder="Secret"
                className="font-mono text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRandomSecret}
                className="h-8 text-xs shrink-0 gap-1.5"
              >
                <Sparkles className="size-3" />
                Acak
              </Button>
            </div>
          </div>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={mutation.isPending}
            className="self-start h-8 text-xs gap-1.5"
          >
            <Save className="size-3.5" />
            {mutation.isPending ? 'Menyimpan…' : 'Simpan Perubahan'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
