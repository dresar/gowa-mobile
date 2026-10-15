export function normalizeBaseUrl(input: string): string {
  let url = input.trim()
  if (!url || url === 'null' || url.startsWith('file:')) return ''
  if (!/^https?:\/\//i.test(url)) url = `http://${url}`
  return url.replace(/\/+$/, '')
}

export function joinUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
}

export function rerootServerUrl(baseUrl: string, serverUrl: string, serverBasePath = ''): string {
  let path: string
  try {
    const parsed = new URL(serverUrl)
    path = parsed.pathname + parsed.search
  } catch {
    path = serverUrl
  }
  if (serverBasePath && path.startsWith(serverBasePath)) {
    path = path.slice(serverBasePath.length)
  }
  return joinUrl(baseUrl, path)
}

export function toWebSocketUrl(baseUrl: string, params: Record<string, string>): string {
  const httpUrl = new URL(joinUrl(baseUrl, 'ws'))
  httpUrl.protocol = httpUrl.protocol === 'https:' ? 'wss:' : 'ws:'
  for (const [key, value] of Object.entries(params)) {
    if (value) httpUrl.searchParams.set(key, value)
  }
  return httpUrl.toString()
}

export function sameOriginBaseUrl(): string {
  if (typeof window === 'undefined') return ''
  const origin = window.location.origin
  if (!origin || origin === 'null' || origin.startsWith('file:') || origin === 'file://') {
    return ''
  }
  const path = window.location.pathname.replace(/\/index\.html$/, '').replace(/\/+$/, '')
  return `${origin}${path}`
}

export function b64encode(text: string): string {
  return btoa(String.fromCharCode(...new TextEncoder().encode(text)))
}
