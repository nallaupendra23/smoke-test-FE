import { useState, useEffect, useRef } from 'react'
import Layout from '../components/Layout'
import { menuApi, ordersApi, addonsApi, restaurantApi, unwrap, unwrapList } from '../services/api'
import { SpinnerIcon, XIcon, CheckIcon, SearchIcon, PlusIcon, TrashIcon, OrdersIcon, SettingsIcon } from '../components/Icons'
import { haversineKm, geocodeAddress, searchAddresses } from '../hooks/useGoogleMaps'

const CATEGORY_ICONS = {
  Appetizers: '🥗', Starters: '🥗', Mains: '🍽', Pizzas: '🍕', Burgers: '🍔',
  Pasta: '🍝', Sides: '🍟', Drinks: '🥤', Beverages: '🥤', Desserts: '🍰',
  Salads: '🥬', Specials: '⭐', Soups: '🍲', Sandwiches: '🥪',
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
  if (c.includes('grill') || c.includes('bbq') || c.includes('kebab') || c.includes('kofta') || c.includes('mashawi')) return '🔥'
  if (c.includes('wrap') || c.includes('taco') || c.includes('shawarma') || c.includes('roll')) return '🌯'
  if (c.includes('juice') || c.includes('smoothie') || c.includes('shake') || c.includes('mocktail')) return '🥤'
  if (c.includes('coffee') || c.includes('tea') || c.includes('karak') || c.includes('latte') || c.includes('cappuccino')) return '☕'
  if (c.includes('drink') || c.includes('beverage') || c.includes('soda') || c.includes('water')) return '🥤'
  if (c.includes('dessert') || c.includes('sweet') || c.includes('cake') || c.includes('ice cream')) return '🍰'
  if (c.includes('rice') || c.includes('biryani') || c.includes('mandi') || c.includes('kabsa')) return '🍚'
  if (c.includes('seafood') || c.includes('fish') || c.includes('shrimp') || c.includes('prawn')) return '🦐'
  if (c.includes('chicken')) return '🍗'
  if (c.includes('starter') || c.includes('appetizer') || c.includes('snack') || c.includes('mezze')) return '🥗'
  if (c.includes('side') || c.includes('fries') || c.includes('chips')) return '🍟'
  if (c.includes('main') || c.includes('entree') || c.includes('meal')) return '🍽'
  if (c.includes('bread') || c.includes('pita') || c.includes('naan') || c.includes('roti')) return '🫓'
  if (c.includes('special') || c.includes('chef')) return '⭐'
  if (c.includes('kid') || c.includes('child') || c.includes('junior')) return '👶'
  if (c.includes('vegetar') || c.includes('vegan')) return '🥦'
  if (c.includes('sandwich') || c.includes('sub') || c.includes('hoagie')) return '🥪'
  return '🍴'
}

// Item-name aware icon — tries the item name first, falls back to category
const getItemIcon = (name, category) => {
  const n = (name || '').toLowerCase()
  if (n.includes('pizza')) return '🍕'
  if (n.includes('burger') || n.includes('smash') || n.includes('patty')) return '🍔'
  if (n.includes('pasta') || n.includes('spaghetti') || n.includes('linguine') || n.includes('fettuccine') || n.includes('penne')) return '🍝'
  if (n.includes('steak') || n.includes('ribeye') || n.includes('sirloin') || n.includes('ribs')) return '🥩'
  if (n.includes('chicken') || n.includes('wing') || n.includes('nugget') || n.includes('tender') || n.includes('popcorn')) return '🍗'
  if (n.includes('salmon') || n.includes('fish') || n.includes('cod') || n.includes('tuna') || n.includes('shrimp') || n.includes('prawn') || n.includes('calamari') || n.includes('seafood') || n.includes('crab') || n.includes('lobster')) return '🦐'
  if (n.includes('soup') || n.includes('chowder') || n.includes('bisque') || n.includes('broth')) return '🍲'
  if (n.includes('salad') || n.includes('caesar') || n.includes('coleslaw')) return '🥗'
  if (n.includes('fries') || n.includes('chips') || n.includes('wedge') || n.includes('onion ring')) return '🍟'
  if (n.includes('bread') || n.includes('bruschetta') || n.includes('garlic') || n.includes('pita') || n.includes('naan') || n.includes('roti')) return '🫓'
  if (n.includes('wrap') || n.includes('shawarma') || n.includes('taco') || n.includes('burrito')) return '🌯'
  if (n.includes('sandwich') || n.includes('sub') || n.includes('club') || n.includes('blt')) return '🥪'
  if (n.includes('rice') || n.includes('biryani') || n.includes('mandi') || n.includes('kabsa') || n.includes('pilaf')) return '🍚'
  if (n.includes('ice cream') || n.includes('gelato') || n.includes('sundae') || n.includes('sorbet')) return '🍦'
  if (n.includes('cake') || n.includes('cheesecake') || n.includes('brownie') || n.includes('waffle') || n.includes('pancake') || n.includes('donut')) return '🍰'
  if (n.includes('juice') || n.includes('smoothie') || n.includes('shake') || n.includes('lemonade') || n.includes('mocktail')) return '🥤'
  if (n.includes('coffee') || n.includes('espresso') || n.includes('latte') || n.includes('cappuccino') || n.includes('karak') || n.includes('americano')) return '☕'
  if (n.includes('tea') || n.includes('chai')) return '🍵'
  if (n.includes('water') || n.includes('soda') || n.includes('cola') || n.includes('sprite') || n.includes('pepsi') || n.includes('7up')) return '💧'
  if (n.includes('mozzarella') || n.includes('cheese') || n.includes('ravioli') || n.includes('lasagna')) return '🧀'
  if (n.includes('mushroom') || n.includes('veggie') || n.includes('vegetable') || n.includes('vegan')) return '🥦'
  if (n.includes('egg') || n.includes('omelette') || n.includes('benedict')) return '🍳'
  if (n.includes('hotdog') || n.includes('hot dog') || n.includes('sausage')) return '🌭'
  if (n.includes('taco') || n.includes('nacho')) return '🌮'
  return getCategoryIcon(category)
}

// Stable color per category (hash the name so order doesn't matter)
const CAT_PALETTE = [
  '#aa301a','#2563eb','#059669','#d97706','#7c3aed',
  '#db2777','#0891b2','#65a30d','#ea580c','#4f46e5',
  '#0d9488','#9333ea','#e11d48','#16a34a','#ca8a04',
]
const getCategoryColor = (cat) => {
  if (!cat) return CAT_PALETTE[0]
  let h = 0
  for (let i = 0; i < cat.length; i++) h = cat.charCodeAt(i) + ((h << 5) - h)
  return CAT_PALETTE[Math.abs(h) % CAT_PALETTE.length]
}

const CATEGORY_MODS = {
  Burgers:    ['No Onions', 'No Pickles', 'Extra Cheese', 'Well Done', 'Extra Sauce', 'No Bun', 'No Tomato'],
  Pizzas:     ['Extra Cheese', 'Thin Crust', 'Well Done', 'Light Sauce', 'No Sauce', 'Extra Crispy'],
  Pasta:      ['Extra Sauce', 'No Cheese', 'Gluten Free', 'Spicy', 'Light Sauce', 'Extra Portion'],
  Drinks:     ['No Ice', 'Light Ice', 'Extra Ice', 'No Sugar', 'Extra Large', 'Room Temp'],
  Sides:      ['Extra Salt', 'No Salt', 'Sauce on Side', 'Extra Crispy', 'No Seasoning'],
  Salads:     ['Dressing on Side', 'No Croutons', 'Extra Dressing', 'No Cheese', 'No Tomato'],
  Desserts:   ['No Whipped Cream', 'Extra Sauce', 'No Ice Cream', 'Warm', 'No Nuts'],
  Appetizers: ['Extra Sauce', 'Spicy', 'Mild', 'No Garlic', 'Extra Crispy'],
  Mains:      ['Well Done', 'Medium Rare', 'Medium', 'No Sauce', 'Spicy', 'Extra Portion'],
  Specials:   ['Spicy', 'No Spice', 'Extra Portion', 'No Sauce', 'Gluten Free'],
}
const DEFAULT_MODS = ['Spicy', 'Mild', 'No Sauce', 'Extra Portion', 'Sauce on Side', 'Gluten Free']

// Paid extras — shown below free mods, each has a price the customer pays
const PAID_ADDONS = {
  Burgers: [
    { name: 'Extra Cheese', price: 1.50 },
    { name: 'Add Bacon', price: 2.00 },
    { name: 'Double Patty', price: 3.00 },
    { name: 'Avocado', price: 1.50 },
    { name: 'Fried Egg', price: 1.00 },
  ],
  Pizzas: [
    { name: 'Extra Cheese', price: 1.50 },
    { name: 'Extra Toppings', price: 1.50 },
    { name: 'Stuffed Crust', price: 2.00 },
    { name: 'Dipping Sauce', price: 0.75 },
  ],
  Pasta: [
    { name: 'Extra Protein', price: 2.50 },
    { name: 'Add Prawns', price: 3.50 },
    { name: 'Extra Sauce', price: 1.00 },
    { name: 'Add Mushrooms', price: 1.50 },
  ],
  Drinks: [
    { name: 'Extra Shot', price: 0.75 },
    { name: 'Oat Milk', price: 0.75 },
    { name: 'Extra Syrup', price: 0.50 },
    { name: 'Whipped Cream', price: 0.75 },
  ],
  Sides: [
    { name: 'Upgrade to Large', price: 1.50 },
    { name: 'Add Dipping Sauce', price: 0.75 },
    { name: 'Add Cheese', price: 1.00 },
  ],
  Salads: [
    { name: 'Add Chicken', price: 3.00 },
    { name: 'Add Shrimp', price: 4.00 },
    { name: 'Extra Dressing', price: 0.75 },
    { name: 'Add Avocado', price: 1.50 },
  ],
  Desserts: [
    { name: 'Add Ice Cream', price: 2.00 },
    { name: 'Extra Sauce', price: 0.75 },
    { name: 'Whipped Cream', price: 0.75 },
    { name: 'Upgrade to Large', price: 1.50 },
  ],
  Mains: [
    { name: 'Extra Sauce', price: 1.00 },
    { name: 'Add Side Salad', price: 2.50 },
    { name: 'Upgrade Protein', price: 3.00 },
    { name: 'Extra Portion', price: 3.50 },
  ],
  Appetizers: [
    { name: 'Extra Dip', price: 0.75 },
    { name: 'Add Cheese', price: 1.00 },
    { name: 'Upgrade to Large', price: 1.50 },
  ],
  Specials: [
    { name: 'Extra Portion', price: 3.50 },
    { name: 'Add Side', price: 2.50 },
    { name: 'Extra Sauce', price: 1.00 },
  ],
}
const DEFAULT_ADDONS = [
  { name: 'Extra Portion', price: 3.00 },
  { name: 'Add Side', price: 2.50 },
  { name: 'Extra Sauce', price: 1.00 },
]

const TAX_RATE = 0.08
const EMPTY_FORM = { name: '', category: '', description: '', price: '', available: true }

/* ── Inline editable price ── */
function InlinePrice({ value, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value.toString())
  const ref = useRef(null)
  useEffect(() => { if (editing) ref.current?.select() }, [editing])

  const commit = () => {
    const n = parseFloat(draft)
    if (!isNaN(n) && n >= 0) onSave(n)
    setEditing(false)
  }

  if (editing) return (
    <input
      ref={ref} type="number" step="0.01" value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
      style={{ width: 64, fontSize: 12, fontWeight: 700, padding: '3px 6px', border: '1.5px solid #aa301a', borderRadius: 6, outline: 'none', background: 'rgba(170,48,26,0.04)', color: 'var(--text-1)', textAlign: 'right' }}
    />
  )
  return (
    <span
      onClick={() => { setDraft(value.toString()); setEditing(true) }}
      title="Click to edit price"
      style={{ fontSize: 12, fontWeight: 700, color: '#aa301a', cursor: 'pointer', padding: '3px 6px', borderRadius: 6, transition: 'background 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(170,48,26,0.08)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      ${value.toFixed(2)}
    </span>
  )
}

/* ── Toggle switch ── */
function Toggle({ checked, onChange, disabled }) {
  return (
    <button type="button" disabled={disabled} onClick={onChange} style={{ width: 36, height: 22, borderRadius: 11, background: checked ? '#34c759' : 'var(--border)', border: 'none', outline: 'none', padding: 0, cursor: disabled ? 'wait' : 'pointer', opacity: disabled ? 0.5 : 1, flexShrink: 0, transition: 'background 0.2s', display: 'inline-flex', alignItems: 'center' }}>
      <span style={{ display: 'block', width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.18)', transform: `translateX(${checked ? 16 : 2}px)`, transition: 'transform 0.2s' }} />
    </button>
  )
}

/* ══════════════════════════════════════════════════════════════════
   POS Settings Panel — slides in from the right
══════════════════════════════════════════════════════════════════ */
function POSSettingsPanel({ open, items, addons, onClose, onRefresh, onRefreshAddons, onToast }) {
  const [tab, setTab] = useState('items')         // 'items' | 'add' | 'extras'
  const [settingsSearch, setSettingsSearch] = useState('')
  const [editingId, setEditingId] = useState(null) // which item row is expanded for edit
  const [editForm, setEditForm] = useState({})
  const [addForm, setAddForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [togglingId, setTogglingId] = useState(null)
  const nameRef = useRef(null)

  useEffect(() => { if (tab === 'add' && open) setTimeout(() => nameRef.current?.focus(), 150) }, [tab, open])

  if (!open) return null

  const filtered = items.filter(i =>
    !settingsSearch || i.name.toLowerCase().includes(settingsSearch.toLowerCase()) ||
    i.category.toLowerCase().includes(settingsSearch.toLowerCase())
  )

  const startEdit = (item) => {
    setEditingId(item.id)
    setEditForm({ name: item.name, category: item.category, description: item.description || '', price: item.price.toString(), available: item.available })
  }

  const cancelEdit = () => { setEditingId(null); setEditForm({}) }

  const saveEdit = async (id) => {
    setSaving(true)
    try {
      await menuApi.update(id, { ...editForm, price: parseFloat(editForm.price) })
      cancelEdit()
      await onRefresh()
      onToast('success', 'Item updated')
    } catch {
      onToast('error', 'Failed to update')
    } finally { setSaving(false) }
  }

  const savePrice = async (item, price) => {
    if (price === item.price) return
    try {
      await menuApi.update(item.id, { price })
      await onRefresh()
      onToast('success', `Price updated to $${price.toFixed(2)}`)
    } catch { onToast('error', 'Failed to update price') }
  }

  const toggleAvailability = async (item) => {
    setTogglingId(item.id)
    try {
      await menuApi.update(item.id, { available: !item.available })
      await onRefresh()
    } catch { onToast('error', 'Failed to update') }
    finally { setTogglingId(null) }
  }

  const deleteItem = async (id) => {
    setDeletingId(id)
    try {
      await menuApi.delete(id)
      await onRefresh()
      onToast('success', 'Item removed')
      setConfirmDeleteId(null)
    } catch { onToast('error', 'Failed to delete') }
    finally { setDeletingId(null) }
  }

  const addItem = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await menuApi.create({ ...addForm, price: parseFloat(addForm.price) })
      setAddForm(EMPTY_FORM)
      setTab('items')
      await onRefresh()
      onToast('success', `"${addForm.name}" added`)
    } catch { onToast('error', 'Failed to add item') }
    finally { setSaving(false) }
  }

  const categories = [...new Set(items.map(i => i.category))]

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(3px)' }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="pos-settings-drawer fixed top-0 right-0 bottom-0 z-40 flex flex-col"
        style={{
          width: 500,
          background: 'var(--card-bg)',
          borderLeft: '1px solid var(--border)',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.2)',
          animation: 'slideInRight 0.28s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Header */}
        <div className="pos-settings-header flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="pos-settings-title-row flex items-center gap-3">
            <div className="flex items-center justify-center rounded-xl" style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#cb4830,#aa301a)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
            </div>
            <div>
              <h2 className="font-bold" style={{ fontSize: 15, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>POS Settings</h2>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>{items.length} items · manage your menu</p>
            </div>
          </div>
          <button onClick={onClose} className="pos-settings-close rounded-full" style={{ width: 30, height: 30, background: 'var(--border)', color: 'var(--text-3)', display: 'inline-grid', placeItems: 'center', padding: 0, lineHeight: 0 }}>
            <XIcon size={14} />
          </button>
        </div>

        {/* Tabs */}
        <div className="pos-settings-tabs grid px-5 pt-4 pb-0 gap-2 flex-shrink-0" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
          {[['items', '🍽 Menu Items'], ['add', '＋ Add Item'], ['extras', '💲 Paid Extras']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="pos-settings-tab px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150"
              style={{
                minHeight: 36,
                background: tab === key ? '#aa301a' : 'var(--border)',
                color: tab === key ? '#fff' : 'var(--text-2)',
                boxShadow: tab === key ? '0 2px 8px rgba(170,48,26,0.25)' : 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Tab: Menu Items ── */}
        {tab === 'items' && (
          <>
            {/* Search */}
            <div className="px-5 pt-4 pb-3 flex-shrink-0">
              <div className="relative">
                <SearchIcon size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
                <input
                  className="input"
                  style={{ paddingLeft: 30, fontSize: 13, height: 34 }}
                  placeholder="Search items or category..."
                  value={settingsSearch}
                  onChange={e => setSettingsSearch(e.target.value)}
                />
              </div>
            </div>

            <p className="px-5 pb-2 text-xs font-semibold" style={{ color: 'var(--text-3)' }}>
              {filtered.length} item{filtered.length !== 1 ? 's' : ''} · click price to edit
            </p>

            {/* Item list */}
            <div className="pos-settings-list flex-1 overflow-y-auto px-5 pb-4">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <div style={{ fontSize: 36, marginBottom: 8 }}>🔍</div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-3)' }}>No items found</p>
                </div>
              ) : filtered.map(item => (
                <div key={item.id} className="pos-settings-item-card rounded-2xl mb-2 overflow-hidden" style={{ border: '1px solid var(--border)', background: editingId === item.id ? 'rgba(170,48,26,0.02)' : 'var(--bg)' }}>

                  {/* Item row */}
                  <div
                    className="pos-settings-item-row px-3 py-2.5"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '30px minmax(0, 1fr) 74px 52px 40px 52px',
                      alignItems: 'center',
                      columnGap: 8,
                    }}
                  >
                    <span className="pos-settings-item-icon" style={{ fontSize: 20, width: 30, textAlign: 'center' }}>{getItemIcon(item.name, item.category)}</span>
                    <div className="pos-settings-item-info flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: item.available ? 'var(--text-1)' : 'var(--text-3)' }}>{item.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs px-1.5 py-0.5 rounded-md font-medium" style={{ background: 'var(--border)', color: 'var(--text-3)' }}>{item.category}</span>
                        {!item.available && <span className="text-xs font-bold" style={{ color: '#ef4444' }}>86'd</span>}
                      </div>
                    </div>

                    {/* Inline price */}
                    <div className="pos-settings-price-cell" style={{ width: 74, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <InlinePrice value={item.price} onSave={price => savePrice(item, price)} />
                    </div>

                    {/* Availability toggle */}
                    <div className="pos-settings-toggle-cell" style={{ width: 52, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <Toggle
                        checked={item.available}
                        onChange={() => toggleAvailability(item)}
                        disabled={togglingId === item.id}
                      />
                    </div>

                    {/* Edit button */}
                    <button
                      onClick={() => editingId === item.id ? cancelEdit() : startEdit(item)}
                      className="pos-settings-icon-button flex items-center justify-center rounded-lg transition-colors"
                      style={{ width: 30, height: 30, margin: '0 auto', background: editingId === item.id ? 'rgba(170,48,26,0.1)' : 'var(--border)', color: editingId === item.id ? '#aa301a' : 'var(--text-3)', flexShrink: 0 }}
                      title="Edit item"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>

                    {/* Delete */}
                    {confirmDeleteId === item.id ? (
                      <div className="pos-settings-delete-confirm flex gap-1 justify-end" style={{ width: 52 }}>
                        <button
                          onClick={() => deleteItem(item.id)}
                          disabled={deletingId === item.id}
                          className="flex items-center justify-center rounded-lg"
                          style={{ width: 28, height: 28, background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
                        >
                          {deletingId === item.id ? <SpinnerIcon size={11} /> : <CheckIcon size={11} />}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="flex items-center justify-center rounded-lg"
                          style={{ width: 28, height: 28, background: 'var(--border)', color: 'var(--text-3)' }}
                        >
                          <XIcon size={11} />
                        </button>
                      </div>
                    ) : (
                      <div className="pos-settings-delete-cell" style={{ width: 52, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <button
                          onClick={() => setConfirmDeleteId(item.id)}
                          className="pos-settings-icon-button flex items-center justify-center rounded-lg transition-colors"
                          style={{ width: 30, height: 30, background: 'var(--border)', color: 'var(--text-3)', flexShrink: 0 }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'var(--border)'; e.currentTarget.style.color = 'var(--text-3)' }}
                          title="Delete item"
                        >
                          <TrashIcon size={11} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Inline edit form */}
                  {editingId === item.id && (
                    <div className="px-3 pb-3 pt-1" style={{ borderTop: '1px solid var(--border)', background: 'var(--card-bg)' }}>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div>
                          <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-3)' }}>NAME</label>
                          <input className="input" style={{ fontSize: 12, height: 32 }} value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-3)' }}>CATEGORY</label>
                          <input className="input" style={{ fontSize: 12, height: 32 }} value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))} list="settings-cats" />
                        </div>
                      </div>
                      <div className="mb-2">
                        <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-3)' }}>DESCRIPTION</label>
                        <input className="input" style={{ fontSize: 12, height: 32 }} value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description…" />
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div>
                          <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-3)' }}>PRICE ($)</label>
                          <input type="number" step="0.01" min="0" className="input" style={{ fontSize: 12, height: 32 }} value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))} />
                        </div>
                        <div className="flex items-end pb-1">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Toggle checked={editForm.available} onChange={() => setEditForm(f => ({ ...f, available: !f.available }))} />
                            <span className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>{editForm.available ? 'Available' : 'Unavailable'}</span>
                          </label>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={cancelEdit} className="flex-1 py-2 rounded-xl text-xs font-semibold" style={{ background: 'var(--border)', color: 'var(--text-2)' }}>
                          Cancel
                        </button>
                        <button
                          onClick={() => saveEdit(item.id)}
                          disabled={saving}
                          className="flex-1 py-2 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1"
                          style={{ background: 'linear-gradient(145deg,#cb4830,#aa301a)', boxShadow: '0 2px 8px rgba(170,48,26,0.3)' }}
                        >
                          {saving ? <SpinnerIcon size={12} /> : <CheckIcon size={12} />}
                          Save
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Tab: Add Item ── */}
        {tab === 'add' && (
          <form onSubmit={addItem} className="flex flex-col flex-1 overflow-y-auto px-5 pt-4 pb-5 gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>Item Name *</label>
                <input ref={nameRef} className="input" style={{ fontSize: 13 }} placeholder="Classic Burger" value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>Category *</label>
                <input className="input" style={{ fontSize: 13 }} placeholder="Burgers" value={addForm.category} onChange={e => setAddForm(f => ({ ...f, category: e.target.value }))} required list="settings-cats" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>Description</label>
              <input className="input" style={{ fontSize: 13 }} placeholder="Short description for the voice agent…" value={addForm.description} onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>Price *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold" style={{ color: 'var(--text-3)' }}>$</span>
                  <input type="number" step="0.01" min="0" className="input" style={{ fontSize: 13, paddingLeft: 22 }} placeholder="12.99" value={addForm.price} onChange={e => setAddForm(f => ({ ...f, price: e.target.value }))} required />
                </div>
              </div>
              <div className="flex items-end pb-1.5">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <Toggle checked={addForm.available} onChange={() => setAddForm(f => ({ ...f, available: !f.available }))} />
                  <span className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>{addForm.available ? 'Available' : 'Unavailable'}</span>
                </label>
              </div>
            </div>

            {/* Category chips for quick selection */}
            {categories.length > 0 && (
              <div>
                <p className="text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>Quick Category</p>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setAddForm(f => ({ ...f, category: cat }))}
                      className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
                      style={{
                        background: addForm.category === cat ? '#aa301a' : 'var(--border)',
                        color: addForm.category === cat ? '#fff' : 'var(--text-2)',
                      }}
                    >
                      {getCategoryIcon(cat)} {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-auto pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all duration-200"
                style={{
                  fontSize: 14,
                  background: 'linear-gradient(145deg,#cb4830,#aa301a)',
                  boxShadow: '0 4px 16px rgba(170,48,26,0.3)',
                  letterSpacing: '-0.01em',
                }}
              >
                {saving ? <SpinnerIcon size={16} /> : <PlusIcon size={15} />}
                {saving ? 'Adding…' : 'Add to Menu'}
              </button>
            </div>
          </form>
        )}

        {/* ── Tab: Paid Extras ── */}
        {tab === 'extras' && (
          <ExtrasManager addons={addons} onRefresh={onRefreshAddons} onToast={onToast} menuCategories={categories} />
        )}
      </div>

      {/* Datalist for category autocomplete */}
      <datalist id="settings-cats">
        {categories.map(cat => <option key={cat} value={cat} />)}
      </datalist>
    </>
  )
}

/* ── Extras Manager (lives inside the settings drawer) ── */
function ExtrasManager({ addons, onRefresh, onToast, menuCategories }) {
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [addForm, setAddForm] = useState({ category: '', name: '', price: '' })
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [seeding, setSeeding] = useState(false)

  // Group addons by category
  const grouped = addons.reduce((acc, a) => {
    if (!acc[a.category]) acc[a.category] = []
    acc[a.category].push(a)
    return acc
  }, {})
  const groupedKeys = Object.keys(grouped).sort()

  const startEdit = (addon) => {
    setEditingId(addon.id)
    setEditForm({ name: addon.name, price: addon.price.toString(), category: addon.category })
  }
  const cancelEdit = () => { setEditingId(null); setEditForm({}) }

  const saveEdit = async (id) => {
    setSaving(true)
    try {
      await addonsApi.update(id, { ...editForm, price: parseFloat(editForm.price) })
      cancelEdit()
      await onRefresh()
      onToast('success', 'Extra updated')
    } catch { onToast('error', 'Failed to update') }
    finally { setSaving(false) }
  }

  const deleteAddon = async (id) => {
    setDeletingId(id)
    try {
      await addonsApi.delete(id)
      await onRefresh()
      onToast('success', 'Extra deleted')
    } catch { onToast('error', 'Failed to delete') }
    finally { setDeletingId(null) }
  }

  const addAddon = async (e) => {
    e.preventDefault()
    if (!addForm.name.trim() || !addForm.category.trim() || !addForm.price) return
    setSaving(true)
    try {
      await addonsApi.create({ ...addForm, price: parseFloat(addForm.price) })
      setAddForm({ category: addForm.category, name: '', price: '' })
      await onRefresh()
      onToast('success', `"${addForm.name}" added`)
    } catch { onToast('error', 'Failed to add extra') }
    finally { setSaving(false) }
  }

  const seedDefaults = async () => {
    setSeeding(true)
    try {
      const r = await addonsApi.seedDefaults()
      await onRefresh()
      onToast('success', r.data.message)
    } catch { onToast('error', 'Seed failed') }
    finally { setSeeding(false) }
  }

  return (
    <div className="flex-1 overflow-y-auto px-5 pb-4 pt-4">
      {/* Empty state */}
      {addons.length === 0 && (
        <div className="flex flex-col items-center py-8 text-center">
          <div style={{ fontSize: 36, marginBottom: 8 }}>💲</div>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-1)' }}>No paid extras yet</p>
          <p className="text-xs mb-4" style={{ color: 'var(--text-3)' }}>Load defaults or add your own below</p>
          <button
            onClick={seedDefaults}
            disabled={seeding}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg,#059669,#047857)' }}
          >
            {seeding ? <SpinnerIcon size={13} /> : '✦'}
            {seeding ? 'Loading…' : 'Load Default Extras'}
          </button>
        </div>
      )}

      {/* Grouped list */}
      {groupedKeys.map(cat => (
        <div key={cat} className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>{cat}</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>
          {grouped[cat].map(addon => (
            <div key={addon.id} className="mb-1.5 rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              {editingId === addon.id ? (
                /* Edit row */
                <div className="flex gap-2 items-center px-3 py-2">
                  <input
                    className="input flex-1"
                    style={{ fontSize: 12, height: 30, padding: '4px 8px' }}
                    value={editForm.name}
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Name"
                  />
                  <div className="relative flex-shrink-0" style={{ width: 72 }}>
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-semibold" style={{ color: 'var(--text-3)' }}>$</span>
                    <input
                      type="number" step="0.01" min="0"
                      className="input w-full"
                      style={{ fontSize: 12, height: 30, padding: '4px 6px 4px 16px' }}
                      value={editForm.price}
                      onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))}
                    />
                  </div>
                  <button onClick={() => saveEdit(addon.id)} disabled={saving} className="flex items-center justify-center rounded-lg flex-shrink-0" style={{ width: 28, height: 28, background: '#059669', color: '#fff' }}>
                    {saving ? <SpinnerIcon size={12} /> : <CheckIcon size={12} />}
                  </button>
                  <button onClick={cancelEdit} className="flex items-center justify-center rounded-lg flex-shrink-0" style={{ width: 28, height: 28, background: 'var(--border)', color: 'var(--text-3)' }}>
                    <XIcon size={12} />
                  </button>
                </div>
              ) : (
                /* Display row */
                <div className="flex items-center gap-2 px-3 py-2">
                  <span className="flex-1 text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>{addon.name}</span>
                  <span className="font-bold text-xs flex-shrink-0" style={{ color: '#059669' }}>+${addon.price.toFixed(2)}</span>
                  <button
                    onClick={() => startEdit(addon)}
                    className="flex items-center justify-center rounded-lg flex-shrink-0"
                    style={{ width: 26, height: 26, background: 'var(--border)', color: 'var(--text-2)' }}
                    title="Edit"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => deleteAddon(addon.id)}
                    disabled={deletingId === addon.id}
                    className="flex items-center justify-center rounded-lg flex-shrink-0"
                    style={{ width: 26, height: 26, background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
                    title="Delete"
                  >
                    {deletingId === addon.id ? <SpinnerIcon size={11} /> : <TrashIcon size={11} />}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}

      {/* Add new extra form */}
      <div className="mt-2 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
        <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--text-3)' }}>Add New Extra</p>
        <form onSubmit={addAddon} className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-3)' }}>Category</label>
              <input
                className="input w-full"
                style={{ fontSize: 12, height: 32, padding: '4px 8px' }}
                list="extras-cats"
                placeholder="e.g. Burgers"
                value={addForm.category}
                onChange={e => setAddForm(f => ({ ...f, category: e.target.value }))}
                required
              />
              <datalist id="extras-cats">
                {[...new Set([...menuCategories, 'All'])].map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-3)' }}>Price</label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-semibold" style={{ color: 'var(--text-3)' }}>$</span>
                <input
                  type="number" step="0.01" min="0"
                  className="input w-full"
                  style={{ fontSize: 12, height: 32, padding: '4px 6px 4px 16px' }}
                  placeholder="1.50"
                  value={addForm.price}
                  onChange={e => setAddForm(f => ({ ...f, price: e.target.value }))}
                  required
                />
              </div>
            </div>
          </div>
          <input
            className="input w-full"
            style={{ fontSize: 12, height: 32, padding: '4px 8px' }}
            placeholder="Extra name (e.g. Add Bacon)"
            value={addForm.name}
            onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
            required
          />
          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 text-xs"
            style={{ background: 'linear-gradient(135deg,#059669,#047857)', boxShadow: '0 2px 8px rgba(5,150,105,0.25)' }}
          >
            {saving ? <SpinnerIcon size={13} /> : <PlusIcon size={13} />}
            {saving ? 'Adding…' : 'Add Extra'}
          </button>
        </form>
      </div>

      {/* Restore defaults button (only when addons exist) */}
      {addons.length > 0 && (
        <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={seedDefaults}
            disabled={seeding}
            className="w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
            style={{ background: 'var(--border)', color: 'var(--text-3)' }}
          >
            {seeding ? <SpinnerIcon size={12} /> : '↺'}
            {seeding ? 'Loading…' : 'Restore Defaults (clears existing)'}
          </button>
          <p className="text-xs text-center mt-1.5" style={{ color: 'var(--text-3)', opacity: 0.6 }}>
            This will only run if you have 0 extras. Delete all first to reset.
          </p>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   Modifier modal (item add-on sheet)
══════════════════════════════════════════════════════════════════ */
function ItemModifierModal({ item, onConfirm, onClose, addons = [] }) {
  const [qty, setQty] = useState(1)
  const [selectedChips, setSelectedChips] = useState([])
  const [selectedAddons, setSelectedAddons] = useState([])   // [{name, price}]
  const [note, setNote] = useState('')

  if (!item) return null

  const getModsForCategory = (cat) => {
    if (!cat) return DEFAULT_MODS
    if (CATEGORY_MODS[cat]) return CATEGORY_MODS[cat]
    const c = cat.toLowerCase()
    if (c.includes('burger') || c.includes('sandwich') || c.includes('sub')) return CATEGORY_MODS.Burgers
    if (c.includes('pizza')) return CATEGORY_MODS.Pizzas
    if (c.includes('pasta') || c.includes('noodle')) return CATEGORY_MODS.Pasta
    if (c.includes('drink') || c.includes('juice') || c.includes('beverage') ||
        c.includes('tea') || c.includes('coffee') || c.includes('karak') ||
        c.includes('smoothie') || c.includes('shake') || c.includes('soda')) return CATEGORY_MODS.Drinks
    if (c.includes('side') || c.includes('fries') || c.includes('chips')) return CATEGORY_MODS.Sides
    if (c.includes('salad') || c.includes('mezze')) return CATEGORY_MODS.Salads
    if (c.includes('dessert') || c.includes('sweet') || c.includes('cake')) return CATEGORY_MODS.Desserts
    if (c.includes('starter') || c.includes('appetizer') || c.includes('snack')) return CATEGORY_MODS.Appetizers
    if (c.includes('grill') || c.includes('bbq') || c.includes('kebab') ||
        c.includes('main') || c.includes('entree') || c.includes('rice') ||
        c.includes('chicken') || c.includes('seafood') || c.includes('fish')) return CATEGORY_MODS.Mains
    if (c.includes('special') || c.includes('chef')) return CATEGORY_MODS.Specials
    return DEFAULT_MODS
  }

  // Match DB addons to this item's category.
  // "All" category extras ALWAYS appear — they're universal dips/sides for any cuisine.
  // Category-specific extras are layered on top.
  const getPaidAddonsForCategory = (cat) => {
    if (!addons.length) return []
    const c = (cat || '').toLowerCase()

    // Universal extras (category = "All") always included
    const universal = addons.filter(a => a.category.toLowerCase() === 'all')

    // 1. Exact category match
    const exact = addons.filter(a => a.category.toLowerCase() === c)
    if (exact.length) return [...exact, ...universal]

    // 2. Keyword match against DB category names
    const matched = addons.filter(a => {
      const ac = a.category.toLowerCase()
      if (ac === 'all') return false  // already in universal
      if (c.includes('burger') || c.includes('sandwich') || c.includes('sub'))
        return ac === 'burgers' || ac.includes('burger')
      if (c.includes('pizza')) return ac === 'pizzas' || ac.includes('pizza')
      if (c.includes('pasta') || c.includes('noodle')) return ac === 'pasta' || ac.includes('pasta')
      if (c.includes('drink') || c.includes('juice') || c.includes('beverage') ||
          c.includes('tea') || c.includes('coffee') || c.includes('karak') ||
          c.includes('smoothie') || c.includes('shake') || c.includes('soda'))
        return ac === 'drinks' || ac.includes('drink') || ac.includes('beverage')
      if (c.includes('side') || c.includes('fries') || c.includes('chips'))
        return ac === 'sides' || ac.includes('side')
      if (c.includes('salad') || c.includes('mezze'))
        return ac === 'salads' || ac.includes('salad')
      if (c.includes('dessert') || c.includes('sweet') || c.includes('cake'))
        return ac === 'desserts' || ac.includes('dessert')
      if (c.includes('starter') || c.includes('appetizer') || c.includes('snack'))
        return ac === 'appetizers' || ac.includes('appetizer') || ac.includes('starter')
      if (c.includes('grill') || c.includes('bbq') || c.includes('kebab') ||
          c.includes('main') || c.includes('entree') || c.includes('rice') ||
          c.includes('chicken') || c.includes('seafood') || c.includes('fish'))
        return ac === 'mains' || ac.includes('main') || ac.includes('grill')
      if (c.includes('special') || c.includes('chef'))
        return ac === 'specials' || ac.includes('special')
      return false
    })
    if (matched.length) return [...matched, ...universal]

    // 3. No category match — show only universal extras (good for any cuisine)
    if (universal.length) return universal

    // 4. Last resort: first 4 from DB
    return addons.slice(0, 4)
  }

  const chips = getModsForCategory(item.category)
  const paidOptions = getPaidAddonsForCategory(item.category)

  const toggleChip = (chip) =>
    setSelectedChips(prev => prev.includes(chip) ? prev.filter(c => c !== chip) : [...prev, chip])

  const toggleAddon = (addon) =>
    setSelectedAddons(prev =>
      prev.find(a => a.name === addon.name)
        ? prev.filter(a => a.name !== addon.name)
        : [...prev, addon]
    )

  const addonTotal = selectedAddons.reduce((s, a) => s + a.price, 0)

  const buildModification = () => {
    const parts = [...selectedChips]
    if (selectedAddons.length > 0) {
      const addonNames = selectedAddons.map(a => a.name).join(', ')
      parts.push(`Extras: ${addonNames} (+$${addonTotal.toFixed(2)})`)
    }
    if (note.trim()) parts.push(note.trim())
    return parts.join(', ')
  }

  const lineTotal = (item.price + addonTotal) * qty

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ animation: 'fadeIn 0.15s ease' }}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col" style={{ background: 'var(--card-bg)', boxShadow: '0 32px 80px rgba(0,0,0,0.35)', animation: 'fadeInUp 0.3s cubic-bezier(0.16,1,0.3,1)', maxHeight: '92vh' }}>

        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)' }} />
        </div>

        <div className="flex items-start justify-between px-5 pt-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center rounded-2xl flex-shrink-0" style={{ width: 52, height: 52, background: `${getCategoryColor(item.category)}18`, fontSize: 26 }}>
              {getItemIcon(item.name, item.category)}
            </div>
            <div>
              <h3 className="font-bold" style={{ fontSize: 17, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>{item.name}</h3>
              {item.description && <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{item.description}</p>}
              <p className="font-bold mt-1" style={{ fontSize: 15, color: '#aa301a' }}>${item.price.toFixed(2)}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full flex-shrink-0" style={{ width: 30, height: 30, background: 'var(--border)', color: 'var(--text-3)', display: 'inline-grid', placeItems: 'center', padding: 0, lineHeight: 0 }}>
            <XIcon size={14} />
          </button>
        </div>

        <div style={{ height: 1, background: 'var(--border)' }} />

        <div className="overflow-y-auto flex-1 px-5 pb-2">
          {/* Quantity */}
          <div className="flex items-center justify-between py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>Quantity</span>
            <div className="flex items-center gap-3">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="flex items-center justify-center rounded-xl font-bold" style={{ width: 36, height: 36, background: qty === 1 ? 'var(--border)' : 'rgba(170,48,26,0.1)', color: qty === 1 ? 'var(--text-3)' : '#aa301a', fontSize: 18 }}>−</button>
              <span className="font-bold text-lg w-6 text-center" style={{ color: 'var(--text-1)' }}>{qty}</span>
              <button onClick={() => setQty(q => q + 1)} className="flex items-center justify-center rounded-xl font-bold" style={{ width: 36, height: 36, background: '#aa301a', color: '#fff', fontSize: 18 }}>+</button>
            </div>
          </div>

          {/* Free modifier chips */}
          <div className="py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--text-3)' }}>Modifications</p>
            <div className="flex flex-wrap gap-2">
              {chips.map(chip => {
                const active = selectedChips.includes(chip)
                return (
                  <button key={chip} onClick={() => toggleChip(chip)} className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150" style={{ background: active ? '#aa301a' : 'var(--border)', color: active ? '#fff' : 'var(--text-2)', border: active ? '1.5px solid #aa301a' : '1.5px solid transparent', boxShadow: active ? '0 2px 6px rgba(170,48,26,0.2)' : 'none', transform: active ? 'scale(1.03)' : 'scale(1)' }}>
                    {active && <span className="mr-1">✓</span>}{chip}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Paid extras */}
          <div className="py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>Paid Extras</p>
              {selectedAddons.length > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(5,150,105,0.12)', color: '#059669' }}>
                  +${addonTotal.toFixed(2)}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {paidOptions.map(addon => {
                const active = !!selectedAddons.find(a => a.name === addon.name)
                return (
                  <button
                    key={addon.name}
                    onClick={() => toggleAddon(addon)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150"
                    style={{
                      background: active ? '#059669' : 'var(--border)',
                      color: active ? '#fff' : 'var(--text-2)',
                      border: active ? '1.5px solid #059669' : '1.5px solid transparent',
                      boxShadow: active ? '0 2px 6px rgba(5,150,105,0.25)' : 'none',
                      transform: active ? 'scale(1.03)' : 'scale(1)',
                    }}
                  >
                    {active && <span>✓</span>}
                    {addon.name}
                    <span style={{ opacity: active ? 0.85 : 0.6, fontWeight: 700 }}>+${addon.price.toFixed(2)}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Custom note */}
          <div className="py-4">
            <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-3)' }}>Custom Note</p>
            <textarea className="input w-full resize-none" style={{ fontSize: 13, height: 68, padding: '10px 12px', lineHeight: 1.5 }} placeholder="e.g. allergy info, cooking preference…" value={note} onChange={e => setNote(e.target.value)} />
          </div>
        </div>

        <div className="px-5 pt-3 pb-5" style={{ borderTop: '1px solid var(--border)' }}>
          {(selectedChips.length > 0 || selectedAddons.length > 0 || note.trim()) && (
            <p className="text-xs mb-2 truncate" style={{ color: 'var(--text-3)' }}>
              <span style={{ color: 'var(--text-2)', fontWeight: 600 }}>Mods: </span>{buildModification()}
            </p>
          )}
          {/* Price breakdown when extras are added */}
          {selectedAddons.length > 0 && (
            <div className="flex items-center justify-between mb-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(5,150,105,0.07)', border: '1px solid rgba(5,150,105,0.15)' }}>
              <div className="text-xs" style={{ color: 'var(--text-3)' }}>
                <span>${item.price.toFixed(2)} base</span>
                <span className="mx-1" style={{ color: '#059669' }}>+ ${addonTotal.toFixed(2)} extras</span>
                {qty > 1 && <span>× {qty}</span>}
              </div>
              <span className="text-sm font-bold" style={{ color: '#059669' }}>${lineTotal.toFixed(2)}</span>
            </div>
          )}
          <button onClick={() => onConfirm(item, qty, buildModification(), addonTotal)} className="w-full rounded-2xl font-bold text-white flex items-center justify-center gap-2" style={{ padding: '14px 16px', fontSize: 15, background: 'linear-gradient(145deg,#cb4830,#aa301a)', boxShadow: '0 4px 16px rgba(170,48,26,0.35)', letterSpacing: '-0.01em' }} onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 24px rgba(170,48,26,0.5)'} onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(170,48,26,0.35)'}>
            <CheckIcon size={15} />
            Add {qty > 1 ? `${qty}×` : ''} to Order · ${lineTotal.toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Item tile ── */
function ItemTile({ item, qty, onTap, onDelete }) {
  const [hovered, setHovered] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const catColor = getCategoryColor(item.category)

  const handleDelete = async (e) => {
    e.stopPropagation()
    setDeleting(true)
    await onDelete(item.id)
    setDeleting(false)
    setConfirmDel(false)
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setConfirmDel(false) }}
    >
      <button
        onClick={() => !confirmDel && item.available && onTap(item)}
        disabled={!item.available || confirmDel}
        className="relative w-full text-left flex flex-col transition-all duration-150 active:scale-95 overflow-hidden"
        style={{
          background: 'var(--card-bg)',
          border: qty > 0 ? `2px solid ${catColor}` : '1px solid var(--border)',
          borderRadius: 16,
          boxShadow: qty > 0
            ? `0 0 0 3px ${catColor}1a, 0 4px 14px rgba(15,23,42,0.08)`
            : 'var(--shadow-xs)',
          cursor: item.available && !confirmDel ? 'pointer' : 'not-allowed',
          opacity: item.available ? 1 : 0.38,
          minHeight: 118,
          transform: hovered && item.available && !confirmDel ? 'translateY(-2px)' : 'translateY(0)',
        }}
      >
        {/* Colored top stripe — the category's unique color */}
        <div style={{ height: 3, background: catColor, flexShrink: 0, borderRadius: '16px 16px 0 0' }} />

        <div className="flex flex-col flex-1" style={{ padding: '12px 12px 11px' }}>
          {/* Icon + qty badge row */}
          <div className="flex items-start justify-between mb-1.5">
            <div
              className="flex items-center justify-center rounded-xl flex-shrink-0"
              style={{ width: 36, height: 36, background: `${catColor}15`, fontSize: 18 }}
            >
              {getItemIcon(item.name, item.category)}
            </div>
            {qty > 0 && !confirmDel && (
              <div
                className="flex items-center justify-center font-bold text-white rounded-full flex-shrink-0"
                style={{ width: 22, height: 22, fontSize: 11, background: catColor, lineHeight: 1 }}
              >
                {qty}
              </div>
            )}
          </div>

          {/* Name */}
          <p
            className="font-semibold leading-snug flex-1"
            style={{ fontSize: 12, color: 'var(--text-1)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
          >
            {item.name}
          </p>

          {/* Category pill + price row */}
          <div className="flex items-center justify-between mt-2 gap-1">
            <span
              className="text-xs font-semibold px-1.5 py-0.5 rounded-md truncate"
              style={{ background: `${catColor}15`, color: catColor, maxWidth: '55%', fontSize: 10 }}
            >
              {item.category}
            </span>
            <p className="font-bold flex-shrink-0" style={{ fontSize: 13, color: catColor }}>
              ${item.price.toFixed(2)}
            </p>
          </div>

          {!item.available && (
            <span className="text-xs font-bold mt-1" style={{ color: '#ef4444' }}>86'd</span>
          )}
        </div>
      </button>

      {/* Delete button — appears on hover */}
      {hovered && !confirmDel && item.available && (
        <button
          onClick={e => { e.stopPropagation(); setConfirmDel(true) }}
          className="absolute top-2 right-2 flex items-center justify-center rounded-lg transition-all"
          style={{ width: 22, height: 22, background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', zIndex: 2 }}
          title="Delete item"
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.22)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
        >
          <TrashIcon size={10} />
        </button>
      )}

      {/* Confirm delete overlay */}
      {confirmDel && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10"
          style={{ background: 'rgba(239,68,68,0.93)', backdropFilter: 'blur(2px)', borderRadius: 16 }}
        >
          <p className="text-xs font-bold text-white text-center px-2 leading-tight">Delete<br/>{item.name}?</p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center justify-center rounded-lg font-bold"
              style={{ width: 32, height: 32, background: '#fff', color: '#ef4444', fontSize: 13 }}
            >
              {deleting ? <SpinnerIcon size={13} /> : <CheckIcon size={13} />}
            </button>
            <button
              onClick={e => { e.stopPropagation(); setConfirmDel(false) }}
              className="flex items-center justify-center rounded-lg"
              style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.25)', color: '#fff' }}
            >
              <XIcon size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Cart line item ── */
function CartItem({ item, onQtyChange }) {
  return (
    <div className="py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => onQtyChange(item.lineId, -1)} className="flex items-center justify-center rounded-lg font-bold" style={{ width: 24, height: 24, background: 'var(--border)', color: 'var(--text-2)', fontSize: 15 }} onMouseEnter={e => e.currentTarget.style.background = '#d2d2d7'} onMouseLeave={e => e.currentTarget.style.background = 'var(--border)'}>−</button>
          <span className="font-bold text-sm text-center" style={{ width: 20, color: 'var(--text-1)' }}>{item.quantity}</span>
          <button onClick={() => onQtyChange(item.lineId, 1)} className="flex items-center justify-center rounded-lg font-bold" style={{ width: 24, height: 24, background: '#aa301a', color: '#fff', fontSize: 15 }} onMouseEnter={e => e.currentTarget.style.background = '#cb4830'} onMouseLeave={e => e.currentTarget.style.background = '#aa301a'}>+</button>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-1)' }}>{item.name}</p>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>${item.price.toFixed(2)} ea.</p>
        </div>
        <p className="font-bold text-sm flex-shrink-0" style={{ color: 'var(--text-1)' }}>${(item.price * item.quantity).toFixed(2)}</p>
      </div>
      {item.modification && (
        <p className="mt-1 text-xs truncate px-2 py-0.5 rounded-md" style={{ color: '#aa301a', background: 'rgba(170,48,26,0.07)', marginLeft: 60 }}>{item.modification}</p>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   Charge / Payment modal  (Clover-style)
══════════════════════════════════════════════════════════════════ */
function ChargeModal({ total, onConfirm, onClose, loading }) {
  const [method, setMethod] = useState('card')
  const [tender, setTender] = useState('')

  const tenderNum = parseFloat(tender) || 0
  const change    = tenderNum - total
  const canConfirm = method === 'card' || tenderNum >= total

  // Smart quick-tender suggestions (exact, next $5, next $10, next $20)
  const quickTenders = [...new Set([
    Math.ceil(total),
    Math.ceil(total / 5)  * 5,
    Math.ceil(total / 10) * 10,
    Math.ceil(total / 20) * 20,
  ])].filter(v => v >= total).slice(0, 4)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ animation: 'fadeIn 0.15s ease' }}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.52)', backdropFilter: 'blur(6px)' }} onClick={onClose} />
      <div
        className="relative flex flex-col overflow-hidden"
        style={{ width: 380, borderRadius: 28, background: 'var(--card-bg)', boxShadow: '0 40px 100px rgba(0,0,0,0.4)', animation: 'fadeInUp 0.3s cubic-bezier(0.16,1,0.3,1)' }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-3)' }}>Charge</p>
            <p className="font-bold" style={{ fontSize: 36, color: 'var(--text-1)', letterSpacing: '-0.04em', lineHeight: 1 }}>
              ${total.toFixed(2)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full flex-shrink-0"
            style={{ width: 32, height: 32, background: 'var(--border)', color: 'var(--text-3)', display: 'inline-grid', placeItems: 'center', padding: 0, lineHeight: 0 }}
          >
            <XIcon size={14} />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          {/* Payment method selector */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>Payment Method</p>
            <div className="grid grid-cols-2 gap-2">
              {[['card', '💳', 'Card'], ['cash', '💵', 'Cash']].map(([val, icon, label]) => (
                <button
                  key={val}
                  onClick={() => setMethod(val)}
                  className="py-3 rounded-2xl font-semibold flex flex-col items-center gap-1 transition-all duration-150"
                  style={{
                    background: method === val ? '#aa301a' : 'var(--border)',
                    color: method === val ? '#fff' : 'var(--text-2)',
                    fontSize: 13,
                    border: method === val ? '2px solid #aa301a' : '2px solid transparent',
                    boxShadow: method === val ? '0 4px 14px rgba(170,48,26,0.28)' : 'none',
                  }}
                >
                  <span style={{ fontSize: 22 }}>{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Cash tender section */}
          {method === 'cash' && (
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>Tender Amount</p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-xl" style={{ color: 'var(--text-2)' }}>$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="input w-full"
                    style={{ paddingLeft: 30, fontSize: 22, height: 56, fontWeight: 700, letterSpacing: '-0.02em' }}
                    placeholder={total.toFixed(2)}
                    value={tender}
                    onChange={e => setTender(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              {/* Quick tender buttons */}
              <div className="flex gap-2">
                {quickTenders.map(amt => (
                  <button
                    key={amt}
                    onClick={() => setTender(amt.toString())}
                    className="flex-1 py-2 rounded-xl font-bold text-sm transition-all"
                    style={{
                      background: tenderNum === amt ? '#aa301a' : 'var(--border)',
                      color: tenderNum === amt ? '#fff' : 'var(--text-1)',
                    }}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
              {/* Change or short */}
              {tenderNum >= total && (
                <div className="flex items-center justify-between px-4 py-3 rounded-2xl" style={{ background: 'rgba(52,199,89,0.1)', border: '1px solid rgba(52,199,89,0.25)' }}>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-2)' }}>Change Due</span>
                  <span className="text-2xl font-bold" style={{ color: '#34c759', letterSpacing: '-0.03em' }}>${change.toFixed(2)}</span>
                </div>
              )}
              {tender && tenderNum < total && (
                <div className="flex items-center justify-between px-4 py-3 rounded-2xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <span className="text-sm font-semibold" style={{ color: '#ef4444' }}>Short by</span>
                  <span className="text-xl font-bold" style={{ color: '#ef4444' }}>${Math.abs(change).toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {/* Confirm button */}
          <button
            onClick={() => onConfirm(method)}
            disabled={!canConfirm || loading}
            className="w-full rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all duration-150"
            style={{
              padding: '16px',
              fontSize: 16,
              background: canConfirm ? 'linear-gradient(145deg,#cb4830,#aa301a)' : 'var(--border)',
              color: canConfirm ? '#fff' : 'var(--text-3)',
              boxShadow: canConfirm ? '0 4px 18px rgba(170,48,26,0.38)' : 'none',
              cursor: !canConfirm ? 'not-allowed' : 'pointer',
              letterSpacing: '-0.01em',
            }}
            onMouseEnter={e => { if (canConfirm) e.currentTarget.style.boxShadow = '0 6px 28px rgba(170,48,26,0.55)' }}
            onMouseLeave={e => { if (canConfirm) e.currentTarget.style.boxShadow = '0 4px 18px rgba(170,48,26,0.38)' }}
          >
            {loading
              ? <><SpinnerIcon size={16} /> Processing…</>
              : method === 'cash'
                ? `💵 Collect $${tenderNum >= total ? tenderNum.toFixed(2) : total.toFixed(2)}`
                : `💳 Charge $${total.toFixed(2)}`
            }
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   Delivery Address Input — OpenStreetMap Nominatim autocomplete
   + Haversine delivery range check (no API key needed)
══════════════════════════════════════════════════════════════════ */
function DeliveryAddressInput({ value, onChange, restaurantCoords, restaurantRadius, onRangeChange }) {
  const debounceRef = useRef(null)
  const dropdownRef = useRef(null)
  const inputRef = useRef(null)
  const [suggestions, setSuggestions] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [searching, setSearching] = useState(false)
  const [rangeStatus, setRangeStatus] = useState('idle') // 'idle' | 'in' | 'out'
  const [distanceMiles, setDistanceMiles] = useState(null)
  // Refs so the async callback always reads current values
  const coordsRef = useRef(restaurantCoords)
  const radiusRef = useRef(restaurantRadius)
  useEffect(() => { coordsRef.current = restaurantCoords }, [restaurantCoords])
  useEffect(() => { radiusRef.current = restaurantRadius }, [restaurantRadius])

  // Reset when parent clears the address after order is placed
  useEffect(() => {
    if (!value) {
      setRangeStatus('idle')
      setDistanceMiles(null)
      onRangeChange?.('idle')
      setSuggestions([])
      setShowDropdown(false)
    }
  }, [value, onRangeChange])

  const updateRange = (status, distance = null) => {
    setRangeStatus(status)
    setDistanceMiles(distance)
    onRangeChange?.(status)
  }

  const validateAddress = async (address) => {
    if (!coordsRef.current || address.trim().length < 3) return
    setSearching(true)
    const coords = await geocodeAddress(address)
    setSearching(false)
    if (!coords) {
      updateRange('idle', null)
      return
    }
    const distMi = haversineKm(
      coordsRef.current.lat, coordsRef.current.lng, coords.lat, coords.lng
    ) * 0.621371
    updateRange(distMi <= (radiusRef.current || 5) ? 'in' : 'out', distMi)
  }

  // Close dropdown on click-outside
  useEffect(() => {
    const handler = (e) => {
      if (
        !dropdownRef.current?.contains(e.target) &&
        !inputRef.current?.contains(e.target)
      ) setShowDropdown(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleInputChange = (e) => {
    const q = e.target.value
    onChange(q)
    updateRange('idle', null)
    clearTimeout(debounceRef.current)
    if (q.length < 3) { setSuggestions([]); setShowDropdown(false); return }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      const results = await searchAddresses(q)
      setSuggestions(results)
      setShowDropdown(results.length > 0)
      setSearching(false)
    }, 500)
  }

  const handleSelect = (result) => {
    const addr = result.display_name
    onChange(addr)
    setShowDropdown(false)
    setSuggestions([])
    if (coordsRef.current) {
      const lat = parseFloat(result.lat)
      const lng = parseFloat(result.lon)
      const distMi = haversineKm(
        coordsRef.current.lat, coordsRef.current.lng, lat, lng
      ) * 0.621371
      updateRange(distMi <= (radiusRef.current || 5) ? 'in' : 'out', distMi)
    }
  }

  return (
    <div className="mt-2" style={{ position: 'relative' }}>
      {/* Input row */}
      <div className="relative">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2"
          style={{ fontSize: 12, color: 'var(--text-3)', pointerEvents: 'none' }}>
          🛵
        </span>
        <input
          ref={inputRef}
          className="input w-full"
          style={{ fontSize: 12, height: 32, paddingLeft: 28, paddingRight: 28 }}
          placeholder="Delivery address *"
          value={value}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          onBlur={() => {
            if (rangeStatus === 'idle' && value.trim().length >= 3) {
              validateAddress(value)
            }
          }}
          autoComplete="off"
        />
        {/* Right-side status icon */}
        {searching && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2"
            style={{ fontSize: 10, color: 'var(--text-3)', animation: 'spin 1s linear infinite' }}>⏳</span>
        )}
        {!searching && rangeStatus === 'in' && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2" style={{ fontSize: 13 }}>✅</span>
        )}
        {!searching && rangeStatus === 'out' && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2" style={{ fontSize: 13 }}>🚫</span>
        )}
      </div>

      {/* Autocomplete dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute', left: 0, right: 0, top: 'calc(100% + 2px)',
            zIndex: 9999,
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            overflow: 'hidden',
          }}
        >
          {suggestions.map((r, i) => (
            <button
              key={i}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(r) }}
              style={{
                width: '100%', textAlign: 'left',
                padding: '7px 10px',
                fontSize: 11,
                color: 'var(--text-1)',
                background: 'transparent',
                border: 'none',
                borderBottom: i < suggestions.length - 1 ? '1px solid var(--border)' : 'none',
                cursor: 'pointer',
                display: 'flex', alignItems: 'flex-start', gap: 6,
                lineHeight: 1.35,
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ flexShrink: 0, marginTop: 1 }}>📍</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.display_name}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Range badge */}
      {rangeStatus === 'in' && distanceMiles !== null && (
        <div className="mt-1 px-1" style={{ fontSize: 11, color: '#16a34a', fontWeight: 500 }}>
          ✓ {distanceMiles.toFixed(1)} mi — within delivery range
        </div>
      )}
      {rangeStatus === 'out' && distanceMiles !== null && (
        <div className="mt-1 px-1" style={{ fontSize: 11, color: '#dc2626', fontWeight: 500 }}>
          ✗ {distanceMiles.toFixed(1)} mi — outside {radiusRef.current} mi radius
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════════ */

export default function POSOrder() {
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('')
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryRangeStatus, setDeliveryRangeStatus] = useState('idle')
  const [notes, setNotes] = useState('')
  const [orderType, setOrderType] = useState('dine_in')
  const [showCharge, setShowCharge] = useState(false)
  const [placing, setPlacing] = useState(false)
  const [toast, setToast] = useState(null)
  const [addons, setAddons] = useState([])
  const [restaurantAddressStr, setRestaurantAddressStr] = useState('')
  const [restaurantCoords, setRestaurantCoords] = useState(null)
  const [restaurantRadius, setRestaurantRadius] = useState(5)      // miles
  const [restaurantDeliveryFee, setRestaurantDeliveryFee] = useState(0)
  const seedingRef = useRef(false)  // prevents React StrictMode double-seed

  const loadMenu = () =>
    menuApi.list()
      .then(r => setMenuItems(unwrapList(r)))
      .catch(() => {})
      .finally(() => setLoading(false))

  const loadAddons = () =>
    addonsApi.list()
      .then(r => setAddons(unwrapList(r)))
      .catch(() => {})

  // On mount: load menu + addons + restaurant settings
  useEffect(() => {
    loadMenu()
    addonsApi.list().then(r => {
      const list = unwrapList(r)
      setAddons(list)
      if (list.length === 0 && !seedingRef.current) {
        seedingRef.current = true
        addonsApi.seedDefaults()
          .then(() => addonsApi.list().then(r2 => setAddons(unwrapList(r2))))
          .catch(() => {})
      }
    }).catch(() => {})
    restaurantApi.get().then(r => {
      const data = unwrap(r) || {}
      setRestaurantRadius(data.delivery_radius_miles ?? 5)
      setRestaurantDeliveryFee(data.delivery_fee ?? 0)
      if (data.address) setRestaurantAddressStr(data.address)
    }).catch(() => {})
  }, [])

  // Geocode restaurant address via Nominatim (runs once address is loaded)
  useEffect(() => {
    if (!restaurantAddressStr) return
    geocodeAddress(restaurantAddressStr).then(coords => {
      if (coords) setRestaurantCoords(coords)
    })
  }, [restaurantAddressStr])

  const categories = ['All', ...new Set(menuItems.map(i => i.category))]
  const availableCount = menuItems.filter(item => item.available).length
  const noCategorySelected = !activeCategory

  const filtered = menuItems.filter(item => {
    if (!activeCategory) return false
    const matchCat = activeCategory === 'All' || item.category === activeCategory
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const getCartQty = (id) => cart.filter(c => c.id === id).reduce((s, c) => s + c.quantity, 0)

  const handleDeleteItem = async (id) => {
    try {
      await menuApi.delete(id)
      // Remove from cart too if it's there
      setCart(prev => prev.filter(c => c.id !== id))
      await loadMenu()
      showToast('success', 'Item deleted')
    } catch {
      showToast('error', 'Failed to delete item')
    }
  }

  const handleConfirmAddOn = (item, qty, modification, addonPrice = 0) => {
    const unitPrice = item.price + addonPrice
    setCart(prev => [...prev, { lineId: `${item.id}_${Date.now()}`, id: item.id, name: item.name, price: unitPrice, quantity: qty, modification: modification || null }])
    setSelectedItem(null)
  }

  const changeQty = (lineId, delta) =>
    setCart(prev => prev.map(c => c.lineId === lineId ? { ...c, quantity: c.quantity + delta } : c).filter(c => c.quantity > 0))

  const clearCart = () => { setCart([]); setCustomerName(''); setCustomerPhone(''); setDeliveryAddress(''); setDeliveryRangeStatus('idle'); setNotes('') }

  const subtotal = cart.reduce((s, c) => s + c.price * c.quantity, 0)
  const tax = subtotal * TAX_RATE
  const deliveryFee = orderType === 'delivery' ? restaurantDeliveryFee : 0
  const total = subtotal + tax + deliveryFee
  const totalQty = cart.reduce((s, c) => s + c.quantity, 0)

  const placeOrder = async (paymentMethod = 'cash') => {
    if (!cart.length) return
    if (orderType === 'delivery' && restaurantCoords && deliveryRangeStatus !== 'in') {
      showToast('error', deliveryRangeStatus === 'out' ? 'Delivery address is outside your range' : 'Validate the delivery address first')
      return
    }
    setPlacing(true)
    try {
      await ordersApi.create({
        customer_name: customerName || 'Walk-in',
        customer_phone: customerPhone || null,
        items: cart.map(c => ({ name: c.name, quantity: c.quantity, price: c.price, modification: c.modification || null })),
        total,
        pay_method: paymentMethod,
        order_type: orderType,
        delivery_address: orderType === 'delivery' ? (deliveryAddress.trim() || null) : null,
        special_instructions: notes || null,
      })
      showToast('success', 'Order placed!')
      clearCart()
      setShowCharge(false)
    } catch { showToast('error', 'Failed to place order') }
    finally { setPlacing(false) }
  }

  const showToast = (type, text) => { setToast({ type, text }); setTimeout(() => setToast(null), 3000) }

  return (
    <Layout>
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2" style={{ background: toast.type === 'success' ? '#34c759' : '#ff3b30', color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.25)', animation: 'fadeInUp 0.25s ease' }}>
          {toast.type === 'success' ? <CheckIcon size={14} /> : <XIcon size={14} />}
          {toast.text}
        </div>
      )}

      {/* Modifier modal */}
      {selectedItem && (
        <ItemModifierModal item={selectedItem} onConfirm={handleConfirmAddOn} onClose={() => setSelectedItem(null)} addons={addons} />
      )}

      {/* Settings panel */}
      <POSSettingsPanel
        open={showSettings}
        items={menuItems}
        addons={addons}
        onClose={() => setShowSettings(false)}
        onRefresh={loadMenu}
        onRefreshAddons={loadAddons}
        onToast={showToast}
      />

      {/* Charge / payment modal */}
      {showCharge && (
        <ChargeModal
          total={total}
          loading={placing}
          onConfirm={placeOrder}
          onClose={() => setShowCharge(false)}
        />
      )}

      {/* ── POS workspace ── */}
      <div className="pos-workspace">
        <div className="pos-page-header">
          <div className="pos-page-header-copy">
            <div className="pos-page-header-icon">
              <OrdersIcon size={21} />
            </div>
            <div>
              <h1 className="pos-page-header-title">POS Terminal</h1>
              <p className="pos-page-header-subtitle">
                {menuItems.length} menu items · {totalQty === 0 ? 'no active ticket' : `${totalQty} item${totalQty !== 1 ? 's' : ''} on ticket`}
              </p>
            </div>
          </div>
          <div className="pos-page-header-actions">
            <button
              onClick={() => setShowSettings(true)}
              className="btn-secondary"
              style={{ padding: '10px 16px', borderRadius: 12 }}
            >
              <SettingsIcon size={14} />
              Settings
            </button>
            <button
              onClick={clearCart}
              disabled={cart.length === 0}
              className="btn-primary"
              style={{ padding: '11px 18px', borderRadius: 12 }}
            >
              <PlusIcon size={14} />
              New Order
            </button>
          </div>
        </div>

        {/* Panel 1: Item grid */}
        <div className="pos-main-column">
          <div className="pos-overview-row" style={{ animation: 'fadeInUp 0.3s ease 0.03s both' }}>
            {[
              ['Menu Items', menuItems.length],
              ['Available', availableCount],
              ['Categories', Math.max(categories.length - 1, 0)],
              ['Ticket Items', totalQty],
            ].map(([label, value]) => (
              <div key={label} className="pos-summary-card">
                <div className="pos-summary-label">{label}</div>
                <div className="pos-summary-value">{value}</div>
              </div>
            ))}
          </div>

          <div className="pos-control-card" style={{ animation: 'fadeInUp 0.3s ease 0.06s both' }}>
            <div className="pos-control-header">
              <div>
                <h2 className="pos-section-title">{activeCategory ? (activeCategory === 'All' ? 'All Items' : activeCategory) : 'All Items'}</h2>
                <p className="pos-section-subtitle">
                  {activeCategory
                    ? `${filtered.filter(i => i.available).length} available · ${filtered.length - filtered.filter(i => i.available).length > 0 ? `${filtered.length - filtered.filter(i => i.available).length} unavailable` : 'tap an item to add'}`
                    : 'Select All or a category to view items'}
                </p>
              </div>
              <div className="pos-search-wrap">
                <SearchIcon size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
                <input
                  className="input"
                  style={{ paddingLeft: 30, fontSize: 13, height: 36 }}
                  placeholder="Search menu..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="pos-category-strip">
              <div className="pos-category-label">Categories</div>
              <div className="pos-category-scroll">
                {categories.map(cat => {
                  const active = activeCategory === cat
                  const count = cat === 'All' ? menuItems.length : menuItems.filter(i => i.category === cat).length
                  const color = cat === 'All' ? '#aa301a' : getCategoryColor(cat)
                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        setActiveCategory(cat)
                      }}
                      title={cat}
                      className="pos-category-chip"
                      style={{
                        background: active ? `${color}10` : 'var(--surface-2)',
                        borderColor: active ? `${color}5c` : 'transparent',
                        color: active ? color : 'var(--text-2)',
                        boxShadow: active ? `0 8px 18px ${color}14` : 'none',
                      }}
                    >
                      <span
                        className="pos-category-chip-icon"
                        style={{ background: active ? `${color}18` : 'var(--card-bg)' }}
                      >
                        {cat === 'All' ? '🍴' : getCategoryIcon(cat)}
                      </span>
                      <span className="pos-category-chip-name">{cat}</span>
                      <span
                        className="pos-category-chip-count"
                        style={{
                          background: active ? `${color}18` : 'rgba(29,29,31,0.06)',
                          color: active ? color : 'var(--text-3)',
                        }}
                      >
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className={`pos-items-card ${noCategorySelected ? 'pos-no-category-selected' : ''}`} style={{ animation: 'fadeInUp 0.3s ease 0.09s both' }}>
            {noCategorySelected && !loading && (
              <div className="pos-mobile-all-placeholder">
                <div className="pos-mobile-all-placeholder-icon">🍴</div>
                <div>
                  <h3>Choose what to show</h3>
                  <p>Tap All to open every item, or choose a category above.</p>
                </div>
              </div>
            )}
            {loading ? (
              <div className="flex items-center justify-center py-20"><SpinnerIcon size={24} /></div>
            ) : noCategorySelected ? null : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div style={{ fontSize: 40, marginBottom: 8 }}>🔍</div>
                <p className="font-semibold text-sm" style={{ color: 'var(--text-2)' }}>No items found</p>
                <button onClick={() => setShowSettings(true)} className="mt-3 text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(170,48,26,0.08)', color: '#aa301a' }}>Open Settings to add items</button>
              </div>
            ) : (
              <div className="pos-item-grid">
                {filtered.map(item => (
                  <ItemTile key={item.id} item={item} qty={getCartQty(item.id)} onTap={setSelectedItem} onDelete={handleDeleteItem} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panel 3: Order ticket */}
        <div className="pos-ticket-card">
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
            <div>
              <h2 className="font-bold" style={{ fontSize: 15, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>Current Order</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{totalQty === 0 ? 'Tap items to add' : `${totalQty} item${totalQty !== 1 ? 's' : ''}`}</p>
            </div>
            {cart.length > 0 && (
              <button onClick={clearCart} className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}>Clear</button>
            )}
          </div>

          {/* Order type selector */}
          <div className="px-3 pt-2.5 pb-2 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex gap-1">
              {[
                ['dine_in',  '🍽️',  'Dine In'],
                ['takeout',  '🥡',  'Takeout'],
                ['delivery', '🛵',  'Delivery'],
              ].map(([val, icon, label]) => (
                <button
                  key={val}
                  onClick={() => setOrderType(val)}
                  className="flex-1 rounded-xl text-xs font-semibold transition-all duration-150 inline-flex items-center justify-center gap-1.5"
                  style={{
                    minHeight: 38,
                    background: orderType === val ? '#aa301a' : 'var(--border)',
                    color: orderType === val ? '#fff' : 'var(--text-2)',
                    boxShadow: orderType === val ? '0 2px 8px rgba(170,48,26,0.25)' : 'none',
                  }}
                >
                  <span style={{ fontSize: 13 }}>{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 py-2.5 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
            <input
              className="input mb-2"
              style={{
                fontSize: 12, height: 32,
                borderColor: orderType === 'delivery' && !customerName.trim() ? 'rgba(239,68,68,0.5)' : undefined,
              }}
              placeholder={orderType === 'delivery' ? 'Customer name *' : 'Customer name (optional)'}
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
            />
            <input
              className="input"
              style={{
                fontSize: 12, height: 32,
                borderColor: orderType === 'delivery' && !customerPhone.trim() ? 'rgba(239,68,68,0.5)' : undefined,
              }}
              placeholder={orderType === 'delivery' ? 'Phone *' : 'Phone (optional)'}
              value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)}
            />

            {/* Delivery address — only shown when order type is Delivery */}
            {orderType === 'delivery' && (
              <DeliveryAddressInput
                value={deliveryAddress}
                onChange={setDeliveryAddress}
                restaurantCoords={restaurantCoords}
                restaurantRadius={restaurantRadius}
                onRangeChange={setDeliveryRangeStatus}
              />
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <div style={{ fontSize: 36, marginBottom: 8, opacity: 0.4 }}>🧾</div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-3)' }}>No items added yet</p>
              </div>
            ) : cart.map(item => <CartItem key={item.lineId} item={item} onQtyChange={changeQty} />)}
          </div>

          <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
            <textarea className="input w-full resize-none" style={{ fontSize: 12, height: 50, padding: '8px 10px', lineHeight: 1.4 }} placeholder="Order notes..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
            <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--text-3)' }}><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-3)' }}><span>Tax (8%)</span><span>${tax.toFixed(2)}</span></div>
            {deliveryFee > 0 && (
              <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-3)' }}>
                <span>🛵 Delivery fee</span><span>${deliveryFee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold pt-2 mt-1" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-1)' }}>
              <span className="text-sm">Total</span>
              <span style={{ fontSize: 18, color: '#aa301a' }}>${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="px-4 py-4 flex-shrink-0">
            {(() => {
              const missingName    = orderType === 'delivery' && !customerName.trim()
              const missingPhone   = orderType === 'delivery' && !customerPhone.trim()
              const missingAddress = orderType === 'delivery' && !deliveryAddress.trim()
              const needsAddressValidation = orderType === 'delivery' && restaurantCoords && deliveryAddress.trim() && deliveryRangeStatus !== 'in'
              const deliveryMissing = missingName || missingPhone || missingAddress
              const canCharge = cart.length > 0 && !deliveryMissing && !needsAddressValidation

              const missingLabel = missingName && missingPhone && missingAddress
                ? '⚠ Name, phone & address required'
                : missingName && missingPhone
                  ? '⚠ Name & phone required'
                  : missingName && missingAddress
                    ? '⚠ Name & address required'
                    : missingPhone && missingAddress
                      ? '⚠ Phone & address required'
                      : missingName
                        ? '⚠ Customer name required'
                        : missingPhone
                          ? '⚠ Phone number required'
                          : '⚠ Delivery address required'
              const validationLabel = deliveryRangeStatus === 'out'
                ? `⚠ Outside ${restaurantRadius} mi delivery radius`
                : '⚠ Validate delivery address'

              return (
                <button
                  onClick={() => canCharge && setShowCharge(true)}
                  disabled={!canCharge}
                  className="w-full rounded-2xl font-bold flex items-center justify-center gap-2 transition-all duration-200"
                  style={{
                    padding: '17px 16px',
                    fontSize: cart.length && deliveryMissing ? 13 : 18,
                    background: canCharge ? 'linear-gradient(145deg,#cb4830,#aa301a)' : 'var(--border)',
                    color: canCharge ? '#fff' : 'var(--text-3)',
                    boxShadow: canCharge ? '0 4px 22px rgba(170,48,26,0.42)' : 'none',
                    cursor: !canCharge ? 'not-allowed' : 'pointer',
                    letterSpacing: '-0.02em',
                    border: canCharge ? '1px solid rgba(255,255,255,0.12)' : 'none',
                  }}
                  onMouseEnter={e => { if (canCharge) e.currentTarget.style.boxShadow = '0 6px 30px rgba(170,48,26,0.58)' }}
                  onMouseLeave={e => { if (canCharge) e.currentTarget.style.boxShadow = '0 4px 22px rgba(170,48,26,0.42)' }}
                >
                  {!cart.length
                    ? 'Add items to order'
                    : deliveryMissing
                      ? missingLabel
                      : needsAddressValidation
                        ? validationLabel
                      : <>💳 Charge · ${total.toFixed(2)}</>
                  }
                </button>
              )
            })()}
          </div>
        </div>
      </div>

      {/* Slide-in animation keyframe */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </Layout>
  )
}
