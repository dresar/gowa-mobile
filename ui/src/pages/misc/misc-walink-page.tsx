import { useState } from 'react'
import { Copy, Download, ExternalLink, QrCode } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function MiscWalinkPage() {
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [showQr, setShowQr] = useState(false)

  const cleanPhone = phone.replace(/[^0-9]/g, '')
  const generatedWaLink = cleanPhone
    ? `https://wa.me/${cleanPhone}${message ? `?text=${encodeURIComponent(message)}` : ''}`
    : ''

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} disalin ke papan klip`)
  }

  const handleDownloadQr = () => {
    if (!generatedWaLink) return
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(
      generatedWaLink,
    )}`
    window.open(qrUrl, '_blank')
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <PageHeader
        title="Tautan & QR WhatsApp"
        description="Buat tautan wa.me dan kode QR interaktif untuk memulai percakapan langsung. Masukkan nomor tujuan serta draf teks pesan awal."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass-card rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <ExternalLink className="size-4 text-primary" />
              Generator Tautan wa.me
            </CardTitle>
            <CardDescription className="text-xs">
              Hasilkan URL resmi WhatsApp dengan teks pesan awal otomatis.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-xs">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="walink-phone" className="text-xs">
                Nomor Tujuan WhatsApp
              </Label>
              <Input
                id="walink-phone"
                placeholder="6281234567890 (kode negara tanpa +)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="text-xs font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="walink-message" className="text-xs">
                Draf Pesan Otomatis (Opsional)
              </Label>
              <Textarea
                id="walink-message"
                placeholder="Halo, saya ingin bertanya seputar layanan Anda…"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="text-xs resize-none"
              />
            </div>

            {generatedWaLink && (
              <div className="border-border/60 bg-muted/20 flex flex-col gap-2 rounded-xl border p-3 mt-1">
                <span className="font-semibold text-foreground">Hasil Tautan:</span>
                <p className="font-mono text-primary text-[11px] break-all select-all bg-background/50 p-2 rounded border border-border/40">
                  {generatedWaLink}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    onClick={() => copyToClipboard(generatedWaLink, 'Tautan wa.me')}
                    className="h-7 text-xs gap-1"
                  >
                    <Copy className="size-3" />
                    Salin Tautan
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(generatedWaLink, '_blank')}
                    className="h-7 text-xs gap-1"
                  >
                    <ExternalLink className="size-3" />
                    Buka Langsung
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowQr(!showQr)}
                    className="h-7 text-xs gap-1"
                  >
                    <QrCode className="size-3" />
                    {showQr ? 'Sembunyikan QR' : 'Tampilkan QR'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {generatedWaLink && showQr && (
          <Card className="glass-card rounded-xl flex flex-col items-center justify-center p-6 text-center gap-4">
            <div className="bg-white p-3 rounded-2xl shadow-md border">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
                  generatedWaLink,
                )}`}
                alt="QR Code WA Link"
                className="size-48 rounded"
              />
            </div>
            <div className="flex flex-col gap-1">
              <p className="font-semibold text-foreground text-sm">Kode QR Siap Dipindai</p>
              <p className="text-muted-foreground text-xs">
                Pindai dengan kamera ponsel untuk langsung membuka obrolan WhatsApp.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={handleDownloadQr} className="h-8 text-xs gap-1.5">
              <Download className="size-3.5" />
              Unduh Gambar QR
            </Button>
          </Card>
        )}
      </div>
    </div>
  )
}
