import { describe, expect, it } from 'vitest'
import {
  exportRulesToText,
  isGlobalRule,
  isSpecialRule,
  parseAnyRules,
  parseRecipientNumbers,
  parseTextOrMarkdownRules,
  parseTriggers,
} from './bot-auto-replies'
import type { BotRule } from '@/api/bot'

describe('bot-auto-replies parser & utilities', () => {
  it('parses multi-line triggers into clean array', () => {
    const raw = 'halo\n  hai  \n\nselamat pagi\r\n'
    expect(parseTriggers(raw)).toEqual(['halo', 'hai', 'selamat pagi'])
    expect(parseTriggers('')).toEqual([])
  })

  it('parses recipient numbers cleanly', () => {
    expect(parseRecipientNumbers('6285216149732, 628123456789')).toEqual([
      '6285216149732',
      '628123456789',
    ])
    expect(parseRecipientNumbers('all')).toEqual([])
    expect(parseRecipientNumbers('global')).toEqual([])
    expect(parseRecipientNumbers('')).toEqual([])
  })

  it('determines if rule is special or global correctly', () => {
    const specialRule = {
      id: 1,
      recipient_jid: '6285216149732@s.whatsapp.net',
    } as BotRule
    const globalRule1 = { id: 2, recipient_jid: '' } as BotRule
    const globalRule2 = { id: 3, recipient_jid: 'all' } as BotRule
    const globalRule3 = { id: 4, recipient_jid: 'global' } as BotRule

    expect(isSpecialRule(specialRule)).toBe(true)
    expect(isGlobalRule(specialRule)).toBe(false)

    expect(isSpecialRule(globalRule1)).toBe(false)
    expect(isGlobalRule(globalRule1)).toBe(true)

    expect(isSpecialRule(globalRule2)).toBe(false)
    expect(isGlobalRule(globalRule2)).toBe(true)

    expect(isSpecialRule(globalRule3)).toBe(false)
    expect(isGlobalRule(globalRule3)).toBe(true)
  })

  it('parses standard TXT blocks with === dividers', () => {
    const text = `
===
PEMICU:
pagi
selamat pagi
pagi bro
BALASAN:
Selamat pagi juga! Semoga harimu menyenangkan.
===
===
PEMICU:
makasih
terima kasih
BALASAN:
Sama-sama ya!
===
`
    const rules = parseTextOrMarkdownRules(text)
    expect(rules).toHaveLength(2)
    expect(rules[0].trigger_value).toBe('pagi\nselamat pagi\npagi bro')
    expect(rules[0].response_content).toBe('Selamat pagi juga! Semoga harimu menyenangkan.')
    expect(rules[0].trigger_type).toBe('contains')
    expect(rules[1].trigger_value).toBe('makasih\nterima kasih')
    expect(rules[1].response_content).toBe('Sama-sama ya!')
  })

  it('parses markdown format with bullet points and headers', () => {
    const md = `
### Pemicu
- apa kabar
- kabar apa
* kbr gmna

### Balasan
Alhamdulillah kabar baik! Kamu gimana?

---

### Pemicu:
1. info harga
2. pricelist

### Balasan:
Paket mulai Rp 50.000 ya Kak.
`
    const rules = parseTextOrMarkdownRules(md)
    expect(rules).toHaveLength(2)
    expect(rules[0].trigger_value).toBe('apa kabar\nkabar apa\nkbr gmna')
    expect(rules[0].response_content).toBe('Alhamdulillah kabar baik! Kamu gimana?')
    expect(rules[1].trigger_value).toBe('info harga\npricelist')
    expect(rules[1].response_content).toBe('Paket mulai Rp 50.000 ya Kak.')
  })

  it('extracts TARGET/JID if present in text block', () => {
    const text = `
===
TARGET: 6285216149732@s.whatsapp.net
PEMICU:
kamu lagi apa
lagi ngapain
BALASAN:
Lagi mikirin kamu nih sayang.
===
`
    const rules = parseTextOrMarkdownRules(text)
    expect(rules).toHaveLength(1)
    expect(rules[0].recipient_jid).toBe('6285216149732@s.whatsapp.net')
    expect(rules[0].trigger_value).toBe('kamu lagi apa\nlagi ngapain')
    expect(rules[0].response_content).toBe('Lagi mikirin kamu nih sayang.')
  })

  it('parseAnyRules handles both JSON and TXT format seamlessly', () => {
    const jsonStr = JSON.stringify([
      {
        trigger_type: 'contains',
        trigger_value: 'promo',
        response_content: 'Promo diskon 20%',
      },
    ])
    const parsedFromJson = parseAnyRules(jsonStr)
    expect(parsedFromJson).toHaveLength(1)
    expect(parsedFromJson[0].trigger_value).toBe('promo')

    const txtStr = `
===
PEMICU:
promo
diskon
BALASAN:
Promo diskon 20%
===
`
    const parsedFromTxt = parseAnyRules(txtStr)
    expect(parsedFromTxt).toHaveLength(1)
    expect(parsedFromTxt[0].trigger_value).toBe('promo\ndiskon')
  })

  it('exports rules into clean round-trip TXT format', () => {
    const sampleRules: BotRule[] = [
      {
        id: 1,
        trigger_type: 'contains',
        trigger_value: 'halo\nhai',
        recipient_jid: '6285216149732',
        scope: 'all',
        response_type: 'text',
        response_content: 'Hai sayang!',
        media_url: '',
        is_active: true,
        created_at: '',
        updated_at: '',
      },
      {
        id: 2,
        trigger_type: 'contains',
        trigger_value: 'pagi\nmet pagi',
        recipient_jid: '',
        scope: 'all',
        response_type: 'text',
        response_content: 'Selamat pagi dunia!',
        media_url: '',
        is_active: true,
        created_at: '',
        updated_at: '',
      },
    ]

    const textOutput = exportRulesToText(sampleRules)
    expect(textOutput).toContain('TARGET: 6285216149732')
    expect(textOutput).toContain('PEMICU:\nhalo\nhai')
    expect(textOutput).toContain('BALASAN:\nHai sayang!')
    expect(textOutput).toContain('BALASAN:\nSelamat pagi dunia!')

    const reimported = parseTextOrMarkdownRules(textOutput)
    expect(reimported).toHaveLength(2)
    expect(reimported[0].recipient_jid).toBe('6285216149732')
    expect(reimported[0].trigger_value).toBe('halo\nhai')
    expect(reimported[0].response_content).toBe('Hai sayang!')
    expect(reimported[1].recipient_jid).toBeUndefined()
    expect(reimported[1].trigger_value).toBe('pagi\nmet pagi')
    expect(reimported[1].response_content).toBe('Selamat pagi dunia!')
  })
})
