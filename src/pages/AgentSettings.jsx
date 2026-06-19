import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import { AgentIcon, CheckIcon } from '../components/Icons'

const STORAGE_KEY = 'agent_settings'

const DEFAULT_AGENT = {
  personality: 'friendly',
  voice: 'warm',
  pace: 'balanced',
  language: 'auto',
  orderStyle: 'confirm_each_item',
  fallback: 'take_message',
  upsell: true,
  allergyPrompt: true,
  repeatOrder: true,
  smsSummary: true,
  greeting: 'Hi, thanks for calling. How can I help with your order today?',
  closing: 'Thanks, your order is confirmed. We will see you soon.',
  customNotes: '',
}

const OPTIONS = {
  personality: [
    ['friendly', 'Friendly', 'Warm and casual for most restaurants.'],
    ['professional', 'Professional', 'Polished and direct for formal service.'],
    ['energetic', 'Energetic', 'Upbeat, quick, and promotional.'],
  ],
  voice: [
    ['warm', 'Warm'],
    ['clear', 'Clear'],
    ['calm', 'Calm'],
    ['bright', 'Bright'],
  ],
  pace: [
    ['slow', 'Slow'],
    ['balanced', 'Balanced'],
    ['fast', 'Fast'],
  ],
  language: [
    ['auto', 'Auto detect'],
    ['english', 'English'],
    ['spanish', 'Spanish'],
  ],
  orderStyle: [
    ['confirm_each_item', 'Confirm each item'],
    ['confirm_at_end', 'Confirm at end'],
    ['fast_checkout', 'Fast checkout'],
  ],
  fallback: [
    ['take_message', 'Take a message'],
    ['send_to_staff', 'Send to staff'],
    ['ask_to_call_back', 'Ask to call back'],
  ],
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      style={{
        width: 42,
        height: 24,
        borderRadius: 999,
        border: 'none',
        padding: 0,
        background: checked ? 'var(--primary)' : 'var(--surface-4)',
        position: 'relative',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'background 0.18s ease',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 3,
          left: checked ? 21 : 3,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.20)',
          transition: 'left 0.18s ease',
        }}
      />
    </button>
  )
}

function OptionGroup({ label, value, options, onChange }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
        {label}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {options.map(([key, title, description]) => {
          const active = value === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              style={{
                padding: description ? '12px 14px' : '8px 13px',
                borderRadius: 12,
                border: active ? '1.5px solid var(--primary)' : '1.5px solid var(--border)',
                background: active ? 'var(--primary-light)' : 'var(--surface-2)',
                color: active ? 'var(--primary)' : 'var(--text-2)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left',
                minWidth: description ? 170 : 0,
                boxShadow: active ? '0 2px 10px rgba(170,48,26,0.12)' : 'none',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 800 }}>{title}</div>
              {description && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4, lineHeight: 1.45 }}>{description}</div>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function RuleRow({ title, description, checked, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-1)' }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3, lineHeight: 1.45 }}>{description}</div>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  )
}

function MobileAccordionSection({ id, title, summary, open, onToggle, children, className = '', style = {} }) {
  return (
    <section className={`agent-mobile-section ${open ? 'is-open' : ''} ${className}`} style={style}>
      <button
        type="button"
        className="agent-mobile-section-toggle"
        onClick={() => onToggle(id)}
        aria-expanded={open}
      >
        <span>
          <span className="agent-mobile-section-title">{title}</span>
          {summary && <span className="agent-mobile-section-summary">{summary}</span>}
        </span>
        <span className="agent-mobile-section-control" aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
      <div className="agent-mobile-section-content">
        {children}
      </div>
    </section>
  )
}

export default function AgentSettings() {
  const [settings, setSettings] = useState(DEFAULT_AGENT)
  const [saved, setSaved] = useState(false)
  const [openSections, setOpenSections] = useState({
    profile: true,
    conversation: false,
    order: false,
    scripts: false,
    rules: false,
  })

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
      if (stored) setSettings({ ...DEFAULT_AGENT, ...stored })
    } catch {}
  }, [])

  const update = (key, value) => setSettings(prev => ({ ...prev, [key]: value }))
  const toggleSection = (id) => setOpenSections(prev => ({ ...prev, [id]: !prev[id] }))

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <Layout>
      <div className="app-page">
        <PageHeader
          icon={AgentIcon}
          title="Agent"
          subtitle="Customize how your AI answers calls, takes orders, and handles edge cases."
          accent="var(--accent-cyan)"
          accentBg="rgba(8,145,178,0.11)"
        >
          <button
            type="button"
            onClick={save}
            className="btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 12 }}
          >
            <CheckIcon size={14} />
            {saved ? 'Saved' : 'Save Agent'}
          </button>
        </PageHeader>

        <MobileAccordionSection
          id="profile"
          title="Current Agent Profile"
          summary={`${settings.personality} · ${settings.voice} · ${settings.pace}`}
          open={openSections.profile}
          onToggle={toggleSection}
          className="card"
          style={{
            padding: 22,
            marginBottom: 20,
            background: 'linear-gradient(145deg, rgba(8,145,178,0.10), rgba(170,48,26,0.06))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, marginBottom: 14 }}>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 900, color: 'var(--text-1)', margin: 0 }}>Current Agent Profile</h2>
              <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '4px 0 0' }}>A quick summary of how the AI will behave on customer calls.</p>
            </div>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 11px',
              borderRadius: 999,
              background: 'rgba(8,145,178,0.10)',
              color: 'var(--accent-cyan)',
              fontSize: 11,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              flexShrink: 0,
            }}>
              Live profile
            </span>
          </div>

          <div className="agent-profile-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {[
              ['Personality', settings.personality],
              ['Voice', settings.voice],
              ['Pace', settings.pace],
              ['Language', settings.language],
              ['Order flow', settings.orderStyle.replaceAll('_', ' ')],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  padding: '14px 15px',
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.72)',
                  border: '1px solid rgba(255,255,255,0.70)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                }}
              >
                <div style={{ color: 'var(--text-3)', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{label}</div>
                <div style={{ color: 'var(--text-1)', fontSize: 14, fontWeight: 900, textTransform: 'capitalize' }}>{value}</div>
              </div>
            ))}
          </div>
        </MobileAccordionSection>

        <div className="agent-settings-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'stretch' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <MobileAccordionSection
              id="conversation"
              title="Conversation Style"
              summary={`${settings.personality} · ${settings.language}`}
              open={openSections.conversation}
              onToggle={toggleSection}
              className="card"
              style={{ padding: 22 }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-1)', margin: '0 0 18px' }}>Conversation Style</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                <OptionGroup label="Personality" value={settings.personality} options={OPTIONS.personality} onChange={value => update('personality', value)} />
                <OptionGroup label="Voice" value={settings.voice} options={OPTIONS.voice} onChange={value => update('voice', value)} />
                <OptionGroup label="Pace" value={settings.pace} options={OPTIONS.pace} onChange={value => update('pace', value)} />
                <OptionGroup label="Language" value={settings.language} options={OPTIONS.language} onChange={value => update('language', value)} />
              </div>
            </MobileAccordionSection>

            <MobileAccordionSection
              id="order"
              title="Order Handling"
              summary={settings.orderStyle.replaceAll('_', ' ')}
              open={openSections.order}
              onToggle={toggleSection}
              className="card"
              style={{ padding: 22, flex: 1 }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-1)', margin: '0 0 18px' }}>Order Handling</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                <OptionGroup label="Confirmation Flow" value={settings.orderStyle} options={OPTIONS.orderStyle} onChange={value => update('orderStyle', value)} />
                <OptionGroup label="Fallback Behavior" value={settings.fallback} options={OPTIONS.fallback} onChange={value => update('fallback', value)} />
              </div>
            </MobileAccordionSection>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <MobileAccordionSection
              id="scripts"
              title="Scripts"
              summary="Greeting · closing · instructions"
              open={openSections.scripts}
              onToggle={toggleSection}
              className="card"
              style={{ padding: 22 }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-1)', margin: '0 0 14px' }}>Scripts</h2>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-3)', marginBottom: 7 }}>Greeting</label>
              <textarea className="input" rows={3} value={settings.greeting} onChange={e => update('greeting', e.target.value)} style={{ resize: 'vertical', marginBottom: 14 }} />
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-3)', marginBottom: 7 }}>Closing</label>
              <textarea className="input" rows={3} value={settings.closing} onChange={e => update('closing', e.target.value)} style={{ resize: 'vertical', marginBottom: 14 }} />
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-3)', marginBottom: 7 }}>Special Instructions</label>
              <textarea className="input" rows={5} value={settings.customNotes} onChange={e => update('customNotes', e.target.value)} placeholder="Example: Always mention lunch specials before noon. Never promise delivery times." style={{ resize: 'vertical' }} />
            </MobileAccordionSection>

            <MobileAccordionSection
              id="rules"
              title="Behavior Rules"
              summary="Add-ons · allergies · SMS"
              open={openSections.rules}
              onToggle={toggleSection}
              className="card"
              style={{ padding: 22, flex: 1 }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-1)', margin: '0 0 4px' }}>Behavior Rules</h2>
              <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 8px' }}>Fine tune what the AI should do during live calls.</p>
              <div>
                <RuleRow title="Suggest add-ons" description="Let the AI recommend drinks, sides, or popular items when it fits naturally." checked={settings.upsell} onChange={value => update('upsell', value)} />
                <RuleRow title="Ask about allergies" description="Prompt customers about allergies or dietary preferences before final confirmation." checked={settings.allergyPrompt} onChange={value => update('allergyPrompt', value)} />
                <RuleRow title="Repeat order before checkout" description="Read back the full order so the customer can correct mistakes." checked={settings.repeatOrder} onChange={value => update('repeatOrder', value)} />
                <RuleRow title="Send SMS summary" description="Send a customer-facing order summary when a phone number is available." checked={settings.smsSummary} onChange={value => update('smsSummary', value)} />
              </div>
            </MobileAccordionSection>
          </div>
        </div>
      </div>
    </Layout>
  )
}
