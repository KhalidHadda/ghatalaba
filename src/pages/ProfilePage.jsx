import { useState, useEffect } from 'react'
import { doc, updateDoc, collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore'
import { Star, Check, Edit2, Mail, GraduationCap } from 'lucide-react'
import { db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import { colors, Avatar, Badge, StarRow, TraitSlider, Btn, Input, Textarea, FluidAspectMeter, RatingBreakdown, OnlineStatusBadge, isOnlineUser } from '../components/UI'

const TRAITS = [
  { name: 'cleanliness', label: 'Cleanliness' },
  { name: 'noise',       label: 'Noise level (low = quiet)' },
  { name: 'payment',     label: 'Pays on time' },
  { name: 'social',      label: 'Social & respectful' },
]

function RatingForm({ targetUid, targetName, onDone, setPage }) {
  const { user } = useAuth()
  const [overall, setOverall] = useState(0)
  const [traits, setTraits]   = useState({ cleanliness: 3, noise: 3, payment: 3, social: 3 })
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)
  const setTrait = (k, v) => setTraits(t => ({ ...t, [k]: v }))

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '1.5rem' }}>
        <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, color: colors.white, marginBottom: 6 }}>
          Sign up required
        </p>
        <p style={{ fontSize: 13, color: colors.muted, marginBottom: 16 }}>
          You must sign up or log in first to rate roommates.
        </p>
        <Btn style={{ width: '100%' }} onClick={() => setPage?.('signup')}>
          Sign up to rate roommate
        </Btn>
      </div>
    )
  }

  const submit = async () => {
    if (!overall) return alert('Please give an overall star rating.')
    setLoading(true)
    try {
      await addDoc(collection(db, 'ratings'), { fromUid: user.uid, targetUid, overall, traits, comment, createdAt: serverTimestamp() })
      const snap = await getDocs(query(collection(db, 'ratings'), where('targetUid', '==', targetUid)))
      const all = snap.docs.map(d => d.data().overall)
      const avg = all.reduce((a,b) => a+b, 0) / all.length
      await updateDoc(doc(db, 'users', targetUid), { avgRating: Math.round(avg*10)/10, ratingCount: all.length })
      setDone(true); setTimeout(onDone, 1200)
    } catch (err) { alert('Error: ' + err.message) }
    finally { setLoading(false) }
  }

  if (done) return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <div style={{ color: colors.gold, marginBottom: 8 }}><Star size={36} fill={colors.gold} /></div>
      <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: colors.mint, marginTop: 10 }}>Rating submitted!</p>
    </div>
  )

  return (
    <div>
      <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, margin: '0 0 4px', fontSize: 16, color: colors.white }}>
        Rate {targetName} as a roommate
      </h3>
      <p style={{ fontSize: 12, color: colors.muted, marginBottom: 18 }}>Your review helps other students make better decisions.</p>
      <p style={{ fontSize: 12, fontWeight: 600, color: colors.mutedLight, marginBottom: 8 }}>Overall rating</p>
      <StarRow value={overall} onChange={setOverall} size={30} />
      <div style={{ marginTop: 20 }}>
        {TRAITS.map(t => <TraitSlider key={t.name} label={t.label} name={t.name} value={traits[t.name]} onChange={setTrait} />)}
      </div>
      <Textarea label="Comment (optional)" value={comment} onChange={e => setComment(e.target.value)} placeholder="What was it like living with them?" />
      <Btn style={{ width: '100%' }} onClick={submit} disabled={loading}>
        {loading ? 'Submitting…' : 'Submit rating'}
      </Btn>
    </div>
  )
}

function RatingCard({ r }) {
  return (
    <div style={{ borderBottom: '0.5px solid rgba(0,200,150,0.1)', paddingBottom: 14, marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <StarRow value={r.overall} size={16} />
        <span style={{ fontSize: 11, color: colors.muted }}>{r.createdAt?.toDate?.()?.toLocaleDateString?.() || 'Recently'}</span>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', marginBottom: 10 }}>
        {TRAITS.map(t => {
          const val = r.traits?.[t.name] || 3
          return (
            <FluidAspectMeter 
              key={t.name}
              label={t.label} 
              value={val} 
              maxValue={5} 
              unit="/5" 
              color={val >= 4 ? 'mint' : val >= 3 ? 'cyan' : 'gold'}
            />
          )
        })}
      </div>

      {r.comment && <p style={{ fontSize: 13, color: colors.mutedLight, margin: 0, fontStyle: 'italic' }}>"{r.comment}"</p>}
    </div>
  )
}

export default function ProfilePage({ setPage, targetUser }) {
  const { user, profile, setProfile } = useAuth()
  const isOwn   = !targetUser || targetUser?.uid === user?.uid
  const subject = isOwn ? profile : targetUser
  const online  = isOnlineUser(subject)

  const [ratings, setRatings]           = useState([])
  const [showRateForm, setShowRateForm] = useState(false)
  const [editMode, setEditMode]         = useState(false)
  const [editName, setEditName]         = useState(subject?.displayName || '')
  const [editUni, setEditUni]           = useState(subject?.university || '')

  useEffect(() => {
    const uid = subject?.uid || user?.uid
    if (!uid) return
    getDocs(query(collection(db, 'ratings'), where('targetUid', '==', uid)))
      .then(snap => setRatings(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(() => {})
  }, [subject, user])

  const saveProfile = async () => {
    if (!user) return
    await updateDoc(doc(db, 'users', user.uid), { displayName: editName, university: editUni })
    setProfile(p => ({ ...p, displayName: editName, university: editUni }))
    setEditMode(false)
  }

  if (!subject && !user) return (
    <div style={{ background: colors.navy, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: colors.muted }}>
        <p style={{ marginBottom: 16 }}>Not logged in.</p>
        <Btn onClick={() => setPage('login')}>Sign in</Btn>
      </div>
    </div>
  )

  const name     = subject?.displayName || user?.email || 'User'
  const role     = subject?.role || 'student'
  const uni      = subject?.university
  const avg      = subject?.avgRating
  const count    = subject?.ratingCount || 0
  const verified = subject?.verified
  const username = subject?.username

  const box = (children, glow = false) => (
    <div style={{
      background: colors.navyLight, border: `0.5px solid ${glow ? 'rgba(0,200,150,0.35)' : 'rgba(0,200,150,0.15)'}`,
      borderRadius: 14, padding: '1.25rem', marginBottom: 14,
      boxShadow: glow ? '0 0 24px rgba(0,200,150,0.06)' : 'none',
    }}>{children}</div>
  )

  return (
    <div style={{ background: colors.navy, minHeight: '100vh', padding: '1.5rem', color: colors.white }}>
      <div style={{ maxWidth: 580, margin: '0 auto' }}>

        {box(
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <Avatar name={name} size={64} isOnline={online} />
            <div style={{ flex: 1 }}>
              {editMode ? (
                <>
                  <Input label="Display name" value={editName} onChange={e => setEditName(e.target.value)} />
                  <Input label="University" value={editUni} onChange={e => setEditUni(e.target.value)} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Btn onClick={saveProfile} style={{ flex: 1 }}>Save</Btn>
                    <Btn variant="ghost" onClick={() => setEditMode(false)} style={{ flex: 1 }}>Cancel</Btn>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
                    <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: colors.white }}>{name}</span>
                    <Badge variant={role}>{role}</Badge>
                    {verified && <Badge variant="verified">Verified</Badge>}

                    <OnlineStatusBadge 
                      isOnline={online} 
                      size="md"
                    />
                  </div>
                  {username && <p style={{ fontSize: 13, color: colors.mint, margin: '0 0 4px', fontWeight: 600 }}>@{username}</p>}
                  {uni && (
                    <p style={{ fontSize: 13, color: colors.muted, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <GraduationCap size={14} color={colors.mint} /> {uni}
                    </p>
                  )}
                  {avg !== null && avg !== undefined ? (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                      <StarRow value={Math.round(avg)} size={15} />
                      <span style={{ fontSize: 12, color: colors.muted }}>{avg} · {count} review{count !== 1 ? 's' : ''}</span>
                    </div>
                  ) : (
                    <p style={{ fontSize: 12, color: colors.muted, margin: '0 0 12px' }}>No ratings yet</p>
                  )}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {isOwn && (
                      <Btn variant="dark" style={{ fontSize: 12, padding: '7px 14px', display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => setEditMode(true)}>
                        <Edit2 size={13} /> Edit profile
                      </Btn>
                    )}
                    {!isOwn && (
                      <>
                        <Btn 
                          style={{ fontSize: 12, padding: '7px 14px', display: 'inline-flex', alignItems: 'center', gap: 6 }} 
                          onClick={() => {
                            if (!user) {
                              setPage('signup')
                              return
                            }
                            setShowRateForm(r => !r)
                          }}
                        >
                          <Star size={13} /> Rate as roommate
                        </Btn>
                        <Btn variant="ghost" style={{ fontSize: 12, padding: '7px 14px', display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => setPage('contact')}>
                          <Mail size={13} /> Message
                        </Btn>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>,
          true
        )}

        {showRateForm && !isOwn && box(
          <RatingForm targetUid={targetUser?.uid} targetName={name} onDone={() => setShowRateForm(false)} setPage={setPage} />
        )}

        {box(
          <>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, margin: '0 0 16px', fontSize: 16, color: colors.white }}>
              Roommate reviews ({count})
            </h3>
            {ratings.length === 0
              ? <p style={{ color: colors.muted, fontSize: 13 }}>No reviews yet.</p>
              : ratings.map(r => <RatingCard key={r.id} r={r} />)
            }
          </>
        )}
      </div>
    </div>
  )
}