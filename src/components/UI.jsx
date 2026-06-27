export const colors = {
  navy:       '#0A1628',
  navyMid:    '#1E3A5F',
  navyLight:  '#162440',
  mint:       '#00C896',
  mintDim:    '#00A87D',
  gold:       '#FFD700',
  cream:      '#F0FDF8',
  white:      '#FFFFFF',
  muted:      '#6B8CAE',
  mutedLight: '#A8C4DC',
}

export function Badge({ children, variant = 'student' }) {
  const styles = {
    student:  { background: 'rgba(0,200,150,0.15)',  color: '#00C896',  border: '0.5px solid rgba(0,200,150,0.3)' },
    landlord: { background: 'rgba(255,215,0,0.15)',  color: '#FFD700',  border: '0.5px solid rgba(255,215,0,0.3)' },
    other:    { background: 'rgba(168,196,220,0.15)',color: '#A8C4DC',  border: '0.5px solid rgba(168,196,220,0.3)' },
    verified: { background: 'rgba(0,200,150,0.2)',   color: '#00C896',  border: '0.5px solid #00C896' },
  }
  const s = styles[variant] || styles.other
  return (
    <span style={{ ...s, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, display: 'inline-block', letterSpacing: '0.05em' }}>
      {children}
    </span>
  )
}

export function StarRow({ value, onChange, size = 20 }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[1,2,3,4,5].map(n => (
        <span key={n} onClick={() => onChange?.(n)} style={{
          fontSize: size, cursor: onChange ? 'pointer' : 'default',
          color: n <= value ? colors.gold : 'rgba(255,215,0,0.2)', lineHeight: 1,
        }}>★</span>
      ))}
    </span>
  )
}

export function Avatar({ name = '?', size = 40 }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(135deg, #00C896 0%, #1E3A5F 100%)`,
      color: colors.navy, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: size * 0.36, flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}

export function Card({ children, style = {}, glow = false }) {
  return (
    <div style={{
      background: colors.navyLight,
      border: '0.5px solid rgba(0,200,150,0.15)',
      borderRadius: 14, padding: '1.25rem',
      boxShadow: glow ? '0 0 32px rgba(0,200,150,0.08)' : 'none',
      ...style,
    }}>
      {children}
    </div>
  )
}

export function Input({ label, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ fontSize: 12, color: colors.muted, display: 'block', marginBottom: 5, letterSpacing: '0.03em' }}>{label}</label>}
      <input {...props} style={{
        width: '100%', boxSizing: 'border-box', padding: '10px 12px',
        border: '0.5px solid rgba(0,200,150,0.2)', borderRadius: 8,
        fontSize: 14, fontFamily: 'Inter, sans-serif',
        background: 'rgba(255,255,255,0.05)', color: '#FFFFFF', outline: 'none',
        ...props.style,
      }}
      onFocus={e => e.target.style.borderColor = '#00C896'}
      onBlur={e => e.target.style.borderColor = 'rgba(0,200,150,0.2)'}
      />
    </div>
  )
}

export function Textarea({ label, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ fontSize: 12, color: colors.muted, display: 'block', marginBottom: 5 }}>{label}</label>}
      <textarea {...props} style={{
        width: '100%', boxSizing: 'border-box', padding: '10px 12px',
        border: '0.5px solid rgba(0,200,150,0.2)', borderRadius: 8,
        fontSize: 14, fontFamily: 'Inter, sans-serif',
        background: 'rgba(255,255,255,0.05)', color: '#FFFFFF',
        resize: 'vertical', minHeight: 90, outline: 'none',
        ...props.style,
      }}
      onFocus={e => e.target.style.borderColor = '#00C896'}
      onBlur={e => e.target.style.borderColor = 'rgba(0,200,150,0.2)'}
      />
    </div>
  )
}

export function Btn({ children, variant = 'primary', style = {}, ...props }) {
  const base = {
    padding: '11px 22px', borderRadius: 8, fontSize: 14,
    fontFamily: 'Inter, sans-serif', fontWeight: 600,
    cursor: 'pointer', border: 'none', transition: 'opacity 0.15s',
    letterSpacing: '0.02em',
  }
  const variants = {
    primary: { background: '#00C896', color: '#0A1628' },
    gold:    { background: '#FFD700', color: '#0A1628' },
    ghost:   { background: 'transparent', color: '#00C896', border: '0.5px solid #00C896' },
    dark:    { background: '#1E3A5F', color: '#FFFFFF', border: '0.5px solid rgba(0,200,150,0.2)' },
  }
  return (
    <button {...props} style={{ ...base, ...variants[variant], ...style }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      {children}
    </button>
  )
}

export function TraitSlider({ label, name, value, onChange }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 13, color: colors.mutedLight }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: colors.mint }}>{value}/5</span>
      </div>
      <input type="range" min={1} max={5} step={1} value={value}
        onChange={e => onChange(name, parseInt(e.target.value))}
        style={{ width: '100%', accentColor: colors.mint }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: colors.muted, marginTop: 2 }}>
        <span>Low</span><span>High</span>
      </div>
    </div>
  )
}

export function SectionTitle({ children }) {
  return (
    <h2 style={{
      fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20,
      color: '#FFFFFF', margin: '0 0 1.25rem', letterSpacing: '-0.3px',
    }}>
      {children}
    </h2>
  )
}