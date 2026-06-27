import { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import { colors, Input, Textarea, Btn } from '../components/UI'

const CITIES = ['Rabat', 'Casablanca', 'Fès', 'Marrakech', 'Agadir', 'Tanger', 'Meknès', 'Oujda', 'Tétouan', 'Kenitra']
const TYPES  = ['Studio', 'Shared room', 'Apartment', 'Villa', 'Room in house']
const AMENITIES = ['WiFi', 'Furnished', 'AC', 'Heating', 'Kitchen', 'Washing machine', 'Parking', 'Elevator', 'Balcony', 'Near campus']

export default function CreateListingPage({ setPage }) {
  const { user, profile } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '', description: '', city: '', neighborhood: '',
    near: '', type: '', price: '', spots: '1',
    amenities: [], gender: 'mixed', minStay: '1',
    whatsapp: '', available: '',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const toggleAmenity = (a) => {
    setForm(f => ({
      ...f,
      amenities: f.amenities.includes(a)
        ? f.amenities.filter(x => x !== a)
        : [...f.amenities, a]
    }))
  }

  const validateStep = () => {
    if (step === 1) {
      if (!form.title.trim()) return 'Please add a title.'
      if (!form.city) return 'Please select a city.'
      if (!form.type) return 'Please select a listing type.'
      if (!form.price || isNaN(form.price)) return 'Please enter a valid price.'
    }
    if (step === 2) {
      if (!form.description.trim()) return 'Please add a description.'
    }
    return null
  }

  const next = () => {
    const err = validateStep()
    if (err) { setError(err); return }
    setError('')
    setStep(s => s + 1)
  }

  const submit = async () => {
    setLoading(true)
    setError('')
    try {
      await addDoc(collection(db, 'listings'), {
        ...form,
        price:     parseInt(form.price),
        spots:     parseInt(form.spots),
        minStay:   parseInt(form.minStay),
        photos:    [],
        ownerUid:  user.uid,
        ownerName: profile?.displayName || user.email,
        ownerRole: profile?.role || 'other',
        createdAt: serverTimestamp(),
        active:    true,
      })
      setPage('listings')
    } catch (err) {
      setError('Error posting listing: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return (
    <div style={{ background: colors.navy, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: colors.muted }}>
        <p style={{ marginBottom: 16 }}>Sign in to post a listing.</p>
        <Btn onClick={() => setPage('login')}>Sign in</Btn>
      </div>
    </div>
  )

  const stepLabel = ['Basic info', 'Details', 'Review']

  return (
    <div style={{ background: colors.navy, minHeight: '100vh', padding: '1.5rem', color: colors.white }}>
      <div style={{ maxWidth: 580, margin: '0 auto' }}>

        <button onClick={() => step === 1 ? setPage('listings') : setStep(s => s - 1)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: colors.mint, fontSize: 14, marginBottom: 24, padding: 0, fontWeight: 600,
        }}>← {step === 1 ? 'Back to listings' : 'Back'}</button>

        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 24, margin: '0 0 6px' }}>
          Post a listing
        </h1>
        <p style={{ color: colors.muted, fontSize: 14, margin: '0 0 28px' }}>
          Share your space with students across Morocco
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
          {stepLabel.map((l, i) => (
            <div key={l} style={{ flex: 1 }}>
              <div style={{
                height: 3, borderRadius: 99, marginBottom: 6,
                background: i + 1 <= step ? colors.mint : 'rgba(0,200,150,0.15)',
                transition: 'background 0.3s',
              }} />
              <div style={{ fontSize: 11, color: i + 1 <= step ? colors.mint : colors.muted }}>{l}</div>
            </div>
          ))}
        </div>

        <div style={{ background: colors.navyLight, border: '0.5px solid rgba(0,200,150,0.15)', borderRadius: 16, padding: '1.75rem' }}>

          {step === 1 && (
            <>
              <Input label="Listing title" value={form.title} onChange={e => set('title', e.target.value)}
                placeholder="e.g. Studio meublé près de FSR, Agdal" />

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: colors.muted, display: 'block', marginBottom: 8 }}>City</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {CITIES.map(c => (
                    <button key={c} onClick={() => set('city', c)} style={{
                      padding: '6px 14px', borderRadius: 99, fontSize: 12, cursor: 'pointer',
                      border: `0.5px solid ${form.city === c ? colors.mint : 'rgba(0,200,150,0.15)'}`,
                      background: form.city === c ? 'rgba(0,200,150,0.12)' : 'transparent',
                      color: form.city === c ? colors.mint : colors.muted,
                      fontWeight: form.city === c ? 600 : 400,
                    }}>{c}</button>
                  ))}
                </div>
              </div>

              <Input label="Neighborhood (optional)" value={form.neighborhood}
                onChange={e => set('neighborhood', e.target.value)} placeholder="e.g. Agdal, Hay Riad, Guéliz…" />

              <Input label="Near which university / landmark" value={form.near}
                onChange={e => set('near', e.target.value)} placeholder="e.g. FSR, ENCG, Carrefour…" />

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: colors.muted, display: 'block', marginBottom: 8 }}>Type</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {TYPES.map(t => (
                    <button key={t} onClick={() => set('type', t)} style={{
                      padding: '6px 14px', borderRadius: 99, fontSize: 12, cursor: 'pointer',
                      border: `0.5px solid ${form.type === t ? colors.gold : 'rgba(255,215,0,0.15)'}`,
                      background: form.type === t ? 'rgba(255,215,0,0.1)' : 'transparent',
                      color: form.type === t ? colors.gold : colors.muted,
                      fontWeight: form.type === t ? 600 : 400,
                    }}>{t}</button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 2 }}>
                  <Input label="Monthly rent (DH)" type="number" value={form.price}
                    onChange={e => set('price', e.target.value)} placeholder="e.g. 1800" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, color: colors.muted, display: 'block', marginBottom: 5 }}>Spots</label>
                    <select value={form.spots} onChange={e => set('spots', e.target.value)} style={{
                      width: '100%', padding: '10px 12px', borderRadius: 8,
                      border: '0.5px solid rgba(0,200,150,0.2)', background: 'rgba(255,255,255,0.05)',
                      color: colors.white, fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none',
                    }}>
                      {[1,2,3,4,5,6].map(n => <option key={n} value={n} style={{ background: colors.navy }}>{n}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: colors.muted, display: 'block', marginBottom: 8 }}>Gender preference</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[['mixed', '👥 Mixed'], ['male', '👨 Male only'], ['female', '👩 Female only']].map(([v, l]) => (
                    <button key={v} onClick={() => set('gender', v)} style={{
                      flex: 1, padding: '8px', borderRadius: 8, cursor: 'pointer', fontSize: 12,
                      border: `0.5px solid ${form.gender === v ? colors.mint : 'rgba(0,200,150,0.15)'}`,
                      background: form.gender === v ? 'rgba(0,200,150,0.1)' : 'transparent',
                      color: form.gender === v ? colors.mint : colors.muted,
                    }}>{l}</button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <Textarea label="Description" value={form.description} onChange={e => set('description', e.target.value)}
                placeholder="Describe the place — size, vibe, what's included, house rules…" style={{ minHeight: 140 }} />

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, color: colors.muted, display: 'block', marginBottom: 8 }}>Amenities</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {AMENITIES.map(a => (
                    <button key={a} onClick={() => toggleAmenity(a)} style={{
                      padding: '6px 12px', borderRadius: 99, fontSize: 12, cursor: 'pointer',
                      border: `0.5px solid ${form.amenities.includes(a) ? colors.mint : 'rgba(0,200,150,0.15)'}`,
                      background: form.amenities.includes(a) ? 'rgba(0,200,150,0.12)' : 'transparent',
                      color: form.amenities.includes(a) ? colors.mint : colors.muted,
                    }}>
                      {form.amenities.includes(a) ? '✓ ' : ''}{a}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: colors.muted, display: 'block', marginBottom: 5 }}>Minimum stay</label>
                <select value={form.minStay} onChange={e => set('minStay', e.target.value)} style={{
                  width: '100%', padding: '10px 12px', borderRadius: 8,
                  border: '0.5px solid rgba(0,200,150,0.2)', background: 'rgba(255,255,255,0.05)',
                  color: colors.white, fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none',
                }}>
                  {[1,2,3,6,9,12].map(n => <option key={n} value={n} style={{ background: colors.navy }}>{n} month{n > 1 ? 's' : ''}</option>)}
                </select>
              </div>

              <Input label="Available from (optional)" type="date" value={form.available}
                onChange={e => set('available', e.target.value)} style={{ colorScheme: 'dark' }} />

              <Input label="WhatsApp number (optional)" value={form.whatsapp}
                onChange={e => set('whatsapp', e.target.value)} placeholder="+212 6XX XXX XXX" />
            </>
          )}

          {step === 3 && (
            <>
              <p style={{ fontSize: 13, color: colors.muted, marginBottom: 16, lineHeight: 1.6 }}>
                Review your listing before posting. You can add photos later by editing it.
              </p>
              <div style={{ background: 'rgba(0,200,150,0.05)', border: '0.5px solid rgba(0,200,150,0.15)', borderRadius: 10, padding: '1rem', marginBottom: 16 }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{form.title || 'Untitled listing'}</div>
                <div style={{ fontSize: 12, color: colors.muted, marginBottom: 8 }}>📍 {form.city || '—'} · Near {form.near || '—'}</div>
                <div style={{ fontWeight: 700, color: colors.mint, fontSize: 18 }}>{form.price || '0'} DH<span style={{ fontSize: 11, color: colors.muted, fontWeight: 400 }}>/mo</span></div>
              </div>
            </>
          )}

          {error && <p style={{ color: '#FF6B6B', fontSize: 12, marginBottom: 12 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            {step < 3 && (
              <Btn style={{ flex: 1, padding: '13px' }} onClick={next}>Continue →</Btn>
            )}
            {step === 3 && (
              <Btn style={{ flex: 1, padding: '13px' }} onClick={submit} disabled={loading}>
                {loading ? 'Posting…' : 'Post listing ✓'}
              </Btn>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}