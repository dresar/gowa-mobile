import { beforeEach, describe, expect, it } from 'vitest'
import {
  useThemePresetStore,
  THEME_PRESETS,
  applyThemePreset,
  getInitialThemePreset,
} from './theme'

describe('theme preset store', () => {
  beforeEach(() => {
    useThemePresetStore.setState({ themePreset: 'emerald' })
    if (typeof document !== 'undefined') {
      document.documentElement.removeAttribute('data-theme')
    }
  })

  it('contains exactly 5 distinct theme presets', () => {
    expect(THEME_PRESETS).toHaveLength(5)
    const ids = THEME_PRESETS.map((t) => t.id)
    expect(ids).toEqual(['emerald', 'crimson', 'cyber', 'amber', 'indigo'])
  })

  it('sets theme preset and updates data-theme attribute', () => {
    const { setThemePreset } = useThemePresetStore.getState()
    setThemePreset('cyber')
    expect(useThemePresetStore.getState().themePreset).toBe('cyber')
    if (typeof document !== 'undefined') {
      expect(document.documentElement.getAttribute('data-theme')).toBe('cyber')
    }
  })

  it('applies theme preset directly', () => {
    applyThemePreset('amber')
    if (typeof document !== 'undefined') {
      expect(document.documentElement.getAttribute('data-theme')).toBe('amber')
    }
  })

  it('defaults to emerald when local storage is empty', () => {
    expect(getInitialThemePreset()).toBe('emerald')
  })
})
