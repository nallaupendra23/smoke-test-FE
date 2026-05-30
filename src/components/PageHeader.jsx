export default function PageHeader({
  icon: Icon,
  title,
  subtitle,
  eyebrow,
  accent = 'var(--primary)',
  accentBg = 'var(--primary-light)',
  children,
}) {
  return (
    <div className="page-header">
      <div className="page-header-copy">
        {Icon && (
          <div
            className="page-header-icon"
            style={{
              color: accent,
              background: accentBg,
              boxShadow: `0 10px 26px color-mix(in srgb, ${accent} 18%, transparent)`,
            }}
          >
            <Icon size={22} />
          </div>
        )}
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
