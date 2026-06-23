import { useState, useEffect, useCallback } from 'react'
import { posApi, restaurantApi, unwrap } from '../services/api'

const PROVIDERS = [
  { id: 'square', name: 'Square', blurb: 'Send orders straight to your Square POS & kitchen display.' },
  { id: 'clover', name: 'Clover', blurb: 'Push orders to your Clover station.' },
  { id: 'toast',  name: 'Toast',  blurb: 'Inject orders into your Toast POS (partner setup required).' },
]

const STATUS_META = {
  connected:     { label: 'Connected',      color: '#16a34a', bg: 'rgba(22,163,74,0.10)' },
  disconnected:  { label: 'Disconnected',   color: '#9ca3af', bg: 'rgba(156,163,175,0.12)' },
  error:         { label: 'Needs attention', color: '#dc2626', bg: 'rgba(220,38,38,0.10)' },
  not_connected: { label: 'Not connected',  color: '#9ca3af', bg: 'rgba(156,163,175,0.12)' },
}

export default function POSIntegrationPanel() {
  const [restaurantId, setRestaurantId] = useState('')
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [banner, setBanner] = useState(null)

  const load = useCallback(async (rid) => {
    try {
      const res = await posApi.list(rid)
      setProviders(unwrap(res)?.providers || [])
    } catch {
      setBanner({ type: 'error', text: 'Could not load POS connection status.' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    (async () => {
      try {
        const r = unwrap(await restaurantApi.get())
        const rid = r?.id || r?.restaurant_id
        if (!rid) { setBanner({ type: 'error', text: 'No restaurant found for this account.' }); setLoading(false); return }
        setRestaurantId(rid)
        await load(rid)
      } catch {
        setBanner({ type: 'error', text: 'Could not load your restaurant.' })
        setLoading(false)
      }
    })()
  }, [load])

  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const pos = q.get('pos'); const status = q.get('status')
    if (pos && status) {
      setBanner(
        status === 'connected'
          ? { type: 'success', text: `${pos[0].toUpperCase() + pos.slice(1)} connected successfully.` }
          : { type: 'error', text: q.get('message') || `Could not connect ${pos}.` }
      )
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const connect = (provider) => {
    if (!restaurantId) return
    window.location.href = posApi.connectUrl(restaurantId, provider)
  }

  const disconnect = async (provider) => {
    setBusy(provider)
    try {
      await posApi.disconnect(restaurantId, provider)
      await load(restaurantId)
      setBanner({ type: 'success', text: `${provider} disconnected.` })
    } catch {
      setBanner({ type: 'error', text: `Could not disconnect ${provider}.` })
    } finally {
      setBusy('')
    }
  }

  const statusOf = (id) => providers.find(p => p.provider === id)?.status || 'not_connected'

  return (
    <div style={{ maxWidth: 720 }}>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', marginBottom: 6 }}>
        Point of Sale
      </h3>
      <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>
        Connect your existing POS so phone orders flow straight into it. No POS? Your orders still
        appear in your Ring AI kitchen dashboard.
      </p>

      {banner && (
        <div style={{
          padding: '10px 14px', borderRadius: 10, marginBottom: 16, fontSize: 13,
          background: banner.type === 'success' ? 'rgba(22,163,74,0.10)' : 'rgba(220,38,38,0.10)',
          color: banner.type === 'success' ? '#15803d' : '#b91c1c',
          border: `1px solid ${banner.type === 'success' ? 'rgba(22,163,74,0.3)' : 'rgba(220,38,38,0.3)'}`,
        }}>
          {banner.text}
        </div>
      )}

      {loading ? (
        <div style={{ color: 'var(--text-3)', fontSize: 14 }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {PROVIDERS.map(p => {
            const status = statusOf(p.id)
            const meta = STATUS_META[status] || STATUS_META.not_connected
            const isConnected = status === 'connected'
            return (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 16, padding: '16px 18px',
                border: '1px solid var(--border)', borderRadius: 14, background: 'var(--card-bg)',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>{p.name}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
                      color: meta.color, background: meta.bg,
                    }}>{meta.label}</span>
                  </div>
                  <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 4 }}>{p.blurb}</p>
                </div>
                {isConnected ? (
                  <button
                    type="button"
                    data-testid={`pos-disconnect-${p.id}`}
                    onClick={() => disconnect(p.id)}
                    disabled={busy === p.id}
                    className="btn-secondary"
                    style={{ borderRadius: 10, padding: '8px 16px', flexShrink: 0 }}
                  >
                    {busy === p.id ? 'Disconnecting…' : 'Disconnect'}
                  </button>
                ) : (
                  <button
                    type="button"
                    data-testid={`pos-connect-${p.id}`}
                    onClick={() => connect(p.id)}
                    className="btn-primary"
                    style={{ borderRadius: 10, padding: '8px 16px', flexShrink: 0 }}
                  >
                    Connect
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
