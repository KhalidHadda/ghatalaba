import { useState, useEffect } from 'react'
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import { colors, Badge } from '../components/UI'
import { isSaved, toggleSaved } from '../lib/saved'

const CITIES = ['All', 'Rabat', 'Casablanca', 'Fès', 'Marrakech', 'Agadir', 'Tanger', 'Meknès']
const TYPES  = ['All', 'Studio', 'Shared room', 'Apartment', 'Villa']

const DEMO = [
  { id:'d1', title:'Studio meublé, Agdal',        city:'Rabat',      type:'Studio',      price:1800, near:'FSR',       emoji:'🏠', spots:1 },
  { id:'d2', title:'Chambre partagée, Akkari',     city:'Rabat',      type:'Shared room', price:900,  near:'ENSA',      emoji:'🛏', spots:2 },
  { id:'d3', title:'Appartement 3 ch., Hay Riad',  city:'Rabat',      type:'Apartment',   price:3200, near:'ISCAE',     emoji:'🏢', spots:3 },
  { id:'d4', title:'Studio, Guéliz',               city:'Marrakech',  type:'Studio',      price:2100, near:'ENCG',      emoji:'🌴', spots:1 },
  { id:'d5', title:"Chambre chez l'habitant",      city:'Fès',        type:'Shared room', price:700,  near:'USMBA',     emoji:'🕌', spots:1 },
  { id:'d6', title:'Coloc 4 étudiants',            city:'Casablanca', type:'Apartment',   price:1400, near:'ENSA Casa', emoji:'🏙', spots:4 },
]

function BookmarkButton({ listingId, uid, size = 18 }) {
  const [saved, setSavedState] = useState(isSaved(uid, listingId))
  if (!uid) return null
  return (
    <button
      onClick={e => { e.stopPropagation(); setSavedState(toggleSaved(uid, listingId)) }}
      title={saved ? 'Remove from saved' : 'Save listing'}
      style={{
        background: saved ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.06)',
        border: `0.5px solid ${saved ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.15)'}`,
        borderRadius: 8, width: 32, height: 32,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', fontSize: size, flexShrink: 0, transition: 'all 0.15s',
      }}
    >
      {saved ? '🔖' : '📑'}
    </button>
  )
}

function ListingCard({ l, onClick, uid }) {
  return (
    <div onClick={() => onClick(l)} style={{
      background: colors.navyLight, border: '0.5px solid rgba(0,200,150,0.12)',
      borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
      transition: 'border-color 0.2s, transform 0.15s', position: 'relative',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,200,150,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,200,150,0.12)'; e.currentTarget.style.transform = 'none' }}
    >
      <div style={{
        height: 88, background: colors.navyMid,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38,
        borderBottom: '0.5px solid rgba(0,200,150,0.1)', position: 'relative',
      }}>
        {l.emoji || '🏠'}
        <div style={{ position: 'absolute', top: 8, right: 8 }}>
          <BookmarkButton listingId={l.id} uid={uid} />
        </div>
      </div>
      <div style={{ padding: '1rem' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: colors.white, marginBottom: 4 }}>{l.title}</div>
        <div style={{ fontSize: 12, color: colors.muted, marginBottom: 10 }}>📍 {l.city} · Near {l.near}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, color: colors.mint, fontSize: 16 }}>
            {l.price.toLocaleString()} <span style={{ fontWeight: 400, fontSize: 11, color: colors.muted }}>DH/mo</span>
          </span>
          <Badge variant={l.type === 'Shared room' ? 'student' : 'landlord'}>
            {l.spots} spot{l.spots > 1 ? 's' : ''}
          </Badge>
        </div>
      </div>
    </div>
  )
}

function ListingDetail({ l, onBack, setPage, setSelectedUser, uid }) {
  const [revealed, setRevealed] = useState(false)

  const handleContact = () => {
    setSelectedUser({ uid: l.ownerUid || 'demo', displayName: l.ownerName || 'Landlord', role: l.ownerRole || 'landlord' })
    setPage('contact')
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: 580, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: colors.mint, fontSize: 14, padding: 0, fontWeight: 600,
        }}>← Back to listings</button>
        <BookmarkButton listingId={l.id} uid={uid} size={20} />
      </div>

      <div style={{
        height: 160, background: colors.navyMid, borderRadius: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 64, marginBottom: 20, border: '0.5px solid rgba(0,200,150,0.15)',
      }}>{l.emoji || '🏠'}</div>

      <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, margin: '0 0 6px', color: colors.white }}>{l.title}</h1>
      <p style={{ color: colors.muted, fontSize: 13, margin: '0 0 20px' }}>📍 {l.city}{l.neighborhood ? `, ${l.neighborhood}` : ''} · Near {l.near}</p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ background: 'rgba(0,200,150,0.1)', border: '0.5px solid rgba(0,200,150,0.2)', borderRadius: 12, padding: '14px 20px', flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: colors.mint, fontFamily: 'Syne, sans-serif' }}>{l.price?.toLocaleString()} DH</div>
          <div style={{ fontSize: 11, color: colors.muted, marginTop: 3 }}>per month</div>
        </div>
        <div style={{ background: 'rgba(255,215,0,0.08)', border: '0.5px solid rgba(255,215,0,0.2)', borderRadius: 12, padding: '14px 20px', flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: colors.gold, fontFamily: 'Syne, sans-serif' }}>{l.spots}</div>
          <div style={{ fontSize: 11, color: colors.muted, marginTop: 3 }}>spot{l.spots > 1 ? 's' : ''} available</div>
        </div>
      </div>

      {l.description && (
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: colors.white, margin: '0 0 8px' }}>About this place</h3>
          <p style={{ fontSize: 13, color: colors.mutedLight, lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{l.description}</p>
        </div>
      )}

      {l.amenities?.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: colors.white, margin: '0 0 8px' }}>Amenities</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {l.amenities.map(a => (
              <span key={a} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 99, background: 'rgba(0,200,150,0.08)', color: colors.mint, border: '0.5px solid rgba(0,200,150,0.15)' }}>✓ {a}</span>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 16, marginBottom: 24, fontSize: 12, color: colors.muted, flexWrap: 'wrap' }}>
        {l.gender && l.gender !== 'mixed' && <span>👤 {l.gender === 'male' ? 'Male only' : 'Female only'}</span>}
        {l.minStay && <span>📅 Min. stay: {l.minStay} month{l.minStay > 1 ? 's' : ''}</span>}
        {l.available && <span>🗓 Available from {l.available}</span>}
      </div>

      {!revealed ? (
        <button onClick={() => { handleContact(); setRevealed(true) }} style={{
          width: '100%', padding: '14px', background: colors.mint, color: colors.navy,
          border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700,
          fontFamily: 'Inter, sans-serif', cursor: 'pointer',
        }}>
          ✉️ Message {l.ownerRole === 'landlord' ? 'landlord' : 'poster'} to get contact info
        </button>
      ) : (
        <div style={{ background: 'rgba(0,200,150,0.08)', border: '0.5px solid rgba(0,200,150,0.25)', borderRadius: 12, padding: '1rem', textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: colors.muted, marginBottom: 8 }}>Message sent! Once they reply, you can continue on WhatsApp:</p>
          {l.whatsapp ? (
            <a href={`https://wa.me/${l.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-block', padding: '10px 20px', background: '#25D366', color: 'white',
              borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none', fontFamily: 'Inter, sans-serif',
            }}>💬 Open WhatsApp: {l.whatsapp}</a>
          ) : (
            <p style={{ fontSize: 12, color: colors.muted, margin: 0 }}>No WhatsApp number provided — wait for their reply in your inbox.</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function ListingsPage({ setPage, setSelectedUser }) {
  const { user } = useAuth()
  const [listings, setListings] = useState(DEMO)
  const [city, setCity]         = useState('All')
  const [type, setType]         = useState('All')
  const [search, setSearch]     = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    getDocs(query(collection(db, 'listings'), orderBy('createdAt', 'desc'), limit(40)))
      .then(snap => { if (!snap.empty) setListings(snap.docs.map(d => ({ id: d.id, ...d.data() }))) })
      .catch(() => {})
  }, [])

  const filtered = listings.filter(l => {
    if (l.active === false) return false
    if (city !== 'All' && l.city !== city) return false
    if (type !== 'All' && l.type !== type) return false
    if (search && !l.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  if (selected) return (
    <div style={{ background: colors.navy, minHeight: '100vh', color: colors.white }}>
      <ListingDetail l={selected} onBack={() => setSelected(null)} setPage={setPage} setSelectedUser={setSelectedUser} uid={user?.uid} />
    </div>
  )

  return (
    <div style={{ background: colors.navy, minHeight: '100vh', padding: '1.5rem', color: colors.white }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, margin: '0 0 4px' }}>Find housing</h1>
          <p style={{ color: colors.muted, fontSize: 14, margin: 0 }}>Rooms, studios and apartments near your campus</p>
        </div>

        <div style={{ position: 'relative', marginBottom: 16 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: colors.muted, fontSize: 16 }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search listings…" style={{
            width: '100%', boxSizing: 'border-box', padding: '12px 14px 12px 40px',
            border: '0.5px solid rgba(0,200,150,0.2)', borderRadius: 10,
            fontSize: 14, fontFamily: 'Inter, sans-serif',
            background: colors.navyLight, color: colors.white, outline: 'none',
          }} />
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {CITIES.map(c => (
            <button key={c} onClick={() => setCity(c)} style={{
              padding: '5px 14px', borderRadius: 99, fontSize: 12, cursor: 'pointer',
              border: `0.5px solid ${city === c ? colors.mint : 'rgba(0,200,150,0.15)'}`,
              background: city === c ? 'rgba(0,200,150,0.12)' : 'transparent',
              color: city === c ? colors.mint : colors.muted, fontWeight: city === c ? 600 : 400,
            }}>{c}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
          {TYPES.map(t => (
            <button key={t} onClick={() => setType(t)} style={{
              padding: '5px 14px', borderRadius: 99, fontSize: 12, cursor: 'pointer',
              border: `0.5px solid ${type === t ? colors.gold : 'rgba(255,215,0,0.15)'}`,
              background: type === t ? 'rgba(255,215,0,0.1)' : 'transparent',
              color: type === t ? colors.gold : colors.muted, fontWeight: type === t ? 600 : 400,
            }}>{t}</button>
          ))}
        </div>

        <div style={{ fontSize: 12, color: colors.muted, marginBottom: 14 }}>
          {filtered.length} listing{filtered.length !== 1 ? 's' : ''} found
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px,1fr))', gap: 14 }}>
          {filtered.map(l => <ListingCard key={l.id} l={l} onClick={setSelected} uid={user?.uid} />)}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: colors.muted }}>
              No listings found. Try different filters.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}