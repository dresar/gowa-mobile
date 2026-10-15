import { useQueryClient } from '@tanstack/react-query'
import { Archive, MoreVertical, Pin, Timer } from 'lucide-react'
import { toast } from 'sonner'
import { archiveChat, pinChat, setDisappearing, type ChatInfo } from '@/api/chat'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toApiError } from '@/lib/api-error'

const DISAPPEARING_OPTIONS: { label: string; seconds: number }[] = [
  { label: 'Off', seconds: 0 },
  { label: '24 hours', seconds: 86_400 },
  { label: '7 days', seconds: 604_800 },
  { label: '90 days', seconds: 7_776_000 },
]

export function ChatControls({ chat }: { chat: ChatInfo }) {
  const queryClient = useQueryClient()

  const run = async (label: string, action: () => Promise<unknown>) => {
    try {
      await action()
      toast.success(label)
      void queryClient.invalidateQueries({ queryKey: ['chats'] })
    } catch (error) {
      toast.error(toApiError(error).message)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Chat actions">
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => run('Obrolan disematkan', () => pinChat(chat.jid, true))}>
          <Pin className="size-4" /> Sematkan
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => run('Sematkan dibatalkan', () => pinChat(chat.jid, false))}>
          <Pin className="size-4" /> Lepas Sematan
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            run(chat.archived ? 'Obrolan dipulihkan dari arsip' : 'Obrolan diarsipkan', () =>
              archiveChat(chat.jid, !chat.archived),
            )
          }
        >
          <Archive className="size-4" /> {chat.archived ? 'Batal Arsip' : 'Arsipkan'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-2">
          <Timer className="size-4" /> Pesan Sementara
        </DropdownMenuLabel>
        {DISAPPEARING_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.seconds}
            onClick={() =>
              run(`Pesan sementara diatur: ${option.label}`, () =>
                setDisappearing(chat.jid, option.seconds),
              )
            }
          >
            {option.label === 'Off' ? 'Mati' : option.label === '24 hours' ? '24 jam' : option.label === '7 days' ? '7 hari' : option.label === '90 days' ? '90 hari' : option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
