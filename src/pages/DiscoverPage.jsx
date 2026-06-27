import { useState, useEffect } from 'react'
import { collection, getDocs, query, limit } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import { colors, Avatar, Badge, StarRow, Btn } from '../components/UI'

const UNIVERSITIES = ['All', 'FSR', 'ENCG', 'ENSA', 'ISCAE', 'EMI', 'FLSH', 'USMBA', 'UCA', 'UAE']
const CITIES = ['All', 'Rabat', 'Casablanca', 'Fès', 'Marrakech', 'Agadir', 'Tanger', 'Meknès']

const DEMO_USERS = [
  { uid: 'u1', displayName: 'Youssef Bennani', username: 'youssef_b', role: 'student',  university: 'FSR',   city: 'Rabat',      avgRating: 4.8, ratingCount: 6,  verified: true  },
  { uid: 'u2', displayName: 'Salma Idrissi',   username: 'salma_id',  role: 'student',  university: 'ENCG',  city: 'Casablanca', avgRating: 4.5, ratingCount: 3,  verified: true  },
  { uid: 'u3', displayName: 'Mehdi Alaoui',    username: 'mehdi_a',   role: 'student',  university: 'ENSA',  city: 'Rabat',      avgRating: null, ratingCount: 0, verified: false },
  { uid: 'u4', displayName: 'Nadia Cherkaoui', username: 'nadia_c',   role: 'student',  university: 'ISCAE', city: 'Casablanca', avgRating: 4.2, ratingCount: 8,  verified: true  },
  { uid: 'u5', displayName: 'Omar Tazi',       username: 'omar_t',    role: 'landlord', university: null,    city: 'Marrakech',  avgRating: 4.9, ratingCount: 14, verified: true  },
  { uid: 'u6', displayName: 'Fatima Zahra',    username: 'fatima_z',  role: 'student',  university: 'FLSH',  city: 'Fès',        avgRating: 3.9, ratingCount: 2,  verified: false },
]

function UserCard({ u, onView, onMessage }) {
  return (
    <div style={{
      background: colors.navyLight, border: '0.5px solid rgba(0,200,150,0.12)',
      borderRadius: 14, padding: '1.25rem', transition: 'border-color 0.2s',
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(0,200,150,0.35)'}
    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(0,200,150,0.12)'}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
        <Avatar name={u.displayName} size={46} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 2 }}>
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: colors.white }}>
              {u.displayName}
            </span>
            {u.verified && (
              <span style={{ fontSize: 10, color: colors.mint, background: 'rgba(0,200,150,0.1)', padding: '1px 6px', borderRadius: 99, border: '0.5px solid rgba(0,200,150,0.3)' }}>✓</span>
            )}
          </div>
          <div style={{ fontSize: 12, color: colors.mint, fontWeight: 600, marginBottom: 4 }}>@{u.username}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Badge variant={u.role}>{u.role}</Badge>
            {u.university && <Badge variant="other">{u.university}</Badge>}
          </div>
        </div>
      </div>

      {u.city && <div style={{ fontSize: 12, color: colors.muted, marginBottom: 10 }}>📍 {u.city}</div>}

      {u.avgRating ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
          <StarRow value={Math.round(u.avgRating)} size={13} />
          <span style={{ fontSize: 12, color: colors.muted }}>{u.avgRating} · {u.ratingCount} review{u.ratingCount !== 1 ? 's' : ''}</span>
        </div>
      ) : (
        <div style={{ fontSize: 12, color: colors.muted, marginBottom: 14 }}>No ratings yet</div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => onView(u)} style={{
          flex: 1, padding: '8px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
          border: '0.5px solid rgba(0,200,150,0.3)', background: 'transparent', color: colors.mint,
          fontFamily: 'Inter, sans-serif',
        }}>View profile</button>
        <button onClick={() => onMessage(u)} style={{
          flex: 1, padding: '8px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
          border: 'none', background: colors.mint, color: colors.navy, fontFamily: 'Inter, sans-serif',
        }}>Message</button>
      </div>
    </div>
  )
}

export default function DiscoverPage({ setPage, setSelectedUser }) {
  const { user } = useAuth()
  const [users, setUsers]   = useState(DEMO_USERS)
  const [uni, setUni]       = useState('All')
  const [city, setCity]     = useState('All')
  const [role, setRole]     = useState('All')
  const [search, setSearch] = useState('')

  useEffect(() => {
    getDocs(query(collection(db, 'users'), limit(60)))
      .then(snap => { if (!snap.empty) setUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() }))) })
      .catch(() => {})
  }, [])

  const filtered = users.filter(u => {
    if (u.uid === user?.uid) return false
    if (uni  !== 'All' && u.university !== uni)  return false
    if (city !== 'All' && u.city !== city)        return false
    if (role !== 'All' && u.role !== role)        return false
    if (search && !u.displayName?.toLowerCase().includes(search.toLowerCase()) &&
        !u.username?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const onView    = (u) => { setSelectedUser(u); setPage('profile') }
  const onMessage = (u) => { setSelectedUser(u); setPage('contact') }

  return (
    <div style={{ background: colors.navy, minHeight: '100vh', padding: '1.5rem', color: colors.white }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, margin: '0 0 4px' }}>Discover</h1>
          <p style={{ color: colors.muted, fontSize: 14, margin: 0 }}>Find students, roommates, and landlords</p>
        </div>

        <div style={{ position: 'relative', marginBottom: 16 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: colors.muted }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or @username…"
            style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px 12px 40px', border: '0.5px solid rgba(0,200,150,0.2)', borderRadius: 10, fontSize: 14, fontFamily: 'Inter, sans-serif', background: colors.navyLight, color: colors.white, outline: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          {['All', 'student', 'landlord', 'other'].map(r => (
            <button key={r} onClick={() => setRole(r)} style={{
              padding: '5px 14px', borderRadius: 99, fontSize: 12, cursor: 'pointer', textTransform: 'capitalize',
              border: `0.5px solid ${role === r ? colors.mint : 'rgba(0,200,150,0.15)'}`,
              background: role === r ? 'rgba(0,200,150,0.12)' : 'transparent',
              color: role === r ? colors.mint : colors.muted, fontWeight: role === r ? 600 : 400,
            }}>{r}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {UNIVERSITIES.map(u => (
            <button key={u} onClick={() => setUni(u)} style={{
              padding: '5px 14px', borderRadius: 99, fontSize: 12, cursor: 'pointer',
              border: `0.5px solid ${uni === u ? colors.gold : 'rgba(255,215,0,0.15)'}`,
              background: uni === u ? 'rgba(255,215,0,0.1)' : 'transparent',
              color: uni === u ? colors.gold : colors.muted, fontWeight: uni === u ? 600 : 400,
            }}>{u}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
          {CITIES.map(c => (
            <button key={c} onClick={() => setCity(c)} style={{
              padding: '5px 14px', borderRadius: 99, fontSize: 12, cursor: 'pointer',
              border: `0.5px solid ${city === c ? 'rgba(168,196,220,0.6)' : 'rgba(168,196,220,0.15)'}`,
              background: city === c ? 'rgba(168,196,220,0.1)' : 'transparent',
              color: city === c ? colors.mutedLight : colors.muted, fontWeight: city === c ? 600 : 400,
            }}>{c}</button>
          ))}
        </div>

        <div style={{ fontSize: 12, color: colors.muted, marginBottom: 14 }}>
          {filtered.length} {filtered.length === 1 ? 'person' : 'people'} found
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: 14 }}>
          {filtered.map(u => <UserCard key={u.uid} u={u} onView={onView} onMessage={onMessage} />)}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: colors.muted }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>👥</div>
              <p>No users found. Try different filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}