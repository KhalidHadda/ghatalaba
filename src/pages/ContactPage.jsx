import { useState } from 'react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { Mail, ArrowLeft, Send } from 'lucide-react'
import { db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import { colors, Avatar, Btn, Input, Textarea } from '../components/UI'
import { sendEmailNotification } from '../lib/emailService'

export default function ContactPage({ targetUser, setPage }) {
  const { user, profile } = useAuth()
  const [subject, setSubject] = useState(targetUser?.prefilledSubject || '')
  const [body, setBody]       = useState(targetUser?.prefilledBody || '')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')

  if (!user) return (
    <div style={{ background: colors.navy, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: colors.muted }}>
        <p style={{ marginBottom: 16 }}>You need to be signed in to send messages.</p>
        <Btn onClick={() => setPage('login')}>Sign in</Btn>
      </div>
    </div>
  )

  if (!targetUser) return (
    <div style={{ background: colors.navy, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.muted }}>
      No recipient selected.
    </div>
  )

  const send = async () => {
    if (!subject.trim() || !body.trim()) {
      setError('Please fill in both subject and message.')
      return
    }
    setLoading(true)
    try {
      await addDoc(collection(db, 'messages'), {
        fromUid:   user.uid,
        fromName:  profile?.displayName || user.email,
        toUid:     targetUser.uid,
        toName:    targetUser.displayName || targetUser.username || 'User',
        subject:   subject.trim(),
        body:      body.trim(),
        read:      false,
        createdAt: serverTimestamp(),
      })

      // Send Email Notification via EmailJS
      sendEmailNotification({
        toEmail: targetUser.email,
        toName: targetUser.displayName || targetUser.username,
        fromName: profile?.displayName || user.email,
        subject: subject.trim(),
        messageText: body.trim(),
        type: 'message',
      })

      setSent(true)
    } catch (err) {
      setError('Could not send: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (sent) return (
    <div style={{ background: colors.navy, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: colors.mint, marginBottom: 12 }}><Mail size={48} /></div>
        <h2 style={{ fontFamily: 'Syne, sans-serif', color: colors.mint, fontSize: 22, margin: '10px 0' }}>Message sent!</h2>
        <p style={{ color: colors.muted, marginBottom: 20 }}>
          {targetUser.displayName || 'They'} will see it in their real-time inbox & email.
        </p>
        <Btn onClick={() => setPage('listings')}>Back to listings</Btn>
      </div>
    </div>
  )

  return (
    <div style={{ background: colors.navy, minHeight: '100vh', padding: '1.5rem', color: colors.white }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <button onClick={() => setPage('listings')} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: colors.mint, fontSize: 14, marginBottom: 16, padding: 0, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <ArrowLeft size={16} /> Back
        </button>

        <div style={{
          background: colors.navyLight, border: '0.5px solid rgba(0,200,150,0.15)',
          borderRadius: 14, padding: '1.25rem', marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <Avatar name={targetUser.displayName || targetUser.username || '?'} size={44} />
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: colors.white }}>
              {targetUser.displayName || targetUser.username || 'User'}
            </div>
            <div style={{ fontSize: 12, color: colors.muted }}>{targetUser.role || 'Student'}</div>
          </div>
        </div>

        <div style={{
          background: colors.navyLight, border: '0.5px solid rgba(0,200,150,0.15)',
          borderRadius: 14, padding: '1.25rem',
        }}>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, margin: '0 0 16px', fontSize: 16, color: colors.white }}>
            Send a direct message
          </h3>

          <Input
            label="Subject"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="e.g. Interested in your listing"
          />
          <Textarea
            label="Message"
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Introduce yourself, ask questions…"
            style={{ minHeight: 120 }}
          />

          {error && <p style={{ color: '#FF6B6B', fontSize: 12, marginBottom: 10 }}>{error}</p>}

          <Btn style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={send} disabled={loading}>
            <Send size={16} /> {loading ? 'Sending…' : 'Send message'}
          </Btn>
        </div>
      </div>
    </div>
  )
}
