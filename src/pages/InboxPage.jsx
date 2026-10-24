import { useState, useEffect, useRef, useMemo } from 'react'
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  getDoc 
} from 'firebase/firestore'
import { 
  ArrowLeft, 
  Send, 
  MessageSquare, 
  Users, 
  Search, 
  CheckCheck, 
  Check, 
  UserPlus, 
  UserCheck, 
  Sparkles,
  User,
} from 'lucide-react'
import { db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import { useFriends } from '../hooks/useFriends'
import { colors, Avatar, Btn, OnlineStatusBadge, isOnlineUser } from '../components/UI'
import { Skeleton } from '../components/Skeletons'
import { sendEmailNotification } from '../lib/emailService'
import { useLanguage } from '../context/LanguageContext'

const QUICK_EMOJIS = ['👋', '❤️', '👍', '😂', '🔥', '👏', '🎉', '📚', '🤝']

export default function InboxPage({ setPage, initialPartner, onClearInitialPartner }) {
  const { user, profile } = useAuth()
  const { t } = useLanguage()
  const { friends, isFriend, addFriend } = useFriends()

  const [messages, setMessages] = useState([])
  const [activePartner, setActivePartner] = useState(() => {
    if (initialPartner?.uid) {
      return {
        uid: initialPartner.uid,
        name: initialPartner.displayName || initialPartner.name || initialPartner.username || 'Student',
        university: initialPartner.university,
        avatar: initialPartner.avatar,
      }
    }
    return null
  })
  const [partnerProfiles, setPartnerProfiles] = useState({})
  const [replyText, setReplyText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [sidebarTab, setSidebarTab] = useState('chats') // 'chats' | 'friends'
  const [searchFilter, setSearchFilter] = useState('')
  const chatEndRef = useRef(null)

  // Handle partner updates if passed from FriendsPage or ProfilePage
  useEffect(() => {
    if (initialPartner && initialPartner.uid) {
      setActivePartner(prev => {
        if (prev?.uid === initialPartner.uid) return prev
        return {
          uid: initialPartner.uid,
          name: initialPartner.displayName || initialPartner.name || initialPartner.username || 'Student',
          university: initialPartner.university,
          avatar: initialPartner.avatar,
        }
      })
      if (onClearInitialPartner) onClearInitialPartner()
    }
  }, [initialPartner, onClearInitialPartner])

  // Real-time listener for incoming & outgoing messages
  useEffect(() => {
    if (!user) return

    // Query messages sent to current user
    const qIn = query(
      collection(db, 'messages'),
      where('toUid', '==', user.uid),
      orderBy('createdAt', 'asc')
    )

    // Query messages sent by current user
    const qOut = query(
      collection(db, 'messages'),
      where('fromUid', '==', user.uid),
      orderBy('createdAt', 'asc')
    )

    let inMsgs = []
    let outMsgs = []

    const updateCombined = () => {
      const combined = [...inMsgs, ...outMsgs]
      // Sort chronologically
      combined.sort((a, b) => {
        const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.timestamp || 0)
        const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.timestamp || 0)
        return tA - tB
      })

      // Remove duplicate IDs
      const unique = []
      const seen = new Set()
      for (const m of combined) {
        if (!seen.has(m.id)) {
          seen.add(m.id)
          unique.push(m)
        }
      }

      setMessages(unique)
      setLoading(false)
    }

    const unsubIn = onSnapshot(qIn, (snapshot) => {
      inMsgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      updateCombined()
    }, () => setLoading(false))

    const unsubOut = onSnapshot(qOut, (snapshot) => {
      outMsgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      updateCombined()
    }, () => setLoading(false))

    return () => {
      unsubIn()
      unsubOut()
    }
  }, [user])

  // Scroll to bottom of chat thread when new messages arrive
  useEffect(() => {
    if (activePartner && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, activePartner])

  // Group messages by conversation partner
  const conversationsMap = {}
  messages.forEach(m => {
    const isMe = m.fromUid === user?.uid
    const partnerUid = isMe ? m.toUid : m.fromUid
    const partnerName = isMe ? (m.toName || 'Student') : (m.fromName || 'Student')

    if (!partnerUid) return

    if (!conversationsMap[partnerUid]) {
      conversationsMap[partnerUid] = {
        partnerUid,
        partnerName,
        lastMessage: m,
        unread: !isMe && !m.read,
        messages: [],
      }
    } else {
      conversationsMap[partnerUid].lastMessage = m
      if (!isMe && !m.read) conversationsMap[partnerUid].unread = true
    }
    conversationsMap[partnerUid].messages.push(m)
  })

  const conversations = Object.values(conversationsMap).sort((a, b) => {
    const tA = a.lastMessage?.createdAt?.toDate ? a.lastMessage.createdAt.toDate().getTime() : 0
    const tB = b.lastMessage?.createdAt?.toDate ? b.lastMessage.createdAt.toDate().getTime() : 0
    return tB - tA
  })

  // Fetch profiles of conversation partners for live online status and details
  useEffect(() => {
    const partnerUids = Object.keys(conversationsMap)
    partnerUids.forEach(async (uid) => {
      if (!partnerProfiles[uid]) {
        try {
          const snap = await getDoc(doc(db, 'users', uid))
          if (snap.exists()) {
            setPartnerProfiles(prev => ({ ...prev, [uid]: snap.data() }))
          }
        } catch (e) {
          console.warn(e)
        }
      }
    })
  }, [messages])

  // Also fetch activePartner profile if not present
  useEffect(() => {
    if (activePartner && !partnerProfiles[activePartner.uid]) {
      getDoc(doc(db, 'users', activePartner.uid)).then(snap => {
        if (snap.exists()) {
          setPartnerProfiles(prev => ({ ...prev, [activePartner.uid]: snap.data() }))
        }
      }).catch(() => {})
    }
  }, [activePartner])

  // Filtered conversations
  const filteredConversations = useMemo(() => {
    if (!searchFilter.trim()) return conversations
    const q = searchFilter.toLowerCase()
    return conversations.filter(c => 
      c.partnerName?.toLowerCase().includes(q) ||
      c.lastMessage?.body?.toLowerCase().includes(q)
    )
  }, [conversations, searchFilter])

  // Filtered friends for sidebar
  const filteredFriends = useMemo(() => {
    if (!searchFilter.trim()) return friends
    const q = searchFilter.toLowerCase()
    return friends.filter(f => 
      f.displayName?.toLowerCase().includes(q) ||
      f.university?.toLowerCase().includes(q) ||
      f.city?.toLowerCase().includes(q)
    )
  }, [friends, searchFilter])

  // Mark conversation messages as read when opened
  const openConversation = async (conv) => {
    setActivePartner({ 
      uid: conv.partnerUid, 
      name: conv.partnerName,
      university: partnerProfiles[conv.partnerUid]?.university,
    })

    // Mark unread incoming messages as read
    const unreadMsgs = conv.messages.filter(m => m.toUid === user.uid && !m.read)
    for (const m of unreadMsgs) {
      try {
        await updateDoc(doc(db, 'messages', m.id), { read: true })
      } catch (err) {
        console.warn('Error marking read:', err)
      }
    }
  }

  // Open chat with a specific friend directly
  const openFriendChat = (friend) => {
    setActivePartner({
      uid: friend.uid,
      name: friend.displayName || friend.name || friend.username || 'Student',
      university: friend.university,
      avatar: friend.avatar,
    })
  }

  // Send real-time message
  const sendReply = async (e) => {
    if (e) e.preventDefault()
    if (!replyText.trim() || !activePartner || sending) return

    setSending(true)
    const text = replyText.trim()
    setReplyText('')

    try {
      await addDoc(collection(db, 'messages'), {
        fromUid: user.uid,
        fromName: profile?.displayName || user.email,
        toUid: activePartner.uid,
        toName: activePartner.name,
        subject: 'Chat Message',
        body: text,
        read: false,
        createdAt: serverTimestamp(),
      })

      // Send EmailJS Notification to recipient
      sendEmailNotification({
        toName: activePartner.name,
        fromName: profile?.displayName || user.email,
        subject: `New message from ${profile?.displayName || 'a campus friend'}`,
        messageText: text,
        type: 'message',
      })
    } catch (err) {
      console.error('Failed to send reply:', err)
    } finally {
      setSending(false)
    }
  }

  // Add emoji reaction to message
  const handleReaction = async (messageId, emoji) => {
    try {
      const msgRef = doc(db, 'messages', messageId)
      await updateDoc(msgRef, {
        reaction: emoji,
        reactedBy: user.uid,
      })
    } catch (e) {
      console.warn('Reaction update error:', e)
    }
  }

  if (!user) {
    return (
      <div style={{ background: colors.navy, minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.muted, padding: '1rem' }}>
        <div style={{ textAlign: 'center', maxWidth: 380, background: colors.navyLight, padding: '2rem', borderRadius: 16, border: '1px solid rgba(6, 182, 212, 0.2)' }}>
          <MessageSquare size={36} color={colors.mint} style={{ marginBottom: 12 }} />
          <h3 style={{ color: colors.white, margin: '0 0 8px' }}>Sign In to Chat</h3>
          <p style={{ marginBottom: 18, fontSize: 13, color: colors.muted }}>Connect with student friends and chat in real-time.</p>
          <Btn onClick={() => setPage('login')} style={{ width: '100%' }}>Sign In</Btn>
        </div>
      </div>
    )
  }

  const threadMessages = activePartner ? messages.filter(
    m => (m.fromUid === user.uid && m.toUid === activePartner.uid) ||
         (m.fromUid === activePartner.uid && m.toUid === user.uid)
  ) : []

  const activePartnerProfile = activePartner ? partnerProfiles[activePartner.uid] : null
  const isPartnerOnline = isOnlineUser(activePartnerProfile) || activePartner?.isOnline

  return (
    <div style={{ background: colors.navy, minHeight: 'calc(100vh - 64px)', color: colors.white }}>
      <div style={{
        maxWidth: 1180,
        margin: '0 auto',
        padding: '1rem',
        height: 'calc(100vh - 88px)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        
        {/* Top Active Friends Bar (Quick horizontal bubbles) */}
        {friends.length > 0 && (
          <div style={{
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(6, 182, 212, 0.2)',
            borderRadius: 14,
            padding: '8px 14px',
            marginBottom: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: colors.mint, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
              <Users size={14} /> Friends:
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {friends.map(friend => {
                const online = friend.isOnline || isOnlineUser(friend)
                const isActive = activePartner?.uid === friend.uid
                return (
                  <button
                    key={friend.uid}
                    onClick={() => openFriendChat(friend)}
                    style={{
                      background: isActive ? 'rgba(0, 200, 150, 0.18)' : 'transparent',
                      border: isActive ? '1px solid rgba(0, 200, 150, 0.5)' : '1px solid transparent',
                      borderRadius: 10,
                      padding: '4px 8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      color: colors.white,
                      fontSize: 12,
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => {
                      if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                    }}
                    onMouseLeave={e => {
                      if (!isActive) e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <Avatar name={friend.displayName || friend.username} size={28} isOnline={online} />
                    <span style={{ fontWeight: 600 }}>{friend.displayName?.split(' ')[0]}</span>
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setPage('friends')}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                color: colors.cyan,
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              All Friends →
            </button>
          </div>
        )}

        {/* Main Messenger Area: Left Sidebar + Right Chat Canvas */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: activePartner ? '320px 1fr' : '1fr',
          gap: 12,
          flex: 1,
          minHeight: 0,
        }}>

          {/* Left Sidebar (Chats & Friends List) */}
          <div style={{
            background: colors.navyLight,
            border: '1px solid rgba(6, 182, 212, 0.2)',
            borderRadius: 16,
            display: activePartner ? (window.innerWidth < 768 ? 'none' : 'flex') : 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* Sidebar Header & Tabs */}
            <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid rgba(6, 182, 212, 0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, margin: 0, color: colors.white }}>
                  {t('inboxTitle') || 'Messages'}
                </h2>
                <button
                  onClick={() => setPage('friends')}
                  title="Manage Friends"
                  style={{
                    background: 'rgba(0, 200, 150, 0.12)',
                    border: '1px solid rgba(0, 200, 150, 0.3)',
                    color: colors.mint,
                    borderRadius: 8,
                    padding: '4px 8px',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Users size={12} /> Friends
                </button>
              </div>

              {/* Sub-tabs: All Chats vs Friends List */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
                <button
                  onClick={() => setSidebarTab('chats')}
                  style={{
                    background: sidebarTab === 'chats' ? 'rgba(0, 200, 150, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    border: sidebarTab === 'chats' ? '1px solid rgba(0, 200, 150, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
                    color: sidebarTab === 'chats' ? colors.mint : colors.mutedLight,
                    borderRadius: 8,
                    padding: '6px 8px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <MessageSquare size={13} /> Chats ({conversations.length})
                </button>

                <button
                  onClick={() => setSidebarTab('friends')}
                  style={{
                    background: sidebarTab === 'friends' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    border: sidebarTab === 'friends' ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
                    color: sidebarTab === 'friends' ? colors.cyan : colors.mutedLight,
                    borderRadius: 8,
                    padding: '6px 8px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <Users size={13} /> Friends ({friends.length})
                </button>
              </div>

              {/* Search Bar */}
              <div style={{ position: 'relative' }}>
                <Search size={14} color={colors.muted} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={e => setSearchFilter(e.target.value)}
                  placeholder={sidebarTab === 'chats' ? "Search conversations..." : "Search friends list..."}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(6, 182, 212, 0.2)',
                    borderRadius: 8,
                    padding: '7px 10px 7px 30px',
                    color: colors.white,
                    fontSize: 12,
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Sidebar List Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 8 }}>
                  <Skeleton height="56px" borderRadius="10px" />
                  <Skeleton height="56px" borderRadius="10px" />
                  <Skeleton height="56px" borderRadius="10px" />
                </div>
              ) : sidebarTab === 'friends' ? (
                /* Friends List Tab */
                filteredFriends.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', color: colors.muted }}>
                    <Users size={28} color={colors.mint} style={{ marginBottom: 8, opacity: 0.7 }} />
                    <div style={{ fontSize: 13, color: colors.white, marginBottom: 4 }}>No friends found</div>
                    <p style={{ fontSize: 11, margin: '0 0 12px' }}>Add classmates to your friends list to chat anytime.</p>
                    <button
                      onClick={() => setPage('friends')}
                      style={{
                        background: 'linear-gradient(135deg, #00C896 0%, #06B6D4 100%)',
                        color: '#060D19',
                        border: 'none',
                        borderRadius: 8,
                        padding: '6px 12px',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Find Friends
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {filteredFriends.map(friend => {
                      const online = friend.isOnline || isOnlineUser(friend)
                      const isSelected = activePartner?.uid === friend.uid
                      return (
                        <div
                          key={friend.uid}
                          onClick={() => openFriendChat(friend)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '10px',
                            borderRadius: 12,
                            background: isSelected ? 'rgba(0, 200, 150, 0.15)' : 'transparent',
                            border: isSelected ? '1px solid rgba(0, 200, 150, 0.35)' : '1px solid transparent',
                            cursor: 'pointer',
                            transition: 'background 0.15s ease',
                          }}
                          onMouseEnter={e => {
                            if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
                          }}
                          onMouseLeave={e => {
                            if (!isSelected) e.currentTarget.style.background = 'transparent'
                          }}
                        >
                          <Avatar name={friend.displayName || friend.username} size={36} isOnline={online} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontWeight: 700, fontSize: 13, color: colors.white, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {friend.displayName}
                              </span>
                            </div>
                            <div style={{ fontSize: 11, color: colors.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {friend.university || friend.city || 'Student Peer'}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openFriendChat(friend)
                            }}
                            title="Message Friend"
                            style={{
                              background: 'rgba(0, 200, 150, 0.12)',
                              border: '1px solid rgba(0, 200, 150, 0.25)',
                              color: colors.mint,
                              borderRadius: 8,
                              padding: '5px 8px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Send size={12} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )
              ) : (
                /* Conversations Tab */
                filteredConversations.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: colors.muted }}>
                    <MessageSquare size={32} color={colors.mint} style={{ marginBottom: 10, opacity: 0.7 }} />
                    <div style={{ fontSize: 13, color: colors.white, marginBottom: 4 }}>No conversations yet</div>
                    <p style={{ fontSize: 11, margin: '0 0 14px' }}>Click on any friend to start chatting!</p>
                    <button
                      onClick={() => setSidebarTab('friends')}
                      style={{
                        background: 'linear-gradient(135deg, #00C896 0%, #06B6D4 100%)',
                        color: '#060D19',
                        border: 'none',
                        borderRadius: 8,
                        padding: '7px 14px',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Browse Friends
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {filteredConversations.map(conv => {
                      const isSelected = activePartner?.uid === conv.partnerUid
                      const partnerProfile = partnerProfiles[conv.partnerUid]
                      const online = isOnlineUser(partnerProfile)
                      return (
                        <div
                          key={conv.partnerUid}
                          onClick={() => openConversation(conv)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '10px 12px',
                            borderRadius: 12,
                            background: isSelected 
                              ? 'rgba(0, 200, 150, 0.18)' 
                              : conv.unread 
                                ? 'rgba(6, 182, 212, 0.1)' 
                                : 'transparent',
                            border: isSelected 
                              ? '1px solid rgba(0, 200, 150, 0.35)' 
                              : conv.unread 
                                ? '1px solid rgba(6, 182, 212, 0.25)' 
                                : '1px solid transparent',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={e => {
                            if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                          }}
                          onMouseLeave={e => {
                            if (!isSelected) e.currentTarget.style.background = conv.unread ? 'rgba(6, 182, 212, 0.1)' : 'transparent'
                          }}
                        >
                          <Avatar name={conv.partnerName} size={40} isOnline={online} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                              <span style={{ fontWeight: conv.unread ? 800 : 600, fontSize: 13, color: colors.white }}>
                                {conv.partnerName}
                              </span>
                              <span style={{ fontSize: 10, color: colors.muted }}>
                                {conv.lastMessage.createdAt?.toDate 
                                  ? conv.lastMessage.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                  : ''}
                              </span>
                            </div>
                            <div style={{
                              fontSize: 12,
                              color: conv.unread ? colors.mint : colors.muted,
                              fontWeight: conv.unread ? 700 : 400,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}>
                              {conv.lastMessage.fromUid === user.uid ? 'You: ' : ''}{conv.lastMessage.body}
                            </div>
                          </div>
                          {conv.unread && (
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors.mint, boxShadow: '0 0 8px #00C896', flexShrink: 0 }} />
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Right Chat Canvas / Conversation Thread */}
          {activePartner ? (
            <div style={{
              background: colors.navyLight,
              border: '1px solid rgba(6, 182, 212, 0.2)',
              borderRadius: 16,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              overflow: 'hidden',
            }}>
              {/* Chat Thread Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                borderBottom: '1px solid rgba(6, 182, 212, 0.15)',
                background: 'rgba(15, 23, 42, 0.6)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button
                    onClick={() => setActivePartner(null)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: colors.mint,
                      borderRadius: 8,
                      padding: '6px 10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    <ArrowLeft size={14} /> Back
                  </button>

                  <Avatar name={activePartner.name} size={38} isOnline={isPartnerOnline} />

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16, color: colors.white }}>
                        {activePartner.name}
                      </span>
                      {isFriend(activePartner.uid) && (
                        <span style={{
                          background: 'rgba(0, 200, 150, 0.15)',
                          border: '0.5px solid rgba(0, 200, 150, 0.4)',
                          color: colors.mint,
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 6,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                        }}>
                          <UserCheck size={10} /> Friend
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: isPartnerOnline ? colors.mint : colors.muted }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: isPartnerOnline ? '#00C896' : '#64748B' }} />
                      <span>{isPartnerOnline ? 'Online now' : 'Offline'}</span>
                      {activePartner.university && (
                        <span style={{ color: colors.muted }}>· {activePartner.university}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {!isFriend(activePartner.uid) && (
                    <button
                      onClick={() => addFriend({
                        uid: activePartner.uid,
                        displayName: activePartner.name,
                        university: activePartner.university,
                      })}
                      style={{
                        background: 'rgba(0, 200, 150, 0.12)',
                        border: '1px solid rgba(0, 200, 150, 0.3)',
                        color: colors.mint,
                        borderRadius: 8,
                        padding: '6px 10px',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <UserPlus size={13} /> Add Friend
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setPage('profile')
                    }}
                    title="View Profile"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: colors.mutedLight,
                      borderRadius: 8,
                      padding: '6px 10px',
                      fontSize: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <User size={13} /> Profile
                  </button>
                </div>
              </div>

              {/* Chat Messages Body */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}>
                {threadMessages.length === 0 ? (
                  <div style={{
                    margin: 'auto',
                    textAlign: 'center',
                    padding: '2rem',
                    color: colors.muted,
                  }}>
                    <div style={{
                      width: 52,
                      height: 52,
                      borderRadius: 14,
                      background: 'rgba(0, 200, 150, 0.12)',
                      border: '1px solid rgba(0, 200, 150, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px',
                    }}>
                      <Sparkles size={26} color={colors.mint} />
                    </div>
                    <div style={{ color: colors.white, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                      Start your conversation with {activePartner.name}
                    </div>
                    <p style={{ fontSize: 12, maxWidth: 300, margin: '0 auto' }}>
                      Say hello, talk about classes, housing, or student projects!
                    </p>
                  </div>
                ) : (
                  threadMessages.map(m => {
                    const isMe = m.fromUid === user.uid
                    return (
                      <div
                        key={m.id}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isMe ? 'flex-end' : 'flex-start',
                          maxWidth: '100%',
                        }}
                      >
                        <div style={{
                          position: 'relative',
                          maxWidth: '75%',
                          padding: '10px 14px',
                          borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          background: isMe 
                            ? 'linear-gradient(135deg, #00C896 0%, #06B6D4 100%)' 
                            : 'rgba(15, 23, 42, 0.95)',
                          color: isMe ? '#060D19' : colors.white,
                          border: isMe ? 'none' : '1px solid rgba(6, 182, 212, 0.25)',
                          fontWeight: isMe ? 600 : 400,
                          fontSize: 14,
                          lineHeight: 1.5,
                          boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                          wordBreak: 'break-word',
                        }}>
                          {m.body}

                          {/* Reaction badge if any */}
                          {m.reaction && (
                            <div style={{
                              position: 'absolute',
                              bottom: -8,
                              right: isMe ? 'auto' : -6,
                              left: isMe ? -6 : 'auto',
                              background: 'rgba(6, 13, 25, 0.9)',
                              border: '1px solid rgba(6, 182, 212, 0.3)',
                              borderRadius: 12,
                              padding: '1px 5px',
                              fontSize: 12,
                              boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                            }}>
                              {m.reaction}
                            </div>
                          )}
                        </div>

                        {/* Timestamp & read receipt */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 10,
                          color: colors.muted,
                          marginTop: 4,
                          padding: '0 4px',
                        }}>
                          <span>
                            {m.createdAt?.toDate 
                              ? m.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                              : 'just now'}
                          </span>
                          {isMe && (
                            <span title={m.read ? 'Read' : 'Delivered'}>
                              {m.read ? (
                                <CheckCheck size={13} color={colors.cyan} />
                              ) : (
                                <Check size={12} color={colors.muted} />
                              )}
                            </span>
                          )}

                          {/* Quick react buttons on hover */}
                          <div style={{ display: 'inline-flex', gap: 2, marginLeft: 6 }}>
                            <button
                              onClick={() => handleReaction(m.id, '❤️')}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 10, opacity: 0.6 }}
                              title="Love"
                            >
                              ❤️
                            </button>
                            <button
                              onClick={() => handleReaction(m.id, '👍')}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 10, opacity: 0.6 }}
                              title="Like"
                            >
                              👍
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick Emojis Row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderTop: '1px solid rgba(6, 182, 212, 0.1)',
                background: 'rgba(15, 23, 42, 0.4)',
                overflowX: 'auto',
                scrollbarWidth: 'none',
              }}>
                <span style={{ fontSize: 11, color: colors.muted, marginRight: 4 }}>Quick:</span>
                {QUICK_EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setReplyText(prev => prev + emoji)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: 6,
                      padding: '3px 6px',
                      fontSize: 13,
                      cursor: 'pointer',
                      transition: 'transform 0.1s ease',
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Message Composer Form */}
              <form onSubmit={sendReply} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 14px',
                borderTop: '1px solid rgba(6, 182, 212, 0.15)',
                background: 'rgba(15, 23, 42, 0.7)',
              }}>
                <input
                  type="text"
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder={`Message ${activePartner.name}...`}
                  style={{
                    flex: 1,
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(6, 182, 212, 0.25)',
                    borderRadius: 12,
                    padding: '11px 16px',
                    color: colors.white,
                    fontSize: 14,
                    outline: 'none',
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendReply()
                    }
                  }}
                />

                <button
                  type="submit"
                  disabled={!replyText.trim() || sending}
                  style={{
                    background: 'linear-gradient(135deg, #00C896 0%, #06B6D4 100%)',
                    border: 'none',
                    color: '#060D19',
                    borderRadius: 12,
                    padding: '11px 18px',
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: !replyText.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    opacity: !replyText.trim() ? 0.5 : 1,
                    boxShadow: !replyText.trim() ? 'none' : '0 2px 10px rgba(0, 200, 150, 0.3)',
                  }}
                >
                  <Send size={15} /> {sending ? '...' : (t('send') || 'Send')}
                </button>
              </form>
            </div>
          ) : (
            /* No conversation currently active (large screen placeholder) */
            <div style={{
              background: colors.navyLight,
              border: '1px solid rgba(6, 182, 212, 0.2)',
              borderRadius: 16,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '3rem 2rem',
              textAlign: 'center',
              color: colors.muted,
            }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                background: 'linear-gradient(135deg, rgba(0, 200, 150, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
                border: '1px solid rgba(0, 200, 150, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}>
                <MessageSquare size={32} color={colors.mint} />
              </div>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: colors.white, margin: '0 0 8px' }}>
                Modern Student Messaging
              </h3>
              <p style={{ fontSize: 13, maxWidth: 360, margin: '0 auto 20px', lineHeight: 1.5 }}>
                Select a conversation on the left or choose a friend from your list to chat in real time.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setSidebarTab('friends')}
                  style={{
                    background: 'rgba(0, 200, 150, 0.15)',
                    border: '1px solid rgba(0, 200, 150, 0.3)',
                    color: colors.mint,
                    borderRadius: 10,
                    padding: '8px 16px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Users size={15} /> View Friends
                </button>
                <button
                  onClick={() => setPage('friends')}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: colors.white,
                    borderRadius: 10,
                    padding: '8px 16px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Campus Network →
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  )
}
