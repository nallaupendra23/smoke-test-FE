import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import { subscriptionApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { CheckIcon, CreditCardIcon, SpinnerIcon } from '../components/Icons'

/* ══════════════════════════════════════════════════════════
   PLAN THEMES
   Essential  = steel blue   (trustworthy, accessible)
   Pro        = brand terra  (hero plan, on-brand)
   Enterprise = royal violet (exclusive, elite)
══════════════════════════════════════════════════════════ */
const PLAN_THEMES = {
  essential: {
    accent:        '#1d6fcc',
    accentLight:   'rgba(29,111,204,0.08)',
    gradient:      'linear-gradient(145deg, #3b8ae3, #1d6fcc)',
    headerGradient:'linear-gradient(160deg, #3b8ae3 0%, #1a5fb4 55%, #163f8a 100%)',
    glow:          'rgba(29,111,204,0.20)',
    ring:          'rgba(29,111,204,0.16)',
    label:         'Starter',
  },
  pro: {
    accent:        '#c44228',
    accentLight:   'rgba(196,66,40,0.08)',
    gradient:      'linear-gradient(145deg, #df6040, #c44228)',
    headerGradient:'linear-gradient(160deg, #df6040 0%, #c44228 55%, #8c2918 100%)',
    glow:          'rgba(196,66,40,0.22)',
    ring:          'rgba(196,66,40,0.18)',
    label:         'Most Popular',
  },
  enterprise: {
    accent:        '#6d28d9',
    accentLight:   'rgba(109,40,217,0.08)',
    gradient:      'linear-gradient(145deg, #8b5cf6, #6d28d9)',
    headerGradient:'linear-gradient(160deg, #9168f0 0%, #6d28d9 55%, #4a1d96 100%)',
    glow:          'rgba(109,40,217,0.20)',
    ring:          'rgba(109,40,217,0.16)',
    label:         'Enterprise',
  },
}

const FALLBACK_PLANS = {
  essential: {
    name: 'Essential',
    price: 79,
    price_label: '$79/mo',
    ai_model: 'Claude Haiku',
    features: [
      'Up to 150 AI calls per month',
      '24/7 AI phone answering',
      'Order taking and confirmations',
      'SMS order notifications',
      '5 knowledge base documents',
      'Stripe payment links',
    ],
    limits: {
      calls_per_month: 150,
      documents: 5,
      menu_items: 50,
      analytics: false,
      priority_support: false,
      sms_enabled: true,
    },
  },
  pro: {
    name: 'Pro',
    price: 199,
    price_label: '$199/mo',
    ai_model: 'Claude Haiku + Sonnet',
    popular: true,
    features: [
      'Up to 500 AI calls per month',
      'Advanced order capture',
      'Full analytics dashboard',
      '20 knowledge base documents',
      'Priority support',
      'Menu and inventory insights',
    ],
    limits: {
      calls_per_month: 500,
      documents: 20,
      menu_items: 200,
      analytics: true,
      priority_support: true,
      sms_enabled: true,
    },
  },
  enterprise: {
    name: 'Enterprise',
    price: 499,
    price_label: '$499/mo',
    ai_model: 'Claude Sonnet',
    features: [
      'Up to 2,000 AI calls per month',
      'Unlimited knowledge documents',
      'Unlimited menu items',
      'Dedicated onboarding',
      'Priority support',
      'Custom restaurant workflows',
    ],
    limits: {
      calls_per_month: 2000,
      documents: -1,
      menu_items: -1,
      analytics: true,
      priority_support: true,
      sms_enabled: true,
    },
  },
}

/* ── Plan SVG icons ── */
const PLAN_ICONS = {
  essential: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.35 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 5.56 5.56l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  pro: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  enterprise: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
}

/* ── Trust signals ── */
const TRUST_ITEMS = [
  {
    label: 'Secure Stripe Checkout',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    label: 'Cancel Anytime',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10" />
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
      </svg>
    ),
  },
  {
    label: 'Instant Activation',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    label: 'Prorated Upgrades',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
]

/* ══════════════════════════════════════════════════════════
   USAGE CARD
══════════════════════════════════════════════════════════ */
function UsageCard({ used, limit, label, subtitle, color = '#2563eb', icon }) {
  const unlimited = limit === -1
  const pct = unlimited ? 0 : limit === 0 ? 0 : Math.min((used / limit) * 100, 100)
  const statusColor = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : color

  return (
    <div
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border)',
        borderRadius: 18,
        padding: '20px 22px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.08)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 11, flexShrink: 0,
            background: `${color}10`, border: `1px solid ${color}1e`,
            color, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {icon}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>{label}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{subtitle}</div>
          </div>
        </div>
        <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, color: statusColor }}>
          {unlimited ? '∞' : `${Math.round(pct)}%`}
        </div>
      </div>

      <div style={{ height: 5, borderRadius: 999, background: 'var(--surface-2)', overflow: 'hidden', marginBottom: 8 }}>
        <div style={{
          height: '100%',
          width: unlimited ? '6%' : `${pct}%`,
          borderRadius: 999,
          background: `linear-gradient(90deg, ${color}, ${statusColor})`,
          transition: 'width 1.4s cubic-bezier(0.34,1.56,0.64,1)',
        }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>{used.toLocaleString()} used</span>
        <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>
          {unlimited ? 'Unlimited' : `${limit.toLocaleString()} total`}
        </span>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   PLAN CARD
══════════════════════════════════════════════════════════ */
function PlanCard({ planKey, plan, isCurrent, onSelect, changing, index }) {
  const theme = PLAN_THEMES[planKey] || PLAN_THEMES.essential
  const isPopular = plan.popular
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="relative flex flex-col"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ animation: `fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) ${index * 100}ms both` }}
    >
      <div style={{ height: 32, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', marginBottom: 10 }}>
        {isPopular && (
          <span style={{
            background: theme.gradient,
            color: '#fff',
            fontSize: 10, fontWeight: 700,
            padding: '5px 14px', borderRadius: 999,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            boxShadow: `0 4px 16px ${theme.glow}`,
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            Most Popular
          </span>
        )}
      </div>

      {/* Card shell */}
      <div
        className="flex-1 flex flex-col overflow-hidden"
        style={{
          background: 'var(--card-bg)',
          borderRadius: 22,
          border: isCurrent || isPopular
            ? `2px solid ${theme.accent}`
            : '1.5px solid var(--border)',
          boxShadow: isPopular
            ? `0 0 0 4px ${theme.glow}18, 0 20px 56px rgba(0,0,0,0.11)`
            : hovered
              ? '0 16px 48px rgba(0,0,0,0.10)'
              : '0 2px 8px rgba(0,0,0,0.04)',
          transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
          transition: 'box-shadow 0.22s ease, transform 0.22s ease, border-color 0.22s ease',
          zIndex: isPopular ? 2 : 0,
          position: 'relative',
        }}
      >
        {/* ── Gradient header ── */}
        <div style={{
          background: theme.headerGradient,
          padding: '22px 22px 24px',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Subtle top light strip */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '45%',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, transparent 100%)',
            pointerEvents: 'none',
          }} />

          {/* Icon + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', marginBottom: 16 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 13, flexShrink: 0,
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.22)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff',
            }}>
              {PLAN_ICONS[planKey]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                {plan.name}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.62)', marginTop: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {theme.label}
              </div>
            </div>
            {isCurrent && (
              <div style={{
                fontSize: 10, fontWeight: 700,
                background: 'rgba(255,255,255,0.18)',
                color: '#fff', padding: '4px 11px', borderRadius: 999,
                textTransform: 'uppercase', letterSpacing: '0.08em',
                border: '1px solid rgba(255,255,255,0.28)',
                flexShrink: 0,
              }}>Active</div>
            )}
          </div>

          {/* Price */}
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 2, lineHeight: 1 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.72)', marginTop: 5 }}>$</span>
              <span style={{ fontSize: 50, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>
                {plan.price}
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.52)', fontWeight: 500, marginTop: 3 }}>per month · billed monthly</div>
          </div>
        </div>

        {/* ── Card body ── */}
        <div style={{ padding: '20px 22px 22px', flex: 1, display: 'flex', flexDirection: 'column' }}>

          {/* AI model chip */}
          <div style={{ marginBottom: 16 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 11, fontWeight: 700, padding: '4px 11px', borderRadius: 999,
              background: theme.accentLight, color: theme.accent,
              border: `1px solid ${theme.ring}`,
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
              </svg>
              {plan.ai_model}
            </span>
          </div>

          <div style={{ height: 1, background: 'var(--border)', marginBottom: 16 }} />

          {/* Feature list */}
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 9, flex: 1 }}>
            {plan.features.map((feat, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
                <span style={{
                  width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                  background: theme.accentLight, color: theme.accent,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CheckIcon size={9} />
                </span>
                {feat}
              </li>
            ))}
          </ul>

          {/* CTA */}
          {isCurrent ? (
            <div style={{
              width: '100%', padding: '12px 0', borderRadius: 13,
              background: theme.accentLight, color: theme.accent,
              border: `1.5px solid ${theme.ring}`,
              fontSize: 13, fontWeight: 700, textAlign: 'center',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              Your Current Plan
            </div>
          ) : (
            <>
              <button
                onClick={() => onSelect(planKey)}
                disabled={changing}
                style={{
                  width: '100%', padding: '13px 0', borderRadius: 13, border: 'none',
                  background: theme.gradient,
                  color: '#fff', fontSize: 13, fontWeight: 700,
                  cursor: changing ? 'not-allowed' : 'pointer',
                  opacity: changing ? 0.7 : 1,
                  boxShadow: hovered ? `0 6px 24px ${theme.glow}` : `0 2px 10px ${theme.glow}55`,
                  transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                  transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  letterSpacing: '-0.01em', fontFamily: 'inherit',
                }}
              >
                {changing
                  ? <><SpinnerIcon size={13} /> Processing…</>
                  : <>Get {plan.name} — ${plan.price}/mo</>
                }
              </button>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 9 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>Secure checkout · Stripe</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Billing row ── */
function BillingRow({ label, value, isLast, accent }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 0',
      borderBottom: isLast ? 'none' : '1px solid var(--border)',
    }}>
      <span style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: accent || 'var(--text-1)' }}>{value}</span>
    </div>
  )
}

/* ── FAQ accordion ── */
function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      onClick={() => setOpen(!open)}
      style={{ padding: '14px 0', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
          {question}
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)"
          strokeWidth="2" strokeLinecap="round" style={{
            flexShrink: 0, marginLeft: 16,
            transition: 'transform 0.25s ease',
            transform: open ? 'rotate(45deg)' : 'rotate(0)',
          }}>
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </div>
      <div style={{
        maxHeight: open ? 140 : 0, opacity: open ? 1 : 0, overflow: 'hidden',
        transition: 'max-height 0.32s cubic-bezier(0.4,0,0.2,1), opacity 0.22s ease',
      }}>
        <p style={{ fontSize: 13, color: 'var(--text-3)', margin: '10px 0 0', lineHeight: 1.75, paddingRight: 28 }}>
          {answer}
        </p>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   OTP MODAL
══════════════════════════════════════════════════════════ */
function OtpModal({ targetPlan, planName, email, phone, devOtp, onVerify, onClose, verifying }) {
  const [digits, setDigits]   = useState(['', '', '', '', '', ''])
  const [error, setError]     = useState('')
  const [resending, setResending] = useState(false)
  const [resent, setResent]   = useState(false)
  const theme = PLAN_THEMES[targetPlan] || PLAN_THEMES.pro

  const handleDigit = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const next = [...digits]; next[index] = value.slice(-1); setDigits(next); setError('')
    if (value && index < 5) document.getElementById(`otp-d-${index + 1}`)?.focus()
  }
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) document.getElementById(`otp-d-${index - 1}`)?.focus()
    if (e.key === 'Enter' && digits.join('').length === 6) onVerify(digits.join(''))
  }
  const handlePaste = (e) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const next = [...digits]; for (let i = 0; i < text.length; i++) next[i] = text[i]; setDigits(next)
    if (text.length === 6) document.getElementById('otp-d-5')?.focus()
  }
  const handleResend = async () => {
    setResending(true); setResent(false)
    try { await subscriptionApi.sendPlanOtp(targetPlan); setResent(true); setTimeout(() => setResent(false), 3000) } catch {}
    setResending(false)
  }

  const code = digits.join('')
  const isComplete = code.length === 6

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.50)', backdropFilter: 'blur(16px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--card-bg)',
          borderRadius: 26, width: '100%', maxWidth: 420,
          padding: '0 0 28px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.26), 0 0 0 1px rgba(0,0,0,0.06)',
          animation: 'fadeInUp 0.3s cubic-bezier(0.16,1,0.3,1)',
          overflow: 'hidden', position: 'relative',
        }}
      >
        {/* Top accent stripe */}
        <div style={{ height: 4, background: theme.gradient }} />

        {/* Icon + title */}
        <div style={{ textAlign: 'center', padding: '28px 28px 0' }}>
          <div style={{
            width: 54, height: 54, borderRadius: 16, margin: '0 auto 14px',
            background: theme.gradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 8px 24px ${theme.glow}`,
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', margin: '0 0 8px', letterSpacing: '-0.03em' }}>
            Verify your identity
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0, lineHeight: 1.65 }}>
            Enter the 6-digit code sent to<br />
            <strong style={{ color: 'var(--text-1)' }}>{email}</strong>
            {phone && <><br />and <strong style={{ color: 'var(--text-1)' }}>{phone}</strong></>}
          </p>
        </div>

        <div style={{ padding: '20px 28px 0' }}>
          {devOtp && (
            <div style={{
              background: '#fffbeb', border: '1px solid #fde68a',
              borderRadius: 10, padding: '9px 14px', marginBottom: 18,
              textAlign: 'center', fontSize: 12, color: '#92400e',
            }}>
              Dev mode — your code: <strong style={{ letterSpacing: 3, fontSize: 14 }}>{devOtp}</strong>
            </div>
          )}

          {/* OTP digits */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
            {digits.map((d, i) => (
              <input
                key={i}
                id={`otp-d-${i}`}
                type="text" inputMode="numeric" maxLength={1}
                value={d}
                onChange={e => handleDigit(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                onPaste={i === 0 ? handlePaste : undefined}
                autoFocus={i === 0}
                style={{
                  width: 48, height: 56, borderRadius: 13,
                  border: `2px solid ${d ? theme.accent : 'var(--border)'}`,
                  background: d ? theme.accentLight : 'var(--surface-2)',
                  fontSize: 22, fontWeight: 800, textAlign: 'center',
                  color: 'var(--text-1)', outline: 'none',
                  transition: 'all 0.15s ease',
                  boxShadow: d ? `0 0 0 3px ${theme.ring}` : 'none',
                  fontFamily: 'inherit',
                }}
                onFocus={e => {
                  e.target.style.borderColor = theme.accent
                  e.target.style.boxShadow = `0 0 0 3px ${theme.ring}`
                  e.target.style.background = 'var(--card-bg)'
                }}
                onBlur={e => {
                  if (!d) {
                    e.target.style.borderColor = 'var(--border)'
                    e.target.style.boxShadow = 'none'
                    e.target.style.background = 'var(--surface-2)'
                  }
                }}
              />
            ))}
          </div>

          {error && <p style={{ fontSize: 13, color: '#ef4444', textAlign: 'center', margin: '0 0 12px' }}>{error}</p>}

          <button
            onClick={() => isComplete && onVerify(code)}
            disabled={!isComplete || verifying}
            style={{
              width: '100%', padding: '14px 0', borderRadius: 13, border: 'none',
              background: isComplete ? theme.gradient : 'var(--border)',
              color: isComplete ? '#fff' : 'var(--text-3)',
              fontSize: 14, fontWeight: 700, cursor: isComplete ? 'pointer' : 'default',
              opacity: verifying ? 0.7 : 1, transition: 'all 0.2s',
              boxShadow: isComplete ? `0 4px 20px ${theme.glow}` : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              fontFamily: 'inherit',
            }}
          >
            {verifying ? <><SpinnerIcon size={15} /> Verifying…</> : `Confirm & Switch to ${planName}`}
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
            <button onClick={handleResend} disabled={resending} style={{
              background: 'none', border: 'none', fontSize: 13, fontWeight: 600,
              color: resent ? '#16a34a' : theme.accent, cursor: 'pointer', padding: 0, fontFamily: 'inherit',
            }}>
              {resent ? 'Code resent!' : resending ? 'Sending…' : 'Resend code'}
            </button>
            <button onClick={onClose} style={{
              background: 'none', border: 'none', fontSize: 13, color: 'var(--text-3)', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

/* ══════════════════════════════════════════════════════════
   PLAN DETAILS MODAL
══════════════════════════════════════════════════════════ */
function PlanDetailsModal({ currentPlan, plans, billing, usage, onClose, onSelectPlan, changing }) {
  const planCatalog = Object.fromEntries(
    Object.entries({ ...FALLBACK_PLANS, ...(plans || {}) }).map(([key, plan]) => {
      const fallback = FALLBACK_PLANS[key] || {}
      return [key, {
        ...fallback,
        ...plan,
        limits: { ...(fallback.limits || {}), ...(plan?.limits || {}) },
        features: plan?.features?.length ? plan.features : fallback.features || [],
      }]
    })
  )
  const current = planCatalog[currentPlan] || planCatalog.essential
  const theme = PLAN_THEMES[currentPlan] || PLAN_THEMES.essential
  const options = Object.entries(planCatalog)

  const limitItems = [
    ['Calls / month', current.limits?.calls_per_month === -1 ? 'Unlimited' : current.limits?.calls_per_month?.toLocaleString()],
    ['Knowledge docs', current.limits?.documents === -1 ? 'Unlimited' : current.limits?.documents?.toLocaleString()],
    ['Menu items', current.limits?.menu_items === -1 ? 'Unlimited' : current.limits?.menu_items?.toLocaleString()],
    ['Analytics', current.limits?.analytics ? 'Included' : 'Basic'],
    ['Support', current.limits?.priority_support ? 'Priority' : 'Email'],
    ['SMS', current.limits?.sms_enabled ? 'Included' : 'Not included'],
  ]

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(8,21,37,0.46)', backdropFilter: 'blur(14px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, animation: 'fadeIn 0.18s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(920px, 100%)',
          maxHeight: 'calc(100vh - 48px)',
          overflow: 'auto',
          background: 'var(--card-bg)',
          borderRadius: 24,
          boxShadow: '0 30px 80px rgba(8,21,37,0.28)',
          border: '1px solid rgba(255,255,255,0.70)',
          animation: 'fadeInUp 0.24s ease',
        }}
      >
        <div style={{
          padding: '24px 28px',
          background: theme.headerGradient,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 18,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 15,
              background: 'rgba(255,255,255,0.16)',
              border: '1px solid rgba(255,255,255,0.24)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {PLAN_ICONS[currentPlan]}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.72 }}>
                Current plan
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.03em', marginTop: 2 }}>
                {current.name}
              </div>
              <div style={{ fontSize: 13, opacity: 0.68, marginTop: 2 }}>{current.price_label} · {current.ai_model}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 34, height: 34, borderRadius: 11,
              border: '1px solid rgba(255,255,255,0.24)',
              background: 'rgba(255,255,255,0.12)',
              color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, lineHeight: 1,
            }}
            aria-label="Close plan details"
          >
            ×
          </button>
        </div>

        <div style={{ padding: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 20 }}>
            <div className="card" style={{ padding: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12 }}>Plan usage</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  ['AI calls', `${usage.calls_used || 0} / ${usage.calls_limit === -1 ? '∞' : usage.calls_limit || 0}`],
                  ['Documents', `${usage.documents_used || 0} / ${usage.documents_limit === -1 ? '∞' : usage.documents_limit || 0}`],
                  ['Next invoice', billing.next_billing_date ? new Date(billing.next_billing_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'],
                  ['Payment', billing.payment_method || 'No card'],
                ].map(([label, value]) => (
                  <div key={label} style={{ padding: 12, borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                    <div style={{ fontSize: 15, color: 'var(--text-1)', fontWeight: 800, marginTop: 4 }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{ padding: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12 }}>Included limits</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {limitItems.map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{label}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-1)', fontWeight: 800 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 900 }}>Compare plans</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Review what you have now and choose an upgrade when you are ready.</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {options.map(([key, plan]) => {
                const optionTheme = PLAN_THEMES[key] || PLAN_THEMES.essential
                const selected = key === currentPlan
                return (
                  <div
                    key={key}
                    style={{
                      borderRadius: 16,
                      border: selected ? `2px solid ${optionTheme.accent}` : '1px solid var(--border)',
                      background: selected ? optionTheme.accentLight : 'var(--surface-1)',
                      padding: 16,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 10,
                        color: optionTheme.accent,
                        background: optionTheme.accentLight,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {PLAN_ICONS[key]}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 900 }}>{plan.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{plan.price_label}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.55, minHeight: 58 }}>
                      {plan.features.slice(0, 3).join(' · ')}
                    </div>
                    <button
                      onClick={() => {
                        if (!selected) {
                          onClose()
                          onSelectPlan(key)
                        }
                      }}
                      disabled={selected || changing === key}
                      style={{
                        width: '100%',
                        marginTop: 14,
                        padding: '10px 0',
                        borderRadius: 12,
                        border: selected ? `1px solid ${optionTheme.ring}` : 'none',
                        background: selected ? 'var(--card-bg)' : optionTheme.gradient,
                        color: selected ? optionTheme.accent : '#fff',
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: selected ? 'default' : 'pointer',
                        opacity: changing === key ? 0.65 : 1,
                        fontFamily: 'inherit',
                      }}
                    >
                      {selected ? 'Current Plan' : changing === key ? 'Processing…' : `Switch to ${plan.name}`}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function Subscription() {
  const location = useLocation()
  const navigate = useNavigate()
  const { owner, setOwner }     = useAuth()
  const [plans, setPlans]       = useState(null)
  const [subscription, setSub]  = useState(null)
  const [loading, setLoading]   = useState(true)
  const [changing, setChanging] = useState(null)
  const [message, setMessage]   = useState(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [otpModal, setOtpModal] = useState(null)
  const [otpVerifying, setOtpVerifying]   = useState(false)
  const [showPlanDetails, setShowPlanDetails] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const payment = params.get('payment')
    const plan    = params.get('plan')
    if (payment === 'success' && plan) {
      setMessage({ type: 'success', text: `Payment successful! You're now on the ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan.` })
      if (owner) { const u = { ...owner, plan }; setOwner(u); localStorage.setItem('owner', JSON.stringify(u)) }
      window.history.replaceState({}, '', '/subscription')
    } else if (payment === 'cancelled') {
      setMessage({ type: 'error', text: 'Payment was cancelled. You can try again anytime.' })
      window.history.replaceState({}, '', '/subscription')
    }
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('details') === 'plan') {
      setShowPlanDetails(true)
      navigate('/subscription', { replace: true })
    }
  }, [location.search, navigate])

  useEffect(() => {
    Promise.all([subscriptionApi.getPlans(), subscriptionApi.getCurrent()])
      .then(([p, s]) => { setPlans(p.data.plans); setSub(s.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handlePlanChange = async (newPlan) => {
    setChanging(newPlan); setMessage(null)
    try {
      const res = await subscriptionApi.sendPlanOtp(newPlan)
      setOtpModal({
        plan: newPlan,
        planName: plans?.[newPlan]?.name || newPlan,
        email: res.data.email,
        phone: res.data.phone,
        devOtp: res.data.otp || null,
      })
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to send verification code' })
      setTimeout(() => setMessage(null), 5000)
    } finally { setChanging(null) }
  }

  const handleOtpVerify = async (code) => {
    if (!otpModal) return
    setOtpVerifying(true)
    try {
      const res = await subscriptionApi.createCheckout(otpModal.plan, code)
      if (res.data.mode === 'live' && res.data.redirect_url) { window.location.href = res.data.redirect_url; return }
      setOtpModal(null)
      setMessage({ type: 'success', text: res.data.message })
      const subRes = await subscriptionApi.getCurrent(); setSub(subRes.data)
      if (owner) { const u = { ...owner, plan: otpModal.plan }; setOwner(u); localStorage.setItem('owner', JSON.stringify(u)) }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Verification failed' })
    } finally {
      setOtpVerifying(false); setTimeout(() => setMessage(null), 8000)
    }
  }

  const handleManageBilling = async () => {
    setPortalLoading(true)
    try {
      const res = await subscriptionApi.createPortal()
      if (res.data.portal_url) window.location.href = res.data.portal_url
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Unable to open billing portal. Subscribe to a plan first.' })
      setPortalLoading(false); setTimeout(() => setMessage(null), 5000)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <SpinnerIcon size={24} />
        </div>
      </Layout>
    )
  }

  const currentPlan  = subscription?.current_plan || 'essential'
  const billing      = subscription?.billing || {}
  const usage        = subscription?.usage || {}
  const currentTheme = PLAN_THEMES[currentPlan] || PLAN_THEMES.essential

  return (
    <Layout>
      {/* Page ambient wash — shifts per plan */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `linear-gradient(180deg, ${currentTheme.accentLight} 0%, rgba(246,247,251,0) 42%)`,
        transition: 'background 0.8s ease',
      }} />

      <div className="app-page" style={{ zIndex: 1 }}>

        <PageHeader
          icon={CreditCardIcon}
          title="Subscription"
          subtitle="Simple, transparent pricing. Upgrade or downgrade at any time with no lock-in."
          accent={currentTheme.accent}
          accentBg={currentTheme.accentLight}
        >
          <button
            type="button"
            onClick={() => setShowPlanDetails(true)}
            title="View current plan details"
            style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '7px 14px', borderRadius: 999,
            background: currentTheme.accentLight,
            border: `1px solid ${currentTheme.ring}`,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: currentTheme.accent,
              boxShadow: `0 0 6px ${currentTheme.accent}`,
            }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: currentTheme.accent, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {currentPlan} Plan · Active
            </span>
          </button>
        </PageHeader>

        {/* Alert banner */}
        {message && (
          <div style={{
            marginBottom: 28, borderRadius: 14, padding: '13px 18px',
            display: 'flex', alignItems: 'center', gap: 10,
            animation: 'fadeInUp 0.3s ease both',
            background: message.type === 'success' ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
            color: message.type === 'success' ? '#16a34a' : '#dc2626',
            border: `1px solid ${message.type === 'success' ? 'rgba(34,197,94,0.18)' : 'rgba(239,68,68,0.18)'}`,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              {message.type === 'success'
                ? <><circle cx="12" cy="12" r="10" /><path d="M9 12l2 2 4-4" /></>
                : <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>}
            </svg>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{message.text}</span>
          </div>
        )}

        {/* ══ PLAN CARDS ═══════════════════════════════════════ */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 18, marginBottom: 20, alignItems: 'stretch',
          animation: 'fadeInUp 0.5s ease 0.06s both',
        }}>
          {plans && Object.entries(plans).map(([key, plan], index) => (
            <PlanCard
              key={key} planKey={key} plan={plan}
              isCurrent={key === currentPlan}
              onSelect={handlePlanChange}
              changing={changing === key}
              index={index}
            />
          ))}
        </div>

        {/* ══ TRUST STRIP ══════════════════════════════════════ */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          borderRadius: 18,
          background: 'var(--card-bg)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          marginBottom: 36,
          animation: 'fadeInUp 0.5s ease 0.14s both',
        }}>
          {TRUST_ITEMS.map((t, i) => (
            <div key={t.label} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '16px 20px',
              borderRight: i < TRUST_ITEMS.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-3)',
              }}>
                {t.icon}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', lineHeight: 1.35 }}>{t.label}</span>
            </div>
          ))}
        </div>

        {/* ══ USAGE + BILLING (2-col) ═══════════════════════════ */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 20, marginBottom: 36,
          alignItems: 'stretch',
          animation: 'fadeInUp 0.5s ease 0.20s both',
        }}>
          {/* ── Usage column ── */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Usage This Period</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Current billing cycle</div>
              </div>
              <div style={{
                fontSize: 11, fontWeight: 600, padding: '5px 11px', borderRadius: 9,
                background: 'var(--card-bg)', border: '1px solid var(--border)',
                color: 'var(--text-3)',
              }}>
                Resets {billing.next_billing_date
                  ? new Date(billing.next_billing_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : 'N/A'}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
              <UsageCard
                used={usage.calls_used || 0}
                limit={usage.calls_limit || 100}
                label="AI Phone Calls"
                subtitle="Inbound calls handled by AI"
                color={currentTheme.accent}
                icon={
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.35 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 5.56 5.56l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                }
              />
              <UsageCard
                used={usage.documents_used || 0}
                limit={usage.documents_limit || 1}
                label="Knowledge Docs"
                subtitle="Uploaded docs powering your AI"
                color="#22c55e"
                icon={
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                }
              />
            </div>
          </div>

          {/* ── Billing column ── */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Billing</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Plan and payment details</div>
            </div>

            <div style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: 18,
              overflow: 'hidden',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              flex: 1,
            }}>
              {/* Header band */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 11,
                padding: '14px 20px',
                background: 'var(--surface-2)',
                borderBottom: '1px solid var(--border)',
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: 'var(--primary-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>Payment Method</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>Managed securely by Stripe</div>
                </div>
              </div>

              <div style={{ padding: '4px 20px 0' }}>
                <BillingRow
                  label="Current Plan"
                  value={<span style={{ textTransform: 'capitalize' }}>{currentPlan}</span>}
                  accent={currentTheme.accent}
                />
                <BillingRow label="Monthly" value={billing.price_label || '$0'} />
                <BillingRow
                  label="Next Invoice"
                  value={billing.next_billing_date
                    ? new Date(billing.next_billing_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'N/A'}
                />
                <BillingRow label="Payment" value={billing.payment_method || 'No card on file'} isLast />
              </div>

              <div style={{ padding: '4px 20px 18px' }}>
                <button
                  onClick={handleManageBilling}
                  disabled={portalLoading}
                  style={{
                    width: '100%', padding: '11px 0',
                    borderRadius: 11, border: '1.5px solid var(--border)',
                    background: 'var(--surface-2)', color: 'var(--text-1)',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    transition: 'all 0.15s ease', fontFamily: 'inherit',
                    opacity: portalLoading ? 0.6 : 1,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--card-bg)'; e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-1)' }}
                >
                  {portalLoading
                    ? <><SpinnerIcon size={13} /> Opening…</>
                    : <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
                        </svg>
                        Manage Billing
                      </>
                  }
                </button>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 9 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Secured by Stripe</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/*
        FAQ hidden for now.
        <div style={{
          borderRadius: 22, padding: '24px 28px',
          maxWidth: 700, margin: '0 auto',
          background: 'var(--card-bg)', border: '1px solid var(--border)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          animation: 'fadeInUp 0.5s ease 0.26s both',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-3)', flexShrink: 0,
            }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
                Frequently Asked Questions
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>
                Everything you need to know about pricing
              </div>
            </div>
          </div>
          <FaqItem question="Can I change my plan at any time?" answer="Yes. Upgrade or downgrade whenever you like. Changes take effect immediately and your billing is prorated automatically." />
          <FaqItem question="What happens if I exceed my call limit?" answer="We'll notify you at 80% usage. Additional calls beyond your limit are billed at $0.50 each. Upgrade for a higher limit." />
          <FaqItem question="Do you offer annual billing?" answer="Yes. Annual plans include a 20% discount. Contact our team to switch to yearly billing." />
          <FaqItem question="Can I cancel my subscription?" answer="Cancel anytime from Settings → Account. Your service continues through the end of the current billing period with no further charges." />
        </div>
        */}

        <div style={{ height: 48 }} />
      </div>

      {otpModal && (
        <OtpModal
          targetPlan={otpModal.plan}
          planName={otpModal.planName}
          email={otpModal.email}
          phone={otpModal.phone}
          devOtp={otpModal.devOtp}
          onVerify={handleOtpVerify}
          onClose={() => setOtpModal(null)}
          verifying={otpVerifying}
        />
      )}
      {showPlanDetails && (
        <PlanDetailsModal
          currentPlan={currentPlan}
          plans={plans}
          billing={billing}
          usage={usage}
          changing={changing}
          onClose={() => setShowPlanDetails(false)}
          onSelectPlan={handlePlanChange}
        />
      )}
    </Layout>
  )
}
