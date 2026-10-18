import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/app-shell'
import { onWsEvent } from '@/lib/events'
import { wsClient } from '@/lib/ws'
import { useConnection } from '@/stores/connection'
import { useDeviceStore } from '@/stores/device'
import AccountPage from '@/pages/account'
import ChatsPage from '@/pages/chats'
import ConnectPage from '@/pages/connect'
import DashboardPage from '@/pages/dashboard'
import GroupsPage from '@/pages/groups'
import MessagingPage from '@/pages/messaging'
import MiscLayout from '@/pages/misc/misc-layout'
import MiscCheckerPage from '@/pages/misc/misc-checker-page'
import MiscWalinkPage from '@/pages/misc/misc-walink-page'
import MiscPresencePage from '@/pages/misc/misc-presence-page'
import MiscContactsPage from '@/pages/misc/misc-contacts-page'
import MiscProfilePage from '@/pages/misc/misc-profile-page'
import MiscChannelsPage from '@/pages/misc/misc-channels-page'
import MiscCallsPage from '@/pages/misc/misc-calls-page'
import SettingsLayout from '@/pages/settings/settings-layout'
import SettingsGeneralPage from '@/pages/settings/general'
import SettingsApiKeysPage from '@/pages/settings/api-keys'
import SettingsWebhookPage from '@/pages/settings/webhook'
import SettingsAiPage from '@/pages/settings/ai'
import SettingsChatwootPage from '@/pages/settings/chatwoot'
import SettingsStoragePage from '@/pages/settings/storage'
import SettingsSecurityPage from '@/pages/settings/security'
import SettingsDiagnosticsPage from '@/pages/settings/diagnostics'
import SettingsAppearancePage from '@/pages/settings/appearance'
import SettingsTemplatesPage from '@/pages/settings/templates'
import ScheduledPage from '@/pages/scheduled'
import BotAutoRepliesPage from '@/pages/bot-auto-replies'
import BotAutoRepliesFormPage from '@/pages/bot-auto-reply-form'
import BotAIPage from '@/pages/bot-ai'
import BotAIPersonaPage from '@/pages/bot-ai-persona-page'
import BotMenuPage from '@/pages/bot-menu'
import BotMenuDetailPage from '@/pages/bot-menu-detail-page'
import BotGroupsPage from '@/pages/bot-groups'
import BotLogsPage from '@/pages/bot-logs'
import IntegrationsPage from '@/pages/integrations'
import BroadcastPage from '@/pages/broadcast'

const notifiedMessageCache = new Map<string, number>()

function hasBeenNotified(id: string): boolean {
  const now = Date.now()
  const ts = notifiedMessageCache.get(id)
  if (ts && now - ts < 10 * 60 * 1000) {
    return true
  }
  if (notifiedMessageCache.size > 1000) {
    for (const [key, time] of notifiedMessageCache.entries()) {
      if (now - time > 10 * 60 * 1000) {
        notifiedMessageCache.delete(key)
      }
    }
  }
  return false
}

function markNotified(id: string): void {
  notifiedMessageCache.set(id, Date.now())
}

export function notify(title: string, body: string, tag: string) {
  const mobile = (window as any).GoWAMobile || (window as any).Android
  if (mobile && typeof mobile.showNotification === 'function') {
    try {
      mobile.showNotification(title, body, tag)
      return
    } catch (err) {
      console.error('Error calling mobile showNotification', err)
    }
  }
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, { body, tag })
      } catch {}
    } else if (Notification.permission === 'default') {
      void Notification.requestPermission().then((perm) => {
        if (perm === 'granted') {
          try {
            new Notification(title, { body, tag })
          } catch {}
        }
      })
    }
  }
}

function useBootstrap() {
  const queryClient = useQueryClient()

  useEffect(() => {
    void useConnection.getState().boot()
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      void Notification.requestPermission()
    }
    const mobile = (window as any).GoWAMobile || (window as any).Android
    if (mobile?.requestNotificationPermission) {
      try {
        mobile.requestNotificationPermission()
      } catch {}
    }
  }, [])

  useEffect(() => {
    wsClient.sync()
    const unsubscribeConnection = useConnection.subscribe(() => wsClient.sync())
    const unsubscribeDevice = useDeviceStore.subscribe(() => wsClient.sync())
    return () => {
      unsubscribeConnection()
      unsubscribeDevice()
      wsClient.stop()
    }
  }, [])

  useEffect(
    () =>
      onWsEvent((event) => {
        switch (event.code) {
          case 'LOGIN_SUCCESS':
          case 'LIST_DEVICES':
          case 'DEVICE_LOGGED_OUT':
            void queryClient.invalidateQueries({ queryKey: ['devices'] })
            break
          case 'DEVICE_REMOVED': {
            void queryClient.invalidateQueries({ queryKey: ['devices'] })
            const removed = (event.result as { device_id?: string } | null)?.device_id
            const { selectedDeviceId, selectDevice } = useDeviceStore.getState()
            if (removed && removed === selectedDeviceId) selectDevice(null)
            break
          }
          case 'CHAT_MESSAGE_NEW': {
            void queryClient.invalidateQueries({ queryKey: ['chats'] })
            void queryClient.invalidateQueries({ queryKey: ['chat-messages'] })
            break
          }
          case 'INCOMING_MESSAGE': {
            void queryClient.invalidateQueries({ queryKey: ['chats'] })
            void queryClient.invalidateQueries({ queryKey: ['chat-messages'] })

            const data = event.result as {
              id?: string
              chat_jid?: string
              sender?: string
              phone?: string
              body?: string
              is_from_me?: boolean
              is_group?: boolean
              timestamp?: number
            } | null

            if (!data) break
            if (data.is_from_me || data.is_group) break

            const chatJid = (data.chat_jid || '').toLowerCase()
            if (
              !chatJid ||
              chatJid.includes('status@') ||
              chatJid.endsWith('@broadcast') ||
              chatJid.endsWith('@newsletter') ||
              chatJid.endsWith('@g.us')
            ) {
              break
            }

            const now = Date.now()
            const msgTime = Number(data.timestamp) || 0
            if (msgTime > 0) {
              const diffMs = Math.abs(now - msgTime)
              if (diffMs > 5 * 60 * 1000) {
                break
              }
            }

            const msgId = data.id || `${chatJid}_${msgTime}`
            if (hasBeenNotified(msgId)) {
              break
            }
            markNotified(msgId)

            const sender = data.sender || data.phone || 'Pesan Baru'
            const text = data.body || 'Pesan masuk'
            notify(sender, text, `chat_${chatJid}`)
            break
          }
          case 'SCHEDULED_DELIVERED': {
            const data = event.result as { id?: string; phone?: string; summary?: string; message_type?: string } | null
            const phone = data?.phone || 'Penerima'
            const detail = data?.summary || (data?.message_type ? `Pesan ${data.message_type}` : 'Pesan berhasil dikirim')
            const notifKey = `sched_${data?.id || phone}_${Date.now()}`
            notify('Jadwal Pesan Terkirim', `Pesan ke ${phone} telah terkirim: ${detail}`, notifKey)
            void queryClient.invalidateQueries({ queryKey: ['scheduled-sends'] })
            break
          }
          case 'SCHEDULED_FAILED': {
            const data = event.result as { id?: string; phone?: string; summary?: string; message_type?: string; error?: string } | null
            const phone = data?.phone || 'Penerima'
            const err = data?.error || 'Melebihi batas waktu toleransi penjadwalan'
            const notifKey = `sched_fail_${data?.id || phone}_${Date.now()}`
            notify('Jadwal Pesan Gagal', `Jadwal ke ${phone} gagal: ${err}`, notifKey)
            void queryClient.invalidateQueries({ queryKey: ['scheduled-sends'] })
            break
          }
          default:
            break
        }
      }),
    [queryClient],
  )
}

function App() {
  useBootstrap()

  return (
    <Routes>
      <Route path="/login" element={<ConnectPage />} />
      <Route path="/connect" element={<ConnectPage />} />
      <Route element={<AppShell />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/messaging" element={<MessagingPage />} />
        <Route path="/broadcast" element={<BroadcastPage />} />
        <Route path="/campaigns" element={<Navigate to="/broadcast" replace />} />
        <Route path="/scheduled" element={<ScheduledPage />} />
        <Route path="/send" element={<Navigate to="/messaging" replace />} />
        <Route path="/messages" element={<Navigate to="/messaging" replace />} />
        <Route path="/groups" element={<GroupsPage />} />
        <Route path="/chats" element={<ChatsPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/misc" element={<MiscLayout />}>
          <Route index element={<Navigate to="/misc/checker" replace />} />
          <Route path="checker" element={<MiscCheckerPage />} />
          <Route path="walink" element={<MiscWalinkPage />} />
          <Route path="presence" element={<MiscPresencePage />} />
          <Route path="contacts" element={<MiscContactsPage />} />
          <Route path="profile" element={<MiscProfilePage />} />
          <Route path="channels" element={<MiscChannelsPage />} />
          <Route path="calls" element={<MiscCallsPage />} />
          <Route path="*" element={<Navigate to="/misc/checker" replace />} />
        </Route>
        <Route path="/settings" element={<SettingsLayout />}>
          <Route index element={<Navigate to="/settings/general" replace />} />
          <Route path="general" element={<SettingsGeneralPage />} />
          <Route path="api-keys" element={<SettingsApiKeysPage />} />
          <Route path="webhook" element={<SettingsWebhookPage />} />
          <Route path="ai" element={<SettingsAiPage />} />
          <Route path="chatwoot" element={<SettingsChatwootPage />} />
          <Route path="storage" element={<SettingsStoragePage />} />
          <Route path="security" element={<SettingsSecurityPage />} />
          <Route path="diagnostics" element={<SettingsDiagnosticsPage />} />
          <Route path="appearance" element={<SettingsAppearancePage />} />
          <Route path="templates" element={<SettingsTemplatesPage />} />
          <Route path="auto-reply-templates" element={<SettingsTemplatesPage />} />
          <Route path="*" element={<Navigate to="/settings/general" replace />} />
        </Route>
        <Route path="/bot/auto-replies" element={<BotAutoRepliesPage />} />
        <Route path="/bot/auto-replies/new" element={<BotAutoRepliesFormPage />} />
        <Route path="/bot/auto-replies/edit/:id" element={<BotAutoRepliesFormPage />} />
        <Route path="/bot/auto-replies/:id" element={<BotAutoRepliesFormPage />} />
        <Route path="/bot/rules" element={<Navigate to="/bot/auto-replies" replace />} />
        <Route path="/bot/menu" element={<BotMenuPage />} />
        <Route path="/bot/menu/:id" element={<BotMenuDetailPage />} />
        <Route path="/bot/ai" element={<BotAIPage />} />
        <Route path="/bot/ai/new" element={<BotAIPersonaPage />} />
        <Route path="/bot/ai/:phone" element={<BotAIPersonaPage />} />
        <Route path="/bot/groups" element={<BotGroupsPage />} />
        <Route path="/bot/logs" element={<BotLogsPage />} />
        <Route path="/integrations" element={<IntegrationsPage />} />
        <Route path="/webhook" element={<Navigate to="/integrations" replace />} />
        <Route path="/mcp" element={<Navigate to="/integrations" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
