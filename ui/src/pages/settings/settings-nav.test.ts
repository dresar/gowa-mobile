import { describe, expect, it } from 'vitest'
import { settingsNavItems } from '@/pages/settings/settings-layout'

describe('settingsNavItems', () => {
  it('defines exactly the 10 required settings sub-routes', () => {
    const paths = settingsNavItems.map((item) => item.to)
    expect(paths).toEqual([
      '/settings/general',
      '/settings/api-keys',
      '/settings/webhook',
      '/settings/ai',
      '/settings/chatwoot',
      '/settings/storage',
      '/settings/security',
      '/settings/diagnostics',
      '/settings/appearance',
      '/settings/auto-reply-templates',
    ])
  })

  it('provides non-empty labels and short labels for every sub-menu', () => {
    for (const item of settingsNavItems) {
      expect(item.label.trim().length).toBeGreaterThan(0)
      expect(item.shortLabel.trim().length).toBeGreaterThan(0)
      expect(item.icon).toBeDefined()
    }
  })
})
