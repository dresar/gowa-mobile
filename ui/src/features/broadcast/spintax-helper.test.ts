import { describe, expect, it } from 'vitest'
import { cleanPhone, evaluateSpintaxClient, sanitizePhoneList } from './spintax-helper'

describe('spintax-helper', () => {
  it('evaluates spintax options properly', () => {
    const template = '{Halo|Hai} {Kak|Bapak}'
    for (let i = 0; i < 20; i++) {
      const res = evaluateSpintaxClient(template)
      const parts = res.split(' ')
      expect(parts).toHaveLength(2)
      expect(['Halo', 'Hai']).toContain(parts[0])
      expect(['Kak', 'Bapak']).toContain(parts[1])
    }
  })

  it('preserves non-spintax text', () => {
    const text = 'Halo Dunia!'
    expect(evaluateSpintaxClient(text)).toBe(text)
  })

  it('handles nested spintax correctly', () => {
    const template = '{A|{B|C}}'
    for (let i = 0; i < 20; i++) {
      const res = evaluateSpintaxClient(template)
      expect(['A', 'B', 'C']).toContain(res)
    }
  })

  it('normalizes local 08xx phone to international 628xx format', () => {
    expect(cleanPhone('08123456789')).toBe('628123456789')
    expect(cleanPhone('+62 812-3456-7890')).toBe('6281234567890')
    expect(cleanPhone('00628123456789')).toBe('628123456789')
    expect(cleanPhone('6285712345678@s.whatsapp.net')).toBe('6285712345678')
  })

  it('sanitizes multi-line phone numbers and removes duplicates', () => {
    const raw = `
      phone,name
      08123456789, Budi
      628123456789, Budi Duplicate
      +62 857-1111-2222, Siti
      1234
    `
    const { phones, duplicates, invalid } = sanitizePhoneList(raw)
    expect(phones).toHaveLength(2)
    expect(phones[0].phone).toBe('628123456789')
    expect(phones[0].name).toBe('Budi')
    expect(phones[1].phone).toBe('6285711112222')
    expect(phones[1].name).toBe('Siti')
    expect(duplicates).toBe(1)
    expect(invalid).toBe(1)
  })

  it('parses vCard (.vcf) formatted contacts', () => {
    const vcf = `
BEGIN:VCARD
VERSION:3.0
FN:Agus Setiawan
TEL;TYPE=CELL:+62 812-9988-7766
END:VCARD
BEGIN:VCARD
VERSION:3.0
FN:Dewi Lestari
TEL;TYPE=CELL:085612345678
END:VCARD
    `
    const { phones, duplicates, invalid } = sanitizePhoneList(vcf)
    expect(phones).toHaveLength(2)
    expect(phones[0].phone).toBe('6281299887766')
    expect(phones[0].name).toBe('Agus Setiawan')
    expect(phones[1].phone).toBe('6285612345678')
    expect(phones[1].name).toBe('Dewi Lestari')
    expect(duplicates).toBe(0)
    expect(invalid).toBe(0)
  })
})
