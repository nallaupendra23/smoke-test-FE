import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { inventoryApi } from '../../services/inventoryApi'

const DAYS_OPTIONS = [7, 14, 30]

/* ── Summary metric card ── */
function MetricCard({ label, value, color, sub }) {
  return (
    <div style={{
      flex: 1,
      background: 'var(--surface-2)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '16px 18px',
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color, letterSpacing: '-0.02em' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

/* ── Chart tooltip ── */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--text-1)' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginTop: 3 }}>
          {p.name}: <strong>${p.value.toFixed(2)}</strong>
        </div>
      ))}
    </div>
  )
}

/* ── PCR gauge ── */
function PcrGauge({ value }) {
  const pct = Math.min(Math.max(value, 0), 100)
  const color = pct >= 40 ? '#15803d' : pct >= 20 ? '#b45309' : '#dc2626'
  return (
    <div style={{
      background: 'var(--surface-2)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '16px 18px',
      minWidth: 180,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
        Profit Conversion Ratio
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color, marginBottom: 8, letterSpacing: '-0.02em' }}>
        {value.toFixed(1)}%
      </div>
      <div style={{ background: 'var(--border)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.5s' }} />
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 5 }}>
        (Revenue − COGS − Wastage) / Revenue × 100
      </div>
    </div>
  )
}

/* ── Margin color helper ── */
function marginColor(pct) {
  if (pct === null) return 'var(--text-3)'
  if (pct >= 60) return '#15803d'
  if (pct >= 35) return '#b45309'
  return '#dc2626'
}
function marginBg(pct) {
  if (pct === null) return 'var(--surface-2)'
  if (pct >= 60) return 'rgba(21,128,61,0.08)'
  if (pct >= 35) return 'rgba(180,83,9,0.08)'
  return 'rgba(220,38,38,0.08)'
}
function marginBorder(pct) {
  if (pct === null) return 'var(--border)'
  if (pct >= 60) return 'rgba(21,128,61,0.20)'
  if (pct >= 35) return 'rgba(180,83,9,0.20)'
  return 'rgba(220,38,38,0.20)'
}

/* ── Per-dish cost row ── */
function DishCostRow({ item, index }) {
  const [expanded, setExpanded] = useState(false)
  const hasMapping = item.preparation_cost !== null
  const mc = marginColor(item.margin_pct)
  const mbg = marginBg(item.margin_pct)
  const mbd = marginBorder(item.margin_pct)

  return (
    <>
      <tr
        onClick={() => hasMapping && setExpanded(v => !v)}
        style={{
          cursor: hasMapping ? 'pointer' : 'default',
          background: index % 2 === 0 ? 'transparent' : 'var(--surface-2)',
          transition: 'background 0.12s',
        }}
        onMouseEnter={e => { if (hasMapping) e.currentTarget.style.background = 'var(--primary-light)' }}
        onMouseLeave={e => { e.currentTarget.style.background = index % 2 === 0 ? 'transparent' : 'var(--surface-2)' }}
      >
        {/* Expand toggle */}
        <td style={{ padding: '11px 10px 11px 16px', width: 28 }}>
          {hasMapping && (
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="var(--text-3)" strokeWidth="2.5" strokeLinecap="round"
              style={{ transition: 'transform 0.2s', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', display: 'block' }}
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          )}
        </td>

        {/* Name + category */}
        <td style={{ padding: '11px 12px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>{item.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{item.category}</div>
        </td>

        {/* Selling price */}
        <td style={{ padding: '11px 12px', textAlign: 'right' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>
            ${item.selling_price.toFixed(2)}
          </span>
        </td>

        {/* Preparation cost — the key figure the owner asked for */}
        <td style={{ padding: '11px 12px', textAlign: 'right' }}>
          {hasMapping ? (
            <div>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#dc2626' }}>
                ${item.preparation_cost.toFixed(2)}
              </span>
              <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>
                to prepare
              </div>
            </div>
          ) : (
            <span style={{
              fontSize: 11, fontWeight: 600,
              background: 'rgba(245,158,11,0.10)', color: '#b45309',
              border: '1px solid rgba(245,158,11,0.25)',
              borderRadius: 999, padding: '3px 9px',
            }}>
              No mapping
            </span>
          )}
        </td>

        {/* Profit per item */}
        <td style={{ padding: '11px 12px', textAlign: 'right' }}>
          {hasMapping ? (
            <span style={{ fontSize: 14, fontWeight: 700, color: item.profit_per_item >= 0 ? '#15803d' : '#dc2626' }}>
              {item.profit_per_item >= 0 ? '+' : ''}${item.profit_per_item.toFixed(2)}
            </span>
          ) : (
            <span style={{ color: 'var(--text-3)', fontSize: 12 }}>—</span>
          )}
        </td>

        {/* Margin % */}
        <td style={{ padding: '11px 16px 11px 12px', textAlign: 'right' }}>
          {hasMapping ? (
            <span style={{
              fontSize: 12, fontWeight: 800,
              background: mbg, color: mc,
              border: `1px solid ${mbd}`,
              borderRadius: 999, padding: '4px 10px', display: 'inline-block',
            }}>
              {item.margin_pct.toFixed(1)}%
            </span>
          ) : (
            <span style={{ color: 'var(--text-3)', fontSize: 12 }}>—</span>
          )}
        </td>
      </tr>

      {/* Ingredient breakdown — expands below the row */}
      {expanded && hasMapping && item.ingredients.length > 0 && (
        <tr>
          <td colSpan={6} style={{ padding: 0 }}>
            <div style={{
              margin: '0 16px 10px 54px',
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              overflow: 'hidden',
            }}>
              {/* Breakdown header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 100px 100px 80px 90px',
                padding: '7px 14px',
                background: 'var(--surface-2)',
                borderBottom: '1px solid var(--border)',
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.06em', color: 'var(--text-3)',
              }}>
                <span>Ingredient</span>
                <span style={{ textAlign: 'right' }}>Qty Used</span>
                <span style={{ textAlign: 'right' }}>Cost/Unit</span>
                <span style={{ textAlign: 'right' }}>Unit</span>
                <span style={{ textAlign: 'right' }}>Line Cost</span>
              </div>
              {item.ingredients.map((ing, i) => (
                <div
                  key={i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 100px 100px 80px 90px',
                    padding: '8px 14px',
                    borderBottom: i < item.ingredients.length - 1 ? '1px solid var(--border)' : 'none',
                    fontSize: 12,
                  }}
                >
                  <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>{ing.name}</span>
                  <span style={{ textAlign: 'right', color: 'var(--text-2)' }}>{ing.quantity}</span>
                  <span style={{ textAlign: 'right', color: 'var(--text-2)' }}>${ing.cost_per_unit.toFixed(4)}</span>
                  <span style={{ textAlign: 'right', color: 'var(--text-3)' }}>{ing.unit}</span>
                  <span style={{ textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>${ing.line_cost.toFixed(2)}</span>
                </div>
              ))}
              {/* Total row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 100px 100px 80px 90px',
                padding: '8px 14px',
                background: 'rgba(220,38,38,0.04)',
                borderTop: '1.5px solid rgba(220,38,38,0.15)',
                fontSize: 12, fontWeight: 800,
              }}>
                <span style={{ color: 'var(--text-1)' }}>Total preparation cost</span>
                <span /><span /><span />
                <span style={{ textAlign: 'right', color: '#dc2626' }}>${item.preparation_cost.toFixed(2)}</span>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

/* ════════════════════════════════════════════════════════════
   PROFIT CARD — main export
════════════════════════════════════════════════════════════ */
export default function ProfitCard() {
  const [days, setDays] = useState(7)
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({
    total_revenue: 0, total_cogs: 0, total_wastage_cost: 0,
    gross_profit: 0, profit_conversion_ratio: 0,
  })

  /* Per-dish costs */
  const [dishCosts, setDishCosts] = useState([])
  const [dishLoading, setDishLoading] = useState(true)
  const [dishSearch, setDishSearch] = useState('')
  const [dishSortBy, setDishSortBy] = useState('margin_asc')
  const [autoMapping, setAutoMapping] = useState(false)
  const [autoMapResult, setAutoMapResult] = useState(null)

  useEffect(() => {
    setLoading(true)
    inventoryApi.getAnalytics(days)
      .then((r) => {
        const daily = r.data.daily_profit || []
        const s = r.data.summary || {}
        setData(daily.map((d) => ({
          date: d.date.slice(5),
          Revenue: d.revenue,
          COGS: d.cogs ?? d.cost ?? 0,
          Wastage: d.wastage ?? 0,
          Profit: d.profit,
        })))
        setSummary({
          total_revenue: s.total_revenue ?? daily.reduce((acc, d) => acc + d.revenue, 0),
          total_cogs: s.total_cogs ?? daily.reduce((acc, d) => acc + (d.cogs ?? d.cost ?? 0), 0),
          total_wastage_cost: s.total_wastage_cost ?? 0,
          gross_profit: s.gross_profit ?? daily.reduce((acc, d) => acc + d.profit, 0),
          profit_conversion_ratio: s.profit_conversion_ratio ?? 0,
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [days])

  /* Fetch per-dish costs (also called after auto-map to refresh) */
  function loadDishCosts() {
    setDishLoading(true)
    inventoryApi.getMenuItemCosts()
      .then(r => setDishCosts(r.data || []))
      .catch(() => {})
      .finally(() => setDishLoading(false))
  }

  useEffect(() => { loadDishCosts() }, [])

  /* Auto-map unmapped dishes with AI */
  async function handleAutoMap() {
    setAutoMapping(true)
    setAutoMapResult(null)
    try {
      const res = await inventoryApi.autoMap()
      setAutoMapResult(res.data)
      if ((res.data?.mapped_dishes || 0) > 0) {
        loadDishCosts()   // refresh table so new mappings appear immediately
      }
    } catch (e) {
      setAutoMapResult({ mapped_dishes: 0, mappings_created: 0, message: 'Auto-mapping failed. Try again.' })
    } finally {
      setAutoMapping(false)
    }
  }

  /* Filter + sort dishes */
  const visibleDishes = dishCosts
    .filter(d =>
      dishSearch === '' ||
      d.name.toLowerCase().includes(dishSearch.toLowerCase()) ||
      d.category.toLowerCase().includes(dishSearch.toLowerCase())
    )
    .sort((a, b) => {
      switch (dishSortBy) {
        case 'margin_asc':   return (a.margin_pct ?? -999) - (b.margin_pct ?? -999)
        case 'margin_desc':  return (b.margin_pct ?? -999) - (a.margin_pct ?? -999)
        case 'prep_desc':    return (b.preparation_cost ?? 0) - (a.preparation_cost ?? 0)
        case 'prep_asc':     return (a.preparation_cost ?? 0) - (b.preparation_cost ?? 0)
        case 'profit_desc':  return (b.profit_per_item ?? 0) - (a.profit_per_item ?? 0)
        default:             return a.name.localeCompare(b.name)
      }
    })

  const mappedCount   = dishCosts.filter(d => d.preparation_cost !== null).length
  const unmappedCount = dishCosts.length - mappedCount
  const avgMargin     = mappedCount > 0
    ? (dishCosts.filter(d => d.margin_pct !== null).reduce((s, d) => s + d.margin_pct, 0) / mappedCount)
    : 0

  return (
    <div>
      {/* ── Day range selector ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {DAYS_OPTIONS.map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            style={{
              padding: '5px 16px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              border: `1px solid ${days === d ? 'var(--primary)' : 'var(--border)'}`,
              cursor: 'pointer',
              background: days === d ? 'var(--primary-light)' : 'var(--surface-2)',
              color: days === d ? 'var(--primary)' : 'var(--text-2)',
            }}
          >
            {d} days
          </button>
        ))}
      </div>

      {/* ── Summary cards ── */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <MetricCard label="Revenue"      value={`$${summary.total_revenue.toFixed(2)}`}      color="#aa301a" />
        <MetricCard label="COGS"         value={`$${summary.total_cogs.toFixed(2)}`}          color="#dc2626" sub="Cost of goods sold" />
        <MetricCard label="Wastage"      value={`$${summary.total_wastage_cost.toFixed(2)}`}  color="#b45309" sub="Logged waste cost" />
        <MetricCard
          label="Gross Profit"
          value={`$${summary.gross_profit.toFixed(2)}`}
          color={summary.gross_profit >= 0 ? '#15803d' : '#dc2626'}
          sub="Revenue − COGS − Wastage"
        />
        <PcrGauge value={summary.profit_conversion_ratio} />
      </div>

      {/* ── Daily chart ── */}
      {loading ? (
        <div style={{ color: 'var(--text-3)', fontSize: 13 }}>Loading…</div>
      ) : data.length === 0 ? (
        <div style={{ color: 'var(--text-3)', fontSize: 13, padding: '32px 0', textAlign: 'center' }}>
          No order data in this period. Once orders come in and ingredients are mapped, profit will appear here.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} width={56} tickFormatter={(v) => `$${v}`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-2)' }} />
            <Bar dataKey="Revenue" fill="#aa301a" radius={[4, 4, 0, 0]} maxBarSize={22} />
            <Bar dataKey="COGS"    fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={22} />
            <Bar dataKey="Wastage" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={22} />
            <Bar dataKey="Profit"  fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* ════════════════════════════════════════════════════════
          PER-DISH PREPARATION COST SECTION
      ════════════════════════════════════════════════════════ */}
      <div style={{
        marginTop: 36,
        borderTop: '2px solid var(--border)',
        paddingTop: 28,
      }}>
        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: 'var(--primary-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/>
                  <line x1="6" y1="17" x2="18" y2="17"/>
                </svg>
              </div>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-1)', margin: 0, letterSpacing: '-0.02em' }}>
                  Per-Dish Preparation Cost
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '2px 0 0' }}>
                  What it costs you to prepare each dish — based on ingredient mappings
                </p>
              </div>
            </div>
          </div>

          {/* Mini stats */}
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{
              padding: '8px 14px', borderRadius: 10,
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>{mappedCount}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mapped</div>
            </div>
            {unmappedCount > 0 && (
              <div style={{
                padding: '8px 14px', borderRadius: 10,
                background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.22)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#b45309', letterSpacing: '-0.02em' }}>{unmappedCount}</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.05em' }}>No mapping</div>
              </div>
            )}
            {mappedCount > 0 && (
              <div style={{
                padding: '8px 14px', borderRadius: 10,
                background: marginBg(avgMargin), border: `1px solid ${marginBorder(avgMargin)}`,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: marginColor(avgMargin), letterSpacing: '-0.02em' }}>{avgMargin.toFixed(1)}%</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Margin</div>
              </div>
            )}
          </div>
        </div>

        {/* Filter row */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)"
              strokeWidth="2" strokeLinecap="round"
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              value={dishSearch}
              onChange={e => setDishSearch(e.target.value)}
              placeholder="Search dishes…"
              style={{
                width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                border: '1.5px solid var(--border)', borderRadius: 10,
                background: 'var(--surface-2)', outline: 'none',
                fontSize: 12, fontFamily: 'inherit', color: 'var(--text-1)',
                transition: 'border-color 0.15s', boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
          {/* Sort */}
          <select
            value={dishSortBy}
            onChange={e => setDishSortBy(e.target.value)}
            style={{
              padding: '8px 12px', borderRadius: 10,
              border: '1.5px solid var(--border)',
              background: 'var(--surface-2)', fontSize: 12,
              color: 'var(--text-1)', outline: 'none', cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <option value="margin_asc">Sort: Lowest margin first</option>
            <option value="margin_desc">Sort: Highest margin first</option>
            <option value="prep_desc">Sort: Highest prep cost</option>
            <option value="prep_asc">Sort: Lowest prep cost</option>
            <option value="profit_desc">Sort: Most profit per item</option>
            <option value="name">Sort: Name A–Z</option>
          </select>
        </div>

        {dishLoading ? (
          <div style={{ color: 'var(--text-3)', fontSize: 13, padding: '20px 0' }}>Loading dish costs…</div>
        ) : dishCosts.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '40px 20px',
            background: 'var(--surface-2)', borderRadius: 12,
            border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-2)', marginBottom: 6 }}>No menu items found</div>
            <div style={{ fontSize: 13, color: 'var(--text-3)' }}>Add menu items and map their ingredients to see preparation costs here.</div>
          </div>
        ) : (
          <div style={{
            border: '1px solid var(--border)',
            borderRadius: 12,
            overflow: 'hidden',
          }}>
            {/* Legend */}
            <div style={{
              padding: '10px 16px',
              background: 'var(--surface-2)',
              borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: 16, fontSize: 11, color: 'var(--text-3)',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: 'rgba(21,128,61,0.6)', display: 'inline-block' }} />
                High margin ≥ 60%
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: 'rgba(180,83,9,0.6)', display: 'inline-block' }} />
                Medium 35–60%
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: 'rgba(220,38,38,0.6)', display: 'inline-block' }} />
                Low &lt; 35%
              </span>
              <span style={{ marginLeft: 'auto', fontStyle: 'italic' }}>Click a row to see ingredient breakdown</span>
            </div>

            {/* Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ width: 28, padding: '9px 10px 9px 16px' }} />
                  <th style={{ padding: '9px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)' }}>
                    Dish
                  </th>
                  <th style={{ padding: '9px 12px', textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)' }}>
                    Sells For
                  </th>
                  <th style={{ padding: '9px 12px', textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#dc2626' }}>
                    Costs to Make
                  </th>
                  <th style={{ padding: '9px 12px', textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)' }}>
                    Profit / Item
                  </th>
                  <th style={{ padding: '9px 16px 9px 12px', textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)' }}>
                    Margin
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleDishes.map((item, i) => (
                  <DishCostRow key={item.menu_item_id} item={item} index={i} />
                ))}
              </tbody>
            </table>

            {visibleDishes.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', fontSize: 13, color: 'var(--text-3)' }}>
                No dishes match your search
              </div>
            )}
          </div>
        )}

        {/* Auto-map result banner (shown after a successful auto-map run) */}
        {autoMapResult && autoMapResult.mapped_dishes > 0 && (
          <div style={{
            marginTop: 12, padding: '11px 16px',
            background: 'rgba(99,102,241,0.07)',
            border: '1px solid rgba(99,102,241,0.22)',
            borderRadius: 10, fontSize: 12, color: '#4338ca',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            <span>
              <strong>AI mapped {autoMapResult.mapped_dishes} dishes</strong> — {autoMapResult.mappings_created} ingredient connections created. Preparation costs are now visible in the table above.
            </span>
          </div>
        )}

        {/* Helper note with Auto-Map button */}
        {unmappedCount > 0 && !dishLoading && (
          <div style={{
            marginTop: 12, padding: '12px 16px',
            background: 'rgba(245,158,11,0.06)',
            border: '1px solid rgba(245,158,11,0.20)',
            borderRadius: 10, fontSize: 12, color: '#92400e',
            display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
          }}>
            {/* Warning icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>

            <span style={{ flex: 1 }}>
              <strong>{unmappedCount} dish{unmappedCount > 1 ? 'es' : ''}</strong> have no ingredient mapping.
              {' '}You can map them manually in the <strong>Mapping</strong> tab, or let AI do it automatically.
            </span>

            {/* Auto-Map button */}
            <button
              onClick={handleAutoMap}
              disabled={autoMapping}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 8, border: 'none',
                background: autoMapping ? 'rgba(99,102,241,0.10)' : '#6366f1',
                color: autoMapping ? '#6366f1' : '#fff',
                fontSize: 12, fontWeight: 700, cursor: autoMapping ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s', flexShrink: 0,
                fontFamily: 'inherit',
              }}
            >
              {autoMapping ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Mapping…
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                  </svg>
                  Auto-Map with AI
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
