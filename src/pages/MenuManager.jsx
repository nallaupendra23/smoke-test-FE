import { useState, useEffect, useRef } from 'react'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import { menuApi, knowledgeApi, unwrapList } from '../services/api'
import { PlusIcon, SearchIcon, SpinnerIcon, TrashIcon, CheckIcon, XIcon, MenuIcon } from '../components/Icons'

const EMPTY_FORM = { category: '', name: '', description: '', price: '', available: true }

/* ── Category icon + color mapping ── */
const CATEGORY_ICONS = {
  Appetizers: '🥗', Starters: '🥗', Mains: '🍽', Pizzas: '🍕', Burgers: '🍔',
  Pasta: '🍝', Sides: '🍟', Drinks: '🥤', Beverages: '🥤', Desserts: '🍰',
  Salads: '🥬', Specials: '⭐', Soups: '🍲', Sandwiches: '🥪', Breakfast: '🍳',
  Seafood: '🦐', Chicken: '🍗', Rice: '🍚', Wraps: '🌯', Kids: '👶',
  Vegan: '🥦', Sushi: '🍣', Tacos: '🌮', Steaks: '🥩', Coffee: '☕',
}
const getCategoryIcon = (cat) => {
  if (!cat) return '🍴'
  if (CATEGORY_ICONS[cat]) return CATEGORY_ICONS[cat]
  const c = cat.toLowerCase()
  if (c.includes('burger') || c.includes('sandwich')) return '🍔'
  if (c.includes('pizza')) return '🍕'
  if (c.includes('pasta') || c.includes('noodle')) return '🍝'
  if (c.includes('salad')) return '🥬'
  if (c.includes('soup')) return '🍲'
  if (c.includes('grill') || c.includes('bbq') || c.includes('kebab')) return '🔥'
  if (c.includes('wrap') || c.includes('taco') || c.includes('shawarma')) return '🌯'
  if (c.includes('juice') || c.includes('smoothie') || c.includes('shake')) return '🥤'
  if (c.includes('coffee') || c.includes('tea') || c.includes('karak')) return '☕'
  if (c.includes('drink') || c.includes('beverage') || c.includes('soda')) return '🥤'
  if (c.includes('dessert') || c.includes('sweet') || c.includes('cake')) return '🍰'
  if (c.includes('rice') || c.includes('biryani') || c.includes('mandi')) return '🍚'
  if (c.includes('seafood') || c.includes('fish') || c.includes('shrimp')) return '🦐'
  if (c.includes('chicken')) return '🍗'
  if (c.includes('starter') || c.includes('appetizer') || c.includes('mezze')) return '🥗'
  if (c.includes('side') || c.includes('fries')) return '🍟'
  if (c.includes('main') || c.includes('entree')) return '🍽'
  if (c.includes('special') || c.includes('chef')) return '⭐'
  if (c.includes('vegan') || c.includes('vegetar')) return '🥦'
  if (c.includes('steak') || c.includes('meat')) return '🥩'
  if (c.includes('sushi') || c.includes('roll')) return '🍣'
  if (c.includes('kid') || c.includes('child')) return '👶'
  return '🍴'
}

const CAT_COLORS = [
  '#aa301a','#2563eb','#059669','#d97706','#7c3aed',
  '#db2777','#0891b2','#65a30d','#ea580c','#4f46e5',
  '#0d9488','#9333ea','#e11d48','#16a34a','#ca8a04',
]
const getCategoryColor = (cat) => {
  if (!cat) return CAT_COLORS[0]
  let h = 0
  for (let i = 0; i < cat.length; i++) h = cat.charCodeAt(i) + ((h << 5) - h)
  return CAT_COLORS[Math.abs(h) % CAT_COLORS.length]
}

/* ── Toggle Switch (Apple style) ── */
function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onChange}
      className="relative inline-flex flex-shrink-0 items-center transition-all duration-300 ease-in-out"
      aria-pressed={checked}
      style={{
        width: 44,
        height: 26,
        borderRadius: 13,
        background: checked ? '#34c759' : '#e5e5ea',
        cursor: disabled ? 'wait' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        border: 'none',
        outline: 'none',
        padding: 0,
        verticalAlign: 'middle',
      }}
    >
      <span
        className="absolute rounded-full bg-white shadow-md transition-all duration-300"
        style={{
          top: 2,
          left: checked ? 20 : 2,
          width: 22,
          height: 22,
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
        }}
      />
    </button>
  )
}

/* ── Inline editable price ── */
function EditablePrice({ value, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value.toString())
  const inputRef = useRef(null)

  useEffect(() => { if (editing) inputRef.current?.select() }, [editing])

  const commit = () => {
    const num = parseFloat(draft)
    if (!isNaN(num) && num >= 0) onSave(num)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        step="0.01"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
        className="text-right font-bold"
        style={{
          width: 72,
          fontSize: 15,
          padding: '4px 8px',
          border: '1.5px solid #aa301a',
          borderRadius: 8,
          outline: 'none',
          background: 'rgba(170,48,26,0.04)',
          color: 'var(--text-1)',
        }}
      />
    )
  }

  return (
    <span
      className="font-bold cursor-pointer px-2 py-1 rounded-lg transition-colors"
      style={{ fontSize: 15, color: 'var(--text-1)' }}
      onClick={() => setEditing(true)}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      title="Click to edit price"
    >
      ${value.toFixed(2)}
    </span>
  )
}

/* ── Menu Item Row ── */
function MenuItemRow({ item, onEdit, onDelete, onToggle, onPriceUpdate }) {
  const [toggling, setToggling] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleToggle = async () => {
    setToggling(true)
    await onToggle(item)
    setToggling(false)
  }

  const handleDelete = async () => {
    setDeleting(true)
    await onDelete(item.id)
    setDeleting(false)
  }

  return (
    <div
      className="group flex items-center gap-4 px-4 py-3.5 transition-all duration-200"
      style={{
        borderBottom: '1px solid var(--border)',
        opacity: item.available ? 1 : 0.5,
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.015)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
            {item.name}
          </span>
          {!item.available && (
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: 10, fontWeight: 600 }}
            >
              UNAVAILABLE
            </span>
          )}
        </div>
        {item.description && (
          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-3)', maxWidth: 340 }}>
            {item.description}
          </p>
        )}
      </div>

      {/* Price - click to edit */}
      <EditablePrice
        value={item.price}
        onSave={(newPrice) => onPriceUpdate(item, newPrice)}
      />

      {/* Toggle */}
      <Toggle checked={item.available} onChange={handleToggle} disabled={toggling} />

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={() => onEdit(item)}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--text-3)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(170,48,26,0.08)'; e.currentTarget.style.color = '#aa301a' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)' }}
          title="Edit item"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        {showConfirm ? (
          <div className="flex items-center gap-1">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-1.5 rounded-lg transition-colors"
              style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}
              title="Confirm delete"
            >
              {deleting ? <SpinnerIcon size={14} /> : <CheckIcon size={13} />}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--text-3)' }}
              title="Cancel"
            >
              <XIcon size={13} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirm(true)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-3)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#ef4444' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)' }}
            title="Delete item"
          >
            <TrashIcon size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

/* ── Add/Edit Modal (Apple sheet style) ── */
function ItemModal({ open, editId, form, setForm, onSubmit, onClose, saving }) {
  const nameRef = useRef(null)
  useEffect(() => { if (open) setTimeout(() => nameRef.current?.focus(), 100) }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ animation: 'fadeIn 0.15s ease' }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="relative w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl overflow-hidden"
        style={{
          background: 'var(--card-bg)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
          animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h3 className="text-lg font-bold" style={{ color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
            {editId ? 'Edit Item' : 'New Menu Item'}
          </h3>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-full transition-colors"
            style={{ width: 30, height: 30, background: 'var(--border)', color: 'var(--text-3)' }}
            onMouseEnter={e => e.currentTarget.style.background = '#d2d2d7'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--border)'}
          >
            <XIcon size={14} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="px-6 pb-6">
          <div className="space-y-4">
            {/* Name + Category row */}
            <div className="grid grid-cols-5 gap-3">
              <div className="col-span-3">
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-3)', letterSpacing: '0.02em' }}>
                  ITEM NAME
                </label>
                <input
                  ref={nameRef}
                  className="input"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Classic Burger"
                  required
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-3)', letterSpacing: '0.02em' }}>
                  CATEGORY
                </label>
                <input
                  className="input"
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  placeholder="Mains"
                  required
                  list="category-suggestions"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-3)', letterSpacing: '0.02em' }}>
                DESCRIPTION
              </label>
              <input
                className="input"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Short description for the AI phone agent"
              />
            </div>

            {/* Price + Available row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-3)', letterSpacing: '0.02em' }}>
                  PRICE
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold" style={{ color: 'var(--text-3)' }}>$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="input"
                    style={{ paddingLeft: 24 }}
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    placeholder="12.99"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-3)', letterSpacing: '0.02em' }}>
                  STATUS
                </label>
                <div
                  className="w-full flex items-center justify-between gap-3 select-none"
                  style={{
                    height: 44,
                    padding: '0 14px',
                    borderRadius: 12,
                    border: '1.5px solid transparent',
                    background: 'var(--surface-2)',
                    fontFamily: 'inherit',
                  }}
                >
                  <span className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>
                    {form.available ? 'Available' : 'Unavailable'}
                  </span>
                  <Toggle
                    checked={form.available}
                    onChange={() => setForm({ ...form, available: !form.available })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-semibold transition-colors"
              style={{ background: 'var(--border)', color: 'var(--text-2)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(145deg, #cb4830, #aa301a)',
                boxShadow: '0 2px 8px rgba(170,48,26,0.3)',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? (
                <><SpinnerIcon size={14} /> Saving...</>
              ) : editId ? (
                <><CheckIcon size={14} /> Update Item</>
              ) : (
                <><PlusIcon size={14} /> Add Item</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════════ */

export default function MenuManager() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState(null)
  const detailRef = useRef(null)

  const load = async () => {
    try {
      const res = await menuApi.list()
      setItems(unwrapList(res))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!activeCategory) return
    if (window.innerWidth <= 768) return
    window.setTimeout(() => {
      detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }, [activeCategory])

  // Categories
  const categories = ['All', ...new Set(items.map(i => i.category))]

  // Unique categories for the grid
  const uniqueCategories = [...new Set(items.map(i => i.category))].filter(Boolean)

  // Items filtered for the detail view
  const filtered = items.filter(item => {
    const matchCat = !activeCategory || item.category === activeCategory
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  // Group by category
  const grouped = filtered.reduce((acc, item) => {
    acc[item.category] = acc[item.category] || []
    acc[item.category].push(item)
    return acc
  }, {})

  // Stats
  const totalItems = items.length
  const availableItems = items.filter(i => i.available).length
  const categoriesCount = new Set(items.map(i => i.category)).size

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const data = { ...form, price: parseFloat(form.price) }
      if (editId) {
        await menuApi.update(editId, data)
        setMessage({ type: 'success', text: `"${form.name}" updated` })
      } else {
        await menuApi.create(data)
        setMessage({ type: 'success', text: `"${form.name}" added to menu` })
      }
      setForm(EMPTY_FORM)
      setEditId(null)
      setShowModal(false)
      await load()
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to save item' })
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(null), 4000)
    }
  }

  const handleEdit = (item) => {
    setEditId(item.id)
    setForm({ ...item, price: item.price.toString() })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    await menuApi.delete(id)
    setMessage({ type: 'success', text: 'Item removed from menu' })
    await load()
    setTimeout(() => setMessage(null), 3000)
  }

  const handleToggle = async (item) => {
    await menuApi.update(item.id, { available: !item.available })
    await load()
  }

  const handlePriceUpdate = async (item, newPrice) => {
    if (newPrice === item.price) return
    await menuApi.update(item.id, { price: newPrice })
    setMessage({ type: 'success', text: `Price updated to $${newPrice.toFixed(2)}` })
    await load()
    setTimeout(() => setMessage(null), 3000)
  }

  const openAddModal = () => {
    setEditId(null)
    setForm({ ...EMPTY_FORM, category: activeCategory || '' })
    setShowModal(true)
  }

  const selectCategory = (category) => {
    setActiveCategory(prev => prev === category ? null : category)
    setSearch('')
  }

  const renderCategoryDetail = (mode = 'desktop') => (
    <div
      ref={mode === 'desktop' ? detailRef : undefined}
      className={mode === 'mobile' ? 'menu-mobile-category-detail' : 'menu-desktop-category-detail'}
      style={{ animation: 'fadeInUp 0.3s ease both', marginTop: mode === 'mobile' ? 0 : 28 }}
    >
      {/* Search bar */}
      <div className="menu-category-detail-tools flex items-center justify-between gap-3 mb-4">
        <div className="relative" style={{ maxWidth: 320, flex: '1 1 320px' }}>
          <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
          <input
            className="input"
            style={{ paddingLeft: 32, fontSize: 13 }}
            placeholder={`Search in ${activeCategory}...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={() => { setActiveCategory(null); setSearch('') }}
          className="btn-secondary"
          style={{ padding: '9px 14px', borderRadius: 12 }}
        >
          Clear selection
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><SpinnerIcon size={24} /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl py-16 text-center" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🔍</div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-3)' }}>
            {search ? 'No items match your search' : `No items in ${activeCategory} yet`}
          </p>
          {!search && (
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 mt-4 py-2 px-4 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(145deg, #cb4830, #aa301a)' }}
            >
              <PlusIcon size={13} /> Add to {activeCategory}
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          {/* Category sub-header */}
          <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid var(--border)', background: `${getCategoryColor(activeCategory)}08` }}>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 16 }}>{getCategoryIcon(activeCategory)}</span>
              <span className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>{activeCategory}</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--border)', color: 'var(--text-3)' }}>
                {filtered.length} item{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>
            <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>
              {filtered.filter(i => i.available).length} available
            </span>
          </div>

          {filtered.map(item => (
            <MenuItemRow
              key={item.id}
              item={item}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggle={handleToggle}
              onPriceUpdate={handlePriceUpdate}
            />
          ))}
        </div>
      )}
    </div>
  )

  return (
    <Layout>
      <div className="app-page">

        <PageHeader
          icon={MenuIcon}
          title="Menu"
          subtitle={`${totalItems} items across ${categoriesCount} categories`}
          accent="var(--primary)"
          accentBg="var(--primary-light)"
        >
          <div className="page-toolbar">
            <button
              onClick={async () => {
                setSyncing(true)
                try {
                  const res = await knowledgeApi.syncMenu()
                  const { inserted } = res.data
                  await load()
                  setMessage({ type: 'success', text: inserted > 0 ? `Synced ${inserted} items from Knowledge Base` : 'Menu is up to date' })
                  setTimeout(() => setMessage(null), 4000)
                } catch {
                  await load()
                } finally {
                  setSyncing(false)
                }
              }}
              disabled={syncing || loading}
              className="btn-secondary"
              style={{
                padding: '9px 14px',
                borderRadius: 12,
                opacity: syncing || loading ? 0.6 : 1,
              }}
              title="Sync menu items from Knowledge Base"
            >
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }}
              >
                <path d="M21 2v6h-6" />
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                <path d="M3 22v-6h6" />
                <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
              </svg>
              Sync from KB
            </button>
            <button
              type="button"
              data-testid="add-item-button"
              onClick={openAddModal}
              className="btn-primary"
              style={{ borderRadius: 12, padding: '10px 18px' }}
            >
              <PlusIcon size={15} /> Add Item
            </button>
          </div>
        </PageHeader>

        {/* ── Alert ── */}
        {message && (
          <div
            className="mb-6 rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2.5"
            style={{
              animation: 'fadeInUp 0.25s ease both',
              background: message.type === 'success' ? 'rgba(52,199,89,0.08)' : 'rgba(239,68,68,0.08)',
              color: message.type === 'success' ? '#248a3d' : '#d70015',
              border: `1px solid ${message.type === 'success' ? 'rgba(52,199,89,0.15)' : 'rgba(239,68,68,0.15)'}`,
            }}
          >
            {message.type === 'success' ? <CheckIcon size={14} /> : <XIcon size={14} />}
            {message.text}
          </div>
        )}

        {/* ── Stats bar ── */}
        <div
          className="grid grid-cols-3 gap-4 mb-8"
          style={{ animation: 'fadeInUp 0.4s ease 0.05s both' }}
        >
          {[
            { label: 'Total Items', value: totalItems },
            { label: 'Available', value: availableItems },
            { label: 'Categories', value: categoriesCount },
          ].map((stat, i) => (
            <div
              key={i}
              className="rounded-2xl p-4"
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div
                className="text-2xl font-bold tracking-tight mb-0.5"
                style={{ color: 'var(--text-1)' }}
              >
                {stat.value}
              </div>
              <span className="text-sm font-medium" style={{ color: 'var(--text-3)' }}>{stat.label}</span>
            </div>
          ))}
        </div>

        {/* ══════ CATEGORY GRID ══════ */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <SpinnerIcon size={28} />
          </div>
        ) : uniqueCategories.length === 0 ? (
          <div
            className="rounded-2xl py-20 text-center"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', animation: 'fadeInUp 0.4s ease both' }}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>🍽</div>
            <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text-1)' }}>Your menu is empty</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-3)' }}>
              Upload your menu in the Knowledge Base to auto-import items, or add them manually.
            </p>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl text-sm font-semibold text-white mx-auto"
              style={{ background: 'linear-gradient(145deg, #cb4830, #aa301a)' }}
            >
              <PlusIcon size={14} /> Add First Item
            </button>
          </div>
        ) : (
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', animation: 'fadeInUp 0.4s ease 0.1s both' }}
          >
            {uniqueCategories.map(cat => {
              const selected = activeCategory === cat
              const catItems = items.filter(i => i.category === cat)
              const availCount = catItems.filter(i => i.available).length
              const color = getCategoryColor(cat)
              return (
                <div key={cat} className="menu-category-accordion-item">
                <button
                  key={cat}
                  onClick={() => selectCategory(cat)}
                  className="text-left rounded-2xl overflow-hidden transition-all duration-200 group"
                  style={{
                    width: '100%',
                    background: 'var(--card-bg)',
                    border: selected ? `2px solid ${color}` : '1px solid var(--border)',
                    boxShadow: selected ? `0 12px 28px ${color}18` : 'var(--shadow-sm)',
                    cursor: 'pointer',
                    transform: selected ? 'translateY(-2px)' : 'translateY(0)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = `0 12px 28px ${color}18`
                    e.currentTarget.style.borderColor = color
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = selected ? 'translateY(-2px)' : 'translateY(0)'
                    e.currentTarget.style.boxShadow = selected ? `0 12px 28px ${color}18` : 'var(--shadow-sm)'
                    e.currentTarget.style.borderColor = selected ? color : 'var(--border)'
                  }}
                >
                  {/* Colored top strip with icon */}
                  <div
                    className="flex items-center justify-center"
                    style={{ height: 88, background: `${color}14` }}
                  >
                    <div
                      className="flex items-center justify-center rounded-2xl"
                      style={{ width: 56, height: 56, background: `${color}22`, fontSize: 26 }}
                    >
                      {getCategoryIcon(cat)}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="px-4 py-3">
                    <div className="font-bold mb-1 truncate" style={{ fontSize: 14, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
                      {cat}
                    </div>
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                        {catItems.length} item{catItems.length !== 1 ? 's' : ''}
                      </span>
                      <span style={{ fontSize: 11, color: availCount === catItems.length ? '#16a34a' : '#d97706', fontWeight: 600 }}>
                        {availCount}/{catItems.length} avail
                      </span>
                    </div>
                  </div>

                  {/* Bottom accent bar */}
                  <div style={{ height: 3, background: color, opacity: selected ? 1 : 0.7 }} />
                </button>
                {selected && renderCategoryDetail('mobile')}
                </div>
              )
            })}
          </div>
        )}

        {/* ══════ CATEGORY DETAIL (inline) ══════ */}
        {activeCategory && renderCategoryDetail('desktop')}

        {/* Category suggestions datalist */}
        <datalist id="category-suggestions">
          {[...new Set(items.map(i => i.category))].map(cat => (
            <option key={cat} value={cat} />
          ))}
        </datalist>
      </div>

      {/* ── Add/Edit Modal ── */}
      <ItemModal
        open={showModal}
        editId={editId}
        form={form}
        setForm={setForm}
        onSubmit={handleSubmit}
        onClose={() => { setShowModal(false); setEditId(null); setForm(EMPTY_FORM) }}
        saving={saving}
      />
    </Layout>
  )
}
