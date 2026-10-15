import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowRight,
  Bot,
  Check,
  Globe,
  Heart,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Trash2,
  User,
  Zap,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { importRules, type CreateRulePayload } from '@/api/bot'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InfoHint } from '@/components/ui/info-hint'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

export interface TemplateItem {
  id: string
  category: 'pacar' | 'global' | 'bisnis' | 'kustom'
  triggers: string[]
  response: string
  scope: 'all' | 'private' | 'group'
  triggerType: 'exact' | 'contains' | 'starts_with'
  description?: string
  isCustom?: boolean
}

const TEMPLATE_PRESETS: TemplateItem[] = [
  {
    id: 'p-1',
    category: 'pacar',
    triggers: ['sayang', 'ayank', 'beb', 'sayangku', 'cintaku'],
    response: 'Iyaaa sayangku cintaku, ada apa manis? Aku di sini selalu buat kamu 🥰❤️',
    scope: 'private',
    triggerType: 'contains',
    description: 'Panggilan manis & perhatian',
  },
  {
    id: 'p-2',
    category: 'pacar',
    triggers: ['kangen', 'rindu', 'lagi kangen', 'kangen banget'],
    response: 'Aku juga kangen banget sama kamu! Nanti kita ketemu ya sayang, jangan lupa senyum hari ini 💕',
    scope: 'private',
    triggerType: 'contains',
    description: 'Respon rasa rindu',
  },
  {
    id: 'p-3',
    category: 'pacar',
    triggers: ['lagi apa', 'lagi ngapain', 'sedang apa', 'sibuk gak'],
    response: 'Lagi mikirin kamu nih hehe. Kamu lagi ngapain sayang? Udah istirahat belum? 😊',
    scope: 'private',
    triggerType: 'contains',
    description: 'Tanya kabar & aktivitas',
  },
  {
    id: 'p-4',
    category: 'pacar',
    triggers: ['udah makan', 'kamu udah makan', 'jangan lupa makan'],
    response: 'Udah kok sayang, kamu sendiri udah makan belum? Awas ya jangan telat makan nanti maag kambuh loh 😘',
    scope: 'private',
    triggerType: 'contains',
    description: 'Pengingat makan',
  },
  {
    id: 'p-5',
    category: 'pacar',
    triggers: ['ngambek', 'marah ya', 'kamu marah', 'jangan ngambek'],
    response: 'Mana bisa aku marah lama-lama sama kamu. Sini cerita kenapa, jangan sedih ya sayang 🥺🤍',
    scope: 'private',
    triggerType: 'contains',
    description: 'Pereda ngambek & amarah',
  },
  {
    id: 'p-6',
    category: 'pacar',
    triggers: ['tidur ya', 'mau bobo', 'selamat tidur', 'good night', 'met bobo'],
    response: 'Selamat tidur sayangku! Mimpi indah ya, istirahat yang cukup biar besok seger lagi. Love you to the moon and back! 🌙✨',
    scope: 'private',
    triggerType: 'contains',
    description: 'Ucapan pengantar tidur',
  },
  {
    id: 'p-7',
    category: 'pacar',
    triggers: ['hati-hati', 'take care', 'hati hati di jalan', 'hati2 ya'],
    response: 'Iya sayangku, makasih perhatiannya ya! Kamu juga jaga diri baik-baik di sana ya ❤️',
    scope: 'private',
    triggerType: 'contains',
    description: 'Perhatian perjalanan',
  },
  {
    id: 'p-8',
    category: 'pacar',
    triggers: ['love you', 'sayang kamu', 'cinta kamu', 'i love u'],
    response: 'I love you more than words can say sayang! Makasih udah selalu ada buat aku 🥰💖',
    scope: 'private',
    triggerType: 'contains',
    description: 'Ungkapan cinta & kasih',
  },
  {
    id: 'p-9',
    category: 'pacar',
    triggers: ['capek', 'lelah banget', 'lagi capek', 'pusing kerjaan'],
    response: 'Puk-puk sayangku... Semangat ya cintaku! Jangan terlalu memaksakan diri, kalau butuh teman cerita aku siap dengerin kapanpun 🤗',
    scope: 'private',
    triggerType: 'contains',
    description: 'Penyemangat saat lelah',
  },
  {
    id: 'p-10',
    category: 'pacar',
    triggers: ['pagi sayang', 'selamat pagi', 'good morning', 'morning ayank'],
    response: 'Selamat pagi bidadariku/pangeranku! Awali hari dengan senyum ya, semoga harimu menyenangkan dan lancar rezekinya hari ini ☀️🌸',
    scope: 'private',
    triggerType: 'contains',
    description: 'Sapaan pagi romantis',
  },
  {
    id: 'p-11',
    category: 'pacar',
    triggers: ['cantik', 'ganteng', 'kamu cakep', 'lucu banget'],
    response: 'Hehe bisa aja kamu bikin aku tersipu malu, tapi kamu jauh lebih menggemaskan di mataku lho 🙈✨',
    scope: 'private',
    triggerType: 'contains',
    description: 'Gombalan & pujian',
  },
  {
    id: 'p-12',
    category: 'pacar',
    triggers: ['lagi sakit', 'gak enak badan', 'demam', 'flu'],
    response: 'Ya ampun sayang, udah minum obat belum? Banyakin istirahat dan minum air hangat ya, jangan capek-capek dulu. Cepat sembuh cintaku 🥺💊',
    scope: 'private',
    triggerType: 'contains',
    description: 'Perhatian saat sakit',
  },
  {
    id: 'p-13',
    category: 'pacar',
    triggers: ['kencan', 'jalan yuk', 'mau ketemu', 'weekend kemana'],
    response: 'Ayo banget! Mau kemana nih kita? Ke tempat makan favorit kamu atau keliling nyari udara segar? Kabarin yaa 🥰🚗',
    scope: 'private',
    triggerType: 'contains',
    description: 'Ajakan kencan/jalan',
  },
  {
    id: 'p-14',
    category: 'pacar',
    triggers: ['makasih sayang', 'terima kasih', 'makaci', 'thank you beb'],
    response: 'Sama-sama sayangku cintaku, apapun buat kamu pasti selalu aku usahakan yang terbaik 😊🤍',
    scope: 'private',
    triggerType: 'contains',
    description: 'Respon terima kasih',
  },
  {
    id: 'p-15',
    category: 'pacar',
    triggers: ['jangan lupa sholat', 'sholat yuk', 'udah adzan', 'sholat dulu'],
    response: 'Iya sayangku, makasih udah ngingetin ya! Kamu juga jangan telat sholatnya, semoga doa-doa kita dijawab Allah SWT 🤲🕌',
    scope: 'private',
    triggerType: 'contains',
    description: 'Pengingat ibadah',
  },
  {
    id: 'g-1',
    category: 'global',
    triggers: ['assalamualaikum', 'assalamu alaikum', 'assalamu\'alaikum'],
    response: 'Wa\'alaikumussalam warahmatullahi wabarakatuh. Selamat datang! Ada yang bisa kami bantu hari ini?',
    scope: 'all',
    triggerType: 'starts_with',
    description: 'Salam Islami pembuka',
  },
  {
    id: 'g-2',
    category: 'global',
    triggers: ['halo', 'hai', 'hello', 'hi admin', 'halo admin'],
    response: 'Halo! Selamat datang di layanan pesan otomatis kami. Silakan ketik *menu* untuk melihat informasi atau opsi layanan yang tersedia.',
    scope: 'all',
    triggerType: 'starts_with',
    description: 'Sapaan umum ramah',
  },
  {
    id: 'g-3',
    category: 'global',
    triggers: ['pagi', 'selamat siang', 'selamat sore', 'selamat malam'],
    response: 'Halo, salam hangat! Terima kasih telah menghubungi kami. Mohon tinggalkan pesan Anda, kami akan segera merespon sesaat lagi.',
    scope: 'all',
    triggerType: 'starts_with',
    description: 'Sapaan waktu fleksibel',
  },
  {
    id: 'g-4',
    category: 'global',
    triggers: ['menu', 'bantuan', 'help', 'fitur', 'layanan'],
    response: '📌 *PILIHAN LAYANAN & MENU:*\n1. Informasi Produk / Jasa\n2. Cek Jam Operasional\n3. Bantuan Customer Service\n\nSilakan ketik angka atau kata kunci di atas untuk panduan lebih lanjut.',
    scope: 'all',
    triggerType: 'exact',
    description: 'Menu panduan bot',
  },
  {
    id: 'g-5',
    category: 'global',
    triggers: ['terima kasih', 'makasih', 'thanks', 'tengkyu'],
    response: 'Sama-sama! Senang bisa membantu Anda. Jika ada pertanyaan lain, jangan ragu untuk menghubungi kami kembali. Semoga harimu menyenangkan!',
    scope: 'all',
    triggerType: 'contains',
    description: 'Respon ucapan terima kasih',
  },
  {
    id: 'g-6',
    category: 'global',
    triggers: ['ping', 'tes', 'test', 'cek koneksi'],
    response: 'Pong! 🏓 Gateway pesan otomatis WhatsApp aktif dan berjalan lancar.',
    scope: 'all',
    triggerType: 'exact',
    description: 'Uji koneksi bot',
  },
  {
    id: 'b-1',
    category: 'bisnis',
    triggers: ['harga', 'daftar harga', 'pricelist', 'biaya', 'ongkos'],
    response: 'Untuk katalog harga lengkap dan penawaran promo terbaru, silakan cek tautan katalog kami atau informasikan jenis produk/layanan yang Anda minati.',
    scope: 'all',
    triggerType: 'contains',
    description: 'Pertanyaan harga/pricelist',
  },
  {
    id: 'b-2',
    category: 'bisnis',
    triggers: ['jam buka', 'jam operasional', 'buka jam berapa', 'toko buka'],
    response: 'Layanan kami beroperasi setiap hari Senin - Sabtu pukul 08:00 - 17:00 WIB. Pesan di luar jam kerja akan direspon pada jam operasional berikutnya.',
    scope: 'all',
    triggerType: 'contains',
    description: 'Waktu jam kerja operasional',
  },
  {
    id: 'b-3',
    category: 'bisnis',
    triggers: ['alamat', 'lokasi', 'kantor dimana', 'alamat kantor', 'google maps'],
    response: 'Kantor dan pusat operasional kami berlokasi strategis. Untuk janji temu atau kunjungan, silakan konfirmasi terlebih dahulu melalui nomor ini.',
    scope: 'all',
    triggerType: 'contains',
    description: 'Lokasi dan alamat kantor',
  },
  {
    id: 'b-4',
    category: 'bisnis',
    triggers: ['cara pesan', 'order gimana', 'mau order', 'cara beli', 'pemesanan'],
    response: 'Cara pemesanan sangat mudah! Silakan kirimkan nama, item yang diinginkan, dan alamat lengkap untuk kami proses invoicenya segera.',
    scope: 'all',
    triggerType: 'contains',
    description: 'Alur order & pembelian',
  },
  {
    id: 'b-5',
    category: 'bisnis',
    triggers: ['rekening', 'nomor rekening', 'pembayaran kemana', 'transfer ke mana', 'qris'],
    response: 'Metode pembayaran resmi kami menerima Transfer Bank (BCA, Mandiri, BRI) dan QRIS/E-Wallet. Konfirmasi pembayaran dapat dikirimkan ke chat ini.',
    scope: 'all',
    triggerType: 'contains',
    description: 'Rekening & metode bayar',
  },
  {
    id: 'b-6',
    category: 'bisnis',
    triggers: ['customer service', 'bicara dengan admin', 'butuh bantuan manusia', 'hubungkan ke staf'],
    response: 'Pesan Anda telah diteruskan ke antrean agen kami. Mohon ditunggu sebentar ya kak, agen kami akan segera bergabung dalam obrolan.',
    scope: 'all',
    triggerType: 'contains',
    description: 'Eskalasi ke Customer Service',
  },
]

export default function SettingsTemplatesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [customTemplates, setCustomTemplates] = useState<TemplateItem[]>(() => {
    try {
      const raw = localStorage.getItem('gowa-custom-templates')
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  const [activeTab, setActiveTab] = useState<'all' | 'pacar' | 'global' | 'bisnis' | 'kustom'>('all')
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>(() => [
    ...customTemplates.map((t) => t.id),
    ...TEMPLATE_PRESETS.map((t) => t.id),
  ])
  const [targetMode, setTargetMode] = useState<'global' | 'special'>('global')
  const [targetPhone, setTargetPhone] = useState('')

  const [isCreatingCustom, setIsCreatingCustom] = useState(false)
  const [newCustomTitle, setNewCustomTitle] = useState('')
  const [newCustomCategory, setNewCustomCategory] = useState<'pacar' | 'global' | 'bisnis' | 'kustom'>('kustom')
  const [newCustomTriggers, setNewCustomTriggers] = useState('')
  const [newCustomResponse, setNewCustomResponse] = useState('')
  const [newCustomScope, setNewCustomScope] = useState<'all' | 'private' | 'group'>('all')
  const [newCustomTriggerType, setNewCustomTriggerType] = useState<'exact' | 'contains' | 'starts_with'>('contains')

  const allTemplates = [...customTemplates, ...TEMPLATE_PRESETS]

  const filteredTemplates = allTemplates.filter((item) => {
    if (activeTab === 'kustom') {
      if (!item.isCustom) return false
    } else if (activeTab !== 'all' && item.category !== activeTab) {
      return false
    }
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      item.triggers.some((t) => t.toLowerCase().includes(q)) ||
      item.response.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q))
    )
  })

  const isAllSelected =
    filteredTemplates.length > 0 &&
    filteredTemplates.every((item) => selectedIds.includes(item.id))

  const toggleSelectAll = () => {
    if (isAllSelected) {
      const currentFilteredIds = new Set(filteredTemplates.map((t) => t.id))
      setSelectedIds((prev) => prev.filter((id) => !currentFilteredIds.has(id)))
    } else {
      const currentFilteredIds = filteredTemplates.map((t) => t.id)
      setSelectedIds((prev) => Array.from(new Set([...prev, ...currentFilteredIds])))
    }
  }

  const toggleSelectItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const handleSaveCustomTemplate = (e: FormEvent) => {
    e.preventDefault()
    const cleanTriggers = newCustomTriggers
      .split(/[\r\n,]+/)
      .map((t) => t.trim())
      .filter(Boolean)

    if (cleanTriggers.length === 0) {
      toast.error('Masukkan minimal 1 kata kunci pemicu')
      return
    }
    if (!newCustomResponse.trim()) {
      toast.error('Isi pesan balasan tidak boleh kosong')
      return
    }

    const newTemplate: TemplateItem = {
      id: `custom-${Date.now()}`,
      category: newCustomCategory,
      triggers: cleanTriggers,
      response: newCustomResponse.trim(),
      scope: newCustomScope,
      triggerType: newCustomTriggerType,
      description: newCustomTitle.trim() || 'Template Kustom',
      isCustom: true,
    }

    const updated = [newTemplate, ...customTemplates]
    setCustomTemplates(updated)
    try {
      localStorage.setItem('gowa-custom-templates', JSON.stringify(updated))
    } catch {
    }

    setSelectedIds((prev) => [...prev, newTemplate.id])
    setNewCustomTitle('')
    setNewCustomTriggers('')
    setNewCustomResponse('')
    setIsCreatingCustom(false)
    toast.success('Template kustom berhasil disimpan dan ditambahkan ke katalog!')
  }

  const handleDeleteCustomTemplate = (id: string) => {
    const updated = customTemplates.filter((t) => t.id !== id)
    setCustomTemplates(updated)
    try {
      localStorage.setItem('gowa-custom-templates', JSON.stringify(updated))
    } catch {
    }
    setSelectedIds((prev) => prev.filter((item) => item !== id))
    toast.success('Template kustom berhasil dihapus')
  }

  const importMutation = useMutation({
    mutationFn: async (templatesToImport: TemplateItem[]) => {
      const payload: CreateRulePayload[] = templatesToImport.map((tpl) => {
        let recipient: string | undefined = undefined
        if (targetMode === 'special') {
          recipient = targetPhone.trim() || undefined
        } else {
          recipient = tpl.category === 'pacar' && targetPhone.trim()
            ? targetPhone.trim()
            : ''
        }

        return {
          trigger_type: tpl.triggerType,
          trigger_value: tpl.triggers.join('\n'),
          recipient_jid: recipient,
          scope: tpl.scope,
          response_type: 'text',
          response_content: tpl.response,
          is_active: true,
        }
      })

      return importRules(payload)
    },
    onSuccess: (res) => {
      toast.success(`${res.imported} aturan template berhasil ditambahkan ke Balasan Otomatis!`)
      void queryClient.invalidateQueries({ queryKey: ['bot-rules'] })
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Gagal mengimpor template')
    },
  })

  const handleImportSelected = () => {
    const selected = allTemplates.filter((t) => selectedIds.includes(t.id))
    if (selected.length === 0) {
      toast.error('Pilih minimal 1 template untuk diimpor')
      return
    }
    importMutation.mutate(selected)
  }

  const handleImportCategory = (cat: 'pacar' | 'global' | 'kustom') => {
    let templates: TemplateItem[] = []
    if (cat === 'pacar') {
      templates = allTemplates.filter((t) => t.category === 'pacar')
    } else if (cat === 'global') {
      templates = allTemplates.filter((t) => t.category === 'global' || t.category === 'bisnis')
    } else if (cat === 'kustom') {
      templates = customTemplates
    }
    if (templates.length === 0) {
      toast.error('Belum ada template pada kategori ini')
      return
    }
    importMutation.mutate(templates)
  }

  return (
    <div className="flex flex-col gap-5 max-w-5xl mx-auto w-full pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-foreground text-lg sm:text-xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            <span>Template Balasan</span>
            <InfoHint
              title="Template Balasan"
              items={[
                'Koleksi Pacar: Sapaan perhatian & romantis',
                'Koleksi Global: Sapaan umum & layanan pesan',
                'Template Kustom: Aturan buatan Anda yang tersimpan di browser',
                'Pilih template dan klik Terapkan untuk menambahkannya ke bot aktif',
              ]}
            />
          </h2>
          <p className="text-muted-foreground text-xs mt-0.5">
            Impor template siap pakai ke bot Anda.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            type="button"
            size="sm"
            onClick={() => setIsCreatingCustom((prev) => !prev)}
            className="btn-primary-theme h-8 text-xs gap-1.5 rounded-lg shadow-xs"
          >
            <Plus className="size-3.5" />
            <span>{isCreatingCustom ? 'Tutup' : 'Tambah Kustom'}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate('/bot/auto-replies')}
            className="h-8 text-xs gap-1.5 rounded-lg"
          >
            <Bot className="size-3.5" />
            <span>Lihat Aturan</span>
            <ArrowRight className="size-3" />
          </Button>
        </div>
      </div>

      {isCreatingCustom && (
        <Card className="border-primary/40 bg-card/80 rounded-xl shadow-md backdrop-blur-xl animate-in fade-in-50 duration-200">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="size-4 text-primary" />
                <CardTitle className="text-sm font-semibold">Template Kustom</CardTitle>
                <InfoHint
                  title="Template Kustom"
                  description="Aturan disimpan di browser dan bisa diterapkan berulang kali ke bot aktif."
                />
              </div>
              <Badge variant="outline" className="text-[10px] text-primary border-primary/40">
                Lokal
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            <form onSubmit={handleSaveCustomTemplate} className="flex flex-col gap-3 text-xs">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="custom-title" className="text-xs font-medium">Judul:</Label>
                  <Input
                    id="custom-title"
                    placeholder="Nama template"
                    value={newCustomTitle}
                    onChange={(e) => setNewCustomTitle(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium">Kategori:</Label>
                  <Select
                    value={newCustomCategory}
                    onValueChange={(val: any) => setNewCustomCategory(val)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kustom">Kustom</SelectItem>
                      <SelectItem value="pacar">Pacar</SelectItem>
                      <SelectItem value="global">Global</SelectItem>
                      <SelectItem value="bisnis">Bisnis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="custom-triggers" className="text-xs font-medium">
                  Kata Kunci (pisahkan koma):
                </Label>
                <Input
                  id="custom-triggers"
                  placeholder="kata1, kata2, kata3"
                  value={newCustomTriggers}
                  onChange={(e) => setNewCustomTriggers(e.target.value)}
                  className="h-8 text-xs font-mono"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="custom-response" className="text-xs font-medium">Pesan Balasan:</Label>
                <Textarea
                  id="custom-response"
                  rows={3}
                  placeholder="Pesan balasan..."
                  value={newCustomResponse}
                  onChange={(e) => setNewCustomResponse(e.target.value)}
                  className="text-xs leading-relaxed"
                  required
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium">Lingkup:</Label>
                  <Select
                    value={newCustomScope}
                    onValueChange={(val: any) => setNewCustomScope(val)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Obrolan</SelectItem>
                      <SelectItem value="private">Hanya Pribadi</SelectItem>
                      <SelectItem value="group">Hanya Grup</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium">Pencocokan:</Label>
                  <Select
                    value={newCustomTriggerType}
                    onValueChange={(val: any) => setNewCustomTriggerType(val)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contains">Mengandung</SelectItem>
                      <SelectItem value="exact">Persis</SelectItem>
                      <SelectItem value="starts_with">Diawali</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCreatingCustom(false)}
                  className="h-8 text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="btn-primary-theme h-8 px-4 text-xs shadow-xs"
                >
                  Simpan
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/70 bg-card/60 rounded-xl shadow-xs backdrop-blur-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-semibold">Target Penerima</CardTitle>
            <InfoHint
              title="Target Penerima"
              items={[
                'Global: Aturan diterapkan ke seluruh pengirim',
                'Khusus Pacar: Aturan hanya merespon nomor yang dimasukkan',
              ]}
            />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pt-0">
          <div className="grid gap-2.5 sm:grid-cols-2">
            <div
              onClick={() => setTargetMode('global')}
              className={cn(
                'cursor-pointer flex flex-col gap-1 rounded-xl border p-2.5 transition-all',
                targetMode === 'global'
                  ? 'border-primary bg-primary/10 shadow-xs'
                  : 'border-border/70 bg-card/40 hover:bg-card/70',
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="size-4 text-primary" />
                  <span className="text-xs font-semibold">Global</span>
                </div>
                {targetMode === 'global' && <Check className="size-3.5 text-primary" />}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Semua kontak WhatsApp
              </p>
            </div>

            <div
              onClick={() => setTargetMode('special')}
              className={cn(
                'cursor-pointer flex flex-col gap-1 rounded-xl border p-2.5 transition-all',
                targetMode === 'special'
                  ? 'border-rose-500/60 bg-rose-500/10 shadow-xs'
                  : 'border-border/70 bg-card/40 hover:bg-card/70',
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="size-4 text-rose-500" />
                  <span className="text-xs font-semibold">Khusus Nomor</span>
                </div>
                {targetMode === 'special' && <Check className="size-3.5 text-rose-500" />}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Nomor kontak tertentu
              </p>
            </div>
          </div>

          {targetMode === 'special' && (
            <div className="flex flex-col gap-1 animate-in fade-in-50 duration-200">
              <Label htmlFor="pacar-phone" className="text-xs font-semibold text-rose-500 dark:text-rose-400">
                Nomor WhatsApp Target:
              </Label>
              <Input
                id="pacar-phone"
                placeholder="628xxxxxxxxxx"
                value={targetPhone}
                onChange={(e) => setTargetPhone(e.target.value)}
                className="h-8 text-xs font-mono max-w-md"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/60">
            <Button
              type="button"
              size="sm"
              disabled={importMutation.isPending}
              onClick={() => handleImportCategory('pacar')}
              className="h-8 text-xs gap-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 shadow-xs"
            >
              <Heart className="size-3.5" />
              <span>Impor Pacar (15)</span>
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={importMutation.isPending}
              onClick={() => handleImportCategory('global')}
              className="h-8 text-xs gap-1.5 rounded-lg border-primary/30 text-primary hover:bg-primary/10"
            >
              <Globe className="size-3.5" />
              <span>Impor Global (12)</span>
            </Button>

            {customTemplates.length > 0 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={importMutation.isPending}
                onClick={() => handleImportCategory('kustom')}
                className="h-8 text-xs gap-1.5 rounded-lg border-indigo-500/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10"
              >
                <User className="size-3.5" />
                <span>Impor Kustom ({customTemplates.length})</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 bg-muted/40 p-1 rounded-xl border border-border/70 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={cn(
                'px-3 py-1 rounded-lg font-medium transition-all cursor-pointer',
                activeTab === 'all'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Semua ({allTemplates.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pacar')}
              className={cn(
                'px-3 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1',
                activeTab === 'pacar'
                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Heart className="size-3" />
              <span>Pacar (15)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('global')}
              className={cn(
                'px-3 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1',
                activeTab === 'global'
                  ? 'bg-primary/15 text-primary font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Globe className="size-3" />
              <span>Global (6)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('bisnis')}
              className={cn(
                'px-3 py-1 rounded-lg font-medium transition-all cursor-pointer',
                activeTab === 'bisnis'
                  ? 'bg-primary/15 text-primary font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Bisnis (6)
            </button>
            {customTemplates.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('kustom')}
                className={cn(
                  'px-3 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1',
                  activeTab === 'kustom'
                    ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <User className="size-3" />
                <span>Kustom ({customTemplates.length})</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-60">
              <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
              <Input
                placeholder="Cari pemicu atau isi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>
            <Button
              type="button"
              size="sm"
              disabled={importMutation.isPending || selectedIds.length === 0}
              onClick={handleImportSelected}
              className="btn-primary-theme h-8 gap-1.5 px-3 text-xs shadow-xs shrink-0"
            >
              {importMutation.isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Mengimpor…</span>
                </>
              ) : (
                <>
                  <Zap className="size-3.5" />
                  <span>Terapkan ({selectedIds.length})</span>
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Checkbox
              id="select-all-templates"
              checked={isAllSelected}
              onCheckedChange={toggleSelectAll}
            />
            <label
              htmlFor="select-all-templates"
              className="cursor-pointer font-medium hover:text-foreground"
            >
              Pilih Semua yang Ditampilkan ({filteredTemplates.length})
            </label>
          </div>
          <span className="font-mono text-[11px]">
            {selectedIds.length} dari {allTemplates.length} dipilih
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {filteredTemplates.map((item) => {
            const isSelected = selectedIds.includes(item.id)
            return (
              <div
                key={item.id}
                onClick={() => toggleSelectItem(item.id)}
                className={cn(
                  'cursor-pointer relative flex flex-col justify-between gap-3 rounded-xl border p-3.5 transition-all text-xs',
                  isSelected
                    ? item.category === 'pacar'
                      ? 'border-rose-500/50 bg-rose-500/5 shadow-xs'
                      : item.isCustom
                        ? 'border-indigo-500/50 bg-indigo-500/5 shadow-xs'
                        : 'border-primary/50 bg-primary/5 shadow-xs'
                    : 'border-border/70 bg-card/40 hover:bg-card/80',
                )}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelectItem(item.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      {item.isCustom ? (
                        <Badge variant="outline" className="text-[10px] gap-1 border-indigo-500/40 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10">
                          <User className="size-2.5" />
                          <span>Kustom</span>
                        </Badge>
                      ) : item.category === 'pacar' ? (
                        <Badge variant="outline" className="text-[10px] gap-1 border-rose-500/30 text-rose-600 dark:text-rose-400">
                          <Heart className="size-2.5" />
                          <span>Pacar / Pasangan</span>
                        </Badge>
                      ) : item.category === 'global' ? (
                        <Badge variant="outline" className="text-[10px] gap-1 border-primary/30 text-primary">
                          <Globe className="size-2.5" />
                          <span>Global</span>
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] gap-1 border-blue-500/30 text-blue-600 dark:text-blue-400">
                          <Bot className="size-2.5" />
                          <span>Bisnis & CS</span>
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {item.description && (
                        <span className="text-muted-foreground text-[10px] truncate max-w-[150px]">{item.description}</span>
                      )}
                      {item.isCustom && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteCustomTemplate(item.id)
                          }}
                          className="size-6 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded"
                          title="Hapus template kustom ini"
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-semibold text-muted-foreground">Pemicu Pesan:</span>
                    <div className="flex flex-wrap gap-1">
                      {item.triggers.map((trig, i) => (
                        <span
                          key={i}
                          className="rounded-md border border-border/80 bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-foreground"
                        >
                          {trig}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-semibold text-muted-foreground">Balasan Otomatis:</span>
                    <div className="rounded-lg border border-border/60 bg-background/80 p-2.5 text-xs text-foreground leading-relaxed shadow-2xs">
                      {item.response}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[10px] text-muted-foreground">
                  <span>Scope: {item.scope}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      importMutation.mutate([item])
                    }}
                    className="h-6 px-2 text-[10px] text-primary hover:bg-primary/10 gap-1 rounded-md"
                  >
                    <span>Impor Aturan Ini</span>
                    <ArrowRight className="size-2.5" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
