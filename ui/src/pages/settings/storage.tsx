import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Database, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { InfoHint } from '@/components/ui/info-hint'
import { getAppSettings, updateAppSettings } from '@/api/settings'
import { formatBytes } from '@/lib/format'

export default function SettingsStoragePage() {
  const queryClient = useQueryClient()
  const { data: settings, isLoading } = useQuery({
    queryKey: ['app-settings'],
    queryFn: getAppSettings,
  })

  const [maxImageMb, setMaxImageMb] = useState<number>(20)
  const [maxFileMb, setMaxFileMb] = useState<number>(50)
  const [maxVideoMb, setMaxVideoMb] = useState<number>(100)
  const [maxDownloadMb, setMaxDownloadMb] = useState<number>(500)

  useEffect(() => {
    if (settings) {
      setMaxImageMb(Math.round((settings.max_image_size || 20000000) / (1024 * 1024)))
      setMaxFileMb(Math.round((settings.max_file_size || 50000000) / (1024 * 1024)))
      setMaxVideoMb(Math.round((settings.max_video_size || 100000000) / (1024 * 1024)))
      setMaxDownloadMb(Math.round((settings.max_download_size || 500000000) / (1024 * 1024)))
    }
  }, [settings])

  const mutation = useMutation({
    mutationFn: updateAppSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings'] })
      toast.success('Pengaturan disimpan')
    },
    onError: (err: any) => {
      toast.error('Gagal menyimpan: ' + (err?.message || 'Kesalahan sistem'))
    },
  })

  const handleSave = () => {
    mutation.mutate({
      max_image_size: maxImageMb * 1024 * 1024,
      max_file_size: maxFileMb * 1024 * 1024,
      max_video_size: maxVideoMb * 1024 * 1024,
      max_download_size: maxDownloadMb * 1024 * 1024,
    })
  }

  if (isLoading) {
    return <Skeleton className="h-72 w-full rounded-xl" />
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="glass-card rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Database className="size-4 text-primary" />
            <span>Batas Ukuran Media</span>
            <InfoHint
              title="Batas Ukuran Media"
              description="Batas kuota berkas unggah dan unduh dalam Megabyte (MB)."
              items={[
                'Gambar: Maksimal ukuran per foto/gambar.',
                'Berkas: Batas dokumen PDF, ZIP, dan dokumen umum.',
                'Video: Batas ukuran file video kiriman.',
                'Unduh Otomatis: Batas maksimal media otomatis diunduh ke server.',
              ]}
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="border-border/50 bg-muted/20 flex flex-col gap-2 rounded-lg border p-3">
              <Label htmlFor="max-img" className="text-xs font-medium">
                Batas Gambar
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="max-img"
                  type="number"
                  value={maxImageMb}
                  onChange={(e) => setMaxImageMb(Number(e.target.value))}
                  className="font-mono text-xs"
                />
                <span className="font-semibold text-muted-foreground text-xs">MB</span>
              </div>
              <span className="text-muted-foreground/80 text-[10px]">
                {formatBytes(maxImageMb * 1024 * 1024)}
              </span>
            </div>

            <div className="border-border/50 bg-muted/20 flex flex-col gap-2 rounded-lg border p-3">
              <Label htmlFor="max-doc" className="text-xs font-medium">
                Batas Berkas
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="max-doc"
                  type="number"
                  value={maxFileMb}
                  onChange={(e) => setMaxFileMb(Number(e.target.value))}
                  className="font-mono text-xs"
                />
                <span className="font-semibold text-muted-foreground text-xs">MB</span>
              </div>
              <span className="text-muted-foreground/80 text-[10px]">
                {formatBytes(maxFileMb * 1024 * 1024)}
              </span>
            </div>

            <div className="border-border/50 bg-muted/20 flex flex-col gap-2 rounded-lg border p-3">
              <Label htmlFor="max-vid" className="text-xs font-medium">
                Batas Video
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="max-vid"
                  type="number"
                  value={maxVideoMb}
                  onChange={(e) => setMaxVideoMb(Number(e.target.value))}
                  className="font-mono text-xs"
                />
                <span className="font-semibold text-muted-foreground text-xs">MB</span>
              </div>
              <span className="text-muted-foreground/80 text-[10px]">
                {formatBytes(maxVideoMb * 1024 * 1024)}
              </span>
            </div>

            <div className="border-border/50 bg-muted/20 flex flex-col gap-2 rounded-lg border p-3">
              <Label htmlFor="max-dl" className="text-xs font-medium">
                Batas Buffer Unduhan
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="max-dl"
                  type="number"
                  value={maxDownloadMb}
                  onChange={(e) => setMaxDownloadMb(Number(e.target.value))}
                  className="font-mono text-xs"
                />
                <span className="font-semibold text-muted-foreground text-xs">MB</span>
              </div>
              <span className="text-muted-foreground/80 text-[10px]">
                {formatBytes(maxDownloadMb * 1024 * 1024)}
              </span>
            </div>
          </div>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={mutation.isPending}
            className="self-start h-8 text-xs gap-1.5"
          >
            <Save className="size-3.5" />
            {mutation.isPending ? 'Menyimpan…' : 'Simpan Perubahan'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
