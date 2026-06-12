import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, Legend,
} from 'recharts'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import { locationsApi, staffApi, managerApi, unwrap, unwrapList } from '../services/api'
import { useLocation as useLocationCtx } from '../context/LocationContext'

/* ── Responsive hook ─────────────────────────────────────────────── */
function useWindowWidth() {
  const [w, setW] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1280))
  useEffect(() => {
    const fn = () => setW(window.innerWidth)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return w
}

/* ── Icons ────────────────────────────────────────────────────────── */
const iconSize = (s, size) => size || s
const PlusIcon = ({ s = 15, size, style, className = '' }) => <svg width={iconSize(s, size)} height={iconSize(s, size)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={style} className={className}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const EditIcon = ({ s = 14, size, style, className = '' }) => <svg width={iconSize(s, size)} height={iconSize(s, size)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={style} className={className}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const TrashIcon = ({ s = 13, size, style, className = '' }) => <svg width={iconSize(s, size)} height={iconSize(s, size)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={style} className={className}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
const UserIcon = ({ s = 14, size, style, className = '' }) => <svg width={iconSize(s, size)} height={iconSize(s, size)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={style} className={className}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
const SpinnerIcon = ({ s = 16, size, style, className = '' }) => <svg width={iconSize(s, size)} height={iconSize(s, size)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={style} className={`animate-spin ${className}`}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
const MapPinIcon = ({ s = 14, size, style, className = '' }) => <svg width={iconSize(s, size)} height={iconSize(s, size)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={style} className={className}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
const ChartIcon = ({ s = 14, size, style, className = '' }) => <svg width={iconSize(s, size)} height={iconSize(s, size)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={style} className={className}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
const XIcon = ({ s = 14, size, style, className = '' }) => <svg width={iconSize(s, size)} height={iconSize(s, size)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={style} className={className}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>

/* ── Stat card ────────────────────────────────────────────────────── */
function StatCard({ label, value, sub, accent }) {
  return (
    <div className="card" style={{ padding: '16px 20px' }}>
      <div className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>{label}</div>
      <div className="text-2xl font-bold" style={{ color: accent || 'var(--text-1)', letterSpacing: '-0.03em' }}>{value}</div>
      {sub && <div className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{sub}</div>}
    </div>
  )
}

/* ── Manager chips ────────────────────────────────────────────────── */
function ManagerChips({ managers }) {
  if (!managers || managers.length === 0) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--surface-2)', color: 'var(--text-3)', border: '1px dashed var(--border)' }}>
        No manager assigned
      </span>
    )
  }
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {managers.map(m => (
        <span
          key={m.id}
          title={m.email}
          className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ background: 'var(--page-accent-light)', color: 'var(--page-accent)', border: '1px solid var(--page-accent-ring)' }}
        >
          <span style={{ fontSize: 10, opacity: 0.7 }}>👤</span>
          {m.name}
        </span>
      ))}
    </div>
  )
}

/* ── Location row ─────────────────────────────────────────────────── */
function LocationRow({ loc, analytics, onEdit, onDelete, onManageStaff }) {
  const a = analytics?.find(l => l.id === loc.id)
  return (
    <div className="card mb-3" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="flex items-start gap-4 p-4">
        {/* Pin */}
        <div className="flex-shrink-0 flex items-center justify-center rounded-xl" style={{ width: 40, height: 40, background: loc.is_active ? 'var(--page-accent-light)' : 'var(--surface-2)' }}>
          <MapPinIcon s={18} style={{ color: loc.is_active ? 'var(--page-accent)' : 'var(--text-3)' }} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>{loc.name}</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{
              background: loc.is_active ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              color: loc.is_active ? '#16a34a' : '#ef4444',
            }}>
              {loc.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          {loc.address && <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-3)' }}>{loc.address}</div>}

          {/* Manager chips */}
          <div className="mt-2">
            <ManagerChips managers={loc.managers} />
          </div>

          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>
              <UserIcon s={11} style={{ display: 'inline', marginRight: 4 }} />
              {loc.staff_count} staff
            </span>
            {a && (
              <>
                <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                  <ChartIcon s={11} style={{ display: 'inline', marginRight: 4 }} />
                  {a.period_orders} orders (30d)
                </span>
                <span className="text-xs font-semibold" style={{ color: '#059669' }}>
                  ${a.period_revenue.toLocaleString()} revenue
                </span>
                {a.active_orders > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(245,158,11,0.12)', color: '#d97706' }}>
                    {a.active_orders} active now
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => onManageStaff(loc)} className="btn-secondary text-xs flex items-center gap-1.5" style={{ padding: '5px 10px' }}>
            <UserIcon s={12} /> Staff
          </button>
          <button onClick={() => onEdit(loc)} className="btn-secondary text-xs flex items-center gap-1.5" style={{ padding: '5px 10px' }}>
            <EditIcon s={12} /> Edit
          </button>
          <button onClick={() => onDelete(loc)} className="flex items-center justify-center rounded-lg transition-colors" style={{ width: 30, height: 30, background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}>
            <TrashIcon s={13} />
          </button>
        </div>
      </div>

      {/* Analytics bar */}
      {a && a.period_revenue > 0 && (
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between text-xs mb-1" style={{ color: 'var(--text-3)' }}>
            <span>Today: {a.today_orders} orders · ${a.today_revenue}</span>
            <span>Avg order: ${a.avg_order_value}</span>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Staff Modal ──────────────────────────────────────────────────── */
function StaffModal({ location, onClose }) {
  const [staffList, setStaffList] = useState([])
  const [loading, setLoading] = useState(true)
  const [addMode, setAddMode] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff', can_view_all_locations: false })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const r = await staffApi.list(location.id)
      setStaffList(unwrapList(r))
    } catch { }
    setLoading(false)
  }

  useEffect(() => { load() }, [location.id]) // eslint-disable-line

  const handleAdd = async (e) => {
    e.preventDefault()
    setErr('')
    setSaving(true)
    try {
      await staffApi.create({ ...form, restaurant_id: location.id })
      setForm({ name: '', email: '', password: '', role: 'staff', can_view_all_locations: false })
      setAddMode(false)
      await load()
    } catch (ex) {
      setErr(ex.response?.data?.detail || 'Failed to add staff')
    }
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this staff member?')) return
    try {
      await staffApi.delete(id)
      await load()
    } catch { }
  }

  const toggleActive = async (s) => {
    try {
      await staffApi.update(s.id, { is_active: !s.is_active })
      await load()
    } catch { }
  }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', padding: 20 }}>
      <div className="rounded-2xl w-full max-w-lg" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', maxHeight: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-xl)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <div className="font-bold text-base" style={{ color: 'var(--text-1)' }}>Staff — {location.name}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Manage who can log in to this location</div>
          </div>
          <button onClick={onClose} className="flex items-center justify-center rounded-lg" style={{ width: 32, height: 32, background: 'var(--border)', color: 'var(--text-2)' }}><XIcon s={14} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Staff list */}
          {loading ? (
            <div className="flex justify-center py-8"><SpinnerIcon s={20} /></div>
          ) : staffList.length === 0 && !addMode ? (
            <div className="text-center py-8" style={{ color: 'var(--text-3)' }}>
              <UserIcon s={28} style={{ margin: '0 auto 8px' }} />
              <div className="text-sm">No staff added yet</div>
            </div>
          ) : (
            <div className="space-y-2 mb-4">
              {staffList.map(s => (
                <div key={s.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-center rounded-lg text-xs font-bold flex-shrink-0" style={{ width: 32, height: 32, background: s.role === 'manager' ? 'var(--page-accent-light)' : 'var(--surface-2)', color: s.role === 'manager' ? 'var(--page-accent)' : 'var(--text-2)' }}>
                    {s.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: 'var(--text-1)' }}>{s.name}</div>
                    <div className="text-xs truncate" style={{ color: 'var(--text-3)' }}>{s.email}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize" style={{ background: s.role === 'manager' ? 'var(--page-accent-light)' : 'var(--surface-2)', color: s.role === 'manager' ? 'var(--page-accent)' : 'var(--text-2)' }}>
                      {s.role}
                    </span>
                    {s.can_view_all_locations && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa' }}>All locations</span>
                    )}
                    <button onClick={() => toggleActive(s)} className="text-xs px-2 py-0.5 rounded-full" style={{ background: s.is_active ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: s.is_active ? '#16a34a' : '#ef4444' }}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </button>
                    <button onClick={() => handleDelete(s.id)} className="flex items-center justify-center rounded-lg" style={{ width: 26, height: 26, background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}><TrashIcon s={11} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add form */}
          {addMode ? (
            <form onSubmit={handleAdd} className="space-y-3 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="text-sm font-semibold mt-3" style={{ color: 'var(--text-1)' }}>Add Staff Member</div>
              {err && <div className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}>{err}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--text-3)' }}>Name</label>
                  <input className="input w-full" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Jane Smith" />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--text-3)' }}>Email</label>
                  <input className="input w-full" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required placeholder="jane@restaurant.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--text-3)' }}>Password</label>
                  <input className="input w-full" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required placeholder="Min 6 chars" />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--text-3)' }}>Role</label>
                  <select className="input w-full" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                    <option value="staff">Staff</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
              </div>
              {form.role === 'manager' && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.can_view_all_locations} onChange={e => setForm(f => ({ ...f, can_view_all_locations: e.target.checked }))} />
                  <span className="text-xs" style={{ color: 'var(--text-2)' }}>Allow this manager to view all locations</span>
                </label>
              )}
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 text-sm">
                  {saving && <SpinnerIcon s={13} />} Add Staff
                </button>
                <button type="button" onClick={() => setAddMode(false)} className="btn-secondary text-sm">Cancel</button>
              </div>
            </form>
          ) : (
            <button onClick={() => setAddMode(true)} className="btn-secondary w-full flex items-center justify-center gap-2 text-sm mt-1">
              <PlusIcon s={13} /> Add Staff Member
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

/* ── Location Form Modal ──────────────────────────────────────────── */

/** Pill segmented control — 2 or 3 options */
function SegControl({ options, value, onChange }) {
  return (
    <div
      className="flex rounded-xl p-0.5 gap-0.5"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-[10px] transition-all"
          style={{
            padding: '6px 10px',
            fontSize: 12,
            fontWeight: 600,
            background: value === o.value
              ? 'linear-gradient(135deg,#3b8ae3,#1d6fcc)'
              : 'transparent',
            color: value === o.value ? '#fff' : 'rgba(255,255,255,0.38)',
            boxShadow: value === o.value ? '0 2px 8px rgba(29,111,204,0.26)' : 'none',
            letterSpacing: '-0.01em',
          }}
        >
          {o.icon && <span style={{ fontSize: 13 }}>{o.icon}</span>}
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Grouped section card — iOS Settings style */
function FormGroup({ label, children }) {
  return (
    <div>
      {label && (
        <div
          className="px-1 mb-1.5"
          style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.07em', textTransform: 'uppercase' }}
        >
          {label}
        </div>
      )}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}
      >
        {children}
      </div>
    </div>
  )
}

/** Single row inside a FormGroup */
function FormRow({ label, required, last, children }) {
  return (
    <div
      style={{
        borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.06)',
        padding: '10px 16px',
      }}
    >
      {label && (
        <label
          className="block mb-1"
          style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.01em' }}
        >
          {label}
          {required && <span style={{ color: '#cb4830', marginLeft: 2 }}>•</span>}
        </label>
      )}
      {children}
    </div>
  )
}

const INPUT_STYLE = {
  background: 'transparent',
  border: 'none',
  outline: 'none',
  width: '100%',
  fontSize: 14,
  fontWeight: 500,
  color: 'var(--text-1)',
  padding: 0,
}

function LocationFormModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(
    initial || { name: '', address: '', phone: '', timezone: 'America/New_York', delivery_radius_miles: 5, delivery_fee: 0 }
  )
  const [managerTab, setManagerTab] = useState('skip') // 'skip' | 'connect' | 'create'
  const [connectEmail, setConnectEmail] = useState('')
  const [newMgr, setNewMgr] = useState({ name: '', email: '', password: '' })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const isEdit = !!initial?.id

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErr('')
    let managerData = null
    if (!isEdit) {
      if (managerTab === 'create' && newMgr.name && newMgr.email && newMgr.password) {
        managerData = { mode: 'create', ...newMgr }
      } else if (managerTab === 'connect' && connectEmail.trim()) {
        managerData = { mode: 'connect', email: connectEmail.trim() }
      }
    }
    try {
      await onSave(form, managerData)
      onClose()
    } catch (ex) {
      setErr(ex.response?.data?.detail || 'Failed to save location')
    }
    setSaving(false)
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        padding: 20,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 500,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 24,
          background: '#1c1c1e',
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.75), 0 0 0 0.5px rgba(255,255,255,0.04)',
          maxHeight: 'calc(100vh - 40px)',
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between flex-shrink-0"
          style={{ padding: '18px 20px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#f2f2f7', letterSpacing: '-0.03em' }}>
              {isEdit ? 'Edit Location' : 'New Location'}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.32)', marginTop: 2 }}>
              {isEdit ? 'Update branch details' : 'Set up a new branch'}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.5)',
              flexShrink: 0,
            }}
          >
            <XIcon s={13} />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto" style={{ padding: '16px 16px 4px' }}>

            {err && (
              <div
                className="mb-4 flex items-center gap-2 rounded-xl px-3 py-2.5"
                style={{ background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.2)', color: '#ff6b6b', fontSize: 13 }}
              >
                <span style={{ fontSize: 15 }}>⚠</span> {err}
              </div>
            )}

            {/* Location group */}
            <FormGroup label="Location">
              <FormRow label="Name" required>
                <input
                  style={INPUT_STYLE}
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  required
                  placeholder="Downtown Branch"
                  autoFocus
                />
              </FormRow>
              <FormRow label="Address">
                <input
                  style={INPUT_STYLE}
                  value={form.address || ''}
                  onChange={e => set('address', e.target.value)}
                  placeholder="123 Main St, New York, NY"
                />
              </FormRow>
              <div className="flex" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ flex: 1, borderRight: '1px solid rgba(255,255,255,0.06)', padding: '10px 16px' }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.38)', marginBottom: 4 }}>Phone</div>
                  <input
                    style={INPUT_STYLE}
                    value={form.phone || ''}
                    onChange={e => set('phone', e.target.value)}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div style={{ flex: 1, padding: '10px 16px' }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.38)', marginBottom: 4 }}>Timezone</div>
                  <select
                    style={{ ...INPUT_STYLE, cursor: 'pointer' }}
                    value={form.timezone}
                    onChange={e => set('timezone', e.target.value)}
                  >
                    <option value="America/New_York">Eastern (ET)</option>
                    <option value="America/Chicago">Central (CT)</option>
                    <option value="America/Denver">Mountain (MT)</option>
                    <option value="America/Los_Angeles">Pacific (PT)</option>
                    <option value="America/Phoenix">Arizona (MST)</option>
                    <option value="Pacific/Honolulu">Hawaii (HST)</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Europe/Dubai">Dubai (GST)</option>
                  </select>
                </div>
              </div>
              <div className="flex">
                <div style={{ flex: 1, borderRight: '1px solid rgba(255,255,255,0.06)', padding: '10px 16px' }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.38)', marginBottom: 4 }}>Delivery radius (mi)</div>
                  <input style={INPUT_STYLE} type="number" min="0" step="0.5" value={form.delivery_radius_miles} onChange={e => set('delivery_radius_miles', parseFloat(e.target.value))} />
                </div>
                <div style={{ flex: 1, padding: '10px 16px' }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.38)', marginBottom: 4 }}>Delivery fee ($)</div>
                  <input style={INPUT_STYLE} type="number" min="0" step="0.50" value={form.delivery_fee} onChange={e => set('delivery_fee', parseFloat(e.target.value))} />
                </div>
              </div>
            </FormGroup>

            {/* Manager access — create only */}
            {!isEdit && (
              <div style={{ marginTop: 16 }}>
                <FormGroup label="Manager Access">
                  <div style={{ padding: '12px 14px 14px' }}>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 10 }}>
                      Assign a manager who can log in to this location
                    </div>
                    <SegControl
                      value={managerTab}
                      onChange={setManagerTab}
                      options={[
                        { value: 'skip',    label: 'Skip for now' },
                        { value: 'connect', label: 'Connect login',  icon: '🔗' },
                        { value: 'create',  label: 'Create account', icon: '✦' },
                      ]}
                    />

                    {/* Connect — existing staff from another location */}
                    {managerTab === 'connect' && (
                      <div style={{ marginTop: 14 }}>
                        <div
                          className="rounded-xl p-3 mb-3"
                          style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.14)' }}
                        >
                          <div style={{ fontSize: 12, color: 'rgba(147,197,253,0.85)', lineHeight: 1.5 }}>
                            Enter the email of a manager who already has a login at one of your other restaurants. They'll get access to this location too.
                          </div>
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.38)', marginBottom: 6 }}>Manager email</div>
                        <div
                          className="rounded-xl"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', padding: '10px 14px' }}
                        >
                          <input
                            style={INPUT_STYLE}
                            type="email"
                            value={connectEmail}
                            onChange={e => setConnectEmail(e.target.value)}
                            placeholder="manager@yourrestaurant.com"
                          />
                        </div>
                      </div>
                    )}

                    {/* Create — brand new manager account */}
                    {managerTab === 'create' && (
                      <div style={{ marginTop: 14 }}>
                        <div
                          className="rounded-xl overflow-hidden"
                          style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}
                        >
                          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '10px 14px' }}>
                            <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.38)', marginBottom: 4 }}>Full name</div>
                            <input style={INPUT_STYLE} value={newMgr.name} onChange={e => setNewMgr(m => ({ ...m, name: e.target.value }))} placeholder="Jane Smith" />
                          </div>
                          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '10px 14px' }}>
                            <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.38)', marginBottom: 4 }}>Email</div>
                            <input style={INPUT_STYLE} type="email" value={newMgr.email} onChange={e => setNewMgr(m => ({ ...m, email: e.target.value }))} placeholder="jane@restaurant.com" />
                          </div>
                          <div style={{ padding: '10px 14px' }}>
                            <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.38)', marginBottom: 4 }}>Password</div>
                            <input style={INPUT_STYLE} type="password" value={newMgr.password} onChange={e => setNewMgr(m => ({ ...m, password: e.target.value }))} placeholder="Min 6 characters" />
                          </div>
                        </div>
                      </div>
                    )}

                    {managerTab === 'skip' && (
                      <div style={{ marginTop: 10, fontSize: 12, color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>
                        You can add managers later from the Staff panel on each location.
                      </div>
                    )}
                  </div>
                </FormGroup>
              </div>
            )}

            <div style={{ height: 16 }} />
          </div>

          {/* ── Footer ── */}
          <div
            className="flex gap-2 flex-shrink-0"
            style={{ padding: '12px 16px 16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: '0 0 auto',
                height: 44,
                padding: '0 20px',
                borderRadius: 14,
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.09)',
                color: 'rgba(255,255,255,0.55)',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 14,
                background: saving ? 'rgba(170,48,26,0.5)' : 'linear-gradient(135deg,#aa301a,#cb4830)',
                border: 'none',
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: '-0.01em',
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: saving ? 'none' : '0 4px 16px rgba(170,48,26,0.4)',
              }}
            >
              {saving && <SpinnerIcon s={14} />}
              {isEdit ? 'Save Changes' : 'Create Location'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

/* ── Chart helpers ────────────────────────────────────────────────── */
const PERIOD_OPTIONS = [
  { value: 7,   label: '7d'  },
  { value: 30,  label: '30d' },
  { value: 90,  label: '90d' },
  { value: 365, label: '12m' },
]

const LOC_COLORS = ['#1d6fcc','#c44228','#6d28d9','#0f9f6e','#f59e0b','#ef4444']

function fmtDate(d, days) {
  // For 12m view, d is 'YYYY-MM'; for shorter views, d is 'YYYY-MM-DD'
  const iso = d.length === 7 ? d + '-01' : d
  const dt = new Date(iso + 'T00:00:00')
  if (days <= 30) return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  if (days <= 90) return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return dt.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

// Build per-location chart data.
// Returns { data: [{date, <locId>: revenue, ...}], locIds: [id,...] }
// For ≤90d: daily rows. For 365d: monthly rows (grouped by YYYY-MM).
function buildChartData(timeseries, locations, days) {
  if (!timeseries || Object.keys(timeseries).length === 0) return { data: [], locIds: [] }
  // Keep location order consistent with the locations array
  const locIds = locations.map(l => l.id).filter(id => timeseries[id])
  if (locIds.length === 0) return { data: [], locIds: [] }

  if (days <= 90) {
    const spine = timeseries[locIds[0]] || []
    const data = spine.map(point => {
      const row = { date: point.date }
      locIds.forEach(id => {
        const match = timeseries[id]?.find(p => p.date === point.date)
        row[id] = Math.round((match?.revenue || 0) * 100) / 100
        row[`${id}_orders`] = match?.orders || 0
      })
      return row
    })
    return { data, locIds }
  }

  // 12m: group by YYYY-MM
  const monthly = {}
  locIds.forEach(id => {
    ;(timeseries[id] || []).forEach(point => {
      const month = point.date.slice(0, 7)
      if (!monthly[month]) {
        monthly[month] = { date: month }
        locIds.forEach(lid => { monthly[month][lid] = 0; monthly[month][`${lid}_orders`] = 0 })
      }
      monthly[month][id] = Math.round(((monthly[month][id] || 0) + (point.revenue || 0)) * 100) / 100
      monthly[month][`${id}_orders`] = (monthly[month][`${id}_orders`] || 0) + (point.orders || 0)
    })
  })
  const data = Object.values(monthly).sort((a, b) => a.date.localeCompare(b.date))
  return { data, locIds }
}

// Per-location comparison data — sorted by revenue, includes % share
function buildLocBarData(analytics, locations) {
  const rows = locations.map(loc => {
    const a = analytics.find(x => x.id === loc.id) || {}
    return {
      id: loc.id,
      name: loc.name,
      shortName: loc.name.length > 16 ? loc.name.slice(0, 15) + '…' : loc.name,
      Revenue: Math.round((a.period_revenue || 0) * 100) / 100,
      Orders:  a.period_orders || 0,
      Avg:     Math.round((a.avg_order_value || 0) * 100) / 100,
    }
  }).sort((a, b) => b.Revenue - a.Revenue)

  const totalRev    = rows.reduce((s, r) => s + r.Revenue, 0)
  const totalOrders = rows.reduce((s, r) => s + r.Orders, 0)
  return rows.map(r => ({
    ...r,
    revShare:    totalRev    > 0 ? Math.round(r.Revenue / totalRev    * 100) : 0,
    orderShare:  totalOrders > 0 ? Math.round(r.Orders  / totalOrders * 100) : 0,
  }))
}

const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    background: 'var(--card-bg)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    fontSize: 12,
    color: 'var(--text-1)',
    boxShadow: 'var(--shadow-md)',
  },
  labelStyle: { color: 'var(--text-3)', marginBottom: 4 },
  cursor: { fill: 'rgba(184,66,38,0.05)' },
}

const TICK_STYLE = { fill: 'var(--text-3)', fontSize: 10 }

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="card" style={{ padding: '20px 20px 16px' }}>
      <div className="mb-4">
        <div className="font-semibold text-sm" style={{ color: 'var(--text-1)', letterSpacing: '-0.01em' }}>{title}</div>
        {subtitle && <div className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  )
}

/* ── Main Page ────────────────────────────────────────────────────── */
export default function Locations() {
  const ww       = useWindowWidth()
  const isMobile = ww < 640
  const isTablet = ww >= 640 && ww < 1024

  const { locations: ctxLocations, loadLocations } = useLocationCtx()
  const [locations, setLocations] = useState([])
  const [analytics, setAnalytics] = useState([])
  const [analyticsTotal, setAnalyticsTotal] = useState(null)
  const [timeseries, setTimeseries] = useState({})
  const [loading, setLoading] = useState(true)
  const [analyticsDays, setAnalyticsDays] = useState(30)
  const [compareMetric, setCompareMetric] = useState('Revenue')
  const [editingLocation, setEditingLocation] = useState(null)  // null | location | {}
  const [staffLocation, setStaffLocation] = useState(null)
  const [tab, setTab] = useState('overview')  // 'overview' | 'locations'

  // Seed from context immediately so the page is never blank while the API loads
  useEffect(() => {
    if (ctxLocations?.length > 0 && locations.length === 0) {
      setLocations(ctxLocations)
    }
  }, [ctxLocations]) // eslint-disable-line

  const load = async () => {
    setLoading(true)
    // Each fetch is independent — one failure never hides another section
    try {
      const locRes = await locationsApi.list()
      setLocations(unwrapList(locRes))
      loadLocations()
    } catch (e) {
      if (ctxLocations?.length > 0) setLocations(ctxLocations)
      console.error('Locations load failed:', e)
    }
    try {
      const anaRes = await locationsApi.analytics(analyticsDays)
      const data = unwrap(anaRes) || {}
      setAnalytics(data.locations || data || [])
      setAnalyticsTotal(data.totals || null)
    } catch { /* non-fatal */ }
    try {
      const tsRes = await managerApi.timeseries(analyticsDays)
      setTimeseries(unwrap(tsRes) || {})
    } catch { /* non-fatal */ }
    setLoading(false)
  }

  useEffect(() => { load() }, [analyticsDays]) // eslint-disable-line

  const handleSaveLocation = async (form, managerData) => {
    if (editingLocation?.id) {
      await locationsApi.update(editingLocation.id, form)
    } else {
      const res = await locationsApi.create(form)
      const newLocationId = (unwrap(res) || {}).id

      if (managerData?.mode === 'create') {
        // Brand new manager account for this location
        try {
          await staffApi.create({
            name: managerData.name,
            email: managerData.email,
            password: managerData.password,
            role: 'manager',
            restaurant_id: newLocationId,
            can_view_all_locations: false,
          })
        } catch (ex) {
          throw Object.assign(
            new Error(ex.response?.data?.detail || 'Location created but failed to create manager account'),
            { response: ex.response }
          )
        }
      } else if (managerData?.mode === 'connect') {
        // Link an existing staff member from another location to this one
        try {
          const allStaff = await staffApi.list()
          const match = unwrapList(allStaff).find(s => s.email.toLowerCase() === managerData.email.toLowerCase())
          if (!match) {
            throw Object.assign(
              new Error(`No staff member found with email "${managerData.email}". Check the email or create a new account instead.`),
              { response: { data: { detail: `No staff member found with email "${managerData.email}". Check the email or create a new account instead.` } } }
            )
          }
          await staffApi.update(match.id, { restaurant_id: newLocationId, can_view_all_locations: true })
        } catch (ex) {
          if (ex.response?.data?.detail) throw ex
          throw Object.assign(
            new Error('Location created but failed to link existing manager. Try the Staff panel.'),
            { response: { data: { detail: 'Location created but failed to link existing manager. Try the Staff panel.' } } }
          )
        }
      }
    }
    await load()
  }

  const handleDelete = async (loc) => {
    if (!confirm(`Delete location "${loc.name}"? This cannot be undone.`)) return
    try {
      await locationsApi.delete(loc.id)
      await load()
    } catch (ex) {
      alert(ex.response?.data?.detail || 'Failed to delete')
    }
  }

  const [seeding, setSeeding] = useState(false)
  const handleSeed = async () => {
    setSeeding(true)
    try {
      const res = await locationsApi.seed()
      await load()
      if (res.data.seeded === 0) alert(res.data.message)
    } catch (ex) {
      alert(ex.response?.data?.detail || 'Failed to seed locations')
    }
    setSeeding(false)
  }

  const [seedingAnalytics, setSeedingAnalytics] = useState(false)
  const handleSeedAnalytics = async () => {
    setSeedingAnalytics(true)
    try {
      const res = await locationsApi.seedAnalytics()
      await load()
      const { seeded_locations, seeded_orders } = res.data
      if (seeded_orders === 0 && seeded_locations === 0) {
        alert('All locations already have order data — nothing new seeded.')
      }
    } catch (ex) {
      alert(ex.response?.data?.detail || 'Failed to seed analytics data')
    }
    setSeedingAnalytics(false)
  }

  return (
    <Layout>
      <div className="app-page">
        <PageHeader
          icon={MapPinIcon}
          title="Locations"
          subtitle="Manage branches, staff access, and cross-location analytics"
          accent="var(--primary)"
          accentBg="rgba(184,66,38,0.10)"
        >
          <div className="page-toolbar">
            {locations.length < 2 && (
              <button
                onClick={handleSeed}
                disabled={seeding}
                className="btn-secondary"
                style={{ height: 38, fontSize: 12, borderRadius: 12 }}
              >
                {seeding ? <SpinnerIcon s={13} /> : <span>🏪</span>}
                {isMobile ? 'Sample Locations' : 'Load Sample Locations'}
              </button>
            )}
            <button
              onClick={handleSeedAnalytics}
              disabled={seedingAnalytics}
              className="btn-secondary"
              style={{ height: 38, fontSize: 12, borderRadius: 12 }}
              title="Seed 12 months of realistic order history for all locations"
            >
              {seedingAnalytics ? <SpinnerIcon s={13} /> : <span>📈</span>}
              {seedingAnalytics ? 'Seeding…' : isMobile ? '12-Month Data' : 'Load 12-Month Data'}
            </button>
            <button onClick={() => setEditingLocation({})} className="btn-primary" style={{ height: 38, fontSize: 12 }}>
              <PlusIcon s={14} /> {isMobile ? 'Add' : 'Add Location'}
            </button>
          </div>
        </PageHeader>

        {/* Tabs */}
        <div
          className="tab-row mb-5 p-1 rounded-xl"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', width: 'fit-content' }}
        >
          {[['overview', 'Overview'], ['locations', 'Locations']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="tab-btn"
              style={{
                fontSize: 13,
                padding: '6px 16px',
                ...(tab === key ? { background: 'var(--page-accent)', color: '#fff' } : {}),
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><SpinnerIcon s={24} /></div>
        ) : (
          <>
            {/* ── Overview tab ── */}
            {tab === 'overview' && (() => {
              const { data: chartData, locIds: chartLocIds } = buildChartData(timeseries, locations, analyticsDays)
              const locBarData = buildLocBarData(analytics, locations)
              const hasChartData = chartData.length > 0 && chartLocIds.some(id => chartData.some(d => (d[id] || 0) > 0))
              // For 12m monthly data (12 pts) show every tick; for daily data thin out
              const tickEvery = analyticsDays >= 365 ? 1 : analyticsDays <= 14 ? 2 : analyticsDays <= 30 ? 5 : 14

              return (
                <div className="space-y-5">
                  {/* Period selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium" style={{ color: 'var(--text-3)' }}>Period:</span>
                    <div className="segmented-tabs">
                    {PERIOD_OPTIONS.map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => setAnalyticsDays(value)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 7,
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 600,
                          background: analyticsDays === value ? '#fff' : 'transparent',
                          color: analyticsDays === value ? 'var(--page-accent)' : 'var(--text-3)',
                          boxShadow: analyticsDays === value ? '0 1px 4px rgba(27,28,29,0.10)' : 'none',
                        }}
                      >
                        {label}
                      </button>
                    ))}
                    </div>
                  </div>

                  {/* Summary stat strip */}
                  {locations.length > 0 && (
                    <div className="grid gap-3" style={{ gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)' }}>
                      <StatCard label="Total Locations" value={locations.length} />
                      <StatCard
                        label={`Revenue (${PERIOD_OPTIONS.find(p=>p.value===analyticsDays)?.label})`}
                        value={`$${(analyticsTotal?.period_revenue || 0).toLocaleString()}`}
                        accent="#059669"
                      />
                      <StatCard
                        label={`Orders (${PERIOD_OPTIONS.find(p=>p.value===analyticsDays)?.label})`}
                        value={(analyticsTotal?.period_orders || 0).toLocaleString()}
                      />
                      <StatCard
                        label="Active Now"
                        value={analyticsTotal?.active_orders || 0}
                        accent={(analyticsTotal?.active_orders || 0) > 0 ? '#d97706' : undefined}
                      />
                    </div>
                  )}

                  {/* ── Revenue trend — one line per location ── */}
                  <ChartCard
                    title="Revenue Trend"
                    subtitle={`Revenue by location · ${PERIOD_OPTIONS.find(p=>p.value===analyticsDays)?.label}`}
                  >
                    {!hasChartData ? (
                      <div className="flex items-center justify-center py-10 text-sm" style={{ color: 'var(--text-3)' }}>
                        No revenue data yet · click <strong style={{color:'var(--text-1)'}}>📈 Load 12-Month Data</strong> to seed sample history
                      </div>
                    ) : (
                      <>
                        <ResponsiveContainer width="100%" height={isMobile ? 180 : 240}>
                          <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                            <defs>
                              {chartLocIds.map((id, i) => (
                                <linearGradient key={id} id={`rg${i}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%"  stopColor={LOC_COLORS[i % LOC_COLORS.length]} stopOpacity={0.22}/>
                                  <stop offset="95%" stopColor={LOC_COLORS[i % LOC_COLORS.length]} stopOpacity={0}/>
                                </linearGradient>
                              ))}
                            </defs>
                            <CartesianGrid vertical={false} stroke="var(--border)" opacity={0.55} />
                            <XAxis
                              dataKey="date"
                              tick={TICK_STYLE}
                              axisLine={{ stroke: 'var(--border)' }}
                              tickLine={false}
                              tickFormatter={(d, i) => i % tickEvery === 0 ? fmtDate(d, analyticsDays) : ''}
                            />
                            <YAxis
                              tick={TICK_STYLE}
                              axisLine={false} tickLine={false} width={52}
                              tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(1)+'k' : v}`}
                            />
                            <Tooltip
                              {...CHART_TOOLTIP_STYLE}
                              labelFormatter={d => fmtDate(d, analyticsDays)}
                              formatter={(v, key) => {
                                const loc = locations.find(l => l.id === key)
                                return [`$${Number(v).toLocaleString()}`, loc?.name || key]
                              }}
                            />
                            {chartLocIds.map((id, i) => (
                              <Area
                                key={id}
                                type="monotone"
                                dataKey={id}
                                stroke={LOC_COLORS[i % LOC_COLORS.length]}
                                strokeWidth={2}
                                fill={`url(#rg${i})`}
                                dot={false}
                                activeDot={{ r: 4, strokeWidth: 0 }}
                              />
                            ))}
                          </AreaChart>
                        </ResponsiveContainer>
                        {/* Color legend */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                          {chartLocIds.map((id, i) => {
                            const loc = locations.find(l => l.id === id)
                            const a = analytics.find(x => x.id === id)
                            return (
                              <div key={id} className="flex items-center gap-1.5">
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: LOC_COLORS[i % LOC_COLORS.length], flexShrink: 0 }} />
                                <span className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>
                                  {loc?.name || 'Location'}
                                </span>
                                {a && (
                                  <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                                    ${(a.period_revenue || 0).toLocaleString()}
                                  </span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </>
                    )}
                  </ChartCard>

                  {/* ── Orders volume chart — stacked per location ── */}
                  <ChartCard
                    title="Order Volume"
                    subtitle="Orders by location · stacked"
                  >
                    {!hasChartData ? (
                      <div className="flex items-center justify-center py-10 text-sm" style={{ color: 'var(--text-3)' }}>
                        No order data for this period yet
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={isMobile ? 140 : 180}>
                        <BarChart data={chartData} barCategoryGap="35%">
                          <CartesianGrid vertical={false} stroke="var(--border)" opacity={0.55} />
                          <XAxis
                            dataKey="date"
                            tick={TICK_STYLE}
                            axisLine={{ stroke: 'var(--border)' }}
                            tickLine={false}
                            tickFormatter={(d, i) => i % tickEvery === 0 ? fmtDate(d, analyticsDays) : ''}
                          />
                          <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} width={32} />
                          <Tooltip
                            {...CHART_TOOLTIP_STYLE}
                            labelFormatter={d => fmtDate(d, analyticsDays)}
                            formatter={(v, key) => {
                              const id = key.replace('_orders','')
                              const loc = locations.find(l => l.id === id)
                              return [v, loc?.name || id]
                            }}
                          />
                          {chartLocIds.map((id, i) => (
                            <Bar
                              key={id}
                              dataKey={`${id}_orders`}
                              stackId="orders"
                              fill={LOC_COLORS[i % LOC_COLORS.length]}
                              radius={i === chartLocIds.length - 1 ? [3,3,0,0] : [0,0,0,0]}
                            />
                          ))}
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </ChartCard>

                  {/* ── Location Leaderboard ── */}
                  {locations.length > 0 && (() => {
                    const MEDALS = ['🥇','🥈','🥉']
                    const periodLabel = PERIOD_OPTIONS.find(p => p.value === analyticsDays)?.label
                    const METRICS = [
                      { key: 'Revenue', label: 'Revenue', fmt: v => `$${Number(v).toLocaleString()}`, shareKey: 'revShare' },
                      { key: 'Orders',  label: 'Orders',  fmt: v => v.toLocaleString(),               shareKey: 'orderShare' },
                      { key: 'Avg',     label: 'Avg Order',fmt: v => `$${Number(v).toFixed(2)}`,       shareKey: 'revShare' },
                    ]
                    const metric = METRICS.find(m => m.key === compareMetric) || METRICS[0]
                    // Sort by selected metric descending
                    const sorted = [...locBarData].sort((a, b) => b[metric.key] - a[metric.key])
                    const maxVal = sorted[0]?.[metric.key] || 1

                    return (
                      <div className="card" style={{ padding: '20px 20px 20px' }}>
                        {/* Header */}
                        <div className={`flex ${isMobile ? 'flex-col' : 'items-center justify-between'} mb-5 gap-3`}>
                          <div>
                            <div className="font-semibold text-sm" style={{ color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
                              Location Comparison
                            </div>
                            <div className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                              Sales performance by branch · {periodLabel}
                            </div>
                          </div>
                          {/* Metric toggle */}
                          <div className="segmented-tabs" style={{ alignSelf: isMobile ? 'flex-start' : 'auto' }}>
                            {METRICS.map(m => (
                              <button
                                key={m.key}
                                onClick={() => setCompareMetric(m.key)}
                                className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                                style={{
                                  background: compareMetric === m.key ? '#fff' : 'transparent',
                                  color: compareMetric === m.key ? 'var(--page-accent)' : 'var(--text-3)',
                                  boxShadow: compareMetric === m.key ? '0 1px 4px rgba(27,28,29,0.10)' : 'none',
                                }}
                              >
                                {m.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Rows */}
                        <div className="space-y-4">
                          {sorted.map((row, i) => {
                            const color = LOC_COLORS[locBarData.findIndex(r => r.id === row.id) % LOC_COLORS.length]
                            const pct   = maxVal > 0 ? Math.round(row[metric.key] / maxVal * 100) : 0
                            const share = row[metric.shareKey]
                            const isTop = i === 0 && row[metric.key] > 0
                            return (
                              <div key={row.id}>
                                <div className="flex items-center justify-between mb-2">
                                  {/* Left: medal + name */}
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }}>
                                      {i < 3 && row[metric.key] > 0 ? MEDALS[i] : (
                                        <span className="text-xs font-bold" style={{ color: 'var(--text-3)' }}>#{i+1}</span>
                                      )}
                                    </span>
                                    <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-1)' }}>
                                      {row.shortName}
                                    </span>
                                    {isTop && (
                                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0" style={{ background: 'var(--page-accent-light)', color: 'var(--page-accent)' }}>
                                        Top
                                      </span>
                                    )}
                                  </div>
                                  {/* Right: value + share */}
                                  <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                                    {share > 0 && (
                                      <span className="text-xs" style={{ color: 'var(--text-3)' }}>{share}% of total</span>
                                    )}
                                    <span className="text-sm font-bold" style={{ color: row[metric.key] > 0 ? 'var(--text-1)' : 'var(--text-3)' }}>
                                      {metric.fmt(row[metric.key])}
                                    </span>
                                  </div>
                                </div>
                                {/* Progress bar */}
                                <div style={{ height: 8, background: 'var(--surface-3)', borderRadius: 4, overflow: 'hidden' }}>
                                  <div style={{
                                    height: '100%',
                                    width: `${pct}%`,
                                    background: color,
                                    borderRadius: 4,
                                    transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
                                    opacity: row[metric.key] > 0 ? 1 : 0.3,
                                  }} />
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {/* Winner callout */}
                        {sorted[0]?.[metric.key] > 0 && (
                          <div className="mt-5 pt-4 flex items-center gap-3" style={{ borderTop: '1px solid var(--border)' }}>
                            <span style={{ fontSize: 20 }}>🏆</span>
                            <div>
                              <span className="text-xs font-semibold" style={{ color: 'var(--page-accent)' }}>
                                {sorted[0].shortName}
                              </span>
                              <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                                {' '}leads with {metric.fmt(sorted[0][metric.key])} in {metric.label.toLowerCase()} this {periodLabel}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })()}

                  {/* ── Per-location summary rows ── */}
                  {locations.length === 0 ? (
                    <div className="card text-center py-12" style={{ color: 'var(--text-3)' }}>
                      <MapPinIcon s={28} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                      <div className="text-sm">No locations yet. Add your first branch to get started.</div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-xs font-semibold mb-3" style={{ color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        All Locations
                      </div>
                      <div className="space-y-3">
                        {locations.map((loc, i) => {
                          const a = analytics.find(x => x.id === loc.id) || {
                            period_orders: 0, period_revenue: 0,
                            today_orders: 0, today_revenue: 0,
                            active_orders: 0, avg_order_value: 0,
                          }
                          const hasOrders = a.period_orders > 0
                          const accent = LOC_COLORS[i % LOC_COLORS.length]
                          return (
                            <div key={loc.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                              <div style={{ height: 3, background: accent }} />
                              <div className={`flex ${isMobile ? 'flex-col' : 'items-start'} gap-3 p-4`}>
                                {/* Rank + name row on mobile */}
                                <div className={`flex items-center gap-3 ${isMobile ? '' : 'contents'}`}>
                                  <div className="flex items-center justify-center rounded-xl flex-shrink-0 font-bold"
                                    style={{ width: 36, height: 36, fontSize: 13, background: `${accent}18`, color: accent }}>
                                    #{i + 1}
                                  </div>
                                  {/* Info */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>{loc.name}</span>
                                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{
                                        background: loc.is_active ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                                        color: loc.is_active ? '#16a34a' : '#ef4444',
                                      }}>{loc.is_active ? 'Active' : 'Inactive'}</span>
                                      {a.active_orders > 0 && (
                                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(245,158,11,0.12)', color: '#d97706' }}>
                                          {a.active_orders} active now
                                        </span>
                                      )}
                                    </div>
                                    {loc.address && <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-3)' }}>{loc.address}</div>}
                                    <div className="mt-1.5"><ManagerChips managers={loc.managers} /></div>
                                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                                      <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                                        <UserIcon s={10} style={{ display: 'inline', marginRight: 3 }} />{loc.staff_count} staff
                                      </span>
                                      {!isMobile && <span className="text-xs" style={{ color: 'var(--text-3)' }}>🛵 {loc.delivery_radius_miles}mi · ${loc.delivery_fee} fee</span>}
                                    </div>
                                  </div>
                                </div>
                                {/* Revenue — inline on desktop, full-width row on mobile */}
                                <div className={isMobile ? 'flex items-center justify-between px-1' : 'text-right flex-shrink-0'}>
                                  <div className="text-xl font-bold" style={{ color: hasOrders ? '#059669' : 'var(--text-3)', letterSpacing: '-0.02em' }}>
                                    ${a.period_revenue.toLocaleString()}
                                  </div>
                                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                                    {PERIOD_OPTIONS.find(p=>p.value===analyticsDays)?.label} revenue
                                  </div>
                                </div>
                              </div>
                              {/* Stats row */}
                              <div className="grid px-4 pb-4 gap-2" style={{ gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)' }}>
                                {[
                                  [`Orders`, a.period_orders],
                                  ['Today Orders', a.today_orders],
                                  ['Today Revenue', `$${a.today_revenue}`],
                                  ['Avg Order', `$${a.avg_order_value}`],
                                ].map(([label, value]) => (
                                  <div key={label} className="rounded-xl px-3 py-2" style={{ background: 'var(--bg)' }}>
                                    <div className="text-xs mb-0.5" style={{ color: 'var(--text-3)', fontSize: 10 }}>{label}</div>
                                    <div className="font-semibold text-sm" style={{ color: hasOrders ? 'var(--text-1)' : 'var(--text-3)' }}>{value}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}

            {/* ── Locations tab ── */}
            {tab === 'locations' && (
              <div>
                {locations.length === 0 ? (
                  <div className="card text-center py-12" style={{ color: 'var(--text-3)' }}>
                    <MapPinIcon s={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                    <div className="text-sm font-medium mb-1" style={{ color: 'var(--text-2)' }}>No locations yet</div>
                    <div className="text-xs mb-4">Click "Add Location" to create your first branch.</div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(auto-fill, minmax(280px, 1fr))' : 'repeat(auto-fill, minmax(340px, 1fr))', gap: isMobile ? 12 : 16 }}>
                    {locations.map((loc, i) => {
                      const a = analytics.find(x => x.id === loc.id) || {
                        period_orders: 0, period_revenue: 0,
                        today_orders: 0, today_revenue: 0,
                        active_orders: 0, avg_order_value: 0,
                      }
                      const ACCENT_COLORS = ['#1d6fcc', '#c44228', '#6d28d9', '#0f9f6e', '#f59e0b']
                      const accent = ACCENT_COLORS[i % ACCENT_COLORS.length]
                      return (
                        <div
                          key={loc.id}
                          className="card"
                          style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                        >
                          {/* Color bar */}
                          <div style={{ height: 3, background: `linear-gradient(90deg, ${accent}, ${accent}66)`, flexShrink: 0 }} />

                          {/* Main content */}
                          <div style={{ padding: '16px 18px 14px', flex: 1 }}>
                            {/* Name + status */}
                            <div className="flex items-start justify-between gap-3 mb-1">
                              <div className="font-bold text-base" style={{ color: 'var(--text-1)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                                {loc.name}
                              </div>
                              <span className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0" style={{
                                background: loc.is_active ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                                color: loc.is_active ? '#16a34a' : '#ef4444',
                              }}>
                                {loc.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>

                            {/* Address */}
                            {loc.address && (
                              <div className="flex items-center gap-1 mb-3" style={{ color: 'var(--text-3)', fontSize: 12 }}>
                                <MapPinIcon s={11} />
                                <span className="truncate">{loc.address}</span>
                              </div>
                            )}

                            {/* Manager section — prominent */}
                            <div
                              className="rounded-xl px-3 py-2.5 mb-3"
                              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                            >
                              <div className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text-3)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                Manager
                              </div>
                              {loc.managers && loc.managers.length > 0 ? (
                                <div className="space-y-1.5">
                                  {loc.managers.map(m => (
                                    <div key={m.id} className="flex items-center gap-2">
                                      <div
                                        className="flex items-center justify-center rounded-lg font-bold flex-shrink-0"
                                        style={{ width: 26, height: 26, background: `${accent}22`, color: accent, fontSize: 10 }}
                                      >
                                        {m.name.slice(0, 2).toUpperCase()}
                                      </div>
                                      <div className="min-w-0">
                                        <div className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{m.name}</div>
                                        <div className="text-xs truncate" style={{ color: 'var(--text-3)' }}>{m.email}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center justify-center rounded-lg" style={{ width: 26, height: 26, background: 'var(--surface-3)' }}>
                                    <UserIcon s={12} style={{ color: 'var(--text-3)' }} />
                                  </div>
                                  <span className="text-sm" style={{ color: 'var(--text-3)' }}>No manager assigned</span>
                                </div>
                              )}
                            </div>

                            {/* Quick stats row */}
                            <div className="grid grid-cols-3 gap-2 mb-3">
                              {[
                                ['Staff', loc.staff_count],
                                ['Orders (30d)', a.period_orders],
                                ['Revenue', `$${(a.period_revenue || 0).toLocaleString()}`],
                              ].map(([label, val]) => (
                                <div key={label} className="rounded-lg px-2 py-1.5 text-center" style={{ background: 'var(--bg)' }}>
                                  <div className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>{val}</div>
                                  <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>{label}</div>
                                </div>
                              ))}
                            </div>

                            {/* Phone + delivery */}
                            <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-3)' }}>
                              {loc.phone && <span>{loc.phone}</span>}
                              <span>🛵 {loc.delivery_radius_miles}mi · ${loc.delivery_fee} fee</span>
                            </div>
                          </div>

                          {/* Action footer */}
                          <div
                            className="flex items-center gap-2 px-4 py-3"
                            style={{ borderTop: '1px solid var(--border)' }}
                          >
                            <button
                              onClick={() => setStaffLocation(loc)}
                              className="btn-secondary flex items-center gap-1.5 text-xs flex-1 justify-center"
                              style={{ height: 32 }}
                            >
                              <UserIcon s={12} /> Staff
                            </button>
                            <button
                              onClick={() => setEditingLocation(loc)}
                              className="btn-secondary flex items-center gap-1.5 text-xs flex-1 justify-center"
                              style={{ height: 32 }}
                            >
                              <EditIcon s={12} /> Edit
                            </button>
                            <button
                              onClick={() => handleDelete(loc)}
                              className="flex items-center justify-center rounded-lg transition-colors flex-shrink-0"
                              style={{ width: 32, height: 32, background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}
                            >
                              <TrashIcon s={13} />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {editingLocation !== null && (
        <LocationFormModal
          initial={editingLocation?.id ? editingLocation : null}
          onSave={handleSaveLocation}
          onClose={() => setEditingLocation(null)}
        />
      )}
      {staffLocation && (
        <StaffModal location={staffLocation} onClose={() => setStaffLocation(null)} />
      )}
    </Layout>
  )
}
