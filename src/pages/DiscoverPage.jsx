import { useState, useEffect } from 'react'
import { collection, getDocs, query, limit, addDoc, where, doc, updateDoc } from 'firebase/firestore'
import { MapPin, Search, Check, Map, GraduationCap, Star, X, Zap, Sliders, Sparkles } from 'lucide-react'
import { db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../context/LanguageContext'
import { calculateCompatibility } from '../lib/compatibility'
import { colors, Avatar, Badge, StarRow, Btn, Textarea, FluidAspectMeter, RatingBreakdown, OnlineStatusBadge, isOnlineUser } from '../components/UI'
import { Skeleton } from '../components/Skeletons'
import AreaSearchMap from '../components/AreaSearchMap'
import { normalizeText } from '../lib/normalize'

const UNIVERSITIES = ['All', 'FSR', 'ENCG', 'ENSA', 'ISCAE', 'EMI', 'FLSH', 'USMBA', 'UCA', 'UAE']
import { buildCities } from '../lib/cities'
const CITIES = buildCities()

function RoommatePreferencesModal({ onClose, user, profile, setProfile }) {
  const { t } = useLanguage()
  const [sleepSchedule, setSleepSchedule] = useState(profile?.sleepSchedule || 'earlyBird')
  const [cleanliness, setCleanliness]     = useState(profile?.cleanliness || 'strict')
  const [studyVibe, setStudyVibe]         = useState(profile?.studyVibe || 'quietFocus')
  const [saving, setSaving]               = useState(false)

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      const updated = {
        ...profile,
        sleepSchedule,
        cleanliness,
        studyVibe,
      }
      await updateDoc(doc(db, 'users', user.uid), { sleepSchedule, cleanliness, studyVibe })
      if (setProfile) setProfile(updated)
      onClose()
    } catch (err) {
      alert('Error updating preferences: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(5, 12, 24, 0.85)',
      backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
    }}>
      <div style={{
        background: colors.navyLight, border: '0.5px solid rgba(0,200,150,0.25)',
        borderRadius: 16, width: '100%', maxWidth: 480, padding: '1.5rem',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)', color: colors.white,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sliders size={20} color={colors.mint} />
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, margin: 0 }}>
              {t('myPreferences')}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: colors.muted, cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: colors.muted, display: 'block', marginBottom: 6 }}>{t('sleepSchedule')}</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { id: 'earlyBird', label: t('earlyBird') },
                { id: 'nightOwl', label: t('nightOwl') },
                { id: 'flexible', label: t('flexible') },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setSleepSchedule(opt.id)}
                  style={{
                    padding: '8px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                    border: `0.5px solid ${sleepSchedule === opt.id ? colors.mint : 'rgba(255,255,255,0.1)'}`,
                    background: sleepSchedule === opt.id ? 'rgba(0,200,150,0.15)' : 'rgba(255,255,255,0.03)',
                    color: sleepSchedule === opt.id ? colors.mint : colors.muted, fontWeight: sleepSchedule === opt.id ? 700 : 400,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, color: colors.muted, display: 'block', marginBottom: 6 }}>{t('cleanliness')}</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { id: 'strict', label: t('strict') },
                { id: 'moderate', label: t('moderate') },
                { id: 'relaxed', label: t('relaxed') },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setCleanliness(opt.id)}
                  style={{
                    padding: '8px', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                    border: `0.5px solid ${cleanliness === opt.id ? colors.mint : 'rgba(255,255,255,0.1)'}`,
                    background: cleanliness === opt.id ? 'rgba(0,200,150,0.15)' : 'rgba(255,255,255,0.03)',
                    color: cleanliness === opt.id ? colors.mint : colors.muted, fontWeight: cleanliness === opt.id ? 700 : 400,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, color: colors.muted, display: 'block', marginBottom: 6 }}>{t('studyVibe')}</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { id: 'quietFocus', label: t('quietFocus') },
                { id: 'socialStudy', label: t('socialStudy') },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setStudyVibe(opt.id)}
                  style={{
                    padding: '8px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                    border: `0.5px solid ${studyVibe === opt.id ? colors.mint : 'rgba(255,255,255,0.1)'}`,
                    background: studyVibe === opt.id ? 'rgba(0,200,150,0.15)' : 'rgba(255,255,255,0.03)',
                    color: studyVibe === opt.id ? colors.mint : colors.muted, fontWeight: studyVibe === opt.id ? 700 : 400,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <Btn variant="dark" style={{ flex: 1 }} onClick={onClose}>{t('cancel')}</Btn>
            <Btn style={{ flex: 1 }} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : t('save')}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  )
}

function CompatibilityModal({ onClose, targetUser, currentUser }) {
  const { t } = useLanguage()
  const comp = calculateCompatibility(currentUser, targetUser)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(5, 12, 24, 0.85)',
      backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
    }}>
      <div style={{
        background: colors.navyLight, border: '0.5px solid rgba(0,200,150,0.3)',
        borderRadius: 16, width: '100%', maxWidth: 440, padding: '1.5rem',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)', color: colors.white, textAlign: 'center',
      }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: colors.muted, cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: 99, background: 'rgba(0,200,150,0.15)', border: '1px solid rgba(0,200,150,0.3)', marginBottom: 12 }}>
          <Zap size={32} color={colors.mint} />
        </div>

        <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22, margin: '0 0 4px', color: colors.white }}>
          {comp.percentage}% {t('matchPercentage')}
        </h3>
        <p style={{ fontSize: 13, color: colors.muted, margin: '0 0 16px' }}>
          Roommate compatibility between you & <strong>{targetUser?.displayName}</strong>
        </p>

        {/* Fluid Aspect Meters */}
        <div style={{ textTransform: 'none', textAlign: 'left', marginBottom: 16 }}>
          <FluidAspectMeter label="Overall Roommate Match" value={comp.percentage} color="mint" icon={Zap} />
          <FluidAspectMeter label="Location & University" value={currentUser?.university === targetUser?.university ? 95 : 75} color="cyan" icon={MapPin} />
          <FluidAspectMeter label="Lifestyle & Cleanliness" value={currentUser?.cleanliness === targetUser?.cleanliness ? 90 : 70} color="gold" icon={Sparkles} />
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(0,200,150,0.15)', borderRadius: 12, padding: '1rem', textAlign: 'left', marginBottom: 16 }}>
          <h4 style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: colors.mint, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={14} /> {t('compatBreakdown')}
          </h4>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: colors.mutedLight, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {comp.reasons.map((r, i) => (
              <li key={i} style={{ lineHeight: 1.4 }}>{r}</li>
            ))}
          </ul>
        </div>

        <Btn onClick={onClose} style={{ width: '100%' }}>
          Got it
        </Btn>
      </div>
    </div>
  )
}

function UniversityReviewsModal({ onClose, user, setPage }) {
  const [selectedUni, setSelectedUni] = useState('FSR')
  const [uniReviews, setUniReviews] = useState([])
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const uniList = UNIVERSITIES.filter(u => u !== 'All')

  useEffect(() => {
    if (!selectedUni) return
    getDocs(query(collection(db, 'uni_reviews'), where('uniName', '==', selectedUni)))
      .then(snap => setUniReviews(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(err => console.error(err))
  }, [selectedUni])

  const submitUniReview = async (e) => {
    e.preventDefault()
    if (!user) {
      if (setPage) setPage('signup')
      return alert('Please sign up to rate a university.')
    }
    if (!rating) return alert('Please select a star rating.')
    setSubmitting(true)
    try {
      const newReview = {
        uniName: selectedUni,
        uid: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Student',
        rating,
        comment,
        createdAt: new Date().toISOString(),
      }
      const ref = await addDoc(collection(db, 'uni_reviews'), newReview)
      setUniReviews(prev => [{ id: ref.id, ...newReview }, ...prev])
      setRating(0)
      setComment('')
    } catch (err) {
      alert('Error submitting university rating: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const avgUniRating = uniReviews.length ? (uniReviews.reduce((acc, r) => acc + r.rating, 0) / uniReviews.length).toFixed(1) : null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(5, 12, 24, 0.85)',
      backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
    }}>
      <div style={{
        background: colors.navyLight, border: '0.5px solid rgba(0,200,150,0.2)',
        borderRadius: 16, width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto',
        padding: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', color: colors.white,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <GraduationCap size={22} color={colors.gold} />
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, margin: 0 }}>
              University Ratings & Reviews
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: colors.muted, cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {uniList.map(u => (
            <button key={u} onClick={() => setSelectedUni(u)} style={{
              padding: '6px 12px', borderRadius: 99, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              border: `0.5px solid ${selectedUni === u ? colors.gold : 'rgba(255,215,0,0.2)'}`,
              background: selectedUni === u ? 'rgba(255,215,0,0.15)' : 'transparent',
              color: selectedUni === u ? colors.gold : colors.muted, fontWeight: selectedUni === u ? 700 : 400,
            }}>{u}</button>
          ))}
        </div>

        <div style={{ background: 'rgba(255,215,0,0.05)', border: '0.5px solid rgba(255,215,0,0.15)', padding: '1rem', borderRadius: 12, marginBottom: 16 }}>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, color: colors.gold, margin: '0 0 4px' }}>
            {selectedUni}
          </h3>
          {avgUniRating ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <StarRow value={Math.round(avgUniRating)} size={16} />
              <span style={{ fontSize: 13, color: colors.white, fontWeight: 700 }}>{avgUniRating} / 5</span>
              <span style={{ fontSize: 12, color: colors.muted }}>({uniReviews.length} student review{uniReviews.length > 1 ? 's' : ''})</span>
            </div>
          ) : (
            <span style={{ fontSize: 12, color: colors.muted }}>No student reviews yet for {selectedUni}.</span>
          )}
        </div>

        {!user ? (
          <div style={{ background: 'rgba(255,215,0,0.06)', border: '0.5px solid rgba(255,215,0,0.25)', padding: '1rem', borderRadius: 12, marginBottom: 16, textAlign: 'center' }}>
            <h4 style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: colors.gold, margin: '0 0 6px' }}>
              Sign up to review {selectedUni}
            </h4>
            <p style={{ fontSize: 12, color: colors.muted, margin: '0 0 12px' }}>
              Please sign up first to submit ratings and reviews for Moroccan universities.
            </p>
            <Btn onClick={() => { onClose(); if (setPage) setPage('signup') }}>
              Sign up to write a review
            </Btn>
          </div>
        ) : (
          <form onSubmit={submitUniReview} style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(0,200,150,0.15)', padding: '1rem', borderRadius: 12, marginBottom: 16 }}>
            <h4 style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: colors.white, margin: '0 0 10px' }}>
              Rate & Review {selectedUni}
            </h4>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12, color: colors.muted, display: 'block', marginBottom: 4 }}>Star Rating</label>
              <StarRow value={rating} onChange={setRating} size={24} />
            </div>
            <Textarea label="Your Experience" value={comment} onChange={e => setComment(e.target.value)} placeholder={`How is the campus, professors, housing near ${selectedUni}?`} rows={3} />
            <Btn type="submit" style={{ width: '100%', marginTop: 8 }} disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit Review'}
            </Btn>
          </form>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {uniReviews.map(r => (
            <div key={r.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: 10, border: '0.5px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: colors.mint }}>{r.userName}</span>
                <StarRow value={r.rating} size={12} />
              </div>
              {r.comment && <p style={{ fontSize: 12, color: colors.mutedLight, margin: 0, lineHeight: 1.5 }}>{r.comment}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function UserCard({ u, onView, onMessage, currentUser, onOpenCompat }) {
  const { t, tCity } = useLanguage()
  const comp = calculateCompatibility(currentUser, u)

  return (
    <div style={{
      background: colors.navyLight, border: '0.5px solid rgba(0,200,150,0.12)',
      borderRadius: 14, padding: '1.25rem', transition: 'border-color 0.2s', position: 'relative',
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(0,200,150,0.35)'}
    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(0,200,150,0.12)'}
    >
      <button
        onClick={() => onOpenCompat(u)}
        title={t('whyMatch')}
        style={{
          position: 'absolute', top: 12, right: 12,
          background: 'rgba(0,200,150,0.15)', border: '0.5px solid rgba(0,200,150,0.4)',
          borderRadius: 99, padding: '3px 9px', color: colors.mint, fontSize: 11, fontWeight: 800,
          display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer',
        }}
      >
        <Zap size={11} color={colors.mint} /> {comp.percentage}% {t('matchPercentage')}
      </button>

      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12, paddingRight: 80 }}>
        <Avatar name={u.displayName} size={46} isOnline={isOnlineUser(u)} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 2 }}>
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: colors.white }}>
              {u.displayName}
            </span>
            {u.verified && (
              <span style={{ fontSize: 10, color: colors.mint, background: 'rgba(0,200,150,0.1)', padding: '1px 6px', borderRadius: 99, border: '0.5px solid rgba(0,200,150,0.3)', display: 'inline-flex', alignItems: 'center' }}>
                <Check size={10} />
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: colors.mint, fontWeight: 600, marginBottom: 4 }}>@{u.username}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <Badge variant={u.role}>{u.role}</Badge>
            {u.university && <Badge variant="other">{u.university}</Badge>}
            <OnlineStatusBadge isOnline={isOnlineUser(u)} size="sm" />
          </div>
        </div>
      </div>

      {u.city && (
        <div style={{ fontSize: 12, color: colors.muted, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
          <MapPin size={12} color={colors.mint} /> {tCity(u.city)}
        </div>
      )}

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
        }}>{t('viewProfile')}</button>
        <button onClick={() => onMessage(u)} style={{
          flex: 1, padding: '8px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
          border: 'none', background: colors.mint, color: colors.navy, fontFamily: 'Inter, sans-serif',
        }}>{t('messageStudent')}</button>
      </div>
    </div>
  )
}

export default function DiscoverPage({ setPage, setSelectedUser }) {
  const { user, profile, setProfile } = useAuth()
  const { t, tCity } = useLanguage()

  const [users, setUsers]   = useState([])
  const [uni, setUni]       = useState('All')
  const [city, setCity]     = useState('All')
  const [role, setRole]     = useState('All')
  const [search, setSearch] = useState('')
  const [radiusKm, setRadiusKm] = useState(5)
  const [showMap, setShowMap]   = useState(false)
  const [showUniModal, setShowUniModal] = useState(false)
  const [showPrefModal, setShowPrefModal] = useState(false)
  const [selectedCompatUser, setSelectedCompatUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDocs(query(collection(db, 'users'), limit(60)))
      .then(snap => { 
        setUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() })))
        setLoading(false)
      })
      .catch(err => { console.error(err); setLoading(false) })
  }, [])

  const filtered = users.filter(u => {
    if (u.uid === user?.uid) return false
    if (uni  !== 'All' && u.university !== uni)  return false
    if (city !== 'All' && u.city !== city)        return false
    if (role !== 'All' && u.role !== role)        return false
    if (search && !normalizeText(u.displayName || '').includes(normalizeText(search)) &&
        !normalizeText(u.username || '').includes(normalizeText(search))) return false
    return true
  })

  const onView    = (u) => { setSelectedUser(u); setPage('profile') }
  const onMessage = (u) => { 
    setSelectedUser(u)
    if (user) {
      setPage('inbox')
    } else {
      setPage('contact')
    }
  }

  return (
    <div style={{ background: colors.navy, minHeight: '100vh', padding: '1.5rem', color: colors.white }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>

        <div style={{ marginBottom: 24, position: 'relative', zIndex: 10 }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, margin: '0 0 4px' }}>
            {t('discoverTitle')}
          </h1>
          <p style={{ color: colors.muted, fontSize: 14, margin: 0 }}>
            {t('discoverSub')}
          </p>
        </div>

        <div style={{ marginBottom: 16, position: 'relative', zIndex: 10, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Btn 
            variant={showMap ? 'dark' : 'ghost'} 
            onClick={() => setShowMap(!showMap)}
            style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Map size={14} /> {showMap ? 'Close map' : 'Search by location'}
          </Btn>

          <Btn 
            variant="ghost" 
            onClick={() => user ? setShowUniModal(true) : setPage('signup')}
            style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6, color: colors.gold, borderColor: 'rgba(255,215,0,0.3)' }}
          >
            <GraduationCap size={15} color={colors.gold} /> Rate & Review Universities
          </Btn>

          <Btn
            variant="ghost"
            onClick={() => user ? setShowPrefModal(true) : setPage('login')}
            style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6, color: colors.mint, borderColor: 'rgba(0,200,150,0.3)' }}
          >
            <Sliders size={14} /> {t('myPreferences')}
          </Btn>
        </div>

        {showMap && (
          <div style={{ marginBottom: 24, background: colors.navyLight, padding: '1.25rem', borderRadius: 16, border: '0.5px solid rgba(0,200,150,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: colors.mint, fontFamily: 'Syne, sans-serif' }}>
                Interactive Map & Radius Filter
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: colors.muted }}>Radius: {radiusKm} km</span>
                <input 
                  type="range" min="1" max="25" value={radiusKm} 
                  onChange={e => setRadiusKm(Number(e.target.value))}
                  style={{ accentColor: colors.mint, cursor: 'pointer' }}
                />
              </div>
            </div>
            <AreaSearchMap users={filtered} radiusKm={radiusKm} onViewUser={onView} />
          </div>
        )}

        <div style={{ background: colors.navyLight, padding: '1.25rem', borderRadius: 16, border: '0.5px solid rgba(0,200,150,0.12)', marginBottom: 24, position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} color={colors.muted} style={{ position: 'absolute', left: 12, top: 12 }} />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or @username..."
                style={{
                  width: '100%', padding: '10px 10px 10px 36px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(0,200,150,0.2)',
                  color: colors.white, outline: 'none', fontSize: 13, fontFamily: 'Inter, sans-serif',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: colors.muted, display: 'block', marginBottom: 4 }}>University</label>
              <select value={uni} onChange={e => setUni(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(0,200,150,0.2)', color: colors.white, outline: 'none', fontSize: 12 }}>
                {UNIVERSITIES.map(u => <option key={u} value={u} style={{ background: colors.navy }}>{u}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: colors.muted, display: 'block', marginBottom: 4 }}>{t('cityLabel') || 'City'}</label>
              <select value={city} onChange={e => setCity(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(0,200,150,0.2)', color: colors.white, outline: 'none', fontSize: 12 }}>
                {CITIES.map(c => <option key={c} value={c} style={{ background: colors.navy }}>{c === 'All' ? t('allCities') : tCity(c)}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: colors.muted, display: 'block', marginBottom: 4 }}>Role</label>
              <select value={role} onChange={e => setRole(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(0,200,150,0.2)', color: colors.white, outline: 'none', fontSize: 12 }}>
                {['All', 'student', 'landlord', 'agent'].map(r => <option key={r} value={r} style={{ background: colors.navy }}>{r}</option>)}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ background: colors.navyLight, padding: '1.25rem', borderRadius: 14, border: '0.5px solid rgba(0,200,150,0.12)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <Skeleton width="46px" height="46px" borderRadius="50%" />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <Skeleton width="60%" height="16px" />
                    <Skeleton width="40%" height="12px" />
                  </div>
                </div>
                <Skeleton width="80%" height="14px" />
                <Skeleton width="50%" height="12px" />
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <Skeleton width="50%" height="32px" borderRadius="8px" />
                  <Skeleton width="50%" height="32px" borderRadius="8px" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: colors.navyLight, borderRadius: 16, border: '0.5px dashed rgba(0,200,150,0.15)', color: colors.muted }}>
            <p style={{ margin: 0, fontSize: 14 }}>No profiles match your search criteria.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, position: 'relative', zIndex: 10 }}>
            {filtered.map(u => (
              <UserCard
                key={u.uid}
                u={u}
                onView={onView}
                onMessage={onMessage}
                currentUser={profile}
                onOpenCompat={setSelectedCompatUser}
              />
            ))}
          </div>
        )}

        {showUniModal && <UniversityReviewsModal onClose={() => setShowUniModal(false)} user={user} setPage={setPage} />}
        {showPrefModal && <RoommatePreferencesModal onClose={() => setShowPrefModal(false)} user={user} profile={profile} setProfile={setProfile} />}
        {selectedCompatUser && <CompatibilityModal onClose={() => setSelectedCompatUser(null)} targetUser={selectedCompatUser} currentUser={profile} />}
      </div>
    </div>
  )
}
