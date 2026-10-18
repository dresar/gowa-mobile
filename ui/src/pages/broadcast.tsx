import { useState } from 'react'
import {
  Activity,
  Hash,
  Send,
  UserCheck,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CampaignBuilder } from '@/features/broadcast/campaign-builder'
import { CampaignMonitor } from '@/features/broadcast/campaign-monitor'
import { NumberChecker } from '@/features/broadcast/number-checker'
import { NumberGenerator } from '@/features/broadcast/number-generator'

export default function BroadcastPage() {
  const [activeTab, setActiveTab] = useState('builder')
  const [builderRecipients, setBuilderRecipients] = useState('')
  const [checkerNumbers, setCheckerNumbers] = useState('')
  const [monitorCampaignId, setMonitorCampaignId] = useState<string | null>(null)

  const handleSendToBroadcast = (numbers: string) => {
    setBuilderRecipients(numbers)
    setActiveTab('builder')
  }

  const handleVerifyOnWA = (numbers: string) => {
    setCheckerNumbers(numbers)
    setActiveTab('checker')
  }

  const handleCampaignCreated = (campaignId: string) => {
    setMonitorCampaignId(campaignId)
    setActiveTab('monitor')
  }

  return (
    <div className="flex flex-col gap-6 w-full min-w-0 p-4 sm:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Broadcast & Tools"
        description="Mesin broadcast multi-perangkat dengan Anti-Ban Protection Engine, validasi nomor aktif WhatsApp, dan generator kontak."
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col gap-6">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full h-auto p-1 bg-muted/60 backdrop-blur-md border border-border/60 rounded-xl">
          <TabsTrigger
            value="builder"
            className="flex items-center gap-2 py-2.5 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg transition-all"
          >
            <Send className="size-3.5" />
            <span>Buat Kampanye</span>
          </TabsTrigger>
          <TabsTrigger
            value="monitor"
            className="flex items-center gap-2 py-2.5 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg transition-all"
          >
            <Activity className="size-3.5" />
            <span>Monitor & Riwayat</span>
          </TabsTrigger>
          <TabsTrigger
            value="checker"
            className="flex items-center gap-2 py-2.5 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg transition-all"
          >
            <UserCheck className="size-3.5" />
            <span>Cek Nomor WA</span>
          </TabsTrigger>
          <TabsTrigger
            value="generator"
            className="flex items-center gap-2 py-2.5 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg transition-all"
          >
            <Hash className="size-3.5" />
            <span>Generator Nomor</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="mt-0 outline-none">
          <CampaignBuilder
            initialRecipients={builderRecipients}
            onSuccessRedirect={handleCampaignCreated}
          />
        </TabsContent>

        <TabsContent value="monitor" className="mt-0 outline-none">
          <CampaignMonitor selectedCampaignId={monitorCampaignId} />
        </TabsContent>

        <TabsContent value="checker" className="mt-0 outline-none">
          <NumberChecker
            initialNumbers={checkerNumbers}
            onSendToBroadcast={handleSendToBroadcast}
          />
        </TabsContent>

        <TabsContent value="generator" className="mt-0 outline-none">
          <NumberGenerator
            onSendToBroadcast={handleSendToBroadcast}
            onVerifyOnWA={handleVerifyOnWA}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
