import { useState, type ComponentType, type ReactNode } from 'react'
import {
  BarChart3,
  FileUp,
  Image,
  Keyboard,
  Link2,
  ListChecks,
  MapPin,
  MessageSquareText,
  Mic,
  Radio,
  Send,
  Sticker,
  UserRound,
  Video,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DeviceGuard, useSelectedDevice } from '@/hooks/use-device-guard'
import { cn } from '@/lib/utils'
import { RecipientBar } from '@/features/messaging/recipient-bar'
import { SendTextForm } from '@/features/send/text-form'
import { SendImageForm } from '@/features/send/image-form'
import { SendFileForm } from '@/features/send/file-form'
import { SendVideoForm } from '@/features/send/video-form'
import { SendStickerForm } from '@/features/send/sticker-form'
import { SendAudioForm } from '@/features/send/audio-form'
import { SendContactForm } from '@/features/send/contact-form'
import { SendLocationForm } from '@/features/send/location-form'
import { SendLinkForm } from '@/features/send/link-form'
import { SendPollForm } from '@/features/send/poll-form'
import { SendPresenceForm } from '@/features/send/presence-form'
import { SendChatPresenceForm } from '@/features/send/chat-presence-form'
import {
  DeleteForm,
  ForwardForm,
  ReactForm,
  ReadForm,
  RevokeForm,
  StarForm,
  UpdateForm,
} from '@/features/message/message-forms'

interface ComposeType {
  value: string
  label: string
  icon: ComponentType<{ className?: string }>
  form: ReactNode
}

const composeGroups: { label: string; items: ComposeType[] }[] = [
  {
    label: 'Standar',
    items: [
      { value: 'text', label: 'Teks', icon: MessageSquareText, form: <SendTextForm /> },
    ],
  },
  {
    label: 'Media',
    items: [
      { value: 'image', label: 'Gambar', icon: Image, form: <SendImageForm /> },
      { value: 'video', label: 'Video', icon: Video, form: <SendVideoForm /> },
      { value: 'file', label: 'Dokumen', icon: FileUp, form: <SendFileForm /> },
      { value: 'audio', label: 'Audio', icon: Mic, form: <SendAudioForm /> },
      { value: 'sticker', label: 'Stiker', icon: Sticker, form: <SendStickerForm /> },
    ],
  },
  {
    label: 'Konten',
    items: [
      { value: 'contact', label: 'Kontak', icon: UserRound, form: <SendContactForm /> },
      { value: 'location', label: 'Lokasi', icon: MapPin, form: <SendLocationForm /> },
      { value: 'link', label: 'Tautan', icon: Link2, form: <SendLinkForm /> },
      { value: 'poll', label: 'Polling', icon: BarChart3, form: <SendPollForm /> },
    ],
  },
  {
    label: 'Status',
    items: [
      { value: 'presence', label: 'Kehadiran', icon: Radio, form: <SendPresenceForm /> },
      {
        value: 'chat-presence',
        label: 'Status Mengetik',
        icon: Keyboard,
        form: <SendChatPresenceForm />,
      },
    ],
  },
]

const allComposeTypes = composeGroups.flatMap((group) => group.items)

function ComposePanel() {
  const [type, setType] = useState('text')
  const active = allComposeTypes.find((item) => item.value === type) ?? allComposeTypes[0]

  return (
    <div className="grid gap-4 lg:grid-cols-[210px_1fr]">
      {/* Type picker: vertical glass segment list on desktop */}
      <div className="glass-card hidden flex-col gap-3 rounded-xl p-2.5 backdrop-blur-xl lg:flex">
        {composeGroups.map((group) => (
          <div key={group.label} className="flex flex-col gap-0.5">
            <p className="text-muted-foreground/70 px-2.5 pb-1 text-[10px] font-semibold tracking-wider uppercase">
              {group.label}
            </p>
            {group.items.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setType(value)}
                aria-pressed={type === value}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-all duration-150',
                  type === value
                    ? 'border-y border-r border-l-2 border-primary border-primary/25 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent font-semibold text-primary shadow-2xs shadow-primary/15'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                )}
              >
                <Icon
                  className={cn(
                    'size-3.5 shrink-0',
                    type === value ? 'text-primary' : 'text-muted-foreground',
                  )}
                />
                <span className="truncate">{label}</span>
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Type picker: dropdown on mobile */}
      <div className="flex flex-col gap-1.5 lg:hidden">
        <Label className="text-xs">Tipe Pesan</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="h-8.5 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="text-xs">
            {composeGroups.map((group) => (
              <SelectGroup key={group.label}>
                <SelectLabel className="text-[10px] uppercase">{group.label}</SelectLabel>
                {group.items.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Compose Form in Glass Card */}
      <Card className="glass-card rounded-xl backdrop-blur-xl">
        <CardContent key={active.value} className="animate-in fade-in p-4 duration-200 sm:p-5">
          <div className="border-border/60 mb-4 flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <span className="border-primary/25 bg-primary/10 text-primary flex size-7 items-center justify-center rounded-lg border">
                <active.icon className="size-3.5" />
              </span>
              <div>
                <h3 className="text-foreground text-sm font-semibold">{active.label}</h3>
                <p className="text-muted-foreground text-[11px]">
                  Kirim pesan WhatsApp
                </p>
              </div>
            </div>
            <span className="bg-muted/60 text-muted-foreground rounded px-2 py-0.5 font-mono text-[10px]">
              POST /send/{active.value}
            </span>
          </div>
          {active.form}
        </CardContent>
      </Card>
    </div>
  )
}

const actions = [
  {
    value: 'react',
    label: 'Beri Emoji',
    render: (id: string) => <ReactForm messageId={id} />,
  },
  {
    value: 'update',
    label: 'Edit Pesan',
    render: (id: string) => <UpdateForm messageId={id} />,
  },
  { value: 'read', label: 'Tandai Dibaca', render: (id: string) => <ReadForm messageId={id} /> },
  { value: 'star', label: 'Bintang', render: (id: string) => <StarForm messageId={id} /> },
  {
    value: 'revoke',
    label: 'Tarik Pesan',
    render: (id: string) => <RevokeForm messageId={id} />,
  },
  {
    value: 'delete',
    label: 'Hapus Pesan',
    render: (id: string) => <DeleteForm messageId={id} />,
  },
  {
    value: 'forward',
    label: 'Teruskan Pesan',
    render: (id: string) => <ForwardForm messageId={id} />,
  },
]

function ActPanel() {
  const [messageId, setMessageId] = useState('')
  const [action, setAction] = useState('react')
  const active = actions.find((item) => item.value === action) ?? actions[0]

  return (
    <Card className="glass-card rounded-xl backdrop-blur-xl">
      <CardContent className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="act-message-id" className="text-xs font-medium">
              ID Pesan
            </Label>
            <Input
              id="act-message-id"
              className="font-mono text-xs"
              value={messageId}
              onChange={(event) => setMessageId(event.target.value)}
              placeholder="3EB0XXXXX"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium">Aksi</Label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger className="h-8.5 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="text-xs">
                {actions.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div key={active.value} className="animate-in fade-in pt-2 duration-200">
          {active.render(messageId)}
        </div>
      </CardContent>
    </Card>
  )
}

export default function MessagingPage() {
  const device = useSelectedDevice()

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <PageHeader
        title="Kirim Pesan"
        description="Kirim dan kelola pesan."
      />
      {device === null ? (
        <DeviceGuard />
      ) : (
        <>
          <RecipientBar />
          <Tabs defaultValue="compose" className="gap-3">
            <TabsList className="border-border/70 bg-card/60 h-9 rounded-lg border p-1 backdrop-blur-md">
              <TabsTrigger value="compose" className="h-7 rounded-md text-xs font-medium">
                <Send className="size-3.5" />
                Buat Pesan
              </TabsTrigger>
              <TabsTrigger value="act" className="h-7 rounded-md text-xs font-medium">
                <ListChecks className="size-3.5" />
                Aksi Pesan
              </TabsTrigger>
            </TabsList>
            <TabsContent value="compose" className="pt-1">
              <ComposePanel />
            </TabsContent>
            <TabsContent value="act" className="pt-1">
              <ActPanel />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
