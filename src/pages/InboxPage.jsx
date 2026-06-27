import { useState, useEffect } from 'react'
import { collection, getDocs, query, where, orderBy, updateDoc, doc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import { colors, Avatar, Btn } from '../components/UI'

function MessageRow({ m, onClick }) {
  return (
    <div onClick={() => onClick(m)} style={{
      display: 'flex', gap: 14, alignItems: 'flex-start', padding: '14px 16px',
      background: m.read ? 'transparent' : 'rgba(0,200,150,0.05)',
      borderBottom: '0.5px solid rgba(0,200,150,0.1)',
      cursor: 'pointer', transition: 'background 0.15s',
    }}
    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,200,150,0.08)'}
    onMouseLeave={e => e.currentTarget.style.background = m.read ? 'transparent' : 'rgba(0,200,150,0.05)'}
    >
      <Avatar name={m.fromName || '?'} size={38} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
          <span style={{ fontWeight: m.read ? 400 : 700, fontSize: 14, color: colors.white }}>
            {m.fromName || 'Someone'}
          </span>
          <span style={{ fontSize: 11, color: colors.muted, flexShrink: 0 }}>
            {m.createdAt?.toDate?.()?.toLocaleDateString?.() || ''}
          </span>
        </div>
        <div style={{ fontSize: 13, color: m.read ? colors.muted : colors.mutedLight, marginBottom: 2, fontWeight: m.read ? 400 : 500 }}>
          {m.subject}
        </div>
        <div style={{ fontSize: 12, color: colors.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {m.body}
        </div>
      </div>
      {!m.read && (
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors.mint, flexShrink: 0, marginTop: 6 }} />
      )}
    </div>
  )
}

function MessageDetail({ m, onBack }) {
  return (
    <div style={{ padding: '1.5rem', maxWidth: 560, margin: '0 auto' }}>
      <button onClick={onBack} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: colors.mint, fontSize: 14, marginBottom: 20, padding: 0, fontWeight: 600,
      }}>← Inbox</button>
      <div style={{ background: colors.navyLight, border: '0.5px solid rgba(0,200,150,0.15)', borderRadius: 14, padding: '1.75rem' }}>
        <div style={{ display: 'flex', gap: 14, marginBottom: 20, paddingBottom: 16, borderBottom: '0.5px solid rgba(0,200,150,0.1)' }}>
          <Avatar name={m.fromName || '?'} size={44} />
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, color: colors.white }}>{m.fromName || 'User'}</div>
            <div style={{ fontSize: 12, color: colors.muted }}>{m.createdAt?.toDate?.()?.toLocaleString?.() || ''}</div>
          </div>
        </div>
        <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, margin: '0 0 14px', fontSize: 18, color: colors.white }}>{m.subject}</h3>
        <p style={{ fontSize: 14, color: colors.mutedLight, lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{m.body}</p>
      </div>
    </div>
  )
}

export default function InboxPage({ setPage }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!user) return
    getDocs(query(collection(db, 'messages'), where('toUid', '==', user.uid), orderBy('createdAt', 'desc')))
      .then(snap => setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(() => {}).finally(() => setLoading(false))
  }, [user])

  const openMessage = async (m) => {
    setSelected(m)
    if (!m.read) {
      await updateDoc(doc(db, 'messages', m.id), { read: true }).catch(() => {})
      setMessages(ms => ms.map(msg => msg.id === m.id ? { ...msg, read: true } : msg))
    }
  }

  const unread = messages.filter(m => !m.read).length

  if (!user) return (
    <div style={{ background: colors.navy, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.muted }}>
      Sign in to view your inbox.
    </div>
  )
  if (selected) return <div style={{ background: colors.navy, minHeight: '100vh', color: colors.white }}><MessageDetail m={selected} onBack={() => setSelected(null)} /></div>

  return (
    <div style={{ background: colors.navy, minHeight: '100vh', padding: '1.5rem', color: colors.white }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, margin: 0 }}>Inbox</h1>
            {unread > 0 && (
              <span style={{
                background: colors.mint, color: colors.navy,
                fontSize: 12, padding: '2px 10px', borderRadius: 99, fontWeight: 700,
              }}>{unread} new</span>
            )}
          </div>
          <p style={{ color: colors.muted, fontSize: 14, margin: 0 }}>Messages from landlords and students</p>
        </div>

        {loading ? (
          <p style={{ color: colors.muted, textAlign: 'center', padding: '3rem' }}>Loading…</p>
        ) : messages.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '4rem',
            border: '0.5px dashed rgba(0,200,150,0.15)', borderRadius: 14,
            color: colors.muted,
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
            <p>No messages yet. When someone contacts you, it'll show up here.</p>
          </div>
        ) : (
          <div style={{ border: '0.5px solid rgba(0,200,150,0.15)', borderRadius: 14, overflow: 'hidden', background: colors.navyLight }}>
            {messages.map(m => <MessageRow key={m.id} m={m} onClick={openMessage} />)}
          </div>
        )}
      </div>
    </div>
  )
}