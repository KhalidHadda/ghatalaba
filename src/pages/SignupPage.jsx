import { useState } from 'react'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, serverTimestamp, getDocs, query, collection, where } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import { Input, Btn, colors } from '../components/UI'

const ROLES = [
  { id: 'student',  emoji: '🎓', label: 'Student',  desc: 'Find rooms & roommates' },
  { id: 'landlord', emoji: '🏠', label: 'Landlord',  desc: 'List your property' },
  { id: 'other',    emoji: '👤', label: 'Other',     desc: 'Just browsing or helping' },
]

export default function SignupPage({ setPage }) {
  const [role, setRole]     = useState('student')
  const [form, setForm]     = useState({ email: '', password: '', name: '', username: '', university: '' })
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [usernameStatus, setUsernameStatus] = useState(null)
  const [usernameTimer, setUsernameTimer]   = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const checkUsername = (val) => {
    if (usernameTimer) clearTimeout(usernameTimer)
    if (!val || val.length < 3) { setUsernameStatus(null); return }
    setUsernameStatus('checking')
    const t = setTimeout(async () => {
      const snap = await getDocs(query(collection(db, 'users'), where('username', '==', val.toLowerCase())))
      setUsernameStatus(snap.empty ? 'available' : 'taken')
    }, 500)
    setUsernameTimer(t)
  }

  const handleUsernameChange = (e) => {
    const val = e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase()
    set('username', val)
    checkUsername(val)
  }

  const handleSubmit = async () => {
    setError('')
    if (!form.name.trim())        return setError('Full name is required.')
    if (!form.username.trim())    return setError('Username is required.')
    if (form.username.length < 3) return setError('Username must be at least 3 characters.')
    if (usernameStatus === 'taken') return setError('That username is already taken.')
    if (!form.email.trim())       return setError('Email is required.')
    if (!form.password)           return setError('Password is required.')
    setLoading(true)
    try {
      const snap = await getDocs(query(collection(db, 'users'), where('username', '==', form.username)))
      if (!snap.empty) { setError('That username was just taken. Try another.'); setLoading(false); return }
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password)
      await setDoc(doc(db, 'users', cred.user.uid), {
        displayName: form.name.trim(), username: form.username.toLowerCase(),
        email: form.email, role, university: form.university || null,
        verified: false, createdAt: serverTimestamp(), avgRating: null, ratingCount: 0,
      })
      setPage('listings')
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''))
    } finally { setLoading(false) }
  }

  const hint = () => {
    if (!form.username) return null
    if (form.username.length < 3)       return { color: colors.muted,  text: 'At least 3 characters' }
    if (usernameStatus === 'checking')  return { color: colors.muted,  text: 'Checking…' }
    if (usernameStatus === 'taken')     return { color: '#FF6B6B',     text: '✕ Already taken' }
    if (usernameStatus === 'available') return { color: colors.mint,   text: '✓ Available' }
    return null
  }
  const h = hint()

  return (
    <div style={{ minHeight: '100vh', background: colors.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: 460 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: colors.mint }}>
            <span style={{ color: colors.gold }}>Gha Talaba</span>
          </div>
          <p style={{ color: colors.muted, fontSize: 14, marginTop: 8 }}>Create your account</p>
        </div>

        <div style={{ background: colors.navyLight, border: '0.5px solid rgba(0,200,150,0.15)', borderRadius: 16, padding: '2rem' }}>
          <p style={{ fontSize: 12, color: colors.muted, marginBottom: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}>I am a…</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
            {ROLES.map(r => (
              <button key={r.id} onClick={() => setRole(r.id)} style={{ flex: 1, padding: '12px 8px', borderRadius: 10, cursor: 'pointer', textAlign: 'center', border: `1px solid ${role === r.id ? colors.mint : 'rgba(0,200,150,0.15)'}`, background: role === r.id ? 'rgba(0,200,150,0.1)' : 'transparent', transition: 'all 0.15s' }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{r.emoji}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: role === r.id ? colors.mint : colors.mutedLight }}>{r.label}</div>
                <div style={{ fontSize: 10, color: colors.muted, marginTop: 2 }}>{r.desc}</div>
              </button>
            ))}
          </div>

          <Input label="Full name (real names only)" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Youssef Bennani" />

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: colors.muted, display: 'block', marginBottom: 5 }}>Username</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: colors.mint, fontSize: 14, pointerEvents: 'none', fontWeight: 600 }}>@</span>
              <input value={form.username} onChange={handleUsernameChange} placeholder="youssef_b" maxLength={24} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px 10px 28px', border: `0.5px solid ${usernameStatus === 'taken' ? '#FF6B6B' : usernameStatus === 'available' ? colors.mint : 'rgba(0,200,150,0.2)'}`, borderRadius: 8, fontSize: 14, fontFamily: 'Inter, sans-serif', background: 'rgba(255,255,255,0.05)', color: colors.white, outline: 'none' }} />
            </div>
            {h && <p style={{ fontSize: 11, color: h.color, marginTop: 4 }}>{h.text}</p>}
          </div>

          <Input label="Email address" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@email.com" />
          <Input label="Password" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min. 8 characters" />
          {role === 'student' && <Input label="University (optional)" value={form.university} onChange={e => set('university', e.target.value)} placeholder="e.g. FSR, ENCG Casablanca…" />}

          {error && <p style={{ color: '#FF6B6B', fontSize: 12, marginBottom: 12 }}>{error}</p>}
          <Btn style={{ width: '100%', padding: '13px', marginTop: 4 }} onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </Btn>
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: colors.muted, marginTop: 20 }}>
          Already have an account?{' '}
          <button onClick={() => setPage('login')} style={{ background: 'none', border: 'none', color: colors.mint, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Sign in</button>
        </p>
      </div>
    </div>
  )
}