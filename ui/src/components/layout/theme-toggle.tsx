import { Check, Moon, Palette, Sun, Laptop } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useThemePresetStore, THEME_PRESETS, type ThemePreset } from '@/stores/theme'
import { toast } from 'sonner'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const themePreset = useThemePresetStore((s) => s.themePreset)
  const setThemePreset = useThemePresetStore((s) => s.setThemePreset)

  const handleSelectPreset = (id: ThemePreset, name: string) => {
    setThemePreset(id)
    toast.success(`Tema aktif: ${name}`)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          title="Pengaturan Tema & Warna"
          className="size-8 shrink-0 relative"
        >
          <Sun className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-1.5">
        <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
          Mode Tampilan
        </DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className="flex items-center justify-between text-xs cursor-pointer py-1.5 px-2"
        >
          <span className="flex items-center gap-2">
            <Sun className="size-3.5 text-amber-500" />
            Terang
          </span>
          {theme === 'light' && <Check className="size-3.5 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className="flex items-center justify-between text-xs cursor-pointer py-1.5 px-2"
        >
          <span className="flex items-center gap-2">
            <Moon className="size-3.5 text-indigo-400" />
            Gelap
          </span>
          {theme === 'dark' && <Check className="size-3.5 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className="flex items-center justify-between text-xs cursor-pointer py-1.5 px-2"
        >
          <span className="flex items-center gap-2">
            <Laptop className="size-3.5 text-muted-foreground" />
            Sistem
          </span>
          {theme === 'system' && <Check className="size-3.5 text-primary" />}
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1.5" />

        <DropdownMenuLabel className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
          <Palette className="size-3 text-primary" />
          5 Tema Visual
        </DropdownMenuLabel>
        {THEME_PRESETS.map((p) => {
          const isSelected = themePreset === p.id
          return (
            <DropdownMenuItem
              key={p.id}
              onClick={() => handleSelectPreset(p.id, p.name)}
              className="flex items-center justify-between text-xs cursor-pointer py-1.5 px-2"
            >
              <span className="flex items-center gap-2">
                <span
                  className="size-3 rounded-full shrink-0 shadow-2xs border border-white/20"
                  style={{ background: p.primaryHex }}
                />
                <span className={isSelected ? 'font-semibold text-foreground' : 'text-foreground/90'}>
                  {p.name}
                </span>
              </span>
              {isSelected && <Check className="size-3.5 text-primary" />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
