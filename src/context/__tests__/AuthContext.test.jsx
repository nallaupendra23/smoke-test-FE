import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '../AuthContext'

// Mock the api module
vi.mock('../../services/api', () => ({
  authApi: {
    signupRequest: vi.fn(),
    signupVerify:  vi.fn(),
    loginRequest:  vi.fn(),
    loginVerify:   vi.fn(),
    logout:        vi.fn(),
  },
}))

import { authApi } from '../../services/api'

// Helper: render a component that exposes AuthContext values
function ContextConsumer({ onMount }) {
  const ctx = useAuth()
  onMount(ctx)
  return null
}

function renderWithAuth(onMount) {
  render(
    <AuthProvider>
      <ContextConsumer onMount={onMount} />
    </AuthProvider>
  )
}

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

afterEach(() => {
  localStorage.clear()
})

// ── Initial state ──────────────────────────────────────────────────────────

describe('initial state', () => {
  it('owner is null when localStorage is empty', () => {
    let ctx
    renderWithAuth((c) => { ctx = c })
    expect(ctx.owner).toBeNull()
  })

  it('owner is restored from localStorage on mount', () => {
    const saved = { id: 'owner-1', email: 'a@b.com' }
    localStorage.setItem('owner', JSON.stringify(saved))
    let ctx
    renderWithAuth((c) => { ctx = c })
    expect(ctx.owner).toEqual(saved)
  })
})

// ── signupRequest ──────────────────────────────────────────────────────────

describe('signupRequest', () => {
  it('calls authApi.signupRequest with correct payload', async () => {
    authApi.signupRequest.mockResolvedValue({ data: { pending: true, message: 'OTP sent' } })
    let ctx
    renderWithAuth((c) => { ctx = c })

    const result = await act(() =>
      ctx.signupRequest('owner@biz.com', 'pass123', 'My Resto', '+14155550000')
    )

    expect(authApi.signupRequest).toHaveBeenCalledWith({
      email: 'owner@biz.com',
      password: 'pass123',
      restaurant_name: 'My Resto',
      phone: '+14155550000',
    })
    expect(result.pending).toBe(true)
  })

  it('defaults phone to empty string when omitted', async () => {
    authApi.signupRequest.mockResolvedValue({ data: { pending: true } })
    let ctx
    renderWithAuth((c) => { ctx = c })

    await act(() => ctx.signupRequest('owner@biz.com', 'pass123', 'My Resto'))

    expect(authApi.signupRequest).toHaveBeenCalledWith(
      expect.objectContaining({ phone: '' })
    )
  })
})

// ── signupVerify ──────────────────────────────────────────────────────────

describe('signupVerify', () => {
  it('sets token and owner in localStorage and state', async () => {
    const fakeOwner = { id: 'o1', email: 'owner@biz.com' }
    authApi.signupVerify.mockResolvedValue({
      data: { access_token: 'tok-abc', owner: fakeOwner },
    })

    let ctx
    renderWithAuth((c) => { ctx = c })
    await act(() => ctx.signupVerify('owner@biz.com', '123456'))

    expect(localStorage.getItem('token')).toBe('tok-abc')
    expect(JSON.parse(localStorage.getItem('owner'))).toEqual(fakeOwner)
  })
})

// ── loginRequest ──────────────────────────────────────────────────────────

describe('loginRequest', () => {
  it('stores token immediately when backend returns access_token (dev/no-SMTP mode)', async () => {
    const fakeOwner = { id: 'o1', email: 'owner@biz.com' }
    authApi.loginRequest.mockResolvedValue({
      data: { access_token: 'tok-dev', owner: fakeOwner },
    })

    let ctx
    renderWithAuth((c) => { ctx = c })
    const result = await act(() => ctx.loginRequest('owner@biz.com', 'pass123'))

    expect(localStorage.getItem('token')).toBe('tok-dev')
    expect(result.access_token).toBe('tok-dev')
  })

  it('does NOT store token when backend returns OTP-pending message', async () => {
    authApi.loginRequest.mockResolvedValue({
      data: { message: 'Verification code sent', dev_mode: true, otp: '654321' },
    })

    let ctx
    renderWithAuth((c) => { ctx = c })
    await act(() => ctx.loginRequest('owner@biz.com', 'pass123'))

    expect(localStorage.getItem('token')).toBeNull()
  })
})

// ── login (OTP verify step) ────────────────────────────────────────────────

describe('login (verify OTP)', () => {
  it('stores token and owner, sets state', async () => {
    const fakeOwner = { id: 'o1', email: 'owner@biz.com' }
    authApi.loginVerify.mockResolvedValue({
      data: { access_token: 'tok-verify', owner: fakeOwner },
    })

    let ctx
    renderWithAuth((c) => { ctx = c })
    await act(() => ctx.login('owner@biz.com', '123456'))

    expect(localStorage.getItem('token')).toBe('tok-verify')
    expect(JSON.parse(localStorage.getItem('owner'))).toEqual(fakeOwner)
  })

  it('calls loginVerify with email and otp_code', async () => {
    authApi.loginVerify.mockResolvedValue({
      data: { access_token: 'tok', owner: { id: 'o1', email: 'x@y.com' } },
    })

    let ctx
    renderWithAuth((c) => { ctx = c })
    await act(() => ctx.login('x@y.com', '999888'))

    expect(authApi.loginVerify).toHaveBeenCalledWith({ email: 'x@y.com', otp_code: '999888' })
  })
})

// ── logout ────────────────────────────────────────────────────────────────

describe('logout', () => {
  it('clears localStorage and sets owner to null', async () => {
    localStorage.setItem('token', 'tok')
    localStorage.setItem('owner', JSON.stringify({ id: 'o1' }))
    authApi.logout.mockResolvedValue({})

    let ctx
    renderWithAuth((c) => { ctx = c })
    act(() => ctx.logout())

    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('owner')).toBeNull()
  })

  it('does not throw even if logout API call fails', () => {
    authApi.logout.mockRejectedValue(new Error('network error'))
    let ctx
    renderWithAuth((c) => { ctx = c })
    expect(() => act(() => ctx.logout())).not.toThrow()
  })
})
