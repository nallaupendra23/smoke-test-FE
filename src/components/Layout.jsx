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
function LocationSwitcher({ variant = 'surface' }) {
  const { locations, activeLocation, setActiveLocation } = useLocationCtx()
  const [open, setOpen] = useState(false)
  const sidebar = variant === 'sidebar' || variant === 'account'
  const account = variant === 'account'
  const footerSwitcher = variant === 'sidebar'

  if (!locations || locations.length <= 1) return null

  return (
    <div className={`relative location-switcher ${account ? 'account-location-switcher' : sidebar ? 'sidebar-location-switcher' : 'top-location-switcher'}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className={account ? 'account-location-button' : sidebar ? 'sidebar-location-button' : 'top-location-button'}
        style={{
          background: sidebar
            ? (open ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.05)')
            : (open ? 'rgba(170,48,26,0.10)' : 'rgba(255,255,255,0.76)'),
          border: sidebar
            ? '1px solid rgba(255,255,255,0.08)'
            : (open ? '1px solid rgba(170,48,26,0.24)' : '1px solid var(--border)'),
        }}
      >
        <MapPinIcon size={12} style={{ color: sidebar ? '#ffb4a5' : 'var(--primary)', flexShrink: 0 }} />
        <span className="flex-1 text-xs font-semibold truncate" style={{ color: sidebar ? 'rgba(255,255,255,0.76)' : 'var(--text-2)' }}>
          {activeLocation?.name || 'Select location'}
        </span>
        <ChevronDownIcon size={11} style={{ color: sidebar ? 'rgba(255,255,255,0.36)' : 'var(--text-3)', flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>

      {open && (
        <div
          className="absolute rounded-xl overflow-hidden z-50"
          style={{
            left: 0,
            right: sidebar ? 0 : 'auto',
            width: sidebar ? '100%' : 260,
            top: footerSwitcher ? 'auto' : 'calc(100% + 8px)',
            bottom: footerSwitcher ? 'calc(100% + 8px)' : 'auto',
            background: sidebar ? '#101c2c' : 'var(--card-bg)',
            border: sidebar ? '1px solid rgba(255,255,255,0.10)' : '1px solid var(--border)',
            boxShadow: sidebar ? '0 16px 36px rgba(0,0,0,0.35)' : 'var(--shadow-lg)',
          }}
        >
          {locations.map(loc => (
            <button
              key={loc.id}
              onClick={() => { setActiveLocation(loc); setOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors"
              style={{
                background: activeLocation?.id === loc.id ? 'rgba(170,48,26,0.18)' : 'transparent',
                borderBottom: sidebar ? '1px solid rgba(255,255,255,0.06)' : '1px solid var(--border)',
              }}
              onMouseEnter={e => { if (activeLocation?.id !== loc.id) e.currentTarget.style.background = sidebar ? 'rgba(255,255,255,0.06)' : 'var(--surface-2)' }}
              onMouseLeave={e => { if (activeLocation?.id !== loc.id) e.currentTarget.style.background = 'transparent' }}
            >
              <MapPinIcon size={11} style={{ color: activeLocation?.id === loc.id ? '#ffb4a5' : (sidebar ? 'rgba(255,255,255,0.36)' : 'var(--text-3)'), flexShrink: 0 }} />
              <div className="min-w-0">
                <div className="text-xs font-semibold truncate" style={{ color: activeLocation?.id === loc.id ? '#ffb4a5' : (sidebar ? 'rgba(255,255,255,0.78)' : 'var(--text-2)') }}>
                  {loc.name}
                </div>
                {loc.address && (
                  <div className="text-xs truncate mt-0.5" style={{ color: sidebar ? 'rgba(255,255,255,0.32)' : 'var(--text-3)', fontSize: 10 }}>
                    {loc.address}
                  </div>
                )}
              </div>
              {activeLocation?.id === loc.id && (
                <span className="ml-auto text-xs" style={{ color: sidebar ? '#ffb4a5' : 'var(--primary)', fontSize: 10 }}>✓</span>
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
  const { locations } = useLocationCtx()
  const hasMultipleLocations = locations?.length > 1

  const handleLogout = () => {
    logout()
    localStorage.removeItem('active_location')
    navigate('/login')
  }

  const initials = owner?.restaurant_name
    ? owner.restaurant_name.slice(0, 2).toUpperCase()
    : 'AI'

  return (
    <div className="app-shell" style={{ background: 'var(--bg)' }}>
      <aside className="app-sidebar">
        <div className="app-sidebar-brand">
          <div className="app-sidebar-logo">
            <PhoneIcon size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <div className="app-sidebar-title">RingZ.ai</div>
            <div className="app-sidebar-subtitle">Restaurant voice agent</div>
          </div>
        </div>

        <nav className="app-sidebar-nav" aria-label="Primary navigation">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`app-sidebar-item ${active ? 'active' : ''}`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="app-sidebar-footer">
          {hasMultipleLocations && (
            <div className="app-sidebar-location-card">
              <div className="app-sidebar-location-label">Location</div>
              <LocationSwitcher variant="sidebar" />
            </div>
          )}

          <div className={`app-sidebar-account-card ${location.pathname === '/account' ? 'active' : ''}`}>
            <Link
              to="/account"
              className="app-sidebar-account-main"
              title="Account settings"
            >
              <span className="app-sidebar-avatar">{initials}</span>
              <span className="app-sidebar-account-copy">
                <span className="app-sidebar-account-name">{owner?.restaurant_name}</span>
                <span className="app-sidebar-account-email">{owner?.email}</span>
              </span>
            </Link>
          </div>

          <Link
            to="/subscription?details=plan"
            className="app-sidebar-plan"
            title="Subscription plan"
          >
            <span>Plan</span>
            <strong>{owner?.plan || 'free'}</strong>
          </Link>

          <button
            onClick={handleLogout}
            className="app-sidebar-signout"
            title="Sign out"
          >
            <LogoutIcon size={15} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <div className="app-content-shell">
        <main className="app-main">
          <div className="page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
