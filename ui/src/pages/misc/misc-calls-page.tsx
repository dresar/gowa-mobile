import { PhoneOff } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CallRejectForm } from '@/features/call/call-reject-form'

export default function MiscCallsPage() {
  return (
    <div className="flex w-full flex-col gap-4">
      <PageHeader
        title="Tolak Panggilan Masuk"
        description="Tolak panggilan suara atau video yang masuk ke akun WhatsApp Anda. Masukkan Caller JID dan Call ID dari notifikasi webhook."
      />

      <Card className="glass-card rounded-xl max-w-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <PhoneOff className="size-4 text-primary" />
            Formulir Tolak Panggilan
          </CardTitle>
          <CardDescription className="text-xs">
            Kirim sinyal penolakan panggilan suara atau video yang sedang berlangsung ke server WhatsApp.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CallRejectForm />
        </CardContent>
      </Card>
    </div>
  )
}
