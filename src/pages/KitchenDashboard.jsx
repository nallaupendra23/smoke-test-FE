import { useState, useEffect, useCallback, useRef } from 'react'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import OrderCard from '../components/OrderCard'
import { dashboardApi, menuApi, ordersApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { printKitchenTicket } from '../utils/printTicket'
import {
  DashboardIcon, RefreshIcon,
  OrdersIcon, CheckIcon,
  PlusIcon, XIcon, SearchIcon, TrashIcon, SpinnerIcon,
} from '../components/Icons'

const REFRESH_INTERVAL = 5000
const TABS = ['Active', 'Ready', 'Completed', 'Cancelled', 'Bad Orders', 'All']

/* ── Skeleton loaders ── */
function StatSkeleton() {
  return (
    <div className="card flex items-center gap-4">
      <div className="skeleton rounded-2xl flex-shrink-0" style={{ width: 52, height: 52 }} />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-8 w-16 rounded-lg" />
        <div className="skeleton h-3.5 w-24 rounded" />
      </div>
    </div>
  )
}
function OrderSkeleton() {
  return (
    <div className="card space-y-3">
      <div className="flex justify-between">
        <div className="space-y-2">
          <div className="skeleton h-4 w-28 rounded" />
          <div className="skeleton h-3 w-20 rounded" />
        </div>
        <div className="skeleton h-6 w-16 rounded-full" />
      </div>
      <div className="divider" />
      <div className="space-y-2">
        <div className="skeleton h-3.5 w-36 rounded" />
        <div className="skeleton h-3.5 w-28 rounded" />
      </div>
      <div className="skeleton h-9 rounded-xl" />
    </div>
  )
}

/* ── New Order Toast ── */
function NewOrderToast({ order, onClose }) {
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    const t = setTimeout(onClose, 30000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div
      className="animate-slide-in"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'linear-gradient(135deg, #0f0c29, #1a1040)',
        border: '1px solid rgba(170,48,26,0.35)',
        borderLeft: '4px solid #aa301a',
        borderRadius: 16,
        padding: '14px 16px',
        boxShadow: hovered
          ? '0 20px 48px rgba(170,48,26,0.20), 0 4px 16px rgba(0,0,0,0.4)'
          : '0 8px 32px rgba(0,0,0,0.35)',
        minWidth: 290,
        display: 'flex', alignItems: 'flex-start', gap: 12,
        cursor: 'default',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease',
      }}
    >
      <div style={{ position: 'relative', flexShrink: 0, marginTop: 3 }}>
        <span className="live-dot" style={{ background: '#aa301a' }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 13, letterSpacing: '-0.01em' }}>
          New Order — {order.customer_name}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 3 }}>
          {order.items?.length} item{order.items?.length !== 1 ? 's' : ''} · ${order.total?.toFixed(2)}
        </div>
        <div style={{ color: '#ffb4a5', fontSize: 11, marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
          Kitchen ticket printed
        </div>
      </div>
      <button
        onClick={onClose}
        style={{ color: 'rgba(255,255,255,0.3)', fontSize: 18, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, padding: '0 2px' }}
      >×</button>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   WALK-IN ORDER MODAL
═══════════════════════════════════════════════════════════ */
function WalkInModal({ onClose, onSuccess }) {
  const [step,          setStep]         = useState(1)
  const [menuItems,     setMenuItems]    = useState([])
  const [loadingMenu,   setLoadingMenu]  = useState(false)
  const [search,        setSearch]       = useState('')
  const [cart,          setCart]         = useState([])
  const [customerName,  setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone]= useState('')
  const [payMethod,     setPayMethod]    = useState('cash')
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [submitting,    setSubmitting]   = useState(false)
  const [error,         setError]        = useState('')
  const [openNotes,     setOpenNotes]    = useState(new Set())

  const goToStep2 = () => {
    setStep(2)
    if (menuItems.length === 0) {
      setLoadingMenu(true)
      menuApi.list()
        .then(res => setMenuItems(res.data || []))
        .catch(() => {})
        .finally(() => setLoadingMenu(false))
    }
  }

  const filtered = menuItems.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    (item.category || '').toLowerCase().includes(search.toLowerCase())
  )

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(c => c.name === item.name)
      if (existing) return prev.map(c => c.name === item.name ? { ...c, quantity: c.quantity + 1 } : c)
      return [...prev, { name: item.name, price: item.price || 0, quantity: 1, note: '' }]
    })
  }

  const updateQty = (name, delta) => {
    setCart(prev =>
      prev.map(c => c.name === name ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c)
          .filter(c => c.quantity > 0)
    )
  }

  const updateNote = (name, note) => {
    setCart(prev => prev.map(c => c.name === name ? { ...c, note } : c))
  }

  const toggleNoteInput = (name) => {
    setOpenNotes(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const total = cart.reduce((sum, c) => sum + c.price * c.quantity, 0)

  const handleSubmit = async () => {
    if (cart.length === 0) { setError('Add at least one item to the order'); return }
    setError('')
    setSubmitting(true)
    try {
      const res = await ordersApi.create({
        customer_name: customerName.trim() || 'Walk-in',
        customer_phone: customerPhone.trim() || null,
        items: cart.map(c => ({
          name: c.name, price: c.price, quantity: c.quantity,
          ...(c.note?.trim() ? { modification: c.note.trim() } : {}),
        })),
        total,
        pay_method: payMethod,
        special_instructions: specialInstructions.trim() || null,
      })
      onSuccess(res.data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to create order. Please try again.')
    } finally { setSubmitting(false) }
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px',
    background: 'var(--surface-2)', border: '1.5px solid var(--border)',
    borderRadius: 12, fontSize: 14, color: 'var(--text-1)',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
    transition: 'border-color 0.15s ease',
  }

  /* Pay method label — text only, no emojis */
  const payMethodLabel = payMethod === 'cash'
    ? 'Cash'
    : payMethod === 'card_on_pickup'
      ? 'Card on Pickup'
      : 'Stripe Payment Link'

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(10,16,40,0.45)', backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--border)',
        borderRadius: 22, width: '100%',
        maxWidth: step === 1 ? 460 : 880,
        ...(step === 2 ? { maxHeight: '90vh' } : {}),
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        transition: 'max-width 0.3s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.22), 0 8px 24px rgba(170,48,26,0.12)',
        animation: 'modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1) both',
      }}>
        <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.95) translateY(8px) } to { opacity:1; transform:none } }`}</style>

        {/* Modal Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface-2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'var(--primary-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <PlusIcon size={18} style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
                Add New Order
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                Step {step} of 2 — {step === 1 ? 'Customer Details' : 'Select Items'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Step indicators */}
            <div style={{ display: 'flex', gap: 6 }}>
              {[1, 2].map(s => (
                <div key={s} style={{
                  width: 26, height: 26, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800,
                  background: s === step ? 'var(--primary)' : s < step ? '#22c55e' : 'var(--surface-1)',
                  color: s <= step ? '#fff' : 'var(--text-3)',
                  border: `1.5px solid ${s === step ? 'var(--primary)' : s < step ? '#22c55e' : 'var(--border)'}`,
                  transition: 'all 0.2s ease',
                }}>
                  {s < step ? '✓' : s}
                </div>
              ))}
            </div>
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: 10, background: 'var(--surface-1)',
              border: '1.5px solid var(--border)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <XIcon size={16} style={{ color: 'var(--text-3)' }} />
            </button>
          </div>
        </div>

        {/* Step 1: Customer Details */}
        {step === 1 && (
          <div style={{ padding: '26px 28px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'Customer Name', key: 'name', value: customerName, setter: setCustomerName, placeholder: 'e.g. John Smith (optional)', autoFocus: true },
              { label: 'Phone Number', key: 'phone', value: customerPhone, setter: setCustomerPhone, placeholder: 'e.g. +1 555 000 0000 (optional)' },
            ].map(f => (
              <div key={f.key}>
                <label style={{
                  display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: 7,
                }}>{f.label}</label>
                <input
                  value={f.value}
                  onChange={e => f.setter(e.target.value)}
                  placeholder={f.placeholder}
                  autoFocus={f.autoFocus}
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.background = 'var(--card-bg)' }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--surface-2)' }}
                />
              </div>
            ))}
            <div>
              <label style={{
                display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: 7,
              }}>Payment Method</label>
              <select
                value={payMethod} onChange={e => setPayMethod(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
                onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.background = 'var(--card-bg)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--surface-2)' }}
              >
                <option value="cash">Cash</option>
                <option value="card_on_pickup">Card on Pickup</option>
                <option value="stripe_link">Stripe Payment Link</option>
              </select>
            </div>
            <div>
              <label style={{
                display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: 7,
              }}>Special Instructions</label>
              <textarea
                value={specialInstructions}
                onChange={e => setSpecialInstructions(e.target.value)}
                placeholder="Allergies, preferences, notes... (optional)"
                rows={3}
                style={{ ...inputStyle, resize: 'none' }}
                onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.background = 'var(--card-bg)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--surface-2)' }}
              />
            </div>
            <button
              onClick={goToStep2}
              className="btn-primary"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '14px', marginTop: 4, fontSize: 14, fontWeight: 700,
                letterSpacing: '-0.01em', borderRadius: 14,
              }}
            >
              Next — Select Items
              <span style={{ fontSize: 16 }}>→</span>
            </button>
          </div>
        )}

        {/* Step 2: Menu Picker + Cart */}
        {step === 2 && (
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

            {/* Left: Menu */}
            <div style={{ flex: 1, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                <div style={{ position: 'relative' }}>
                  <SearchIcon size={14} style={{
                    position: 'absolute', left: 11, top: '50%',
                    transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none',
                  }} />
                  <input
                    value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search menu items..."
                    autoFocus
                    style={{ ...inputStyle, paddingLeft: 34, fontSize: 13 }}
                    onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.background = 'var(--card-bg)' }}
                    onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--surface-2)' }}
                  />
                </div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
                {loadingMenu ? (
                  <div style={{ padding: 28, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>Loading menu…</div>
                ) : filtered.length === 0 ? (
                  <div style={{ padding: 28, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>No items found</div>
                ) : (
                  (() => {
                    const groups = {}
                    filtered.forEach(item => {
                      const cat = item.category || 'Other'
                      if (!groups[cat]) groups[cat] = []
                      groups[cat].push(item)
                    })
                    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)).map(([cat, items]) => (
                      <div key={cat} style={{ marginBottom: 16 }}>
                        <div style={{
                          fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                          letterSpacing: '0.1em', color: 'var(--primary)',
                          padding: '2px 0 7px',
                          borderBottom: '1.5px solid rgba(170,48,26,0.15)',
                          marginBottom: 6,
                        }}>{cat}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {items.map(item => (
                            <button
                              key={item.id}
                              onClick={() => addToCart(item)}
                              style={{
                                width: '100%', display: 'flex', alignItems: 'center',
                                justifyContent: 'space-between', padding: '10px 12px',
                                background: 'var(--surface-2)', border: '1.5px solid var(--border)',
                                borderRadius: 11, cursor: 'pointer', textAlign: 'left',
                                transition: 'all 0.12s ease', fontFamily: 'inherit',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(170,48,26,0.3)'; e.currentTarget.style.background = 'var(--card-bg)' }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface-2)' }}
                            >
                              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{item.name}</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>${(item.price || 0).toFixed(2)}</span>
                                <span style={{
                                  width: 22, height: 22, borderRadius: '50%',
                                  background: 'var(--primary-light)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                  <PlusIcon size={11} style={{ color: 'var(--primary)' }} />
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))
                  })()
                )}
              </div>
            </div>

            {/* Right: Cart */}
            <div style={{ width: 300, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Customer pill */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: 5 }}>Customer</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{customerName.trim() || 'Walk-in'}</div>
                {customerPhone && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>{customerPhone}</div>}
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{payMethodLabel}</div>
              </div>

              {/* Cart items */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: 8 }}>Order Items</div>
                {cart.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '28px 8px', color: 'var(--text-3)', fontSize: 12 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 13, margin: '0 auto 10px',
                      background: 'var(--surface-2)', border: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                      </svg>
                    </div>
                    Tap items to add
                  </div>
                ) : (
                  cart.map(c => {
                    const noteOpen = openNotes.has(c.name) || !!c.note?.trim()
                    const hasNote  = !!c.note?.trim()
                    return (
                      <div key={c.name} style={{
                        marginBottom: 6, borderRadius: 11, overflow: 'hidden',
                        background: 'var(--surface-2)',
                        border: hasNote ? '1.5px solid rgba(170,48,26,0.3)' : '1.5px solid var(--border)',
                        transition: 'border-color 0.15s ease',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>${(c.price * c.quantity).toFixed(2)}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                            <button
                              onClick={() => toggleNoteInput(c.name)}
                              title={hasNote ? 'Edit note' : 'Add note'}
                              style={{
                                width: 22, height: 22, borderRadius: 7, cursor: 'pointer',
                                background: hasNote ? 'rgba(170,48,26,0.10)' : 'var(--surface-1)',
                                border: hasNote ? '1px solid rgba(170,48,26,0.3)' : '1px solid var(--border)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: hasNote ? 'var(--primary)' : 'var(--text-3)',
                              }}
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                            </button>
                            <button onClick={() => updateQty(c.name, -1)} style={{ width: 22, height: 22, borderRadius: 7, background: 'var(--surface-1)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)', fontSize: 14, fontWeight: 600 }}>−</button>
                            <span style={{ minWidth: 18, textAlign: 'center', fontSize: 12, fontWeight: 800, color: 'var(--text-1)' }}>{c.quantity}</span>
                            <button onClick={() => updateQty(c.name, 1)} style={{ width: 22, height: 22, borderRadius: 7, background: 'var(--surface-1)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)', fontSize: 14, fontWeight: 600 }}>+</button>
                            <button onClick={() => updateQty(c.name, -c.quantity)} style={{ width: 22, height: 22, marginLeft: 2, borderRadius: 7, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <TrashIcon size={11} />
                            </button>
                          </div>
                        </div>
                        {noteOpen && (
                          <div style={{ padding: '0 10px 9px', borderTop: '1px solid var(--border)' }}>
                            <input
                              autoFocus={openNotes.has(c.name) && !hasNote}
                              value={c.note || ''}
                              onChange={e => updateNote(c.name, e.target.value)}
                              placeholder="e.g. no onions, extra spicy…"
                              maxLength={120}
                              style={{
                                width: '100%', fontSize: 11, padding: '6px 9px',
                                background: 'var(--surface-1)', border: '1.5px solid var(--border)',
                                borderRadius: 8, outline: 'none', color: 'var(--text-2)',
                                boxSizing: 'border-box', marginTop: 8,
                                transition: 'border-color 0.15s', fontFamily: 'inherit',
                              }}
                              onFocus={e => { e.target.style.borderColor = 'var(--primary)' }}
                              onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
                            />
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>

              {/* Cart footer */}
              <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--surface-2)' }}>
                {error && (
                  <div style={{ fontSize: 12, color: '#ef4444', padding: '7px 11px', background: 'rgba(239,68,68,0.08)', borderRadius: 9, border: '1px solid rgba(239,68,68,0.15)' }}>
                    {error}
                  </div>
                )}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>Total</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>${total.toFixed(2)}</div>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || cart.length === 0}
                  className="btn-primary"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px 14px', fontSize: 13, borderRadius: 12, opacity: submitting || cart.length === 0 ? 0.6 : 1 }}
                >
                  {submitting ? <SpinnerIcon size={13} /> : <CheckIcon size={13} />}
                  {submitting ? 'Placing…' : 'Place Order'}
                </button>
                <button onClick={() => setStep(1)} className="btn-secondary" style={{ fontSize: 12, padding: '7px', width: '100%', borderRadius: 10 }}>
                  Back
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Constants ── */
const ORDER_PERIODS = [
  { value: 7,  label: '7 Days'  },
  { value: 15, label: '15 Days' },
  { value: 30, label: '30 Days' },
]

/* ── Order history stat icons (inline SVG, no emoji) ── */
const STAT_CONFIGS = [
  {
    key: 'total',
    label: 'Total Orders',
    color: 'var(--text-1)',
    iconColor: 'var(--text-3)',
    bg: 'var(--surface-2)',
    border: 'var(--border)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
        <rect x="9" y="3" width="6" height="4" rx="1"/>
        <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
      </svg>
    ),
  },
  {
    key: 'successful',
    label: 'Successful',
    color: '#16a34a',
    iconColor: '#16a34a',
    bg: 'rgba(22,163,74,0.08)',
    border: 'rgba(22,163,74,0.18)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/>
      </svg>
    ),
  },
  {
    key: 'cancelled',
    label: 'Cancelled',
    color: '#dc2626',
    iconColor: '#dc2626',
    bg: 'rgba(220,38,38,0.08)',
    border: 'rgba(220,38,38,0.18)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6"/><path d="M9 9l6 6"/>
      </svg>
    ),
  },
  {
    key: 'revenue',
    label: 'Revenue',
    color: 'var(--primary)',
    iconColor: 'var(--primary)',
    bg: 'var(--primary-light)',
    border: 'rgba(170,48,26,0.18)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
  },
  {
    key: 'loss',
    label: 'Loss',
    color: '#dc2626',
    iconColor: '#dc2626',
    bg: 'rgba(220,38,38,0.08)',
    border: 'rgba(220,38,38,0.18)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
  },
]

/* ═══════════════════════════════════════════════════════════
   KITCHEN DASHBOARD
═══════════════════════════════════════════════════════════ */
export default function KitchenDashboard() {
  const { owner }                         = useAuth()
  const [data,          setData]          = useState(null)
  const [activeTab,     setActiveTab]     = useState('Active')
  const [loading,       setLoading]       = useState(true)
  const [lastRefresh,   setLastRefresh]   = useState(null)
  const [spinning,      setSpinning]      = useState(false)
  const [toasts,        setToasts]        = useState([])
  const [showModal,     setShowModal]     = useState(false)
  const [mainView,      setMainView]      = useState('kitchen')
  const [kitchenSearch, setKitchenSearch] = useState('')

  const [allOrders,        setAllOrders]        = useState([])
  const [ordersLoading,    setOrdersLoading]    = useState(false)
  const [ordersPeriod,     setOrdersPeriod]     = useState(7)
  const [ordersSearch,     setOrdersSearch]     = useState('')
  const [ordersRefreshing, setOrdersRefreshing] = useState(false)

  const seenOrderIds = useRef(new Set())
  const isFirstLoad  = useRef(true)
  const restaurantName = owner?.restaurant_name || "Mario's Pizza"

  const dismissToast = (id) => setToasts(prev => prev.filter(t => t.id !== id))

  const fetchStats = useCallback(async (manual = false) => {
    if (manual) setSpinning(true)
    try {
      const res = await dashboardApi.stats()
      const orders = res.data?.orders || []

      if (!isFirstLoad.current) {
        const freshOrders = orders.filter(o => o.status === 'new' && !seenOrderIds.current.has(o.id))
        freshOrders.forEach(order => {
          if (order.call_sid) printKitchenTicket(order, restaurantName)
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`New Order — ${order.customer_name || 'Walk-in'}`, {
              body: `${order.items?.length} item${order.items?.length !== 1 ? 's' : ''} · $${order.total?.toFixed(2)}`,
              icon: '/favicon.ico',
            })
          }
          setToasts(prev => [...prev, { id: order.id, order }])
        })
      }

      orders.forEach(o => seenOrderIds.current.add(o.id))
      isFirstLoad.current = false
      setData(res.data)
      setLastRefresh(new Date())
    } catch (e) {
      console.error('Dashboard fetch error', e)
    } finally {
      setLoading(false)
      if (manual) setTimeout(() => setSpinning(false), 600)
    }
  }, [restaurantName])

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    fetchStats()
    const interval = setInterval(() => fetchStats(), REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchStats])

  const fetchOrders = useCallback(async (bg = false) => {
    if (bg) setOrdersRefreshing(true)
    else setOrdersLoading(true)
    try {
      const params = { days: ordersPeriod }
      const res = await ordersApi.list(params)
      setAllOrders(res.data)
    } catch (e) { console.error(e) }
    finally { setOrdersLoading(false); setOrdersRefreshing(false) }
  }, [ordersPeriod])

  useEffect(() => {
    if (mainView === 'orders') fetchOrders()
  }, [mainView, fetchOrders])

  useEffect(() => {
    if (mainView !== 'orders') return
    const interval = setInterval(() => fetchOrders(true), 15000)
    return () => clearInterval(interval)
  }, [mainView, fetchOrders])

  const filteredAllOrders = allOrders.filter(o => {
    if (!ordersSearch) return true
    const q = ordersSearch.toLowerCase()
    return (
      (o.customer_name || '').toLowerCase().includes(q) ||
      (o.customer_phone || '').includes(q) ||
      (o.id || '').toLowerCase().includes(q)
    )
  })

  const orderStats = {
    total:      allOrders.length,
    successful: allOrders.filter(o => o.status === 'picked_up').length,
    cancelled:  allOrders.filter(o => o.status === 'cancelled').length,
    revenue:    allOrders.filter(o => o.status === 'picked_up').reduce((a, o) => a + (o.total || 0), 0),
    loss:       allOrders.filter(o => o.status === 'cancelled').reduce((a, o) => a + (o.total || 0), 0),
  }

  const filterOrders = (orders) => {
    if (!orders) return []
    let next = orders
    switch (activeTab) {
      case 'Active':
        next = orders.filter(o => ['new', 'confirmed', 'preparing'].includes(o.status) && o.payment_status !== 'failed')
        break
      case 'Ready':
        next = orders.filter(o => o.status === 'ready' && o.payment_status !== 'failed')
        break
      case 'Completed':
        next = orders.filter(o => o.status === 'picked_up' && o.payment_status !== 'failed')
        break
      case 'Cancelled':
        next = orders.filter(o => o.status === 'cancelled')
        break
      case 'Bad Orders':
        next = orders.filter(o => o.payment_status === 'failed')
        break
      default:
        next = orders
    }
    if (!kitchenSearch.trim()) return next
    const q = kitchenSearch.toLowerCase()
    return next.filter(o => (
      (o.customer_name || '').toLowerCase().includes(q) ||
      (o.customer_phone || '').toLowerCase().includes(q) ||
      (o.id || '').toLowerCase().includes(q) ||
      (o.items || []).some(item => (item.name || '').toLowerCase().includes(q))
    ))
  }

  const filtered    = filterOrders(data?.orders)
  const newCount    = data?.orders?.filter(o => o.status === 'new').length || 0
  const kitchenOrders = data?.orders || []
  const kitchenCounts = {
    Active: kitchenOrders.filter(o => ['new', 'confirmed', 'preparing'].includes(o.status) && o.payment_status !== 'failed').length,
    Ready: kitchenOrders.filter(o => o.status === 'ready' && o.payment_status !== 'failed').length,
    Completed: kitchenOrders.filter(o => o.status === 'picked_up' && o.payment_status !== 'failed').length,
    Cancelled: kitchenOrders.filter(o => o.status === 'cancelled').length,
    'Bad Orders': kitchenOrders.filter(o => o.payment_status === 'failed').length,
    All: kitchenOrders.length,
  }

  /* Stat values mapped by key */
  const statValues = {
    total:      orderStats.total,
    successful: orderStats.successful,
    cancelled:  orderStats.cancelled,
    revenue:    `$${orderStats.revenue.toFixed(0)}`,
    loss:       `$${orderStats.loss.toFixed(0)}`,
  }

  return (
    <Layout>
      {showModal && (
        <WalkInModal
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); fetchStats(true) }}
        />
      )}

      {/* Toast stack */}
      <div style={{ position: 'fixed', top: 0, right: 0, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10, padding: 20, pointerEvents: 'none' }}>
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: 'all' }}>
            <NewOrderToast order={t.order} onClose={() => dismissToast(t.id)} />
          </div>
        ))}
      </div>

      <div className="app-page">

        <PageHeader
          icon={DashboardIcon}
          title={mainView === 'kitchen' ? 'Kitchen Dashboard' : 'Order History'}
          subtitle={mainView === 'kitchen'
            ? (lastRefresh
                ? `Live · updated ${lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                : 'Loading live order feed')
            : `Last ${ordersPeriod} days · ${orderStats.total} orders`}
          accent="var(--primary)"
          accentBg="var(--primary-light)"
        >
          <div className="page-toolbar">
            {/* View switcher — SVG icons, no emoji */}
            <div className="segmented-tabs" style={{ border: '1px solid var(--border)' }}>
              {[
                {
                  v: 'kitchen', label: 'Kitchen',
                  icon: (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/>
                      <line x1="6" y1="17" x2="18" y2="17"/>
                    </svg>
                  ),
                },
                {
                  v: 'orders', label: 'Orders',
                  icon: (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                      <rect x="9" y="3" width="6" height="4" rx="1"/>
                      <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
                    </svg>
                  ),
                },
              ].map(({ v, label, icon }) => (
                <button key={v} onClick={() => setMainView(v)} style={{
                  padding: '7px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 700, transition: 'all 0.18s ease',
                  fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: mainView === v ? 'var(--primary)' : 'transparent',
                  color: mainView === v ? '#fff' : 'var(--text-3)',
                  boxShadow: mainView === v ? '0 2px 8px rgba(170,48,26,0.25)' : 'none',
                }}>
                  {icon}
                  {label}
                </button>
              ))}
            </div>

            {mainView === 'kitchen' && (
              <button
                onClick={() => fetchStats(true)}
                className="btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 12 }}
              >
                <RefreshIcon size={14} className={spinning ? 'animate-spin-slow' : ''} />
                Refresh
              </button>
            )}

            {mainView === 'orders' && (
              <button
                onClick={() => fetchOrders(true)}
                className="btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 12 }}
              >
                <RefreshIcon size={14} className={ordersRefreshing ? 'animate-spin-slow' : ''} />
                {ordersRefreshing ? 'Refreshing…' : 'Refresh'}
              </button>
            )}
          </div>
        </PageHeader>

        {/* ═════════════ KITCHEN VIEW ═════════════ */}
        {mainView === 'kitchen' && (
          <>
            {/* Stat cards */}
            <div
              className="grid grid-cols-3 gap-4 mb-8"
              style={{ animation: 'fadeInUp 0.4s ease 0.05s both' }}
            >
              {loading ? (
                <><StatSkeleton /><StatSkeleton /><StatSkeleton /></>
              ) : data ? (
                [
                  { label: 'Active Orders', value: data.active_orders || 0 },
                  { label: 'Ready Orders', value: data.ready_orders || 0 },
                  { label: 'Completed Today', value: data.completed_orders || 0 },
                ].map(stat => (
                  <button
                    key={stat.label}
                    type="button"
                    onClick={() => {
                      if (stat.label.startsWith('Active')) setActiveTab('Active')
                      if (stat.label.startsWith('Ready')) setActiveTab('Ready')
                      if (stat.label.startsWith('Completed')) setActiveTab('Completed')
                    }}
                    className="rounded-2xl p-4 text-left"
                    style={{
                      background: 'var(--card-bg)',
                      border: '1px solid var(--border)',
                      boxShadow: 'var(--shadow-sm)',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    <div
                      className="text-2xl font-bold tracking-tight mb-0.5"
                      style={{ color: 'var(--text-1)' }}
                    >
                      {stat.value}
                    </div>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-3)' }}>{stat.label}</span>
                  </button>
                ))
              ) : null}
            </div>

            {/* Search + status tabs */}
            <div
              className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6"
              style={{
                animation: 'fadeInUp 0.4s ease 0.1s both',
              }}
            >
              <div className="relative flex-shrink-0" style={{ width: 260 }}>
                <SearchIcon
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-3)' }}
                />
                <input
                  className="input"
                  style={{ paddingLeft: 34, paddingRight: kitchenSearch ? 34 : 12, fontSize: 13 }}
                  placeholder="Search orders..."
                  value={kitchenSearch}
                  onChange={e => setKitchenSearch(e.target.value)}
                />
                {kitchenSearch && (
                  <button
                    type="button"
                    onClick={() => setKitchenSearch('')}
                    style={{
                      position: 'absolute',
                      right: 9,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      border: 'none',
                      background: 'var(--border)',
                      color: 'var(--text-3)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <XIcon size={9} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-1">
                {TABS.map(tab => {
                  const active = activeTab === tab
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
                      style={{
                        background: active ? '#aa301a' : 'transparent',
                        color: active ? '#fff' : 'var(--text-3)',
                        border: active ? '1.5px solid #aa301a' : '1.5px solid var(--border)',
                        boxShadow: active ? '0 2px 8px rgba(170,48,26,0.25)' : 'none',
                      }}
                    >
                      {tab}
                      <span style={{ marginLeft: 6, opacity: active ? 0.9 : 0.7 }}>
                        {kitchenCounts[tab] || 0}
                      </span>
                      {tab === 'Active' && newCount > 0 && (
                        <span style={{
                          marginLeft: 6,
                          width: 17,
                          height: 17,
                          borderRadius: '50%',
                          background: active ? 'rgba(255,255,255,0.22)' : '#fef3c7',
                          color: active ? '#fff' : '#92400e',
                          fontSize: 10,
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          {newCount}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => setShowModal(true)}
                className="btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                  padding: '9px 18px',
                  borderRadius: 12,
                  marginLeft: 'auto',
                  flexShrink: 0,
                }}
              >
                <PlusIcon size={14} />
                Add Order
              </button>
            </div>

            {/* Orders section */}
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                <OrderSkeleton /><OrderSkeleton /><OrderSkeleton />
              </div>
            ) : filtered.length === 0 ? (
              <div
                className="rounded-2xl py-16 text-center"
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-sm)',
                  minHeight: 260,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'fadeInUp 0.4s ease 0.15s both',
                }}
              >
                <div style={{
                  width: 62, height: 62, borderRadius: 18,
                  background: 'var(--primary-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <OrdersIcon size={28} style={{ color: 'var(--primary)' }} />
                </div>
                <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text-1)' }}>
                  {kitchenSearch ? 'No matching orders' : `No ${activeTab.toLowerCase()} orders`}
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-3)' }}>
                  {kitchenSearch
                    ? 'Try a different customer name, phone, order ID, or item.'
                    : activeTab === 'Active'
                    ? 'New orders will appear here automatically'
                    : 'Nothing to show for this filter'}
                </p>
              </div>
            ) : (
              <div style={{ animation: 'fadeInUp 0.4s ease 0.15s both' }}>
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div
                    className="flex items-center justify-between px-5 py-3"
                    style={{ borderBottom: '1px solid var(--border)' }}
                  >
                    <div>
                      <h3 className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>
                        {activeTab} Orders
                      </h3>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                        Showing {filtered.length} of {kitchenCounts[activeTab] || 0}
                      </p>
                    </div>
                  </div>
                  <div style={{ padding: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                      {filtered.map((order, i) => (
                        <div key={order.id} style={{ animationDelay: `${i * 50}ms` }}>
                          <OrderCard order={order} onStatusChange={fetchStats} restaurantName={restaurantName} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ═════════════ ORDERS HISTORY VIEW ═════════════ */}
        {mainView === 'orders' && (
          <>
            {/* ── Stats bar — Apple-style metric cards with SVG icons ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
              {STAT_CONFIGS.map(s => (
                <div
                  key={s.key}
                  style={{
                    padding: '18px 20px',
                    borderRadius: 18,
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border)',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                    display: 'flex', alignItems: 'center', gap: 14,
                    transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                    cursor: 'default',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)' }}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                    background: s.bg, border: `1px solid ${s.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: s.iconColor,
                  }}>
                    {s.icon}
                  </div>
                  <div>
                    <div style={{
                      fontSize: 24, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1,
                      color: s.color,
                    }}>
                      {statValues[s.key]}
                    </div>
                    <div style={{
                      fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                      letterSpacing: '0.06em', color: 'var(--text-3)', marginTop: 4,
                    }}>
                      {s.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Filter bar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
              flexWrap: 'wrap',
              animation: 'fadeInUp 0.4s ease 0.1s both',
            }}>
              {/* Period pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {ORDER_PERIODS.map(p => (
                  <button key={p.value} onClick={() => setOrdersPeriod(p.value)} style={{
                    padding: '7px 14px', borderRadius: 999, cursor: 'pointer',
                    fontSize: 12, fontWeight: 700, transition: 'all 0.15s', fontFamily: 'inherit',
                    background: ordersPeriod === p.value ? 'var(--primary)' : 'transparent',
                    color: ordersPeriod === p.value ? '#fff' : 'var(--text-3)',
                    border: ordersPeriod === p.value ? '1.5px solid var(--primary)' : '1.5px solid var(--border)',
                    boxShadow: ordersPeriod === p.value ? '0 2px 8px rgba(170,48,26,0.25)' : 'none',
                  }}>{p.label}</button>
                ))}
              </div>

              {/* Search */}
              <div style={{
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: 300,
                padding: '8px 12px',
                border: '1.5px solid var(--border)',
                borderRadius: 11,
                background: 'var(--surface-2)',
                transition: 'border-color 0.15s ease',
              }}>
                <span style={{ color: 'var(--text-3)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  <SearchIcon size={13} />
                </span>
                <input
                  type="text"
                  placeholder="Search name, phone, ID…"
                  value={ordersSearch}
                  onChange={e => setOrdersSearch(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    fontSize: 12, fontFamily: 'inherit',
                    color: 'var(--text-1)',
                  }}
                  onFocus={e => e.currentTarget.parentElement.style.borderColor = 'var(--primary)'}
                  onBlur={e => e.currentTarget.parentElement.style.borderColor = 'var(--border)'}
                />
                {ordersSearch && (
                  <button onClick={() => setOrdersSearch('')} style={{
                    width: 18, height: 18, borderRadius: '50%',
                    border: 'none', background: 'var(--border)',
                    cursor: 'pointer', fontSize: 10, color: 'var(--text-3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <XIcon size={9} />
                  </button>
                )}
              </div>
            </div>

            {/* Orders grid */}
            {ordersLoading ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <OrderSkeleton /><OrderSkeleton /><OrderSkeleton /><OrderSkeleton />
              </div>
            ) : filteredAllOrders.length === 0 ? (
              <div
                className="rounded-2xl py-16 text-center"
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-sm)',
                  minHeight: 260,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'fadeInUp 0.4s ease both',
                }}
              >
                <div style={{
                  width: 68, height: 68, borderRadius: 20,
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                    <rect x="9" y="3" width="6" height="4" rx="1"/>
                    <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
                  </svg>
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-2)', letterSpacing: '-0.01em' }}>No orders found</div>
                <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 6 }}>Try adjusting the period or filters</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {filteredAllOrders.map((order, i) => (
                  <div key={order.id} style={{ animationDelay: `${i * 40}ms` }}>
                    <OrderCard order={order} onStatusChange={() => fetchOrders(true)} restaurantName={restaurantName} />
                  </div>
                ))}
              </div>
            )}

            {filteredAllOrders.length > 0 && (
              <div style={{
                textAlign: 'center', marginTop: 28, fontSize: 12, color: 'var(--text-3)',
                padding: '12px',
                borderTop: '1px solid var(--border)',
              }}>
                Showing {filteredAllOrders.length} of {allOrders.length} orders
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}
