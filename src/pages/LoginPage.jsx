import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { Input, Btn, colors } from '../components/UI'

export default function LoginPage({ setPage }) {
  const [form, setForm]       = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    setError(''); setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, form.email, form.password)
      setPage('listings')
    } catch {
      setError('Incorrect email or password.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{
      minHeight: '100vh', background: colors.navy,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: colors.mint }}>
            <span style={{ color: colors.gold }}>Gha Talaba</span>
          </div>
          <p style={{ color: colors.muted, fontSize: 14, marginTop: 8 }}>Welcome back</p>
        </div>

        <div style={{ background: colors.navyLight, border: '0.5px solid rgba(0,200,150,0.15)', borderRadius: 16, padding: '2rem' }}>
          <Input label="Email" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@email.com" />
          <Input label="Password" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Your password" onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          {error && <p style={{ color: '#FF6B6B', fontSize: 12, marginBottom: 12 }}>{error}</p>}
          <Btn style={{ width: '100%', padding: '13px' }} onClick={handleSubmit} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Btn>
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: colors.muted, marginTop: 20 }}>
          No account yet?{' '}
          <button onClick={() => setPage('signup')} style={{ background: 'none', border: 'none', color: colors.mint, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
            Join free →
          </button>
        </p>
      </div>
    </div>
  )
}