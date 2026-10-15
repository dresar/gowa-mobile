import { useTheme } from 'next-themes'
import {
  Check,
  Laptop,
  Moon,
  Palette,
  Sparkles,
  Sun,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { InfoHint } from '@/components/ui/info-hint'
import { useThemePresetStore, THEME_PRESETS } from '@/stores/theme'
import { cn } from '@/lib/utils'

export default function SettingsAppearancePage() {
  const { theme, setTheme } = useTheme()
  const themePreset = useThemePresetStore((s) => s.themePreset)
  const setThemePreset = useThemePresetStore((s) => s.setThemePreset)

  return (
    <div className="flex flex-col gap-4">
      <Card className="glass-card rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Sun className="size-4 text-primary" />
            <span>Mode Tampilan</span>
            <InfoHint
              title="Mode Tampilan"
              description="Pilih mode terang, gelap, atau ikuti preferensi sistem."
              items={[
                'Terang: Tampilan dengan kontras terang.',
                'Gelap: Tampilan ramah mata di ruang gelap.',
                'Sistem: Mengikuti pengaturan mode OS perangkat.',
              ]}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2.5 max-w-sm">
            <Button
              variant={theme === 'light' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTheme('light')}
              className="gap-1.5 h-8 text-xs font-medium"
            >
              <Sun className="size-3.5" />
              Terang
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTheme('dark')}
              className="gap-1.5 h-8 text-xs font-medium"
            >
              <Moon className="size-3.5" />
              Gelap
            </Button>
            <Button
              variant={theme === 'system' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTheme('system')}
              className="gap-1.5 h-8 text-xs font-medium"
            >
              <Laptop className="size-3.5" />
              Sistem
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card rounded-xl">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Palette className="size-4 text-primary" />
                <span>5 Tema Visual</span>
                <InfoHint
                  title="Preset Tema Visual"
                  description="Pilihan skema warna dan aksen tombol antarmuka."
                  items={[
                    'Emerald WhatsApp: Hijau khas WhatsApp modern.',
                    'Crimson Glass: Aksen merah elegan dengan efek glass.',
                    'Cyber Neon: Cyan elektrik bernuansa futuristik.',
                    'Sunset Amber: Oranye hangat dan ramah di mata.',
                    'Royal Sapphire: Biru safir premium dan tajam.',
                  ]}
                />
              </CardTitle>
            </div>
            <Badge variant="outline" className="border-primary/40 text-primary w-fit text-[11px] gap-1 px-2.5 py-0.5 font-medium">
              <Sparkles className="size-3" />
              {THEME_PRESETS.find((t) => t.id === themePreset)?.name ?? 'Emerald WhatsApp'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {THEME_PRESETS.map((p) => {
              const isSelected = themePreset === p.id
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    setThemePreset(p.id)
                    toast.success(`Tema ${p.name} aktif`)
                  }}
                  className={cn(
                    'relative flex flex-col justify-between rounded-xl border p-3.5 transition-all duration-200 cursor-pointer overflow-hidden backdrop-blur-md',
                    isSelected
                      ? 'border-primary ring-2 ring-primary/40 bg-card/90 shadow-md shadow-primary/10'
                      : 'border-border/70 bg-card/50 hover:border-primary/50 hover:bg-card/75',
                  )}
                >
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="size-3.5 rounded-full shrink-0 border border-white/20 shadow-2xs"
                          style={{ background: p.primaryHex }}
                        />
                        <span className="text-xs font-bold text-foreground">
                          {p.name}
                        </span>
                      </div>
                      <Badge
                        variant={isSelected ? 'default' : 'secondary'}
                        className="text-[10px] py-0 px-2 font-medium"
                      >
                        {p.badge}
                      </Badge>
                    </div>

                    <p className="text-[11px] font-medium text-foreground/85 leading-snug">
                      {p.tagline}
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      {p.description}
                    </p>

                    <div className="rounded-lg border border-border/60 bg-muted/30 p-2.5 flex flex-col gap-2 mt-1">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>Pratinjau Komponen</span>
                        <span className="font-mono text-[9px]">{p.radiusLabel}</span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          className="h-7 px-2.5 text-[11px] font-medium text-white shadow-xs rounded-md transition-all active:scale-95 flex items-center gap-1 shrink-0"
                          style={{
                            background: p.gradientCss,
                            borderColor: p.borderHex,
                          }}
                        >
                          <span>Tombol</span>
                        </button>
                        <span
                          className="h-7 px-2 text-[10px] font-medium rounded-md border flex items-center justify-center bg-card/60"
                          style={{ borderColor: p.borderHex, color: p.primaryHex }}
                        >
                          Outline
                        </span>
                        <span
                          className="size-2 rounded-full shrink-0 animate-pulse"
                          style={{ background: p.primaryHex }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 mt-2 border-t border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ background: p.accentHex }}
                      />
                      <span className="text-muted-foreground text-[10px] font-mono">{p.primaryHex}</span>
                    </div>
                    {isSelected ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-primary">
                        <Check className="size-3" />
                        Sedang Digunakan
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-muted-foreground hover:text-foreground">
                        Gunakan Tema →
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="size-4 text-primary" />
            <span>Pratinjau Komponen</span>
            <InfoHint
              title="Pratinjau Komponen"
              description="Evaluasi tampilan tombol dan kontrol antarmuka pada tema aktif."
              items={[
                'Uji tombol standar, outline, badge, dan formulir.',
                'Periksa kontras warna aksen terhadap latar belakang.',
              ]}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="glass-card p-3 flex flex-col gap-1.5 rounded-lg border border-border/60">
              <span className="text-xs font-semibold text-foreground">Tombol Standar</span>
              <p className="text-[11px] text-muted-foreground">Status klik dan hover</p>
              <Button size="sm" className="mt-2 w-full text-xs">
                Tombol Utama
              </Button>
            </div>

            <div className="glass-card p-3 flex flex-col gap-1.5 rounded-lg border border-border/60">
              <span className="text-xs font-semibold text-foreground">Tombol Garis Luar</span>
              <p className="text-[11px] text-muted-foreground">Karakter transparan</p>
              <Button variant="outline" size="sm" className="mt-2 w-full text-xs">
                Tombol Outline
              </Button>
            </div>

            <div className="glass-card p-3 flex flex-col gap-1.5 rounded-lg border border-border/60">
              <span className="text-xs font-semibold text-foreground">Tombol Sekunder</span>
              <p className="text-[11px] text-muted-foreground">Pendamping aksi</p>
              <Button variant="secondary" size="sm" className="mt-2 w-full text-xs">
                Sekunder
              </Button>
            </div>

            <div className="glass-card p-3 flex flex-col gap-1.5 rounded-lg border border-border/60">
              <span className="text-xs font-semibold text-foreground">Lencana Tema</span>
              <p className="text-[11px] text-muted-foreground">Indikator status</p>
              <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                <Badge variant="default" className="text-[10px]">Utama</Badge>
                <Badge variant="outline" className="text-[10px]">Outline</Badge>
                <Badge variant="secondary" className="text-[10px]">Sekunder</Badge>
              </div>
            </div>

            <div className="glass-card p-3 flex flex-col gap-1.5 rounded-lg border border-border/60">
              <span className="text-xs font-semibold text-foreground">Bidang Input</span>
              <p className="text-[11px] text-muted-foreground">Pendaran fokus tema</p>
              <Input
                placeholder="Teks"
                defaultValue="Uji input"
                className="mt-2 h-8 text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
