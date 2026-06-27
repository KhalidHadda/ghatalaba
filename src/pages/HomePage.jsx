import { colors, Btn } from '../components/UI'

const LISTINGS_PREVIEW = [
  { emoji: '🏠', title: 'Studio meublé, Agdal', city: 'Rabat', price: 1800, near: 'FSR' },
  { emoji: '🛏', title: 'Chambre partagée, Akkari', city: 'Rabat', price: 900, near: 'ENSA' },
  { emoji: '🌴', title: 'Studio, Guéliz', city: 'Marrakech', price: 2100, near: 'ENCG' },
]

const FEATURES = [
  { icon: '🏠', title: 'Find a room', desc: 'Furnished studios, shared rooms, apartments near your campus.', cta: 'Browse listings', page: 'listings' },
  { icon: '⭐', title: 'Rate roommates', desc: 'Honest reviews on cleanliness, noise, reliability — from real students.', cta: 'See profiles', page: 'signup' },
  { icon: '✉️', title: 'Message anyone', desc: 'Contact landlords and students directly from their profile.', cta: 'Get started', page: 'signup' },
]

export default function HomePage({ setPage }) {
  return (
    <div style={{ background: colors.navy, minHeight: '100vh', color: colors.white }}>

      <div style={{ padding: '5rem 1.5rem 4rem', maxWidth: 800, margin: '0 auto', position: 'relative' }}>

        <div style={{ position: 'absolute', right: 0, top: '2rem', opacity: 0.06, pointerEvents: 'none' }}>
          <svg width="300" height="300" viewBox="0 0 300 300">
            {[...Array(6)].map((_, row) =>
              [...Array(5)].map((_, col) => {
                const x = col * 56 + (row % 2 === 0 ? 0 : 28)
                const y = row * 48
                const pts = [
                  [x+28, y], [x+56, y+14], [x+56, y+42],
                  [x+28, y+56], [x, y+42], [x, y+14]
                ].map(p => p.join(',')).join(' ')
                return <polygon key={`${row}-${col}`} points={pts} fill="none" stroke="#00C896" strokeWidth="1"/>
              })
            )}
          </svg>
        </div>

        <div style={{
          display: 'inline-block', background: 'rgba(0,200,150,0.12)',
          border: '0.5px solid rgba(0,200,150,0.3)',
          color: colors.mint, fontSize: 11, fontWeight: 600,
          padding: '5px 14px', borderRadius: 99, letterSpacing: '0.1em',
          textTransform: 'uppercase', marginBottom: 24,
        }}>
         Gha Talaba A Platform For All Students 
        </div>

        <h1 style={{
          fontFamily: 'Syne, sans-serif', fontSize: 52, fontWeight: 800,
          lineHeight: 1.05, margin: '0 0 20px', letterSpacing: '-1px',
        }}>
          Find your room,<br />
          find your <span style={{ color: colors.mint }}>crew.</span>
        </h1>

        <p style={{ fontSize: 17, color: colors.mutedLight, lineHeight: 1.7, margin: '0 0 36px', maxWidth: 480 }}>
          Housing, roommates, and student life — built for Moroccan university students. Open to everyone.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Btn onClick={() => setPage('listings')} style={{ fontSize: 15, padding: '13px 28px' }}>
            Browse listings
          </Btn>
          <Btn variant="ghost" onClick={() => setPage('signup')} style={{ fontSize: 15, padding: '13px 28px' }}>
            Join free →
          </Btn>
        </div>

        <div style={{ display: 'flex', gap: 40, marginTop: 52 }}>
          {[['2,400+', 'Listings'], ['18', 'Cities'], ['Free', 'Always']].map(([n, l]) => (
            <div key={l}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, color: colors.mint }}>{n}</div>
              <div style={{ fontSize: 12, color: colors.muted, marginTop: 3, letterSpacing: '0.05em' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '3rem 1.5rem', maxWidth: 860, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
          <div style={{ flex: 1, height: '0.5px', background: 'rgba(0,200,150,0.15)' }} />
          <span style={{ fontSize: 11, color: colors.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>What you can do</span>
          <div style={{ flex: 1, height: '0.5px', background: 'rgba(0,200,150,0.15)' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: 14 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{
              background: colors.navyLight, border: '0.5px solid rgba(0,200,150,0.12)',
              borderRadius: 14, padding: '1.5rem', cursor: 'pointer', transition: 'border-color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(0,200,150,0.4)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(0,200,150,0.12)'}
            onClick={() => setPage(f.page)}
            >
              <div style={{ fontSize: 28, marginBottom: 14 }}>{f.icon}</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, color: colors.white, marginBottom: 8 }}>{f.title}</div>
              <p style={{ fontSize: 13, color: colors.muted, lineHeight: 1.6, margin: '0 0 16px' }}>{f.desc}</p>
              <span style={{ fontSize: 13, color: colors.mint, fontWeight: 600 }}>{f.cta} →</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '1rem 1.5rem 5rem', maxWidth: 860, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20 }}>Recent listings</span>
          <button onClick={() => setPage('listings')} style={{ background: 'none', border: 'none', color: colors.mint, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>See all →</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px,1fr))', gap: 12 }}>
          {LISTINGS_PREVIEW.map(l => (
            <div key={l.title} onClick={() => setPage('listings')} style={{
              background: colors.navyLight, borderRadius: 14, overflow: 'hidden',
              border: '0.5px solid rgba(0,200,150,0.12)', cursor: 'pointer', transition: 'border-color 0.2s, transform 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,200,150,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,200,150,0.12)'; e.currentTarget.style.transform = 'none' }}
            >
              <div style={{ height: 80, background: colors.navyMid, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, borderBottom: '0.5px solid rgba(0,200,150,0.1)' }}>{l.emoji}</div>
              <div style={{ padding: '0.9rem 1rem' }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: colors.white, marginBottom: 4 }}>{l.title}</div>
                <div style={{ fontSize: 12, color: colors.muted, marginBottom: 8 }}>📍 {l.city} · Near {l.near}</div>
                <span style={{ fontWeight: 700, color: colors.mint, fontSize: 16 }}>{l.price.toLocaleString()} <span style={{ fontSize: 11, color: colors.muted, fontWeight: 400 }}>DH/mo</span></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}