import { DashboardIcon } from './Icons'

export default function PageHeader({
  icon: Icon,
  title,
  subtitle,
  eyebrow,
  children,
}) {
  const HeaderIcon = Icon || DashboardIcon

  return (
    <div className="page-header">
      <div className="page-header-copy">
        <div
          className="page-header-icon"
          style={{
            color: 'var(--page-accent)',
            background: 'var(--page-accent-light)',
            boxShadow: '0 10px 26px var(--page-accent-ring)',
          }}
        >
          <HeaderIcon size={22} />
        </div>
        <div>
          {eyebrow && <div className="page-header-eyebrow">{eyebrow}</div>}
          <h1 className="page-header-title">{title}</h1>
          {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
        </div>
      </div>
      {children && <div className="page-header-actions">{children}</div>}
    </div>
  )
}
