import { useState, useEffect } from 'react'
import { collection, query, getDocs, addDoc, orderBy, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../context/LanguageContext'
import { useNotifications } from '../context/NotificationContext'
import { colors, Btn, Avatar, Modal, Input, Textarea, ConfirmDeleteModal } from '../components/UI'
import { Skeleton } from '../components/Skeletons'
import { 
  Car, MapPin, Clock, Users, Plus, 
  MessageSquare, Navigation, Search, Trash2
} from 'lucide-react'

import { buildCities } from '../lib/cities'
import { normalizeText } from '../lib/normalize'
const CITIES = buildCities(['Paris', 'London', 'New York', 'Istanbul', 'Montreal', 'Dubai'])

export default function RidesharePage({ setPage, setSelectedUser }) {
  const { user, profile } = useAuth()
  const { tCity } = useLanguage()
  const { addToast } = useNotifications()

  const [rides, setRides] = useState([])
  const [loading, setLoading] = useState(true)
  const [originFilter, setOriginFilter] = useState('All')
  const [destFilter, setDestFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('all')

  // Applied filters for click-to-search
  const [appliedOrigin, setAppliedOrigin] = useState('All')
  const [appliedDest, setAppliedDest] = useState('All')
  const [appliedType, setAppliedType] = useState('all')

  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [rideToDelete, setRideToDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const isRideOwner = (ride) => {
    if (!user || !ride) return false
    return (
      ride.organizerId === user.uid ||
      ride.organizerId === 'guest' ||
      (ride.organizerName && (ride.organizerName === profile?.displayName || ride.organizerName === user?.email))
    )
  }

  const handleConfirmDeleteRide = async () => {
    if (!rideToDelete) return
    setDeleteLoading(true)
    try {
      if (rideToDelete.id && !rideToDelete.id.startsWith('ride-')) {
        await deleteDoc(doc(db, 'rideshares', rideToDelete.id))
      }
      setRides(prev => prev.filter(r => r.id !== rideToDelete.id))
      addToast('Ride offer successfully deleted', 'success')
      setRideToDelete(null)
    } catch (err) {
      console.error('Failed to delete ride:', err)
      addToast('Could not delete ride: ' + err.message, 'error')
    } finally {
      setDeleteLoading(false)
    }
  }

  const [form, setForm] = useState({
    type: 'taxi_group',
    originCity: 'Rabat',
    originSpot: 'Agdal Grand Taxi Station',
    destCity: 'Kénitra',
    destSpot: 'Campus Universitaire',
    date: 'Tomorrow',
    time: '08:00 AM',
    totalSeats: 6,
    pricePerSeat: '20',
    notes: '',
    vehicleInfo: 'Grand Taxi',
  })

  useEffect(() => {
    let isMounted = true
    async function loadData() {
      try {
        const q = query(collection(db, 'rideshares'), orderBy('createdAt', 'desc'))
        const snap = await getDocs(q)
        const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        if (isMounted) {
          setRides(fetched)
          setLoading(false)
        }
      } catch {
        if (isMounted) {
          setRides([])
          setLoading(false)
        }
      }
    }
    loadData()

    return () => { isMounted = false }
  }, [])

  const handleReserveSeat = async (ride) => {
    if (!user) {
      addToast('Please sign in to reserve a seat', 'info')
      setPage('login')
      return
    }

    if (ride.availableSeats <= 0) {
      addToast('Sorry, this ride is fully booked!', 'error')
      return
    }

    try {
      const updatedSeats = ride.availableSeats - 1
      if (ride.id.startsWith('ride-')) {
        // Local update
        setRides(prev => prev.map(r => r.id === ride.id ? { ...r, availableSeats: updatedSeats } : r))
      } else {
        // Firestore update
        await updateDoc(doc(db, 'rideshares', ride.id), { availableSeats: updatedSeats })
        setRides(prev => prev.map(r => r.id === ride.id ? { ...r, availableSeats: updatedSeats } : r))
      }

      addToast(`🎉 Seat reserved! Connected with ${ride.organizerName}`, 'success')
      
      // Auto prefill contact
      if (setSelectedUser) {
        setSelectedUser({
          uid: ride.organizerId,
          displayName: ride.organizerName,
          email: `${ride.organizerId}@ghatalaba.com`,
          prefilledSubject: `Seat Reserved: ${ride.originCity} ➔ ${ride.destCity}`,
          prefilledBody: `Hi ${ride.organizerName}, I just reserved a seat on your ride (${ride.originCity} to ${ride.destCity} at ${ride.time}). Where exactly should we meet at ${ride.originSpot}?`
        })
      }
    } catch (err) {
      addToast('Could not reserve seat: ' + err.message, 'error')
    }
  }

  const handleChatOrganizer = (ride) => {
    if (!user) {
      addToast('Please sign in to chat', 'info')
      setPage('login')
      return
    }

    if (setSelectedUser) {
      setSelectedUser({
        uid: ride.organizerId,
        displayName: ride.organizerName,
        email: `${ride.organizerId}@ghatalaba.com`,
        prefilledSubject: `Ride Inquiry: ${ride.originCity} to ${ride.destCity}`,
        prefilledBody: `Hi ${ride.organizerName}, I have a question about your ride from ${ride.originSpot} (${ride.originCity}) to ${ride.destSpot} (${ride.destCity}) at ${ride.time}.`
      })
    }
    setPage('contact')
  }

  const handleCreateRide = async (e) => {
    e.preventDefault()
    if (!form.originSpot.trim() || !form.destSpot.trim() || !form.pricePerSeat) {
      addToast('Please fill in pickup, destination landmark, and price', 'error')
      return
    }

    setSubmitting(true)
    try {
      const newRide = {
        type: form.type,
        originCity: form.originCity,
        originSpot: form.originSpot.trim(),
        destCity: form.destCity,
        destSpot: form.destSpot.trim(),
        date: form.date,
        time: form.time,
        totalSeats: parseInt(form.totalSeats) || 4,
        availableSeats: parseInt(form.totalSeats) || 4,
        pricePerSeat: parseFloat(form.pricePerSeat),
        currency: 'MAD',
        notes: form.notes.trim() || 'Co-riding group. Please be punctual at pickup spot.',
        organizerId: user?.uid || 'anon',
        organizerName: profile?.displayName || user?.email || 'Student Organizer',
        organizerRole: profile?.role || 'student',
        university: profile?.university || null,
        vehicleInfo: form.vehicleInfo || 'Grand Taxi',
        createdAt: serverTimestamp(),
      }

      const ref = await addDoc(collection(db, 'rideshares'), newRide)
      setRides(prev => [{ id: ref.id, ...newRide, createdAt: new Date() }, ...prev])

      // Also publish a short feed post announcing the ride
      try {
        await addDoc(collection(db, 'posts'), {
          content: `${newRide.organizerName || 'Someone'} organized a ride: ${newRide.originCity} → ${newRide.destCity} · ${newRide.pricePerSeat} ${newRide.currency || 'MAD'}/seat`,
          authorUid: user?.uid || 'anon',
          authorName: newRide.organizerName || 'Organizer',
          authorRole: newRide.organizerRole || 'student',
          createdAt: serverTimestamp(),
        })
      } catch (err) {
        console.warn('Could not publish ride cross-post:', err.message)
      }

      setShowModal(false)
      addToast('Your ride co-group was published!', 'success')
    } catch (err) {
      addToast('Failed to post ride: ' + err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const applyRideFilters = () => {
    setAppliedOrigin(originFilter)
    setAppliedDest(destFilter)
    setAppliedType(typeFilter)
  }

  const filteredRides = rides.filter(r => {
    const matchOrigin = appliedOrigin === 'All' || normalizeText(r.originCity || '').includes(normalizeText(appliedOrigin))
    const matchDest = appliedDest === 'All' || normalizeText(r.destCity || '').includes(normalizeText(appliedDest))
    const matchType = appliedType === 'all' || r.type === appliedType
    return matchOrigin && matchDest && matchType
  })

  return (
    <div style={{ background: colors.navy, minHeight: '100vh', color: colors.white, paddingBottom: '4rem' }}>
      {/* Banner */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(6, 182, 212, 0.15) 0%, rgba(6, 13, 25, 0) 100%)',
        borderBottom: '1px solid rgba(6, 182, 212, 0.12)',
        padding: '2.5rem 1rem 2rem 1rem',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 99, background: 'rgba(6, 182, 212, 0.12)', border: '1px solid rgba(6, 182, 212, 0.25)', marginBottom: 10 }}>
                <Car size={14} color={colors.cyan} />
                <span style={{ fontSize: 12, fontWeight: 700, color: colors.cyan, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Smart Ride Sharing & Grand Taxi Groups
                </span>
              </div>
              <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 32, fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: '-0.5px' }}>
                Fix Your Commute, <span style={{ color: colors.cyan }}>Skip Taxi Chaos</span>
              </h1>
              <p style={{ color: colors.mutedLight, fontSize: 14, marginTop: 6, maxWidth: 680, lineHeight: '1.5' }}>
                No more waiting hours at unorganized taxi stations, line-jumpers, or price surges. Pool together with 5 fellow students for Grand Taxis or share carpool rides on time.
              </p>
            </div>

            <Btn onClick={() => {
              if (!user) {
                addToast('Please sign in to post a ride', 'info')
                setPage('login')
              } else {
                setShowModal(true)
              }
            }} style={{
              background: 'linear-gradient(135deg, #00C896 0%, #06B6D4 100%)',
              color: '#060D19',
              fontWeight: 800,
              padding: '12px 20px',
              borderRadius: 12,
              boxShadow: '0 4px 18px rgba(6, 182, 212, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <Plus size={18} strokeWidth={2.5} /> Offer / Organize Ride
            </Btn>
          </div>

          {/* Filter Bar */}
          <div style={{
            marginTop: '2rem',
            background: 'rgba(17, 28, 46, 0.8)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(6, 182, 212, 0.2)',
            borderRadius: 16,
            padding: '1rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12,
          }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: colors.mutedLight, display: 'block', marginBottom: 4 }}>FROM (Departure)</label>
              <select value={originFilter} onChange={e => setOriginFilter(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 10, background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFFFFF', fontSize: 13, outline: 'none' }}>
                {CITIES.map(c => <option key={c} value={c} style={{ background: colors.navy }}>{c === 'All' ? 'All Departure Cities' : tCity(c)}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: colors.mutedLight, display: 'block', marginBottom: 4 }}>TO (Destination)</label>
              <select value={destFilter} onChange={e => setDestFilter(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 10, background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFFFFF', fontSize: 13, outline: 'none' }}>
                {CITIES.map(c => <option key={c} value={c} style={{ background: colors.navy }}>{c === 'All' ? 'All Destinations' : tCity(c)}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: colors.mutedLight, display: 'block', marginBottom: 4 }}>RIDE TYPE</label>
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 10, background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFFFFF', fontSize: 13, outline: 'none' }}>
                <option value="all" style={{ background: colors.navy }}>All Ride Types</option>
                <option value="taxi_group" style={{ background: colors.navy }}>Grand Taxi Co-Ride Group</option>
                <option value="carpool" style={{ background: colors.navy }}>Private Carpool</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Btn onClick={() => applyRideFilters()} style={{ padding: '9px 14px' }}>
                <Search size={14} /> Search
              </Btn>
              <Btn variant="ghost" onClick={() => { setOriginFilter('All'); setDestFilter('All'); setTypeFilter('all'); applyRideFilters(); }}>
                Reset
              </Btn>
            </div>
          </div>
        </div>
      </div>

      {/* Rides List */}
      <div style={{ maxWidth: 1100, margin: '2rem auto', padding: '0 1rem' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Skeleton height="140px" borderRadius="16px" />
            <Skeleton height="140px" borderRadius="16px" />
          </div>
        ) : filteredRides.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'rgba(17, 28, 46, 0.4)', borderRadius: 20, border: '1px dashed rgba(6, 182, 212, 0.2)' }}>
            <Car size={48} color={colors.cyan} style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>No rides posted for this route yet</h3>
            <p style={{ color: colors.mutedLight, fontSize: 14, marginTop: 6, marginBottom: 20 }}>Be the first student to organize a Grand Taxi group or share a ride!</p>
            <Btn onClick={() => setShowModal(true)}>Post a Ride</Btn>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 20 }}>
            {filteredRides.map(ride => {
              const isTaxiGroup = ride.type === 'taxi_group'
              return (
                <div key={ride.id} style={{
                  background: 'rgba(17, 28, 46, 0.8)',
                  border: '1px solid rgba(6, 182, 212, 0.18)',
                  borderRadius: 18,
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                  position: 'relative',
                }}>
                  {/* Top Badge & Price */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: 99,
                          fontSize: 11,
                          fontWeight: 800,
                          background: isTaxiGroup ? 'rgba(245, 158, 11, 0.15)' : 'rgba(6, 182, 212, 0.15)',
                          color: isTaxiGroup ? '#F59E0B' : colors.cyan,
                          border: `1px solid ${isTaxiGroup ? 'rgba(245, 158, 11, 0.3)' : 'rgba(6, 182, 212, 0.3)'}`,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}>
                          {isTaxiGroup ? 'Grand Taxi Co-Group' : 'Private Carpool'}
                        </span>

                        {isRideOwner(ride) && (
                          <button
                            type="button"
                            onClick={() => setRideToDelete(ride)}
                            style={{
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.35)',
                              color: '#EF4444',
                              borderRadius: 8,
                              padding: '4px 8px',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                            title="Delete this ride offer"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        )}
                      </div>

                      <div style={{ fontSize: 18, fontWeight: 800, color: colors.mint, fontFamily: 'Space Grotesk, sans-serif' }}>
                        {ride.pricePerSeat} {ride.currency} <span style={{ fontSize: 11, fontWeight: 500, color: colors.mutedLight }}>/ seat</span>
                      </div>
                    </div>

                    {/* Route Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <MapPin size={16} color="#34D399" style={{ marginTop: 2, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF' }}>
                            {tCity(ride.originCity)}
                          </div>
                          <div style={{ fontSize: 12, color: colors.mutedLight }}>
                            {ride.originSpot}
                          </div>
                        </div>
                      </div>

                      <div style={{ paddingLeft: 7, borderLeft: '2px dashed rgba(6, 182, 212, 0.3)', margin: '2px 0 2px 7px', height: 12 }} />

                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <Navigation size={16} color={colors.cyan} style={{ marginTop: 2, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF' }}>
                            {tCity(ride.destCity)}
                          </div>
                          <div style={{ fontSize: 12, color: colors.mutedLight }}>
                            {ride.destSpot}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Time & Seats */}
                    <div style={{ display: 'flex', gap: 12, padding: '8px 12px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: 10, marginBottom: 12, fontSize: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#FFFFFF' }}>
                        <Clock size={14} color={colors.cyan} /> {ride.date} · {ride.time}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: ride.availableSeats > 0 ? '#34D399' : '#F87171', fontWeight: 700 }}>
                        <Users size={14} /> {ride.availableSeats} of {ride.totalSeats} seats left
                      </div>
                    </div>

                    {/* Notes */}
                    <p style={{ fontSize: 12, color: colors.mutedLight, lineHeight: '1.45', margin: '0 0 14px 0', background: 'rgba(255,255,255,0.03)', padding: '8px 10px', borderRadius: 8 }}>
                      "{ride.notes}"
                    </p>
                  </div>

                  {/* Organizer & Action Buttons */}
                  <div style={{ paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar name={ride.organizerName} size={30} />
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF' }}>{ride.organizerName}</div>
                          <div style={{ fontSize: 10, color: colors.cyan }}>{ride.university || 'Verified Commuter'}</div>
                        </div>
                      </div>

                      <button onClick={() => handleChatOrganizer(ride)} style={{ background: 'none', border: 'none', color: colors.cyan, cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MessageSquare size={14} /> Chat
                      </button>
                    </div>

                    <Btn
                      onClick={() => handleReserveSeat(ride)}
                      disabled={ride.availableSeats <= 0}
                      style={{
                        width: '100%',
                        background: ride.availableSeats > 0 ? 'linear-gradient(135deg, #00C896 0%, #06B6D4 100%)' : 'rgba(255,255,255,0.1)',
                        color: ride.availableSeats > 0 ? '#060D19' : colors.muted,
                        fontWeight: 800,
                        padding: '10px',
                        borderRadius: 10,
                      }}
                    >
                      {ride.availableSeats > 0 ? `Reserve Seat (${ride.pricePerSeat} MAD)` : 'Fully Booked'}
                    </Btn>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Post Ride Modal */}
      {showModal && (
        <Modal title="Organize Ride or Grand Taxi Co-Group" onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreateRide} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: colors.mutedLight, display: 'block', marginBottom: 6 }}>Ride Mode</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: 8, background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(6, 182, 212, 0.2)', color: '#FFFFFF', outline: 'none' }}>
                <option value="taxi_group" style={{ background: colors.navy }}>Grand Taxi Co-Ride Group (Organize 5 students to split taxi fare)</option>
                <option value="carpool" style={{ background: colors.navy }}>Private Carpool (I am driving my own vehicle)</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="From City & Country *" value={form.originCity} onChange={e => setForm({ ...form, originCity: e.target.value })} placeholder="e.g. Rabat, Morocco or Paris, France" />
              <Input label="To Destination City & Country *" value={form.destCity} onChange={e => setForm({ ...form, destCity: e.target.value })} placeholder="e.g. Kénitra, Morocco or London, UK" />
            </div>

            <Input label="Pickup Landmark / Station Spot *" value={form.originSpot} onChange={e => setForm({ ...form, originSpot: e.target.value })} placeholder="e.g. Agdal Taxi Station next to Relay" />
            <Input label="Drop-off Station / Landmark *" value={form.destSpot} onChange={e => setForm({ ...form, destSpot: e.target.value })} placeholder="e.g. Campus Universitaire Main Gate" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Date *" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} placeholder="e.g. Tomorrow or Aug 10" />
              <Input label="Time *" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} placeholder="e.g. 07:30 AM" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Total Seats *" type="number" value={form.totalSeats} onChange={e => setForm({ ...form, totalSeats: e.target.value })} placeholder="e.g. 6 for Grand Taxi" />
              <Input label="Price per Seat (MAD) *" type="number" value={form.pricePerSeat} onChange={e => setForm({ ...form, pricePerSeat: e.target.value })} placeholder="e.g. 20" />
            </div>

            <Textarea label="Commute Notes & Meetup Details *" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="e.g. Let's meet 15 mins before to gather the 6 passengers so we take the taxi smoothly without queueing!" rows={3} />

            <div style={{ display: 'flex', justifySelf: 'flex-end', gap: 10, marginTop: 10 }}>
              <Btn type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Btn>
              <Btn type="submit" disabled={submitting}>{submitting ? 'Posting...' : 'Publish Ride Group'}</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(rideToDelete)}
        onClose={() => setRideToDelete(null)}
        onConfirm={handleConfirmDeleteRide}
        title="Delete Ride Offer?"
        message={`Are you sure you want to cancel and delete the ride from ${rideToDelete?.originCity} to ${rideToDelete?.destCity}?`}
        loading={deleteLoading}
      />
    </div>
  )
}
