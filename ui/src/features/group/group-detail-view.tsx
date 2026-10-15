import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Bot,
  Info,
  Link,
  Lock,
  MessageSquare,
  Save,
  Shield,
  ShieldAlert,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getGroupRule,
  upsertGroupRule,
  deleteGroupRule,
  type UpsertGroupRulePayload,
} from '@/api/bot'
import type { MyGroup } from '@/api/group'
import { IdText } from '@/components/shared/id-text'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { GroupOverview } from '@/features/group/info-form'
import { InviteLinkForm } from '@/features/group/invite-link-form'
import { ParticipantRequests } from '@/features/group/participant-requests'
import { ParticipantsPanel } from '@/features/group/participants-panel'
import { SetAnnounceForm } from '@/features/group/set-announce-form'
import { SetLockedForm } from '@/features/group/set-locked-form'
import { SetNameForm } from '@/features/group/set-name-form'
import { SetPhotoForm } from '@/features/group/set-photo-form'
import { SetTopicForm } from '@/features/group/set-topic-form'

export function GroupDetailView({
  group,
  onBack,
}: {
  group: MyGroup
  onBack: () => void
}) {
  const queryClient = useQueryClient()
  const groupJid = group.JID

  const { data: initialRule, isLoading: isLoadingRule } = useQuery({
    queryKey: ['bot-group-rule', groupJid],
    queryFn: () => getGroupRule(groupJid),
    retry: false,
  })

  const [antiLink, setAntiLink] = useState(false)
  const [welcome, setWelcome] = useState(false)
  const [welcomeTpl, setWelcomeTpl] = useState('Halo {name}, selamat bergabung di {group}!')
  const [farewell, setFarewell] = useState(false)
  const [farewellTpl, setFarewellTpl] = useState('Selamat tinggal {name}, terima kasih!')

  useEffect(() => {
    if (initialRule) {
      setAntiLink(Boolean(initialRule.anti_link_enabled))
      setWelcome(Boolean(initialRule.welcome_enabled))
      if (initialRule.welcome_template) {
        setWelcomeTpl(initialRule.welcome_template)
      }
      setFarewell(Boolean(initialRule.farewell_enabled))
      if (initialRule.farewell_template) {
        setFarewellTpl(initialRule.farewell_template)
      }
    }
  }, [initialRule])

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload: UpsertGroupRulePayload = {
        group_jid: groupJid,
        anti_link_enabled: antiLink,
        welcome_enabled: welcome,
        welcome_template: welcomeTpl,
        farewell_enabled: farewell,
        farewell_template: farewellTpl,
      }
      return upsertGroupRule(payload)
    },
    onSuccess: () => {
      toast.success('Pengaturan bot grup berhasil disimpan')
      void queryClient.invalidateQueries({ queryKey: ['bot-group-rule', groupJid] })
      void queryClient.invalidateQueries({ queryKey: ['bot-group-rules'] })
    },
    onError: (err: Error) => {
      toast.error('Gagal menyimpan: ' + (err.message || 'Terjadi kesalahan'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteGroupRule(groupJid),
    onSuccess: () => {
      toast.success('Kebijakan bot grup telah direset')
      setAntiLink(false)
      setWelcome(false)
      setFarewell(false)
      void queryClient.invalidateQueries({ queryKey: ['bot-group-rule', groupJid] })
      void queryClient.invalidateQueries({ queryKey: ['bot-group-rules'] })
    },
    onError: (err: Error) => {
      toast.error('Gagal mereset: ' + (err.message || 'Terjadi kesalahan'))
    },
  })

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="h-8 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Kembali
          </Button>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-foreground tracking-tight">
                {group.Name || 'Detail Grup'}
              </h1>
              {group.IsAnnounce && (
                <Badge variant="outline" className="border-amber-500/30 text-amber-500 text-[10px] py-0">
                  Hanya Admin
                </Badge>
              )}
              {group.IsLocked && (
                <Badge variant="outline" className="border-border text-muted-foreground text-[10px] py-0">
                  Terkunci
                </Badge>
              )}
              {antiLink && (
                <Badge className="bg-emerald-500/15 border-emerald-500/30 text-emerald-500 text-[10px] py-0 gap-1">
                  <Shield className="size-2.5" />
                  Anti-Link Aktif
                </Badge>
              )}
            </div>
            <IdText value={groupJid} />
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto scrollbar-none h-9 p-1 bg-card/80 border border-border/60">
          <TabsTrigger value="overview" className="gap-1.5 text-xs">
            <Info className="size-3.5" />
            Ringkasan
          </TabsTrigger>
          <TabsTrigger value="participants" className="gap-1.5 text-xs">
            <Users className="size-3.5" />
            Anggota
          </TabsTrigger>
          <TabsTrigger value="automation" className="gap-1.5 text-xs">
            <Bot className="size-3.5 text-primary" />
            Automasi & Jaga Grup
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5 text-xs">
            <Lock className="size-3.5" />
            Pengaturan WhatsApp
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex flex-col gap-5 pt-4">
          <Card className="glass-card rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Info className="size-4 text-primary" />
                Informasi & Deskripsi Grup
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GroupOverview groupJid={groupJid} />
            </CardContent>
          </Card>

          <Card className="glass-card rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Link className="size-4 text-primary" />
                Tautan Undangan Grup
              </CardTitle>
              <CardDescription className="text-xs">
                Bagikan tautan ini agar anggota baru dapat bergabung langsung ke dalam grup.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InviteLinkForm groupJid={groupJid} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="participants" className="flex flex-col gap-5 pt-4">
          <Card className="glass-card rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="size-4 text-primary" />
                Daftar Anggota & Admin
              </CardTitle>
              <CardDescription className="text-xs">
                Kelola hak istimewa anggota grup atau keluarkan peserta.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ParticipantsPanel groupJid={groupJid} />
            </CardContent>
          </Card>

          <Card className="glass-card rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <UserPlus className="size-4 text-primary" />
                Permintaan Bergabung
              </CardTitle>
              <CardDescription className="text-xs">
                Daftar calon anggota yang menunggu persetujuan admin.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ParticipantRequests groupJid={groupJid} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="flex flex-col gap-5 pt-4">
          <Card className="glass-card rounded-xl border-primary/20 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <ShieldAlert className="size-4 text-primary" />
                    Automasi Bot & Keamanan Grup (Jaga Grup)
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Atur keamanan otomatis, penyaringan tautan spam, dan pesan interaktif anggota grup.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {initialRule && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteMutation.mutate()}
                      disabled={deleteMutation.isPending}
                      className="h-8 gap-1.5 text-xs text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="size-3.5" />
                      Reset
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending || isLoadingRule}
                    className="h-8 gap-1.5 text-xs font-semibold"
                  >
                    <Save className="size-3.5" />
                    Simpan Pengaturan Bot
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-6">
              <div className="rounded-lg border border-border/70 bg-muted/20 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <Shield className="size-4 text-primary" />
                      <Label htmlFor="toggle-antilink" className="text-xs font-semibold text-foreground cursor-pointer">
                        Jaga Grup (Anti-Link)
                      </Label>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Otomatis menghapus pesan promosi atau tautan website/grup lain jika dikirim oleh anggota non-admin.
                    </p>
                  </div>
                  <Switch
                    id="toggle-antilink"
                    checked={antiLink}
                    onCheckedChange={setAntiLink}
                  />
                </div>
                {antiLink && (
                  <div className="rounded-md bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-[11px] text-amber-500 flex items-center gap-2">
                    <Info className="size-3.5 shrink-0" />
                    Pastikan nomor bot sudah diangkat sebagai Admin grup agar dapat menghapus pesan anggota secara otomatis.
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-border/70 bg-muted/20 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <UserCheck className="size-4 text-emerald-500" />
                      <Label htmlFor="toggle-welcome" className="text-xs font-semibold text-foreground cursor-pointer">
                        Pesan Sambutan (Welcome Message)
                      </Label>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Kirim pesan otomatis ke grup setiap kali ada anggota baru yang bergabung.
                    </p>
                  </div>
                  <Switch
                    id="toggle-welcome"
                    checked={welcome}
                    onCheckedChange={setWelcome}
                  />
                </div>

                {welcome && (
                  <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] text-muted-foreground font-medium">
                        Template Pesan Sambutan:
                      </Label>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setWelcomeTpl('Halo {name}, selamat bergabung di {group}! Harap patuhi tata tertib grup ya.')}
                          className="h-6 text-[10px] px-2 text-primary"
                        >
                          Pakai Preset Sopan
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      rows={3}
                      value={welcomeTpl}
                      onChange={(e) => setWelcomeTpl(e.target.value)}
                      placeholder="Contoh: Halo {name}, selamat datang di {group}!"
                      className="text-xs resize-none"
                    />
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>Placeholder yang didukung:</span>
                      <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">{"{name}"}</code>
                      <span>(nama anggota),</span>
                      <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">{"{group}"}</code>
                      <span>(nama grup)</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-border/70 bg-muted/20 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="size-4 text-rose-500" />
                      <Label htmlFor="toggle-farewell" className="text-xs font-semibold text-foreground cursor-pointer">
                        Pesan Perpisahan (Farewell Message)
                      </Label>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Kirim pesan otomatis saat anggota keluar atau dikeluarkan dari grup.
                    </p>
                  </div>
                  <Switch
                    id="toggle-farewell"
                    checked={farewell}
                    onCheckedChange={setFarewell}
                  />
                </div>

                {farewell && (
                  <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] text-muted-foreground font-medium">
                        Template Pesan Perpisahan:
                      </Label>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setFarewellTpl('Sampai jumpa {name}, terima kasih telah menjadi bagian dari {group}!')}
                          className="h-6 text-[10px] px-2 text-primary"
                        >
                          Pakai Preset Pamit
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      rows={3}
                      value={farewellTpl}
                      onChange={(e) => setFarewellTpl(e.target.value)}
                      placeholder="Contoh: Selamat tinggal {name}!"
                      className="text-xs resize-none"
                    />
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>Placeholder:</span>
                      <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">{"{name}"}</code>
                      <span>(nama anggota),</span>
                      <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">{"{group}"}</code>
                      <span>(nama grup)</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="flex flex-col gap-5 pt-4">
          <Card className="glass-card rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Nama & Topik Grup</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <SetNameForm groupJid={groupJid} initialName={group.Name} />
              <Separator />
              <SetTopicForm groupJid={groupJid} initialTopic={group.Topic} />
            </CardContent>
          </Card>

          <Card className="glass-card rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Foto Profil & Izin Peserta</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <SetPhotoForm groupJid={groupJid} />
              <Separator />
              <div className="flex flex-col gap-4">
                <SetAnnounceForm groupJid={groupJid} initialAnnounce={group.IsAnnounce} />
                <SetLockedForm groupJid={groupJid} initialLocked={group.IsLocked} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
