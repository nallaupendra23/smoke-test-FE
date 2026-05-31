import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'
import Layout from '../components/Layout'
import { managerApi, locationsApi, staffApi, unwrap, unwrapList } from '../services/api'

/* ── Constants ──────────────────────────────────────────────────────── */
const PERIODS = [
  { value: 7,  label: '7d'  },
  { value: 30, label: '30d' },
  { value: 90, label: '90d' },
]

const BRAND  = '#aa301a'
const GREEN  = '#30d158'
const YELLOW = '#ffd60a'
const RED    = '#ff453a'
const BLUE   = '#0a84ff'
const PURPLE = '#bf5af2'
const CARD_BG      = 'rgba(255,255,255,0.04)'
const CARD_BORDER  = '1px solid rgba(255,255,255,0.08)'
const TEXT_PRIMARY = 'rgba(255,255,255,0.92)'
const TEXT_MUTED   = 'rgba(255,255,255,0.38)'
const TEXT_DIM     = 'rgba(255,255,255,0.22)'

/* ── Helpers ────────────────────────────────────────────────────────── */
const fmt$ = (n) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${(n || 0).toFixed(0)}`
const fmtNum = (n) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n || 0)
const fmtDate = (d) => {
  const dt = new Date(d + 'T00:00:00')
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/* ── Inline icons ───────────────────────────────────────────────────── */
function BarChartIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  )
}
function RefreshIcon({ size = 14, spin = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ animation: spin ? 'spin 1s linear infinite' : 'none' }}>
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  )
}
function StarIcon({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  )
}
function LocationPinIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  )
}
function TrendUpIcon({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  )
}
function LeafIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
    </svg>
  )
}
function GlobeIcon({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  )
}
function EditIcon({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}
function CloseIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}

/* ── Period selector ────────────────────────────────────────────────── */
function PeriodPicker({ value, onChange }) {
  return (
    <div style={{
      display: 'flex', gap: 2, padding: '3px',
      background: 'rgba(255,255,255,0.06)',
      borderRadius: 10, border: CARD_BORDER,
    }}>
      {PERIODS.map(p => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          style={{
            padding: '4px 14px', borderRadius: 8, border: 'none',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.15s',
            background: value === p.value
              ? 'linear-gradient(135deg, #aa301a, #cb4830)'
              : 'transparent',
            color: value === p.value ? '#fff' : TEXT_MUTED,
            boxShadow: value === p.value ? '0 2px 8px rgba(170,48,26,0.4)' : 'none',
          }}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}

/* ── Summary stat strip ─────────────────────────────────────────────── */
function StatChip({ label, value, sub, color = TEXT_PRIMARY }) {
  return (
    <div style={{
      background: CARD_BG, border: CARD_BORDER,
      borderRadius: 16, padding: '16px 20px', flex: '1 1 140px',
    }}>
      <div style={{ fontSize: 22, fontWeight: 700, color, letterSpacing: '-0.03em', lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 3, fontWeight: 500 }}>{sub}</div>
      )}
      <div style={{ fontSize: 11, color: TEXT_DIM, marginTop: 6, letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>
        {label}
      </div>
    </div>
  )
}

/* ── Rating badge ───────────────────────────────────────────────────── */
function RatingBadge({ ratings }) {
  const google = ratings?.find(r => r.source === 'google')
  if (!google) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: TEXT_DIM }}>
      <GlobeIcon size={11} />
      <span>No rating synced</span>
    </div>
  )
  return (
    <a
      href={google.url || '#'}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        fontSize: 12, fontWeight: 600, color: YELLOW,
        textDecoration: 'none',
      }}
    >
      <StarIcon size={11} />
      <span>{google.rating?.toFixed(1) ?? '—'}</span>
      {google.review_count && (
        <span style={{ color: TEXT_MUTED, fontWeight: 400 }}>({fmtNum(google.review_count)})</span>
      )}
      <span style={{ fontSize: 10, color: TEXT_DIM, fontWeight: 400 }}>Google</span>
    </a>
  )
}

/* ── Mini sparkline inside each location card ───────────────────────── */
function Sparkline({ data, color = BRAND }) {
  if (!data || data.length === 0) return (
    <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: 11, color: TEXT_DIM }}>No order data</span>
    </div>
  )
  return (
    <ResponsiveContainer width="100%" height={56}>
      <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0}   />
          </linearGradient>
        </defs>
        <Area
          type="monotone" dataKey="revenue" stroke={color} strokeWidth={1.5}
          fill={`url(#spark-${color.replace('#', '')})`}
          dot={false} isAnimationActive={false}
        />
        <Tooltip
          contentStyle={{ background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
          labelFormatter={fmtDate}
          formatter={(v) => [fmt$(v), 'Revenue']}
          labelStyle={{ color: TEXT_MUTED }}
          itemStyle={{ color: TEXT_PRIMARY }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

/* ── Location performance card ──────────────────────────────────────── */
const CARD_COLORS = [BRAND, BLUE, GREEN, PURPLE, '#ff9f0a']

function LocationCard({ loc, timeseries, index, onAssign }) {
  const color = CARD_COLORS[index % CARD_COLORS.length]
  const sparkData = timeseries || []
  const hasOrders = loc.period_orders > 0

  return (
    <div style={{
      background: '#141414',
      border: CARD_BORDER,
      borderRadius: 20,
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      transition: 'transform 0.15s, box-shadow 0.15s',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = `0 12px 32px rgba(0,0,0,0.4), 0 0 0 1px ${color}22`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'none'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Color accent bar */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${color}, ${color}88)` }} />

      {/* Header */}
      <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {loc.name}
            </div>
            {loc.address && (
              <div style={{ fontSize: 11, color: TEXT_DIM, marginTop: 3, display: 'flex', alignItems: 'center', gap: 3 }}>
                <LocationPinIcon size={10} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                  {loc.address}
                </span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
              padding: '2px 7px', borderRadius: 6,
              background: loc.is_active ? `${GREEN}18` : 'rgba(255,255,255,0.06)',
              color: loc.is_active ? GREEN : TEXT_DIM,
            }}>
              {loc.is_active ? 'Active' : 'Inactive'}
            </div>
            <RatingBadge ratings={loc.ratings} />
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '12px 18px', gap: 8 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: hasOrders ? TEXT_PRIMARY : TEXT_DIM, letterSpacing: '-0.03em' }}>
            {fmt$(loc.period_revenue)}
          </div>
          <div style={{ fontSize: 10, color: TEXT_DIM, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Revenue</div>
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: hasOrders ? TEXT_PRIMARY : TEXT_DIM, letterSpacing: '-0.03em' }}>
            {fmtNum(loc.period_orders)}
          </div>
          <div style={{ fontSize: 10, color: TEXT_DIM, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Orders</div>
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: loc.active_orders > 0 ? GREEN : TEXT_DIM, letterSpacing: '-0.03em' }}>
            {loc.active_orders}
          </div>
          <div style={{ fontSize: 10, color: TEXT_DIM, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Live</div>
        </div>
      </div>

      {/* Sparkline */}
      <div style={{ padding: '0 12px 8px' }}>
        <Sparkline data={sparkData} color={color} />
      </div>

      {/* Footer */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '8px 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ fontSize: 11, color: TEXT_DIM }}>
          {loc.staff_count} staff · avg {fmt$(loc.avg_order_value)}/order
        </div>
        <div style={{ fontSize: 11, color: TEXT_DIM }}>
          Today: <span style={{ color: TEXT_MUTED, fontWeight: 600 }}>{fmt$(loc.today_revenue)}</span>
        </div>
      </div>
    </div>
  )
}

/* ── Custom bar chart tooltip ───────────────────────────────────────── */
function ExpenseTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 10, padding: '10px 14px', fontSize: 12,
    }}>
      <div style={{ color: TEXT_MUTED, marginBottom: 6, fontWeight: 500 }}>{fmtDate(label)}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, color: p.color, marginBottom: 2 }}>
          <span>{p.name}</span>
          <span style={{ fontWeight: 600 }}>{fmt$(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Expense chart ──────────────────────────────────────────────────── */
function ExpenseChart({ data, totals, days }) {
  const hasData = data?.some(d => d.added > 0 || d.used > 0 || d.wasted > 0)
  const tickEvery = days <= 14 ? 2 : days <= 30 ? 5 : 14

  return (
    <div style={{ background: '#141414', border: CARD_BORDER, borderRadius: 20, padding: '20px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: `${GREEN}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <LeafIcon size={15} style={{ color: GREEN }} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>Expenses & Food Footprint</div>
            <div style={{ fontSize: 11, color: TEXT_DIM, marginTop: 1 }}>Inventory cost breakdown across all locations</div>
          </div>
        </div>
        {totals && hasData && (
          <div style={{ display: 'flex', gap: 16 }}>
            {[
              { label: 'Purchased', value: totals.added, color: BLUE },
              { label: 'COGS', value: totals.used, color: YELLOW },
              { label: 'Wasted', value: totals.wasted, color: RED },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: s.color, letterSpacing: '-0.02em' }}>{fmt$(s.value)}</div>
                <div style={{ fontSize: 10, color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!hasData ? (
        <div style={{
          height: 180, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <LeafIcon size={28} style={{ color: TEXT_DIM }} />
          <div style={{ fontSize: 13, color: TEXT_DIM }}>No inventory data for this period</div>
          <div style={{ fontSize: 11, color: TEXT_DIM, opacity: 0.6 }}>Add inventory items and log changes to see expense tracking</div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} barGap={0} barCategoryGap="35%">
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="date"
              tickFormatter={(d, i) => i % tickEvery === 0 ? fmtDate(d) : ''}
              tick={{ fill: TEXT_DIM, fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={fmt$}
              tick={{ fill: TEXT_DIM, fontSize: 10 }}
              axisLine={false} tickLine={false} width={44}
            />
            <Tooltip content={<ExpenseTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="added"  name="Purchased" fill={BLUE}   radius={[3,3,0,0]} stackId="a" />
            <Bar dataKey="used"   name="COGS"      fill={YELLOW} radius={[0,0,0,0]} stackId="a" />
            <Bar dataKey="wasted" name="Wasted"    fill={RED}    radius={[3,3,0,0]} stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

/* ── Assign Locations Modal ─────────────────────────────────────────── */
function AssignModal({ staff, allLocations, currentAssignments, onSave, onClose }) {
  const [selected, setSelected] = useState(new Set(currentAssignments))
  const [saving, setSaving] = useState(false)

  const toggle = (id) => setSelected(s => {
    const next = new Set(s)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(staff.id, [...selected])
      onClose()
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to update assignments')
    } finally {
      setSaving(false)
    }
  }

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', padding: 20,
    }}>
      <div style={{
        background: '#1c1c1e', borderRadius: 20, width: '100%', maxWidth: 440,
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 20px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY }}>Assign Locations</div>
            <div style={{ fontSize: 12, color: TEXT_DIM, marginTop: 2 }}>{staff.name}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT_DIM, padding: 4 }}>
            <CloseIcon size={16} />
          </button>
        </div>

        {/* Location list */}
        <div style={{ padding: '12px 16px', maxHeight: 320, overflowY: 'auto' }}>
          {allLocations.map(loc => (
            <label key={loc.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', borderRadius: 12, cursor: 'pointer',
              marginBottom: 4,
              background: selected.has(loc.id) ? 'rgba(170,48,26,0.1)' : 'transparent',
              transition: 'background 0.12s',
            }}>
              <input
                type="checkbox"
                checked={selected.has(loc.id)}
                onChange={() => toggle(loc.id)}
                style={{ width: 16, height: 16, accentColor: BRAND, cursor: 'pointer' }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>{loc.name}</div>
                {loc.address && (
                  <div style={{ fontSize: 11, color: TEXT_DIM, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {loc.address}
                  </div>
                )}
              </div>
              {selected.has(loc.id) && (
                <span style={{ fontSize: 11, color: BRAND, fontWeight: 700 }}>✓</span>
              )}
            </label>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', gap: 10, justifyContent: 'flex-end',
        }}>
          <button onClick={onClose} style={{
            padding: '8px 18px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)',
            background: 'transparent', color: TEXT_MUTED, cursor: 'pointer', fontSize: 13, fontWeight: 600,
          }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} style={{
            padding: '8px 22px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #aa301a, #cb4830)',
            color: '#fff', cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: 13, fontWeight: 700,
            opacity: saving ? 0.7 : 1,
          }}>
            {saving ? 'Saving…' : `Save (${selected.size} locations)`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

/* ── Ratings no-key nudge ───────────────────────────────────────────── */
function RatingsNudge({ onRefresh, refreshing, lastStatus }) {
  return (
    <div style={{
      background: 'rgba(0,132,255,0.06)', border: '1px solid rgba(0,132,255,0.18)',
      borderRadius: 14, padding: '12px 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <StarIcon size={14} style={{ color: YELLOW, flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY }}>
            {lastStatus === 'no_api_key' ? 'Connect Google Ratings' : 'Sync Customer Ratings'}
          </div>
          <div style={{ fontSize: 11, color: TEXT_DIM, marginTop: 1 }}>
            {lastStatus === 'no_api_key'
              ? 'Add GOOGLE_PLACES_API_KEY to your .env to pull live ratings'
              : 'Fetch latest Google ratings for all your locations'}
          </div>
        </div>
      </div>
      <button
        onClick={onRefresh}
        disabled={refreshing}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 14px', borderRadius: 9, border: '1px solid rgba(0,132,255,0.3)',
          background: 'rgba(0,132,255,0.12)', color: BLUE,
          cursor: refreshing ? 'not-allowed' : 'pointer',
          fontSize: 12, fontWeight: 600, flexShrink: 0,
          opacity: refreshing ? 0.6 : 1,
        }}
      >
        <RefreshIcon size={12} spin={refreshing} />
        {refreshing ? 'Syncing…' : 'Sync Ratings'}
      </button>
    </div>
  )
}

/* ── Staff assignment panel ─────────────────────────────────────────── */
function AssignmentPanel({ allLocations, onSave }) {
  const [staff, setStaff] = useState([])
  const [assignments, setAssignments] = useState({})  // staffId → [restaurantId]
  const [assignTarget, setAssignTarget] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await staffApi.list()
      const managers = unwrapList(res).filter(s => s.role === 'manager')
      setStaff(managers)

      const assignMap = {}
      await Promise.all(managers.map(async (m) => {
        try {
          const a = await managerApi.getAssignments(m.id)
          assignMap[m.id] = (unwrap(a) || {}).restaurant_ids || []
        } catch { assignMap[m.id] = [] }
      }))
      setAssignments(assignMap)
    } catch (e) {
      console.error('Failed to load staff', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return (
    <div style={{ padding: '24px', textAlign: 'center', color: TEXT_DIM, fontSize: 13 }}>Loading managers…</div>
  )
  if (staff.length === 0) return (
    <div style={{ padding: '20px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 13, color: TEXT_DIM }}>No managers yet</div>
      <div style={{ fontSize: 11, color: TEXT_DIM, opacity: 0.6, marginTop: 4 }}>Add managers from the Locations → Staff panel</div>
    </div>
  )

  return (
    <div style={{ background: '#141414', border: CARD_BORDER, borderRadius: 20, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>Manager Assignments</div>
        <div style={{ fontSize: 11, color: TEXT_DIM, marginTop: 2 }}>Control which locations each manager can access</div>
      </div>
      <div>
        {staff.map((m, i) => {
          const assigned = assignments[m.id] || []
          const assignedNames = assigned
            .map(rid => allLocations.find(l => l.id === rid)?.name)
            .filter(Boolean)
          return (
            <div key={m.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 20px',
              borderBottom: i < staff.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            }}>
              {/* Avatar */}
              <div style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                background: 'linear-gradient(135deg, #aa301a, #cb4830)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: '#fff',
              }}>
                {m.name.slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>{m.name}</div>
                <div style={{ fontSize: 11, color: TEXT_DIM, marginTop: 1 }}>
                  {assignedNames.length > 0
                    ? assignedNames.join(', ')
                    : <span style={{ color: RED, opacity: 0.7 }}>No locations assigned</span>}
                </div>
              </div>
              <button
                onClick={() => setAssignTarget(m)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 12px', borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'transparent', color: TEXT_MUTED,
                  cursor: 'pointer', fontSize: 11, fontWeight: 600,
                  transition: 'all 0.12s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(170,48,26,0.1)'
                  e.currentTarget.style.color = '#ffb4a5'
                  e.currentTarget.style.borderColor = 'rgba(170,48,26,0.3)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = TEXT_MUTED
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                }}
              >
                <EditIcon size={11} /> Assign
              </button>
            </div>
          )
        })}
      </div>

      {assignTarget && (
        <AssignModal
          staff={assignTarget}
          allLocations={allLocations}
          currentAssignments={assignments[assignTarget.id] || []}
          onSave={async (staffId, rids) => {
            await onSave(staffId, rids)
            setAssignments(prev => ({ ...prev, [staffId]: rids }))
          }}
          onClose={() => setAssignTarget(null)}
        />
      )}
    </div>
  )
}

/* ── Empty state ────────────────────────────────────────────────────── */
function EmptyState() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 12, padding: '80px 24px', textAlign: 'center',
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 16,
        background: 'rgba(170,48,26,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <BarChartIcon size={24} style={{ color: BRAND }} />
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: TEXT_PRIMARY }}>No locations yet</div>
      <div style={{ fontSize: 13, color: TEXT_DIM, maxWidth: 280 }}>
        Add locations from the Locations page, then assign managers here to track performance.
      </div>
    </div>
  )
}

/* ── Main page ──────────────────────────────────────────────────────── */
export default function ManagerDashboard() {
  const [days, setDays] = useState(30)
  const [overview, setOverview] = useState(null)
  const [timeseries, setTimeseries] = useState({})
  const [expenses, setExpenses] = useState(null)
  const [allLocations, setAllLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshingRatings, setRefreshingRatings] = useState(false)
  const [ratingsStatus, setRatingsStatus] = useState(null)

  const load = useCallback(async (d) => {
    setLoading(true)
    try {
      const [ovRes, tsRes, expRes, locRes] = await Promise.all([
        managerApi.overview(d),
        managerApi.timeseries(d),
        managerApi.expenses(d),
        locationsApi.list(),
      ])
      setOverview(unwrap(ovRes))
      setTimeseries(unwrap(tsRes))
      setExpenses(unwrap(expRes))
      setAllLocations(unwrapList(locRes))
    } catch (e) {
      console.error('Manager analytics load failed', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(days) }, [days, load])

  const handleRefreshRatings = async () => {
    setRefreshingRatings(true)
    try {
      const res = await managerApi.refreshRatings()
      const data = unwrap(res) || {}
      setRatingsStatus(data.status)
      if (data.status === 'ok') await load(days)
    } catch (e) {
      console.error('Ratings sync failed', e)
    } finally {
      setRefreshingRatings(false)
    }
  }

  const handleUpdateAssignments = async (staffId, rids) => {
    await managerApi.updateAssignments(staffId, rids)
    await load(days)
  }

  const locs = overview?.locations || []
  const totals = overview?.totals || {}
  const hasData = locs.length > 0

  return (
    <Layout>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{ padding: '32px 32px 48px', maxWidth: 1200 }}>

        {/* ── Page header ── */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          marginBottom: 28, flexWrap: 'wrap', gap: 12,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: 'linear-gradient(135deg, #aa301a, #cb4830)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(170,48,26,0.4)',
              }}>
                <BarChartIcon size={16} style={{ color: '#fff' }} />
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: TEXT_PRIMARY, letterSpacing: '-0.04em', margin: 0 }}>
                Manager Dashboard
              </h1>
            </div>
            <p style={{ fontSize: 13, color: TEXT_DIM, margin: 0, paddingLeft: 44 }}>
              Performance across {hasData ? locs.length : '—'} location{locs.length !== 1 ? 's' : ''}
            </p>
          </div>
          <PeriodPicker value={days} onChange={setDays} />
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
            <div style={{ width: 32, height: 32, border: `3px solid rgba(170,48,26,0.3)`, borderTopColor: BRAND, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : !hasData ? (
          <EmptyState />
        ) : (
          <div style={{ animation: 'fadeUp 0.3s ease-out', display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* ── Summary strip ── */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <StatChip label={`Revenue (${days}d)`} value={fmt$(totals.period_revenue)} color={TEXT_PRIMARY} />
              <StatChip label={`Orders (${days}d)`}   value={fmtNum(totals.period_orders)} />
              <StatChip label="Active Now"  value={totals.active_orders} color={totals.active_orders > 0 ? GREEN : TEXT_DIM} />
              <StatChip label="Avg / Order" value={fmt$(totals.avg_order_value)} />
              <StatChip label="Locations"   value={totals.locations_count} />
            </div>

            {/* ── Ratings nudge ── */}
            <RatingsNudge
              onRefresh={handleRefreshRatings}
              refreshing={refreshingRatings}
              lastStatus={ratingsStatus}
            />

            {/* ── Location cards grid ── */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                Location Performance
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 16,
              }}>
                {locs.map((loc, i) => (
                  <LocationCard
                    key={loc.id}
                    loc={loc}
                    timeseries={timeseries[loc.id]}
                    index={i}
                  />
                ))}
              </div>
            </div>

            {/* ── Expense chart ── */}
            {expenses && (
              <ExpenseChart data={expenses.series} totals={expenses.totals} days={days} />
            )}

            {/* ── Manager assignments ── */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                Manager Assignments
              </div>
              <AssignmentPanel
                allLocations={allLocations}
                onSave={handleUpdateAssignments}
              />
            </div>

          </div>
        )}
      </div>
    </Layout>
  )
}
