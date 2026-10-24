import { useState, useEffect } from 'react'
import { collection, getDocs, query, where, deleteDoc, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore'
import { MapPin, Plus, Building2, X, Check } from 'lucide-react'
import { db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import { colors, Badge, Btn, Input, Textarea, ConfirmDeleteModal } from '../components/UI'
import { useLanguage } from '../context/LanguageContext'

import { buildCities } from '../lib/cities'
const CITIES = buildCities()
const TYPES = ['Studio', 'Shared room', 'Apartment', 'Villa']
const AMENITIES_LIST = ['Furnished', 'WiFi', 'Washing machine', 'Kitchen', 'Elevator', 'Balcony', 'Private bathroom']

function MyListingCard({ l, onToggleActive, onDelete }) {
  const { tCity } = useLanguage()
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
          <div style={{ fontSize: 12, color: colors.muted, display: 'flex', alignItems: 'center', gap: 4 }}>
            <MapPin size={12} color={colors.mint} /> {tCity(l.city)} · Near {l.near}
          </div>
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
  const { user, profile } = useAuth()
  const { t } = useLanguage()
  const [listings, setListings] = useState([])
  const [loading, setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Listing Form state
  const [form, setForm] = useState({
    title: '', type: 'Studio', city: 'Rabat', neighborhood: '', near: '',
    price: '', spots: '1', description: '', gender: 'mixed', minStay: '1',
    available: '', whatsapp: '', amenities: ['Furnished', 'WiFi'],
  })

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const toggleAmenity = (a) => setForm(f => ({
    ...f,
    amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a],
  }))

  useEffect(() => {
    if (!user) return
    let isMounted = true
    getDocs(query(collection(db, 'listings'), where('ownerUid', '==', user.uid)))
      .then(snap => { if (isMounted) setListings(snap.docs.map(d => ({ id: d.id, ...d.data() }))) })
      .catch(() => {})
      .finally(() => { if (isMounted) setLoading(false) })
    return () => { isMounted = false }
  }, [user])

  const [itemToDelete, setItemToDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const onToggleActive = async (l) => {
    const newActive = l.active === false ? true : false
    await updateDoc(doc(db, 'listings', l.id), { active: newActive })
    setListings(ls => ls.map(x => x.id === l.id ? { ...x, active: newActive } : x))
  }

  const onDelete = (l) => {
    setItemToDelete(l)
  }

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return
    setDeleteLoading(true)
    try {
      await deleteDoc(doc(db, 'listings', itemToDelete.id))
      setListings(ls => ls.filter(x => x.id !== itemToDelete.id))
      setItemToDelete(null)
    } catch (err) {
      console.error('Failed to delete listing:', err)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleCreateListing = async (e) => {
    e.preventDefault()
    if (!form.title || !form.price || !form.near) return alert('Please fill in title, price, and nearest university.')
    setSubmitting(true)

    try {
      const newListingData = {
        title: form.title,
        type: form.type,
        city: form.city,
        neighborhood: form.neighborhood,
        near: form.near,
        price: Number(form.price) || 0,
        spots: Number(form.spots) || 1,
        description: form.description,
        gender: form.gender,
        minStay: Number(form.minStay) || 1,
        available: form.available || 'Immediate',
        whatsapp: form.whatsapp,
        amenities: form.amenities,
        ownerUid: user.uid,
        ownerName: profile?.displayName || user.email?.split('@')[0] || 'Landlord',
        ownerRole: profile?.role || 'landlord',
        active: true,
        createdAt: serverTimestamp(),
      }

      const docRef = await addDoc(collection(db, 'listings'), newListingData)
      setListings(prev => [{ id: docRef.id, ...newListingData }, ...prev])

      // Also publish a short feed post announcing the new listing so it appears in the Campus Feed
      try {
        await addDoc(collection(db, 'posts'), {
          content: `${newListingData.ownerName || 'Someone'} posted a new housing listing: ${newListingData.title} in ${newListingData.city} · ${newListingData.price} DH/mo`,
          authorUid: user.uid,
          authorName: newListingData.ownerName,
          authorRole: newListingData.ownerRole,
          createdAt: serverTimestamp(),
        })
      } catch (err) {
        // non-fatal — ignore
        console.warn('Could not publish cross-post to feed:', err.message)
      }

      setShowModal(false)
      // reset form
      setForm({
        title: '', type: 'Studio', city: 'Rabat', neighborhood: '', near: '',
        price: '', spots: '1', description: '', gender: 'mixed', minStay: '1',
        available: '', whatsapp: '', amenities: ['Furnished', 'WiFi'],
      })
    } catch (err) {
      alert('Error creating listing: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!user) return (
    <div style={{ background: colors.navy, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: colors.muted }}>
        <p style={{ marginBottom: 16 }}>{t('myListingsTitle')}</p>
        <Btn onClick={() => setPage('login')}>Sign in</Btn>
      </div>
    </div>
  )

  return (
    <div style={{ background: colors.navy, minHeight: '100vh', padding: '1.5rem', color: colors.white }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, margin: '0 0 4px' }}>{t('myListingsTitle')}</h1>
          </div>
          <Btn onClick={() => setShowModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} /> {t('postHousingBtn')}
          </Btn>
        </div>

        {loading ? (
          <p style={{ color: colors.muted, textAlign: 'center', padding: '3rem' }}>...</p>
        ) : listings.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '4rem',
            border: '0.5px dashed rgba(0,200,150,0.15)', borderRadius: 14, color: colors.muted,
          }}>
            <p style={{ marginBottom: 16 }}>{t('noMyListings')}</p>
            <p style={{ color: colors.mutedLight, marginTop: 8 }}>{t('postFirstListing')}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 14 }}>
            {listings.map(l => (
              <MyListingCard key={l.id} l={l} onToggleActive={onToggleActive} onDelete={onDelete} />
            ))}
          </div>
        )}
      </div>

      {/* New Listing Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(5, 12, 24, 0.85)',
          backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
        }}>
          <div style={{
            background: colors.navyLight, border: '0.5px solid rgba(0,200,150,0.2)',
            borderRadius: 16, width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto',
            padding: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: colors.white, margin: 0 }}>
                Post a new listing
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: colors.muted, cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateListing} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Input label="Title" value={form.title} onChange={e => setField('title', e.target.value)} placeholder="e.g. Studio meublé près de la fac" required />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: colors.muted, display: 'block', marginBottom: 6 }}>Property type</label>
                  <select value={form.type} onChange={e => setField('type', e.target.value)} style={{
                    width: '100%', padding: '10px', borderRadius: 8, background: 'rgba(255,255,255,0.05)',
                    border: '0.5px solid rgba(0,200,150,0.2)', color: colors.white, outline: 'none', fontSize: 13,
                  }}>
                    {TYPES.map(t => <option key={t} value={t} style={{ background: colors.navy }}>{t}</option>)}
                  </select>
                </div>

                <Input label="City & Country *" value={form.city} onChange={e => setField('city', e.target.value)} placeholder="e.g. Paris, Casablanca, London..." required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Input label="Neighborhood" value={form.neighborhood} onChange={e => setField('neighborhood', e.target.value)} placeholder="e.g. Agdal, Hay Riad" />
                <Input label="Near university/school" value={form.near} onChange={e => setField('near', e.target.value)} placeholder="e.g. FSR, ENCG, ENSA" required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Input label="Monthly rent (DH)" type="number" value={form.price} onChange={e => setField('price', e.target.value)} placeholder="1800" required />
                <Input label="Spots available" type="number" value={form.spots} onChange={e => setField('spots', e.target.value)} placeholder="1" required />
              </div>

              <Textarea label="Description" value={form.description} onChange={e => setField('description', e.target.value)} placeholder="Describe the place, rules, bills included..." rows={3} />

              <div>
                <label style={{ fontSize: 12, color: colors.muted, display: 'block', marginBottom: 6 }}>Amenities</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {AMENITIES_LIST.map(a => (
                    <button type="button" key={a} onClick={() => toggleAmenity(a)} style={{
                      padding: '4px 10px', borderRadius: 99, fontSize: 12, cursor: 'pointer',
                      border: `0.5px solid ${form.amenities.includes(a) ? colors.mint : 'rgba(0,200,150,0.15)'}`,
                      background: form.amenities.includes(a) ? 'rgba(0,200,150,0.12)' : 'transparent',
                      color: form.amenities.includes(a) ? colors.mint : colors.muted,
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                    }}>
                      {form.amenities.includes(a) && <Check size={12} />} {a}
                    </button>
                  ))}
                </div>
              </div>

              <Input label="WhatsApp number" value={form.whatsapp} onChange={e => setField('whatsapp', e.target.value)} placeholder="+212 600000000" />

              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <Btn type="button" variant="dark" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</Btn>
                <Btn type="submit" style={{ flex: 1 }} disabled={submitting}>
                  {submitting ? 'Posting…' : 'Publish listing'}
                </Btn>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Housing Listing?"
        message={`Are you sure you want to delete "${itemToDelete?.title}"? This cannot be undone.`}
        loading={deleteLoading}
      />
    </div>
  )
}