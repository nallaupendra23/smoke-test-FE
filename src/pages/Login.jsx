import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { SpinnerIcon } from '../components/Icons'
import { authApi } from '../services/api'
import signupBg from '../assets/signup-bg-robot-restaurant.png'

const field =
  'w-full bg-white/[0.88] border border-white/40 rounded-xl px-4 py-[11px] ' +
  'text-[#1d1d1f] placeholder:text-[#777276] text-[15px] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] ' +
  'focus:outline-none focus:bg-white focus:border-[#e07855] focus:ring-0 ' +
  'transition-all duration-200'

export default function Login() {
  const [mode, setMode]             = useState('login')
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [showPw, setShowPw]         = useState(false)
  const [otpCode, setOtpCode]       = useState('')
  const [devOtp, setDevOtp]         = useState('')
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [forgotSent, setForgotSent] = useState(false)
  const { loginRequest, login }     = useAuth()
  const navigate                    = useNavigate()

  const apiErr = (err, fallback) => {
    const d = err.response?.data?.detail
    if (Array.isArray(d)) return d.map(e => e.msg).join(' · ')
    return d || fallback
  }

  const handleLogin = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const res = await loginRequest(email, password)
      if (res.access_token) { navigate('/dashboard'); return }
      setDevOtp(res.otp || ''); setMode('otp')
    } catch (err) {
      setError(apiErr(err, 'Invalid email or password.'))
    } finally { setLoading(false) }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await login(email, otpCode); navigate('/dashboard')
    } catch (err) {
      setError(apiErr(err, 'Invalid or expired verification code.'))
    } finally { setLoading(false) }
  }

  const handleForgot = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await authApi.forgotPassword(email)
      setForgotSent(true)
    } catch (err) {
      setError(apiErr(err, 'Something went wrong. Please try again.'))
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
              Welcome back to service.
            </h1>
            <p className="mt-2 text-[14px] leading-relaxed text-white/64">
              Sign in to monitor live orders, tune your AI agent, and keep every guest call moving.
            </p>
          </div>

          <div
            className="rounded-[24px] border border-white/18 bg-white/[0.86] px-5 py-5 shadow-[0_24px_80px_rgba(0,0,0,0.38)] sm:px-6 sm:py-5"
            style={{ backdropFilter: 'blur(22px)' }}
          >

            {/* OTP step */}
            {mode === 'otp' && (
              <>
                <BackBtn onClick={() => { setMode('login'); setOtpCode(''); setDevOtp(''); setError('') }} />
                <div className="mb-4">
                  <h1 style={{ fontFamily: '"Noto Serif", serif' }}
                    className="text-[1.55rem] font-normal text-[#1d1d1f] mb-1.5 leading-tight">
                    Verify email
                  </h1>
                  <p className="text-[#8e8e93] text-[14px] leading-relaxed">
                    We sent a code to{' '}
                    <span className="text-[#1d1d1f] font-semibold">{email}</span>
                  </p>
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
                    Verify &amp; Sign In
                  </PrimaryBtn>
                </form>
                <p className="mt-4 text-center text-[13px] text-[#8e8e93]">
                  Didn't receive it?{' '}
                  <button onClick={() => { setMode('login'); setOtpCode(''); setDevOtp(''); setError('') }}
                    className="text-[#b63a23] font-semibold hover:underline">
                    Resend
                  </button>
                </p>
              </>
            )}

            {/* Login step */}
            {mode === 'login' && (
              <>
                <div className="mb-4">
                  <h1 style={{ fontFamily: '"Noto Serif", serif' }}
                    className="text-[1.55rem] font-normal text-[#1d1d1f] mb-1 leading-tight">
                    Sign in
                  </h1>
                  <p className="text-[#8e8e93] text-[14px]">to continue to your dashboard</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-2.5">
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    required autoFocus placeholder="Email" className={field}
                  />
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'} value={password}
                      onChange={e => setPassword(e.target.value)}
                      required placeholder="Password" className={`${field} pr-12`}
                    />
                    <button type="button" onClick={() => setShowPw(p => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8e8e93]/70 hover:text-[#8e8e93] transition-colors p-1">
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                        {showPw ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                  <div className="flex justify-end">
                    <button type="button"
                      onClick={() => { setMode('forgot'); setError(''); setForgotSent(false) }}
                      className="text-[12px] text-[#b63a23] hover:underline font-semibold py-1">
                      Forgot password?
                    </button>
                  </div>
                  {error && <ErrBanner>{error}</ErrBanner>}
                  <div className="pt-1"><PrimaryBtn loading={loading}>Sign In</PrimaryBtn></div>
                </form>
                <div className="mt-1 pt-3 border-t border-[#f0f0f0]">
                  <p className="text-center text-[13px] text-[#8e8e93]">
                    New to RingZ.ai?{' '}
                    <Link to="/signup" className="text-[#b63a23] font-semibold hover:underline">
                      Create an account
                    </Link>
                  </p>
                </div>
              </>
            )}

            {/* Forgot password */}
            {mode === 'forgot' && (
              <>
                <BackBtn onClick={() => { setMode('login'); setForgotSent(false); setError('') }} label="Sign in" />
                <div className="mb-4">
                  <h1 style={{ fontFamily: '"Noto Serif", serif' }}
                    className="text-[1.55rem] font-normal text-[#1d1d1f] mb-1 leading-tight">
                    Reset password
                  </h1>
                  <p className="text-[#8e8e93] text-[14px]">Enter your email and we'll send a reset link.</p>
                </div>
                {forgotSent ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-2xl bg-[#ffdad3]/50 flex items-center justify-center mx-auto mb-5">
                      <span className="material-symbols-outlined text-[#b63a23] text-2xl"
                        style={{ fontVariationSettings: "'FILL' 1" }}>
                        mark_email_read
                      </span>
                    </div>
                    <p className="font-semibold text-[#1d1d1f] mb-2">Check your inbox</p>
                    <p className="text-[13px] text-[#8e8e93] leading-relaxed max-w-[240px] mx-auto">
                      If <span className="text-[#1d1d1f] font-medium">{email}</span> has an account,
                      you'll receive a reset link shortly.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleForgot} className="space-y-2.5">
                    <input
                      type="email" value={email} onChange={e => setEmail(e.target.value)}
                      required autoFocus placeholder="Email" className={field}
                    />
                    {error && <ErrBanner>{error}</ErrBanner>}
                    <PrimaryBtn loading={loading}>Send Reset Link</PrimaryBtn>
                  </form>
                )}
              </>
            )}
          </div>

          {/* Trust badge */}
          <div className="mt-4 flex items-center gap-2.5">
            <div className="flex -space-x-1.5">
              {['#c83b22', '#e15a33', '#8a2515'].map((c, i) => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-white/35 flex items-center justify-center text-white text-[9px] font-bold"
                  style={{ background: c }}>
                  {['M', 'A', 'J'][i]}
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
