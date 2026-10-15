import { Radio } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { NewsletterList } from '@/features/newsletter/newsletter-list'

export default function MiscChannelsPage() {
  return (
    <div className="flex w-full flex-col gap-4">
      <PageHeader
        title="Saluran Newsletter"
        description="Kelola dan pantau seluruh saluran WhatsApp yang Anda ikuti langsung dari sesi aktif."
      />

      <Card className="glass-card rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Radio className="size-4 text-primary" />
            Saluran yang Diikuti
          </CardTitle>
          <CardDescription className="text-xs">
            Daftar saluran resmi WhatsApp yang berlangganan pada perangkat ini.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewsletterList />
        </CardContent>
      </Card>
    </div>
  )
}
