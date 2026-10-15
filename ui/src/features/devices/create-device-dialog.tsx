import { useState, type FormEvent, type ReactNode } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { addDevice } from '@/api/devices'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toApiError } from '@/lib/api-error'
import { useDeviceStore } from '@/stores/device'

export interface CreateDeviceDialogProps {
  trigger?: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CreateDeviceDialog({
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: CreateDeviceDialogProps = {}) {
  const queryClient = useQueryClient()
  const selectDevice = useDeviceStore((state) => state.selectDevice)
  const [internalOpen, setInternalOpen] = useState(false)
  const [deviceId, setDeviceId] = useState('')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')

  const isControlled = controlledOpen !== undefined
  const isOpen = isControlled ? controlledOpen : internalOpen
  const setIsOpen = isControlled ? (controlledOnOpenChange ?? (() => {})) : setInternalOpen

  const mutation = useMutation({
    mutationFn: addDevice,
    onSuccess: (device) => {
      toast.success(`Perangkat ${device.id} ditambahkan`)
      void queryClient.invalidateQueries({ queryKey: ['devices'] })
      selectDevice(device.id)
      setIsOpen(false)
      setDeviceId('')
      setWebhookUrl('')
      setWebhookSecret('')
    },
    onError: (error) => toast.error(toApiError(error).message),
  })

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    mutation.mutate({
      device_id: deviceId.trim() || undefined,
      webhook_url: webhookUrl.trim() || undefined,
      webhook_secret: webhookSecret.trim() || undefined,
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : !isControlled ? (
        <DialogTrigger asChild>
          <Button size="sm" className="h-8 gap-1.5 rounded-lg text-xs font-semibold">
            <Plus className="size-3.5" />
            <span>Tambah</span>
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Perangkat</DialogTitle>
          <DialogDescription>
            Daftarkan slot perangkat. Pasangkan HP lewat QR atau kode.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="device-id">ID Perangkat (opsional)</Label>
            <Input
              id="device-id"
              placeholder="Otomatis"
              value={deviceId}
              onChange={(event) => setDeviceId(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="webhook-url">URL Webhook (opsional)</Label>
            <Input
              id="webhook-url"
              placeholder="https://example.com/webhook"
              value={webhookUrl}
              onChange={(event) => setWebhookUrl(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="webhook-secret">Rahasia Webhook (opsional)</Label>
            <Input
              id="webhook-secret"
              value={webhookSecret}
              onChange={(event) => setWebhookSecret(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="h-8 text-xs font-semibold"
            >
              {mutation.isPending && <Loader2 className="size-3.5 animate-spin" />}
              <span>Tambah</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
