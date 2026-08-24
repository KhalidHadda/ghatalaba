import { useState, useEffect } from 'react'
import { collection, getDocs, query, orderBy, limit, addDoc, where } from 'firebase/firestore'
import { Bookmark, MapPin, Mail, MessageCircle, Search, Building2, Calendar, User, ArrowLeft, Check, Plus } from 'lucide-react'
import { db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../context/LanguageContext'
import { colors, Badge, StarRow, Textarea, Btn, RatingBreakdown, FluidAspectMeter } from '../components/UI'
import { ListingCardSkeleton } from '../components/Skeletons'
import { isSaved, toggleSaved } from '../lib/saved'

import { buildCities } from '../lib/cities'
import CityPicker from '../components/CityPicker'
import CountrySelect from '../components/CountrySelect'
import { normalizeText } from '../lib/normalize'
const TYPES  = ['All', 'Studio', 'Shared room', 'Apartment', 'Villa']


function BookmarkButton({ listingId, uid, size = 16 }) {
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
        cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
      }}
    >
      <Bookmark size={size} color={saved ? colors.gold : colors.white} fill={saved ? colors.gold : 'none'} />
    </button>
  )
}

function ListingCard({ l, onClick, uid }) {
  const { tCity } = useLanguage()
  const isGuest = !uid
  const handleMove = (e) => {
    if (!isGuest) return
    const el = e.currentTarget
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    const rx = (-y / rect.height) * 6
    const ry = (x / rect.width) * 6
    el.style.transform = `perspective(600px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px)`
  }

  const handleLeave = (e) => {
    const el = e.currentTarget
    el.style.transform = 'none'
    el.style.borderColor = 'rgba(0,200,150,0.12)'
  }

  return (
    <div onClick={() => onClick(l)} style={{
      background: colors.navyLight, border: '0.5px solid rgba(0,200,150,0.12)',
      borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
      transition: 'border-color 0.2s, transform 0.15s', position: 'relative',
    }}
    onMouseMove={handleMove}
    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,200,150,0.4)'; if (!isGuest) e.currentTarget.style.transform = 'translateY(-2px)' }}
    onMouseLeave={handleLeave}
    >
      <div style={{
        height: 88, background: colors.navyMid,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.mint,
        borderBottom: '0.5px solid rgba(0,200,150,0.1)', position: 'relative',
      }}>
        <Building2 size={36} />
        <div style={{ position: 'absolute', top: 8, right: 8 }}>
          <BookmarkButton listingId={l.id} uid={uid} />
        </div>
      </div>
      <div style={{ padding: '1rem' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: colors.white, marginBottom: 4 }}>{l.title}</div>
        <div style={{ fontSize: 12, color: colors.muted, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
          <MapPin size={12} color={colors.mint} /> {tCity(l.city)} {l.universityNear ? `· Near ${l.universityNear}` : l.near ? `· Near ${l.near}` : ''}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, color: colors.mint, fontSize: 16 }}>
            {l.price ? Number(l.price).toLocaleString() : '---'} <span style={{ fontWeight: 400, fontSize: 11, color: colors.muted }}>DH/mo</span>
          </span>
          <Badge variant={l.type === 'Shared room' ? 'student' : 'landlord'}>
            {l.spots || 1} spot{(l.spots || 1) > 1 ? 's' : ''}
          </Badge>
        </div>
      </div>
    </div>
  )
}

function ListingDetail({ l, onBack, setPage, setSelectedUser, uid }) {
  const { t, tCity } = useLanguage()
  const [revealed, setRevealed] = useState(false)

  const handleContact = () => {
    setSelectedUser({ uid: l.ownerUid, displayName: l.ownerName || 'Property Owner', role: l.ownerRole || 'landlord' })
    setPage('contact')
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: 580, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: colors.mint, fontSize: 14, padding: 0, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <ArrowLeft size={16} /> {t('back')}
        </button>
        <BookmarkButton listingId={l.id} uid={uid} size={20} />
      </div>

      <div style={{
        height: 160, background: colors.navyMid, borderRadius: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: colors.mint, marginBottom: 20, border: '0.5px solid rgba(0,200,150,0.15)',
      }}>
        <Building2 size={64} />
      </div>

      <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, margin: '0 0 6px', color: colors.white }}>{l.title}</h1>
      <p style={{ color: colors.muted, fontSize: 13, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 4 }}>
        <MapPin size={14} color={colors.mint} /> {tCity(l.city)}{l.neighborhood ? `, ${l.neighborhood}` : ''} {l.universityNear ? `· Near ${l.universityNear}` : l.near ? `· Near ${l.near}` : ''}
      </p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ background: 'rgba(0,200,150,0.1)', border: '0.5px solid rgba(0,200,150,0.2)', borderRadius: 12, padding: '14px 20px', flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: colors.mint, fontFamily: 'Syne, sans-serif' }}>{l.price ? Number(l.price).toLocaleString() : '---'} DH</div>
          <div style={{ fontSize: 11, color: colors.muted, marginTop: 3 }}>{t('perMonth')}</div>
        </div>
        <div style={{ background: 'rgba(255,215,0,0.08)', border: '0.5px solid rgba(255,215,0,0.2)', borderRadius: 12, padding: '14px 20px', flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: colors.gold, fontFamily: 'Syne, sans-serif' }}>{l.spots || 1}</div>
          <div style={{ fontSize: 11, color: colors.muted, marginTop: 3 }}>{t('availableSpots')}</div>
        </div>
      </div>

      {l.description && (
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: colors.white, margin: '0 0 8px' }}>{t('aboutPlace')}</h3>
          <p style={{ fontSize: 13, color: colors.mutedLight, lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{l.description}</p>
        </div>
      )}

      {l.amenities?.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: colors.white, margin: '0 0 8px' }}>{t('amenities')}</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {l.amenities.map(a => (
              <span key={a} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 99, background: 'rgba(0,200,150,0.08)', color: colors.mint, border: '0.5px solid rgba(0,200,150,0.15)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Check size={12} /> {a}
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 16, marginBottom: 24, fontSize: 12, color: colors.muted, flexWrap: 'wrap' }}>
        {l.gender && l.gender !== 'mixed' && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <User size={14} /> {l.gender === 'male' ? 'Male only' : 'Female only'}
          </span>
        )}
        {l.minStay && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Calendar size={14} /> Min. stay: {l.minStay} month{l.minStay > 1 ? 's' : ''}
          </span>
        )}
        {l.available && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Calendar size={14} /> Available from {l.available}
          </span>
        )}
      </div>

      {!revealed ? (
        <button onClick={() => { handleContact(); setRevealed(true) }} style={{
          width: '100%', padding: '14px', background: colors.mint, color: colors.navy,
          border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700,
          fontFamily: 'Inter, sans-serif', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          marginBottom: 24,
        }}>
          <Mail size={18} /> {t('messagePoster')}
        </button>
      ) : (
        <div style={{ background: 'rgba(0,200,150,0.08)', border: '0.5px solid rgba(0,200,150,0.25)', borderRadius: 12, padding: '1rem', textAlign: 'center', marginBottom: 24 }}>
          <p style={{ fontSize: 12, color: colors.muted, marginBottom: 8 }}>Message sent! Once they reply, you can continue on WhatsApp:</p>
          {l.whatsapp ? (
            <a href={`https://wa.me/${l.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: '#25D366', color: 'white',
              borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none', fontFamily: 'Inter, sans-serif',
            }}>
              <MessageCircle size={16} /> Open WhatsApp: {l.whatsapp}
            </a>
          ) : (
            <p style={{ fontSize: 12, color: colors.muted, margin: 0 }}>No WhatsApp number provided — wait for their reply in your inbox.</p>
          )}
        </div>
      )}

      {/* Property Ratings & Reviews Section */}
      <ListingReviewSection listingId={l.id} uid={uid} setPage={setPage} />
    </div>
  )
}

function ListingReviewSection({ listingId, uid, setPage }) {
  const { t } = useLanguage()
  const [reviews, setReviews]   = useState([])
  const [rating, setRating]     = useState(0)
  const [comment, setComment]   = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    if (!listingId) return
    getDocs(query(collection(db, 'listing_reviews'), where('listingId', '==', listingId)))
      .then(snap => {
        setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      })
      .catch(err => console.error(err))
  }, [listingId])

  const submitReview = async (e) => {
    e.preventDefault()
    if (!uid) {
      if (setPage) setPage('signup')
      return alert('Please sign up to rate this property.')
    }
    if (!rating) return alert('Please choose a star rating.')
    setSubmitting(true)
    try {
      const newReview = {
        listingId,
        uid,
        rating,
        comment,
        createdAt: new Date().toISOString(),
      }
      const ref = await addDoc(collection(db, 'listing_reviews'), newReview)
      setReviews(prev => [{ id: ref.id, ...newReview }, ...prev])
      setRating(0)
      setComment('')
      setShowForm(false)
    } catch (err) {
      alert('Error submitting review: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const avgScore = reviews.length ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : null

  return (
    <div style={{ borderTop: '0.5px solid rgba(0,200,150,0.15)', paddingTop: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, color: colors.white, margin: 0 }}>
            {t('propertyReviews')}
          </h3>
          {avgScore && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <StarRow value={Math.round(avgScore)} size={14} />
              <span style={{ fontSize: 12, color: colors.muted }}>{avgScore} ({reviews.length} review{reviews.length > 1 ? 's' : ''})</span>
            </div>
          )}
        </div>
        {!showForm && (
          <button onClick={() => {
            if (!uid) {
              if (setPage) setPage('signup')
              return
            }
            setShowForm(true)
          }} style={{
            background: 'rgba(0,200,150,0.1)', border: '0.5px solid rgba(0,200,150,0.3)',
            color: colors.mint, borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
          }}>
            {t('writeReview')}
          </button>
        )}
      </div>

      {avgScore && (
        <div style={{ marginBottom: 16 }}>
          <RatingBreakdown reviews={reviews} />
        </div>
      )}

      {showForm && (
        <form onSubmit={submitReview} style={{ background: colors.navyLight, padding: '1rem', borderRadius: 12, marginBottom: 16, border: '0.5px solid rgba(0,200,150,0.2)' }}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: colors.mutedLight, fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Select Rating (Hover / Click stars)
            </label>
            <StarRow value={rating} onChange={setRating} size={28} showLabel={true} />
          </div>
          <Textarea label="Review comment" value={comment} onChange={e => setComment(e.target.value)} placeholder="Share your experience with this property..." rows={3} />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Btn type="button" variant="dark" style={{ flex: 1, padding: '8px' }} onClick={() => setShowForm(false)}>{t('cancel')}</Btn>
            <Btn type="submit" style={{ flex: 1, padding: '8px' }} disabled={submitting}>
              {submitting ? 'Submitting…' : t('submitReview')}
            </Btn>
          </div>
        </form>
      )}

      {reviews.length === 0 ? (
        <p style={{ fontSize: 12, color: colors.muted }}>No reviews for this property yet. Be the first to review!</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {reviews.map(r => (
            <div key={r.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: 10, border: '0.5px solid rgba(0,200,150,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <StarRow value={r.rating} size={12} />
                <span style={{ fontSize: 10, color: colors.muted }}>
                  {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Recently'}
                </span>
              </div>
              {r.comment && <p style={{ fontSize: 12, color: colors.mutedLight, margin: 0, lineHeight: 1.5 }}>{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ListingsPage({ setPage, setSelectedUser }) {
  const { user } = useAuth()
  const { t, tCity } = useLanguage()
  const [listings, setListings] = useState([])
  const [loading, setLoading]   = useState(true)
  const [city, setCity]         = useState('All')
  const [selectedCountry, setSelectedCountry] = useState('MA')
  const [type, setType]         = useState('All')
  const [search, setSearch]     = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    getDocs(query(collection(db, 'listings'), orderBy('createdAt', 'desc'), limit(40)))
      .then(snap => { setListings(snap.docs.map(d => ({ id: d.id, ...d.data() }))) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = listings.filter(l => {
    if (l.active === false) return false
    if (city !== 'All' && !normalizeText(l.city || '').includes(normalizeText(city))) return false
    if (type !== 'All' && l.type !== type) return false
    if (search) {
      const q = normalizeText(search)
      const titleMatch = normalizeText(l.title || '').includes(q)
      const cityMatch = normalizeText(l.city || '').includes(q)
      const neighborhoodMatch = normalizeText(l.neighborhood || '').includes(q)
      const descMatch = normalizeText(l.description || '').includes(q)
      if (!titleMatch && !cityMatch && !neighborhoodMatch && !descMatch) return false
    }
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, margin: '0 0 4px' }}>{t('housingTitle')}</h1>
            <p style={{ color: colors.muted, fontSize: 14, margin: 0 }}>{t('housingSub')}</p>
          </div>
          <Btn onClick={() => setPage('myListings')} style={{ fontSize: 13, padding: '10px 18px' }}>
            <Plus size={16} /> {t('myListings')}
          </Btn>
        </div>

        <div style={{ position: 'relative', marginBottom: 16 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: colors.muted }}>
            <Search size={16} />
          </span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('searchListings')} style={{
            width: '100%', boxSizing: 'border-box', padding: '12px 14px 12px 40px',
            border: '0.5px solid rgba(0,200,150,0.2)', borderRadius: 10,
            fontSize: 14, fontFamily: 'Inter, sans-serif',
            background: colors.navyLight, color: colors.white, outline: 'none',
          }} />
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
          <div style={{ minWidth: 220 }}>
            <CountrySelect value={selectedCountry} onChange={v => setSelectedCountry(v)} />
          </div>
          <div style={{ flex: 1, minWidth: 260 }}>
            <CityPicker value={city === 'All' ? '' : city} onChange={v => setCity(v || 'All')} placeholder={t('selectCity') || 'Search or type a city'} countryCode={selectedCountry} lang={null} />
          </div>
          <div>
            <button onClick={() => { setCity('All'); setSelectedCountry('MA'); }} style={{ padding: '6px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.04)', color: colors.muted, cursor: 'pointer' }}>Reset</button>
          </div>
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
          {filtered.length} {t('listingsFound')}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px,1fr))', gap: 14 }}>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <ListingCardSkeleton key={i} />)
          ) : filtered.map(l => <ListingCard key={l.id} l={l} onClick={setSelected} uid={user?.uid} />)}
          {!loading && filtered.length === 0 && (
            <div style={{
              gridColumn: '1/-1',
              textAlign: 'center',
              padding: '3.5rem 1.5rem',
              background: colors.navyLight,
              borderRadius: 14,
              border: '0.5px dashed rgba(0,200,150,0.2)',
            }}>
              <Building2 size={40} color={colors.mint} style={{ opacity: 0.8, marginBottom: 12 }} />
              <p style={{ color: colors.mutedLight, fontSize: 14, margin: '0 0 16px' }}>{t('noListingsFound')}</p>
              <Btn onClick={() => setPage('myListings')} style={{ fontSize: 13, padding: '10px 20px' }}>
                <Plus size={16} /> {t('postFirstListing')}
              </Btn>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}