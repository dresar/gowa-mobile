import { useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  FileText,
  Image as ImageIcon,
  Loader2,
  Music,
  Paperclip,
  RefreshCw,
  Send,
  Smile,
  Video,
  X,
} from 'lucide-react'
import { getChatMessages, type ChatInfo, type MessageInfo } from '@/api/chat'
import { sendAudio, sendFile, sendImage, sendSticker, sendText, sendVideo } from '@/api/send'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MessageMedia } from '@/features/chat/message-media'
import { ChatControls } from '@/features/chat/chat-controls'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { chatMessagesQueryKey } from '@/features/chat/device-scope'
import { chatDisplayName, senderDisplayName } from '@/features/chat/display-name'
import { useActionMutation } from '@/hooks/use-action-mutation'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { ScheduleFields } from '@/features/send/schedule-fields'
import { useScheduleDraft } from '@/features/send/use-schedule-draft'

const PAGE_SIZE = 30

function sortMessagesChronologically(messages: MessageInfo[]): MessageInfo[] {
  return [...messages].sort((left, right) => {
    return new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime()
  })
}

function dayKey(timestamp: string): string {
  return new Date(timestamp).toDateString()
}

function MessageBubble({ message, deviceId }: { message: MessageInfo; deviceId: string }) {
  const hasMedia = message.media_type && message.media_type !== ''
  return (
    <div className={cn('flex', message.is_from_me ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[82%] rounded-xl px-3 py-2 text-xs shadow-2xs backdrop-blur-md transition-all sm:text-[13px]',
          message.is_from_me
            ? 'rounded-tr-xs border border-primary/40 bg-[image:var(--btn-bg)] text-white shadow-xs'
            : 'border-border/80 bg-card/85 text-foreground rounded-tl-xs border',
        )}
      >
        {!message.is_from_me && (
          <p className="text-primary mb-0.5 font-mono text-[10px] font-semibold">
            {senderDisplayName(message)}
          </p>
        )}
        {message.content && (
          <p className="leading-relaxed break-words whitespace-pre-wrap">{message.content}</p>
        )}
        {hasMedia && <MessageMedia message={message} deviceId={deviceId} />}
        {message.reactions && message.reactions.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {message.reactions.map((r) => (
              <span
                key={r.emoji}
                className="border-border/60 bg-muted/60 py-0.2 rounded-md border px-1 text-[10px]"
              >
                {r.emoji}
              </span>
            ))}
          </div>
        )}
        <p
          className={cn(
            'mt-1 text-right font-mono text-[9px]',
            message.is_from_me ? 'text-white/80' : 'text-muted-foreground/80',
          )}
        >
          {formatDate(message.timestamp)}
        </p>
      </div>
    </div>
  )
}

interface PendingAttachment {
  file: File
  type: 'file' | 'image' | 'video' | 'audio' | 'sticker'
  previewUrl?: string
}

export function MessageView({
  chat,
  deviceId,
  onBack,
}: {
  chat: ChatInfo
  deviceId: string
  onBack?: () => void
}) {
  const queryClient = useQueryClient()
  const messageList = useRef<HTMLDivElement>(null)
  const [search, setSearch] = useState('')
  const [mediaOnly, setMediaOnly] = useState(false)
  const [offset, setOffset] = useState(0)
  const [draft, setDraft] = useState('')
  const [attachment, setAttachment] = useState<PendingAttachment | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)
  const stickerInputRef = useRef<HTMLInputElement>(null)
  const { draft: scheduleDraft, patch: patchSchedule, reset: resetSchedule } = useScheduleDraft()

  useEffect(() => {
    return () => {
      if (attachment?.previewUrl) {
        URL.revokeObjectURL(attachment.previewUrl)
      }
    }
  }, [attachment])

  const onFileChosen = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: PendingAttachment['type'],
  ) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (attachment?.previewUrl) {
      URL.revokeObjectURL(attachment.previewUrl)
    }
    const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    setAttachment({ file, type, previewUrl })
    event.target.value = ''
  }

  const onPaste = (event: React.ClipboardEvent) => {
    const items = event.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.kind === 'file') {
        const file = item.getAsFile()
        if (file) {
          if (attachment?.previewUrl) {
            URL.revokeObjectURL(attachment.previewUrl)
          }
          const isImg = file.type.startsWith('image/')
          const isVid = file.type.startsWith('video/')
          const isAud = file.type.startsWith('audio/')
          const type: PendingAttachment['type'] = isImg
            ? 'image'
            : isVid
            ? 'video'
            : isAud
            ? 'audio'
            : 'file'
          const previewUrl = isImg ? URL.createObjectURL(file) : undefined
          setAttachment({ file, type, previewUrl })
          break
        }
      }
    }
  }

  const query = useQuery({
    queryKey: chatMessagesQueryKey(deviceId, chat.jid, { search, mediaOnly, offset }),
    queryFn: () =>
      getChatMessages(
        chat.jid,
        {
          search: search || undefined,
          media_only: mediaOnly || undefined,
          limit: PAGE_SIZE,
          offset,
        },
        deviceId,
      ),
    placeholderData: keepPreviousData,
    refetchInterval: 2500,
  })

  const messages = useMemo(
    () => sortMessagesChronologically(query.data?.data ?? []),
    [query.data?.data],
  )
  const total = query.data?.pagination.total ?? 0
  const responseChat = query.data?.chat_info
  const resolvedChat = responseChat?.jid === chat.jid ? responseChat : chat

  useLayoutEffect(() => {
    const viewport = messageList.current?.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    )
    if (viewport) viewport.scrollTop = viewport.scrollHeight
  }, [chat.jid, messages])

  const sendMutation = useActionMutation(
    (message: string) => sendText({ phone: chat.jid, message, ...scheduleDraft }),
    {
      successMessage: (r) => (r.schedule_id ? r.status : 'Pesan terkirim'),
      onSuccess: () => {
        setDraft('')
        resetSchedule()
        void queryClient.invalidateQueries({
          queryKey: ['chat-messages', deviceId, chat.jid],
        })
        void queryClient.invalidateQueries({
          queryKey: ['chats', deviceId],
        })
      },
    },
  )

  const mediaMutation = useActionMutation(
    async ({
      pending,
      caption,
    }: {
      pending: PendingAttachment
      caption?: string
    }) => {
      const { file, type } = pending
      if (type === 'image') {
        return await sendImage({ phone: chat.jid, file, caption: caption || undefined, ...scheduleDraft })
      }
      if (type === 'video') {
        return await sendVideo({ phone: chat.jid, file, caption: caption || undefined, ...scheduleDraft })
      }
      if (type === 'audio') {
        return await sendAudio({ phone: chat.jid, file, ...scheduleDraft })
      }
      if (type === 'sticker') {
        return await sendSticker({ phone: chat.jid, file, ...scheduleDraft })
      }
      return await sendFile({ phone: chat.jid, file, caption: caption || undefined, ...scheduleDraft })
    },
    {
      successMessage: (r) => (r.schedule_id ? r.status : 'Media terkirim'),
      onSuccess: () => {
        if (attachment?.previewUrl) {
          URL.revokeObjectURL(attachment.previewUrl)
        }
        setAttachment(null)
        setDraft('')
        resetSchedule()
        void queryClient.invalidateQueries({
          queryKey: ['chat-messages', deviceId, chat.jid],
        })
        void queryClient.invalidateQueries({
          queryKey: ['chats', deviceId],
        })
      },
    },
  )

  const isSending = sendMutation.isPending || mediaMutation.isPending

  const onSend = (event: FormEvent) => {
    event.preventDefault()
    if (isSending) return
    if (attachment) {
      mediaMutation.mutate({
        pending: attachment,
        caption: draft.trim() || undefined,
      })
    } else if (draft.trim()) {
      sendMutation.mutate(draft.trim())
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-2">
      <div className="border-border/60 flex items-center justify-between border-b pb-2">
        <div className="flex items-center gap-2 min-w-0">
          {onBack && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onBack}
              className="size-7 shrink-0 lg:hidden rounded-lg -ml-1 text-muted-foreground hover:text-foreground"
              aria-label="Kembali ke daftar obrolan"
            >
              <ArrowLeft className="size-4" />
            </Button>
          )}
          <div className="min-w-0">
            <p className="text-foreground truncate text-sm font-semibold">
              {chatDisplayName(resolvedChat)}
            </p>
            <p className="text-muted-foreground truncate font-mono text-[10px]">{resolvedChat.jid}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => void query.refetch()}
            className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
            title="Segarkan pesan"
            aria-label="Segarkan pesan"
          >
            <RefreshCw className={cn('size-3.5', query.isFetching && 'animate-spin text-primary')} />
          </Button>
          <ChatControls chat={resolvedChat} />
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex items-center justify-between gap-2">
        <Input
          className="h-7.5 max-w-xs text-xs"
          placeholder="Cari pesan…"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setOffset(0)
          }}
        />
        <label className="text-muted-foreground flex items-center gap-1.5 text-xs select-none">
          <Switch
            checked={mediaOnly}
            onCheckedChange={(value) => {
              setMediaOnly(value)
              setOffset(0)
            }}
          />
          <span className="hidden sm:inline">Hanya media</span>
        </label>
      </div>

      {/* Message stream */}
      <div ref={messageList} className="min-h-0 flex-1">
        <ScrollArea className="border-border/60 bg-muted/20 size-full rounded-xl border p-3 backdrop-blur-xs">
          {query.isLoading ? (
            <div className="flex justify-center p-6">
              <Loader2 className="text-primary size-5 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-muted-foreground flex flex-col gap-1 p-6 text-center text-xs">
              <p className="text-foreground font-medium">Belum ada pesan tersimpan untuk obrolan ini.</p>
              <p className="text-[11px]">
                Pesan akan muncul saat dikirim/diterima atau sinkronisasi riwayat selesai.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {messages.map((message, index) => {
                const showDateSeparator =
                  index === 0 || dayKey(message.timestamp) !== dayKey(messages[index - 1].timestamp)
                return (
                  <div key={message.id}>
                    {showDateSeparator && (
                      <div className="flex justify-center py-1">
                        <span className="border-border/60 bg-card/85 text-muted-foreground rounded-md border px-2.5 py-0.5 font-mono text-[10px] shadow-2xs backdrop-blur-xs">
                          {new Date(message.timestamp).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    )}
                    <MessageBubble message={message} deviceId={deviceId} />
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Pagination toolbar */}
      <div className="text-muted-foreground flex items-center justify-between text-[11px]">
        <span>{total} pesan tersimpan</span>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="xs"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            className="h-6.5 text-[11px]"
          >
            Lebih baru
          </Button>
          <Button
            variant="outline"
            size="xs"
            disabled={offset + PAGE_SIZE >= total}
            onClick={() => setOffset(offset + PAGE_SIZE)}
            className="h-6.5 text-[11px]"
          >
            Lebih lama
          </Button>
        </div>
      </div>

      {/* Interactive composer */}
      <form className="flex flex-col gap-1.5" onSubmit={onSend}>
        <ScheduleFields draft={scheduleDraft} patch={patchSchedule} />

        {/* Hidden inputs for each attachment category */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="*/*"
          onChange={(e) => onFileChosen(e, 'file')}
        />
        <input
          ref={imageInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={(e) => onFileChosen(e, 'image')}
        />
        <input
          ref={videoInputRef}
          type="file"
          className="hidden"
          accept="video/*"
          onChange={(e) => onFileChosen(e, 'video')}
        />
        <input
          ref={audioInputRef}
          type="file"
          className="hidden"
          accept="audio/*"
          onChange={(e) => onFileChosen(e, 'audio')}
        />
        <input
          ref={stickerInputRef}
          type="file"
          className="hidden"
          accept="image/webp,image/png,image/jpeg"
          onChange={(e) => onFileChosen(e, 'sticker')}
        />

        {/* Attachment preview banner */}
        {attachment && (
          <div className="flex items-center justify-between gap-3 p-2 bg-muted/60 border border-border/80 rounded-xl text-xs backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2.5 min-w-0">
              {attachment.previewUrl ? (
                <img
                  src={attachment.previewUrl}
                  alt="Preview"
                  className="size-10 rounded-lg object-cover border border-border shrink-0 shadow-2xs"
                />
              ) : (
                <div
                  className={cn(
                    'size-10 rounded-lg flex items-center justify-center shrink-0 border shadow-2xs',
                    attachment.type === 'video'
                      ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                      : attachment.type === 'audio'
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      : attachment.type === 'sticker'
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
                  )}
                >
                  {attachment.type === 'video' ? (
                    <Video className="size-5" />
                  ) : attachment.type === 'audio' ? (
                    <Music className="size-5" />
                  ) : attachment.type === 'sticker' ? (
                    <Smile className="size-5" />
                  ) : (
                    <FileText className="size-5" />
                  )}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate text-xs">{attachment.file.name}</p>
                <p className="text-[10px] text-muted-foreground font-mono">
                  {(attachment.file.size / (1024 * 1024)).toFixed(2)} MB ·{' '}
                  {attachment.type === 'image'
                    ? 'Foto / Gambar'
                    : attachment.type === 'video'
                    ? 'Video'
                    : attachment.type === 'audio'
                    ? 'Audio'
                    : attachment.type === 'sticker'
                    ? 'Stiker'
                    : 'Dokumen'}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => {
                if (attachment.previewUrl) URL.revokeObjectURL(attachment.previewUrl)
                setAttachment(null)
              }}
              className="size-6 text-muted-foreground hover:text-foreground shrink-0 rounded-full"
              title="Batalkan lampiran"
              aria-label="Batalkan lampiran"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        )}

        <div className="flex gap-2 items-center">
          {/* WhatsApp-style attachment trigger button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8.5 w-8.5 shrink-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                title="Lampirkan file (WhatsApp style)"
                aria-label="Lampirkan file"
                disabled={isSending}
              >
                <Paperclip className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56 p-1.5 shadow-xl border-border/80">
              <DropdownMenuItem
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-3 py-2 cursor-pointer rounded-md"
              >
                <div className="size-8 rounded-full bg-indigo-500/15 text-indigo-500 flex items-center justify-center shrink-0">
                  <FileText className="size-4" />
                </div>
                <div>
                  <p className="font-semibold text-xs text-foreground">Dokumen</p>
                  <p className="text-[10px] text-muted-foreground">PDF, Word, Excel, ZIP, dll</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => imageInputRef.current?.click()}
                className="flex items-center gap-3 py-2 cursor-pointer rounded-md"
              >
                <div className="size-8 rounded-full bg-blue-500/15 text-blue-500 flex items-center justify-center shrink-0">
                  <ImageIcon className="size-4" />
                </div>
                <div>
                  <p className="font-semibold text-xs text-foreground">Foto & Gambar</p>
                  <p className="text-[10px] text-muted-foreground">Kirim gambar JPG, PNG, WebP</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => videoInputRef.current?.click()}
                className="flex items-center gap-3 py-2 cursor-pointer rounded-md"
              >
                <div className="size-8 rounded-full bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0">
                  <Video className="size-4" />
                </div>
                <div>
                  <p className="font-semibold text-xs text-foreground">Video</p>
                  <p className="text-[10px] text-muted-foreground">Kirim video MP4, MKV</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => audioInputRef.current?.click()}
                className="flex items-center gap-3 py-2 cursor-pointer rounded-md"
              >
                <div className="size-8 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                  <Music className="size-4" />
                </div>
                <div>
                  <p className="font-semibold text-xs text-foreground">Audio / Musik</p>
                  <p className="text-[10px] text-muted-foreground">Kirim suara atau audio</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => stickerInputRef.current?.click()}
                className="flex items-center gap-3 py-2 cursor-pointer rounded-md"
              >
                <div className="size-8 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
                  <Smile className="size-4" />
                </div>
                <div>
                  <p className="font-semibold text-xs text-foreground">Stiker</p>
                  <p className="text-[10px] text-muted-foreground">Kirim stiker WhatsApp</p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Input
            placeholder={attachment ? 'Tulis keterangan… (opsional)' : 'Tulis pesan…'}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onPaste={onPaste}
            className="h-8.5 text-xs flex-1"
            disabled={isSending}
          />
          <Button
            type="submit"
            disabled={isSending || (!draft.trim() && !attachment)}
            className="h-8.5 gap-1.5 px-3.5 text-xs font-semibold shrink-0"
          >
            {isSending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
            {isSending ? 'Mengirim…' : 'Kirim'}
          </Button>
        </div>
      </form>
    </div>
  )
}
