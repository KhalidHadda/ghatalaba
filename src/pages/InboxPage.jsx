import { useState, useEffect, useRef } from 'react'
import { collection, query, where, onSnapshot, orderBy, addDoc, updateDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore'
import { ArrowLeft, Send, MessageSquare } from 'lucide-react'
import { db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import { colors, Avatar, Btn, OnlineStatusBadge, isOnlineUser } from '../components/UI'
import { Skeleton } from '../components/Skeletons'
import { sendEmailNotification } from '../lib/emailService'
import { useLanguage } from '../context/LanguageContext'

export default function InboxPage({ setPage }) {
  const { user, profile } = useAuth()
  const { t } = useLanguage()
  const [messages, setMessages] = useState([])
  const [activePartner, setActivePartner] = useState(null) // { uid, name }
  const [partnerProfiles, setPartnerProfiles] = useState({})
  const [replyText, setReplyText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const chatEndRef = useRef(null)

  // Real-time listener for incoming & outgoing messages
  useEffect(() => {
    if (!user) return

    // Query messages sent to OR sent by current user
    const qIn = query(
      collection(db, 'messages'),
      where('toUid', '==', user.uid),
      orderBy('createdAt', 'asc')
    )

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
        const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0
        const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0
        return tA - tB
      })

      // Remove duplicate IDs if any
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
    const partnerName = isMe ? (m.toName || 'User') : (m.fromName || 'User')

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

  const conversations = Object.values(conversationsMap)

  // Fetch profiles of conversation partners for live online status
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
          console.error(e)
        }
      }
    })
  }, [messages])

  // Mark conversation messages as read when opened
  const openConversation = async (conv) => {
    setActivePartner({ uid: conv.partnerUid, name: conv.partnerName })

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

  // Send real-time reply
  const sendReply = async (e) => {
    e.preventDefault()
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
        subject: `New chat message from ${profile?.displayName || 'a student'}`,
        messageText: text,
        type: 'message',
      })
    } catch (err) {
      console.error('Failed to send reply:', err)
    } finally {
      setSending(false)
    }
  }

  if (!user) return (
    <div style={{ background: colors.navy, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.muted }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ marginBottom: 16 }}>Sign in to view your real-time chat inbox.</p>
        <Btn onClick={() => setPage('login')}>Sign In</Btn>
      </div>
    </div>
  )

  // Active Chat Thread View
  if (activePartner) {
    const threadMessages = messages.filter(
      m => (m.fromUid === user.uid && m.toUid === activePartner.uid) ||
           (m.fromUid === activePartner.uid && m.toUid === user.uid)
    )

    return (
      <div style={{ background: colors.navy, minHeight: 'calc(100vh - 64px)', padding: '1rem', color: colors.white }}>
        <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)' }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            paddingBottom: 14,
            borderBottom: '1px solid rgba(0,200,150,0.15)',
            marginBottom: 12,
          }}>
            <button
              onClick={() => setActivePartner(null)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: colors.mint,
                borderRadius: 8,
                padding: '6px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <ArrowLeft size={16} /> All Chats
            </button>
            <Avatar name={activePartner.name} size={36} isOnline={isOnlineUser(partnerProfiles[activePartner.uid])} />
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, color: colors.white }}>
                  {activePartner.name}
                </div>
                <div style={{ fontSize: 11, color: colors.muted }}>
                  Real-Time Live Chat
                </div>
              </div>
              <OnlineStatusBadge isOnline={isOnlineUser(partnerProfiles[activePartner.uid])} size="sm" />
            </div>
          </div>

          {/* Chat Messages Body */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}>
            {threadMessages.map(m => {
              const isMe = m.fromUid === user.uid
              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMe ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div style={{
                    maxWidth: '80%',
                    padding: '10px 14px',
                    borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: isMe ? 'linear-gradient(135deg, #00C896 0%, #06B6D4 100%)' : 'rgba(17, 28, 46, 0.9)',
                    color: isMe ? '#060D19' : colors.white,
                    border: isMe ? 'none' : '1px solid rgba(6, 182, 212, 0.2)',
                    fontWeight: isMe ? 600 : 400,
                    fontSize: 14,
                    lineHeight: 1.5,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    wordBreak: 'break-word',
                  }}>
                    {m.body}
                  </div>
                  <span style={{ fontSize: 10, color: colors.muted, marginTop: 4, padding: '0 4px' }}>
                    {m.createdAt?.toDate ? m.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'just now'}
                  </span>
                </div>
              )
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Reply Form */}
          <form onSubmit={sendReply} style={{
            display: 'flex',
            gap: 10,
            paddingTop: 12,
            borderTop: '1px solid rgba(0,200,150,0.15)',
          }}>
            <input
              type="text"
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder={`Message ${activePartner.name}...`}
              style={{
                flex: 1,
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                borderRadius: 12,
                padding: '12px 16px',
                color: colors.white,
                fontSize: 14,
                outline: 'none',
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
                padding: '0 18px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                opacity: !replyText.trim() ? 0.6 : 1,
              }}
            >
              <Send size={16} /> {sending ? '...' : t('send')}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Conversations List View
  return (
    <div style={{ background: colors.navy, minHeight: '100vh', padding: '1.5rem', color: colors.white }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, margin: 0 }}>
              {t('inboxTitle')}
            </h1>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Skeleton height="70px" borderRadius="14px" />
            <Skeleton height="70px" borderRadius="14px" />
            <Skeleton height="70px" borderRadius="14px" />
          </div>
        ) : conversations.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '4rem 2rem',
            border: '1px dashed rgba(0,200,150,0.2)', borderRadius: 16,
            background: 'rgba(17, 28, 46, 0.5)',
            color: colors.muted,
          }}>
            <MessageSquare size={40} color={colors.mint} style={{ marginBottom: 12, opacity: 0.8 }} />
            <h3 style={{ color: colors.white, margin: '0 0 8px', fontFamily: 'Syne, sans-serif' }}>{t('noConversations')}</h3>
            <p style={{ fontSize: 13, maxWidth: 360, margin: '0 auto 16px' }}>
              Explore housing or roommate profiles and click "Contact" to start a real-time message thread.
            </p>
            <Btn onClick={() => setPage('listings')}>Browse Listings</Btn>
          </div>
        ) : (
          <div style={{ border: '1px solid rgba(6, 182, 212, 0.2)', borderRadius: 16, overflow: 'hidden', background: colors.navyLight }}>
            {conversations.map(conv => (
              <div
                key={conv.partnerUid}
                onClick={() => openConversation(conv)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '16px 18px',
                  borderBottom: '1px solid rgba(6, 182, 212, 0.1)',
                  background: conv.unread ? 'rgba(0, 200, 150, 0.08)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0, 200, 150, 0.12)'}
                onMouseLeave={e => e.currentTarget.style.background = conv.unread ? 'rgba(0, 200, 150, 0.08)' : 'transparent'}
              >
                <Avatar name={conv.partnerName} size={42} isOnline={isOnlineUser(partnerProfiles[conv.partnerUid])} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: conv.unread ? 800 : 600, fontSize: 15, color: colors.white }}>
                        {conv.partnerName}
                      </span>
                      <OnlineStatusBadge isOnline={isOnlineUser(partnerProfiles[conv.partnerUid])} size="sm" showText={false} />
                    </div>
                    <span style={{ fontSize: 11, color: colors.muted }}>
                      {conv.lastMessage.createdAt?.toDate ? conv.lastMessage.createdAt.toDate().toLocaleDateString() : ''}
                    </span>
                  </div>
                  <div style={{
                    fontSize: 13,
                    color: conv.unread ? colors.mint : colors.muted,
                    fontWeight: conv.unread ? 600 : 400,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {conv.lastMessage.fromUid === user.uid ? 'You: ' : ''}{conv.lastMessage.body}
                  </div>
                </div>
                {conv.unread && (
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: colors.mint, boxShadow: '0 0 10px #00C896', flexShrink: 0 }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
