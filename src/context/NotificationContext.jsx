/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'

import { normalizeText } from '../lib/normalize'

const NotificationContext = createContext({
  notifications: [],
  unreadCount: 0,
  areaAlertsEnabled: true,
  toggleAreaAlerts: () => {},
  selectedCity: 'Rabat',
  setSelectedCity: () => {},
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
  markAllAsRead: () => {},
})

export function NotificationProvider({ children }) {
  const { user, profile } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [toasts, setToasts] = useState([])
  const [areaAlertsEnabled, setAreaAlertsEnabled] = useState(() => {
    return localStorage.getItem('gt_area_alerts') !== 'false'
  })
  const [customCity, setCustomCity] = useState(() => {
    return localStorage.getItem('gt_alert_city') || null
  })

  // Per-section alert preferences (housing/marketplace/rides)
  const [alertPrefs, setAlertPrefs] = useState(() => {
    try {
      const raw = localStorage.getItem('gt_alert_prefs')
      if (raw) return JSON.parse(raw)
    } catch {
      /* ignore */
    }
    return { housing: true, marketplace: true, rides: true }
  })

  const selectedCity = customCity || profile?.city || 'Rabat'

  const setSelectedCity = (city) => {
    setCustomCity(city)
    localStorage.setItem('gt_alert_city', city)
  }

  const toggleAreaAlerts = () => {
    setAreaAlertsEnabled(prev => {
      const next = !prev
      localStorage.setItem('gt_area_alerts', String(next))
      return next
    })
  }

  const toggleAlertPref = (section) => {
    setAlertPrefs(prev => {
      const next = { ...prev, [section]: !prev[section] }
      try {
        localStorage.setItem('gt_alert_prefs', JSON.stringify(next))
      } catch {
        /* ignore */
      }
      return next
    })
  }

  const handleSetSelectedCity = (city) => {
    setSelectedCity(city)
    localStorage.setItem('gt_alert_city', city)
  }

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const addToast = useCallback((toast, maybeType = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    let toastObj = {}
    if (typeof toast === 'string') {
      const typeTitle = maybeType === 'success' ? 'Success' : (maybeType === 'error' ? 'Notice' : 'Notification')
      toastObj = {
        title: typeTitle,
        body: toast,
        type: maybeType,
      }
    } else if (toast && typeof toast === 'object') {
      toastObj = toast
    }
    const newToast = { id, time: new Date(), ...toastObj }
    setToasts(prev => [newToast, ...prev].slice(0, 5))

    // Auto dismiss toast after 5s
    setTimeout(() => {
      removeToast(id)
    }, 5000)
  }, [removeToast])

  // 1. Real-time Firestore listener for incoming messages
  useEffect(() => {
    if (!user) {
      return
    }

    const qMessages = query(
      collection(db, 'messages'),
      where('toUid', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    )

    const unsubscribe = onSnapshot(qMessages, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data()
          // Trigger real-time toast for new message
          if (!data.read) {
            addToast({
              type: 'message',
              title: `New message from ${data.fromName || 'a student'}`,
              body: data.subject || data.body?.slice(0, 60) + '...',
            })
          }
        }
      })

      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        type: 'message',
        title: `Message from ${doc.data().fromName || 'User'}`,
        body: doc.data().subject || doc.data().body,
        time: doc.data().createdAt?.toDate() || new Date(),
        read: doc.data().read,
        link: 'inbox',
      }))

      setNotifications(prev => {
        // Keep non-message notifications like area alerts
        const otherNotifs = prev.filter(n => n.type !== 'message')
        return [...list, ...otherNotifs].sort((a, b) => b.time - a.time)
      })
    }, (err) => {
      console.warn('Real-time message listener warning:', err.message)
    })

    return () => unsubscribe()
  }, [user])

  // 2. Real-time listener for Area Housing & Roommate Alerts
  useEffect(() => {
    if (!areaAlertsEnabled || !selectedCity || !alertPrefs.housing) return

    // Real-time listener for new listings in selected city
    const qListings = query(
      collection(db, 'listings'),
      orderBy('createdAt', 'desc'),
      limit(20)
    )

    const unsubListings = onSnapshot(qListings, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data()
          const docCity = (data.city || data.cityName || '').toString()
          if (normalizeText(docCity) !== normalizeText(selectedCity)) return
          const isRecent = data.createdAt?.toDate ? (Date.now() - data.createdAt.toDate().getTime() < 3600000) : true
          if (isRecent) {
            addToast({
              type: 'housing',
              title: `New housing in ${selectedCity}`,
              body: `${data.title || 'Apartment/Room'} for ${data.price} DH/mo`,
            })
            setNotifications(prev => [{
              id: 'listing_' + change.doc.id,
              type: 'housing',
              title: `New listing in ${selectedCity}`,
              body: `${data.title || 'Student Room'} - ${data.price} DH`,
              time: data.createdAt?.toDate() || new Date(),
              read: false,
              link: 'listings',
            }, ...prev])
          }
        }
      })
    }, () => {})

    return () => {
      unsubListings()
    }
  }, [areaAlertsEnabled, selectedCity, alertPrefs.housing])

  // 3. Marketplace area alerts
  useEffect(() => {
    if (!areaAlertsEnabled || !selectedCity || !alertPrefs.marketplace) return

    const qMkt = query(
      collection(db, 'marketplace'),
      orderBy('createdAt', 'desc'),
      limit(20)
    )

    const unsubMkt = onSnapshot(qMkt, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data()
          const docCity = (data.city || data.cityName || '').toString()
          if (normalizeText(docCity) !== normalizeText(selectedCity)) return
          const isRecent = data.createdAt?.toDate ? (Date.now() - data.createdAt.toDate().getTime() < 3600000) : true
          if (isRecent) {
            addToast({
              type: 'marketplace',
              title: `New marketplace item in ${selectedCity}`,
              body: `${data.title || 'Item'} for ${data.price} ${data.currency || 'MAD'}`,
            })
            setNotifications(prev => [{
              id: 'mkt_' + change.doc.id,
              type: 'marketplace',
              title: `New item in ${selectedCity}`,
              body: `${data.title || 'Item'} - ${data.price} ${data.currency || 'MAD'}`,
              time: data.createdAt?.toDate() || new Date(),
              read: false,
              link: 'marketplace',
            }, ...prev])
          }
        }
      })
    }, () => {})

    return () => unsubMkt()
  }, [areaAlertsEnabled, selectedCity, alertPrefs.marketplace])

  // 4. Rideshare area alerts (listen for rides that originate or end in the selected city)
  useEffect(() => {
    if (!areaAlertsEnabled || !selectedCity || !alertPrefs.rides) return

    const qRides = query(
      collection(db, 'rideshares'),
      orderBy('createdAt', 'desc'),
      limit(50)
    )

    const unsubRides = onSnapshot(qRides, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data()
          const docOrigin = (data.originCity || '').toString()
          const docDest = (data.destCity || '').toString()

          const matchesOrigin = normalizeText(docOrigin) === normalizeText(selectedCity)
          const matchesDest = normalizeText(docDest) === normalizeText(selectedCity)

          if (!matchesOrigin && !matchesDest) return

          const isRecent = data.createdAt?.toDate ? (Date.now() - data.createdAt.toDate().getTime() < 3600000) : true
          if (!isRecent) return

          if (matchesOrigin) {
            addToast({
              type: 'rides',
              title: `New ride from ${selectedCity}`,
              body: `${data.originSpot || ''} → ${data.destCity} · ${data.pricePerSeat} ${data.currency || 'MAD'}`,
            })
            setNotifications(prev => [{
              id: 'ride_o_' + change.doc.id,
              type: 'rides',
              title: `New ride from ${selectedCity}`,
              body: `${data.originSpot || ''} → ${data.destCity} · ${data.pricePerSeat} ${data.currency || 'MAD'}`,
              time: data.createdAt?.toDate() || new Date(),
              read: false,
              link: 'rideshare',
            }, ...prev])
          }

          if (matchesDest) {
            addToast({
              type: 'rides',
              title: `New ride to ${selectedCity}`,
              body: `${data.originCity} → ${data.destSpot || ''} · ${data.pricePerSeat} ${data.currency || 'MAD'}`,
            })
            setNotifications(prev => [{
              id: 'ride_d_' + change.doc.id,
              type: 'rides',
              title: `New ride to ${selectedCity}`,
              body: `${data.originCity} → ${data.destSpot || ''} · ${data.pricePerSeat} ${data.currency || 'MAD'}`,
              time: data.createdAt?.toDate() || new Date(),
              read: false,
              link: 'rideshare',
            }, ...prev])
          }
        }
      })
    }, () => {})

    return () => unsubRides()
  }, [areaAlertsEnabled, selectedCity, alertPrefs.rides])

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      areaAlertsEnabled,
      toggleAreaAlerts,
      alertPrefs,
      toggleAlertPref,
      selectedCity,
      setSelectedCity: handleSetSelectedCity,
      toasts,
      addToast,
      removeToast,
      markAllAsRead,
    }}>
      {children}

      {/* Floating Toast Banners */}
      <div style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        maxWidth: 360,
        width: 'calc(100vw - 48px)',
        pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <div
            key={t.id}
            style={{
              pointerEvents: 'auto',
              background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(16px)',
              border: '1px solid #00C896',
              boxShadow: '0 8px 32px rgba(0, 200, 150, 0.25)',
              borderRadius: 12,
              padding: '12px 16px',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 12,
              animation: 'slideInRight 0.3s ease-out',
            }}
          >
            <div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 13, color: '#00C896', marginBottom: 2 }}>
                {t.title}
              </div>
              <div style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.4 }}>
                {t.body}
              </div>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748B',
                cursor: 'pointer',
                fontSize: 16,
                padding: 0,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotificationContext)
}

export const useNotification = useNotifications
