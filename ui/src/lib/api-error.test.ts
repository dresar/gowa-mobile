import { AxiosError, type AxiosResponse } from 'axios'
import { describe, expect, it } from 'vitest'
import { isApiError, isDeviceNotFoundError, toApiError } from './api-error'

function axiosErrorWithResponse(status: number, data: unknown): AxiosError {
  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, {
    status,
    data,
    statusText: '',
    headers: {},
    config: {},
  } as AxiosResponse)
}

describe('toApiError', () => {
  it('extracts the gowa envelope from an axios error', () => {
    const error = toApiError(
      axiosErrorWithResponse(404, { code: 'DEVICE_NOT_FOUND', message: 'device not found' }),
    )
    expect(error).toEqual({ status: 404, code: 'DEVICE_NOT_FOUND', message: 'device not found' })
  })

  it('maps a missing response to NETWORK_ERROR', () => {
    const error = toApiError(new AxiosError('Network Error', 'ERR_NETWORK'))
    expect(error.status).toBe(0)
    expect(error.code).toBe('NETWORK_ERROR')
  })

  it('falls back to HTTP_ERROR when the body is not an envelope', () => {
    const error = toApiError(axiosErrorWithResponse(502, '<html>bad gateway</html>'))
    expect(error.status).toBe(502)
    expect(error.code).toBe('HTTP_ERROR')
  })

  it('passes ApiError objects through and wraps plain errors', () => {
    const passthrough = { status: 401, code: 'AUTHENTICATION_ERROR', message: 'nope' }
    expect(toApiError(passthrough)).toBe(passthrough)
    expect(isApiError(toApiError(new Error('boom')))).toBe(true)
    expect(toApiError(new Error('boom')).message).toBe('boom')
  })
})

describe('isDeviceNotFoundError', () => {
  it('returns true for DEVICE_NOT_FOUND code', () => {
    const error = { status: 404, code: 'DEVICE_NOT_FOUND', message: 'device not found' }
    expect(isDeviceNotFoundError(error)).toBe(true)
  })

  it('returns true for DEVICE_ID_REQUIRED code', () => {
    const error = { status: 400, code: 'DEVICE_ID_REQUIRED', message: 'device_id is required' }
    expect(isDeviceNotFoundError(error)).toBe(true)
  })

  it('returns true when message mentions device not found or device required', () => {
    expect(isDeviceNotFoundError(new Error('Device not found; create a device first'))).toBe(true)
    expect(
      isDeviceNotFoundError(
        new Error('device_id is required via X-Device-Id header or device_id query'),
      ),
    ).toBe(true)
    expect(
      isDeviceNotFoundError(
        new Error('device identification required: set the X-Device-Id header or pass device_id'),
      ),
    ).toBe(true)
  })

  it('returns false for unrelated errors or nil', () => {
    expect(isDeviceNotFoundError(null)).toBe(false)
    expect(isDeviceNotFoundError(undefined)).toBe(false)
    expect(isDeviceNotFoundError(new Error('Network error'))).toBe(false)
    expect(isDeviceNotFoundError({ status: 500, code: 'INTERNAL_ERROR', message: 'crash' })).toBe(
      false,
    )
  })
})
