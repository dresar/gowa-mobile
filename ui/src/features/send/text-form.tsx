import { useState, type FormEvent } from 'react'
import { sendText, textRequest } from '@/api/send'
import { FormActions } from '@/components/shared/curl-dialog'
import { ResultPanel } from '@/components/shared/result-panel'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useActionMutation } from '@/hooks/use-action-mutation'
import { useRecipientJid } from '@/stores/recipient'
import { ScheduleFields } from '@/features/send/schedule-fields'
import { useScheduleDraft } from '@/features/send/use-schedule-draft'
import { useAllowReshare } from '@/features/send/use-allow-reshare'

export function SendTextForm() {
  const jid = useRecipientJid()
  const [message, setMessage] = useState('')
  const [replyId, setReplyId] = useState('')
  const { statusRecipient, allowReshare, setAllowReshare } = useAllowReshare()
  const { draft, patch, reset: resetSchedule } = useScheduleDraft()

  const mutation = useActionMutation(sendText, {
    successMessage: (r) => (r.schedule_id ? r.status : 'Pesan terkirim'),
    onSuccess: () => {
      setMessage('')
      setReplyId('')
      setAllowReshare(false)
      resetSchedule()
    },
  })

  const payload = {
    phone: jid,
    message,
    reply_message_id: replyId || undefined,
    allow_reshare: allowReshare || undefined,
    ...draft,
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    mutation.mutate(payload)
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="text-message">Pesan</Label>
        <Textarea
          id="text-message"
          rows={4}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Tulis pesan..."
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="text-reply">ID Balasan (opsional)</Label>
        <Input
          id="text-reply"
          value={replyId}
          onChange={(event) => setReplyId(event.target.value)}
          placeholder="3EB0..."
        />
      </div>
      {statusRecipient && (
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={allowReshare} onCheckedChange={setAllowReshare} />
          Izinkan bagikan ulang
        </label>
      )}
      <ScheduleFields draft={draft} patch={patch} />
      <FormActions
        submitLabel="Kirim Pesan"
        pending={mutation.isPending}
        disabled={!jid}
        request={textRequest(payload)}
      />
      <ResultPanel result={mutation.data} />
    </form>
  )
}
