import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type ThemePreset = 'emerald' | 'crimson' | 'cyber' | 'amber' | 'indigo'

export interface ThemePresetInfo {
  id: ThemePreset
  name: string
  badge: string
  tagline: string
  description: string
  primaryHex: string
  accentHex: string
  borderHex: string
  gradientCss: string
  bgPreviewClass: string
  radiusLabel: string
}

export const THEME_PRESETS: ThemePresetInfo[] = [
  {
    id: 'emerald',
    name: 'Emerald WhatsApp',
    badge: 'Signature',
    tagline: 'Signature WhatsApp Green & Modern Mint',
    description: 'Nuansa hijau khas WhatsApp modern dipadukan dengan aksen mint segar, card elegan, dan tombol presisi berenergi tinggi.',
    primaryHex: '#10b981',
    accentHex: '#059669',
    borderHex: '#34d399',
    gradientCss: 'linear-gradient(135deg, #059669 0%, #10b981 60%, #34d399 100%)',
    bgPreviewClass: 'from-emerald-950/80 via-teal-950/60 to-zinc-950/90',
    radiusLabel: '10px (Sleek Modern)',
  },
  {
    id: 'crimson',
    name: 'Crimson Glass',
    badge: 'Precision',
    tagline: 'Precision Carmine Rose & Obsidian Glow',
    description: 'Estetika merah karmin presisi dengan obsidian dark glass, kontras tajam, serta ambient glow rose yang berani dan mewah.',
    primaryHex: '#e11d48',
    accentHex: '#f43f5e',
    borderHex: '#fb7185',
    gradientCss: 'linear-gradient(135deg, #be123c 0%, #e11d48 60%, #f43f5e 100%)',
    bgPreviewClass: 'from-rose-950/80 via-red-950/60 to-zinc-950/90',
    radiusLabel: '8px (Sharp Glass)',
  },
  {
    id: 'cyber',
    name: 'Cyber Neon',
    badge: 'Futuristic',
    tagline: 'Electric Cyan, Violet & High-Contrast Cyberpunk',
    description: 'Sentuhan masa depan cyberpunk dengan neon cyan bercahaya, aksen violet elektrik, border berdaya pendar, dan sudut tegas 6px.',
    primaryHex: '#06b6d4',
    accentHex: '#8b5cf6',
    borderHex: '#22d3ee',
    gradientCss: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 50%, #8b5cf6 100%)',
    bgPreviewClass: 'from-cyan-950/80 via-violet-950/60 to-slate-950/95',
    radiusLabel: '6px (Tech Angular)',
  },
  {
    id: 'amber',
    name: 'Sunset Amber',
    badge: 'Warm & Cozy',
    tagline: 'Warm Amber Gold & Radiant Sunset Glow',
    description: 'Kehangatan tembaga espresso dan kilau emas jingga terbenam. Memiliki sudut kartu membulat 14px yang sangat ramah dan menenangkan.',
    primaryHex: '#f59e0b',
    accentHex: '#ea580c',
    borderHex: '#fbbf24',
    gradientCss: 'linear-gradient(135deg, #c2410c 0%, #d97706 50%, #f59e0b 100%)',
    bgPreviewClass: 'from-amber-950/80 via-orange-950/60 to-stone-950/90',
    radiusLabel: '14px (Cozy Curved)',
  },
  {
    id: 'indigo',
    name: 'Royal Indigo',
    badge: 'Enterprise',
    tagline: 'Deep Sapphire Luxury & Crisp Slate Enterprise',
    description: 'Nuansa biru safir kerajaan dan indigo pekat berstandar enterprise global dengan sudut kartu rapi dan tombol safir berwibawa.',
    primaryHex: '#6366f1',
    accentHex: '#3b82f6',
    borderHex: '#818cf8',
    gradientCss: 'linear-gradient(135deg, #4338ca 0%, #6366f1 50%, #3b82f6 100%)',
    bgPreviewClass: 'from-indigo-950/80 via-blue-950/60 to-slate-950/90',
    radiusLabel: '9px (Clean Corporate)',
  },
]

export function applyThemePreset(preset: ThemePreset) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', preset)
    document.documentElement.dataset.theme = preset
  }
}

export function getInitialThemePreset(): ThemePreset {
  if (typeof window === 'undefined') return 'emerald'
  try {
    const raw = localStorage.getItem('gowa-ui.theme-preset.v1')
    if (raw) {
      const parsed = JSON.parse(raw)
      const val = parsed?.state?.themePreset
      if (val && THEME_PRESETS.some((t) => t.id === val)) {
        return val as ThemePreset
      }
    }
  } catch {
    return 'emerald'
  }
  return 'emerald'
}

interface ThemePresetState {
  themePreset: ThemePreset
  setThemePreset: (preset: ThemePreset) => void
}

export const useThemePresetStore = create<ThemePresetState>()(
  persist(
    (set) => ({
      themePreset: 'emerald',
      setThemePreset: (preset: ThemePreset) => {
        applyThemePreset(preset)
        set({ themePreset: preset })
      },
    }),
    {
      name: 'gowa-ui.theme-preset.v1',
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined' && window.localStorage) return window.localStorage
        if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') return localStorage
        const memoryStorage = new Map<string, string>()
        return {
          getItem: (key: string) => memoryStorage.get(key) ?? null,
          setItem: (key: string, value: string) => {
            memoryStorage.set(key, value)
          },
          removeItem: (key: string) => {
            memoryStorage.delete(key)
          },
        }
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.themePreset) {
          applyThemePreset(state.themePreset)
        }
      },
    },
  ),
)
