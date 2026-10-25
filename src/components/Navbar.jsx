import { useState, useRef, useEffect } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../context/LanguageContext'
import { useNotifications } from '../context/NotificationContext'
import { Avatar, colors, OnlineStatusBadge, isOnlineUser } from './UI'
import { 
  GraduationCap, LogOut, Bell, Check, MapPin, Sliders, Menu, X,
  Rss, Home, ShoppingBag, Car, Briefcase, Calendar, Compass, Users, 
  MessageSquare, Bookmark, Layers, ChevronRight
} from 'lucide-react'
import { buildCities } from '../lib/cities'

export default function Navbar({ page, setPage }) {
  const { user, profile } = useAuth()
  const { lang, setLang, t, tCity } = useLanguage()
  const { notifications, unreadCount, areaAlertsEnabled, toggleAreaAlerts, alertPrefs, toggleAlertPref, selectedCity, setSelectedCity, markAllAsRead } = useNotifications()

  const [showNotifPopover, setShowNotifPopover] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 880 : false)
  const popoverRef = useRef(null)
  const mobileMenuRef = useRef(null)

  // Track window resize for responsive layout
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 880
      setIsMobile(mobile)
      if (!mobile) setMobileMenuOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Close popover or menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setShowNotifPopover(false)
      }
      if (mobileMenuOpen && mobileMenuRef.current && !mobileMenuRef.current.contains(e.target) && !e.target.closest('#mobile-menu-btn')) {
        setMobileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [mobileMenuOpen])

  // Nav link definitions with icons for touch drawer
  const navLinks = user ? [
    { id: 'feed',        label: t('feed'),                           icon: Rss,          color: colors.cyan },
    { id: 'listings',    label: t('housing'),                        icon: Home,         color: colors.mint },
    { id: 'marketplace', label: t('marketplace') || 'Marketplace',   icon: ShoppingBag,  color: '#F59E0B' },
    { id: 'rideshare',   label: t('rideshare') || 'Rideshare & Taxis', icon: Car,        color: '#8B5CF6' },
    { id: 'jobs',        label: t('jobs') || 'Jobs & Internships',   icon: Briefcase,    color: '#38BDF8' },
    { id: 'events',      label: t('events'),                         icon: Calendar,     color: '#EC4899' },
    { id: 'discover',    label: t('discover'),                       icon: Compass,      color: '#10B981' },
    { id: 'friends',     label: t('friends') || 'Friends',           icon: Users,        color: colors.mint },
    { id: 'inbox',       label: t('inbox'),                          icon: MessageSquare,color: colors.cyan },
    { id: 'myListings',  label: t('myListings'),                     icon: Layers,       color: colors.mutedLight },
    { id: 'saved',       label: t('saved'),                          icon: Bookmark,     color: colors.gold },
  ] : []

  const citiesList = ['All Cities & Countries', ...buildCities(['Paris', 'London', 'New York', 'Istanbul', 'Montreal', 'Dubai']).slice(1)]

  const handleNavClick = (id) => {
    setPage(id)
    setMobileMenuOpen(false)
  }

  return (
    <>
      <nav style={{
        background: 'rgba(6, 13, 25, 0.94)',
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
        <button onClick={() => { handleNavClick('feed') }} style={{
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
            fontSize: isMobile ? 18 : 20, 
            color: '#FFFFFF', 
            letterSpacing: '-0.5px',
          }}>
            Gha <span style={{ color: colors.cyan }}>Talaba</span>
          </span>
        </button>

        {/* Laptop / Desktop Nav Links: Visible ONLY on wide screens (keeps laptop experience identical) */}
        {!isMobile && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            overflowX: 'auto',
            padding: '4px 8px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            flex: 1,
            justifyContent: 'center',
            maxWidth: 820,
            margin: '0 auto',
          }}>
            {navLinks.map(l => {
              const isActive = page === l.id
              return (
                <button key={l.id} onClick={() => handleNavClick(l.id)} style={{
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
        )}

        {/* Right Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 8, flexShrink: 0 }} ref={popoverRef}>
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
                  width: 36,
                  height: 36,
                }}
              >
                <Bell size={17} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    background: '#EF4444',
                    color: 'white',
                    fontSize: 10,
                    fontWeight: 800,
                    width: 17,
                    height: 17,
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
                  width: Math.min(320, window.innerWidth - 20),
                  background: 'rgba(15, 23, 42, 0.98)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(0, 200, 150, 0.25)',
                  borderRadius: 14,
                  boxShadow: '0 12px 36px rgba(0,0,0,0.6)',
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
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: colors.white }}>
                        <input type="checkbox" checked={areaAlertsEnabled && (typeof alertPrefs !== 'undefined' ? alertPrefs.housing : true)} onChange={() => toggleAlertPref('housing')} style={{ width: 13, height: 13, cursor: 'pointer' }} />
                        <span>{t('housing') || 'Housing'}</span>
                      </label>

                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: colors.white }}>
                        <input type="checkbox" checked={areaAlertsEnabled && (typeof alertPrefs !== 'undefined' ? alertPrefs.marketplace : true)} onChange={() => toggleAlertPref('marketplace')} style={{ width: 13, height: 13, cursor: 'pointer' }} />
                        <span>{t('marketplace') || 'Marketplace'}</span>
                      </label>

                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: colors.white }}>
                        <input type="checkbox" checked={areaAlertsEnabled && (typeof alertPrefs !== 'undefined' ? alertPrefs.rides : true)} onChange={() => toggleAlertPref('rides')} style={{ width: 13, height: 13, cursor: 'pointer' }} />
                        <span>{t('rideshare') || 'Rides'}</span>
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
                        padding: '5px 8px',
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
                            if (n.link) handleNavClick(n.link)
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
              fontSize: 11,
              fontWeight: 700,
              borderRadius: 8,
              padding: '6px 6px',
              cursor: 'pointer',
              outline: 'none',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              height: 36,
            }}
          >
            <option value="en" style={{ background: '#0F172A', color: '#FFFFFF' }}>EN</option>
            <option value="fr" style={{ background: '#0F172A', color: '#FFFFFF' }}>FR</option>
            <option value="ar" style={{ background: '#0F172A', color: '#FFFFFF' }}>AR</option>
          </select>

          {/* User profile / auth actions */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button 
                onClick={() => handleNavClick('profile')} 
                title="My Profile"
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
              >
                <Avatar name={profile?.displayName || user.email} size={32} isOnline={isOnlineUser(profile)} />
              </button>

              {!isMobile && (
                <button 
                  onClick={() => signOut(auth)} 
                  title="Sign Out"
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)', 
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    color: '#F87171', 
                    fontSize: 12, 
                    fontWeight: 600,
                    padding: '6px 8px',
                    borderRadius: 8, 
                    cursor: 'pointer', 
                    display: 'flex',
                    alignItems: 'center',
                    height: 36,
                  }}
                >
                  <LogOut size={14} />
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => handleNavClick('login')} style={{
                background: 'transparent', 
                border: '1px solid rgba(6, 182, 212, 0.3)',
                color: colors.cyan, 
                fontSize: 12, 
                fontWeight: 600,
                padding: '6px 10px', 
                borderRadius: 8, 
                cursor: 'pointer', 
              }}>
                {t('signIn')}
              </button>
              <button onClick={() => handleNavClick('signup')} style={{
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

          {/* Mobile Hamburger Menu Toggle Button (Visible only on mobile/tablet) */}
          {isMobile && user && (
            <button
              id="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                background: mobileMenuOpen ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                border: mobileMenuOpen ? '1px solid rgba(6, 182, 212, 0.5)' : '1px solid rgba(255, 255, 255, 0.12)',
                color: mobileMenuOpen ? colors.cyan : colors.white,
                borderRadius: 8,
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              title="Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Drawer Overlay & Menu (Spacious, touch-friendly, zero crowded options or crowded text) */}
      {isMobile && mobileMenuOpen && (
        <div style={{
          position: 'fixed',
          top: 64,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 11, 20, 0.96)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          zIndex: 999,
          overflowY: 'auto',
          padding: '1.25rem 1rem 5rem 1rem',
          animation: 'fadeInDown 0.2s ease',
        }} ref={mobileMenuRef}>
          {/* User quick status in drawer */}
          {user && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(0, 200, 150, 0.08) 100%)',
              border: '1px solid rgba(6, 182, 212, 0.25)',
              borderRadius: 14,
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}>
              <div 
                onClick={() => handleNavClick('profile')}
                style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
              >
                <Avatar name={profile?.displayName || user.email} size={40} isOnline={isOnlineUser(profile)} />
                <div>
                  <div style={{ fontWeight: 700, color: colors.white, fontSize: 14 }}>
                    {profile?.displayName || user.email.split('@')[0]}
                  </div>
                  <div style={{ fontSize: 12, color: colors.cyan }}>
                    {profile?.university || 'Verified Student'} · Tap for Profile
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  signOut(auth)
                }}
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#F87171',
                  borderRadius: 8,
                  padding: '6px 10px',
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                }}
              >
                <LogOut size={13} /> {t('signOut') || 'Log Out'}
              </button>
            </div>
          )}

          {/* Navigation Category Cards */}
          <div style={{ marginBottom: 10, fontSize: 11, fontWeight: 700, color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Platform Navigation
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 10,
            marginBottom: 20,
          }}>
            {navLinks.map(link => {
              const IconComp = link.icon
              const isActive = page === link.id
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  style={{
                    background: isActive ? 'rgba(6, 182, 212, 0.18)' : 'rgba(17, 28, 46, 0.7)',
                    border: `1px solid ${isActive ? 'rgba(6, 182, 212, 0.45)' : 'rgba(255, 255, 255, 0.06)'}`,
                    borderRadius: 14,
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                    minHeight: 52,
                  }}
                >
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: isActive ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <IconComp size={18} color={isActive ? colors.cyan : (link.color || colors.mutedLight)} />
                  </div>
                  <span style={{
                    fontSize: 13,
                    fontWeight: isActive ? 800 : 600,
                    color: isActive ? colors.cyan : colors.white,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {link.label}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Quick Support & Help note */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 12,
            padding: '12px 14px',
            fontSize: 12,
            color: colors.muted,
            lineHeight: 1.5,
          }}>
            🇲🇦 <strong style={{ color: colors.white }}>Gha Talaba Mobile</strong> — Built with generous touch targets and low data usage for student commuters and campus living.
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (Modern App Style: 5 Key Touch Points for Mobile Users) */}
      {isMobile && user && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 60,
          background: 'rgba(6, 13, 25, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(6, 182, 212, 0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          zIndex: 900,
          padding: '0 4px',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.4)',
        }}>
          {/* Feed */}
          <button
            onClick={() => handleNavClick('feed')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              color: page === 'feed' ? colors.cyan : colors.muted,
              padding: '6px 8px',
              flex: 1,
            }}
          >
            <Rss size={19} />
            <span style={{ fontSize: 10, fontWeight: page === 'feed' ? 800 : 500 }}>{t('feed') || 'Feed'}</span>
          </button>

          {/* Housing */}
          <button
            onClick={() => handleNavClick('listings')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              color: page === 'listings' ? colors.mint : colors.muted,
              padding: '6px 8px',
              flex: 1,
            }}
          >
            <Home size={19} />
            <span style={{ fontSize: 10, fontWeight: page === 'listings' ? 800 : 500 }}>{t('housing') || 'Housing'}</span>
          </button>

          {/* Marketplace */}
          <button
            onClick={() => handleNavClick('marketplace')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              color: page === 'marketplace' ? '#F59E0B' : colors.muted,
              padding: '6px 8px',
              flex: 1,
            }}
          >
            <ShoppingBag size={19} />
            <span style={{ fontSize: 10, fontWeight: page === 'marketplace' ? 800 : 500 }}>{t('marketplace') || 'Shop'}</span>
          </button>

          {/* Friends */}
          <button
            onClick={() => handleNavClick('friends')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              color: page === 'friends' ? colors.mint : colors.muted,
              padding: '6px 8px',
              flex: 1,
            }}
          >
            <Users size={19} />
            <span style={{ fontSize: 10, fontWeight: page === 'friends' ? 800 : 500 }}>{t('friends') || 'Friends'}</span>
          </button>

          {/* Chat Inbox */}
          <button
            onClick={() => handleNavClick('inbox')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              color: page === 'inbox' ? colors.cyan : colors.muted,
              padding: '6px 8px',
              flex: 1,
            }}
          >
            <MessageSquare size={19} />
            <span style={{ fontSize: 10, fontWeight: page === 'inbox' ? 800 : 500 }}>{t('inbox') || 'Chat'}</span>
          </button>
        </div>
      )}
    </>
  )
}
