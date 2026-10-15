import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, Send, Users } from 'lucide-react'
import { listContacts } from '@/api/user'
import { ErrorNotice } from '@/components/shared/error-notice'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useSelectedDevice } from '@/hooks/use-device-guard'
import { isDeviceNotFoundError } from '@/lib/api-error'
import { useRecipientStore } from '@/stores/recipient'

export function ContactsView() {
  const navigate = useNavigate()
  const device = useSelectedDevice()
  const [search, setSearch] = useState('')
  const setRecipient = useRecipientStore((state) => state.setRecipient)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['contacts', device],
    queryFn: () => listContacts(device || undefined),
    enabled: !!device,
  })

  const contacts = data?.data ?? []

  const filtered = useMemo(() => {
    if (!search.trim()) return contacts
    const query = search.toLowerCase().trim()
    return contacts.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(query)) || c.jid.toLowerCase().includes(query),
    )
  }, [contacts, search])

  const onMessage = (jid: string) => {
    const phone = jid.split('@')[0]
    setRecipient({ phone, type: 'user' })
    navigate('/messaging')
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (error) {
    if (isDeviceNotFoundError(error)) {
      return (
        <div className="border-border/70 bg-card/60 flex flex-col items-center justify-center gap-2 rounded-xl border p-8 text-center backdrop-blur-xl">
          <p className="text-foreground text-xs font-semibold">Device not found</p>
          <p className="text-muted-foreground max-w-xs text-[11px]">
            Please pair or select an active WhatsApp device to view contacts.
          </p>
        </div>
      )
    }
    return <ErrorNotice title="Failed to load contacts" error={error} onRetry={() => refetch()} />
  }

  if (contacts.length === 0) {
    return (
      <div className="border-border/70 bg-card/60 flex flex-col items-center justify-center gap-2 rounded-xl border p-8 text-center backdrop-blur-xl">
        <div className="border-border/80 bg-muted/40 text-muted-foreground flex size-10 items-center justify-center rounded-lg border">
          <Users className="size-5" />
        </div>
        <p className="text-foreground text-xs font-semibold">No Synced Contacts</p>
        <p className="text-muted-foreground max-w-xs text-[11px]">
          This WhatsApp session does not have local contacts stored yet.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="h-8.5 rounded-lg pl-8 text-xs"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="border-border/60 bg-muted/50 text-muted-foreground rounded-md border px-2 py-1 font-mono text-[11px]">
            {filtered.length} of {contacts.length} contacts
          </span>
        </div>
      </div>

      <div className="divide-border/50 border-border/70 bg-card/60 max-h-96 divide-y overflow-y-auto rounded-xl border backdrop-blur-xl">
        {filtered.length === 0 ? (
          <div className="text-muted-foreground p-8 text-center text-xs">
            No contacts match "{search}"
          </div>
        ) : (
          filtered.map((contact) => {
            const phone = contact.jid.split('@')[0]
            const initials = (contact.name || phone).slice(0, 2).toUpperCase()
            return (
              <div
                key={contact.jid}
                className="hover:bg-muted/40 flex items-center justify-between gap-3 p-2.5 px-3.5 transition-colors"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="border-border/80 size-8 border">
                    <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-foreground truncate text-xs font-semibold">
                      {contact.name || 'Unnamed Contact'}
                    </p>
                    <p className="text-muted-foreground truncate font-mono text-[10px]">{phone}</p>
                  </div>
                </div>

                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => onMessage(contact.jid)}
                  className="h-7 gap-1 rounded-[var(--btn-radius,6px)] border-primary/30 text-[11px] font-semibold text-primary hover:border-primary/50 hover:bg-primary/10 active:scale-[var(--btn-active-scale,0.98)]"
                >
                  <Send className="size-3" />
                  <span>Message</span>
                </Button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
