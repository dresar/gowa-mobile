import axios from 'axios'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { ResponseData } from '@/api/types'
import { basicAuthHeader } from '@/lib/api-error'
import { normalizeBaseUrl, sameOriginBaseUrl } from '@/lib/url'

export type ConnectionStatus =
  | 'booting'
  | 'unconfigured'
  | 'connected'
  | 'unauthorized'
  | 'unreachable'

export type TestResult = 'ok' | 'unauthorized' | 'not-gowa' | 'unreachable'

export interface TestEndpointResult {
  ok: boolean
  status: 'ok' | 'auth_required' | 'unreachable'
  message: string
}

export interface ConnectionState {
  baseUrl: string | null
  token: string | null
  username: string | null
  password: string | null
  savedEndpoints: string[]
  status: ConnectionStatus
  isOffline: boolean
  setOffline: (offline: boolean) => void
  recheckConnection: () => Promise<boolean>
  setBaseUrl: (url: string) => void
  saveEndpoint: (url: string) => void
  removeSavedEndpoint: (url: string) => void
  testEndpoint: (url: string) => Promise<TestEndpointResult>
  connect: (baseUrl: string, username?: string, password?: string) => Promise<TestResult>
  loginWithPin: (pin: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => Promise<void>
  boot: () => Promise<void>
  disconnect: () => void
  markUnauthorized: () => void
}

export async function probeServer(
  baseUrl: string,
  token?: string,
  username?: string,
  password?: string,
): Promise<TestResult> {
  try {
    const headers: Record<string, string> = { Accept: 'application/json' }
    if (token) {
      headers.Authorization = `Bearer ${token}`
    } else if (username && password) {
      headers.Authorization = basicAuthHeader(username, password)
    }

    const response = await axios.get<ResponseData<unknown>>(`${baseUrl}/devices`, {
      timeout: 5_000,
      validateStatus: () => true,
      headers,
    })
    if (response.status === 401) return 'unauthorized'
    const body = response.data
    if (response.status === 200 && typeof body === 'object' && body !== null && 'code' in body) {
      return 'ok'
    }
    return 'not-gowa'
  } catch {
    return 'unreachable'
  }
}

const DEFAULT_ENDPOINTS = [
  'https://agentai.my.id',
  'http://localhost:8011',
]

export const useConnection = create<ConnectionState>()(
  persist(
    (set, get) => ({
      baseUrl: null,
      token: null,
      username: null,
      password: null,
      savedEndpoints: DEFAULT_ENDPOINTS,
      status: 'booting',
      isOffline: false,

      setOffline: (offline: boolean) => set({ isOffline: offline }),

      recheckConnection: async () => {
        const { baseUrl, token, username, password } = get()
        const targetUrl = baseUrl || sameOriginBaseUrl() || 'https://agentai.my.id'
        if (!targetUrl) return false
        const res = await probeServer(targetUrl, token ?? undefined, username ?? undefined, password ?? undefined)
        if (res === 'ok') {
          set({ baseUrl: targetUrl, status: 'connected', isOffline: false })
          return true
        }
        if (res === 'unauthorized') {
          set({ baseUrl: targetUrl, status: 'unauthorized', isOffline: false })
          return false
        }
        set({ isOffline: true })
        return false
      },

      setBaseUrl: (rawUrl: string) => {
        const clean = normalizeBaseUrl(rawUrl)
        set({ baseUrl: clean })
      },

      saveEndpoint: (rawUrl: string) => {
        const clean = normalizeBaseUrl(rawUrl)
        if (!clean) return
        set((state) => {
          const filtered = state.savedEndpoints.filter((ep) => ep.toLowerCase() !== clean.toLowerCase())
          return {
            savedEndpoints: [clean, ...filtered],
            baseUrl: clean,
          }
        })
      },

      removeSavedEndpoint: (url: string) => {
        set((state) => ({
          savedEndpoints: state.savedEndpoints.filter((ep) => ep.toLowerCase() !== url.toLowerCase()),
        }))
      },

      testEndpoint: async (rawUrl: string): Promise<TestEndpointResult> => {
        const clean = normalizeBaseUrl(rawUrl)
        if (!clean) {
          return {
            ok: false,
            status: 'unreachable',
            message: 'URL endpoint tidak valid',
          }
        }

        try {
          const res = await axios.get(`${clean}/devices`, {
            timeout: 6_000,
            validateStatus: () => true,
          })

          if (res.status === 401) {
            get().saveEndpoint(clean)
            return {
              ok: true,
              status: 'auth_required',
              message: 'Server aktif & online (memerlukan PIN)',
            }
          }

          if (res.status === 200) {
            get().saveEndpoint(clean)
            return {
              ok: true,
              status: 'ok',
              message: 'Server aktif & terhubung',
            }
          }

          const pingRes = await axios.get(`${clean}/app/ping`, {
            timeout: 4_000,
            validateStatus: () => true,
          }).catch(() => null)

          if (pingRes && (pingRes.status === 200 || pingRes.status === 401)) {
            get().saveEndpoint(clean)
            return {
              ok: true,
              status: 'ok',
              message: 'Server GoWA aktif',
            }
          }

          return {
            ok: false,
            status: 'unreachable',
            message: `Server merespon dengan status ${res.status}`,
          }
        } catch (err: any) {
          return {
            ok: false,
            status: 'unreachable',
            message: err?.message || 'Gagal terhubung ke URL endpoint',
          }
        }
      },

      connect: async (rawUrl, username, password) => {
        const baseUrl = normalizeBaseUrl(rawUrl)
        const result = await probeServer(baseUrl, undefined, username, password)
        if (result === 'ok') {
          set({
            baseUrl,
            username: username || null,
            password: password || null,
            status: 'connected',
          })
          get().saveEndpoint(baseUrl)
        }
        return result
      },

      loginWithPin: async (pin: string) => {
        const targetUrl = get().baseUrl || sameOriginBaseUrl() || ''
        try {
          const response = await axios.post<ResponseData<{ token: string }>>(
            `${targetUrl}/auth/login`,
            { pin },
            { timeout: 10_000, validateStatus: () => true },
          )
          if (response.status === 200 && response.data?.code === 'SUCCESS') {
            const token = response.data.results?.token || pin
            set({
              baseUrl: targetUrl,
              token,
              status: 'connected',
            })
            get().saveEndpoint(targetUrl)
            return { ok: true }
          }
          return { ok: false, error: response.data?.message || 'PIN salah' }
        } catch {
          return { ok: false, error: 'Gagal terhubung ke server' }
        }
      },

      logout: async () => {
        const targetUrl = get().baseUrl || sameOriginBaseUrl() || ''
        try {
          await axios.post(`${targetUrl}/auth/logout`, {}, { timeout: 5_000, validateStatus: () => true })
        } catch {
        }
        set({ token: null, username: null, password: null, status: 'unauthorized' })
      },

      boot: async () => {
        let { baseUrl, token, username, password, savedEndpoints } = get()

        // 1. Purge stale/dead domains from cached baseUrl
        if (
          baseUrl &&
          (baseUrl.includes('trycloudflare.com') ||
            baseUrl.includes('serverinka.cloud') ||
            baseUrl.includes('localhost:3000'))
        ) {
          baseUrl = null
        }

        // Clean savedEndpoints from dead domains and ensure https://agentai.my.id is present
        const cleanSavedEndpoints = (savedEndpoints || DEFAULT_ENDPOINTS).filter(
          (ep) => !ep.includes('trycloudflare.com') && !ep.includes('serverinka.cloud')
        )
        if (!cleanSavedEndpoints.includes('https://agentai.my.id')) {
          cleanSavedEndpoints.unshift('https://agentai.my.id')
        }

        // 2. Check if running in mobile APK / WebView mode
        const isApkMode =
          typeof window !== 'undefined' &&
          (window.location.protocol === 'file:' ||
            /GoWAMobile/i.test(navigator.userAgent) ||
            Boolean((window as any).GoWAMobile) ||
            Boolean((window as any).Android) ||
            Boolean((window as unknown as { isGowaApk?: boolean }).isGowaApk))

        if (isApkMode) {
          let nativeUrl: string | undefined
          try {
            nativeUrl =
              (window as any).GoWAMobile?.getServerUrl?.() ||
              (window as any).Android?.getServerUrl?.()
          } catch {}

          if (
            !nativeUrl ||
            nativeUrl.includes('trycloudflare.com') ||
            nativeUrl.includes('serverinka.cloud') ||
            nativeUrl.includes('localhost:3000')
          ) {
            nativeUrl = 'https://agentai.my.id'
            try {
              ;(window as any).GoWAMobile?.saveServerUrl?.('https://agentai.my.id') ||
                (window as any).Android?.saveServerUrl?.('https://agentai.my.id')
            } catch {}
          }

          if (!baseUrl) {
            baseUrl = nativeUrl
          }
        }

        const origin = sameOriginBaseUrl()
        const fallbackDefault = normalizeBaseUrl(
          (import.meta.env.VITE_DEFAULT_SERVER_URL as string | undefined) ||
            'https://agentai.my.id',
        )
        const targetUrl = baseUrl || origin || fallbackDefault

        set({ baseUrl: targetUrl, savedEndpoints: cleanSavedEndpoints })

        if (targetUrl) {
          const stored = await probeServer(targetUrl, token ?? undefined, username ?? undefined, password ?? undefined)
          if (stored === 'ok') {
            set({ baseUrl: targetUrl, status: 'connected', isOffline: false })
            return
          }
          if (stored === 'unauthorized') {
            set({ baseUrl: targetUrl, status: 'unauthorized', isOffline: false })
            return
          }
          if (token) {
            // Keep user logged in if token exists, mark isOffline so UI stays visible
            set({ baseUrl: targetUrl, status: 'connected', isOffline: true })
            return
          }
        }

        if (fallbackDefault && fallbackDefault !== origin && fallbackDefault !== targetUrl) {
          const defRes = await probeServer(fallbackDefault, token ?? undefined)
          if (defRes === 'ok') {
            set({ baseUrl: fallbackDefault, status: 'connected', isOffline: false })
            return
          }
          if (defRes === 'unauthorized') {
            set({ baseUrl: fallbackDefault, status: 'unauthorized', isOffline: false })
            return
          }
        }

        if (origin.includes(':5173')) {
          const gowaProxy = `${origin}/gowa`
          const proxyRes = await probeServer(gowaProxy, token ?? undefined)
          if (proxyRes === 'ok') {
            set({ baseUrl: gowaProxy, status: 'connected', isOffline: false })
            return
          }
          if (proxyRes === 'unauthorized') {
            set({ baseUrl: gowaProxy, status: 'unauthorized', isOffline: false })
            return
          }
        }

        if (token && targetUrl) {
          set({ baseUrl: targetUrl, status: 'connected', isOffline: true })
        } else {
          set({ baseUrl: targetUrl || origin || fallbackDefault, status: 'unauthorized', isOffline: false })
        }
      },

      disconnect: () =>
        set({ baseUrl: null, token: null, username: null, password: null, status: 'unauthorized' }),

      markUnauthorized: () => {
        if (get().status === 'connected') set({ status: 'unauthorized' })
      },
    }),
    {
      name: 'gowa-ui.connection.v1',
      storage: createJSONStorage(() => localStorage),
      partialize: ({ baseUrl, token, username, password, savedEndpoints }) => ({
        baseUrl,
        token,
        username,
        password,
        savedEndpoints,
      }),
    },
  ),
)
