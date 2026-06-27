import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import { useUnreadCount } from '../hooks/useUnreadCount'
import { Avatar, colors } from './UI'

export default function Navbar({ page, setPage }) {
  const { user, profile } = useAuth()
  const unread = useUnreadCount(user?.uid)

  const navLinks = user ? [
    { id: 'listings',   label: 'Find housing' },
    { id: 'discover',   label: 'Discover' },
    { id: 'myListings', label: 'My listings' },
    { id: 'saved',      label: 'Saved' },
    { id: 'inbox',      label: 'Inbox', badge: unread },
  ] : [
    { id: 'listings', label: 'Find housing' },
    { id: 'discover', label: 'Discover' },
  ]

  return (
    <nav style={{
      background: colors.navy,
      borderBottom: '0.5px solid rgba(0,200,150,0.15)',
      padding: '0 1.5rem',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: 58, flexShrink: 0, position: 'sticky', top: 0, zIndex: 100,
    }}>
      <button onClick={() => setPage('home')} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: 'Syne, sans-serif', fontWeight: 800,
        fontSize: 20, color: colors.mint, letterSpacing: '-0.5px',
      }}>
        Gha Talaba
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {navLinks.map(l => (
          <button key={l.id} onClick={() => setPage(l.id)} style={{
            background: page === l.id ? 'rgba(0,200,150,0.1)' : 'none',
            border: 'none', cursor: 'pointer',
            color: page === l.id ? colors.mint : colors.muted,
            fontSize: 13, fontFamily: 'Inter, sans-serif',
            padding: '6px 14px', borderRadius: 8,
            fontWeight: page === l.id ? 600 : 400,
            transition: 'all 0.15s', position: 'relative',
          }}>
            {l.label}
            {l.badge > 0 && (
              <span style={{
                position: 'absolute', top: 2, right: 2,
                background: '#FF6B6B', color: 'white',
                fontSize: 10, fontWeight: 700, lineHeight: 1,
                minWidth: 16, height: 16, borderRadius: 99,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 3px', border: `2px solid ${colors.navy}`,
              }}>
                {l.badge > 9 ? '9+' : l.badge}
              </span>
            )}
          </button>
        ))}

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
            <button onClick={() => setPage('createListing')} style={{
              background: colors.mint, border: 'none', color: colors.navy,
              fontSize: 13, padding: '7px 16px', borderRadius: 8,
              cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 700,
            }}>
              + Post listing
            </button>
            <button onClick={() => setPage('profile')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <Avatar name={profile?.displayName || user.email} size={34} />
            </button>
            <button onClick={() => signOut(auth)} style={{
              background: 'none', border: '0.5px solid rgba(0,200,150,0.2)',
              color: colors.muted, fontSize: 12, padding: '5px 12px',
              borderRadius: 6, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            }}>
              Sign out
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8, marginLeft: 8 }}>
            <button onClick={() => setPage('login')} style={{
              background: 'none', border: '0.5px solid rgba(0,200,150,0.2)',
              color: colors.mutedLight, fontSize: 13, padding: '7px 16px',
              borderRadius: 8, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            }}>
              Sign in
            </button>
            <button onClick={() => setPage('signup')} style={{
              background: colors.mint, border: 'none', color: colors.navy,
              fontSize: 13, padding: '7px 16px', borderRadius: 8,
              cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 700,
            }}>
              Join free
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}