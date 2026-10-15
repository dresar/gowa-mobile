import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { Check, Copy, FileText, Loader2, Music, Trash2, Upload, Video } from 'lucide-react'
import { toast } from 'sonner'
import { uploadMedia } from '@/api/media'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface MediaUploadAreaProps {
  value: string
  onChange: (url: string) => void
  label?: string
  accept?: string
}

export function MediaUploadArea({
  value,
  onChange,
  label = 'Media / Gambar Balasan',
  accept = 'image/*,video/*,audio/*,application/pdf',
}: MediaUploadAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleFileUpload = async (file: File) => {
    if (!file) return
    setIsUploading(true)
    try {
      const res = await uploadMedia(file)
      onChange(res.file_url)
      toast.success('Media berhasil diunggah ke storage VPS!')
    } catch (err: any) {
      toast.error(err?.message || 'Gagal mengunggah file ke server')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      await handleFileUpload(file)
    }
  }

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await handleFileUpload(file)
    }
  }

  const handleCopyUrl = async () => {
    if (!value) return
    await navigator.clipboard.writeText(value)
    setCopied(true)
    toast.success('URL media disalin')
    setTimeout(() => setCopied(false), 2000)
  }

  const isImage = value && (
    value.match(/\.(jpeg|jpg|gif|png|webp|svg|jfif)(\?.*)?$/i) ||
    value.includes('image')
  )
  const isVideo = value && value.match(/\.(mp4|webm|mov|mkv)(\?.*)?$/i)
  const isAudio = value && value.match(/\.(mp3|ogg|wav|m4a|aac)(\?.*)?$/i)

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold">{label}</Label>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange('')}
            className="text-muted-foreground hover:text-rose-500 h-6 px-1.5 text-[11px] gap-1"
          >
            <Trash2 className="size-3" />
            <span>Hapus Media</span>
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {value ? (
        <div className="border-border/80 bg-card/60 relative flex flex-col gap-2.5 rounded-xl border p-3">
          <div className="flex items-center gap-3">
            {isImage ? (
              <div className="bg-muted/40 relative size-16 shrink-0 overflow-hidden rounded-lg border border-border/70">
                <img
                  src={value}
                  alt="Preview"
                  className="size-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none'
                  }}
                />
              </div>
            ) : isVideo ? (
              <div className="bg-muted/40 flex size-16 shrink-0 items-center justify-center rounded-lg border border-border/70 text-primary">
                <Video className="size-8" />
              </div>
            ) : isAudio ? (
              <div className="bg-muted/40 flex size-16 shrink-0 items-center justify-center rounded-lg border border-border/70 text-primary">
                <Music className="size-8" />
              </div>
            ) : (
              <div className="bg-muted/40 flex size-16 shrink-0 items-center justify-center rounded-lg border border-border/70 text-primary">
                <FileText className="size-8" />
              </div>
            )}

            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-muted-foreground text-[11px] font-medium">URL Media Aktif:</span>
              <p className="text-foreground truncate font-mono text-xs">{value}</p>
              <div className="flex items-center gap-2 pt-0.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyUrl}
                  className="h-6 px-2 text-[11px] gap-1 rounded-md"
                >
                  {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                  <span>{copied ? 'Tersalin' : 'Salin URL'}</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="h-6 px-2 text-[11px] gap-1 rounded-md"
                >
                  <Upload className="size-3" />
                  <span>Ganti File</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={cn(
            'group relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-5 text-center transition-all',
            isDragging
              ? 'border-primary bg-primary/10 shadow-sm'
              : 'border-border/80 bg-card/30 hover:border-primary/50 hover:bg-card/60',
            isUploading && 'pointer-events-none opacity-70',
          )}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <Loader2 className="size-7 animate-spin text-primary" />
              <p className="text-foreground text-xs font-medium">Mengunggah ke storage VPS…</p>
              <p className="text-muted-foreground text-[10px]">Menyimpan file secara permanen di server</p>
            </div>
          ) : (
            <>
              <div className="border-border/80 bg-background/80 flex size-10 items-center justify-center rounded-full border shadow-2xs group-hover:scale-105 transition-transform">
                <Upload className="size-5 text-primary" />
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="text-foreground text-xs font-semibold">
                  Tarik file ke sini, atau <span className="text-primary underline underline-offset-2">pilih file</span>
                </p>
                <p className="text-muted-foreground text-[11px]">
                  Gambar, Video, Audio, Dokumen disimpan di storage VPS
                </p>
              </div>
            </>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1 pt-1">
        <Label htmlFor="media-url-input" className="text-muted-foreground text-[11px]">
          Atau masukkan tautan URL media eksternal secara langsung:
        </Label>
        <Input
          id="media-url-input"
          type="url"
          placeholder="https://domain.com/path/gambar.jpg"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 text-xs font-mono"
        />
      </div>
    </div>
  )
}
