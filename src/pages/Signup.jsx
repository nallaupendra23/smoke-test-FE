import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { SpinnerIcon } from '../components/Icons'
import signupBg from '../assets/signup-bg-robot-restaurant.png'

const field =
  'w-full bg-white/[0.88] border border-white/40 rounded-xl px-4 py-[11px] ' +
  'text-[#1d1d1f] placeholder:text-[#777276] text-[15px] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] ' +
  'focus:outline-none focus:bg-white focus:border-[#e07855] focus:ring-0 ' +
  'transition-all duration-200'

export default function Signup() {
  const [mode, setMode]             = useState('form')   // 'form' | 'otp'
  const [form, setForm]             = useState({ fullName: '', restaurantName: '', email: '', phone: '', password: '' })
  const [otpCode, setOtpCode]       = useState('')
  const [devOtp, setDevOtp]         = useState('')
  const [otpMessage, setOtpMessage] = useState('')
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)
  const { signupRequest, signupVerify } = useAuth()
  const navigate = useNavigate()

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  /* ── Step 1: validate + send OTP ── */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await signupRequest(form.email, form.password, form.restaurantName, form.phone)
      setDevOtp(res.otp || '')
      setOtpMessage(res.message || `Verification code sent to ${form.email}`)
      setMode('otp')
    } catch (err) {
      setError(err.response?.data?.detail || 'Signup failed. Please try again.')
    } finally { setLoading(false) }
  }

  /* ── Step 2: verify OTP → create account ── */
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signupVerify(form.email, otpCode)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid or expired verification code.')
    } finally { setLoading(false) }
  }

  return (
    <main
      className="relative h-screen overflow-hidden"
      style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
    >
      <img
        src={signupBg}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: 'center center' }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, rgba(8,12,20,0.92) 0%, rgba(8,12,20,0.80) 29%, rgba(8,12,20,0.42) 56%, rgba(8,12,20,0.12) 100%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 18% 47%, rgba(190,59,36,0.34), transparent 36%), linear-gradient(180deg, rgba(0,0,0,0.04), rgba(0,0,0,0.30))',
        }}
      />

      <section className="relative z-10 flex h-full items-start px-5 pb-4 pt-[clamp(1.75rem,3.4vh,3.1rem)] sm:px-8 lg:px-16">
        <div className="w-full max-w-[430px] lg:ml-4">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#c83b22] shadow-[0_10px_28px_rgba(200,59,34,0.36)]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 014.69 13.5a19.79 19.79 0 01-3.07-8.67A2 2 0 013.4 2.7h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.91 10.09a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
              </svg>
            </div>
            <div>
              <div className="text-[19px] font-bold tracking-tight text-white">RingZ.ai</div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/45">Restaurant voice agent</div>
            </div>
          </div>

          <div className="mb-5 max-w-[390px]">
            <h1
              className="text-[2.3rem] font-normal italic leading-[1.04] text-white sm:text-[2.75rem]"
              style={{ fontFamily: '"Noto Serif", serif' }}
            >
              Your AI host is ready.
            </h1>
            <p className="mt-2 text-[14px] leading-relaxed text-white/64">
              Create your account to start capturing calls and orders with your AI assistant.
            </p>
          </div>

          <div
            className="rounded-[24px] border border-white/18 bg-white/[0.86] px-5 py-5 shadow-[0_24px_80px_rgba(0,0,0,0.38)] sm:px-6 sm:py-5"
            style={{ backdropFilter: 'blur(22px)' }}
          >

            {/* Step indicator */}
            <div className="flex items-center justify-center gap-1.5 mb-4">
              <div className="w-2 h-2 rounded-full transition-all duration-300"
                style={{ background: mode === 'form' ? '#c83b22' : '#d8d2cf', width: mode === 'form' ? 20 : 8 }} />
              <div className="w-2 h-2 rounded-full transition-all duration-300"
                style={{ background: mode === 'otp' ? '#c83b22' : '#d8d2cf', width: mode === 'otp' ? 20 : 8 }} />
            </div>

            {/* ── OTP step ── */}
            {mode === 'otp' && (
              <>
                <BackBtn onClick={() => { setMode('form'); setOtpCode(''); setDevOtp(''); setError('') }} />
                <div className="mb-4">
                  <h1 style={{ fontFamily: '"Noto Serif", serif' }}
                    className="text-[1.55rem] font-normal text-[#1d1d1f] mb-1.5 leading-tight">
                    Verify your email
                  </h1>
                  <p className="text-[#8e8e93] text-[14px] leading-relaxed">
                    {otpMessage || `We sent a 6-digit code to`}{' '}
                    {!otpMessage && <span className="text-[#1d1d1f] font-semibold">{form.email}</span>}
                  </p>
                  {form.phone && (
                    <p className="text-[#8e8e93] text-[13px] mt-1">
                      Also sent via SMS to{' '}
                      <span className="text-[#1d1d1f] font-medium">{form.phone}</span>
                    </p>
                  )}
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-2.5">
                  <input
                    type="text" value={otpCode} autoFocus required maxLength={6}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className={`${field} text-center text-2xl font-bold tracking-[0.5em]`}
                  />
                  {devOtp && (
                    <p className="text-[12px] text-[#835500] bg-[#ffddb4]/40 border border-[#ffb955]/40 rounded-xl px-3 py-2">
                      Dev mode — OTP: <strong>{devOtp}</strong>
                    </p>
                  )}
                  {error && <ErrBanner>{error}</ErrBanner>}
                  <PrimaryBtn loading={loading} disabled={otpCode.length < 6}>
                    Verify &amp; Continue
                  </PrimaryBtn>
                </form>

                <p className="mt-4 text-center text-[13px] text-[#8e8e93]">
                  Didn't receive it?{' '}
                  <button
                    onClick={() => { setMode('form'); setOtpCode(''); setDevOtp(''); setError('') }}
                    className="text-[#b63a23] font-semibold hover:underline">
                    Try again
                  </button>
                </p>
              </>
            )}

            {/* ── Registration form ── */}
            {mode === 'form' && (
              <>
                <div className="mb-4">
                  <h1 style={{ fontFamily: '"Noto Serif", serif' }}
                    className="text-[1.55rem] font-normal text-[#1d1d1f] mb-1 leading-tight">
                    Create account
                  </h1>
                  <p className="text-[#777276] text-[14px]">Start your free trial today - no card required.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-2.5">
                  <input
                    id="full_name" type="text"
                    value={form.fullName} onChange={set('fullName')}
                    placeholder="Full name" autoFocus
                    className={field}
                  />
                  <input
                    id="restaurant_name" type="text"
                    value={form.restaurantName} onChange={set('restaurantName')} required
                    placeholder="Restaurant name"
                    className={field}
                  />
                  <input
                    id="email" type="email"
                    value={form.email} onChange={set('email')} required
                    placeholder="Work email"
                    className={field}
                  />
                  <input
                    id="phone" type="tel"
                    value={form.phone} onChange={set('phone')} required
                    placeholder="Phone (e.g. +1 555 000 0000)"
                    className={field}
                  />
                  <input
                    id="password" type="password"
                    value={form.password} onChange={set('password')} required
                    placeholder="Password (8+ characters)" minLength={8}
                    className={field}
                  />

                  {error && <ErrBanner>{error}</ErrBanner>}

                  <div className="pt-1">
                    <PrimaryBtn loading={loading}>Create Account</PrimaryBtn>
                  </div>
                </form>

                <div className="mt-1 pt-3 border-t border-[#f0f0f0]">
                  <p className="text-center text-[13px] text-[#8e8e93]">
                    Already have an account?{' '}
                    <Link to="/login" className="text-[#b63a23] font-semibold hover:underline">
                      Sign in
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Trust badge */}
          <div className="mt-4 flex items-center gap-2.5">
            <div className="flex -space-x-1.5">
              {['#c83b22', '#e15a33', '#8a2515'].map((c, i) => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-white/35 flex items-center justify-center text-white text-[9px] font-bold"
                  style={{ background: c }}>
                  {['S', 'M', 'A'][i]}
                </div>
              ))}
            </div>
            <span className="text-[12px] text-white/60">Trusted by <strong className="text-white">500+</strong> restaurants</span>
          </div>

          {/* Footer */}
          <footer className="mt-4 flex gap-0.5 flex-wrap">
            {['Privacy', 'Terms', 'Support'].map(l => (
              <a key={l} href="#"
                className="text-[11px] text-white/36 hover:text-white tracking-wide transition-colors px-3 py-2 first:pl-0">
                {l}
              </a>
            ))}
          </footer>
        </div>
      </section>
    </main>
  )
}

/* ── Micro-components ── */

function PrimaryBtn({ loading, disabled = false, children }) {
  return (
    <button
      type="submit" disabled={loading || disabled}
      className="w-full bg-[#c83b22] text-white font-semibold text-[15px] py-[12px] rounded-xl
        hover:bg-[#dc4d2b] active:scale-[0.99] transition-all duration-200
        flex justify-center items-center gap-2
        disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ boxShadow: '0 10px 24px rgba(200,59,34,0.28)' }}
    >
      {loading ? <><SpinnerIcon size={16} /> Working...</> : children}
    </button>
  )
}

function BackBtn({ onClick, label = 'Back' }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-0.5 text-[13px] text-[#8e8e93] hover:text-[#b63a23] mb-6 transition-colors">
      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back_ios</span>
      {label}
    </button>
  )
}

function ErrBanner({ children }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#fff2f2] border border-[#fecaca] text-[13px] text-[#ba1a1a]">
      <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 16 }}>error</span>
      {children}
    </div>
  )
}
