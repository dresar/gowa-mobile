import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import {
  Check,
  FileText,
  Image as ImageIcon,
  Loader2,
  Music,
  Trash2,
  Upload,
  Video,
} from 'lucide-react'
import { toast } from 'sonner'
import { uploadMedia } from '@/api/media'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export interface FileOrUrl {
  file?: File
  url: string
}

export function FileOrUrlInput({
  label,
  accept,
  value,
  onChange,
}: {
  label: string
  accept?: string
  value: FileOrUrl
  onChange: (value: FileOrUrl) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!value.file) {
      if (fileInputRef.current) fileInputRef.current.value = ''
      setPreviewUrl(null)
      return
    }

    if (value.file.type.startsWith('image/')) {
      const url = URL.createObjectURL(value.file)
      setPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [value.file])

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

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      onChange({ ...value, file: droppedFile })
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      onChange({ ...value, file: selected })
    }
  }

  const handleRemoveFile = () => {
    onChange({ ...value, file: undefined })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleUploadToVPS = async () => {
    if (!value.file) return
    setIsUploading(true)
    try {
      const res = await uploadMedia(value.file)
      onChange({ file: value.file, url: res.file_url })
      toast.success('Berkas berhasil diunggah ke storage VPS!')
    } catch (err: any) {
      toast.error(err?.message || 'Gagal mengunggah berkas ke VPS')
    } finally {
      setIsUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const isMediaImage = (accept && accept.includes('image')) || (value.file && value.file.type.startsWith('image/'))
  const isMediaVideo = (accept && accept.includes('video')) || (value.file && value.file.type.startsWith('video/'))
  const isMediaAudio = (accept && accept.includes('audio')) || (value.file && value.file.type.startsWith('audio/'))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold">{label} — Area Upload / Berkas</Label>
        {value.file && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemoveFile}
            className="text-muted-foreground hover:text-rose-500 h-6 px-1.5 text-[11px] gap-1"
          >
            <Trash2 className="size-3" />
            <span>Hapus Berkas</span>
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

      {value.file ? (
        <div className="border-border/80 bg-card/60 relative flex flex-col gap-2 rounded-xl border p-3">
          <div className="flex items-center gap-3">
            {previewUrl ? (
              <div className="bg-muted/40 relative size-14 shrink-0 overflow-hidden rounded-lg border border-border/70">
                <img src={previewUrl} alt="Pratinjau" className="size-full object-cover" />
              </div>
            ) : (
              <div className="bg-muted/40 flex size-14 shrink-0 items-center justify-center rounded-lg border border-border/70 text-primary">
                {isMediaVideo ? (
                  <Video className="size-6" />
                ) : isMediaAudio ? (
                  <Music className="size-6" />
                ) : isMediaImage ? (
                  <ImageIcon className="size-6" />
                ) : (
                  <FileText className="size-6" />
                )}
              </div>
            )}

            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p className="text-foreground truncate text-xs font-semibold">{value.file.name}</p>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>{formatFileSize(value.file.size)}</span>
                {value.url && (
                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-[10px] gap-1 bg-emerald-500/10 py-0">
                    <Check className="size-2.5" />
                    <span>VPS Tersimpan</span>
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-6 px-2 text-[11px] gap-1 rounded-md"
                >
                  <Upload className="size-3" />
                  <span>Ganti File</span>
                </Button>
                {!value.url && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleUploadToVPS}
                    disabled={isUploading}
                    className="h-6 px-2 text-[11px] gap-1 rounded-md border-primary/40 text-primary hover:bg-primary/10"
                  >
                    {isUploading ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <Upload className="size-3" />
                    )}
                    <span>Simpan ke VPS</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'group relative flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed p-4 text-center transition-all',
            isDragging
              ? 'border-primary bg-primary/10 shadow-sm'
              : 'border-border/80 bg-card/30 hover:border-primary/50 hover:bg-card/60',
          )}
        >
          <div className="border-border/80 bg-background/80 flex size-9 items-center justify-center rounded-full border shadow-2xs group-hover:scale-105 transition-transform">
            <Upload className="size-4 text-primary" />
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-foreground text-xs font-semibold">
              Tarik berkas ke sini, atau <span className="text-primary underline underline-offset-2">pilih berkas</span>
            </p>
            <p className="text-muted-foreground text-[10px]">
              {accept || 'Unggah berkas langsung dari perangkat'}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5 pt-0.5">
        <Label htmlFor="media-url-fallback" className="text-muted-foreground text-[11px]">
          Atau gunakan URL langsung {label.toLowerCase()}:
        </Label>
        <Input
          id="media-url-fallback"
          placeholder="https://example.com/media/berkas.jpg"
          value={value.url}
          onChange={(event) => onChange({ ...value, url: event.target.value })}
          className="h-8 text-xs font-mono"
        />
      </div>
    </div>
  )
}
