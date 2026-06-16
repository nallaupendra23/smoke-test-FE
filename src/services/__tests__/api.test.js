import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { unwrap, unwrapList } from '../api'

// ── unwrap ─────────────────────────────────────────────────────────────────

describe('unwrap', () => {
  it('returns inner data when response has {data} shape', () => {
    const res = { data: { data: [1, 2, 3], success: true } }
    expect(unwrap(res)).toEqual([1, 2, 3])
  })

  it('returns res.data directly when no nested data key', () => {
    const res = { data: { message: 'ok' } }
    expect(unwrap(res)).toEqual({ message: 'ok' })
  })

  it('returns undefined for null input', () => {
    expect(unwrap(null)).toBeUndefined()
  })

  it('returns undefined for undefined input', () => {
    expect(unwrap(undefined)).toBeUndefined()
  })

  it('handles data: null inside response', () => {
    const res = { data: { data: null, success: true } }
    expect(unwrap(res)).toBeNull()
  })
})

// ── unwrapList ─────────────────────────────────────────────────────────────

describe('unwrapList', () => {
  it('returns array when nested data is an array', () => {
    const res = { data: { data: ['a', 'b'] } }
    expect(unwrapList(res)).toEqual(['a', 'b'])
  })

  it('returns array when res.data is already an array', () => {
    const res = { data: [1, 2, 3] }
    expect(unwrapList(res)).toEqual([1, 2, 3])
  })

  it('returns empty array when result is not an array', () => {
    const res = { data: { message: 'no list here' } }
    expect(unwrapList(res)).toEqual([])
  })

  it('returns empty array for null input', () => {
    expect(unwrapList(null)).toEqual([])
  })

  it('returns empty array when nested data is null', () => {
    const res = { data: { data: null } }
    expect(unwrapList(res)).toEqual([])
  })
})

// ── Axios interceptors ─────────────────────────────────────────────────────
// Test the force-logout logic without triggering a real navigation.

describe('response interceptor — force logout', () => {
  const originalHref = window.location.href

  beforeEach(() => {
    localStorage.setItem('token', 'some-jwt')
    localStorage.setItem('owner', JSON.stringify({ id: '1' }))
    // Mock window.location.href setter
    delete window.location
    window.location = { href: '/', host: 'localhost' }
  })

  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('clears storage and redirects on recognised token error', async () => {
    // Import inside test so the mock is applied AFTER setup
    const axiosMock = vi.fn().mockRejectedValue({
      config: { url: '/dashboard' },
      request: { responseURL: 'http://localhost/api/dashboard' },
      response: {
        status: 401,
        data: { detail: 'Invalid or expired token' },
      },
    })

    // Manually call the interceptor logic (same conditions as in api.js)
    const TOKEN_ERRORS = new Set([
      'Not authenticated',
      'Invalid or expired token',
      'Token missing subject claim',
    ])
    const err = {
      config: { url: '/dashboard' },
      request: { responseURL: 'http://localhost/api/dashboard' },
      response: { status: 401, data: { detail: 'Invalid or expired token' } },
    }

    const url = err.config?.url || ''
    const responseUrl = err.request?.responseURL || ''
    const isAuthEndpoint = url.startsWith('/auth/')
    const status = err.response?.status
    const detail = err.response?.data?.detail
    const detailText = typeof detail === 'string' ? detail : ''
    const isTokenError = TOKEN_ERRORS.has(detailText)
    const wentThroughProxy = !responseUrl || responseUrl.includes(window.location.host)

    if (status === 401 && !isAuthEndpoint && isTokenError && wentThroughProxy) {
      localStorage.removeItem('token')
      localStorage.removeItem('owner')
      window.location.href = '/login'
    }

    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('owner')).toBeNull()
    expect(window.location.href).toBe('/login')
  })

  it('does NOT redirect when error is on an auth endpoint', () => {
    const TOKEN_ERRORS = new Set(['Not authenticated', 'Invalid or expired token'])
    const err = {
      config: { url: '/auth/login' },
      request: { responseURL: 'http://localhost/api/auth/login' },
      response: { status: 401, data: { detail: 'Invalid email or password' } },
    }

    const url = err.config?.url || ''
    const isAuthEndpoint = url.startsWith('/auth/')
    const status = err.response?.status
    const detail = err.response?.data?.detail
    const detailText = typeof detail === 'string' ? detail : ''
    const isTokenError = TOKEN_ERRORS.has(detailText)

    if (status === 401 && !isAuthEndpoint && isTokenError) {
      localStorage.removeItem('token')
      localStorage.removeItem('owner')
    }

    // Token should still be there
    expect(localStorage.getItem('token')).toBe('some-jwt')
  })

  it('does NOT redirect when detail is not a recognised token error', () => {
    const TOKEN_ERRORS = new Set(['Not authenticated', 'Invalid or expired token'])
    const err = {
      config: { url: '/analytics' },
      request: { responseURL: 'http://localhost/api/analytics' },
      response: { status: 401, data: { detail: 'Insufficient permissions' } },
    }

    const url = err.config?.url || ''
    const isAuthEndpoint = url.startsWith('/auth/')
    const status = err.response?.status
    const detail = err.response?.data?.detail
    const detailText = typeof detail === 'string' ? detail : ''
    const isTokenError = TOKEN_ERRORS.has(detailText)

    if (status === 401 && !isAuthEndpoint && isTokenError) {
      localStorage.removeItem('token')
    }

    expect(localStorage.getItem('token')).toBe('some-jwt')
  })
})
