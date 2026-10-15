import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Check,
  Copy,
  Search,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  BOT_FEATURES,
  type BotCategory,
} from '@/lib/bot-features-data'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function BotMenuPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<BotCategory>('all')
  const [search, setSearch] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyText = (text: string, id: string) => {
    void navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success('Disalin')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const filteredFeatures = useMemo(() => {
    return BOT_FEATURES.filter((item) => {
      const matchCategory = filter === 'all' || item.category === filter
      const matchSearch =
        !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.command.toLowerCase().includes(search.toLowerCase()) ||
        item.provider.toLowerCase().includes(search.toLowerCase()) ||
        item.shortDesc.toLowerCase().includes(search.toLowerCase())
      return matchCategory && matchSearch
    })
  }, [filter, search])

  const categories: { label: string; value: BotCategory }[] = [
    { label: 'Semua', value: 'all' },
    { label: 'AI & Memori', value: 'AI & Memori' },
    { label: 'Produktivitas', value: 'Produktivitas' },
    { label: 'Hiburan', value: 'Edukasi & Hiburan' },
    { label: 'Utilitas', value: 'Utilitas' },
    { label: 'Grup', value: 'Grup' },
    { label: 'Sistem', value: 'Sistem' },
  ]

  return (
    <div className="flex flex-col gap-3.5">
      <PageHeader
        title="Menu Bot"
        actions={
          <Badge
            variant="outline"
            className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs gap-1 py-0.5 px-2 rounded-[5px]"
          >
            <Sparkles className="size-3" />
            <span>{BOT_FEATURES.length} Fitur</span>
          </Badge>
        }
      />

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Cari"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs rounded-md"
          />
        </div>

        <div className="w-full sm:hidden">
          <Select value={filter} onValueChange={(val) => setFilter(val as BotCategory)}>
            <SelectTrigger className="h-9 w-full text-xs" aria-label="Kategori perintah">
              <SelectValue placeholder="Pilih kategori" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.value} value={c.value} className="text-xs">
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="hidden sm:flex flex-wrap items-center gap-1.5 bg-muted/40 p-1 rounded-lg border">
          {categories.map((c) => (
            <Button
              key={c.value}
              variant={filter === c.value ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter(c.value)}
              className={`h-7 px-2.5 text-xs rounded-md transition-all ${
                filter === c.value
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {c.label}
            </Button>
          ))}
        </div>
      </div>

      {filteredFeatures.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed bg-card/40">
          <p className="text-sm font-semibold text-foreground">Tidak ada fitur ditemukan</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch('')
              setFilter('all')
            }}
            className="mt-3 h-8 text-xs rounded-md"
          >
            Reset
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
          {filteredFeatures.map((item) => {
            const Icon = item.icon
            const isCopied = copiedId === item.id

            return (
              <Card
                key={item.id}
                onClick={() => navigate('/bot/menu/' + item.id)}
                className="card-lift flex flex-col justify-between border-border/70 bg-card/60 backdrop-blur-xl shadow-xs transition-all hover:border-primary/40 cursor-pointer overflow-hidden rounded-xl"
              >
                <CardHeader className="p-2.5 sm:p-4 pb-1 sm:pb-2">
                  <div className="flex items-start justify-between gap-1.5 sm:gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="size-7 sm:size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                        <Icon className="size-3.5 sm:size-4.5" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-xs sm:text-sm font-bold text-foreground truncate">
                          {item.name}
                        </CardTitle>
                        <span className="text-[9px] sm:text-[10px] text-muted-foreground font-mono">
                          {item.category}
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="hidden sm:inline-flex text-[10px] py-0 px-1.5 font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5 shrink-0"
                    >
                      {item.provider.includes('Gratis') ? 'Gratis' : 'Aktif'}
                    </Badge>
                  </div>

                  <div className="mt-2 sm:mt-3 flex items-center justify-between rounded-md bg-muted/60 px-1.5 sm:px-2 py-0.5 sm:py-1 border border-border/50">
                    <code className="text-[11px] sm:text-xs font-mono font-semibold text-primary truncate">
                      {item.command}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-5 sm:size-6 text-muted-foreground hover:text-foreground shrink-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        copyText(item.command, item.id)
                      }}
                      title="Salin"
                    >
                      {isCopied ? (
                        <Check className="size-3 text-emerald-500" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-2.5 sm:p-4 pt-0 pb-2 sm:pb-3 flex-1">
                  <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {item.shortDesc}
                  </p>

                  <div className="mt-2 sm:mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 text-[10px] sm:text-[11px] pt-1.5 sm:pt-2 border-t border-border/40">
                    <div>
                      <span className="text-muted-foreground block text-[9px] sm:text-[10px]">
                        Provider
                      </span>
                      <span className="font-medium text-foreground truncate block">
                        {item.provider}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[9px] sm:text-[10px]">
                        Respon
                      </span>
                      <span className="font-medium text-foreground truncate block">
                        {item.latency}
                      </span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="p-2 sm:p-4 pt-1.5 sm:pt-2 border-t flex items-center justify-between gap-1.5 sm:gap-2 bg-muted/20">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6.5 sm:h-7 text-[11px] sm:text-xs px-2 sm:px-2.5 rounded-md flex-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      copyText(item.command, item.id)
                    }}
                  >
                    {isCopied ? 'Tersalin' : 'Salin'}
                  </Button>
                  <Button
                    size="sm"
                    className="h-6.5 sm:h-7 text-[11px] sm:text-xs px-2 sm:px-2.5 rounded-md flex-1 bg-red-600 hover:bg-red-700 text-white"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate('/bot/menu/' + item.id)
                    }}
                  >
                    Detail
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
