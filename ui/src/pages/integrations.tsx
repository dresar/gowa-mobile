import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Activity,
  BookOpen,
  Check,
  ChevronRight,
  Code2,
  Copy,
  Cpu,
  Layers,
  Play,
  RefreshCw,
  Send,
  Shield,
  Sparkles,
  Webhook,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getDeviceWebhook,
  testDeviceWebhook,
  updateDeviceWebhook,
  type DeviceWebhookConfig,
  type TestWebhookPayload,
  type UpdateDeviceWebhookPayload,
  type WebhookTestResult,
} from '@/api/devices'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDevices } from '@/hooks/use-devices'
import { cn } from '@/lib/utils'
import { useConnection } from '@/stores/connection'
import { useDeviceStore } from '@/stores/device'

const WEBHOOK_EVENT_LIST = [
  { id: 'message', label: 'Pesan Masuk (message)', desc: 'Pesan teks, media, lokasi, stiker, dan dokumen baru' },
  { id: 'message.ack', label: 'Status Pengiriman (message.ack)', desc: 'Pembaruan centang (pending, server, delivered, read)' },
  { id: 'group.participants', label: 'Peserta Grup (group.participants)', desc: 'Anggota join, leave, kick, promote, dan demote' },
  { id: 'call.offer', label: 'Panggilan Masuk (call.offer)', desc: 'Pemberitahuan panggilan suara atau video baru' },
  { id: 'presence', label: 'Status Pengguna (presence)', desc: 'Status online dan indikator sedang mengetik (typing)' },
  { id: 'connection', label: 'Status Koneksi (connection)', desc: 'Perubahan status login, disconnect, atau reconnect' },
]

const MCP_TOOLS_CATALOG = [
  {
    name: 'whatsapp_send',
    badge: 'Write',
    badgeColor: 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
    title: 'Kirim Pesan & Media',
    desc: 'Mengirim pesan teks, gambar, video, audio, dokumen, stiker, kontak vCard, lokasi GPS, dan polling interaktif.',
    actions: ['text', 'image', 'video', 'audio', 'document', 'sticker', 'contact', 'location', 'poll'],
    sampleArgs: { recipient: '6281234567890@s.whatsapp.net', message: 'Halo dari MCP AI Assistant!' },
  },
  {
    name: 'whatsapp_chat',
    badge: 'Read / Write',
    badgeColor: 'border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10',
    title: 'Manajemen Obrolan',
    desc: 'Mengambil riwayat obrolan, status unread, daftar percakapan, pin/unpin chat, dan arsip obrolan.',
    actions: ['list_chats', 'get_chat', 'mark_read', 'pin_chat', 'archive_chat'],
    sampleArgs: { action: 'list_chats', limit: 10 },
  },
  {
    name: 'whatsapp_message',
    badge: 'Destructive',
    badgeColor: 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10',
    title: 'Operasi Pesan',
    desc: 'Kirim reaksi emoji, star/unstar pesan penting, edit pesan terkirim, serta revoke/tarik pesan untuk semua orang.',
    actions: ['react', 'star', 'edit', 'revoke'],
    sampleArgs: { action: 'react', message_id: 'MSG123', emoji: '👍' },
  },
  {
    name: 'whatsapp_group',
    badge: 'Admin',
    badgeColor: 'border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/10',
    title: 'Kelola Komunitas & Grup',
    desc: 'Membuat grup, menambah/mengeluarkan anggota, promote/demote admin, mengambil link undangan, dan ubah foto.',
    actions: ['create_group', 'get_group_info', 'add_participants', 'remove_participants', 'get_invite_link'],
    sampleArgs: { action: 'get_group_info', group_jid: '123456@g.us' },
  },
  {
    name: 'whatsapp_app',
    badge: 'System',
    badgeColor: 'border-slate-500/30 text-slate-600 dark:text-slate-400 bg-slate-500/10',
    title: 'Sistem & Perangkat',
    desc: 'Informasi akun profil, status login perangkat, sinkronisasi kontak/grup, privasi setting, dan restart sesi.',
    actions: ['device_info', 'privacy_settings', 'sync_contacts', 'reconnect'],
    sampleArgs: { action: 'device_info' },
  },
  {
    name: 'whatsapp_schedule',
    badge: 'Automation',
    badgeColor: 'border-cyan-500/30 text-cyan-600 dark:text-cyan-400 bg-cyan-500/10',
    title: 'Pesan Terjadwal',
    desc: 'Menjadwalkan pesan otomatis di masa mendatang, melihat daftar antrean pengiriman, dan membatalkan jadwal.',
    actions: ['create_schedule', 'list_schedules', 'cancel_schedule'],
    sampleArgs: { action: 'list_schedules' },
  },
  {
    name: 'whatsapp_bot',
    badge: 'Bot Engine',
    badgeColor: 'border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10',
    title: 'Aturan Balasan Bot',
    desc: 'Mengontrol engine auto-reply: menambah aturan keyword/regex, aktivasi/nonaktifkan aturan, dan query log aktivitas.',
    actions: ['list_rules', 'create_rule', 'delete_rule', 'toggle_rule', 'query_logs'],
    sampleArgs: { action: 'list_rules' },
  },
  {
    name: 'whatsapp_webhook',
    badge: 'Integration',
    badgeColor: 'border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10',
    title: 'Konfigurasi Webhook',
    desc: 'Membaca konfigurasi webhook perangkat, mengubah URL/secret/events, serta mengirim sinyal simulasi uji coba.',
    actions: ['get', 'set', 'test'],
    sampleArgs: { action: 'get' },
  },
]

interface CrudStepResult {
  step: string
  action: string
  status: 'pending' | 'success' | 'failed'
  message: string
  payload?: unknown
}

const MCP_CRUD_DOCS: Record<
  string,
  {
    title: string
    desc: string
    crudType: string
    request: Record<string, unknown>
    response: Record<string, unknown>
  }
> = {
  bot: {
    title: 'whatsapp_bot: CRUD Aturan Auto-Reply',
    crudType: 'FULL CRUD (C-R-U-D)',
    desc: 'Membuat aturan baru (create_rule), melihat aturan (list_rules), mengubah status (toggle_rule), dan menghapus aturan (delete_rule).',
    request: {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'whatsapp_bot',
        arguments: {
          action: 'create_rule',
          trigger_value: '!menu',
          response_content: 'Daftar Layanan: 1. Info Akun 2. Bantuan CS',
        },
      },
    },
    response: {
      jsonrpc: '2.0',
      id: 1,
      result: {
        content: [{ type: 'text', text: 'created rule ID=824' }],
        structuredContent: {
          id: 824,
          trigger_type: 'exact',
          trigger_value: '!menu',
          response_content: 'Daftar Layanan: 1. Info Akun 2. Bantuan CS',
          is_active: true,
        },
      },
    },
  },
  send: {
    title: 'whatsapp_send: Mengirim Pesan & Media',
    crudType: 'CREATE (Write)',
    desc: 'Mengirim pesan teks, gambar, video, audio/VN, dokumen, polling interaktif, lokasi, atau kontak vCard.',
    request: {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'whatsapp_send',
        arguments: {
          phone: '6281234567890@s.whatsapp.net',
          type: 'text',
          message: 'Halo dari MCP AI Assistant!',
        },
      },
    },
    response: {
      jsonrpc: '2.0',
      id: 2,
      result: {
        content: [{ type: 'text', text: 'message sent successfully' }],
        structuredContent: {
          message_id: '3EB0A1B2C3D4E5F6',
          status: 'sent',
        },
      },
    },
  },
  chat: {
    title: 'whatsapp_chat: Membaca Obrolan & Riwayat',
    crudType: 'READ (Query)',
    desc: 'Mengambil riwayat pesan dari nomor tertentu (get_messages), daftar obrolan aktif (list_chats), dan daftar kontak.',
    request: {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'whatsapp_chat',
        arguments: {
          action: 'get_messages',
          chat_jid: '6281234567890@s.whatsapp.net',
          limit: 10,
        },
      },
    },
    response: {
      jsonrpc: '2.0',
      id: 3,
      result: {
        content: [{ type: 'text', text: 'found 10 messages' }],
        structuredContent: {
          total: 10,
          messages: [],
        },
      },
    },
  },
  message: {
    title: 'whatsapp_message: Reaksi Emoji, Edit & Tarik Pesan',
    crudType: 'UPDATE / DELETE',
    desc: 'Memberi reaksi emoji (react), mengedit pesan (edit), atau menarik pesan untuk semua orang (revoke).',
    request: {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'whatsapp_message',
        arguments: {
          action: 'revoke',
          phone: '6281234567890@s.whatsapp.net',
          message_id: '3EB0A1B2C3D4',
        },
      },
    },
    response: {
      jsonrpc: '2.0',
      id: 4,
      result: {
        content: [{ type: 'text', text: 'message revoked for everyone' }],
      },
    },
  },
  group: {
    title: 'whatsapp_group: Buat & Kelola Komunitas Grup',
    crudType: 'CREATE / UPDATE / DELETE',
    desc: 'Membuat grup baru (create), menambah anggota (add), mengeluarkan anggota (remove), dan mengubah admin.',
    request: {
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: {
        name: 'whatsapp_group',
        arguments: {
          action: 'participants',
          group_jid: '120363123456@g.us',
          operation: 'add',
          participants: ['6281234567890@s.whatsapp.net'],
        },
      },
    },
    response: {
      jsonrpc: '2.0',
      id: 5,
      result: {
        content: [{ type: 'text', text: 'participant added' }],
      },
    },
  },
  webhook: {
    title: 'whatsapp_webhook: Konfigurasi & Uji Webhook',
    crudType: 'READ / UPDATE / TEST',
    desc: 'Membaca setelan webhook perangkat (get), mengubah URL dan secret (set), serta mengirim paket tes simulasi (test).',
    request: {
      jsonrpc: '2.0',
      id: 6,
      method: 'tools/call',
      params: {
        name: 'whatsapp_webhook',
        arguments: {
          action: 'get',
        },
      },
    },
    response: {
      jsonrpc: '2.0',
      id: 6,
      result: {
        content: [{ type: 'text', text: 'webhook config for device' }],
        structuredContent: {
          webhook_url: 'https://api.domain.com/webhook',
          webhook_events: 'message,message.ack',
        },
      },
    },
  },
  schedule: {
    title: 'whatsapp_schedule: Jadwal Pesan Otomatis',
    crudType: 'READ / DELETE (Cancel)',
    desc: 'Melihat daftar antrean pengiriman pesan terjadwal dan membatalkan jadwal yang belum dikirim.',
    request: {
      jsonrpc: '2.0',
      id: 7,
      method: 'tools/call',
      params: {
        name: 'whatsapp_schedule',
        arguments: {
          action: 'list',
          status: 'active',
        },
      },
    },
    response: {
      jsonrpc: '2.0',
      id: 7,
      result: {
        content: [{ type: 'text', text: 'found 1 schedules' }],
        structuredContent: {
          schedules: [],
        },
      },
    },
  },
  app: {
    title: 'whatsapp_app: Status Sesi & Pairing Login',
    crudType: 'SYSTEM / READ',
    desc: 'Mengecek kondisi koneksi perangkat (status), meminta pairing code 8 digit (login_code), atau logout.',
    request: {
      jsonrpc: '2.0',
      id: 8,
      method: 'tools/call',
      params: {
        name: 'whatsapp_app',
        arguments: {
          action: 'status',
        },
      },
    },
    response: {
      jsonrpc: '2.0',
      id: 8,
      result: {
        content: [{ type: 'text', text: 'device connected' }],
        structuredContent: {
          state: 'connected',
          logged_in: true,
        },
      },
    },
  },
}

const AI_SYSTEM_PROMPT_DOC = `Anda adalah AI Operations Assistant yang terhubung langsung ke WhatsApp Multi-Device Gateway melalui MCP Server (Model Context Protocol).

Anda memiliki akses ke 8 tools WhatsApp resmi berikut:
1. whatsapp_send: Kirim pesan teks, gambar, video, audio, dokumen, stiker, lokasi, polling, atau link preview. Selalu gunakan format nomor telepon internasional (contoh: "6281234567890@s.whatsapp.net") atau ID grup ("120363xxx@g.us").
2. whatsapp_chat: Ambil riwayat percakapan (get_messages), daftar chat terkini (list_chats), atau kontak.
3. whatsapp_message: Reaksi emoji (react), edit teks pesan (edit), atau tarik pesan untuk semua orang (revoke).
4. whatsapp_group: Buat grup (create), kelola anggota (participants: add/remove/promote/demote), atau ambil link undangan (invite_link).
5. whatsapp_bot: Kelola aturan balasan otomatis (create_rule, list_rules, toggle_rule, delete_rule, query_logs).
6. whatsapp_schedule: Jadwalkan pesan otomatis di masa mendatang (list, get, pause, resume, cancel).
7. whatsapp_webhook: Periksa atau perbarui URL webhook dan kirim simulasi uji coba (get, set, test).
8. whatsapp_app: Cek status koneksi perangkat (status), minta kode pairing (login_code), atau logout.

Aturan Penting:
- Jangan mengirim spam atau pesan berulang tanpa instruksi eksplisit pengguna.
- Lakukan konfirmasi sebelum mengeksekusi operasi destruktif seperti revoke pesan atau mengeluarkan peserta grup.
- Gunakan bahasa yang sopan, ramah, natural, dan ringkas.`

export default function IntegrationsPage() {
  const queryClient = useQueryClient()
  const baseUrl = useConnection((state) => state.baseUrl)
  const { data: devices } = useDevices()
  const { selectedDeviceId, selectDevice } = useDeviceStore()

  const currentDeviceId = selectedDeviceId || devices?.[0]?.id || ''

  const [activeTab, setActiveTab] = useState('mcp')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [insecureTls, setInsecureTls] = useState(false)
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['message'])

  const [testEvent, setTestEvent] = useState('message')
  const [testResult, setTestResult] = useState<WebhookTestResult | null>(null)
  const [isTesting, setIsTesting] = useState(false)

  const [codeTab, setCodeTab] = useState('nodejs')
  const [mcpClientTab, setMcpClientTab] = useState('cherrystudio')
  const [mcpMode, setMcpMode] = useState<'http' | 'stdio'>('http')
  const [expandedMcpTool, setExpandedMcpTool] = useState<string | null>(null)
  const [mcpTestResult, setMcpTestResult] = useState<string | null>(null)
  const [isMcpTesting, setIsMcpTesting] = useState(false)

  const [crudSteps, setCrudSteps] = useState<CrudStepResult[]>([])
  const [isCrudTesting, setIsCrudTesting] = useState(false)
  const [docToolKey, setDocToolKey] = useState('bot')

  const { data: webhookConfig, isLoading: isLoadingConfig } = useQuery<DeviceWebhookConfig>({
    queryKey: ['device-webhook', currentDeviceId],
    queryFn: () => getDeviceWebhook(currentDeviceId),
    enabled: !!currentDeviceId,
  })

  useEffect(() => {
    if (webhookConfig) {
      setWebhookUrl(webhookConfig.webhook_url || '')
      setWebhookSecret(webhookConfig.webhook_secret || '')
      setInsecureTls(webhookConfig.webhook_insecure_skip_verify || false)
      if (webhookConfig.webhook_events) {
        const events = webhookConfig.webhook_events
          .split(',')
          .map((e) => e.trim())
          .filter(Boolean)
        setSelectedEvents(events.length > 0 ? events : ['message'])
      } else {
        setSelectedEvents(['message'])
      }
    }
  }, [webhookConfig])

  const saveMutation = useMutation({
    mutationFn: (payload: UpdateDeviceWebhookPayload) =>
      updateDeviceWebhook(currentDeviceId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['device-webhook', currentDeviceId] })
      toast.success('Konfigurasi webhook berhasil disimpan')
    },
    onError: (err: Error) => {
      toast.error(`Gagal menyimpan: ${err.message}`)
    },
  })

  const handleSaveWebhook = () => {
    if (!currentDeviceId) {
      toast.error('Pilih perangkat aktif terlebih dahulu')
      return
    }
    const payload: UpdateDeviceWebhookPayload = {
      webhook_url: webhookUrl.trim(),
      webhook_secret: webhookSecret.trim(),
      webhook_events: selectedEvents.join(','),
      webhook_insecure_skip_verify: insecureTls,
    }
    saveMutation.mutate(payload)
  }

  const handleGenerateSecret = () => {
    const array = new Uint8Array(24)
    crypto.getRandomValues(array)
    const secret = Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
    setWebhookSecret(secret)
    toast.success('Secret key baru berhasil dibuat')
  }

  const handleToggleEvent = (eventId: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId],
    )
  }

  const handleSelectAllEvents = () => {
    setSelectedEvents(WEBHOOK_EVENT_LIST.map((e) => e.id))
  }

  const handleResetEvents = () => {
    setSelectedEvents(['message'])
  }

  const handleRunWebhookTest = async () => {
    if (!webhookUrl.trim()) {
      toast.error('Masukkan Webhook URL terlebih dahulu sebelum menguji')
      return
    }
    setIsTesting(true)
    setTestResult(null)
    try {
      const payload: TestWebhookPayload = {
        webhook_url: webhookUrl.trim(),
        webhook_secret: webhookSecret.trim(),
        webhook_insecure_skip_verify: insecureTls,
        event_type: testEvent,
      }
      const res = await testDeviceWebhook(currentDeviceId, payload)
      setTestResult(res)
      if (res.success) {
        toast.success(`Pengujian sukses: HTTP ${res.status_code} (${res.latency_ms}ms)`)
      } else {
        toast.error(`Respon error: HTTP ${res.status_code || 0} (${res.error || 'Server error'})`)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Koneksi gagal'
      toast.error(`Gagal menguji: ${msg}`)
    } finally {
      setIsTesting(false)
    }
  }

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} disalin ke clipboard`)
  }

  const effectiveMcpUrl = `${baseUrl || window.location.origin}/mcp`

  const callMcpRpc = async (method: string, params: Record<string, unknown> = {}) => {
    const endpoint = effectiveMcpUrl
    const currentToken = useConnection.getState().token
    const reqHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    }
    if (currentToken) {
      reqHeaders['Authorization'] = `Bearer ${currentToken}`
    }
    if (currentDeviceId) {
      reqHeaders['X-Device-Id'] = currentDeviceId
    }
    const rpcBody = JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params,
    })
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: reqHeaders,
      credentials: 'include',
      body: rpcBody,
    })
    const raw = await res.text()
    let parsed = raw
    if (raw.startsWith('event:') || raw.startsWith('data:')) {
      for (const line of raw.split('\n')) {
        if (line.startsWith('data:')) {
          parsed = line.slice(5).trim()
          break
        }
      }
    }
    return JSON.parse(parsed)
  }

  const handleTestMcpServer = async () => {
    setIsMcpTesting(true)
    setMcpTestResult(null)
    try {
      const obj = await callMcpRpc('tools/list')
      setMcpTestResult(JSON.stringify(obj, null, 2))
      toast.success('MCP Server merespons tools/list dengan sukses!')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Koneksi gagal'
      setMcpTestResult(`Error: ${msg}`)
      toast.error(`Gagal menghubungi MCP Server: ${msg}`)
    } finally {
      setIsMcpTesting(false)
    }
  }

  const handleRunFullMcpCrudTest = async () => {
    setIsCrudTesting(true)
    setCrudSteps([])
    const results: CrudStepResult[] = []

    try {
      results.push({
        step: '1. CREATE',
        action: 'whatsapp_bot -> create_rule',
        status: 'pending',
        message: 'Membuat aturan baru (!mcp_live_test)...',
      })
      setCrudSteps([...results])

      const createRes = await callMcpRpc('tools/call', {
        name: 'whatsapp_bot',
        arguments: {
          action: 'create_rule',
          trigger_value: '!mcp_live_test',
          response_content: 'Halo dari tes otomatis MCP CRUD!',
        },
      })

      const ruleId = createRes?.result?.structuredContent?.id
      if (!ruleId) {
        throw new Error(createRes?.error?.message || 'Gagal membuat rule via MCP')
      }

      results[0] = {
        step: '1. CREATE',
        action: 'whatsapp_bot -> create_rule',
        status: 'success',
        message: `Sukses membuat Rule ID=${ruleId} via MCP`,
        payload: createRes.result,
      }
      setCrudSteps([...results])

      results.push({
        step: '2. READ',
        action: 'whatsapp_bot -> list_rules',
        status: 'pending',
        message: 'Membaca daftar aturan bot via MCP...',
      })
      setCrudSteps([...results])

      const listRes = await callMcpRpc('tools/call', {
        name: 'whatsapp_bot',
        arguments: { action: 'list_rules' },
      })

      results[1] = {
        step: '2. READ',
        action: 'whatsapp_bot -> list_rules',
        status: 'success',
        message: `Sukses membaca data aturan via MCP`,
        payload: listRes.result,
      }
      setCrudSteps([...results])

      results.push({
        step: '3. UPDATE',
        action: 'whatsapp_bot -> toggle_rule',
        status: 'pending',
        message: `Menonaktifkan Rule ID=${ruleId} via MCP...`,
      })
      setCrudSteps([...results])

      const toggleRes = await callMcpRpc('tools/call', {
        name: 'whatsapp_bot',
        arguments: { action: 'toggle_rule', rule_id: ruleId },
      })

      results[2] = {
        step: '3. UPDATE',
        action: 'whatsapp_bot -> toggle_rule',
        status: 'success',
        message: `Sukses toggle status Rule ID=${ruleId} via MCP`,
        payload: toggleRes.result,
      }
      setCrudSteps([...results])

      results.push({
        step: '4. DELETE',
        action: 'whatsapp_bot -> delete_rule',
        status: 'pending',
        message: `Menghapus Rule ID=${ruleId} via MCP...`,
      })
      setCrudSteps([...results])

      const deleteRes = await callMcpRpc('tools/call', {
        name: 'whatsapp_bot',
        arguments: { action: 'delete_rule', rule_id: ruleId },
      })

      results[3] = {
        step: '4. DELETE',
        action: 'whatsapp_bot -> delete_rule',
        status: 'success',
        message: `Sukses menghapus Rule ID=${ruleId} via MCP`,
        payload: deleteRes.result,
      }
      setCrudSteps([...results])

      toast.success('Siklus CRUD 100% MCP Selesai dengan Sukses!')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kegagalan'
      const lastIndex = results.length - 1
      if (lastIndex >= 0) {
        results[lastIndex] = {
          ...results[lastIndex],
          status: 'failed',
          message: `Gagal: ${msg}`,
        }
      }
      setCrudSteps([...results])
      toast.error(`Uji CRUD MCP Gagal: ${msg}`)
    } finally {
      setIsCrudTesting(false)
    }
  }

  const getClientConfigCode = (client: string, mode: 'http' | 'stdio') => {
    if (mode === 'http') {
      if (client === 'cherrystudio') {
        return JSON.stringify(
          {
            name: 'WhatsApp',
            description: 'WhatsApp Multi-Device Gateway & AI Engine',
            type: 'StreamableHTTP',
            url: effectiveMcpUrl,
            headers: currentDeviceId ? { 'X-Device-Id': currentDeviceId } : {},
          },
          null,
          2,
        )
      }
      if (client === 'antigravity') {
        return JSON.stringify(
          {
            mcpServers: {
              whatsapp: {
                serverUrl: effectiveMcpUrl,
                headers: currentDeviceId ? { 'X-Device-Id': currentDeviceId } : {},
              },
            },
          },
          null,
          2,
        )
      }
      if (client === 'claude') {
        return JSON.stringify(
          {
            mcpServers: {
              whatsapp: {
                url: effectiveMcpUrl,
                headers: currentDeviceId ? { 'X-Device-Id': currentDeviceId } : {},
              },
            },
          },
          null,
          2,
        )
      }
      if (client === 'cursor') {
        return JSON.stringify(
          {
            mcpServers: {
              whatsapp: {
                url: effectiveMcpUrl,
                headers: currentDeviceId ? { 'X-Device-Id': currentDeviceId } : {},
              },
            },
          },
          null,
          2,
        )
      }
      if (client === 'windsurf') {
        return JSON.stringify(
          {
            mcpServers: {
              whatsapp: {
                serverUrl: effectiveMcpUrl,
                headers: currentDeviceId ? { 'X-Device-Id': currentDeviceId } : {},
              },
            },
          },
          null,
          2,
        )
      }
      return JSON.stringify(
        {
          mcpServers: {
            whatsapp: {
              url: effectiveMcpUrl,
              headers: currentDeviceId ? { 'X-Device-Id': currentDeviceId } : {},
            },
          },
        },
        null,
        2,
      )
    }

    const runnerPath = 'tools/mcp-runner/runner.mjs'
    const activeToken = useConnection.getState().token
    const envObj: Record<string, string> = {
      GOWA_MCP_URL: effectiveMcpUrl,
      GOWA_MCP_PIN: activeToken || 'YOUR_PIN',
    }
    if (currentDeviceId) {
      envObj['GOWA_DEVICE_ID'] = currentDeviceId
    }

    if (client === 'cherrystudio') {
      return JSON.stringify(
        {
          name: 'WhatsApp',
          description: 'WhatsApp Multi-Device Gateway & AI Engine',
          type: 'STDIO',
          command: 'node',
          args: [runnerPath],
          env: envObj,
        },
        null,
        2,
      )
    }

    return JSON.stringify(
      {
        mcpServers: {
          whatsapp: {
            command: 'node',
            args: [runnerPath],
            env: envObj,
          },
        },
      },
      null,
      2,
    )
  }

  const getNodeSnippet = () => `import crypto from 'node:crypto';
import express from 'express';

const app = express();
const WEBHOOK_SECRET = '${webhookSecret || 'your_webhook_secret_here'}';

app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-hub-signature-256'];
  if (!signature) {
    return res.status(401).send('Signature header missing');
  }

  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  hmac.update(req.body);
  const digest = 'sha256=' + hmac.digest('hex');

  const isValid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  if (!isValid) {
    return res.status(403).send('Invalid signature');
  }

  const event = JSON.parse(req.body.toString('utf8'));
  console.log('Received event:', event.event, event.payload);

  res.status(200).json({ status: 'ok' });
});

app.listen(8080, () => console.log('Listening on port 8080'));`

  const getPythonSnippet = () => `import hmac
import hashlib
from fastapi import FastAPI, Request, HTTPException

app = FastAPI()
WEBHOOK_SECRET = "${webhookSecret || 'your_webhook_secret_here'}".encode()

@app.post("/webhook")
async def handle_webhook(request: Request):
    signature_header = request.headers.get("X-Hub-Signature-256")
    if not signature_header:
        raise HTTPException(status_code=401, detail="Missing signature")

    raw_body = await request.body()
    computed = "sha256=" + hmac.new(WEBHOOK_SECRET, raw_body, hashlib.sha256).hexdigest()

    if not hmac.compare_digest(signature_header, computed):
        raise HTTPException(status_code=403, detail="Invalid signature")

    data = await request.json()
    print("Received event:", data.get("event"))
    return {"status": "ok"}`

  const getGoSnippet = () => `package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"io"
	"net/http"
	"strings"
)

var webhookSecret = []byte("${webhookSecret || 'your_webhook_secret_here'}")

func webhookHandler(w http.ResponseWriter, r *http.Request) {
	sigHeader := r.Header.Get("X-Hub-Signature-256")
	if sigHeader == "" {
		http.Error(w, "Missing signature header", http.StatusUnauthorized)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed to read body", http.StatusBadRequest)
		return
	}

	mac := hmac.New(sha256.New, webhookSecret)
	mac.Write(body)
	expectedSig := "sha256=" + hex.EncodeToString(mac.Sum(nil))

	if !hmac.Equal([]byte(sigHeader), []byte(expectedSig)) {
		http.Error(w, "Invalid signature", http.StatusForbidden)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(\`{"status":"ok"}\`))
}

func main() {
	http.HandleFunc("/webhook", webhookHandler)
	http.ListenAndServe(":8080", nil)
}`

  const getCurlSnippet = () => `curl -X POST "${effectiveMcpUrl}" \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json, text/event-stream" \\
  ${currentDeviceId ? `-H "X-Device-Id: ${currentDeviceId}" \\\n  ` : ''}-d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }'`

  return (
    <div className="flex max-w-5xl flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Integrasi Pengembang"
          description="Konfigurasi Webhook real-time dan Model Context Protocol (MCP) server untuk AI."
        />
        <div className="flex items-center gap-2">
          <Label className="text-muted-foreground text-xs font-medium">Perangkat:</Label>
          <Select
            value={currentDeviceId}
            onValueChange={(val) => selectDevice(val)}
          >
            <SelectTrigger className="h-8 w-[180px] rounded-lg text-xs font-medium">
              <SelectValue placeholder="Pilih perangkat" />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              {devices?.map((d) => (
                <SelectItem key={d.id} value={d.id} className="text-xs">
                  {d.display_name || d.phone_number || d.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-muted/50 border-border/40 grid h-9 w-full max-w-md grid-cols-2 rounded-lg border p-0.5">
          <TabsTrigger
            value="mcp"
            className="data-[state=active]:bg-background data-[state=active]:text-foreground flex items-center justify-center gap-2 rounded-[6px] text-xs font-semibold transition-all"
          >
            <Cpu className="size-3.5 text-blue-500" />
            MCP Server AI
          </TabsTrigger>
          <TabsTrigger
            value="webhook"
            className="data-[state=active]:bg-background data-[state=active]:text-foreground flex items-center justify-center gap-2 rounded-[6px] text-xs font-semibold transition-all"
          >
            <Webhook className="size-3.5 text-emerald-500" />
            Webhook Event
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mcp" className="mt-4 flex flex-col gap-5">
          <Card className="glass-card border-border/60 rounded-xl backdrop-blur-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Cpu className="size-4 text-blue-500" />
                  Form Input Cepat: Modal &quot;Add MCP Server&quot; (Cherry Studio / Chatbox)
                </CardTitle>
                <Badge variant="outline" className="rounded-[5px] text-[10px] border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold">
                  Siap Salin 1-Klik
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Isi form popup &quot;Add MCP Server&quot; pada aplikasi AI Anda menggunakan data yang sudah disiapkan di bawah ini.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-xs">
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div className="border-border/50 bg-muted/20 flex flex-col gap-1 rounded-lg border p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-medium text-[11px]">* Name</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyText('WhatsApp', 'Nama Server')}
                      className="h-5 px-1.5 rounded-[4px] text-[10px] text-blue-600 dark:text-blue-400"
                    >
                      <Copy className="size-2.5 mr-1" />
                      Salin
                    </Button>
                  </div>
                  <span className="font-mono text-xs font-semibold text-foreground">
                    WhatsApp
                  </span>
                </div>

                <div className="border-border/50 bg-muted/20 flex flex-col gap-1 rounded-lg border p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-medium text-[11px]">Description</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleCopyText(
                          'WhatsApp Multi-Device Gateway & AI Engine',
                          'Deskripsi',
                        )
                      }
                      className="h-5 px-1.5 rounded-[4px] text-[10px] text-blue-600 dark:text-blue-400"
                    >
                      <Copy className="size-2.5 mr-1" />
                      Salin
                    </Button>
                  </div>
                  <span className="font-mono text-xs font-semibold text-foreground truncate">
                    WhatsApp Multi-Device Gateway &amp; AI Engine
                  </span>
                </div>

                <div className="border-border/50 bg-muted/20 flex flex-col gap-1 rounded-lg border p-2.5">
                  <span className="text-muted-foreground font-medium text-[11px]">* Type (Pilihan Radio)</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="rounded-[4px] border border-blue-500/40 bg-blue-500/10 px-2 py-0.5 font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                      ◉ StreamableHTTP
                    </span>
                    <span className="text-muted-foreground text-[10px]">
                      (Atau STDIO jika menggunakan runner script)
                    </span>
                  </div>
                </div>

                <div className="border-border/50 bg-muted/20 flex flex-col gap-1 rounded-lg border p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-medium text-[11px]">* URL Target</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyText(effectiveMcpUrl, 'URL Target')}
                      className="h-5 px-1.5 rounded-[4px] text-[10px] text-blue-600 dark:text-blue-400 font-bold"
                    >
                      <Copy className="size-2.5 mr-1" />
                      Salin URL
                    </Button>
                  </div>
                  <span className="font-mono text-xs font-semibold text-foreground truncate">
                    {effectiveMcpUrl}
                  </span>
                </div>
              </div>

              <div className="border-border/40 bg-muted/20 flex items-center justify-between rounded-lg border p-2.5">
                <div className="flex items-center gap-2">
                  <Zap className="size-4 text-amber-500 shrink-0" />
                  <span className="text-[11px] text-muted-foreground">
                    Di aplikasi seperti Cherry Studio / Chatbox: Pilih tipe <b>StreamableHTTP</b> lalu tempel URL <code>{effectiveMcpUrl}</code> dan klik <b>Save and enable</b>.
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleCopyText(
                      getClientConfigCode('cherrystudio', 'http'),
                      'JSON Konfigurasi',
                    )
                  }
                  className="h-7 shrink-0 rounded-[5px] text-[11px] font-semibold"
                >
                  <Copy className="size-3 mr-1" />
                  Salin Format JSON
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/60 rounded-xl backdrop-blur-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Play className="size-4 text-emerald-500" />
                  Uji Otonom 100% CRUD via MCP (Buktikan Kontrol Penuh AI)
                </CardTitle>
                <Button
                  onClick={handleRunFullMcpCrudTest}
                  disabled={isCrudTesting}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white h-8 rounded-lg px-3 text-xs font-semibold cursor-pointer active:scale-[0.98] transition-all"
                >
                  {isCrudTesting ? (
                    <RefreshCw className="mr-1.5 size-3.5 animate-spin" />
                  ) : (
                    <Play className="mr-1.5 size-3.5" />
                  )}
                  Jalankan Tes Siklus CRUD MCP
                </Button>
              </div>
              <CardDescription className="text-xs">
                Mengeksekusi siklus lengkap (Create &rarr; Read &rarr; Update &rarr; Delete) secara real-time melalui protokol JSON-RPC MCP untuk membuktikan AI memiliki kontrol 100% atas engine.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5 text-xs">
              {crudSteps.length === 0 ? (
                <div className="border-border/40 bg-muted/20 flex flex-col items-center justify-center rounded-lg border p-6 text-center">
                  <Cpu className="size-8 text-muted-foreground/50 mb-2" />
                  <span className="font-semibold text-xs text-foreground">
                    Belum Ada Riwayat Uji CRUD
                  </span>
                  <p className="text-muted-foreground text-[11px] max-w-md mt-1">
                    Klik tombol &quot;Jalankan Tes Siklus CRUD MCP&quot; di atas untuk menguji pembuatan aturan baru, pembacaan data, perubahan status, dan penghapusan data secara berurutan.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {crudSteps.map((s, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'flex flex-col rounded-lg border p-2.5 transition-all text-xs',
                        s.status === 'success' && 'border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/10',
                        s.status === 'pending' && 'border-amber-500/40 bg-amber-500/5 animate-pulse',
                        s.status === 'failed' && 'border-red-500/40 bg-red-500/5 dark:bg-red-500/10',
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold font-mono text-[11px] text-foreground">
                          {s.step}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'rounded-[4px] text-[10px] font-semibold uppercase',
                            s.status === 'success' && 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
                            s.status === 'pending' && 'border-amber-500/30 text-amber-600',
                            s.status === 'failed' && 'border-red-500/30 text-red-600',
                          )}
                        >
                          {s.status}
                        </Badge>
                      </div>
                      <span className="font-mono text-[10px] text-muted-foreground mt-0.5">
                        {s.action}
                      </span>
                      <p className="font-medium text-foreground text-[11px] mt-1">
                        {s.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card border-border/60 rounded-xl backdrop-blur-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Code2 className="size-4 text-indigo-500" />
                  Konfigurasi Siap Salin AI Client (Semua Platform)
                </CardTitle>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant={mcpMode === 'http' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMcpMode('http')}
                    className={cn(
                      'h-7 rounded-[5px] text-[11px] font-semibold transition-all',
                      mcpMode === 'http' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : '',
                    )}
                  >
                    Streamable HTTP
                  </Button>
                  <Button
                    variant={mcpMode === 'stdio' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMcpMode('stdio')}
                    className={cn(
                      'h-7 rounded-[5px] text-[11px] font-semibold transition-all',
                      mcpMode === 'stdio' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : '',
                    )}
                  >
                    Stdio Runner
                  </Button>
                </div>
              </div>
              <CardDescription className="text-xs">
                Pilih aplikasi AI Anda dan salin blok JSON konfigurasi resmi yang siap digunakan tanpa edit manual.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-xs">
              <Tabs value={mcpClientTab} onValueChange={setMcpClientTab} className="w-full">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <TabsList className="bg-muted/40 border-border/30 h-8 rounded-lg border p-0.5">
                    <TabsTrigger value="cherrystudio" className="h-7 rounded-[5px] text-xs">
                      Cherry / Chatbox
                    </TabsTrigger>
                    <TabsTrigger value="antigravity" className="h-7 rounded-[5px] text-xs">
                      Antigravity / Gemini
                    </TabsTrigger>
                    <TabsTrigger value="claude" className="h-7 rounded-[5px] text-xs">
                      Claude Desktop
                    </TabsTrigger>
                    <TabsTrigger value="cursor" className="h-7 rounded-[5px] text-xs">
                      Cursor IDE
                    </TabsTrigger>
                    <TabsTrigger value="windsurf" className="h-7 rounded-[5px] text-xs">
                      Windsurf
                    </TabsTrigger>
                  </TabsList>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleCopyText(
                        getClientConfigCode(mcpClientTab, mcpMode),
                        `Konfigurasi ${mcpClientTab.toUpperCase()}`,
                      )
                    }
                    className="h-7 rounded-[5px] text-[11px] font-medium"
                  >
                    <Copy className="size-3 mr-1" />
                    Salin Konfigurasi
                  </Button>
                </div>

                <div className="mt-2.5">
                  <pre className="border-border/40 bg-background/90 max-h-64 overflow-auto rounded-lg border p-3 font-mono text-[11px] leading-relaxed">
                    {getClientConfigCode(mcpClientTab, mcpMode)}
                  </pre>
                </div>
              </Tabs>

              <div className="border-border/40 bg-muted/20 flex items-start gap-2 rounded-lg border p-2.5 text-[11px] text-muted-foreground">
                <Zap className="size-4 shrink-0 text-amber-500 mt-0.5" />
                <span>
                  {mcpClientTab === 'cherrystudio' && (
                    <>Untuk Cherry Studio atau Chatbox: Masukkan form di atas atau import konfigurasi JSON ke daftar Server MCP.</>
                  )}
                  {mcpClientTab === 'antigravity' && (
                    <>Telah otomatis dikonfigurasi di <code className="bg-muted rounded px-1">.gemini/config/mcp_config.json</code> dan <code className="bg-muted rounded px-1">.gemini/settings.json</code>.</>
                  )}
                  {mcpClientTab === 'claude' && (
                    <>Lokasi file Claude Desktop di Windows: <code className="bg-muted rounded px-1">%APPDATA%\Claude\claude_desktop_config.json</code></>
                  )}
                  {mcpClientTab === 'cursor' && (
                    <>Simpan di root project Anda pada file <code className="bg-muted rounded px-1">.cursor/mcp.json</code></>
                  )}
                  {mcpClientTab === 'windsurf' && (
                    <>Simpan di konfigurasi MCP Global Windsurf atau file <code className="bg-muted rounded px-1">~/.codeium/windsurf/mcp_config.json</code></>
                  )}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/60 rounded-xl backdrop-blur-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <BookOpen className="size-4 text-purple-500" />
                  Kamus Lengkap CRUD &amp; System Prompt AI
                </CardTitle>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyText(AI_SYSTEM_PROMPT_DOC, 'System Prompt AI')}
                    className="h-7 rounded-[5px] text-[11px] font-medium"
                  >
                    <Copy className="size-3 mr-1" />
                    Salin System Prompt
                  </Button>
                </div>
              </div>
              <CardDescription className="text-xs">
                Dokumentasi lengkap request dan response JSON-RPC untuk setiap tool agar AI agent memahami struktur data secara presisi.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-xs">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Pilih Tool / Operasi:</Label>
                  <span className="font-mono text-[10px] text-muted-foreground uppercase">
                    Format: JSON-RPC 2.0
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                  {Object.keys(MCP_CRUD_DOCS).map((k) => (
                    <Button
                      key={k}
                      type="button"
                      variant={docToolKey === k ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDocToolKey(k)}
                      className={cn(
                        'h-7 rounded-[5px] text-[11px] font-medium truncate justify-start px-2',
                        docToolKey === k
                          ? 'bg-purple-700 text-white hover:bg-purple-800'
                          : 'hover:bg-muted',
                      )}
                    >
                      {k === 'bot' && '1. whatsapp_bot'}
                      {k === 'send' && '2. whatsapp_send'}
                      {k === 'chat' && '3. whatsapp_chat'}
                      {k === 'message' && '4. whatsapp_msg'}
                      {k === 'group' && '5. whatsapp_grp'}
                      {k === 'schedule' && '6. whatsapp_sch'}
                      {k === 'webhook' && '7. whatsapp_hook'}
                      {k === 'app' && '8. whatsapp_app'}
                    </Button>
                  ))}
                </div>
              </div>

              {MCP_CRUD_DOCS[docToolKey] && (
                <div className="border-border/50 bg-muted/20 flex flex-col gap-3 rounded-lg border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-foreground">
                        {MCP_CRUD_DOCS[docToolKey].title}
                      </span>
                      <Badge variant="outline" className="rounded-[4px] border-purple-500/30 text-purple-600 dark:text-purple-400 font-mono text-[10px]">
                        {MCP_CRUD_DOCS[docToolKey].crudType}
                      </Badge>
                    </div>
                    <span className="text-muted-foreground text-[11px]">
                      {MCP_CRUD_DOCS[docToolKey].desc}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[11px] text-foreground">
                          Contoh Request JSON-RPC
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleCopyText(
                              JSON.stringify(MCP_CRUD_DOCS[docToolKey].request, null, 2),
                              'Request JSON',
                            )
                          }
                          className="h-5 px-1.5 text-[10px]"
                        >
                          <Copy className="size-2.5 mr-1" />
                          Salin
                        </Button>
                      </div>
                      <pre className="border-border/40 bg-background/80 max-h-56 overflow-auto rounded-lg border p-2.5 font-mono text-[11px] leading-tight">
                        {JSON.stringify(MCP_CRUD_DOCS[docToolKey].request, null, 2)}
                      </pre>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[11px] text-foreground">
                          Contoh Response JSON-RPC
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleCopyText(
                              JSON.stringify(MCP_CRUD_DOCS[docToolKey].response, null, 2),
                              'Response JSON',
                            )
                          }
                          className="h-5 px-1.5 text-[10px]"
                        >
                          <Copy className="size-2.5 mr-1" />
                          Salin
                        </Button>
                      </div>
                      <pre className="border-border/40 bg-background/80 max-h-56 overflow-auto rounded-lg border p-2.5 font-mono text-[11px] leading-tight">
                        {JSON.stringify(MCP_CRUD_DOCS[docToolKey].response, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card border-border/60 rounded-xl backdrop-blur-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Activity className="size-4 text-blue-500" />
                  Konektivitas &amp; Respon tools/list
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestMcpServer}
                  disabled={isMcpTesting}
                  className="h-7 rounded-[5px] text-[11px] font-medium"
                >
                  {isMcpTesting ? (
                    <RefreshCw className="mr-1 size-3 animate-spin" />
                  ) : (
                    <Activity className="mr-1 size-3 text-blue-500" />
                  )}
                  Uji RPC tools/list
                </Button>
              </div>
              <CardDescription className="text-xs">
                Melihat respon JSON-RPC mentah dari endpoint <code>{effectiveMcpUrl}</code>.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-xs">
              {mcpTestResult ? (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[11px] text-foreground">
                      Hasil Uji tools/list
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMcpTestResult(null)}
                      className="h-5 px-1.5 text-[10px]"
                    >
                      Tutup
                    </Button>
                  </div>
                  <pre className="border-border/40 bg-background/90 max-h-48 overflow-auto rounded-lg border p-2 font-mono text-[11px] leading-tight">
                    {mcpTestResult}
                  </pre>
                </div>
              ) : (
                <div className="border-border/40 bg-muted/20 flex items-center justify-between rounded-lg border p-2.5">
                  <span className="text-muted-foreground text-[11px]">
                    Status Server: <b>Online</b> &mdash; Endpoint siap melayani request JSON-RPC 2.0.
                  </span>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-mono text-[10px]">
                    8 Tools Terdaftar
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card border-border/60 rounded-xl backdrop-blur-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Layers className="size-4 text-emerald-500" />
                  Katalog Tools MCP ({MCP_TOOLS_CATALOG.length} Tools)
                </CardTitle>
                <Badge variant="outline" className="rounded-[5px] text-[10px]">
                  Model Context Protocol v2025
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Daftar lengkap tools yang otomatis diekspos ke AI agent saat terhubung ke GoWA MCP Server.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5 text-xs">
              <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                {MCP_TOOLS_CATALOG.map((tool) => {
                  const isExpanded = expandedMcpTool === tool.name
                  return (
                    <div
                      key={tool.name}
                      className={cn(
                        'border-border/50 bg-muted/15 flex flex-col rounded-lg border p-3 transition-all',
                        isExpanded ? 'border-primary/40 bg-muted/30' : 'hover:border-border/80',
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-foreground">
                            {tool.name}
                          </span>
                          <span
                            className={cn(
                              'rounded-[4px] border px-1.5 py-0.5 text-[9px] font-semibold uppercase',
                              tool.badgeColor,
                            )}
                          >
                            {tool.badge}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedMcpTool(isExpanded ? null : tool.name)}
                          className="size-6 p-0 rounded-[4px]"
                        >
                          <ChevronRight
                            className={cn('size-3.5 transition-transform', isExpanded && 'rotate-90')}
                          />
                        </Button>
                      </div>

                      <span className="font-semibold text-xs text-foreground mt-1">
                        {tool.title}
                      </span>
                      <p className="text-muted-foreground text-[11px] leading-snug mt-0.5">
                        {tool.desc}
                      </p>

                      <div className="flex flex-wrap gap-1 mt-2">
                        {tool.actions.map((act) => (
                          <span
                            key={act}
                            className="border-border/40 bg-background/80 rounded px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                          >
                            {act}
                          </span>
                        ))}
                      </div>

                      {isExpanded && (
                        <div className="border-border/40 bg-background/90 mt-2.5 flex flex-col gap-1.5 rounded-lg border p-2 text-[10px]">
                          <span className="font-semibold text-foreground">Contoh Argumen Tool:</span>
                          <pre className="font-mono overflow-auto max-h-32 p-1">
                            {JSON.stringify(tool.sampleArgs, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhook" className="mt-4 flex flex-col gap-5">
          <Card className="glass-card border-border/60 rounded-xl backdrop-blur-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Webhook className="size-4 text-emerald-500" />
                  Konfigurasi Webhook
                </CardTitle>
                <Badge
                  variant="outline"
                  className={cn(
                    'rounded-[5px] text-[10px] font-semibold',
                    webhookUrl
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-slate-500/30 bg-muted/40 text-muted-foreground',
                  )}
                >
                  {webhookUrl ? 'Aktif' : 'Nonaktif'}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Kirim notifikasi HTTP POST setiap ada pesan masuk, pembaruan status, atau perubahan grup secara instan.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="webhook-url" className="text-xs font-semibold">
                  Endpoint URL Target
                </Label>
                <Input
                  id="webhook-url"
                  placeholder="https://api.domainanda.com/api/webhook/whatsapp"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="font-mono text-xs"
                />
                <p className="text-muted-foreground text-[11px]">
                  Kosongkan URL untuk menonaktifkan pengiriman webhook pada perangkat ini.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="webhook-secret" className="text-xs font-semibold">
                    Secret Key (HMAC-SHA256)
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleGenerateSecret}
                    className="h-6 gap-1 rounded-[5px] px-2 text-[11px] text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                  >
                    <Sparkles className="size-3" />
                    Buat Kunci Acak
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input
                    id="webhook-secret"
                    type="text"
                    placeholder="Masukkan atau buat kunci rahasia HMAC-SHA256"
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                    className="font-mono text-xs"
                  />
                  {webhookSecret && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyText(webhookSecret, 'Secret Key')}
                      className="size-9 shrink-0 rounded-lg p-0"
                    >
                      <Copy className="size-3.5" />
                    </Button>
                  )}
                </div>
                <p className="text-muted-foreground text-[11px]">
                  Header <code className="bg-muted rounded px-1 py-0.5">X-Hub-Signature-256</code> akan dikirim bersama payload untuk memverifikasi keaslian pengirim.
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Langganan Tipe Event</Label>
                  <div className="flex gap-1.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleSelectAllEvents}
                      className="h-6 rounded-[5px] px-2 text-[11px]"
                    >
                      Pilih Semua
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleResetEvents}
                      className="text-muted-foreground h-6 rounded-[5px] px-2 text-[11px]"
                    >
                      Reset Standar
                    </Button>
                  </div>
                </div>
                <div className="border-border/50 bg-muted/20 grid grid-cols-1 gap-2 rounded-lg border p-3 sm:grid-cols-2">
                  {WEBHOOK_EVENT_LIST.map((evt) => {
                    const isChecked = selectedEvents.includes(evt.id)
                    return (
                      <div
                        key={evt.id}
                        onClick={() => handleToggleEvent(evt.id)}
                        className={cn(
                          'flex cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 transition-all select-none',
                          isChecked
                            ? 'border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/10'
                            : 'border-border/40 hover:bg-muted/40',
                        )}
                      >
                        <Switch
                          checked={isChecked}
                          onCheckedChange={() => handleToggleEvent(evt.id)}
                          className="mt-0.5"
                        />
                        <div className="flex flex-col">
                          <span className="font-semibold text-xs text-foreground leading-tight">
                            {evt.label}
                          </span>
                          <span className="text-muted-foreground text-[11px] leading-snug mt-0.5">
                            {evt.desc}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="border-border/40 bg-muted/20 flex items-center justify-between rounded-lg border p-3">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-foreground">
                    Abaikan Verifikasi Sertifikat TLS / SSL
                  </span>
                  <span className="text-muted-foreground text-[11px]">
                    Aktifkan hanya untuk server pengujian lokal (self-signed certificate / localhost HTTPS).
                  </span>
                </div>
                <Switch
                  checked={insecureTls}
                  onCheckedChange={setInsecureTls}
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleSaveWebhook}
                  disabled={saveMutation.isPending || isLoadingConfig}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white min-h-9 rounded-lg px-4 text-xs font-semibold cursor-pointer active:scale-[0.98] transition-all"
                >
                  {saveMutation.isPending ? (
                    <RefreshCw className="mr-1.5 size-3.5 animate-spin" />
                  ) : (
                    <Check className="mr-1.5 size-3.5" />
                  )}
                  Simpan Konfigurasi Webhook
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/60 rounded-xl backdrop-blur-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Play className="size-4 text-blue-500" />
                  Simulator &amp; Penguji Payload Langsung
                </CardTitle>
                <Badge variant="outline" className="rounded-[5px] text-[10px]">
                  Real HTTP Dispatch
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Kirim paket pengujian webhook langsung dari server ke endpoint URL tujuan Anda untuk memverifikasi latensi dan respons server.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex flex-1 flex-col gap-1.5">
                  <Label className="text-xs font-semibold">Tipe Event Tes</Label>
                  <Select value={testEvent} onValueChange={setTestEvent}>
                    <SelectTrigger className="h-9 rounded-lg text-xs font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg">
                      <SelectItem value="message">message (Pesan Masuk)</SelectItem>
                      <SelectItem value="message.ack">message.ack (Status Pengiriman)</SelectItem>
                      <SelectItem value="group.participants">group.participants (Event Peserta Grup)</SelectItem>
                      <SelectItem value="call.offer">call.offer (Panggilan Masuk)</SelectItem>
                      <SelectItem value="connection">connection (Status Jaringan)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="button"
                  onClick={handleRunWebhookTest}
                  disabled={isTesting || !webhookUrl}
                  className="bg-blue-600 hover:bg-blue-700 text-white min-h-9 rounded-lg px-4 text-xs font-semibold cursor-pointer active:scale-[0.98] transition-all"
                >
                  {isTesting ? (
                    <RefreshCw className="mr-1.5 size-3.5 animate-spin" />
                  ) : (
                    <Send className="mr-1.5 size-3.5" />
                  )}
                  Kirim Tes Payload Sekarang
                </Button>
              </div>

              {testResult && (
                <div className="border-border/60 bg-muted/20 flex flex-col gap-3 rounded-lg border p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          'rounded-[5px] text-[10px] font-bold uppercase',
                          testResult.success
                            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400',
                        )}
                      >
                        {testResult.success ? `HTTP ${testResult.status_code} OK` : `HTTP ${testResult.status_code || 'GAGAL'}`}
                      </Badge>
                      <Badge variant="outline" className="rounded-[5px] text-[10px] font-mono">
                        Latensi: {testResult.latency_ms} ms
                      </Badge>
                      <span className="text-muted-foreground text-[11px] truncate max-w-[280px]">
                        Target: {testResult.url}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[11px] text-foreground">
                          Payload JSON Terkirim
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleCopyText(JSON.stringify(testResult.sent_payload, null, 2), 'Payload')
                          }
                          className="h-5 rounded-[4px] px-1.5 text-[10px]"
                        >
                          <Copy className="size-2.5 mr-1" />
                          Salin
                        </Button>
                      </div>
                      <pre className="border-border/40 bg-background/80 max-h-48 overflow-auto rounded-lg border p-2.5 font-mono text-[11px] leading-tight">
                        {JSON.stringify(testResult.sent_payload, null, 2)}
                      </pre>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <span className="font-semibold text-[11px] text-foreground">
                        Respon Server Penerima
                      </span>
                      <pre className="border-border/40 bg-background/80 max-h-48 overflow-auto rounded-lg border p-2.5 font-mono text-[11px] leading-tight">
                        {testResult.response_body || testResult.error || '(Respon kosong)'}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card border-border/60 rounded-xl backdrop-blur-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Shield className="size-4 text-purple-500" />
                  Verifikasi Signature Keamanan (Kode Penerima)
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    let code = getNodeSnippet()
                    if (codeTab === 'python') code = getPythonSnippet()
                    if (codeTab === 'go') code = getGoSnippet()
                    if (codeTab === 'curl') code = getCurlSnippet()
                    handleCopyText(code, 'Contoh Kode')
                  }}
                  className="h-7 rounded-[5px] text-[11px] font-medium"
                >
                  <Copy className="size-3 mr-1" />
                  Salin Kode
                </Button>
              </div>
              <CardDescription className="text-xs">
                Contoh implementasi validasi HMAC-SHA256 signature pada backend server penerima webhook Anda.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-xs">
              <Tabs value={codeTab} onValueChange={setCodeTab} className="w-full">
                <TabsList className="bg-muted/40 border-border/30 h-8 rounded-lg border p-0.5">
                  <TabsTrigger value="nodejs" className="h-7 rounded-[5px] text-xs">
                    Node.js (Express)
                  </TabsTrigger>
                  <TabsTrigger value="python" className="h-7 rounded-[5px] text-xs">
                    Python (FastAPI)
                  </TabsTrigger>
                  <TabsTrigger value="go" className="h-7 rounded-[5px] text-xs">
                    Go (Standard/Fiber)
                  </TabsTrigger>
                  <TabsTrigger value="curl" className="h-7 rounded-[5px] text-xs">
                    cURL Endpoint
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="nodejs" className="mt-2.5">
                  <pre className="border-border/40 bg-background/90 max-h-72 overflow-auto rounded-lg border p-3 font-mono text-[11px] leading-relaxed">
                    {getNodeSnippet()}
                  </pre>
                </TabsContent>
                <TabsContent value="python" className="mt-2.5">
                  <pre className="border-border/40 bg-background/90 max-h-72 overflow-auto rounded-lg border p-3 font-mono text-[11px] leading-relaxed">
                    {getPythonSnippet()}
                  </pre>
                </TabsContent>
                <TabsContent value="go" className="mt-2.5">
                  <pre className="border-border/40 bg-background/90 max-h-72 overflow-auto rounded-lg border p-3 font-mono text-[11px] leading-relaxed">
                    {getGoSnippet()}
                  </pre>
                </TabsContent>
                <TabsContent value="curl" className="mt-2.5">
                  <pre className="border-border/40 bg-background/90 max-h-72 overflow-auto rounded-lg border p-3 font-mono text-[11px] leading-relaxed">
                    {getCurlSnippet()}
                  </pre>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
