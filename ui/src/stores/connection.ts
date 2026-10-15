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
  'https://reports-excess-euros-give.trycloudflare.com',
  'https://hermes-jas1tz-8011.eu2.sumopod.my.id',
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
        const targetUrl = baseUrl || sameOriginBaseUrl()
        if (!targetUrl) return false
        const res = await probeServer(targetUrl, token ?? undefined, username ?? undefined, password ?? undefined)
        if (res === 'ok') {
          set({ status: 'connected', isOffline: false })
          return true
        }
        if (res === 'unauthorized') {
          set({ status: 'unauthorized', isOffline: false })
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
        const { baseUrl, token, username, password } = get()
        const origin = sameOriginBaseUrl()
        const targetUrl = baseUrl || origin

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

        const defaultServer = normalizeBaseUrl(
          (import.meta.env.VITE_DEFAULT_SERVER_URL as string | undefined) ||
            'http://localhost:3000',
        )
        if (defaultServer && defaultServer !== origin) {
          const defRes = await probeServer(defaultServer, token ?? undefined)
          if (defRes === 'ok') {
            set({ baseUrl: defaultServer, status: 'connected', isOffline: false })
            return
          }
          if (defRes === 'unauthorized') {
            set({ baseUrl: defaultServer, status: 'unauthorized', isOffline: false })
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
          set({ baseUrl: targetUrl || origin, status: 'unauthorized', isOffline: false })
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
