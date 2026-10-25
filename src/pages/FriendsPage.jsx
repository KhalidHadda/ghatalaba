import { useState, useMemo } from 'react'
import { 
  Users, 
  UserPlus, 
  UserCheck, 
  MessageSquare, 
  Search, 
  GraduationCap, 
  MapPin, 
  Trash2, 
  Sparkles, 
  ArrowRight,
  User,
  Check
} from 'lucide-react'
import { colors, Avatar, Btn, OnlineStatusBadge, Badge, isOnlineUser } from '../components/UI'
import { Skeleton } from '../components/Skeletons'
import { useAuth } from '../hooks/useAuth'
import { useFriends } from '../hooks/useFriends'
import { useLanguage } from '../context/LanguageContext'

export default function FriendsPage({ setPage, setSelectedUser }) {
  const { user } = useAuth()
  const { t, tCity } = useLanguage()
  const { friends, loading, suggestedPeers, isFriend, addFriend, removeFriend } = useFriends()

  const [activeTab, setActiveTab] = useState('all') // 'all' | 'online' | 'suggested'
  const [searchQuery, setSearchQuery] = useState('')
  const [filterUni, setFilterUni] = useState('all')
  const [removedNotification, setRemovedNotification] = useState('')

  // Filter friends based on search and active tab
  const filteredFriends = useMemo(() => {
    return friends.filter(friend => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch = !q || 
        friend.displayName?.toLowerCase().includes(q) || 
        friend.university?.toLowerCase().includes(q) || 
        friend.city?.toLowerCase().includes(q) ||
        friend.username?.toLowerCase().includes(q)

      const matchesUni = filterUni === 'all' || friend.university?.toLowerCase().includes(filterUni.toLowerCase())

      if (activeTab === 'online') {
        const isOnline = friend.isOnline || isOnlineUser(friend)
        return matchesSearch && matchesUni && isOnline
      }

      return matchesSearch && matchesUni
    })
  }, [friends, searchQuery, filterUni, activeTab])

  // Count online friends
  const onlineCount = useMemo(() => {
    return friends.filter(f => f.isOnline || isOnlineUser(f)).length
  }, [friends])

  // Get unique universities for filtering
  const universities = useMemo(() => {
    const unis = new Set(friends.map(f => f.university).filter(Boolean))
    return Array.from(unis)
  }, [friends])

  // Filter suggested peers
  const filteredSuggested = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return suggestedPeers
      .filter(p => !isFriend(p.uid) && p.uid !== user?.uid)
      .filter(p => {
        if (!q) return true
        return (
          p.displayName?.toLowerCase().includes(q) ||
          p.university?.toLowerCase().includes(q) ||
          p.city?.toLowerCase().includes(q) ||
          p.username?.toLowerCase().includes(q)
        )
      })
  }, [suggestedPeers, isFriend, user, searchQuery])

  // Start chat with friend
  const handleStartChat = (friend) => {
    if (setSelectedUser) {
      setSelectedUser({
        uid: friend.uid,
        displayName: friend.displayName,
        name: friend.displayName,
        username: friend.username,
        university: friend.university,
        city: friend.city,
      })
    }
    setPage('inbox')
  }

  // View friend profile
  const handleViewProfile = (friend) => {
    if (setSelectedUser) {
      setSelectedUser(friend)
    }
    setPage('profile')
  }

  // Handle remove friend
  const handleRemoveFriend = async (friend) => {
    await removeFriend(friend.uid)
    setRemovedNotification(`${friend.displayName} removed from friends list.`)
    setTimeout(() => setRemovedNotification(''), 3000)
  }

  if (!user) {
    return (
      <div style={{ background: colors.navy, minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', color: colors.white }}>
        <div style={{
          maxWidth: 420,
          textAlign: 'center',
          background: colors.navyLight,
          border: '1px solid rgba(6, 182, 212, 0.25)',
          borderRadius: 20,
          padding: '2.5rem 2rem',
          boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
        }}>
          <div style={{
            width: 60,
            height: 60,
            borderRadius: 16,
            background: 'rgba(0, 200, 150, 0.15)',
            border: '1px solid rgba(0, 200, 150, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Users size={32} color={colors.mint} />
          </div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22, margin: '0 0 10px' }}>
            Friends & Campus Network
          </h2>
          <p style={{ fontSize: 13, color: colors.muted, lineHeight: 1.6, marginBottom: 20 }}>
            Sign in to view your friends list, discover roommates and classmates, and chat in real-time.
          </p>
          <Btn onClick={() => setPage('login')} style={{ width: '100%' }}>
            Sign In to Connect
          </Btn>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: colors.navy, minHeight: 'calc(100vh - 64px)', padding: '1.5rem 1rem 3rem', color: colors.white }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        
        {/* Header Hero */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 24,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, rgba(0, 200, 150, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)',
                border: '1px solid rgba(0, 200, 150, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Users size={20} color={colors.mint} />
              </div>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, margin: 0 }}>
                {t('friends') || 'Friends'} & Campus Network
              </h1>
            </div>
            <p style={{ fontSize: 13, color: colors.muted, margin: 0 }}>
              Connect with university peers, study partners, and chat directly in real-time.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              onClick={() => setPage('inbox')}
              style={{
                background: 'linear-gradient(135deg, #00C896 0%, #06B6D4 100%)',
                color: '#060D19',
                border: 'none',
                borderRadius: 12,
                padding: '9px 18px',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(0, 200, 150, 0.3)',
              }}
            >
              <MessageSquare size={16} /> Open Chat Inbox
            </button>
          </div>
        </div>

        {/* Removed Notification Banner */}
        {removedNotification && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 12,
            padding: '10px 16px',
            marginBottom: 16,
            color: '#FCA5A5',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <Trash2 size={15} /> {removedNotification}
          </div>
        )}

        {/* Quick Stats Cards - Responsive: sleek 3-column on mobile, spacious cards on desktop */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 10,
          marginBottom: 16,
        }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(6, 182, 212, 0.2)',
            borderRadius: 12,
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'rgba(0, 200, 150, 0.15)',
              border: '1px solid rgba(0, 200, 150, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Users size={18} color={colors.mint} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: colors.white, fontFamily: 'Space Grotesk, sans-serif', lineHeight: 1.2 }}>
                {friends.length}
              </div>
              <div style={{ fontSize: 11, color: colors.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Total Friends
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(6, 182, 212, 0.2)',
            borderRadius: 12,
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'rgba(6, 182, 212, 0.15)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#00C896', boxShadow: '0 0 8px #00C896' }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: colors.white, fontFamily: 'Space Grotesk, sans-serif', lineHeight: 1.2 }}>
                {onlineCount}
              </div>
              <div style={{ fontSize: 11, color: colors.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Online Now
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(6, 182, 212, 0.2)',
            borderRadius: 12,
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Sparkles size={18} color={colors.gold} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: colors.white, fontFamily: 'Space Grotesk, sans-serif', lineHeight: 1.2 }}>
                {filteredSuggested.length}
              </div>
              <div style={{ fontSize: 11, color: colors.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Peers to Connect
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Tab Navigation Bar */}
        <div style={{
          background: colors.navyLight,
          border: '1px solid rgba(6, 182, 212, 0.2)',
          borderRadius: 16,
          padding: '12px 14px',
          marginBottom: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          {/* Top Row: Tabs & Search */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}>
            {/* Tabs - Smooth Swipeable Row with zero crowded text */}
            <div 
              className="no-scrollbar touch-scroll"
              style={{
                display: 'flex',
                gap: 8,
                overflowX: 'auto',
                paddingBottom: 4,
                WebkitOverflowScrolling: 'touch',
              }}
            >
              <button
                onClick={() => setActiveTab('all')}
                style={{
                  background: activeTab === 'all' ? 'rgba(0, 200, 150, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                  border: activeTab === 'all' ? '1px solid rgba(0, 200, 150, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: activeTab === 'all' ? colors.mint : colors.mutedLight,
                  borderRadius: 10,
                  padding: '8px 14px',
                  fontSize: 13,
                  fontWeight: activeTab === 'all' ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                <Users size={15} /> All Friends ({friends.length})
              </button>

              <button
                onClick={() => setActiveTab('online')}
                style={{
                  background: activeTab === 'online' ? 'rgba(0, 200, 150, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                  border: activeTab === 'online' ? '1px solid rgba(0, 200, 150, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: activeTab === 'online' ? colors.mint : colors.mutedLight,
                  borderRadius: 10,
                  padding: '8px 14px',
                  fontSize: 13,
                  fontWeight: activeTab === 'online' ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00C896' }} />
                Online Now ({onlineCount})
              </button>

              <button
                onClick={() => setActiveTab('suggested')}
                style={{
                  background: activeTab === 'suggested' ? 'rgba(6, 182, 212, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                  border: activeTab === 'suggested' ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: activeTab === 'suggested' ? colors.cyan : colors.mutedLight,
                  borderRadius: 10,
                  padding: '8px 14px',
                  fontSize: 13,
                  fontWeight: activeTab === 'suggested' ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                <UserPlus size={15} /> Suggested Peers ({filteredSuggested.length})
              </button>
            </div>

            {/* University Filter */}
            {universities.length > 0 && activeTab !== 'suggested' && (
              <select
                value={filterUni}
                onChange={e => setFilterUni(e.target.value)}
                style={{
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                  color: colors.cyan,
                  borderRadius: 10,
                  padding: '6px 12px',
                  fontSize: 12,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="all">All Universities</option>
                {universities.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            )}
          </div>

          {/* Search Bar Input */}
          <div style={{ position: 'relative' }}>
            <Search size={16} color={colors.muted} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'suggested' ? "Search classmates by name, major, university..." : "Filter your friends list by name, university, city..."}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                borderRadius: 10,
                padding: '9px 14px 9px 38px',
                color: colors.white,
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Content: Friends List Grid or Suggested Peers */}
        {activeTab === 'suggested' ? (
          <div>
            <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 16, fontFamily: 'Syne, sans-serif', fontWeight: 700, margin: 0, color: colors.white }}>
                Campus Peers & Potential Roommates
              </h3>
              <span style={{ fontSize: 12, color: colors.muted }}>
                Click "Add Friend" to connect & chat
              </span>
            </div>

            {filteredSuggested.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem 1.5rem',
                border: '1px dashed rgba(6, 182, 212, 0.25)',
                borderRadius: 16,
                background: 'rgba(17, 28, 46, 0.4)',
                color: colors.muted,
              }}>
                <UserCheck size={36} color={colors.mint} style={{ marginBottom: 10 }} />
                <p style={{ margin: 0, fontSize: 14, color: colors.white }}>You've connected with all suggested classmates!</p>
                <p style={{ margin: '6px 0 0', fontSize: 12 }}>Check back soon as new students sign up.</p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 14,
              }}>
                {filteredSuggested.map(peer => (
                  <div
                    key={peer.uid}
                    style={{
                      background: colors.navyLight,
                      border: '1px solid rgba(6, 182, 212, 0.2)',
                      borderRadius: 16,
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: 14,
                      transition: 'transform 0.15s ease, border-color 0.15s ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'rgba(0, 200, 150, 0.4)'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.2)'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <Avatar name={peer.displayName || peer.username} size={44} isOnline={peer.isOnline} />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 15, color: colors.white }}>
                              {peer.displayName || peer.username}
                            </div>
                            {peer.username && (
                              <div style={{ fontSize: 11, color: colors.mint }}>
                                @{peer.username}
                              </div>
                            )}
                          </div>
                        </div>
                        <OnlineStatusBadge isOnline={peer.isOnline} size="sm" showText={false} />
                      </div>

                      {peer.university && (
                        <div style={{ fontSize: 12, color: colors.mutedLight, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <GraduationCap size={13} color={colors.cyan} /> {peer.university}
                        </div>
                      )}

                      {peer.city && (
                        <div style={{ fontSize: 12, color: colors.muted, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                          <MapPin size={13} color={colors.gold} /> {tCity(peer.city)}
                        </div>
                      )}

                      {peer.bio && (
                        <p style={{ fontSize: 12, color: colors.muted, margin: '8px 0 0', lineHeight: 1.4 }}>
                          "{peer.bio}"
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 8, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <button
                        onClick={() => addFriend(peer)}
                        style={{
                          flex: 1,
                          background: 'linear-gradient(135deg, rgba(0, 200, 150, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)',
                          border: '1px solid rgba(0, 200, 150, 0.4)',
                          color: colors.mint,
                          borderRadius: 10,
                          padding: '8px 12px',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #00C896 0%, #06B6D4 100%)'
                          e.currentTarget.style.color = '#060D19'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 200, 150, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)'
                          e.currentTarget.style.color = colors.mint
                        }}
                      >
                        <UserPlus size={14} /> Add Friend
                      </button>

                      <button
                        onClick={() => handleStartChat(peer)}
                        title="Direct Message"
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          color: colors.white,
                          borderRadius: 10,
                          padding: '8px 12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <MessageSquare size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : loading ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
            gap: 14,
          }}>
            <Skeleton height="150px" borderRadius="16px" />
            <Skeleton height="150px" borderRadius="16px" />
            <Skeleton height="150px" borderRadius="16px" />
          </div>
        ) : (
          /* Active Friends List */
          <div>
            {filteredFriends.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '4rem 1.5rem',
                border: '1px dashed rgba(0, 200, 150, 0.25)',
                borderRadius: 16,
                background: 'rgba(17, 28, 46, 0.5)',
                color: colors.muted,
              }}>
                <Users size={44} color={colors.mint} style={{ marginBottom: 12, opacity: 0.8 }} />
                <h3 style={{ color: colors.white, margin: '0 0 8px', fontFamily: 'Syne, sans-serif' }}>
                  {activeTab === 'online' ? 'No friends currently online' : 'No friends found matching your filter'}
                </h3>
                <p style={{ fontSize: 13, maxWidth: 380, margin: '0 auto 18px', lineHeight: 1.5 }}>
                  {activeTab === 'online' 
                    ? 'None of your friends are currently active. Switch to "All Friends" or browse suggested classmates.'
                    : 'Discover classmates and fellow students in your city to build your study circle and chat in real-time.'}
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <Btn onClick={() => setActiveTab('suggested')}>
                    <UserPlus size={15} style={{ marginRight: 6 }} /> Discover Classmates
                  </Btn>
                  {activeTab === 'online' && (
                    <Btn variant="ghost" onClick={() => setActiveTab('all')}>
                      View All Friends
                    </Btn>
                  )}
                </div>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                gap: 14,
              }}>
                {filteredFriends.map(friend => {
                  const isOnline = friend.isOnline || isOnlineUser(friend)
                  return (
                    <div
                      key={friend.uid}
                      style={{
                        background: colors.navyLight,
                        border: '1px solid rgba(6, 182, 212, 0.2)',
                        borderRadius: 16,
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: 14,
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'rgba(0, 200, 150, 0.45)'
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 200, 150, 0.12)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.2)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      <div>
                        {/* Avatar & Online row */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Avatar name={friend.displayName || friend.username} size={46} isOnline={isOnline} />
                            <div>
                              <div style={{ fontWeight: 800, fontSize: 16, color: colors.white, fontFamily: 'Space Grotesk, sans-serif' }}>
                                {friend.displayName}
                              </div>
                              {friend.username && (
                                <div style={{ fontSize: 12, color: colors.mint }}>
                                  @{friend.username}
                                </div>
                              )}
                            </div>
                          </div>
                          <OnlineStatusBadge isOnline={isOnline} size="sm" />
                        </div>

                        {/* Details */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {friend.university && (
                            <div style={{ fontSize: 12, color: colors.mutedLight, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <GraduationCap size={14} color={colors.mint} /> {friend.university}
                            </div>
                          )}

                          {friend.city && (
                            <div style={{ fontSize: 12, color: colors.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <MapPin size={14} color={colors.cyan} /> {tCity(friend.city)}
                            </div>
                          )}

                          {friend.major && (
                            <div style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>
                              Major: {friend.major}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons: Chat Now, View Profile, Remove */}
                      <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <button
                          onClick={() => handleStartChat(friend)}
                          style={{
                            flex: 1,
                            background: 'linear-gradient(135deg, #00C896 0%, #06B6D4 100%)',
                            border: 'none',
                            color: '#060D19',
                            borderRadius: 10,
                            padding: '9px 12px',
                            fontWeight: 700,
                            fontSize: 12,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            boxShadow: '0 2px 10px rgba(0, 200, 150, 0.25)',
                          }}
                        >
                          <MessageSquare size={14} /> Chat
                        </button>

                        <button
                          onClick={() => handleViewProfile(friend)}
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            color: colors.white,
                            borderRadius: 10,
                            padding: '9px 12px',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                          }}
                        >
                          <User size={13} /> Profile
                        </button>

                        <button
                          onClick={() => handleRemoveFriend(friend)}
                          title="Remove Friend"
                          style={{
                            background: 'rgba(239, 68, 68, 0.08)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: '#F87171',
                            borderRadius: 10,
                            padding: '9px 10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
