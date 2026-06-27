import { useState, useEffect } from 'react'
import { collection, getDocs, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import { colors, Badge, Btn } from '../components/UI'

function MyListingCard({ l, onToggleActive, onDelete }) {
  return (
    <div style={{
      background: colors.navyLight, border: '0.5px solid rgba(0,200,150,0.12)',
      borderRadius: 14, padding: '1.25rem', opacity: l.active === false ? 0.55 : 1,
      transition: 'opacity 0.2s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: colors.white, marginBottom: 4 }}>
            {l.title}
          </div>
          <div style={{ fontSize: 12, color: colors.muted }}>📍 {l.city} · Near {l.near}</div>
        </div>
        <Badge variant={l.active === false ? 'other' : 'student'}>
          {l.active === false ? 'Inactive' : 'Live'}
        </Badge>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
        <div>
          <div style={{ fontWeight: 700, color: colors.mint, fontSize: 16 }}>{l.price?.toLocaleString()} <span style={{ fontSize: 11, color: colors.muted, fontWeight: 400 }}>DH/mo</span></div>
        </div>
        <div style={{ borderLeft: '0.5px solid rgba(0,200,150,0.15)', paddingLeft: 16 }}>
          <div style={{ fontWeight: 700, color: colors.gold, fontSize: 16 }}>{l.spots} <span style={{ fontSize: 11, color: colors.muted, fontWeight: 400 }}>spot{l.spots > 1 ? 's' : ''}</span></div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => onToggleActive(l)} style={{
          flex: 1, padding: '8px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
          border: '0.5px solid rgba(0,200,150,0.3)', background: 'transparent', color: colors.mint,
          fontFamily: 'Inter, sans-serif',
        }}>
          {l.active === false ? 'Reactivate' : 'Deactivate'}
        </button>
        <button onClick={() => onDelete(l)} style={{
          flex: 1, padding: '8px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
          border: '0.5px solid rgba(255,107,107,0.3)', background: 'transparent', color: '#FF6B6B',
          fontFamily: 'Inter, sans-serif',
        }}>
          Delete
        </button>
      </div>
    </div>
  )
}

export default function MyListingsPage({ setPage }) {
  const { user } = useAuth()
  const [listings, setListings] = useState([])
  const [loading, setLoading]   = useState(true)

  const fetchMine = () => {
    if (!user) return
    setLoading(true)
    getDocs(query(collection(db, 'listings'), where('ownerUid', '==', user.uid)))
      .then(snap => setListings(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(fetchMine, [user])

  const onToggleActive = async (l) => {
    const newActive = l.active === false ? true : false
    await updateDoc(doc(db, 'listings', l.id), { active: newActive })
    setListings(ls => ls.map(x => x.id === l.id ? { ...x, active: newActive } : x))
  }

  const onDelete = async (l) => {
    if (!window.confirm(`Delete "${l.title}"? This can't be undone.`)) return
    await deleteDoc(doc(db, 'listings', l.id))
    setListings(ls => ls.filter(x => x.id !== l.id))
  }

  if (!user) return (
    <div style={{ background: colors.navy, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: colors.muted }}>
        <p style={{ marginBottom: 16 }}>Sign in to manage your listings.</p>
        <Btn onClick={() => setPage('login')}>Sign in</Btn>
      </div>
    </div>
  )

  return (
    <div style={{ background: colors.navy, minHeight: '100vh', padding: '1.5rem', color: colors.white }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, margin: '0 0 4px' }}>My listings</h1>
            <p style={{ color: colors.muted, fontSize: 14, margin: 0 }}>Manage what you've posted</p>
          </div>
          <Btn onClick={() => setPage('createListing')}>+ New listing</Btn>
        </div>

        {loading ? (
          <p style={{ color: colors.muted, textAlign: 'center', padding: '3rem' }}>Loading…</p>
        ) : listings.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '4rem',
            border: '0.5px dashed rgba(0,200,150,0.15)', borderRadius: 14, color: colors.muted,
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🏠</div>
            <p style={{ marginBottom: 16 }}>You haven't posted any listings yet.</p>
            <Btn onClick={() => setPage('createListing')}>Post your first listing</Btn>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 14 }}>
            {listings.map(l => (
              <MyListingCard key={l.id} l={l} onToggleActive={onToggleActive} onDelete={onDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  )             
}