import { useRef, useState } from 'react'
import { MessagesSquare } from 'lucide-react'
import { ChatList } from '@/features/chat/chat-list'
import { MessageView } from '@/features/chat/message-view'
import { Card } from '@/components/ui/card'
import { selectedChatForDevice, type ChatSelection } from '@/features/chat/device-scope'
import { DeviceGuard, useSelectedDevice } from '@/hooks/use-device-guard'
import type { ChatInfo } from '@/api/chat'

export default function ChatsPage() {
  const device = useSelectedDevice()
  const [selection, setSelection] = useState<ChatSelection | null>(null)
  const messagePane = useRef<HTMLDivElement>(null)
  const selected = selectedChatForDevice(selection, device)

  const handleSelect = (chat: ChatInfo) => {
    if (!device) return
    setSelection({ deviceId: device, chat })
    messagePane.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  if (!device) {
    return (
      <div className="flex flex-col gap-4">
        <DeviceGuard />
      </div>
    )
  }

  return (
    <div className="flex h-full w-full min-h-0 flex-1 flex-col">
      <div className="flex h-full min-h-0 flex-1 flex-col lg:hidden">
        {!selected ? (
          <Card className="glass-card flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-xl p-2.5 backdrop-blur-xl sm:p-3">
            <ChatList
              key={device}
              deviceId={device}
              selectedJid={null}
              onSelect={handleSelect}
            />
          </Card>
        ) : (
          <Card className="glass-card flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-xl p-2.5 backdrop-blur-xl sm:p-3">
            <MessageView
              key={`${device}:${selected.jid}`}
              chat={selected}
              deviceId={device}
              onBack={() => setSelection(null)}
            />
          </Card>
        )}
      </div>

      <div className="hidden h-full min-h-0 flex-1 gap-2.5 sm:gap-3 lg:grid lg:grid-cols-[340px_1fr] xl:grid-cols-[380px_1fr]">
        <Card className="glass-card flex h-full min-h-0 flex-col overflow-hidden rounded-xl p-2.5 backdrop-blur-xl sm:p-3">
          <ChatList
            key={device}
            deviceId={device}
            selectedJid={selected?.jid ?? null}
            onSelect={handleSelect}
          />
        </Card>
        <Card
          ref={messagePane}
          className="glass-card flex h-full min-h-0 flex-col overflow-hidden rounded-xl p-2.5 backdrop-blur-xl sm:p-3"
        >
          {selected ? (
            <MessageView key={`${device}:${selected.jid}`} chat={selected} deviceId={device} />
          ) : (
            <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2.5">
              <div className="border-border/80 bg-muted/40 text-primary flex size-12 items-center justify-center rounded-xl border shadow-2xs">
                <MessagesSquare className="size-6" />
              </div>
              <p className="text-foreground text-xs font-medium">Pilih percakapan</p>
              <p className="text-muted-foreground text-[11px]">
                Klik obrolan dari panel kiri untuk melihat pesan
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
