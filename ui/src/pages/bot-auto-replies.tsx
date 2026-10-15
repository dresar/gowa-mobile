import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Bot,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  Download,
  Edit,
  Eye,
  FileJson,
  FileText,
  LayoutGrid,
  List,
  PhoneCall,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Upload,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  bulkDeleteRules,
  clearAllRules,
  deleteRule,
  importRules,
  listRules,
  toggleRule,
  type BotRule,
  type CreateRulePayload,
} from '@/api/bot'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'

export const parseTriggers = (triggerValue?: string): string[] => {
  if (!triggerValue) return []
  return triggerValue
    .split(/[\r\n]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
}

export const parseRecipientNumbers = (recipientJid?: string): string[] => {
  if (!recipientJid) return []
  const clean = recipientJid.trim()
  if (!clean || clean === 'all' || clean === 'global') return []
  return clean
    .split(/[\n,;\s|]+/)
    .map((n) => n.trim())
    .filter((n) => n.length > 0)
}

export const isSpecialRule = (rule: BotRule): boolean => {
  const clean = rule.recipient_jid?.trim()
  return !!clean && clean !== 'all' && clean !== 'global'
}

export const isGlobalRule = (rule: BotRule): boolean => {
  const clean = rule.recipient_jid?.trim()
  return !clean || clean === 'all' || clean === 'global'
}

export const parseTextOrMarkdownRules = (
  text: string,
  defaultRecipient?: string,
): CreateRulePayload[] => {
  if (!text || !text.trim()) return []
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim()

  let blocks = normalized
    .split(/\n\s*(?:={3,}|-{3,})\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)

  if (blocks.length <= 1 && !normalized.match(/\n\s*(?:={3,}|-{3,})\s*\n/)) {
    blocks = normalized
      .split(
        /\n{2,}(?=(?:#{1,4}\s*)?(?:TARGET|NOMOR|RESIPIEN|JID|PEMICU|TRIGGERS?|KATA\s*KUNCI)\s*[:：]?)/i,
      )
      .map((b) => b.trim())
      .filter(Boolean)
  }

  const result: CreateRulePayload[] = []

  for (const block of blocks) {
    let cleanBlock = block
      .replace(/^(?:={3,}|-{3,})\s*/, '')
      .replace(/\s*(?:={3,}|-{3,})$/, '')
      .trim()
    if (!cleanBlock) continue

    let recipient = defaultRecipient || ''
    const targetMatch = cleanBlock.match(
      /(?:^|\n)\s*(?:#{1,4}\s*)?(?:TARGET|NOMOR|RESIPIEN|JID)\s*[:：]\s*([^\n]+)/i,
    )
    if (targetMatch) {
      recipient = targetMatch[1].trim()
      cleanBlock = cleanBlock.replace(targetMatch[0], '').trim()
    }

    const balasanRegex =
      /(?:^|\n)\s*(?:#{1,4}\s*)?(?:BALASAN|JAWABAN|RESPON(?:SE)?|REPLY)\s*[:：]?\s*\n?/i
    const pemicuRegex =
      /(?:^|\n)\s*(?:#{1,4}\s*)?(?:PEMICU|TRIGGERS?|KATA\s*KUNCI)\s*[:：]?\s*\n?/i

    const balasanMatch = cleanBlock.match(balasanRegex)
    if (!balasanMatch || balasanMatch.index === undefined) continue

    const rawPemicuSection = cleanBlock.slice(0, balasanMatch.index)
    const rawBalasanSection = cleanBlock.slice(
      balasanMatch.index + balasanMatch[0].length,
    )

    const pemicuClean = rawPemicuSection.replace(pemicuRegex, '').trim()
    const responseContent = rawBalasanSection.trim()

    if (!pemicuClean || !responseContent) continue

    const triggers = pemicuClean
      .split('\n')
      .map((line) => line.replace(/^[\s*\->#\d.)]+/, '').trim())
      .filter((line) => line.length > 0)

    if (triggers.length === 0) continue

    result.push({
      trigger_type: 'contains',
      trigger_value: triggers.join('\n'),
      recipient_jid: recipient || undefined,
      response_type: 'text',
      response_content: responseContent,
      scope: 'all',
      is_active: true,
    })
  }
  return result
}

export const parseAnyRules = (
  content: string,
  defaultRecipient?: string,
): CreateRulePayload[] => {
  const trimmed = content.trim()
  if (!trimmed) return []

  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed)
      const list = Array.isArray(parsed) ? parsed : [parsed]
      const valid = list.filter(
        (item): item is CreateRulePayload =>
          Boolean(item) &&
          typeof item === 'object' &&
          Boolean(item.trigger_value) &&
          Boolean(item.response_content),
      )
      if (valid.length > 0) {
        if (defaultRecipient) {
          return valid.map((r) => ({
            ...r,
            recipient_jid: defaultRecipient,
          }))
        }
        return valid
      }
    } catch {
    }
  }

  return parseTextOrMarkdownRules(trimmed, defaultRecipient)
}

export const exportRulesToText = (rules: BotRule[]): string => {
  return rules
    .map((r) => {
      const parts = ['===']
      if (
        r.recipient_jid?.trim() &&
        r.recipient_jid !== 'global' &&
        r.recipient_jid !== 'all'
      ) {
        parts.push(`TARGET: ${r.recipient_jid.trim()}`)
      }
      parts.push('PEMICU:')
      parts.push(r.trigger_value.trim())
      parts.push('BALASAN:')
      parts.push(r.response_content.trim())
      parts.push('===')
      return parts.join('\n')
    })
    .join('\n\n')
}

export default function BotAutoRepliesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [targetFilter, setTargetFilter] = useState<'all' | 'special' | 'global'>('all')
  const [scopeFilter, setScopeFilter] = useState<'all' | 'private' | 'group'>('all')
  const [activeFilter, setActiveFilter] = useState<'all' | 'true' | 'false'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      return 'list'
    }
    return 'grid'
  })



  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedDetailRule, setSelectedDetailRule] = useState<BotRule | null>(null)
  const [hasCopiedDetail, setHasCopiedDetail] = useState(false)

  const [importOpen, setImportOpen] = useState(false)
  const [importMode, setImportMode] = useState<'file' | 'paste'>('file')
  const [uploadedFileInfo, setUploadedFileInfo] = useState<{
    name: string
    size: number
    count: number
  } | null>(null)
  const [fileRules, setFileRules] = useState<CreateRulePayload[]>([])
  const [importJsonText, setImportJsonText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedRuleIds, setSelectedRuleIds] = useState<number[]>([])
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false)
  const [clearGlobalConfirmOpen, setClearGlobalConfirmOpen] = useState(false)
  const [importTargetOption, setImportTargetOption] = useState<'keep' | 'global' | 'special'>('keep')
  const [importCustomRecipient, setImportCustomRecipient] = useState('')



  const { data: rules = [], isLoading, refetch } = useQuery({
    queryKey: ['bot-rules', search, scopeFilter, activeFilter],
    queryFn: () =>
      listRules({
        search: search.trim() || undefined,
        scope: scopeFilter === 'all' ? undefined : scopeFilter,
        active: activeFilter === 'all' ? undefined : activeFilter,
      }),
  })

  const PAGE_SIZE = 20
  const [currentPage, setCurrentPage] = useState(1)

  const specialCount = rules.filter(isSpecialRule).length
  const globalCount = rules.filter(isGlobalRule).length

  const filteredRules = rules.filter((rule) => {
    if (targetFilter === 'special') return isSpecialRule(rule)
    if (targetFilter === 'global') return isGlobalRule(rule)
    return true
  })

  const totalItems = filteredRules.length
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages)
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalItems)
  const paginatedRules = filteredRules.slice(startIndex, endIndex)

  const toggleSelectRule = (id: number) => {
    setSelectedRuleIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const isAllCurrentPageSelected =
    paginatedRules.length > 0 && paginatedRules.every((r) => selectedRuleIds.includes(r.id))

  const toggleSelectAllCurrentPage = () => {
    if (isAllCurrentPageSelected) {
      const pageIds = new Set(paginatedRules.map((r) => r.id))
      setSelectedRuleIds((prev) => prev.filter((id) => !pageIds.has(id)))
    } else {
      const pageIds = paginatedRules.map((r) => r.id)
      setSelectedRuleIds((prev) => Array.from(new Set([...prev, ...pageIds])))
    }
  }



  const importMutation = useMutation({
    mutationFn: async (payload: CreateRulePayload[]) => {
      return importRules(payload)
    },
    onSuccess: (res) => {
      toast.success(`${res.imported} aturan berhasil di-import!`)
      setImportOpen(false)
      setUploadedFileInfo(null)
      setFileRules([])
      setImportJsonText('')
      void queryClient.invalidateQueries({ queryKey: ['bot-rules'] })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Gagal mengimpor aturan')
    },
  })

  const clearAllMutation = useMutation({
    mutationFn: clearAllRules,
    onSuccess: () => {
      toast.success('Semua aturan berhasil dihapus!')
      setSelectedRuleIds([])
      setResetConfirmOpen(false)
      void queryClient.invalidateQueries({ queryKey: ['bot-rules'] })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Gagal mereset aturan')
    },
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: number[]) => bulkDeleteRules(ids),
    onSuccess: (res) => {
      toast.success(`${res.deleted_count || selectedRuleIds.length} aturan terpilih berhasil dihapus!`)
      setSelectedRuleIds([])
      setBulkDeleteConfirmOpen(false)
      void queryClient.invalidateQueries({ queryKey: ['bot-rules'] })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Gagal menghapus aturan terpilih')
    },
  })

  const clearGlobalMutation = useMutation({
    mutationFn: async () => {
      const globalIds = rules.filter(isGlobalRule).map((r) => r.id)
      if (globalIds.length === 0) return { deleted_count: 0 }
      return bulkDeleteRules(globalIds)
    },
    onSuccess: (res) => {
      toast.success(`${res.deleted_count || globalCount} aturan global berhasil dibersihkan!`)
      setSelectedRuleIds([])
      setClearGlobalConfirmOpen(false)
      void queryClient.invalidateQueries({ queryKey: ['bot-rules'] })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Gagal membersihkan aturan global')
    },
  })

  const toggleMutation = useMutation({
    mutationFn: toggleRule,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bot-rules'] })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Gagal mengubah status')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteRule,
    onSuccess: () => {
      toast.success('Aturan dihapus')
      if (selectedDetailRule) {
        setDetailOpen(false)
      }
      void queryClient.invalidateQueries({ queryKey: ['bot-rules'] })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Gagal menghapus')
    },
  })

  const openCreateDialog = () => {
    navigate('/bot/auto-replies/new')
  }

  const openEditDialog = (rule: BotRule) => {
    navigate(`/bot/auto-replies/edit/${rule.id}`)
  }

  const openDetailDialog = (rule: BotRule) => {
    setSelectedDetailRule(rule)
    setHasCopiedDetail(false)
    setDetailOpen(true)
  }

  const handleExportJson = () => {
    if (!rules.length) {
      toast.error('Belum ada aturan untuk diexport')
      return
    }
    const exportData = rules.map((r) => ({
      trigger_type: r.trigger_type,
      trigger_value: r.trigger_value,
      recipient_jid: r.recipient_jid || undefined,
      scope: r.scope,
      response_type: r.response_type,
      response_content: r.response_content,
      media_url: r.media_url || undefined,
      is_active: r.is_active,
    }))
    const jsonStr = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `balasan-otomatis-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success(`${rules.length} aturan diexport ke JSON!`)
  }

  const handleExportText = () => {
    if (!rules.length) {
      toast.error('Belum ada aturan untuk diexport')
      return
    }
    const textOutput = exportRulesToText(rules)
    const blob = new Blob([textOutput], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `balasan-otomatis-${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success(`${rules.length} aturan diexport ke TXT!`)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      try {
        const valid = parseAnyRules(content)
        if (valid.length === 0) {
          toast.error('Tidak ada data aturan valid di berkas ini')
          return
        }
        setFileRules(valid)
        setUploadedFileInfo({
          name: file.name,
          size: file.size,
          count: valid.length,
        })
        setImportMode('file')
        toast.success(`Berkas "${file.name}" (${valid.length} aturan) siap di-import!`)
      } catch {
        toast.error('Gagal membaca berkas aturan')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const parsePastedData = (): CreateRulePayload[] => {
    return parseAnyRules(importJsonText)
  }

  const activeImportRules =
    importMode === 'file' && uploadedFileInfo ? fileRules : parsePastedData()

  const handleExecuteImport = () => {
    let rulesToImport = activeImportRules
    if (importTargetOption === 'global') {
      rulesToImport = rulesToImport.map((r) => ({ ...r, recipient_jid: '' }))
    } else if (importTargetOption === 'special' && importCustomRecipient.trim()) {
      rulesToImport = rulesToImport.map((r) => ({
        ...r,
        recipient_jid: importCustomRecipient.trim(),
      }))
    }
    if (rulesToImport.length === 0) {
      toast.error('Belum ada data aturan yang valid untuk di-import')
      return
    }
    importMutation.mutate(rulesToImport)
  }

  const copyDetailContent = (text: string) => {
    void navigator.clipboard.writeText(text)
    setHasCopiedDetail(true)
    toast.success('Respons disalin ke clipboard!')
    setTimeout(() => setHasCopiedDetail(false), 2000)
  }

  return (
    <div className="w-full flex flex-col gap-4">
      <PageHeader
        title="Balasan Otomatis"
        description="Filter pemicu kata kunci & nomor WhatsApp"
        actions={
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
              className="h-8 gap-1.5 rounded-[6px] text-xs"
            >
              <RefreshCw className="size-3.5" />
              <span>Perbarui</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportText}
              disabled={rules.length === 0}
              className="h-8 gap-1.5 rounded-[6px] text-xs"
              title="Export dalam format TXT / Markdown (Blok PEMICU & BALASAN)"
            >
              <FileText className="size-3.5" />
              <span>Export TXT</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportJson}
              disabled={rules.length === 0}
              className="h-8 gap-1.5 rounded-[6px] text-xs"
              title="Export dalam format JSON"
            >
              <Download className="size-3.5" />
              <span>Export JSON</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setUploadedFileInfo(null)
                setFileRules([])
                setImportJsonText('')
                setImportTargetOption('keep')
                setImportCustomRecipient('')
                setImportMode('file')
                setImportOpen(true)
              }}
              className="h-8 gap-1.5 rounded-[6px] text-xs"
            >
              <Upload className="size-3.5" />
              <span>Import</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/settings/templates')}
              className="h-8 gap-1.5 rounded-[6px] text-xs"
            >
              <Sparkles className="size-3.5 text-primary" />
              <span>Template Preset</span>
            </Button>
            <Button
              size="sm"
              onClick={openCreateDialog}
              className="h-8 gap-1.5 rounded-[6px] bg-red-600 text-xs text-white hover:bg-red-700 shadow-xs shadow-red-500/30"
            >
              <Plus className="size-3.5" />
              <span>Baru</span>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <button
          type="button"
          onClick={() => {
            setTargetFilter('all')
            setCurrentPage(1)
          }}
          className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
            targetFilter === 'all'
              ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20 shadow-xs'
              : 'border-border/60 bg-card/40 hover:bg-muted/40'
          }`}
        >
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-muted-foreground">Semua Aturan</span>
            <span className="text-base font-bold text-foreground">{rules.length}</span>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono">Total</Badge>
        </button>

        <button
          type="button"
          onClick={() => {
            setTargetFilter('special')
            setCurrentPage(1)
          }}
          className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
            targetFilter === 'special'
              ? 'border-indigo-500/60 bg-indigo-500/10 ring-1 ring-indigo-500/30 shadow-xs'
              : 'border-border/60 bg-card/40 hover:bg-muted/40'
          }`}
        >
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <PhoneCall className="size-3 text-indigo-500" />
              <span>Nomor Khusus</span>
            </span>
            <span className="text-base font-bold text-foreground">{specialCount}</span>
          </div>
          <Badge variant="outline" className="text-[10px] text-indigo-600 dark:text-indigo-400 border-indigo-500/30 bg-indigo-500/5">
            Target Khusus
          </Badge>
        </button>

        <div
          className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
            targetFilter === 'global'
              ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20 shadow-xs'
              : 'border-border/60 bg-card/40 hover:bg-muted/40'
          }`}
        >
          <button
            type="button"
            onClick={() => {
              setTargetFilter('global')
              setCurrentPage(1)
            }}
            className="flex flex-col flex-1 text-left"
          >
            <span className="text-[11px] font-medium text-muted-foreground">Global</span>
            <span className="text-base font-bold text-foreground">{globalCount}</span>
          </button>
          <div className="flex items-center gap-1.5">
            {globalCount > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setClearGlobalConfirmOpen(true)
                }}
                className="h-6 px-1.5 text-[10px] text-destructive hover:bg-destructive/10 rounded"
                title="Hapus semua aturan global"
              >
                <Trash2 className="size-3" />
                <span>Bersihkan</span>
              </Button>
            ) : (
              <Badge variant="outline" className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                0 Bersih
              </Badge>
            )}
            <Badge variant="outline" className="text-[10px] font-mono">🌐 Semua Kontak</Badge>
          </div>
        </div>
      </div>

      <Card className="border-border/60 bg-card/50 backdrop-blur-md">
        <CardContent className="flex flex-wrap items-center gap-3 p-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="text-muted-foreground absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Cari pemicu atau respons"
              className="h-8 pl-8 text-xs rounded-[6px]"
            />
          </div>
          <Select
            value={targetFilter}
            onValueChange={(val) => {
              setTargetFilter(val as 'all' | 'special' | 'global')
              setCurrentPage(1)
            }}
          >
            <SelectTrigger className="h-8 w-[145px] text-xs rounded-[6px]">
              <SelectValue placeholder="Target" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Target</SelectItem>
              <SelectItem value="special">Nomor Khusus 🎯</SelectItem>
              <SelectItem value="global">Global 🌐</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={scopeFilter}
            onValueChange={(val) => {
              setScopeFilter(val as 'all' | 'private' | 'group')
              setCurrentPage(1)
            }}
          >
            <SelectTrigger className="h-8 w-[120px] text-xs rounded-[6px]">
              <SelectValue placeholder="Cakupan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="private">Pribadi</SelectItem>
              <SelectItem value="group">Grup</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={activeFilter}
            onValueChange={(val) => {
              setActiveFilter(val as 'all' | 'true' | 'false')
              setCurrentPage(1)
            }}
          >
            <SelectTrigger className="h-8 w-[120px] text-xs rounded-[6px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="true">Aktif</SelectItem>
              <SelectItem value="false">Nonaktif</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center rounded-lg border border-border/60 bg-muted/40 p-0.5 sm:ml-auto">
            <Button
              type="button"
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className={`h-7 px-2.5 rounded-[5px] text-xs gap-1.5 transition-all ${
                viewMode === 'grid' ? 'bg-background shadow-xs font-semibold text-foreground' : 'text-muted-foreground'
              }`}
              title="Tampilan Grid"
            >
              <LayoutGrid className="size-3.5" />
              <span>Grid</span>
            </Button>
            <Button
              type="button"
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={`h-7 px-2.5 rounded-[5px] text-xs gap-1.5 transition-all ${
                viewMode === 'list' ? 'bg-background shadow-xs font-semibold text-foreground' : 'text-muted-foreground'
              }`}
              title="Tampilan List"
            >
              <List className="size-3.5" />
              <span>List</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {filteredRules.length === 0 && !isLoading ? (
        <EmptyState
          icon={Bot}
          title="Tidak Ada Aturan"
          hint={
            targetFilter === 'special'
              ? 'Belum ada aturan untuk Nomor Khusus. Klik tombol Baru untuk membuat aturan khusus.'
              : 'Tidak ada aturan balasan otomatis yang sesuai filter.'
          }
          action={
            <Button
              size="sm"
              onClick={openCreateDialog}
              className="h-8 gap-1.5 rounded-[6px] bg-red-600 text-xs text-white hover:bg-red-700 shadow-xs"
            >
              <Plus className="size-3.5" />
              <span>Baru</span>
            </Button>
          }
        />
      ) : (
        <>
          {selectedRuleIds.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-lg border border-primary/40 bg-primary/10 shadow-xs text-xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-xs font-mono">{selectedRuleIds.length}</Badge>
                <span className="font-semibold text-foreground">aturan dipilih dari total {rules.length} aturan</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRuleIds([])}
                  className="h-7 text-xs px-2"
                >
                  Batal
                </Button>
                {selectedRuleIds.length < rules.length && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedRuleIds(rules.map((r) => r.id))}
                    className="h-7 text-xs px-2.5"
                  >
                    Pilih Semua ({rules.length})
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setBulkDeleteConfirmOpen(true)}
                  disabled={bulkDeleteMutation.isPending}
                  className="h-7 text-xs px-2.5 gap-1.5 bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                >
                  <Trash2 className="size-3.5" />
                  <span>Hapus Terpilih ({selectedRuleIds.length})</span>
                </Button>
              </div>
            </div>
          )}

          {viewMode === 'grid' ? (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1 py-0.5 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground font-medium select-none">
                  <Checkbox
                    checked={isAllCurrentPageSelected}
                    onCheckedChange={toggleSelectAllCurrentPage}
                    aria-label="Pilih semua pada halaman ini"
                    className="size-3.5 sm:size-4 rounded-[4px]"
                  />
                  <span>Pilih semua di halaman ini ({paginatedRules.length})</span>
                </label>
                <span className="text-muted-foreground text-[11px] font-mono">
                  Hal {safeCurrentPage} dari {totalPages}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
                {paginatedRules.map((rule) => {
                  const special = isSpecialRule(rule)
                  const isSelected = selectedRuleIds.includes(rule.id)
                  const parsedNumbers = parseRecipientNumbers(rule.recipient_jid)
                  return (
                    <Card
                      key={rule.id}
                      className={`flex flex-col justify-between p-2.5 sm:p-3 rounded-lg sm:rounded-xl border transition-all ${
                        isSelected
                          ? 'border-primary/60 bg-primary/5 ring-1 ring-primary/20 shadow-xs'
                          : 'border-border/60 bg-card/50 hover:border-primary/30 hover:bg-card/80'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSelectRule(rule.id)}
                              aria-label={`Pilih aturan ${rule.id}`}
                              className="size-3.5 sm:size-4 rounded-[4px]"
                            />
                            {special ? (
                              <Badge
                                variant="outline"
                                className="border-indigo-500/40 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 gap-1 text-[10px] px-1.5 py-0 font-medium truncate max-w-[80px] sm:max-w-none"
                              >
                                <PhoneCall className="size-2.5 shrink-0" />
                                <span className="truncate">Khusus{parsedNumbers.length > 0 ? ` (${parsedNumbers.length})` : ''}</span>
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal text-muted-foreground">
                                🌐 Global
                              </Badge>
                            )}
                          </div>
                          <Switch
                            checked={rule.is_active}
                            onCheckedChange={() => toggleMutation.mutate(rule.id)}
                            className="scale-75 sm:scale-90 origin-right data-[state=checked]:bg-red-600 shrink-0"
                          />
                        </div>

                        <div className="space-y-1 mb-2">
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Pemicu</span>
                          <div
                            className="font-mono text-xs font-bold text-foreground bg-muted/50 border border-border/40 rounded-[5px] px-2 py-1 truncate flex items-center justify-between gap-1.5"
                            title={rule.trigger_value}
                          >
                            {(() => {
                              const trigs = parseTriggers(rule.trigger_value)
                              if (trigs.length > 1) {
                                return (
                                  <>
                                    <span className="truncate">"{trigs[0]}"</span>
                                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 shrink-0 font-mono">
                                      +{trigs.length - 1}
                                    </Badge>
                                  </>
                                )
                              }
                              return <span className="truncate">"{trigs[0] || rule.trigger_value}"</span>
                            })()}
                          </div>
                        </div>

                        <div className="space-y-1 mb-2.5">
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Balasan</span>
                          <p
                            className="text-xs text-muted-foreground line-clamp-2 leading-relaxed break-words"
                            title={rule.response_content}
                          >
                            {rule.response_content}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-1 mt-auto">
                        <span className="text-[10px] font-mono text-muted-foreground/80">#{rule.id}</span>
                        <div className="flex items-center gap-0.5 sm:gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-6 sm:size-7 rounded-[5px] text-primary hover:bg-primary/10"
                            onClick={() => openDetailDialog(rule)}
                            title="Lihat Detail & Nomor"
                          >
                            <Eye className="size-3 sm:size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-6 sm:size-7 rounded-[5px] text-muted-foreground hover:text-foreground"
                            onClick={() => openEditDialog(rule)}
                            title="Edit"
                          >
                            <Edit className="size-3 sm:size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-6 sm:size-7 rounded-[5px] text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              if (confirm('Hapus aturan ini?')) {
                                deleteMutation.mutate(rule.id)
                              }
                            }}
                            title="Hapus"
                          >
                            <Trash2 className="size-3 sm:size-3.5" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          ) : (
            <Card className="border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="w-[45px] text-center">
                        <Checkbox
                          checked={isAllCurrentPageSelected}
                          onCheckedChange={toggleSelectAllCurrentPage}
                          aria-label="Pilih semua baris pada halaman ini"
                        />
                      </TableHead>
                      <TableHead className="w-[180px] text-xs font-semibold">Pemicu</TableHead>
                      <TableHead className="text-xs font-semibold">Pesan Balasan</TableHead>
                      <TableHead className="w-[160px] text-xs font-semibold">Target</TableHead>
                      <TableHead className="w-[70px] text-center text-xs font-semibold">Aktif</TableHead>
                      <TableHead className="w-[110px] text-right text-xs font-semibold">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRules.map((rule) => {
                      const special = isSpecialRule(rule)
                      const isSelected = selectedRuleIds.includes(rule.id)
                      const parsedNumbers = parseRecipientNumbers(rule.recipient_jid)
                      return (
                        <TableRow
                          key={rule.id}
                          className={`transition-colors hover:bg-muted/20 ${isSelected ? 'bg-primary/5' : ''}`}
                        >
                          <TableCell className="text-center">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSelectRule(rule.id)}
                              aria-label={`Pilih aturan ${rule.id}`}
                            />
                          </TableCell>

                          <TableCell className="font-mono text-xs font-bold text-foreground max-w-[220px]">
                            {(() => {
                              const trigs = parseTriggers(rule.trigger_value)
                              if (trigs.length > 1) {
                                return (
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="truncate" title={rule.trigger_value}>"{trigs[0]}"</span>
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 shrink-0 font-mono">
                                      +{trigs.length - 1}
                                    </Badge>
                                  </div>
                                )
                              }
                              return (
                                <span className="truncate block" title={rule.trigger_value}>
                                  "{trigs[0] || rule.trigger_value}"
                                </span>
                              )
                            })()}
                          </TableCell>

                          <TableCell className="max-w-[320px] truncate text-xs text-muted-foreground">
                            {rule.response_content}
                          </TableCell>

                          <TableCell>
                            {special ? (
                              <Badge
                                variant="outline"
                                className="border-indigo-500/40 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 gap-1 text-[11px] font-medium"
                              >
                                <PhoneCall className="size-3" />
                                <span>
                                  Nomor Khusus{parsedNumbers.length > 0 ? ` (${parsedNumbers.length})` : ''}
                                </span>
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[11px] font-normal text-muted-foreground">
                                🌐 Global
                              </Badge>
                            )}
                          </TableCell>

                          <TableCell className="text-center">
                            <Switch
                              checked={rule.is_active}
                              onCheckedChange={() => toggleMutation.mutate(rule.id)}
                              className="data-[state=checked]:bg-red-600"
                            />
                          </TableCell>

                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 rounded-[5px] text-primary hover:bg-primary/10"
                                onClick={() => openDetailDialog(rule)}
                                title="Lihat Detail & Nomor"
                              >
                                <Eye className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 rounded-[5px]"
                                onClick={() => openEditDialog(rule)}
                                title="Edit"
                              >
                                <Edit className="size-3.5 text-muted-foreground" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 rounded-[5px] text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                  if (confirm('Hapus aturan ini?')) {
                                    deleteMutation.mutate(rule.id)
                                  }
                                }}
                                title="Hapus"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </>
      )}

      {totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-1 py-1 text-xs">
          <p className="text-muted-foreground text-xs font-mono">
            {startIndex + 1}–{endIndex} / {totalItems}
          </p>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage(1)}
              className="size-7 rounded-[6px]"
              title="Pertama"
            >
              <ChevronsLeft className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="size-7 rounded-[6px]"
              title="Sebelumnya"
            >
              <ChevronLeft className="size-3.5" />
            </Button>

            <div className="flex items-center px-2 py-0.5 rounded-[6px] border bg-muted/30 font-mono text-xs">
              <span className="font-semibold text-foreground">{safeCurrentPage}</span>
              <span className="text-muted-foreground mx-1">/</span>
              <span className="text-muted-foreground">{totalPages}</span>
            </div>

            <Button
              variant="outline"
              size="icon"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="size-7 rounded-[6px]"
              title="Berikutnya"
            >
              <ChevronRight className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="size-7 rounded-[6px]"
              title="Terakhir"
            >
              <ChevronsRight className="size-3.5" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl md:max-w-3xl border-border/80 bg-card/95 backdrop-blur-xl sm:rounded-xl p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-4 sm:p-5 pb-3 border-b bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold tracking-tight flex items-center gap-2">
                  <span>Detail Aturan Balasan</span>
                  {selectedDetailRule && (
                    <Badge
                      variant={selectedDetailRule.is_active ? 'default' : 'secondary'}
                      className={
                        selectedDetailRule.is_active
                          ? 'bg-emerald-600 hover:bg-emerald-600 text-[11px]'
                          : 'text-[11px]'
                      }
                    >
                      {selectedDetailRule.is_active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Spesifikasi pemicu, target penerima, dan pesan balasan WhatsApp.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedDetailRule && (
            <div className="p-4 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              <div className="rounded-lg border bg-muted/30 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
                      isSpecialRule(selectedDetailRule)
                        ? 'bg-amber-500/10 text-amber-500'
                        : isGlobalRule(selectedDetailRule)
                        ? 'bg-primary/10 text-primary'
                        : 'bg-sky-500/10 text-sky-500'
                    }`}
                  >
                    {isSpecialRule(selectedDetailRule) ? (
                      <PhoneCall className="size-5" />
                    ) : (
                      <Bot className="size-5" />
                    )}
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground font-medium">Target Penerima</p>
                    <p className="text-sm font-bold text-foreground">
                      {isSpecialRule(selectedDetailRule)
                        ? `Nomor Khusus (${parseRecipientNumbers(selectedDetailRule.recipient_jid).length} nomor terdaftar)`
                        : 'Global (Semua Kontak & Grup)'}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {isSpecialRule(selectedDetailRule)
                        ? 'Hanya merespon pesan dari nomor-nomor khusus yang terdaftar di bawah.'
                        : 'Merespon pesan dari seluruh nomor kontak dan grup WhatsApp.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono border-primary/30 bg-primary/10 text-primary">
                    Tipe: {selectedDetailRule.trigger_type}
                  </Badge>
                  <Badge variant="outline" className="text-xs capitalize">
                    Cakupan: {selectedDetailRule.scope}
                  </Badge>
                </div>
              </div>

              {isSpecialRule(selectedDetailRule) && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <PhoneCall className="size-3.5 text-indigo-500" />
                      <span>
                        Daftar Nomor WhatsApp Target ({parseRecipientNumbers(selectedDetailRule.recipient_jid).length} Nomor)
                      </span>
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[11px] gap-1 px-2 text-primary hover:bg-primary/10"
                      onClick={() => {
                        const nums = parseRecipientNumbers(selectedDetailRule.recipient_jid).join('\n')
                        void navigator.clipboard.writeText(nums)
                        toast.success('Daftar nomor berhasil disalin!')
                      }}
                    >
                      <Copy className="size-3" />
                      <span>Salin Semua Nomor</span>
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 p-3 rounded-lg border bg-background max-h-40 overflow-y-auto">
                    {parseRecipientNumbers(selectedDetailRule.recipient_jid).map((num, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-foreground font-mono text-[11px] font-semibold border"
                      >
                        <span className="text-indigo-500 text-[10px]">#</span>
                        <span>{num}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Zap className="size-3.5 text-primary" />
                    <span>Daftar Pemicu ({parseTriggers(selectedDetailRule.trigger_value).length})</span>
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[11px] gap-1 px-2 text-primary hover:bg-primary/10"
                    onClick={() => {
                      void navigator.clipboard.writeText(selectedDetailRule.trigger_value)
                      toast.success('Pemicu disalin!')
                    }}
                  >
                    <Copy className="size-3" />
                    <span>Salin</span>
                  </Button>
                </div>
                <div className="flex flex-col gap-1.5 p-3 rounded-lg border bg-background max-h-48 overflow-y-auto">
                  {parseTriggers(selectedDetailRule.trigger_value).map((trig, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 p-2 rounded-md bg-muted/40 border border-border/50 text-xs font-mono font-medium text-foreground"
                    >
                      <span className="text-[10px] font-semibold text-muted-foreground select-none shrink-0 mt-0.5">
                        {idx + 1}.
                      </span>
                      <span className="break-words flex-1 select-text">"{trig}"</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Isi Pesan Balasan ({selectedDetailRule.response_type})
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[11px] gap-1 px-2 text-primary hover:bg-primary/10"
                    onClick={() => copyDetailContent(selectedDetailRule.response_content)}
                  >
                    {hasCopiedDetail ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                    <span>{hasCopiedDetail ? 'Tersalin' : 'Salin'}</span>
                  </Button>
                </div>
                <div className="p-3.5 rounded-lg border bg-muted/20 font-sans text-xs leading-relaxed text-foreground whitespace-pre-wrap select-text">
                  {selectedDetailRule.response_content}
                </div>
              </div>

              {selectedDetailRule.media_url && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">URL Media Lampiran</Label>
                  <div className="p-2.5 rounded-lg border bg-background font-mono text-xs text-primary truncate">
                    {selectedDetailRule.media_url}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="p-4 border-t bg-muted/20 flex flex-row items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDetailOpen(false)}
              className="h-8 text-xs rounded-[6px]"
            >
              Tutup
            </Button>
            {selectedDetailRule && (
              <Button
                size="sm"
                onClick={() => {
                  setDetailOpen(false)
                  openEditDialog(selectedDetailRule)
                }}
                className="h-8 gap-1.5 rounded-[6px] bg-red-600 text-xs text-white hover:bg-red-700 shadow-xs"
              >
                <Edit className="size-3.5" />
                <span>Edit Aturan</span>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl md:max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden border-border/80 bg-card/95 backdrop-blur-xl sm:rounded-xl shadow-2xl">
          <DialogHeader className="p-4 sm:p-5 pb-3 border-b bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold tracking-tight">
                  Import Aturan
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Unggah berkas atau tempel teks aturan.
                </DialogDescription>
              </div>
              <div className="flex items-center gap-1 bg-muted/50 p-0.5 rounded-lg border text-xs">
                <Button
                  type="button"
                  variant={importMode === 'file' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-6 text-[11px] px-2.5 rounded-md"
                  onClick={() => setImportMode('file')}
                >
                  Berkas
                </Button>
                <Button
                  type="button"
                  variant={importMode === 'paste' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-6 text-[11px] px-2.5 rounded-md"
                  onClick={() => setImportMode('paste')}
                >
                  Teks
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="p-4 sm:p-6 space-y-3.5 overflow-y-auto max-h-[60vh] text-xs">
            <input
              type="file"
              ref={fileInputRef}
              accept=".txt,.md,.json"
              className="hidden"
              onChange={handleFileUpload}
            />

            {importMode === 'file' ? (
              uploadedFileInfo ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                        {uploadedFileInfo.name.endsWith('.json') ? (
                          <FileJson className="size-5" />
                        ) : (
                          <FileText className="size-5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-foreground truncate max-w-[280px]">
                          {uploadedFileInfo.name}
                        </p>
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                          {(uploadedFileInfo.size / 1024).toFixed(1)} KB • {uploadedFileInfo.count} aturan siap di-import
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-destructive hover:bg-destructive/10 shrink-0"
                      onClick={() => {
                        setUploadedFileInfo(null)
                        setFileRules([])
                      }}
                    >
                      Ganti
                    </Button>
                  </div>

                  <div className="rounded-lg border bg-muted/20 p-3">
                    <div className="flex items-center justify-between pb-2 border-b text-[11px] font-semibold text-muted-foreground">
                      <span>Pratinjau Data Aturan</span>
                      <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                        {fileRules.length} Total
                      </Badge>
                    </div>
                    <div className="space-y-2 pt-2 max-h-48 overflow-y-auto">
                      {fileRules.slice(0, 5).map((r, i) => (
                        <div key={i} className="flex flex-col gap-1 text-[11px] p-2.5 rounded-lg bg-background border">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 font-mono">
                              <span className="text-[10px] px-1 py-0.5 rounded bg-muted text-muted-foreground font-semibold">
                                {r.trigger_type}
                              </span>
                              <span className="font-semibold text-primary truncate max-w-[200px]">
                                "{r.trigger_value.split('\n')[0]}"
                                {r.trigger_value.split('\n').length > 1 && (
                                  <span className="text-[10px] text-muted-foreground ml-1">
                                    (+{r.trigger_value.split('\n').length - 1} variasi)
                                  </span>
                                )}
                              </span>
                            </div>
                            {r.recipient_jid?.trim() && r.recipient_jid !== 'global' && r.recipient_jid !== 'all' ? (
                              <Badge variant="outline" className="text-[10px] border-indigo-500/40 text-indigo-600 bg-indigo-500/10">
                                Nomor Khusus 🎯
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px]">
                                Global
                              </Badge>
                            )}
                          </div>
                          <p className="text-muted-foreground line-clamp-1 text-[11px]">
                            {r.response_content}
                          </p>
                        </div>
                      ))}
                      {fileRules.length > 5 && (
                        <p className="text-[10px] text-center text-muted-foreground pt-1">
                          + {fileRules.length - 5} aturan lainnya dalam berkas ini
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-border/80 hover:border-primary/50 bg-muted/20 hover:bg-muted/30 cursor-pointer transition-colors text-center"
                >
                  <div className="flex items-center gap-2 mb-2 text-primary/70">
                    <FileText className="size-8" />
                    <FileJson className="size-8" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">Klik untuk memilih berkas (.txt, .md, atau .json)</p>
                  <p className="text-[11px] text-muted-foreground mt-1 max-w-sm">
                    Mendukung format TXT/Markdown (Blok PEMICU & BALASAN) atau berkas JSON tanpa batas ukuran.
                  </p>
                </div>
              )
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Tempel Teks Aturan</Label>
                  <span className="text-[10px] text-muted-foreground">Format TXT/MD atau JSON</span>
                </div>
                <Textarea
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder={`===
PEMICU:
halo
hai
pagi bro
BALASAN:
Halo juga! Ada yang bisa dibantu?
===

atau format JSON array...`}
                  className="h-36 max-h-36 resize-none font-mono text-[11px] rounded-[6px]"
                />
                <span className="text-[11px] text-muted-foreground">
                  {parsePastedData().length > 0
                    ? `${parsePastedData().length} aturan valid terdeteksi`
                    : 'Format: blok PEMICU & BALASAN (TXT/MD) atau JSON array'}
                </span>
              </div>
            )}

            {activeImportRules.length > 0 && (
              <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
                <Label className="text-[11px] font-semibold text-foreground">Target Penerima Aturan yang Diimpor</Label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setImportTargetOption('keep')}
                    className={`px-2 py-1.5 rounded-[5px] text-[11px] font-medium border text-center transition-all ${
                      importTargetOption === 'keep'
                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                        : 'border-border/60 bg-background text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    Sesuai Berkas
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportTargetOption('global')}
                    className={`px-2 py-1.5 rounded-[5px] text-[11px] font-medium border text-center transition-all ${
                      importTargetOption === 'global'
                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                        : 'border-border/60 bg-background text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    Global (Semua)
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportTargetOption('special')}
                    className={`px-2 py-1.5 rounded-[5px] text-[11px] font-medium border text-center transition-all ${
                      importTargetOption === 'special'
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold'
                        : 'border-border/60 bg-background text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    Nomor Khusus
                  </button>
                </div>
                {importTargetOption === 'special' && (
                  <Input
                    value={importCustomRecipient}
                    onChange={(e) => setImportCustomRecipient(e.target.value)}
                    placeholder="Masukkan nomor HP tujuan (misal: 6285216149732)"
                    className="h-8 text-xs rounded-[6px] mt-1.5"
                  />
                )}
              </div>
            )}
          </div>

          <DialogFooter className="p-4 border-t bg-muted/20 flex flex-row items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setImportOpen(false)}
              className="h-8 text-xs rounded-[6px]"
            >
              Batal
            </Button>
            <Button
              size="sm"
              onClick={handleExecuteImport}
              disabled={importMutation.isPending || activeImportRules.length === 0}
              className="h-8 rounded-[6px] bg-red-600 text-xs text-white hover:bg-red-700 shadow-xs"
            >
              {importMutation.isPending ? 'Mengimpor...' : `Import (${activeImportRules.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <AlertDialog open={clearGlobalConfirmOpen} onOpenChange={setClearGlobalConfirmOpen}>
        <AlertDialogContent className="rounded-xl border-border/80 bg-card/95 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="size-5" />
              <span>Bersihkan {globalCount} Aturan Global?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Hapus {globalCount} aturan balasan otomatis global. Aturan nomor khusus tetap aman.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs rounded-[6px]">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => clearGlobalMutation.mutate()}
              disabled={clearGlobalMutation.isPending}
              className="h-8 text-xs rounded-[6px] bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              {clearGlobalMutation.isPending ? 'Membersihkan...' : `Hapus (${globalCount}) Global`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
        <AlertDialogContent className="rounded-xl border-border/80 bg-card/95 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="size-5" />
              <span>Hapus Semua {rules.length} Aturan?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Hapus permanen seluruh {rules.length} aturan balasan otomatis.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs rounded-[6px]">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => clearAllMutation.mutate()}
              disabled={clearAllMutation.isPending}
              className="h-8 text-xs rounded-[6px] bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              {clearAllMutation.isPending ? 'Menghapus Semua...' : `Hapus Semua (${rules.length})`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteConfirmOpen} onOpenChange={setBulkDeleteConfirmOpen}>
        <AlertDialogContent className="rounded-xl border-border/80 bg-card/95 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="size-5" />
              <span>Hapus {selectedRuleIds.length} Aturan?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Hapus {selectedRuleIds.length} aturan terpilih secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs rounded-[6px]">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bulkDeleteMutation.mutate(selectedRuleIds)}
              disabled={bulkDeleteMutation.isPending}
              className="h-8 text-xs rounded-[6px] bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkDeleteMutation.isPending ? 'Menghapus...' : `Hapus (${selectedRuleIds.length})`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
