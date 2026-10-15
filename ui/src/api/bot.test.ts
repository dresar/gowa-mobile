import type { AxiosAdapter, AxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  chatWithAI,
  clearLogs,
  createRule,
  deleteGroupRule,
  deleteRule,
  executeTool,
  getAIConfig,
  getGroupRule,
  getRule,
  listGroupRules,
  listLogs,
  listRules,
  listTools,
  toggleRule,
  updateAIConfig,
  updateRule,
  upsertGroupRule,
} from '@/api/bot'
import { http } from '@/lib/http'

describe('bot API client', () => {
  let originalAdapter: AxiosRequestConfig['adapter']
  let capturedConfig: AxiosRequestConfig | undefined
  let mockResults: unknown

  beforeEach(() => {
    originalAdapter = http.defaults.adapter
    capturedConfig = undefined
    mockResults = {}

    const adapter: AxiosAdapter = async (config) => {
      capturedConfig = config
      return {
        data: { code: 'SUCCESS', message: 'ok', results: mockResults },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      }
    }
    http.defaults.adapter = adapter
  })

  afterEach(() => {
    http.defaults.adapter = originalAdapter
  })

  it('lists rules with params', async () => {
    mockResults = [{ id: 1, trigger_value: 'hi' }]
    const res = await listRules({ active: true, scope: 'all', search: 'hi' })
    expect(capturedConfig?.url).toBe('/bot/rules')
    expect(capturedConfig?.params).toEqual({ active: true, scope: 'all', search: 'hi' })
    expect(res).toEqual([{ id: 1, trigger_value: 'hi' }])
  })

  it('creates rule', async () => {
    mockResults = { id: 2 }
    const res = await createRule({
      trigger_type: 'exact',
      trigger_value: 'ping',
      scope: 'all',
      response_type: 'text',
      response_content: 'pong',
    })
    expect(capturedConfig?.url).toBe('/bot/rules')
    expect(capturedConfig?.method).toBe('post')
    expect(res).toEqual({ id: 2 })
  })

  it('gets, updates, toggles, and deletes rule', async () => {
    mockResults = { id: 1 }
    await getRule(1)
    expect(capturedConfig?.url).toBe('/bot/rules/1')

    await updateRule(1, { response_content: 'new' })
    expect(capturedConfig?.url).toBe('/bot/rules/1')
    expect(capturedConfig?.method).toBe('put')

    await toggleRule(1)
    expect(capturedConfig?.url).toBe('/bot/rules/1/toggle')
    expect(capturedConfig?.method).toBe('patch')

    await deleteRule(1)
    expect(capturedConfig?.url).toBe('/bot/rules/1')
    expect(capturedConfig?.method).toBe('delete')
  })

  it('manages group rules', async () => {
    mockResults = [{ group_jid: '123@g.us' }]
    const list = await listGroupRules()
    expect(capturedConfig?.url).toBe('/bot/group-rules')
    expect(list).toEqual([{ group_jid: '123@g.us' }])

    await getGroupRule('123@g.us')
    expect(capturedConfig?.url).toBe('/bot/group-rules/123%40g.us')

    await upsertGroupRule({ group_jid: '123@g.us', anti_link_enabled: true })
    expect(capturedConfig?.url).toBe('/bot/group-rules')
    expect(capturedConfig?.method).toBe('post')

    await deleteGroupRule('123@g.us')
    expect(capturedConfig?.url).toBe('/bot/group-rules/123%40g.us')
    expect(capturedConfig?.method).toBe('delete')
  })

  it('manages AI config and chat', async () => {
    mockResults = { model: 'gpt-4o' }
    const cfg = await getAIConfig()
    expect(capturedConfig?.url).toBe('/bot/ai/config')
    expect(cfg).toEqual({ model: 'gpt-4o' })

    await updateAIConfig({ model: 'gpt-4o-mini' })
    expect(capturedConfig?.url).toBe('/bot/ai/config')
    expect(capturedConfig?.method).toBe('put')

    mockResults = { reply: 'hello' }
    const chat = await chatWithAI({ message: 'hi' })
    expect(capturedConfig?.url).toBe('/bot/ai/chat')
    expect(chat).toEqual({ reply: 'hello' })
  })

  it('manages tools and execution', async () => {
    mockResults = [{ name: 'send_message' }]
    const tools = await listTools()
    expect(capturedConfig?.url).toBe('/bot/ai/tools')
    expect(tools).toEqual([{ name: 'send_message' }])

    mockResults = { tool: 'send_message', status: 'success' }
    const execRes = await executeTool({ tool: 'send_message', parameters: { recipient: '123', message: 'test' } })
    expect(capturedConfig?.url).toBe('/bot/ai/execute')
    expect(execRes).toEqual({ tool: 'send_message', status: 'success' })
  })

  it('manages logs', async () => {
    mockResults = { total: 1, logs: [{ id: 1 }] }
    const logs = await listLogs({ limit: 10, offset: 0 })
    expect(capturedConfig?.url).toBe('/bot/logs')
    expect(logs).toEqual({ total: 1, logs: [{ id: 1 }] })

    await clearLogs()
    expect(capturedConfig?.url).toBe('/bot/logs')
    expect(capturedConfig?.method).toBe('delete')
  })
})
