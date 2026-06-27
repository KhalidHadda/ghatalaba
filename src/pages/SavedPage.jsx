import { useState, useEffect } from 'react'
import { collection, getDocs, query, where, documentId } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import { colors, Badge, Btn } from '../components/UI'
import { getSavedIds } from '../lib/saved'

export default function SavedPage({ setPage }) {
  const { user } = useAuth()
  const [listings, setListings] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    const ids = getSavedIds(user.uid)
    if (ids.length === 0) { setListings([]); setLoading(false); return }
    getDocs(query(collection(db, 'listings'), where(documentId(), 'in', ids.slice(0, 30))))
      .then(snap => setListings(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  if (!user) return (
    <div style={{ background: colors.navy, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: colors.muted }}>
        <p style={{ marginBottom: 16 }}>Sign in to see your saved listings.</p>
        <Btn onClick={() => setPage('login')}>Sign in</Btn>
      </div>
    </div>
  )

  return (
    <div style={{ background: colors.navy, minHeight: '100vh', padding: '1.5rem', color: colors.white }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, margin: '0 0 4px' }}>Saved listings</h1>
          <p style={{ color: colors.muted, fontSize: 14, margin: 0 }}>Places you've bookmarked to come back to</p>
        </div>

        {loading ? (
          <p style={{ color: colors.muted, textAlign: 'center', padding: '3rem' }}>Loading…</p>
        ) : listings.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '4rem',
            border: '0.5px dashed rgba(0,200,150,0.15)', borderRadius: 14, color: colors.muted,
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔖</div>
            <p style={{ marginBottom: 16 }}>No saved listings yet. Tap the bookmark icon on any listing to save it.</p>
            <Btn onClick={() => setPage('listings')}>Browse listings</Btn>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px,1fr))', gap: 14 }}>
            {listings.map(l => (
              <div key={l.id} onClick={() => setPage('listings')} style={{
                background: colors.navyLight, border: '0.5px solid rgba(0,200,150,0.12)',
                borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
              }}>
                <div style={{ height: 88, background: colors.navyMid, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38 }}>
                  {l.emoji || '🏠'}
                </div>
                <div style={{ padding: '1rem' }}>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: colors.white, marginBottom: 4 }}>{l.title}</div>
                  <div style={{ fontSize: 12, color: colors.muted, marginBottom: 10 }}>📍 {l.city} · Near {l.near}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: colors.mint, fontSize: 16 }}>
                      {l.price?.toLocaleString()} <span style={{ fontWeight: 400, fontSize: 11, color: colors.muted }}>DH/mo</span>
                    </span>
                    <Badge variant={l.type === 'Shared room' ? 'student' : 'landlord'}>{l.spots} spot{l.spots > 1 ? 's' : ''}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}