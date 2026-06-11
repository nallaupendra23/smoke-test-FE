import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { authApi } from '../services/api'
import { SpinnerIcon } from '../components/Icons'
import signupBg from '../assets/signup-bg-robot-restaurant.png'

const field =
  'w-full bg-white/[0.88] border border-white/40 rounded-xl px-4 py-[11px] ' +
  'text-[#1d1d1f] placeholder:text-[#777276] text-[15px] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] ' +
  'focus:outline-none focus:bg-white focus:border-[#e07855] focus:ring-0 ' +
  'transition-all duration-200'

export default function ResetPassword() {
  const [searchParams]          = useSearchParams()
  const navigate                = useNavigate()
  const token                   = searchParams.get('token')

  const [newPassword, setNewPassword]       = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew]               = useState(false)
  const [showConfirm, setShowConfirm]       = useState(false)
  const [loading, setLoading]               = useState(false)
  const [error, setError]                   = useState('')
  const [success, setSuccess]               = useState(false)

  useEffect(() => {
    if (!token) setError('Invalid or missing reset link. Please request a new one.')
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await authApi.resetPassword(token, newPassword)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      const d = err.response?.data?.detail
      setError(typeof d === 'string' ? d : 'Invalid or expired reset link. Please request a new one.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      className="relative h-screen overflow-hidden"
      style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
    >
      <img
        src={signupBg} alt=""
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

          {/* Logo */}
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

          {/* Headline */}
          <div className="mb-5 max-w-[390px]">
            <h1
              className="text-[2.3rem] font-normal italic leading-[1.04] text-white sm:text-[2.75rem]"
              style={{ fontFamily: '"Noto Serif", serif' }}
            >
              {success ? 'Password updated.' : 'Create new password.'}
            </h1>
            <p className="mt-2 text-[14px] leading-relaxed text-white/64">
              {success
                ? 'You can now sign in with your new password.'
                : 'Enter and confirm your new password below.'}
            </p>
          </div>

          <div
            className="rounded-[24px] border border-white/18 bg-white/[0.86] px-5 py-5 shadow-[0_24px_80px_rgba(0,0,0,0.38)] sm:px-6 sm:py-5"
            style={{ backdropFilter: 'blur(22px)' }}
          >
            {success ? (
              /* Success state */
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-2xl bg-[#e6f4ea]/60 flex items-center justify-center mx-auto mb-5">
                  <span className="material-symbols-outlined text-[#1a7f3c] text-3xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                </div>
                <p className="font-semibold text-[#1d1d1f] mb-2">Password reset successfully</p>
                <p className="text-[13px] text-[#8e8e93] leading-relaxed mb-5">
                  Redirecting you to sign in…
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-[#c83b22] text-white font-semibold text-[15px] py-[12px] rounded-xl
                    hover:bg-[#dc4d2b] transition-all duration-200"
                  style={{ boxShadow: '0 10px 24px rgba(200,59,34,0.28)' }}
                >
                  Go to Sign In
                </button>
              </div>
            ) : (
              /* Reset form */
              <>
                <div className="mb-4">
                  <h2
                    style={{ fontFamily: '"Noto Serif", serif' }}
                    className="text-[1.55rem] font-normal text-[#1d1d1f] mb-1 leading-tight"
                  >
                    Set new password
                  </h2>
                  <p className="text-[#8e8e93] text-[14px]">Must be at least 8 characters.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-2.5">
                  {/* New password */}
                  <div className="relative">
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      required autoFocus
                      placeholder="New password"
                      className={`${field} pr-12`}
                    />
                    <button type="button" onClick={() => setShowNew(p => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8e8e93]/70 hover:text-[#8e8e93] transition-colors p-1">
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                        {showNew ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>

                  {/* Confirm password */}
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Confirm new password"
                      className={`${field} pr-12`}
                    />
                    <button type="button" onClick={() => setShowConfirm(p => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8e8e93]/70 hover:text-[#8e8e93] transition-colors p-1">
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                        {showConfirm ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#fff2f2] border border-[#fecaca] text-[13px] text-[#ba1a1a]">
                      <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 16 }}>error</span>
                      {error}
                    </div>
                  )}

                  <div className="pt-1">
                    <button
                      type="submit" disabled={loading}
                      className="w-full bg-[#c83b22] text-white font-semibold text-[15px] py-[12px] rounded-xl
                        hover:bg-[#dc4d2b] active:scale-[0.99] transition-all duration-200
                        flex justify-center items-center gap-2
                        disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ boxShadow: '0 10px 24px rgba(200,59,34,0.28)' }}
                    >
                      {loading ? <><SpinnerIcon size={16} /> Updating…</> : 'Reset Password'}
                    </button>
                  </div>
                </form>

                <div className="mt-4 pt-3 border-t border-[#f0f0f0]">
                  <p className="text-center text-[13px] text-[#8e8e93]">
                    Remember it?{' '}
                    <button onClick={() => navigate('/login')}
                      className="text-[#b63a23] font-semibold hover:underline">
                      Back to sign in
                    </button>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
