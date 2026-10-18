export function evaluateSpintaxClient(template: string): string {
  const pattern = /\{([^{}]*\|[^{}]*)\}/
  let result = template
  let maxLoop = 50
  while (pattern.test(result) && maxLoop > 0) {
    result = result.replace(pattern, (_, match) => {
      const parts = match.split('|')
      const chosen = parts[Math.floor(Math.random() * parts.length)]
      return chosen
    })
    maxLoop--
  }
  return result
}

export function cleanPhone(raw: string): string {
  const noJid = raw.trim().split('@')[0]
  let digits = noJid.replace(/\D/g, '')
  if (digits.startsWith('00')) {
    digits = digits.slice(2)
  }
  if (digits.startsWith('0')) {
    digits = '62' + digits.slice(1)
  }
  return digits
}

export function parseVCardContacts(raw: string): { phone: string; name?: string }[] {
  const cards = raw.split(/END:VCARD/i)
  const results: { phone: string; name?: string }[] = []
  for (const card of cards) {
    if (!card.toUpperCase().includes('BEGIN:VCARD')) continue
    let name: string | undefined
    const fnMatch = card.match(/FN(?:;[^:]*)?:([^\r\n]+)/i)
    if (fnMatch) {
      name = fnMatch[1].trim()
    } else {
      const nMatch = card.match(/N(?:;[^:]*)?:([^\r\n]+)/i)
      if (nMatch) {
        name = nMatch[1].replace(/;/g, ' ').trim()
      }
    }
    const telMatches = card.matchAll(/TEL(?:;[^:]*)?:([^\r\n]+)/gi)
    for (const tm of telMatches) {
      const p = cleanPhone(tm[1])
      if (p.length >= 8) {
        results.push({ phone: p, name })
      }
    }
  }
  return results
}

export function sanitizePhoneList(raw: string): {
  phones: { phone: string; name?: string; var1?: string; var2?: string }[]
  duplicates: number
  invalid: number
} {
  const seen = new Set<string>()
  const valid: { phone: string; name?: string; var1?: string; var2?: string }[] = []
  let duplicates = 0
  let invalid = 0

  if (raw.toUpperCase().includes('BEGIN:VCARD')) {
    const vcardItems = parseVCardContacts(raw)
    for (const item of vcardItems) {
      if (seen.has(item.phone)) {
        duplicates++
        continue
      }
      seen.add(item.phone)
      valid.push({
        phone: item.phone,
        name: item.name,
      })
    }
    return { phones: valid, duplicates, invalid: 0 }
  }

  const lines = raw.split(/[\r\n]+/)
  const headerPattern = /^(phone|nomor|telepon|mobile|contact|msisdn|telp|number|no)$/i

  let isFirstNonEmpty = true
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    if (!trimmed) continue

    const parts = trimmed.split(/[,;\t]+/).map((p) => p.trim())
    const rawPhone = parts[0] || ''

    if (isFirstNonEmpty) {
      isFirstNonEmpty = false
      if (headerPattern.test(rawPhone)) {
        continue
      }
    }

    const phone = cleanPhone(rawPhone)

    if (phone.length < 8) {
      invalid++
      continue
    }

    if (seen.has(phone)) {
      duplicates++
      continue
    }

    seen.add(phone)
    valid.push({
      phone,
      name: parts[1] || undefined,
      var1: parts[2] || undefined,
      var2: parts[3] || undefined,
    })
  }

  return { phones: valid, duplicates, invalid }
}

export function exportToCsv(
  filename: string,
  headers: string[],
  rows: (string | number)[][],
): void {
  const escapeCell = (val: string | number) => {
    const str = String(val ?? '')
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const csvContent = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => row.map(escapeCell).join(',')),
  ].join('\r\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function exportToTxt(filename: string, items: string[]): void {
  const content = items.join('\r\n')
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.txt') ? filename : `${filename}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
