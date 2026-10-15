import { Outlet } from 'react-router-dom'
import {
  Activity,
  Database,
  Key,
  MessageSquare,
  Palette,
  Radio,
  ShieldCheck,
  Sparkles,
  Webhook,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'

export const settingsNavItems = [
  {
    to: '/settings/general',
    label: 'Umum & WhatsApp',
    shortLabel: 'Umum',
    icon: Radio,
  },
  {
    to: '/settings/api-keys',
    label: 'Kunci API & Integrasi',
    shortLabel: 'Kunci API',
    icon: Key,
  },
  {
    to: '/settings/webhook',
    label: 'Webhook Gateway',
    shortLabel: 'Webhook',
    icon: Webhook,
  },
  {
    to: '/settings/ai',
    label: 'AI & Supermemory',
    shortLabel: 'AI',
    icon: Sparkles,
  },
  {
    to: '/settings/chatwoot',
    label: 'Chatwoot Live Chat',
    shortLabel: 'Chatwoot',
    icon: MessageSquare,
  },
  {
    to: '/settings/storage',
    label: 'Batas Media & Berkas',
    shortLabel: 'Media',
    icon: Database,
  },
  {
    to: '/settings/security',
    label: 'Keamanan & PIN',
    shortLabel: 'Keamanan',
    icon: ShieldCheck,
  },
  {
    to: '/settings/diagnostics',
    label: 'Diagnostik Server',
    shortLabel: 'Diagnostik',
    icon: Activity,
  },
  {
    to: '/settings/appearance',
    label: 'Tampilan & Tema',
    shortLabel: 'Tampilan',
    icon: Palette,
  },
  {
    to: '/settings/auto-reply-templates',
    label: 'Template Balasan',
    shortLabel: 'Template',
    icon: Sparkles,
  },
]

export default function SettingsLayout() {
  return (
    <div className="flex w-full flex-col gap-4 sm:gap-5">
      <PageHeader
        title="Pengaturan"
        description="Konfigurasi sistem dan integrasi gateway."
      />

      <div className="w-full min-w-0">
        <Outlet />
      </div>
    </div>
  )
}
