import { useState, useEffect } from 'react'
import {
  collection, addDoc, getDocs, query, orderBy,
  doc, updateDoc, deleteDoc, serverTimestamp, arrayUnion, arrayRemove
} from 'firebase/firestore'
import { Calendar, MapPin, Clock, User, Users, Trash2, X, Plus } from 'lucide-react'
import { db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import { colors, Avatar, Badge, Btn, Input, Textarea, ConfirmDeleteModal } from '../components/UI'
import { Skeleton } from '../components/Skeletons'
import { useLanguage } from '../context/LanguageContext'

import { buildCities } from '../lib/cities'
import CityPicker from '../components/CityPicker'
import CountrySelect from '../components/CountrySelect'
import { normalizeText } from '../lib/normalize'
const CITIES = buildCities(['Paris', 'London', 'New York', 'Istanbul', 'Montreal', 'Dubai'])
const CATEGORIES = ['All', 'Academic', 'Sports', 'Social', 'Culture', 'Workshop', 'Party']

export default function EventsPage({ setPage }) {
  const { user, profile } = useAuth()
  const { t, tCity } = useLanguage()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState('MA')
  const [selectedCity, setSelectedCity] = useState('All')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '',
    category: 'Social',
    city: profile?.city || 'Rabat',
    venue: '',
    date: '',
    time: '',
    description: '',
    whatsapp: '',
  })

  useEffect(() => {
    getDocs(query(collection(db, 'events'), orderBy('createdAt', 'desc')))
      .then(snap => {
        setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      })
      .catch(() => {
        setEvents([])
      })
      .finally(() => setLoading(false))
  }, [])

  const handleCreateEvent = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.date || !form.venue.trim()) {
      setError('Please fill in title, venue, and date.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const eventData = {
        ...form,
        title: form.title.trim(),
        venue: form.venue.trim(),
        description: form.description.trim(),
        organizerUid: user.uid,
        organizerName: profile?.displayName || user.email.split('@')[0],
        attendees: [user.uid],
        createdAt: new Date().toISOString(),
      }

      try {
        const docRef = await addDoc(collection(db, 'events'), {
          ...eventData,
          createdAt: serverTimestamp(),
        })
        eventData.id = docRef.id
      } catch {
        eventData.id = 'event_' + Date.now()
      }

      setEvents(prev => [eventData, ...prev])
      setShowCreateModal(false)
      setForm({
        title: '',
        category: 'Social',
        city: profile?.city || 'Rabat',
        venue: '',
        date: '',
        time: '',
        description: '',
        whatsapp: '',
      })
    } catch {
      setError('Failed to create event.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleRsvp = async (event) => {
    if (!user) { setPage('login'); return }
    const isAttending = event.attendees?.includes(user.uid)
    const eventRef = doc(db, 'events', event.id)
    const updatePayload = isAttending
      ? { attendees: arrayRemove(user.uid) }
      : { attendees: arrayUnion(user.uid) }

    setEvents(prev => prev.map(e => {
      if (e.id !== event.id) return e
      const currentAttendees = e.attendees || []
      const updated = isAttending
        ? currentAttendees.filter(id => id !== user.uid)
        : [...currentAttendees, user.uid]
      return { ...e, attendees: updated }
    }))

    try {
      await updateDoc(eventRef, updatePayload)
    } catch (err) {
      console.error('Failed to update RSVP:', err)
    }
  }

  const [eventToDelete, setEventToDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const handleDeleteEvent = (event) => {
    setEventToDelete(event)
  }

  const handleConfirmDeleteEvent = async () => {
    if (!eventToDelete) return
    setDeleteLoading(true)
    try {
      if (eventToDelete.id && !eventToDelete.id.startsWith('event_')) {
        await deleteDoc(doc(db, 'events', eventToDelete.id))
      }
      setEvents(prev => prev.filter(e => e.id !== eventToDelete.id))
      setEventToDelete(null)
    } catch (err) {
      console.error('Failed to delete event:', err)
    } finally {
      setDeleteLoading(false)
    }
  }

  const filteredEvents = events.filter(e => {
    const matchesCity = selectedCity === 'All cities' || normalizeText(e.city || '').includes(normalizeText(selectedCity))
    const matchesCategory = selectedCategory === 'All' || e.category === selectedCategory
    return matchesCity && matchesCategory
  })

  return (
    <div style={{ background: colors.navy, minHeight: '100vh', padding: '1.5rem', color: colors.white }}>
      <div style={{ maxWidth: 840, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 28, margin: '0 0 6px', color: colors.white }}>
              {t('eventsPageTitle')}
            </h1>
            <p style={{ color: colors.muted, fontSize: 14, margin: 0 }}>
              {t('eventsPageSub')}
            </p>
          </div>

          <Btn
            onClick={() => user ? setShowCreateModal(true) : setPage('login')}
            style={{ padding: '10px 20px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={16} /> {t('postAnEventBtn')}
          </Btn>
        </div>

        {/* Filters - Responsive layout for mobile & desktop */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: '1 1 120px', minWidth: 0 }}>
              <CountrySelect value={selectedCountry} onChange={v => setSelectedCountry(v)} />
            </div>
            <div style={{ flex: '2 1 160px', minWidth: 0 }}>
              <CityPicker value={selectedCity === 'All' ? '' : selectedCity} onChange={v => setSelectedCity(v || 'All')} placeholder={t('selectCity') || 'Search or type a city'} countryCode={selectedCountry} lang={null} />
            </div>
            <div>
              <button onClick={() => { setSelectedCity('All'); setSelectedCountry('MA') }} style={{ padding: '9px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: colors.mutedLight, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Reset</button>
            </div>
          </div>

          {/* Categories Pills - Smooth Swipeable Rail on Mobile */}
          <div 
            className="no-scrollbar touch-scroll"
            style={{
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              flexWrap: 'nowrap',
              paddingBottom: 4,
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '7px 15px',
                  borderRadius: 99,
                  fontSize: 12,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  cursor: 'pointer',
                  border: `0.5px solid ${selectedCategory === cat ? colors.gold : 'rgba(255,215,0,0.18)'}`,
                  background: selectedCategory === cat ? 'rgba(255,215,0,0.14)' : 'rgba(255,255,255,0.03)',
                  color: selectedCategory === cat ? colors.gold : colors.mutedLight,
                  fontWeight: selectedCategory === cat ? 700 : 500,
                  transition: 'all 0.15s ease',
                }}
              >
                {cat === 'All' ? t('allCategories') : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Create Event Modal */}
        {showCreateModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10,22,40,0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}>
            <div style={{
              background: colors.navyLight,
              border: '0.5px solid rgba(0,200,150,0.3)',
              borderRadius: 20,
              padding: '1.75rem',
              maxWidth: 520,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, margin: 0 }}>
                  {t('postNewEventTitle')}
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  style={{ background: 'none', border: 'none', color: colors.muted, cursor: 'pointer', padding: 4 }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Input
                  label={t('eventTitle')}
                  placeholder="e.g. FSR Inter-Campus Football Match"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 12, color: colors.muted, display: 'block', marginBottom: 6 }}>Category</label>
                    <select
                      value={form.category}
                      onChange={e => setForm({ ...form, category: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: 8,
                        background: 'rgba(255,255,255,0.05)',
                        border: '0.5px solid rgba(0,200,150,0.2)',
                        color: colors.white,
                        fontSize: 13,
                        outline: 'none',
                      }}
                    >
                      {CATEGORIES.filter(c => c !== 'All').map(c => (
                        <option key={c} value={c} style={{ background: colors.navy }}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <Input
                    label="City & Country *"
                    placeholder="e.g. Paris, Casablanca, London..."
                    value={form.city}
                    onChange={e => setForm({ ...form, city: e.target.value })}
                  />
                </div>

                <Input
                  label={t('venueLocation')}
                  placeholder="e.g. Stade Universitaire Agdal or Cafétéria FSR"
                  value={form.venue}
                  onChange={e => setForm({ ...form, venue: e.target.value })}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <Input
                    label={t('dateLabel')}
                    type="date"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    style={{ colorScheme: 'dark' }}
                  />
                  <Input
                    label={t('timeLabel')}
                    type="time"
                    value={form.time}
                    onChange={e => setForm({ ...form, time: e.target.value })}
                    style={{ colorScheme: 'dark' }}
                  />
                </div>

                <Textarea
                  label={t('descriptionDetails')}
                  placeholder="Describe the activity, who can join, what to bring..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  style={{ minHeight: 90 }}
                />

                <Input
                  label={t('whatsappContact')}
                  placeholder="+212 6XX XXX XXX or group link"
                  value={form.whatsapp}
                  onChange={e => setForm({ ...form, whatsapp: e.target.value })}
                />

                {error && <p style={{ color: '#FF6B6B', fontSize: 12, margin: 0 }}>{error}</p>}

                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <Btn
                    type="button"
                    variant="ghost"
                    onClick={() => setShowCreateModal(false)}
                    style={{ flex: 1 }}
                  >
                    {t('cancel')}
                  </Btn>
                  <Btn type="submit" disabled={submitting} style={{ flex: 1 }}>
                    {submitting ? t('posting') : t('publishEvent')}
                  </Btn>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Events Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ background: colors.navyLight, borderRadius: 16, border: '0.5px solid rgba(0,200,150,0.15)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Skeleton width="60px" height="20px" borderRadius="6px" />
                  <Skeleton width="60px" height="20px" borderRadius="6px" />
                </div>
                <Skeleton width="85%" height="22px" />
                <Skeleton width="60%" height="14px" />
                <Skeleton width="100%" height="40px" />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
                  <Skeleton width="70px" height="16px" />
                  <Skeleton width="80px" height="28px" borderRadius="8px" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem 1rem',
            background: colors.navyLight,
            borderRadius: 16,
            border: '0.5px dashed rgba(0,200,150,0.15)',
            color: colors.muted,
          }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{t('noEventsInCity')} {selectedCity === 'All cities' ? t('allCities') : selectedCity}.</p>
            <p style={{ margin: '4px 0 16px', fontSize: 13, color: colors.muted }}>
              {t('hostSession')}
            </p>
            <Btn onClick={() => user ? setShowCreateModal(true) : setPage('login')}>
              {t('postFirstEvent')}
            </Btn>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {filteredEvents.map(event => {
              const isAttending = event.attendees?.includes(user?.uid)
              const attendeesCount = event.attendees?.length || 0
              const isOwner = event.organizerUid === user?.uid

              return (
                <div
                  key={event.id}
                  style={{
                    background: colors.navyLight,
                    border: '0.5px solid rgba(0,200,150,0.15)',
                    borderRadius: 16,
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                  }}
                >
                  <div>
                    {/* Event Tag Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <span style={{
                          fontSize: 11,
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: 'rgba(255,215,0,0.12)',
                          color: colors.gold,
                          fontWeight: 600,
                        }}>
                          {event.category}
                        </span>
                        <span style={{
                          fontSize: 11,
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: 'rgba(0,200,150,0.12)',
                          color: colors.mint,
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}>
                          <MapPin size={10} color={colors.mint} /> {tCity(event.city)}
                        </span>
                      </div>

                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => handleDeleteEvent(event)}
                          style={{ background: 'none', border: 'none', color: '#FF6B6B', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          title="Delete Event"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    <h3 style={{
                      fontFamily: 'Syne, sans-serif',
                      fontWeight: 700,
                      fontSize: 17,
                      color: colors.white,
                      margin: '0 0 8px',
                      lineHeight: 1.3,
                    }}>
                      {event.title}
                    </h3>

                    <div style={{ fontSize: 12, color: colors.mutedLight, display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={13} color={colors.mint} />
                        <span><strong>{event.date}</strong> {event.time && `${event.time}`}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <MapPin size={13} color={colors.mint} />
                        <span>{event.venue}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <User size={13} color={colors.mint} />
                        <span>{t('organizedBy')} <strong>{event.organizerName}</strong></span>
                      </div>
                    </div>

                    {event.description && (
                      <p style={{
                        fontSize: 13,
                        color: colors.muted,
                        lineHeight: 1.5,
                        margin: '0 0 14px',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {event.description}
                      </p>
                    )}
                  </div>

                  {/* Footer / RSVP */}
                  <div style={{
                    paddingTop: 12,
                    borderTop: '0.5px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <span style={{ fontSize: 12, color: colors.mint, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Users size={14} /> {attendeesCount} {t('attending')}
                    </span>

                    <button
                      onClick={() => handleToggleRsvp(event)}
                      style={{
                        background: isAttending ? 'rgba(0,200,150,0.2)' : colors.mint,
                        color: isAttending ? colors.mint : colors.navy,
                        border: isAttending ? '0.5px solid rgba(0,200,150,0.4)' : 'none',
                        padding: '6px 14px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {isAttending ? 'Attending' : 'Join Event'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(eventToDelete)}
        onClose={() => setEventToDelete(null)}
        onConfirm={handleConfirmDeleteEvent}
        title="Delete Event?"
        message={`Are you sure you want to cancel and delete "${eventToDelete?.title}"?`}
        loading={deleteLoading}
      />
    </div>
  )
}
