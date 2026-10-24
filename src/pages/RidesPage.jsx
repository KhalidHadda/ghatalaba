import { useState, useEffect } from 'react'
import { collection, query, onSnapshot, orderBy, addDoc, serverTimestamp, doc, setDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../context/LanguageContext'
import { colors, Avatar, Badge, Btn, Input, ConfirmDeleteModal } from '../components/UI'
import {
  Car,
  Navigation,
  MapPin,
  Clock,
  Calendar,
  Users,
  MessageCircle,
  Plus,
  Sparkles,
  Phone,
  CheckCircle2,
  X,
  Search,
  Filter,
  ArrowRight,
  Zap,
  ShieldCheck,
  UserCheck,
  Trash2
} from 'lucide-react'

import { buildCities } from '../lib/cities'
import moroccoCities from '../data/cities-morocco-translated.json'
import CityPicker from '../components/CityPicker'
import CountrySelect from '../components/CountrySelect'
import { normalizeText } from '../lib/normalize'
const CITIES = buildCities(['Paris', 'London', 'New York', 'Istanbul', 'Montreal', 'Dubai'])

export default function RidesPage({ setPage }) {
  const { user, profile } = useAuth()
  const { t } = useLanguage()

  const [rides, setRides]               = useState([])
  const [loading, setLoading]           = useState(true)
  const [originFilter, setOriginFilter] = useState('All')
  const [destFilter, setDestFilter]     = useState('All')
  const [typeFilter, setTypeFilter]     = useState('All')

  // Applied filters (click-to-search)
  const [appliedOrigin, setAppliedOrigin] = useState('All')
  const [appliedDest, setAppliedDest] = useState('All')
  const [appliedType, setAppliedType] = useState('All')

  const applyRideFilters = () => {
    setAppliedOrigin(originFilter)
    setAppliedDest(destFilter)
    setAppliedType(typeFilter)
  }
  const [showPostModal, setShowPostModal] = useState(false)
  const [postCountry, setPostCountry] = useState('MA')
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
      await deleteDoc(doc(db, 'rides', rideToDelete.id))
      setRides(prev => prev.filter(r => r.id !== rideToDelete.id))
      setRideToDelete(null)
    } catch (err) {
      console.error('Failed to delete ride:', err)
    } finally {
      setDeleteLoading(false)
    }
  }

  // New Ride Form
  const [form, setForm] = useState({
    type: 'taxi',
    origin: 'Rabat Agdal',
    destination: 'Kenitra Station',
    date: 'Today',
    time: '08:00 AM',
    costPerSeat: '25',
    seatsTotal: '4',
    seatsTaken: '1',
    pickupSpot: 'Agdal Station Taxi Stand',
    notes: '',
    phone: profile?.phone || '',
  })
  const [posting, setPosting] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    const q = query(collection(db, 'rides'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setRides(fetched)
      setLoading(false)
    }, (err) => {
      console.warn('Rides snapshot fallback:', err)
      setRides([])
      setLoading(false)
    })

    return () => unsub()
  }, [])

  const handlePostRide = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!form.origin.trim()) return setFormError('Departure origin is required.')
    if (!form.destination.trim()) return setFormError('Arrival destination is required.')
    if (!form.costPerSeat || isNaN(form.costPerSeat)) return setFormError('Price per seat in MAD is required.')

    setPosting(true)
    try {
      const rideData = {
        type: form.type,
        origin: form.origin.trim(),
        destination: form.destination.trim(),
        date: form.date.trim() || 'Today',
        time: form.time.trim() || 'Flexible',
        costPerSeat: Number(form.costPerSeat),
        seatsTotal: Number(form.seatsTotal) || 4,
        seatsTaken: Number(form.seatsTaken) || 1,
        pickupSpot: form.pickupSpot.trim() || 'Agdal Station',
        notes: form.notes.trim() || 'Splitting ride with fellow students.',
        phone: form.phone.trim() || null,
        organizerId: user?.uid || 'guest',
        organizerName: profile?.displayName || user?.displayName || 'Student Driver',
        organizerRole: profile?.role || 'student',
        organizerUniversity: profile?.university || null,
        createdAt: new Date().toISOString(),
      }

      await addDoc(collection(db, 'rides'), {
        ...rideData,
        createdAt: serverTimestamp(),
      })

      setShowPostModal(false)
    } catch (err) {
      console.error('Failed to post ride:', err)
      setFormError('Error posting ride. Please try again.')
    } finally {
      setPosting(false)
    }
  }

  const joinRideGroup = async (ride) => {
    if (!user) {
      setPage('login')
      return
    }
    if (ride.organizerId === user.uid) {
      setPage('inbox')
      return
    }

    try {
      const convId = [user.uid, ride.organizerId].sort().join('_')
      await setDoc(doc(db, 'conversations', convId), {
        participants: [user.uid, ride.organizerId],
        updatedAt: serverTimestamp(),
        lastMessage: `Hi! I want to join your ride: ${ride.origin} ➔ ${ride.destination} (${ride.time})`,
        unreadCount: { [ride.organizerId]: 1 }
      }, { merge: true })

      setPage('inbox')
    } catch (e) {
      console.error('Failed to join ride group:', e)
      setPage('inbox')
    }
  }

  const filteredRides = rides.filter(r => {
    const matchOrigin = !appliedOrigin || appliedOrigin === 'All' || normalizeText(r.origin || '').includes(normalizeText(appliedOrigin))
    const matchDest   = !appliedDest || appliedDest === 'All' || normalizeText(r.destination || '').includes(normalizeText(appliedDest))
    const matchType   = appliedType === 'All' || r.type === appliedType
    return matchOrigin && matchDest && matchType
  })

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 50% 10%, #0F172A 0%, #060D19 80%)',
      color: '#FFFFFF',
      paddingBottom: '4rem',
    }}>
      {/* Top Banner Header */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(6, 182, 212, 0.12) 0%, rgba(6, 13, 25, 0) 100%)',
        borderBottom: '1px solid rgba(6, 182, 212, 0.15)',
        padding: '2.5rem 1rem 2rem',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 99, background: 'rgba(6, 182, 212, 0.12)', border: '1px solid rgba(6, 182, 212, 0.3)', marginBottom: 10 }}>
                <Zap size={13} color={colors.cyan} />
                <span style={{ fontSize: 11, fontWeight: 700, color: colors.cyan, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Student Commute Solution
                </span>
              </div>
              <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 32, fontWeight: 800, margin: '4px 0', letterSpacing: '-0.5px' }}>
                {t('rideshareTitle') || 'Rideshare & Grand Taxi Group Splitter'}
              </h1>
              <p style={{ color: colors.mutedLight, fontSize: 14, maxWidth: 680 }}>
                {t('rideshareSub') || 'Skip chaotic taxi stations, avoid price surges, and never commute alone. Find intercity carpools or group up with students to split Grand Taxis.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => user ? setShowPostModal(true) : setPage('login')}
              style={{
                background: 'linear-gradient(135deg, #00C896 0%, #06B6D4 100%)',
                color: '#060D19',
                fontWeight: 700,
                fontSize: 14,
                padding: '12px 22px',
                borderRadius: 12,
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 20px rgba(6, 182, 212, 0.35)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <Plus size={18} strokeWidth={2.5} />
              {t('offerRideBtn') || t('postRideBtn') || 'Offer Ride / Start Taxi Group'}
            </button>
          </div>

          {/* Search Filters Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12,
            background: 'rgba(15, 23, 42, 0.8)',
            padding: 16,
            borderRadius: 16,
            border: '1px solid rgba(6, 182, 212, 0.2)',
            backdropFilter: 'blur(12px)',
          }}>
            {/* Origin City */}
            
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: colors.cyan, textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>
                Departure (From)
              </label>
              <input
                list="originCities"
                value={originFilter}
                onChange={e => setOriginFilter(e.target.value)}
                placeholder="All or start typing city..."
                style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1px solid rgba(6, 182, 212, 0.25)', background: 'rgba(6, 13, 25, 0.85)', color: '#FFFFFF', fontSize: 13, outline: 'none' }}
              />
              <datalist id="originCities">
                <option value="All">All</option>
                {Array.isArray(moroccoCities) && moroccoCities.slice(0,200).map((c,i) => (
                  <option key={`o-${i}`} value={c.en}>{c.en}</option>
                ))}
              </datalist>
            </div>

            {/* Destination City */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: colors.cyan, textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>
                Arrival (To)
              </label>
              <input
                list="destCities"
                value={destFilter}
                onChange={e => setDestFilter(e.target.value)}
                placeholder="All or start typing city..."
                style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1px solid rgba(6, 182, 212, 0.25)', background: 'rgba(6, 13, 25, 0.85)', color: '#FFFFFF', fontSize: 13, outline: 'none' }}
              />
              <datalist id="destCities">
                <option value="All">All</option>
                {Array.isArray(moroccoCities) && moroccoCities.slice(0,200).map((c,i) => (
                  <option key={`d-${i}`} value={c.en}>{c.en}</option>
                ))}
              </datalist>
            </div>

            {/* Ride Type */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: colors.cyan, textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>
                Ride Mode
              </label>
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 10,
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                  background: 'rgba(6, 13, 25, 0.85)',
                  color: '#FFFFFF',
                  fontSize: 13,
                  outline: 'none',
                }}
              >
                <option value="All" style={{ background: colors.navy }}>All Modes (Carpool & Taxis)</option>
                <option value="taxi" style={{ background: colors.navy }}>Grand Taxi Splitter Group</option>
                <option value="carpool" style={{ background: colors.navy }}>Student Private Carpool</option>
              </select>
            </div>

            {/* Search / Apply filters */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={() => applyRideFilters()} style={{ padding: '10px 14px', borderRadius: 10, background: 'linear-gradient(135deg,#00C896,#06B6D4)', border: 'none', color: '#061018', fontWeight: 700, cursor: 'pointer' }}>
                {t ? t('searchBtn') : 'Search'}
              </button>
              <button onClick={() => { setOriginFilter('All'); setDestFilter('All'); setTypeFilter('All'); applyRideFilters(); }} style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer' }}>
                {t ? t('resetBtn') : 'Reset'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main List Container */}
      <div style={{ maxWidth: 1200, margin: '2rem auto 0', padding: '0 1rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: colors.mutedLight }}>
            Loading available rides & taxi groups...
          </div>
        ) : filteredRides.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: 'rgba(15, 23, 42, 0.5)',
            borderRadius: 20,
            border: '1px solid rgba(6, 182, 212, 0.15)',
          }}>
            <Car size={48} color={colors.cyan} style={{ opacity: 0.5, marginBottom: 12 }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>No active rides found for this route</h3>
            <p style={{ color: colors.mutedLight, fontSize: 13, marginBottom: 20 }}>
              Be the first student to offer a carpool or organize a Grand Taxi group for this route!
            </p>
            <Btn onClick={() => { setOriginFilter('All'); setDestFilter('All'); setTypeFilter('All'); }}>
              Reset Search Filters
            </Btn>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
            {filteredRides.map(ride => {
              const seatsRemaining = ride.seatsTotal - ride.seatsTaken
              const isTaxi = ride.type === 'taxi'

              return (
                <div
                  key={ride.id}
                  style={{
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(6, 182, 212, 0.2)',
                    borderRadius: 18,
                    padding: 20,
                    backdropFilter: 'blur(12px)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                    transition: 'transform 0.2s ease, border-color 0.2s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-3px)'
                    e.currentTarget.style.borderColor = colors.cyan
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.2)'
                  }}
                >
                  <div>
                    {/* Top Row: Type & Price */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{
                          background: isTaxi ? 'rgba(245, 158, 11, 0.15)' : 'rgba(6, 182, 212, 0.15)',
                          border: `1px solid ${isTaxi ? 'rgba(245, 158, 11, 0.4)' : 'rgba(6, 182, 212, 0.4)'}`,
                          color: isTaxi ? colors.gold : colors.cyan,
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: 99,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                        }}>
                          {isTaxi ? 'Grand Taxi Group' : 'Student Carpool'}
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
                            title="Delete this ride"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        )}
                      </div>

                      <div style={{ fontSize: 16, fontWeight: 800, color: colors.mint }}>
                        {ride.costPerSeat} MAD <span style={{ fontSize: 11, color: colors.mutedLight, fontWeight: 500 }}>/ seat</span>
                      </div>
                    </div>

                    {/* Route Header */}
                    <div style={{
                      background: 'rgba(6, 13, 25, 0.6)',
                      padding: '12px 14px',
                      borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.06)',
                      marginBottom: 14,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 800, color: '#FFFFFF' }}>
                        <span>{ride.origin}</span>
                        <ArrowRight size={16} color={colors.cyan} style={{ flexShrink: 0 }} />
                        <span>{ride.destination}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, fontSize: 12, color: colors.mutedLight }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={13} color={colors.cyan} /> {ride.date}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={13} color={colors.mint} /> {ride.time}
                        </span>
                      </div>
                    </div>

                    {/* Seats & Pickup Point */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: colors.mutedLight, marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Users size={14} color={colors.cyan} /> Seats Open:
                        </span>
                        <span style={{ fontWeight: 700, color: seatsRemaining > 0 ? colors.mint : '#F87171' }}>
                          {seatsRemaining > 0 ? `${seatsRemaining} of ${ride.seatsTotal} seats open` : 'FULL'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                        <MapPin size={14} color={colors.gold} style={{ flexShrink: 0, marginTop: 2 }} />
                        <span><strong>Spot:</strong> {ride.pickupSpot}</span>
                      </div>

                      {ride.notes && (
                        <p style={{
                          fontSize: 12,
                          color: '#CBD5E1',
                          background: 'rgba(255,255,255,0.03)',
                          padding: '8px 10px',
                          borderRadius: 8,
                          margin: '4px 0 0',
                          lineHeight: 1.4,
                        }}>
                          "{ride.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Organizer Footer */}
                  <div style={{ paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar name={ride.organizerName} size={32} />
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 4 }}>
                            {ride.organizerName}
                            <CheckCircle2 size={12} color={colors.mint} />
                          </div>
                          <div style={{ fontSize: 10, color: colors.muted }}>
                            {ride.organizerUniversity || 'Student Organizer'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => joinRideGroup(ride)}
                        style={{
                          flex: 1,
                          padding: '9px 12px',
                          borderRadius: 10,
                          background: 'rgba(6, 182, 212, 0.15)',
                          border: '1px solid rgba(6, 182, 212, 0.35)',
                          color: colors.cyan,
                          fontWeight: 700,
                          fontSize: 12,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                        }}
                      >
                        <MessageCircle size={14} />
                        Join Ride Group
                      </button>

                      {ride.phone && (
                        <a
                          href={`tel:${ride.phone}`}
                          style={{
                            padding: '9px 12px',
                            borderRadius: 10,
                            background: 'rgba(0, 200, 150, 0.15)',
                            border: '1px solid rgba(0, 200, 150, 0.35)',
                            color: colors.mint,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textDecoration: 'none',
                          }}
                          title="Call or WhatsApp"
                        >
                          <Phone size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Post Ride / Taxi Group Modal */}
      {showPostModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(6, 13, 25, 0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
        }}>
          <div style={{
            background: '#0F172A',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            borderRadius: 20,
            width: '100%',
            maxWidth: 500,
            padding: 24,
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Car size={20} color={colors.cyan} />
                <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>
                  {t('offerRideBtn') || t('postRideBtn') || 'Offer Ride / Start Taxi Group'}
                </h2>
              </div>
              <button onClick={() => setShowPostModal(false)} style={{ background: 'none', border: 'none', color: colors.muted, cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePostRide} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: colors.mutedLight, display: 'block', marginBottom: 6 }}>
                  Ride Mode
                </label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, type: 'taxi' }))}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: 10,
                      border: `1px solid ${form.type === 'taxi' ? colors.gold : 'rgba(255,255,255,0.1)'}`,
                      background: form.type === 'taxi' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(6, 13, 25, 0.5)',
                      color: form.type === 'taxi' ? colors.gold : colors.mutedLight,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    🚕 Grand Taxi Group
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, type: 'carpool' }))}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: 10,
                      border: `1px solid ${form.type === 'carpool' ? colors.cyan : 'rgba(255,255,255,0.1)'}`,
                      background: form.type === 'carpool' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(6, 13, 25, 0.5)',
                      color: form.type === 'carpool' ? colors.cyan : colors.mutedLight,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    🚗 Student Carpool
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: 6 }}>Country</label>
                  <div style={{ marginBottom: 8 }}>
                    {/* country select controls which city suggestions are shown */}
                    <div style={{ width: '100%' }}>
                      <CountrySelect value={postCountry} onChange={v => setPostCountry(v)} />
                    </div>
                  </div>

                  <label style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: 6 }}>Departure (From) *</label>
                  <CityPicker
                    value={form.origin}
                    onChange={v => setForm(f => ({ ...f, origin: v }))}
                    placeholder="e.g. Rabat Agdal"
                    countryCode={postCountry}
                    lang={t?.lang}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: 6 }}>Arrival (To) *</label>
                  <CityPicker
                    value={form.destination}
                    onChange={v => setForm(f => ({ ...f, destination: v }))}
                    placeholder="e.g. Kenitra Station"
                    countryCode={postCountry}
                    lang={t?.lang}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Input
                  label="Date"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  placeholder="e.g. Today / Tomorrow"
                />
                <Input
                  label="Time"
                  value={form.time}
                  onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                  placeholder="e.g. 08:00 AM"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Input
                  label="Price per Seat (MAD) *"
                  type="number"
                  value={form.costPerSeat}
                  onChange={e => setForm(f => ({ ...f, costPerSeat: e.target.value }))}
                  placeholder="e.g. 25"
                />
                <Input
                  label="Total Seats"
                  type="number"
                  value={form.seatsTotal}
                  onChange={e => setForm(f => ({ ...f, seatsTotal: e.target.value }))}
                  placeholder="4 or 6"
                />
              </div>

              <Input
                label="Pickup Spot / Meeting Station *"
                value={form.pickupSpot}
                onChange={e => setForm(f => ({ ...f, pickupSpot: e.target.value }))}
                placeholder="e.g. ONCF Agdal Taxi Stand"
              />

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: colors.mutedLight, display: 'block', marginBottom: 6 }}>
                  Notes / Details
                </label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="e.g. Leaving early for 8:30 exam. 2 students already ready."
                  rows={2}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: 'rgba(6, 13, 25, 0.8)',
                    border: '1px solid rgba(6, 182, 212, 0.2)',
                    color: '#FFFFFF',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>

              <Input
                label="Phone Number / WhatsApp (Optional)"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+212 600 000 000"
              />

              {formError && (
                <div style={{ color: '#F87171', fontSize: 12, background: 'rgba(239, 68, 68, 0.1)', padding: '8px 12px', borderRadius: 8 }}>
                  {formError}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <Btn type="button" onClick={() => setShowPostModal(false)} variant="secondary" style={{ flex: 1 }}>
                  Cancel
                </Btn>
                <Btn type="submit" disabled={posting} style={{ flex: 1 }}>
                  {posting ? 'Posting...' : 'Publish Ride'}
                </Btn>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(rideToDelete)}
        onClose={() => setRideToDelete(null)}
        onConfirm={handleConfirmDeleteRide}
        title="Delete Ride?"
        message={`Are you sure you want to delete the ride from ${rideToDelete?.origin} to ${rideToDelete?.destination}?`}
        loading={deleteLoading}
      />
    </div>
  )
}
