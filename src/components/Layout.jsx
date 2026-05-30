import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLocation as useLocationCtx } from '../context/LocationContext'
import {
  DashboardIcon, OrdersIcon, MenuIcon, KnowledgeIcon,
  SettingsIcon, AnalyticsIcon, LogoutIcon, PhoneIcon, CreditCardIcon, AgentIcon,
} from './Icons'

function ManagerIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
      <polyline points="7 10 12 6 17 10"/>
    </svg>
  )
}

const navItems = [
  { path: '/dashboard',  label: 'Dashboard',     icon: DashboardIcon  },
  { path: '/pos',        label: 'POS Terminal',  icon: OrdersIcon     },
  { path: '/menu',       label: 'Menu',           icon: MenuIcon       },
  { path: '/agent',      label: 'Agent',          icon: AgentIcon      },
  { path: '/documents',  label: 'Knowledge Base', icon: KnowledgeIcon  },
  { path: '/analytics',  label: 'Analytics',      icon: AnalyticsIcon  },
  { path: '/locations',  label: 'Locations',      icon: LocationsIcon  },
  { path: '/subscription', label: 'Subscription', icon: CreditCardIcon },
  { path: '/settings',   label: 'Settings',       icon: SettingsIcon   },
]

/* ── Inline icons ─────────────────────────────────────────────────── */
function LocationsIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
}

function ChevronDownIcon({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  )
}

function MapPinIcon({ size = 11 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  )
}

/* ── Location Switcher ────────────────────────────────────────────── */
function LocationSwitcher() {
  const { locations, activeLocation, setActiveLocation } = useLocationCtx()
  const [open, setOpen] = useState(false)

  if (!locations || locations.length <= 1) return null

  return (
    <div className="relative px-3 mb-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-colors"
        style={{
          background: open ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <MapPinIcon size={11} style={{ color: '#ffb4a5', flexShrink: 0 }} />
        <span className="flex-1 text-xs font-semibold truncate" style={{ color: 'rgba(255,255,255,0.82)' }}>
          {activeLocation?.name || 'Select location'}
        </span>
        <ChevronDownIcon size={11} style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>

      {open && (
        <div
          className="absolute left-3 right-3 rounded-xl overflow-hidden z-50 mt-1"
          style={{
            background: '#1c1c1e',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}
        >
          {locations.map(loc => (
            <button
              key={loc.id}
              onClick={() => { setActiveLocation(loc); setOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors"
              style={{
                background: activeLocation?.id === loc.id ? 'rgba(170,48,26,0.18)' : 'transparent',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}
              onMouseEnter={e => { if (activeLocation?.id !== loc.id) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
              onMouseLeave={e => { if (activeLocation?.id !== loc.id) e.currentTarget.style.background = 'transparent' }}
            >
              <MapPinIcon size={10} style={{ color: activeLocation?.id === loc.id ? '#ffb4a5' : 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
              <div className="min-w-0">
                <div className="text-xs font-semibold truncate" style={{ color: activeLocation?.id === loc.id ? '#ffb4a5' : 'rgba(255,255,255,0.78)' }}>
                  {loc.name}
                </div>
                {loc.address && (
                  <div className="text-xs truncate mt-0.5" style={{ color: 'rgba(255,255,255,0.28)', fontSize: 10 }}>
                    {loc.address}
                  </div>
                )}
              </div>
              {activeLocation?.id === loc.id && (
                <span className="ml-auto text-xs" style={{ color: '#ffb4a5', fontSize: 10 }}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Layout ───────────────────────────────────────────────────────── */
export default function Layout({ children }) {
  const { owner, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { activeLocation } = useLocationCtx()

  const handleLogout = () => {
    logout()
    localStorage.removeItem('active_location')
    navigate('/login')
  }

  const initials = owner?.restaurant_name
    ? owner.restaurant_name.slice(0, 2).toUpperCase()
    : 'AI'

  return (
    <div className="flex h-screen" style={{ background: 'var(--bg)' }}>

      {/* ── Sidebar ── */}
      <aside
        className="flex flex-col flex-shrink-0"
        style={{
          width: '232px',
          background: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--sidebar-border)',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-5 py-5"
          style={{ borderBottom: '1px solid var(--sidebar-border)' }}
        >
          <div
            className="flex items-center justify-center rounded-xl flex-shrink-0"
            style={{
              width: 34,
              height: 34,
              background: 'linear-gradient(135deg, #aa301a, #cb4830)',
              boxShadow: '0 4px 12px rgba(170,48,26,0.40)',
            }}
          >
            <PhoneIcon size={15} className="text-white" />
          </div>
          <div>
            <div
              className="font-bold text-sm leading-tight"
              style={{ color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.03em' }}
            >
              RingZ.ai
            </div>
            <div
              className="text-xs leading-tight mt-0.5"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              Never miss a customer call again
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${active ? 'active' : ''}`}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div
          className="px-3 pb-4 pt-3"
          style={{ borderTop: '1px solid var(--sidebar-border)' }}
        >
          {/* User card */}
          <div
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-3"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            <div
              className="flex items-center justify-center rounded-lg text-xs font-bold text-white flex-shrink-0"
              style={{
                width: 32,
                height: 32,
                background: 'linear-gradient(135deg, #aa301a, #cb4830)',
                fontSize: 11,
              }}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div
                className="text-xs font-semibold truncate"
                style={{ color: 'rgba(255,255,255,0.88)' }}
              >
                {owner?.restaurant_name}
              </div>
              <div
                className="text-xs truncate mt-0.5"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                {owner?.email}
              </div>
            </div>
          </div>

          {/* Plan badge */}
          <Link
            to="/subscription?details=plan"
            className="flex items-center justify-between px-1 mb-3 rounded-lg py-1 transition-colors"
            style={{ textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.28)' }}>Plan</span>
            <span
              className="text-xs font-semibold capitalize px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(170,48,26,0.18)', color: '#ffb4a5' }}
            >
              {owner?.plan || 'free'}
            </span>
          </Link>

          {/* Sign out */}
          <button
            onClick={handleLogout}
            className="nav-item w-full text-left"
            style={{ color: 'rgba(255,255,255,0.3)' }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.1)'
              e.currentTarget.style.color = '#fca5a5'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'rgba(255,255,255,0.3)'
            }}
          >
            <LogoutIcon size={14} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="app-main flex-1 overflow-auto">
        <div className="page-enter">
          {children}
        </div>
      </main>
    </div>
  )
}
