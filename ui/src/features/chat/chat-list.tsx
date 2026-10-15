import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Loader2, Plus, RefreshCw, Search, Smartphone } from 'lucide-react'
import { listChats, type ChatInfo } from '@/api/chat'
import { ErrorNotice } from '@/components/shared/error-notice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { CreateDeviceDialog } from '@/features/devices/create-device-dialog'
import { chatListQueryKey } from '@/features/chat/device-scope'
import { chatDisplayName } from '@/features/chat/display-name'
import { isDeviceNotFoundError } from '@/lib/api-error'
import { formatDate, isZeroTime } from '@/lib/format'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 25

export function ChatList({
  deviceId,
  selectedJid,
  onSelect,
}: {
  deviceId: string
  selectedJid: string | null
  onSelect: (chat: ChatInfo) => void
}) {
  const [search, setSearch] = useState('')
  const [hasMedia, setHasMedia] = useState(false)
  const [offset, setOffset] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)

  const query = useQuery({
    queryKey: chatListQueryKey(deviceId, { search, hasMedia, offset }),
    queryFn: () =>
      listChats(
        {
          search: search || undefined,
          has_media: hasMedia || undefined,
          limit: PAGE_SIZE,
          offset,
        },
        deviceId,
      ),
    placeholderData: keepPreviousData,
    refetchInterval: 5000,
  })

  const chats = query.data?.data ?? []
  const total = query.data?.pagination.total ?? 0

  return (
    <div className="flex h-full flex-col gap-2.5">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-2.5 left-2.5 size-3.5" />
            <Input
              className="h-8 pl-8 text-xs font-medium"
              placeholder="Cari obrolan…"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setOffset(0)
              }}
            />
          </div>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => void query.refetch()}
            className="size-8 shrink-0 rounded-lg text-muted-foreground hover:text-foreground"
            title="Segarkan daftar obrolan"
            aria-label="Segarkan daftar obrolan"
          >
            <RefreshCw className={cn('size-3.5', query.isFetching && 'animate-spin text-primary')} />
          </Button>
        </div>
        <label className="text-muted-foreground flex items-center gap-2 text-xs select-none">
          <Switch
            checked={hasMedia}
            onCheckedChange={(value) => {
              setHasMedia(value)
              setOffset(0)
            }}
          />
          <span>Hanya media</span>
        </label>
      </div>

      <ScrollArea className="border-border/60 bg-card/40 min-h-0 flex-1 rounded-lg border backdrop-blur-md">
        {query.isLoading ? (
          <div className="flex justify-center p-6">
            <Loader2 className="text-primary size-5 animate-spin" />
          </div>
        ) : query.error && isDeviceNotFoundError(query.error) ? (
          <div className="flex flex-col items-center justify-center gap-2.5 p-6 text-center">
            <div className="flex size-10 items-center justify-center rounded-lg border border-primary/30 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent text-primary shadow-2xs">
              <Smartphone className="size-5" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="font-heading text-foreground text-xs font-semibold">Perangkat tidak ditemukan</p>
              <p className="text-muted-foreground text-[11px] max-w-[200px]">
                Pasangkan atau pilih perangkat aktif untuk melihat obrolan.
              </p>
            </div>
            <Button
              size="xs"
              variant="outline"
              onClick={() => setCreateOpen(true)}
              className="mt-1 h-7 gap-1 rounded-md text-xs font-semibold"
            >
              <Plus className="size-3" />
              <span>Tambah Perangkat</span>
            </Button>
          </div>
        ) : query.error ? (
          <div className="p-3">
            <ErrorNotice
              title="Gagal memuat obrolan"
              error={query.error}
              onRetry={() => void query.refetch()}
            />
          </div>
        ) : chats.length === 0 ? (
          <p className="text-muted-foreground p-6 text-center text-xs">Tidak ada percakapan</p>
        ) : (
          <ul className="divide-border/40 divide-y">
            {chats.map((chat) => (
              <li key={chat.jid}>
                <button
                  type="button"
                  onClick={() => onSelect(chat)}
                  className={cn(
                    'group/item flex w-full items-center gap-2.5 px-3 py-2 text-left transition-all duration-150',
                    selectedJid === chat.jid
                      ? 'text-foreground border-l-2 border-primary bg-gradient-to-r from-primary/20 via-primary/10 to-transparent font-medium shadow-2xs shadow-primary/10'
                      : 'hover:bg-muted/40 text-muted-foreground hover:text-foreground',
                  )}
                >
                  <span
                    className={cn(
                      'font-heading flex size-8 shrink-0 items-center justify-center rounded-lg border text-xs font-bold shadow-2xs transition-colors',
                      selectedJid === chat.jid
                        ? 'border-primary/40 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent text-primary'
                        : 'border-border/70 bg-card/80 text-foreground',
                    )}
                  >
                    {chatDisplayName(chat).slice(0, 1).toUpperCase()}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-foreground truncate text-xs font-semibold">
                      {chatDisplayName(chat)}
                    </span>
                    <span className="text-muted-foreground truncate font-mono text-[10px]">
                      {isZeroTime(chat.last_message_time)
                        ? chat.jid
                        : formatDate(chat.last_message_time)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>

      <div className="text-muted-foreground flex items-center justify-between text-[11px]">
        <span>{total} obrolan</span>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="xs"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            className="h-6.5 text-[11px]"
          >
            Sebelumnya
          </Button>
          <Button
            variant="outline"
            size="xs"
            disabled={offset + PAGE_SIZE >= total}
            onClick={() => setOffset(offset + PAGE_SIZE)}
            className="h-6.5 text-[11px]"
          >
            Berikutnya
          </Button>
        </div>
      </div>
      <CreateDeviceDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
