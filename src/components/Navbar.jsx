import { useState, useRef, useEffect } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../context/LanguageContext'
import { useNotifications } from '../context/NotificationContext'
import { Avatar, colors, OnlineStatusBadge, isOnlineUser } from './UI'
import { GraduationCap, LogOut, Bell, Check, MapPin, Sliders } from 'lucide-react'
import { buildCities } from '../lib/cities'

export default function Navbar({ page, setPage }) {
  const { user, profile } = useAuth()
  const { lang, setLang, t, tCity } = useLanguage()
  const { notifications, unreadCount, areaAlertsEnabled, toggleAreaAlerts, alertPrefs, toggleAlertPref, selectedCity, setSelectedCity, markAllAsRead } = useNotifications()

  const [showNotifPopover, setShowNotifPopover] = useState(false)
  const popoverRef = useRef(null)

  // Close popover on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setShowNotifPopover(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const navLinks = user ? [
    { id: 'feed',        label: t('feed') },
    { id: 'listings',    label: t('housing') },
    { id: 'marketplace', label: t('marketplace') || 'Marketplace' },
    { id: 'rideshare',   label: t('rideshare') || 'Rideshare & Taxis' },
    { id: 'jobs',        label: t('jobs') || 'Jobs & Internships' },
    { id: 'events',      label: t('events') },
    { id: 'discover',    label: t('discover') },
    { id: 'friends',     label: t('friends') || 'Friends' },
    { id: 'inbox',       label: t('inbox') },
    { id: 'myListings',  label: t('myListings') },
    { id: 'saved',       label: t('saved') },
  ] : []

  const citiesList = ['All Cities & Countries', ...buildCities(['Paris', 'London', 'New York', 'Istanbul', 'Montreal', 'Dubai']).slice(1)]

  return (
    <nav style={{
      background: 'rgba(6, 13, 25, 0.88)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(6, 182, 212, 0.15)',
      padding: '0 1rem',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      height: 64, 
      flexShrink: 0, 
      position: 'sticky', 
      top: 0, 
      zIndex: 100,
      boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
    }}>
      {/* Brand Logo */}
      <button onClick={() => { window.location.reload() }} style={{
        background: 'none', 
        border: 'none', 
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexShrink: 0,
      }}>
        <div style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          background: 'linear-gradient(135deg, #00C896 0%, #06B6D4 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 14px rgba(6, 182, 212, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}>
          <GraduationCap size={20} color="#060D19" strokeWidth={2.2} />
        </div>
        <span style={{
          fontFamily: 'Space Grotesk, sans-serif', 
          fontWeight: 800,
          fontSize: 20, 
          color: '#FFFFFF', 
          letterSpacing: '-0.5px',
        }}>
          Gha <span style={{ color: colors.cyan }}>Talaba</span>
        </span>
      </button>

      {/* Nav Links - Scrollable on mobile */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        overflowX: 'auto',
        padding: '4px 8px',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        flexStyle: 1,
      }}>
        {navLinks.map(l => {
          const isActive = page === l.id
          return (
            <button key={l.id} onClick={() => setPage(l.id)} style={{
              background: isActive ? 'rgba(6, 182, 212, 0.15)' : 'none',
              border: isActive ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid transparent',
              cursor: 'pointer',
              color: isActive ? colors.cyan : colors.mutedLight,
              fontSize: 13, 
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              padding: '6px 11px', 
              borderRadius: 10,
              fontWeight: isActive ? 700 : 500,
              transition: 'all 0.2s ease', 
              position: 'relative',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            onMouseEnter={e => {
              if (!isActive) {
                e.currentTarget.style.color = '#FFFFFF'
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
              }
            }}
            onMouseLeave={e => {
              if (!isActive) {
                e.currentTarget.style.color = colors.mutedLight
                e.currentTarget.style.background = 'none'
              }
            }}
            >
              {l.label}
            </button>
          )
        })}
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }} ref={popoverRef}>
        {/* Notification Bell */}
        {user && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => {
                setShowNotifPopover(!showNotifPopover)
                if (!showNotifPopover) markAllAsRead()
              }}
              title="Notifications & Area Alerts"
              style={{
                background: unreadCount > 0 ? 'rgba(0, 200, 150, 0.18)' : 'rgba(255, 255, 255, 0.05)',
                border: unreadCount > 0 ? '1px solid rgba(0,200,150,0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                color: unreadCount > 0 ? colors.mint : colors.mutedLight,
                padding: 7,
                borderRadius: 10,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <Bell size={17} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -3,
                  right: -3,
                  background: '#EF4444',
                  color: 'white',
                  fontSize: 10,
                  fontWeight: 800,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 8px rgba(239,68,68,0.6)',
                }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Popover Drawer */}
            {showNotifPopover && (
              <div style={{
                position: 'absolute',
                top: 44,
                right: 0,
                width: 320,
                background: 'rgba(15, 23, 42, 0.96)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(0, 200, 150, 0.25)',
                borderRadius: 14,
                boxShadow: '0 12px 36px rgba(0,0,0,0.5)',
                padding: '14px',
                zIndex: 1000,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottom: '0.5px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 14, color: colors.white, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Bell size={15} color={colors.mint} /> Notifications
                  </div>
                  <button onClick={markAllAsRead} style={{ background: 'none', border: 'none', color: colors.mint, fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                    Mark all read
                  </button>
                </div>

                {/* Area Notifications Setting Box */}
                <div style={{ background: 'rgba(0,200,150,0.06)', border: '0.5px solid rgba(0,200,150,0.2)', padding: '10px 12px', borderRadius: 10, marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: colors.white, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={13} color={colors.cyan} /> {t('areaAlerts') || `Area Alerts`} ({tCity(selectedCity)})
                    </span>
                    <input
                      type="checkbox"
                      checked={areaAlertsEnabled}
                      onChange={toggleAreaAlerts}
                      style={{ accentColor: colors.mint, cursor: 'pointer', width: 15, height: 15 }}
                    />
                  </div>
                  <p style={{ fontSize: 11, color: colors.muted, margin: '0 0 6px' }}>
                    {t('areaAlertsSub') || 'Get instant notifications for new posts in your selected city.'}
                  </p>

                  {/* Per-section toggles */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, color: colors.white }}>
                      <input type="checkbox" checked={areaAlertsEnabled && (notifications.length >= 0 ? true : true) && (typeof alertPrefs !== 'undefined' ? alertPrefs.housing : true)} onChange={() => toggleAlertPref('housing')} style={{ width: 14, height: 14, cursor: 'pointer' }} />
                      <span>{t('housing') || 'Housing'}</span>
                    </label>

                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, color: colors.white }}>
                      <input type="checkbox" checked={areaAlertsEnabled && (typeof alertPrefs !== 'undefined' ? alertPrefs.marketplace : true)} onChange={() => toggleAlertPref('marketplace')} style={{ width: 14, height: 14, cursor: 'pointer' }} />
                      <span>{t('marketplace') || 'Marketplace'}</span>
                    </label>

                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, color: colors.white }}>
                      <input type="checkbox" checked={areaAlertsEnabled && (typeof alertPrefs !== 'undefined' ? alertPrefs.rides : true)} onChange={() => toggleAlertPref('rides')} style={{ width: 14, height: 14, cursor: 'pointer' }} />
                      <span>{t('rideshare') || 'Rideshare'}</span>
                    </label>
                  </div>

                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.9)',
                      border: '0.5px solid rgba(0,200,150,0.3)',
                      color: colors.white,
                      fontSize: 11,
                      padding: '4px 8px',
                      borderRadius: 6,
                    }}
                  >
                    {citiesList.map(c => <option key={c} value={c}>{tCity(c)}</option>)}
                  </select>
                </div>

                {/* Notification Items List */}
                <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {notifications.length === 0 ? (
                    <div style={{ fontSize: 12, color: colors.muted, textAlign: 'center', padding: '16px 0' }}>
                      No recent notifications.
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => {
                          setShowNotifPopover(false)
                          if (n.link) setPage(n.link)
                        }}
                        style={{
                          padding: '8px 10px',
                          borderRadius: 8,
                          background: n.read ? 'rgba(255,255,255,0.02)' : 'rgba(0,200,150,0.08)',
                          border: '0.5px solid rgba(255,255,255,0.05)',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: n.read ? 500 : 700, color: colors.white }}>{n.title}</div>
                        <div style={{ fontSize: 11, color: colors.muted, margin: '2px 0' }}>{n.body}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Language Selector */}
        <select
          value={lang}
          onChange={e => setLang(e.target.value)}
          style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(6, 182, 212, 0.25)',
            color: colors.cyan,
            fontSize: 12,
            fontWeight: 700,
            borderRadius: 8,
            padding: '5px 8px',
            cursor: 'pointer',
            outline: 'none',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
          }}
        >
          <option value="en" style={{ background: '#0F172A', color: '#FFFFFF' }}>EN 🇬🇧</option>
          <option value="fr" style={{ background: '#0F172A', color: '#FFFFFF' }}>FR 🇫🇷</option>
          <option value="ar" style={{ background: '#0F172A', color: '#FFFFFF' }}>العربية 🇲🇦</option>
        </select>

        {/* User profile / auth actions */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button 
              onClick={() => setPage('profile')} 
              title="My Profile"
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <Avatar name={profile?.displayName || user.email} size={34} isOnline={isOnlineUser(profile)} />
            </button>
            <button 
              onClick={() => signOut(auth)} 
              title="Sign Out"
              style={{
                background: 'rgba(239, 68, 68, 0.1)', 
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#F87171', 
                fontSize: 12, 
                fontWeight: 600,
                padding: '5px 8px',
                borderRadius: 8, 
                cursor: 'pointer', 
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setPage('login')} style={{
              background: 'transparent', 
              border: '1px solid rgba(6, 182, 212, 0.3)',
              color: colors.cyan, 
              fontSize: 12, 
              fontWeight: 600,
              padding: '6px 12px',
              borderRadius: 8, 
              cursor: 'pointer', 
            }}>
              {t('signIn')}
            </button>
            <button onClick={() => setPage('signup')} style={{
              background: 'linear-gradient(135deg, #00C896 0%, #06B6D4 100%)', 
              border: 'none', 
              color: '#060D19',
              fontSize: 12, 
              padding: '6px 12px', 
              borderRadius: 8,
              cursor: 'pointer', 
              fontWeight: 700,
            }}>
              {t('joinFree')}
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
