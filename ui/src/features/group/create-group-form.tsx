import { useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Bot, Loader2, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { upsertGroupRule } from '@/api/bot'
import { createGroup } from '@/api/group'
import { ResultPanel } from '@/components/shared/result-panel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

function parseList(text: string): string[] {
  return text
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function CreateGroupForm() {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [participants, setParticipants] = useState('')
  const [antiLink, setAntiLink] = useState(true)
  const [welcome, setWelcome] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<unknown>(null)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    setResult(null)

    try {
      const res = await createGroup({
        title: title.trim(),
        participants: parseList(participants),
      })
      setResult(res)

      if (res?.group_id && (antiLink || welcome)) {
        await upsertGroupRule({
          group_jid: res.group_id,
          anti_link_enabled: antiLink,
          welcome_enabled: welcome,
          welcome_template: 'Halo {name}, selamat bergabung di {group}!',
        }).catch(() => {})
      }

      toast.success('Grup berhasil dibuat' + (antiLink ? ' dengan proteksi anti-link aktif' : ''))
      setTitle('')
      setParticipants('')
      void queryClient.invalidateQueries({ queryKey: ['groups'] })
      void queryClient.invalidateQueries({ queryKey: ['bot-group-rules'] })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal membuat grup'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="create-group-title">Nama Grup</Label>
        <Input
          id="create-group-title"
          placeholder="Contoh: Komunitas GoWA"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="create-group-participants">Nomor Anggota Awal</Label>
        <Textarea
          id="create-group-participants"
          rows={3}
          placeholder="628123456789, 628987654321 (pisahkan dengan koma/baris baru)"
          value={participants}
          onChange={(event) => setParticipants(event.target.value)}
          className="text-xs resize-none"
        />
      </div>

      <div className="rounded-lg border border-border/70 bg-muted/20 p-3 flex flex-col gap-2.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <Bot className="size-3.5 text-primary" />
          Automasi Bot Awal
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Shield className="size-3.5 text-primary" />
            <Label htmlFor="auto-antilink" className="text-xs text-muted-foreground cursor-pointer">
              Aktifkan Anti-Link (Jaga Grup)
            </Label>
          </div>
          <Switch
            id="auto-antilink"
            checked={antiLink}
            onCheckedChange={setAntiLink}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="auto-welcome" className="text-xs text-muted-foreground cursor-pointer">
            Aktifkan Pesan Sambutan Otomatis
          </Label>
          <Switch
            id="auto-welcome"
            checked={welcome}
            onCheckedChange={setWelcome}
          />
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="self-start h-8 text-xs font-semibold">
        {isSubmitting && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
        Buat Grup Sekarang
      </Button>
      <ResultPanel result={result} />
    </form>
  )
}
