import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import { SettingsIcon } from '../components/Icons'
import { restaurantApi, authApi, subscriptionApi } from '../services/api'

/* ── Constants ── */
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
const SHORT = { Monday:'Mon', Tuesday:'Tue', Wednesday:'Wed', Thursday:'Thu', Friday:'Fri', Saturday:'Sat', Sunday:'Sun' }
const DEFAULT_HOURS = {
  Monday:    { open: '11:00', close: '22:00', closed: false },
  Tuesday:   { open: '11:00', close: '22:00', closed: false },
  Wednesday: { open: '11:00', close: '22:00', closed: false },
  Thursday:  { open: '11:00', close: '22:00', closed: false },
  Friday:    { open: '11:00', close: '23:00', closed: false },
  Saturday:  { open: '11:00', close: '23:00', closed: false },
  Sunday:    { open: '12:00', close: '21:00', closed: false },
}
const TIMEZONES = [
  { value: 'America/New_York',    label: 'Eastern Time',  short: 'ET' },
  { value: 'America/Chicago',     label: 'Central Time',  short: 'CT' },
  { value: 'America/Denver',      label: 'Mountain Time', short: 'MT' },
  { value: 'America/Los_Angeles', label: 'Pacific Time',  short: 'PT' },
]
const ROLES = ['Manager','Chef','Server','Host','Bartender','Delivery','Cashier','Busser']
const ROLE_COLORS = {
  Manager:  { bg: '#EEF2FF', text: '#4338CA', dot: '#6366F1' },
  Chef:     { bg: '#FFF7ED', text: '#C2410C', dot: '#F97316' },
  Server:   { bg: '#F0FDF4', text: '#166534', dot: '#22C55E' },
  Host:     { bg: '#FDF4FF', text: '#86198F', dot: '#D946EF' },
  Bartender:{ bg: '#FEF9C3', text: '#854D0E', dot: '#EAB308' },
  Delivery: { bg: '#ECFEFF', text: '#155E75', dot: '#06B6D4' },
  Cashier:  { bg: '#FFF1F2', text: '#9F1239', dot: '#FB7185' },
  Busser:   { bg: '#F1F5F9', text: '#475569', dot: '#64748B' },
}

/* ── Helpers ── */
function parseOldHours(str) {
  try {
    const parsed = JSON.parse(str)
    if (parsed.Monday?.open) return parsed
    const result = {}
    for (const [day, val] of Object.entries(parsed)) {
      if (val === 'Closed' || val === 'closed') {
        result[day] = { open: '11:00', close: '22:00', closed: true }
      } else {
        result[day] = { open: '11:00', close: '22:00', closed: false }
      }
    }
    return result
  } catch { return DEFAULT_HOURS }
}

/* ── Small Components ── */

function ToggleSwitch({ checked, onChange, size = 'md' }) {
  const w = size === 'sm' ? 36 : 44
  const h = size === 'sm' ? 20 : 24
  const dot = size === 'sm' ? 14 : 18
  const pad = 3
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      style={{
        width: w, height: h, borderRadius: h,
        background: checked ? 'var(--primary)' : 'var(--surface-4)',
        padding: 0,
        display: 'inline-flex',
        alignItems: 'center',
        transition: 'background 0.2s ease',
        cursor: 'pointer', border: 'none', flexShrink: 0,
        position: 'relative',
        verticalAlign: 'middle',
      }}
    >
      <div style={{
        position: 'absolute',
        top: pad,
        left: checked ? w - dot - pad : pad,
        width: dot, height: dot, borderRadius: '50%',
        background: '#FFF',
        boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
        transition: 'left 0.2s ease',
      }} />
    </button>
  )
}

function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div style={{
      position: 'fixed', top: 20, right: 20, zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 18px',
      background: type === 'success' ? '#F0FDF4' : '#FEF2F2',
      border: `1px solid ${type === 'success' ? '#BBF7D0' : '#FECACA'}`,
      borderRadius: 10,
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%',
        background: type === 'success' ? '#22C55E' : '#EF4444',
        flexShrink: 0,
      }} />
      <span style={{ fontSize: 13, fontWeight: 500, color: type === 'success' ? '#166534' : '#991B1B' }}>
        {message}
      </span>
    </div>
  )
}

function Card({ title, description, children, style: extraStyle }) {
  return (
    <div style={{
      background: 'var(--card-bg)',
      border: '1px solid var(--border)',
      borderRadius: 16,
      padding: '24px',
      boxShadow: 'var(--shadow-xs)',
      ...extraStyle,
    }}>
      {title && (
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', margin: 0, letterSpacing: '-0.01em' }}>{title}</h3>
          {description && <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 3, margin: '3px 0 0' }}>{description}</p>}
        </div>
      )}
      {children}
    </div>
  )
}

function Label({ children }) {
  return <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }}>{children}</label>
}

function Hint({ children }) {
  return <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4, margin: 0 }}>{children}</p>
}

function Input({ value, onChange, placeholder, type = 'text', disabled, style: extraStyle, ...rest }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: '100%', boxSizing: 'border-box',
        padding: '9px 12px',
        fontSize: 14, fontFamily: 'inherit',
        color: disabled ? 'var(--text-3)' : 'var(--text-1)',
        background: disabled ? 'var(--surface-2)' : 'var(--surface-2)',
        border: `1.5px solid ${focused ? 'var(--primary)' : 'transparent'}`,
        borderRadius: 10,
        outline: 'none',
        transition: 'border-color 0.15s ease, background 0.15s ease',
        ...extraStyle,
      }}
      {...rest}
    />
  )
}

function Btn({ children, onClick, disabled, variant = 'primary', size = 'md', style: extraStyle, ...rest }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    fontFamily: 'inherit', fontWeight: 500, cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none', borderRadius: 8, transition: 'all 0.15s ease',
    opacity: disabled ? 0.6 : 1,
  }
  const sizes = {
    sm: { padding: '6px 12px', fontSize: 13 },
    md: { padding: '9px 16px', fontSize: 14 },
    lg: { padding: '11px 20px', fontSize: 14 },
  }
  const variants = {
    primary: { background: 'var(--primary)', color: '#FFF' },
    secondary: { background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)' },
    danger: { background: 'var(--card-bg)', color: '#DC2626', border: '1px solid #FECACA' },
    'danger-solid': { background: '#DC2626', color: '#FFF' },
    ghost: { background: 'transparent', color: 'var(--text-3)' },
  }
  return (
    <button
      onClick={onClick} disabled={disabled}
      style={{ ...base, ...sizes[size], ...variants[variant], ...extraStyle }}
      {...rest}
    >
      {children}
    </button>
  )
}

/* ── OTP Input ── */
function OtpInput({ value, onChange }) {
  const inputsRef = useRef([])

  const handleChange = (i, val) => {
    if (!/^\d*$/.test(val)) return
    const digits = value.split('')
    while (digits.length < 6) digits.push('')
    digits[i] = val.slice(-1)
    const newVal = digits.join('')
    onChange(newVal)
    if (val && i < 5) inputsRef.current[i + 1]?.focus()
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) {
      inputsRef.current[i - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    onChange(pasted)
    const focusIdx = Math.min(pasted.length, 5)
    inputsRef.current[focusIdx]?.focus()
  }

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {[0,1,2,3,4,5].map(i => (
        <input
          key={i}
          ref={el => inputsRef.current[i] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          style={{
            width: 42, height: 46,
            textAlign: 'center',
            fontSize: 20, fontWeight: 600, fontFamily: 'inherit',
            border: `1.5px solid ${value[i] ? 'var(--primary)' : 'var(--border)'}`,
            borderRadius: 10,
            outline: 'none',
            color: 'var(--text-1)',
            background: 'var(--surface-2)',
            transition: 'border-color 0.15s ease',
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.background = 'var(--card-bg)' }}
          onBlur={e => { if (!value[i]) { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--surface-2)' } }}
        />
      ))}
    </div>
  )
}

/* ── Security Disclosure Row ── */
function SecRow({ id, isOpen, onToggle, iconBg, iconStroke, icon, label, value, valueStyle, actionLabel, children }) {
  return (
    <div>
      <button
        onClick={() => onToggle(id)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 14,
          padding: '16px 24px', background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left', fontFamily: 'inherit', transition: 'background 0.12s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={iconStroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>{label}</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1, ...valueStyle, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {!isOpen && <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)' }}>{actionLabel}</span>}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round"
            style={{ transition: 'transform 0.25s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </button>
      {isOpen && (
        <div style={{ padding: '4px 24px 24px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          {children}
        </div>
      )}
    </div>
  )
}

/* ── Employee Modal ── */
function EmployeeModal({ employee, onSave, onClose }) {
  const [form, setForm] = useState(employee || {
    name: '', role: 'Server', phone: '', email: '',
    schedule: DAYS.reduce((acc, d) => ({ ...acc, [d]: { start: '09:00', end: '17:00', off: false } }), {}),
  })

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.35)',
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--card-bg)', border: '1px solid var(--border)',
        borderRadius: 20, width: '100%', maxWidth: 520,
        maxHeight: '85vh', overflow: 'auto',
        padding: 24, boxShadow: 'var(--shadow-xl)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-1)', margin: 0, letterSpacing: '-0.02em' }}>
            {employee ? 'Edit Employee' : 'Add Employee'}
          </h3>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)',
            background: 'var(--surface-2)', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <Label>Full Name</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="John Doe" />
          </div>
          <div>
            <Label>Role</Label>
            <select
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '9px 12px', fontSize: 14, fontFamily: 'inherit',
                color: 'var(--text-1)', background: 'var(--surface-2)',
                border: '1.5px solid transparent', borderRadius: 10,
                outline: 'none', cursor: 'pointer',
              }}
            >
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <Label>Phone</Label>
            <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(555) 123-4567" />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="john@email.com" type="email" />
          </div>
        </div>

        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 10, letterSpacing: '-0.01em' }}>Weekly Schedule</div>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
          {DAYS.map((day, di) => {
            const s = form.schedule[day]
            return (
              <div key={day}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: s.off ? 'var(--surface-2)' : 'transparent' }}>
                  <span style={{ width: 36, fontSize: 13, fontWeight: 500, color: s.off ? 'var(--text-3)' : 'var(--text-2)' }}>
                    {SHORT[day]}
                  </span>
                  <ToggleSwitch size="sm" checked={!s.off} onChange={v =>
                    setForm({ ...form, schedule: { ...form.schedule, [day]: { ...s, off: !v } } })
                  } />
                  {!s.off ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'flex-end' }}>
                      <input type="time" value={s.start} onChange={e =>
                        setForm({ ...form, schedule: { ...form.schedule, [day]: { ...s, start: e.target.value } } })
                      } style={{ padding: '5px 8px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 7, outline: 'none', fontFamily: 'inherit', background: 'var(--surface-2)', color: 'var(--text-1)' }} />
                      <span style={{ color: 'var(--text-3)', fontSize: 11 }}>→</span>
                      <input type="time" value={s.end} onChange={e =>
                        setForm({ ...form, schedule: { ...form.schedule, [day]: { ...s, end: e.target.value } } })
                      } style={{ padding: '5px 8px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 7, outline: 'none', fontFamily: 'inherit', background: 'var(--surface-2)', color: 'var(--text-1)' }} />
                    </div>
                  ) : (
                    <span style={{ flex: 1, textAlign: 'right', fontSize: 13, color: 'var(--text-3)', fontStyle: 'italic' }}>Day off</span>
                  )}
                </div>
                {di < DAYS.length - 1 && <div style={{ height: 1, background: 'var(--border)', margin: '0 14px' }} />}
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn onClick={() => { if (form.name.trim()) onSave({ ...form, id: form.id || crypto.randomUUID() }) }}>
            {employee ? 'Save Changes' : 'Add Employee'}
          </Btn>
        </div>
      </div>
    </div>
  )
}


/* ════════════════════════════════════════════════════════════════════════════
   Main Settings Component
   ════════════════════════════════════════════════════════════════════════════ */
export default function Settings() {
  const [form, setForm] = useState({
    name: '', address: '', phone: '', estimated_wait_minutes: '20', timezone: 'America/New_York',
    delivery_radius_miles: 5,
    delivery_fee: 0,
  })
  const [hours, setHours] = useState(DEFAULT_HOURS)
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [modal, setModal] = useState(null)
  const [activeTab, setActiveTab] = useState('info')
  const navigate = useNavigate()

  // Account tab
  const [account, setAccount] = useState({ email: '', phone: '' })
  const [aiPhoneNumber, setAiPhoneNumber] = useState(null) // Twilio number assigned by admin
  const [emailForm, setEmailForm] = useState({ new_email: '', password: '', code: '' })
  const [phoneForm, setPhoneForm] = useState({ phone: '', code: '' })
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [currentPlan, setCurrentPlan] = useState('basic')
  const [savingAccount, setSavingAccount] = useState(null)
  const [cancelStep, setCancelStep] = useState(0)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelReasonOther, setCancelReasonOther] = useState('')

  // OTP state
  const [emailOtpSent, setEmailOtpSent] = useState(false)
  const [phoneOtpSent, setPhoneOtpSent] = useState(false)
  const [emailOtpCountdown, setEmailOtpCountdown] = useState(0)
  const [phoneOtpCountdown, setPhoneOtpCountdown] = useState(0)
  const [devOtp, setDevOtp] = useState(null) // shows OTP in dev mode
  const [securityExpanded, setSecurityExpanded] = useState(null) // 'email' | 'phone' | 'password'

  // OTP countdown timers
  useEffect(() => {
    if (emailOtpCountdown <= 0) return
    const t = setTimeout(() => setEmailOtpCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [emailOtpCountdown])

  useEffect(() => {
    if (phoneOtpCountdown <= 0) return
    const t = setTimeout(() => setPhoneOtpCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [phoneOtpCountdown])

  useEffect(() => {
    Promise.all([
      restaurantApi.get(),
      authApi.me(),
      subscriptionApi.getCurrent().catch(() => null),
    ]).then(([restRes, meRes, subRes]) => {
      const r = restRes.data
      setForm({
        name: r.name || '', address: r.address || '', phone: r.phone || '',
        estimated_wait_minutes: r.estimated_wait_minutes || '20',
        timezone: r.timezone || 'America/New_York',
        delivery_radius_miles: r.delivery_radius_miles ?? 5,
        delivery_fee: r.delivery_fee ?? 0,
      })
      if (r.hours) setHours(parseOldHours(r.hours))
      if (r.employees) {
        try { setEmployees(JSON.parse(r.employees)) } catch {}
      }
      const me = meRes.data
      setAccount({ email: me.email || '', phone: r.phone || '' })
      setAiPhoneNumber(r.twilio_number || null)
      setEmailForm(prev => ({ ...prev, new_email: me.email || '' }))
      setPhoneForm(prev => ({ ...prev, phone: r.phone || '' }))
      if (subRes?.data?.current_plan) setCurrentPlan(subRes.data.current_plan)
      else if (me.plan) setCurrentPlan(me.plan)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  /* ── Handlers ── */
  const handleSave = async () => {
    setSaving(true)
    try {
      await restaurantApi.update({
        ...form,
        hours: JSON.stringify(hours),
        employees: JSON.stringify(employees),
      })
      setToast({ message: 'Settings saved', type: 'success' })
    } catch (err) {
      setToast({ message: err.response?.data?.detail || 'Failed to save', type: 'error' })
    } finally { setSaving(false) }
  }

  const saveEmployee = (emp) => {
    if (typeof modal === 'object' && modal?.id) {
      setEmployees(prev => prev.map(e => e.id === emp.id ? emp : e))
    } else {
      setEmployees(prev => [...prev, emp])
    }
    setModal(null)
  }
  const deleteEmployee = (id) => setEmployees(prev => prev.filter(e => e.id !== id))

  const toggleSecurity = (key) => {
    setSecurityExpanded(prev => {
      if (prev === key) return null
      if (key !== 'email') { setEmailOtpSent(false); setEmailForm({ new_email: '', password: '', code: '' }) }
      if (key !== 'phone') { setPhoneOtpSent(false); setPhoneForm({ phone: '', code: '' }) }
      return key
    })
  }

  // ── Send OTP ──
  const handleSendEmailOtp = async () => {
    if (!emailForm.new_email) {
      setToast({ message: 'Enter the new email first', type: 'error' }); return
    }
    if (emailForm.new_email === account.email) {
      setToast({ message: 'New email is the same as current', type: 'error' }); return
    }
    setSavingAccount('email-otp')
    try {
      const res = await authApi.sendOtp({ type: 'email', value: emailForm.new_email })
      setEmailOtpSent(true)
      setEmailOtpCountdown(60)
      setEmailForm(prev => ({ ...prev, code: '' }))
      // Dev mode: show the OTP code
      if (res.data?.otp) setDevOtp({ type: 'email', code: res.data.otp })
      setToast({ message: `Verification code sent to ${emailForm.new_email}`, type: 'success' })
    } catch (err) {
      setToast({ message: err.response?.data?.detail || 'Failed to send code', type: 'error' })
    } finally { setSavingAccount(null) }
  }

  const handleSendPhoneOtp = async () => {
    if (!phoneForm.phone) {
      setToast({ message: 'Enter the phone number first', type: 'error' }); return
    }
    if (phoneForm.phone === account.phone) {
      setToast({ message: 'Phone number is the same as current', type: 'error' }); return
    }
    setSavingAccount('phone-otp')
    try {
      const res = await authApi.sendOtp({ type: 'phone', value: phoneForm.phone })
      setPhoneOtpSent(true)
      setPhoneOtpCountdown(60)
      setPhoneForm(prev => ({ ...prev, code: '' }))
      if (res.data?.otp) setDevOtp({ type: 'phone', code: res.data.otp })
      setToast({ message: `Verification code sent to ${phoneForm.phone}`, type: 'success' })
    } catch (err) {
      setToast({ message: err.response?.data?.detail || 'Failed to send code', type: 'error' })
    } finally { setSavingAccount(null) }
  }

  // ── Verify & Update ──
  const handleUpdateEmail = async () => {
    if (!emailForm.code || emailForm.code.length < 6) {
      setToast({ message: 'Enter the 6-digit code', type: 'error' }); return
    }
    if (!emailForm.password) {
      setToast({ message: 'Enter your current password', type: 'error' }); return
    }
    setSavingAccount('email')
    try {
      const res = await authApi.updateEmail({
        new_email: emailForm.new_email,
        code: emailForm.code,
        password: emailForm.password,
      })
      setAccount(prev => ({ ...prev, email: res.data.email }))
      setEmailForm({ new_email: res.data.email, password: '', code: '' })
      setEmailOtpSent(false)
      setDevOtp(null)
      const owner = JSON.parse(localStorage.getItem('owner') || '{}')
      owner.email = res.data.email
      localStorage.setItem('owner', JSON.stringify(owner))
      setToast({ message: 'Email updated', type: 'success' })
    } catch (err) {
      setToast({ message: err.response?.data?.detail || 'Failed to update email', type: 'error' })
    } finally { setSavingAccount(null) }
  }

  const handleUpdatePhone = async () => {
    if (!phoneForm.code || phoneForm.code.length < 6) {
      setToast({ message: 'Enter the 6-digit code', type: 'error' }); return
    }
    setSavingAccount('phone')
    try {
      await authApi.updatePhone({ phone: phoneForm.phone, code: phoneForm.code })
      setAccount(prev => ({ ...prev, phone: phoneForm.phone }))
      setForm(prev => ({ ...prev, phone: phoneForm.phone }))
      setPhoneOtpSent(false)
      setPhoneForm(prev => ({ ...prev, code: '' }))
      setDevOtp(null)
      setToast({ message: 'Phone number updated', type: 'success' })
    } catch (err) {
      setToast({ message: err.response?.data?.detail || 'Failed to update phone', type: 'error' })
    } finally { setSavingAccount(null) }
  }

  const handleUpdatePassword = async () => {
    if (!passwordForm.current_password || !passwordForm.new_password) {
      setToast({ message: 'All password fields are required', type: 'error' }); return
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setToast({ message: 'Passwords do not match', type: 'error' }); return
    }
    if (passwordForm.new_password.length < 6) {
      setToast({ message: 'Password must be at least 6 characters', type: 'error' }); return
    }
    setSavingAccount('password')
    try {
      await authApi.updatePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      })
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })
      setToast({ message: 'Password updated', type: 'success' })
    } catch (err) {
      setToast({ message: err.response?.data?.detail || 'Failed to update password', type: 'error' })
    } finally { setSavingAccount(null) }
  }

  const handleManageBilling = () => {
    navigate('/subscription')
  }

  const PLAN_HIERARCHY = { enterprise: 'pro', pro: 'basic' }
  const PLAN_PRICES = { enterprise: '$399/mo', pro: '$149/mo', basic: 'Free' }
  const PLAN_LABELS = { enterprise: 'Enterprise', pro: 'Pro', basic: 'Basic' }
  const CANCEL_REASONS = [
    'Too expensive',
    'Not using it enough',
    'Missing features I need',
    'Switching to another service',
    'Business is closing',
    'Just testing / evaluating',
    'Other',
  ]
  const lowerPlan = PLAN_HIERARCHY[currentPlan] || null

  const handleDowngrade = async () => {
    if (!lowerPlan) return
    setSavingAccount('downgrade')
    try {
      const res = await subscriptionApi.changePlan(lowerPlan)
      const newPlan = res.data?.new_plan || lowerPlan
      setCurrentPlan(newPlan)
      setCancelStep(0); setCancelReason(''); setCancelReasonOther('')
      const owner = JSON.parse(localStorage.getItem('owner') || '{}')
      owner.plan = newPlan
      localStorage.setItem('owner', JSON.stringify(owner))
      setToast({ message: `Downgraded to ${PLAN_LABELS[newPlan]}`, type: 'success' })
    } catch (err) {
      setToast({ message: err.response?.data?.detail || 'Failed to downgrade', type: 'error' })
    } finally { setSavingAccount(null) }
  }

  const handleCancelSubscription = async () => {
    setSavingAccount('cancel')
    try {
      const res = await subscriptionApi.cancel()
      setCurrentPlan(res.data?.new_plan || 'basic')
      setCancelStep(0); setCancelReason(''); setCancelReasonOther('')
      const owner = JSON.parse(localStorage.getItem('owner') || '{}')
      owner.plan = res.data?.new_plan || 'basic'
      localStorage.setItem('owner', JSON.stringify(owner))
      setToast({ message: res.data?.message || 'Subscription cancelled', type: 'success' })
    } catch (err) {
      setToast({ message: err.response?.data?.detail || 'Failed to cancel subscription', type: 'error' })
    } finally { setSavingAccount(null) }
  }

  const tabs = [
    { id: 'info', label: 'General' },
    { id: 'hours', label: 'Hours' },
    { id: 'team', label: 'Team' },
    { id: 'account', label: 'Account' },
  ]

  if (loading) return (
    <Layout>
      <div className="app-page">
        {[1,2,3].map(i => (
          <div key={i} style={{
            height: 160, borderRadius: 20, marginBottom: 16,
            background: 'var(--surface-3)', animation: 'pulse 1.5s infinite',
          }} />
        ))}
        <style>{`@keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.5 } }`}</style>
      </div>
    </Layout>
  )

  return (
    <Layout>
      <div className="app-page">
        <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>

        <PageHeader
          icon={SettingsIcon}
          title="Settings"
          subtitle="Manage your restaurant, team, and account"
          accent="var(--accent-violet)"
          accentBg="rgba(124,58,237,0.10)"
        />

        {/* Tabs */}
        <div className="tab-row" style={{ gap: 2, marginBottom: 28, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 14, padding: 4 }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, padding: '8px 14px',
                fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                color: activeTab === tab.id ? 'var(--text-1)' : 'var(--text-3)',
                background: activeTab === tab.id ? 'var(--card-bg)' : 'transparent',
                border: 'none', cursor: 'pointer', borderRadius: 10,
                boxShadow: activeTab === tab.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ════ TAB: General ════ */}
        {activeTab === 'info' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeInUp 0.3s ease both' }}>

            {/* Restaurant identity group */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 10, paddingLeft: 4 }}>Restaurant</div>
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                {[
                  { label: 'Name',    key: 'name',    placeholder: "Mario's Pizza",                    type: 'text' },
                  { label: 'Phone',   key: 'phone',   placeholder: '+1 (215) 555-0100',                type: 'tel'  },
                  { label: 'Address', key: 'address', placeholder: '123 Main St, Philadelphia, PA 19103', type: 'text' },
                ].map(({ label, key, placeholder, type }, i, arr) => (
                  <div key={key}>
                    <div style={{ display: 'flex', alignItems: 'center', minHeight: 54, padding: '0 20px', gap: 16 }}>
                      <span style={{ width: 80, fontSize: 14, fontWeight: 500, color: 'var(--text-2)', flexShrink: 0 }}>{label}</span>
                      <input
                        type={type}
                        value={form[key]}
                        onChange={e => setForm({ ...form, [key]: e.target.value })}
                        placeholder={placeholder}
                        style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, fontFamily: 'inherit', color: 'var(--text-1)', background: 'transparent', textAlign: 'right', minWidth: 0 }}
                      />
                    </div>
                    {i < arr.length - 1 && <div style={{ height: 1, background: 'var(--border)', margin: '0 20px' }} />}
                  </div>
                ))}
              </div>
            </div>

            {/* Operations group */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 10, paddingLeft: 4 }}>Operations</div>
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', minHeight: 54, padding: '0 20px', gap: 16 }}>
                  <span style={{ width: 120, fontSize: 14, fontWeight: 500, color: 'var(--text-2)', flexShrink: 0 }}>Avg. Wait Time</span>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                    <input
                      type="number" min="5" max="120"
                      value={form.estimated_wait_minutes}
                      onChange={e => setForm({ ...form, estimated_wait_minutes: e.target.value })}
                      style={{ width: 52, border: 'none', outline: 'none', fontSize: 14, fontFamily: 'inherit', color: 'var(--text-1)', background: 'transparent', textAlign: 'right' }}
                    />
                    <span style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 500 }}>min</span>
                  </div>
                </div>
                <div style={{ height: 1, background: 'var(--border)', margin: '0 20px' }} />
                <div style={{ display: 'flex', alignItems: 'center', minHeight: 54, padding: '0 20px', gap: 16 }}>
                  <span style={{ width: 120, fontSize: 14, fontWeight: 500, color: 'var(--text-2)', flexShrink: 0 }}>Timezone</span>
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                    <select
                      value={form.timezone}
                      onChange={e => setForm({ ...form, timezone: e.target.value })}
                      style={{ border: 'none', outline: 'none', fontSize: 14, fontFamily: 'inherit', color: 'var(--text-1)', background: 'transparent', cursor: 'pointer', textAlign: 'right', maxWidth: '100%' }}
                    >
                      {TIMEZONES.map(tz => (
                        <option key={tz.value} value={tz.value}>{tz.label} ({tz.short})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery group */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 10, paddingLeft: 4 }}>Delivery</div>
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>

                {/* Max delivery distance slider */}
                <div style={{ padding: '14px 20px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-2)', flex: 1 }}>Max Delivery Distance</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>
                      {Number(form.delivery_radius_miles).toFixed(1)} mi
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5" max="30" step="0.5"
                    value={form.delivery_radius_miles}
                    onChange={e => setForm({ ...form, delivery_radius_miles: parseFloat(e.target.value) })}
                    style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>0.5 mi</span>
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>30 mi</span>
                  </div>
                </div>

                <div style={{ height: 1, background: 'var(--border)', margin: '0 20px' }} />

                {/* Delivery fee */}
                <div style={{ display: 'flex', alignItems: 'center', minHeight: 54, padding: '0 20px', gap: 16 }}>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: 'var(--text-2)' }}>Delivery Fee</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <span style={{ fontSize: 14, color: 'var(--text-3)', fontWeight: 500 }}>$</span>
                    <input
                      type="number"
                      min="0" max="99.99" step="0.50"
                      value={form.delivery_fee}
                      onChange={e => setForm({ ...form, delivery_fee: parseFloat(e.target.value) || 0 })}
                      style={{ width: 64, border: 'none', outline: 'none', fontSize: 14, fontFamily: 'inherit', color: 'var(--text-1)', background: 'transparent', textAlign: 'right' }}
                    />
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* ════ TAB: Hours ════ */}
        {activeTab === 'hours' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeInUp 0.3s ease both' }}>

            {/* Summary header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.09em', paddingLeft: 4 }}>Weekly Schedule</div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <div style={{ padding: '4px 14px', borderRadius: 999, background: 'var(--card-bg)', border: '1px solid var(--border)', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  {DAYS.filter(d => !hours[d]?.closed).length} / 7 open
                </div>
              </div>
            </div>

            {/* Days list */}
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
              {DAYS.map((day, i) => {
                const h = hours[day] || DEFAULT_HOURS[day]
                return (
                  <div key={day}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 20px', background: h.closed ? 'var(--surface-2)' : 'transparent', transition: 'background 0.15s' }}>
                      <span style={{ width: 86, fontSize: 14, fontWeight: h.closed ? 400 : 500, color: h.closed ? 'var(--text-3)' : 'var(--text-1)', flexShrink: 0 }}>{day}</span>
                      <ToggleSwitch size="sm" checked={!h.closed} onChange={v => setHours({ ...hours, [day]: { ...h, closed: !v } })} />
                      {!h.closed ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                          <input type="time" value={h.open}
                            onChange={e => setHours({ ...hours, [day]: { ...h, open: e.target.value } })}
                            style={{ padding: '6px 10px', fontSize: 13, fontFamily: 'inherit', border: '1px solid var(--border)', borderRadius: 9, outline: 'none', background: 'var(--surface-2)', color: 'var(--text-1)', fontWeight: 500 }}
                          />
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                          <input type="time" value={h.close}
                            onChange={e => setHours({ ...hours, [day]: { ...h, close: e.target.value } })}
                            style={{ padding: '6px 10px', fontSize: 13, fontFamily: 'inherit', border: '1px solid var(--border)', borderRadius: 9, outline: 'none', background: 'var(--surface-2)', color: 'var(--text-1)', fontWeight: 500 }}
                          />
                        </div>
                      ) : (
                        <span style={{ flex: 1, textAlign: 'right', fontSize: 13, color: 'var(--text-3)', fontStyle: 'italic' }}>Closed</span>
                      )}
                    </div>
                    {i < DAYS.length - 1 && <div style={{ height: 1, background: 'var(--border)', margin: '0 20px' }} />}
                  </div>
                )
              })}
            </div>

          </div>
        )}

        {/* ════ TAB: Team ════ */}
        {activeTab === 'team' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeInUp 0.3s ease both' }}>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { label: 'Total',     value: employees.length },
                { label: 'Scheduled', value: employees.filter(e => Object.values(e.schedule || {}).some(s => !s.off)).length },
                { label: 'Roles',     value: [...new Set(employees.map(e => e.role))].length },
              ].map((s) => (
                <div key={s.label} style={{ padding: '18px 20px', borderRadius: 20, background: 'var(--card-bg)', border: '1px solid var(--border)', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1, letterSpacing: '-0.03em' }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 5, fontWeight: 500 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Team members section */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 10, paddingLeft: 4 }}>Members</div>

              {/* Add button */}
              <button
                onClick={() => setModal('add')}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', borderRadius: 16, border: '1.5px dashed var(--border)', background: 'transparent', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--primary)', marginBottom: employees.length > 0 ? 12 : 0, fontFamily: 'inherit', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add Team Member
              </button>

              {/* Employee list */}
              {employees.length > 0 && (
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                  {employees.map((emp, i) => {
                    const rc = ROLE_COLORS[emp.role] || ROLE_COLORS.Busser
                    const workDays = Object.entries(emp.schedule || {}).filter(([, s]) => !s.off)
                    return (
                      <div key={emp.id}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px' }}>
                          <div style={{ width: 44, height: 44, borderRadius: 14, background: rc.bg, border: `1.5px solid ${rc.dot}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: rc.text, flexShrink: 0 }}>
                            {emp.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>{emp.name}</span>
                              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: rc.bg, color: rc.text }}>{emp.role}</span>
                            </div>
                            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                              {workDays.length > 0 ? `${workDays.length} days · ${workDays.map(([d]) => SHORT[d]).join(', ')}` : 'No schedule set'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => setModal(emp)} style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button onClick={() => deleteEmployee(emp.id)} style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                            </button>
                          </div>
                        </div>
                        {i < employees.length - 1 && <div style={{ height: 1, background: 'var(--border)', margin: '0 20px' }} />}
                      </div>
                    )
                  })}
                </div>
              )}

              {employees.length === 0 && (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-3)', fontSize: 14 }}>
                  No team members yet — add your first one above
                </div>
              )}
            </div>

          </div>
        )}

        {/* ════ TAB: Account ════ */}
        {activeTab === 'account' && (() => {
          const planTheme = ({
            basic:      { gradient: 'linear-gradient(160deg,#374151 0%,#1f2937 55%,#111827 100%)', label: 'Basic',      badge: '#4b5563' },
            essential:  { gradient: 'linear-gradient(160deg,#3b8ae3 0%,#1a5fb4 55%,#163f8a 100%)', label: 'Essential',  badge: '#1d6fcc' },
            pro:        { gradient: 'linear-gradient(160deg,#df6040 0%,#c44228 55%,#8c2918 100%)', label: 'Pro',        badge: '#c44228' },
            enterprise: { gradient: 'linear-gradient(160deg,#9168f0 0%,#6d28d9 55%,#4a1d96 100%)', label: 'Enterprise', badge: '#6d28d9' },
          }[currentPlan]) || { gradient: 'linear-gradient(160deg,#374151 0%,#111827 100%)', label: currentPlan, badge: '#4b5563' }

          const initials = (form.name || 'R').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

          const pwdScore = (() => {
            const p = passwordForm.new_password
            if (!p) return 0
            let s = 0
            if (p.length >= 8) s++
            if (/[A-Z]/.test(p)) s++
            if (/[0-9]/.test(p)) s++
            if (/[^A-Za-z0-9]/.test(p)) s++
            return s
          })()
          const pwdColors = ['#ef4444','#f97316','#eab308','#22c55e']
          const pwdLabels = ['Weak','Fair','Good','Strong']

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28, animation: 'fadeInUp 0.3s ease both' }}>

              {/* Profile hero */}
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 22, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                <div style={{ position: 'relative', padding: '32px 28px 28px', background: 'linear-gradient(160deg,#1e293b 0%,#0f172a 60%,#020617 100%)', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: '8%', right: '8%', height: 1, background: 'rgba(255,255,255,0.14)', borderRadius: '0 0 4px 4px' }} />
                  <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: `${planTheme.badge}22`, filter: 'blur(40px)', pointerEvents: 'none' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20, position: 'relative' }}>
                    <div style={{ width: 64, height: 64, borderRadius: 20, flexShrink: 0, background: `${planTheme.badge}28`, border: `2px solid ${planTheme.badge}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 0 6px ${planTheme.badge}12` }}>
                      <span style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em' }}>{initials}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{form.name || 'Your Restaurant'}</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 5 }}>{account.email}</div>
                    </div>
                    <div style={{ flexShrink: 0, padding: '6px 16px', borderRadius: 999, background: `${planTheme.badge}30`, border: `1px solid ${planTheme.badge}50`, fontSize: 11, fontWeight: 800, color: '#fff', letterSpacing: '0.09em', textTransform: 'uppercase' }}>{planTheme.label}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                  {[
                    { label: 'Email', value: account.email || '—' },
                    { label: 'Plan',  value: planTheme.label },
                    { label: 'Phone', value: account.phone || 'Not set' },
                  ].map(({ label, value }, i, arr) => (
                    <div key={label} style={{ padding: '14px 18px', borderRight: i < arr.length - 1 ? '1px solid var(--border)' : 'none', borderTop: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Phone Number — shown when admin has assigned a Twilio number */}
              {aiPhoneNumber && (
                <div style={{ background: 'linear-gradient(135deg, rgba(9,76,178,0.08) 0%, rgba(9,76,178,0.03) 100%)', border: '1.5px solid rgba(9,76,178,0.20)', borderRadius: 16, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(9,76,178,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#094cb2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.4 2.7h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.09a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#094cb2', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Your AI Phone Number</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#094cb2', letterSpacing: '0.04em', fontFamily: 'monospace' }}>{aiPhoneNumber}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>Forward your restaurant number to this line to activate your AI agent</div>
                  </div>
                  <button
                    onClick={() => { navigator.clipboard.writeText(aiPhoneNumber); setToast({ message: 'Number copied to clipboard', type: 'success' }) }}
                    style={{ flexShrink: 0, padding: '8px 14px', borderRadius: 10, border: '1.5px solid rgba(9,76,178,0.25)', background: 'rgba(9,76,178,0.08)', color: '#094cb2', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    Copy
                  </button>
                </div>
              )}

              {/* Security — Apple-style disclosure list */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 10, paddingLeft: 4 }}>Security</div>
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>

                  <SecRow id="email" isOpen={securityExpanded === 'email'} onToggle={toggleSecurity} iconBg="rgba(99,102,241,0.10)" iconStroke="#6366f1"
                    icon={<><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>}
                    label="Email Address" value={account.email || 'Not set'} actionLabel="Change">
                    <div style={{ paddingTop: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'var(--card-bg)', border: '1px solid var(--border)', marginBottom: 16 }}>
                        <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500, flex: 1 }}>{account.email}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', background: 'var(--surface-2)', padding: '3px 8px', borderRadius: 6 }}>Current</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'end', marginBottom: emailOtpSent ? 16 : 0 }}>
                        <div>
                          <Label>New Email Address</Label>
                          <Input type="email" value={emailForm.new_email} onChange={e => { setEmailForm({ ...emailForm, new_email: e.target.value }); setEmailOtpSent(false) }} placeholder="newemail@example.com" />
                        </div>
                        <button onClick={handleSendEmailOtp} disabled={savingAccount === 'email-otp' || emailOtpCountdown > 0} style={{ padding: '0 18px', height: 42, borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text-1)', fontSize: 13, fontWeight: 600, cursor: (savingAccount === 'email-otp' || emailOtpCountdown > 0) ? 'not-allowed' : 'pointer', opacity: (savingAccount === 'email-otp' || emailOtpCountdown > 0) ? 0.55 : 1, whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
                          {savingAccount === 'email-otp' ? 'Sending…' : emailOtpCountdown > 0 ? `Resend (${emailOtpCountdown}s)` : 'Send Code'}
                        </button>
                      </div>
                      {emailOtpSent && (
                        <div style={{ padding: 18, borderRadius: 14, background: 'rgba(99,102,241,0.06)', border: '1.5px solid rgba(99,102,241,0.20)', marginTop: 4 }}>
                          {devOtp?.type === 'email' && <div style={{ marginBottom: 14, padding: '9px 13px', borderRadius: 9, background: '#fffbeb', border: '1px solid #fde68a', fontSize: 13, color: '#92400e' }}>Dev — code: <strong>{devOtp.code}</strong></div>}
                          <div style={{ marginBottom: 14 }}><Label>6-Digit Verification Code</Label><OtpInput value={emailForm.code || ''} onChange={code => setEmailForm({ ...emailForm, code })} /></div>
                          <div style={{ marginBottom: 16 }}><Label>Confirm with Current Password</Label><Input type="password" value={emailForm.password} onChange={e => setEmailForm({ ...emailForm, password: e.target.value })} placeholder="Enter your password" style={{ maxWidth: 300 }} /></div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={handleUpdateEmail} disabled={savingAccount === 'email'} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 10, border: 'none', background: '#6366f1', color: '#fff', fontSize: 13, fontWeight: 700, cursor: savingAccount === 'email' ? 'not-allowed' : 'pointer', opacity: savingAccount === 'email' ? 0.7 : 1, fontFamily: 'inherit' }}>{savingAccount === 'email' ? 'Verifying…' : 'Update Email'}</button>
                            <button onClick={() => { setEmailOtpSent(false); setSecurityExpanded(null) }} style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-2)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </SecRow>

                  <div style={{ height: 1, background: 'var(--border)', margin: '0 24px' }} />

                  <SecRow id="phone" isOpen={securityExpanded === 'phone'} onToggle={toggleSecurity} iconBg="rgba(16,185,129,0.10)" iconStroke="#10b981"
                    icon={<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.4 2.7h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.09a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>}
                    label="Phone Number" value={account.phone || 'Not set'} valueStyle={!account.phone ? { fontStyle: 'italic' } : {}} actionLabel={account.phone ? 'Change' : 'Add'}>
                    <div style={{ paddingTop: 20 }}>
                      {account.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'var(--card-bg)', border: '1px solid var(--border)', marginBottom: 16 }}>
                          <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500, flex: 1 }}>{account.phone}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', background: 'var(--surface-2)', padding: '3px 8px', borderRadius: 6 }}>Current</span>
                        </div>
                      )}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'end', maxWidth: 440, marginBottom: phoneOtpSent ? 16 : 0 }}>
                        <div>
                          <Label>{account.phone ? 'New Phone Number' : 'Phone Number'}</Label>
                          <Input value={phoneForm.phone} onChange={e => { setPhoneForm({ ...phoneForm, phone: e.target.value }); setPhoneOtpSent(false) }} placeholder="+1 (215) 555-0100" />
                        </div>
                        <button onClick={handleSendPhoneOtp} disabled={savingAccount === 'phone-otp' || phoneOtpCountdown > 0} style={{ padding: '0 18px', height: 42, borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text-1)', fontSize: 13, fontWeight: 600, cursor: (savingAccount === 'phone-otp' || phoneOtpCountdown > 0) ? 'not-allowed' : 'pointer', opacity: (savingAccount === 'phone-otp' || phoneOtpCountdown > 0) ? 0.55 : 1, whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
                          {savingAccount === 'phone-otp' ? 'Sending…' : phoneOtpCountdown > 0 ? `Resend (${phoneOtpCountdown}s)` : 'Send Code'}
                        </button>
                      </div>
                      {phoneOtpSent && (
                        <div style={{ padding: 18, borderRadius: 14, background: 'rgba(16,185,129,0.06)', border: '1.5px solid rgba(16,185,129,0.20)', marginTop: 4 }}>
                          {devOtp?.type === 'phone' && <div style={{ marginBottom: 14, padding: '9px 13px', borderRadius: 9, background: '#fffbeb', border: '1px solid #fde68a', fontSize: 13, color: '#92400e' }}>Dev — code: <strong>{devOtp.code}</strong></div>}
                          <div style={{ marginBottom: 16 }}><Label>6-Digit Verification Code</Label><OtpInput value={phoneForm.code || ''} onChange={code => setPhoneForm({ ...phoneForm, code })} /></div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={handleUpdatePhone} disabled={savingAccount === 'phone'} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 10, border: 'none', background: '#10b981', color: '#fff', fontSize: 13, fontWeight: 700, cursor: savingAccount === 'phone' ? 'not-allowed' : 'pointer', opacity: savingAccount === 'phone' ? 0.7 : 1, fontFamily: 'inherit' }}>{savingAccount === 'phone' ? 'Verifying…' : 'Update Phone'}</button>
                            <button onClick={() => { setPhoneOtpSent(false); setSecurityExpanded(null) }} style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-2)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </SecRow>

                  <div style={{ height: 1, background: 'var(--border)', margin: '0 24px' }} />

                  <SecRow id="password" isOpen={securityExpanded === 'password'} onToggle={toggleSecurity} iconBg="rgba(245,158,11,0.10)" iconStroke="#f59e0b"
                    icon={<><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>}
                    label="Password" value="Last updated — keep it strong" actionLabel="Change">
                    <div style={{ paddingTop: 20, maxWidth: 360 }}>
                      <div style={{ marginBottom: 14 }}><Label>Current Password</Label><Input type="password" value={passwordForm.current_password} onChange={e => setPasswordForm({ ...passwordForm, current_password: e.target.value })} placeholder="Enter current password" /></div>
                      <div style={{ marginBottom: passwordForm.new_password ? 6 : 14 }}><Label>New Password</Label><Input type="password" value={passwordForm.new_password} onChange={e => setPasswordForm({ ...passwordForm, new_password: e.target.value })} placeholder="At least 8 characters" /></div>
                      {passwordForm.new_password.length > 0 && (
                        <div style={{ marginBottom: 14 }}>
                          <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
                            {[0,1,2,3].map(i => (
                              <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < pwdScore ? pwdColors[pwdScore - 1] : 'var(--border)', transition: 'background 0.25s' }} />
                            ))}
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: pwdScore > 0 ? pwdColors[pwdScore - 1] : 'var(--text-3)' }}>{pwdScore > 0 ? pwdLabels[pwdScore - 1] : 'Too short'}</span>
                        </div>
                      )}
                      <div style={{ marginBottom: 20 }}>
                        <Label>Confirm New Password</Label>
                        <Input type="password" value={passwordForm.confirm_password} onChange={e => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })} placeholder="Re-enter new password" />
                        {passwordForm.confirm_password && passwordForm.new_password !== passwordForm.confirm_password && (
                          <div style={{ fontSize: 11, color: '#ef4444', marginTop: 5, fontWeight: 600 }}>Passwords do not match</div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={handleUpdatePassword} disabled={savingAccount === 'password'} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 10, border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: savingAccount === 'password' ? 'not-allowed' : 'pointer', opacity: savingAccount === 'password' ? 0.7 : 1, fontFamily: 'inherit' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                          {savingAccount === 'password' ? 'Updating…' : 'Update Password'}
                        </button>
                        <button onClick={() => { setSecurityExpanded(null); setPasswordForm({ current_password: '', new_password: '', confirm_password: '' }) }} style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-2)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                      </div>
                    </div>
                  </SecRow>
                </div>
              </div>

              {/* Plan & Billing */}
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 22, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
                <div style={{ position: 'relative', padding: '26px 26px 22px', background: planTheme.gradient, overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: '8%', right: '8%', height: 1, background: 'rgba(255,255,255,0.18)', borderRadius: '0 0 4px 4px' }} />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Current Plan</div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>{planTheme.label}</div>
                    </div>
                    <div style={{ padding: '5px 14px', borderRadius: 20, background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.25)', fontSize: 11, fontWeight: 800, color: '#fff', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                      {currentPlan === 'basic' ? 'Free' : 'Active'}
                    </div>
                  </div>
                </div>
                <div style={{ padding: '20px 24px', borderBottom: currentPlan !== 'basic' ? '1px solid var(--border)' : 'none' }}>
                  <button onClick={handleManageBilling} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 20px', borderRadius: 12, border: '1.5px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-1)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 8 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                    Manage Billing and Payment Methods
                  </button>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center' }}>View plans, upgrade, or manage your subscription</div>
                </div>
                {currentPlan !== 'basic' && (
                  <div style={{ padding: '20px 24px' }}>
                    {cancelStep === 0 && (
                      <button onClick={() => setCancelStep(1)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 20px', borderRadius: 12, border: '1.5px solid rgba(220,38,38,0.30)', background: 'rgba(220,38,38,0.04)', color: '#dc2626', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                        Cancel Subscription
                      </button>
                    )}
                    {cancelStep === 1 && lowerPlan && (
                      <div style={{ padding: 20, borderRadius: 16, background: 'var(--surface-2)', border: '1.5px solid var(--border)' }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-1)', marginBottom: 6 }}>Before you cancel…</div>
                        <p style={{ fontSize: 13, color: 'var(--text-3)', margin: '0 0 18px', lineHeight: 1.6 }}>Downgrade to <strong style={{ color: 'var(--text-2)' }}>{PLAN_LABELS[lowerPlan]}</strong> ({PLAN_PRICES[lowerPlan]}) instead?</p>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button onClick={() => setCancelStep(0)} style={{ padding: '9px 18px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text-1)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Never mind</button>
                          <button onClick={handleDowngrade} disabled={savingAccount === 'downgrade'} style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: savingAccount === 'downgrade' ? 0.7 : 1 }}>{savingAccount === 'downgrade' ? 'Switching…' : `Downgrade to ${PLAN_LABELS[lowerPlan]}`}</button>
                          <button onClick={() => setCancelStep(2)} style={{ padding: '9px 18px', borderRadius: 10, border: '1.5px solid rgba(220,38,38,0.30)', background: 'rgba(220,38,38,0.04)', color: '#dc2626', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel anyway</button>
                        </div>
                      </div>
                    )}
                    {cancelStep === 2 && (
                      <div style={{ padding: 20, borderRadius: 16, background: '#fffbeb', border: '1px solid #fde68a' }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#92400e', marginBottom: 4 }}>Help us improve</div>
                        <p style={{ fontSize: 13, color: '#b45309', margin: '0 0 16px', lineHeight: 1.6 }}>Why are you cancelling?</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                          {CANCEL_REASONS.map(reason => (
                            <label key={reason} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: cancelReason === reason ? '#fef3c7' : '#fff', border: `1.5px solid ${cancelReason === reason ? '#f59e0b' : 'rgba(245,158,11,0.20)'}`, cursor: 'pointer', fontSize: 13, color: 'var(--text-2)' }}>
                              <input type="radio" name="cancelReason" value={reason} checked={cancelReason === reason} onChange={e => setCancelReason(e.target.value)} style={{ accentColor: '#f59e0b' }} />
                              {reason}
                            </label>
                          ))}
                        </div>
                        {cancelReason === 'Other' && <div style={{ marginBottom: 16 }}><Input value={cancelReasonOther} onChange={e => setCancelReasonOther(e.target.value)} placeholder="Tell us more…" /></div>}
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => { setCancelStep(1); setCancelReason(''); setCancelReasonOther('') }} style={{ padding: '9px 18px', borderRadius: 10, border: '1.5px solid rgba(245,158,11,0.30)', background: '#fff', color: '#92400e', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Go back</button>
                          <button onClick={() => { if (cancelReason) setCancelStep(3) }} disabled={!cancelReason} style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: '#dc2626', color: '#fff', fontSize: 13, fontWeight: 700, cursor: cancelReason ? 'pointer' : 'not-allowed', fontFamily: 'inherit', opacity: cancelReason ? 1 : 0.5 }}>Continue</button>
                        </div>
                      </div>
                    )}
                    {cancelStep === 3 && (
                      <div style={{ padding: 20, borderRadius: 16, background: '#fef2f2', border: '1.5px solid #fecaca' }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#991b1b', marginBottom: 4 }}>Are you absolutely sure?</div>
                        <p style={{ fontSize: 13, color: '#b91c1c', margin: '0 0 14px', lineHeight: 1.6 }}>Your <strong>{PLAN_LABELS[currentPlan]}</strong> plan will be cancelled.</p>
                        <div style={{ padding: '12px 14px', borderRadius: 10, background: '#fff', border: '1px solid #fecaca', marginBottom: 16 }}>
                          {(currentPlan === 'enterprise'
                            ? ['Unlimited AI calls', 'Advanced analytics', 'Dedicated account manager', 'Custom AI training']
                            : ['Up to 500 AI calls/month', 'Allergy detection', 'Analytics dashboard', 'Priority support']
                          ).map((f, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#6b7280', padding: '4px 0' }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                              {f}
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => setCancelStep(2)} style={{ padding: '9px 18px', borderRadius: 10, border: '1.5px solid #fecaca', background: '#fff', color: '#991b1b', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Go back</button>
                          <button onClick={handleCancelSubscription} disabled={savingAccount === 'cancel'} style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: '#dc2626', color: '#fff', fontSize: 13, fontWeight: 700, cursor: savingAccount === 'cancel' ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: savingAccount === 'cancel' ? 0.7 : 1 }}>{savingAccount === 'cancel' ? 'Cancelling…' : 'Cancel Subscription'}</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })()}
        {/* Save button (not on Account or Email tab) */}
        {activeTab !== 'account' && (
          <div style={{ marginTop: 24 }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                width: '100%', padding: '14px 20px', borderRadius: 14,
                border: 'none', background: saving ? 'var(--surface-4)' : 'var(--primary)',
                color: saving ? 'var(--text-3)' : '#fff',
                fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
                cursor: saving ? 'not-allowed' : 'pointer',
                letterSpacing: '-0.01em',
                transition: 'background 0.15s ease, transform 0.1s ease',
                boxShadow: saving ? 'none' : '0 4px 16px rgba(170,48,26,0.22)',
              }}
              onMouseEnter={e => { if (!saving) e.currentTarget.style.background = 'var(--primary-hover)' }}
              onMouseLeave={e => { if (!saving) e.currentTarget.style.background = 'var(--primary)' }}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {modal && (
        <EmployeeModal
          employee={modal === 'add' ? null : modal}
          onSave={saveEmployee}
          onClose={() => setModal(null)}
        />
      )}
    </Layout>
  )
}
