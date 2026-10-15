import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  Clock,
  Code2,
  Copy,
  Key,
  Plus,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { InfoHint } from '@/components/ui/info-hint'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { listApiKeys, createApiKey, deleteApiKey, type ApiKeyItem } from '@/api/apikey'
import { useConnection } from '@/stores/connection'

export default function SettingsApiKeysPage() {
  const queryClient = useQueryClient()
  const baseUrl = useConnection((state) => state.baseUrl)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [keyExpiryDays, setKeyExpiryDays] = useState('0')
  const [keyPermissionScope, setKeyPermissionScope] = useState('*')
  const [createdKeySecret, setCreatedKeySecret] = useState<string | null>(null)
  const [codeLang, setCodeLang] = useState<'curl' | 'js' | 'python' | 'php' | 'go'>('curl')
  const [keyToDelete, setKeyToDelete] = useState<ApiKeyItem | null>(null)

  const { data: keys = [], isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: listApiKeys,
  })

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; permissions: string[]; expires_in_days: number }) =>
      createApiKey(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      setCreatedKeySecret(data.key)
      setNewKeyName('')
      toast.success('Kunci API dibuat')
    },
    onError: (err: any) => {
      toast.error('Gagal membuat kunci API: ' + (err?.message || 'Kesalahan'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      toast.success('Kunci API dihapus')
    },
    onError: (err: any) => {
      toast.error('Gagal menghapus kunci: ' + (err?.message || 'Kesalahan'))
    },
  })

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} disalin`)
  }

  const sampleKey = keys.length > 0 ? keys[0].prefix + '...' : 'gowa_live_sample_token_secret'

  const getCodeSnippet = (lang: string) => {
    const origin = baseUrl || window.location.origin
    const targetEndpoint = `${origin}/send/message`

    switch (lang) {
      case 'curl':
        return `curl -X POST "${targetEndpoint}" \\
  -H "X-API-Key: ${sampleKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone": "6281234567890",
    "message": "Halo dari integrasi GoWA API!"
  }'`
      case 'js':
        return `const res = await fetch("${targetEndpoint}", {
  method: "POST",
  headers: {
    "X-API-Key": "${sampleKey}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    phone: "6281234567890",
    message: "Halo dari aplikasi web!"
  })
});
const data = await res.json();
console.log(data);`
      case 'python':
        return `import requests

res = requests.post(
    "${targetEndpoint}",
    headers={
        "X-API-Key": "${sampleKey}",
        "Content-Type": "application/json"
    },
    json={
        "phone": "6281234567890",
        "message": "Halo dari skrip Python!"
    }
)
print(res.json())`
      case 'php':
        return `<?php
$ch = curl_init("${targetEndpoint}");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "X-API-Key: ${sampleKey}",
    "Content-Type: application/json"
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    "phone" => "6281234567890",
    "message" => "Halo dari backend PHP!"
]));
$response = curl_exec($ch);
curl_close($ch);
echo $response;
?>`
      case 'go':
        return `package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

func main() {
	body, _ := json.Marshal(map[string]string{
		"phone":   "6281234567890",
		"message": "Halo dari layanan Go!",
	})
	req, _ := http.NewRequest("POST", "${targetEndpoint}", bytes.NewBuffer(body))
	req.Header.Set("X-API-Key", "${sampleKey}")
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()
	fmt.Println("Status:", resp.StatusCode)
}`
      default:
        return ''
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="glass-card rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Key className="size-4 text-primary" />
              <span>Kunci API</span>
              <InfoHint
                title="Kunci API"
                items={[
                  'Gunakan di header HTTP: X-API-Key atau Authorization Bearer',
                  'Kunci memberikan akses sesuai izin yang ditentukan',
                  'Simpan kunci di tempat aman segera setelah dibuat',
                ]}
              />
            </CardTitle>
            <CardDescription className="text-xs">
              Autentikasi REST API eksternal.
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="gap-1.5 h-8 text-xs"
          >
            <Plus className="size-3.5" />
            Buat Kunci API
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {isLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
            </div>
          ) : keys.length === 0 ? (
            <div className="border-border/60 bg-muted/20 flex flex-col items-center justify-center rounded-xl border border-dashed py-8 text-center">
              <Key className="text-muted-foreground/60 mb-2 size-8" />
              <p className="text-foreground text-sm font-medium">Belum ada kunci API</p>
              <p className="text-muted-foreground text-xs max-w-sm mt-0.5">
                Buat kunci API untuk integrasi aplikasi.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsCreateOpen(true)}
                className="mt-3.5 h-8 gap-1.5 text-xs"
              >
                <Plus className="size-3.5" />
                Buat Kunci API
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {keys.map((k: ApiKeyItem) => (
                <div
                  key={k.id}
                  className="border-border/60 bg-muted/25 hover:bg-muted/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-3 transition-colors"
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-foreground font-semibold text-xs truncate">
                        {k.name}
                      </span>
                      <Badge variant="outline" className="border-primary/30 text-primary text-[10px] py-0">
                        {k.permissions?.join(', ') || 'Semua Izin'}
                      </Badge>
                      {k.expires_at && (
                        <Badge variant="secondary" className="text-[10px] py-0 gap-1">
                          <Clock className="size-2.5" />
                          Kedaluwarsa: {k.expires_at}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground flex-wrap">
                      <span className="bg-background/80 border border-border/50 px-2 py-0.5 rounded text-[11px]">
                        {k.key_masked}
                      </span>
                      <span className="text-[11px] text-muted-foreground/80">
                        Dibuat: {k.created_at}
                      </span>
                      {k.last_used_at && (
                        <span className="text-[11px] text-emerald-500 font-sans">
                          • Dipakai: {k.last_used_at}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(k.prefix, 'Prefix')}
                      className="h-8 gap-1 text-xs"
                    >
                      <Copy className="size-3.5" />
                      Salin
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setKeyToDelete(k)}
                      disabled={deleteMutation.isPending}
                      className="text-destructive hover:bg-destructive/10 h-8 gap-1 text-xs"
                    >
                      <Trash2 className="size-3.5" />
                      Hapus
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card rounded-xl">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Code2 className="size-4 text-primary" />
                Panduan Integrasi
              </CardTitle>
              <CardDescription className="text-xs">
                Contoh pemanggilan endpoint pengiriman pesan dari berbagai bahasa pemrograman.
              </CardDescription>
            </div>
            <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border/50">
              {(['curl', 'js', 'python', 'php', 'go'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setCodeLang(lang)}
                  className={`text-xs px-2.5 py-1 rounded font-mono font-medium transition-colors ${
                    codeLang === lang
                      ? 'bg-background shadow-xs text-foreground font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="relative">
            <pre className="border-border/60 bg-muted/40 text-foreground overflow-x-auto rounded-lg border p-3 font-mono text-[11px] leading-relaxed">
              {getCodeSnippet(codeLang)}
            </pre>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(getCodeSnippet(codeLang), 'Kode')}
              className="absolute top-2 right-2 h-7 gap-1 text-xs bg-background/80 backdrop-blur-xs"
            >
              <Copy className="size-3" />
              Salin
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
              <Key className="size-4 text-primary" />
              Buat Kunci API
            </DialogTitle>
            <DialogDescription className="text-xs">
              Tentukan nama, masa berlaku, dan cakupan izin kunci akses.
            </DialogDescription>
          </DialogHeader>

          {createdKeySecret ? (
            <div className="flex flex-col gap-3 py-2">
              <div className="border-amber-500/40 bg-amber-500/10 text-amber-500 rounded-lg border p-3 text-xs flex items-start gap-2">
                <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                <p>
                  Salin kunci API ini sekarang. Nilai rahasia tidak akan ditampilkan kembali setelah dialog ditutup.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Kunci Rahasia</Label>
                <div className="relative">
                  <Input
                    readOnly
                    value={createdKeySecret}
                    className="font-mono text-xs pr-9 bg-muted/40 font-bold text-primary"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(createdKeySecret, 'Kunci API')}
                    className="absolute right-1 top-1 h-7 w-7 p-0"
                  >
                    <Copy className="size-3.5" />
                  </Button>
                </div>
              </div>

              <DialogFooter className="mt-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setCreatedKeySecret(null)
                    setIsCreateOpen(false)
                  }}
                  className="h-8 text-xs w-full sm:w-auto"
                >
                  Selesai
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="flex flex-col gap-3 py-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="key-name" className="text-xs">Nama Kunci</Label>
                <Input
                  id="key-name"
                  placeholder="Nama"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Masa Berlaku</Label>
                  <Select value={keyExpiryDays} onValueChange={setKeyExpiryDays}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Permanen</SelectItem>
                      <SelectItem value="30">30 Hari</SelectItem>
                      <SelectItem value="90">90 Hari</SelectItem>
                      <SelectItem value="365">1 Tahun</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Cakupan Izin</Label>
                  <Select value={keyPermissionScope} onValueChange={setKeyPermissionScope}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="*">Semua Endpoint (*)</SelectItem>
                      <SelectItem value="send:*">Kirim Pesan Saja</SelectItem>
                      <SelectItem value="read:*">Hanya Baca</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateOpen(false)}
                  className="h-8 text-xs"
                >
                  Batal
                </Button>
                <Button
                  size="sm"
                  disabled={!newKeyName.trim() || createMutation.isPending}
                  onClick={() =>
                    createMutation.mutate({
                      name: newKeyName.trim(),
                      permissions: [keyPermissionScope],
                      expires_in_days: Number(keyExpiryDays),
                    })
                  }
                  className="h-8 text-xs"
                >
                  {createMutation.isPending ? 'Membuat…' : 'Buat Kunci API'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!keyToDelete} onOpenChange={(open) => !open && setKeyToDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Hapus Kunci API?</DialogTitle>
            <DialogDescription className="text-xs">
              Kunci "{keyToDelete?.name}" tidak dapat digunakan lagi setelah dihapus.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setKeyToDelete(null)}
              className="h-8 text-xs"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (keyToDelete) {
                  deleteMutation.mutate(keyToDelete.id, {
                    onSettled: () => setKeyToDelete(null),
                  })
                }
              }}
              className="h-8 text-xs gap-1.5"
            >
              {deleteMutation.isPending ? 'Menghapus…' : 'Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
