import { useState } from 'react'
import { signInWithEmailAndPassword, sendPasswordResetEmail, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth'
import { ArrowLeft, KeyRound, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react'
import { auth } from '../lib/firebase'
import { useLanguage } from '../context/LanguageContext'
import { Input, Btn, colors } from '../components/UI'

export default function LoginPage({ setPage }) {
  const { t } = useLanguage()
  const [form, setForm]             = useState({ email: '', password: '' })
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [showForgot, setShowForgot] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetStatus, setResetStatus] = useState({ error: '', success: '' })
  // Remember me for persistent sessions
  const [remember, setRemember]     = useState(true)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    setError('')
    if (!form.email.trim()) return setError('Please enter your email.')
    if (!form.password) return setError('Please enter your password.')
    setLoading(true)
    try {
      // Set Firebase persistence according to "Remember me"
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence)
      await signInWithEmailAndPassword(auth, form.email.trim(), form.password)
      setPage('feed')
    } catch (err) {
      console.error('Sign-in error:', err)
      setError('Incorrect email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e?.preventDefault()
    setResetStatus({ error: '', success: '' })
    if (!resetEmail.trim()) {
      return setResetStatus({ error: 'Please enter your registered email address.', success: '' })
    }
    setResetLoading(true)
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim())
      setResetStatus({ 
        error: '', 
        success: `Reset link sent to ${resetEmail.trim()}! Check your email inbox or spam folder.` 
      })
    } catch (err) {
      console.error('Password reset error:', err)
      setResetStatus({ 
        error: 'Could not send reset link. Verify your email address is correct.', 
        success: '' 
      })
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', 
      background: 'radial-gradient(circle at 50% 20%, #0F1D33 0%, #060D19 80%)',
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '2rem 1rem',
      position: 'relative',
    }}>
      {/* Background glow effects */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400,
        height: 400,
        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, rgba(99, 102, 241, 0.05) 50%, transparent 70%)',
        pointerEvents: 'none',
        borderRadius: '50%',
        filter: 'blur(40px)',
      }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 5 }}>
        {/* Top Header Row with Back Button & Network Badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <button
            onClick={() => setPage('home')}
            style={{
              background: 'rgba(6, 182, 212, 0.12)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              color: colors.cyan,
              fontSize: 13,
              fontWeight: 700,
              padding: '8px 16px',
              borderRadius: 99,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(6, 182, 212, 0.22)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(6, 182, 212, 0.12)'}
          >
            <ArrowLeft size={16} /> {t('backToHome')}
          </button>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 99, background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
            <Sparkles size={13} color={colors.cyan} />
            <span style={{ fontSize: 11, fontWeight: 700, color: colors.cyan, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{t('moroccanStudentNetwork')}</span>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 32, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.5px' }}>
            <span style={{ color: colors.cyan }}>Gha Talaba</span>
          </div>
          <p style={{ color: colors.mutedLight, fontSize: 14, marginTop: 6 }}>{t('welcomeBack')}</p>
        </div>

        {!showForgot ? (
          <div style={{ 
            background: 'rgba(17, 28, 46, 0.85)', 
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(6, 182, 212, 0.2)', 
            borderRadius: 20, 
            padding: '2.25rem',
            boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
          }}>
            <Input 
              label={t('emailAddress')} 
              type="email" 
              value={form.email} 
              onChange={e => set('email', e.target.value)} 
              placeholder="you@university.ma" 
            />
            
            <div style={{ position: 'relative' }}>
              <Input 
                label={t('password')} 
                type="password" 
                value={form.password} 
                onChange={e => set('password', e.target.value)} 
                placeholder="Enter password" 
                onKeyDown={e => e.key === 'Enter' && handleSubmit()} 
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -8, marginBottom: 16 }}>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(form.email)
                    setShowForgot(true)
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: colors.cyan,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <KeyRound size={13} /> {t('forgotPassword')}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#F87171', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 8, padding: '10px 12px', fontSize: 12, marginBottom: 16 }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: colors.mutedLight, fontSize: 13 }}>
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} style={{ width: 16, height: 16 }} />
                <span style={{ color: '#E6EEF8', fontWeight: 600 }}>{t('rememberThisDevice') || 'Remember this device'}</span>
              </label>

              <button type="button" onClick={() => { setResetEmail(form.email); setShowForgot(true); }} style={{ background: 'none', border: 'none', color: colors.cyan, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                {t('forgotPassword')}
              </button>
            </div>

            <Btn variant="primary" style={{ width: '100%', padding: '13px', fontSize: 15 }} onClick={handleSubmit} disabled={loading}>
              {loading ? t('signingIn') : t('signIn')}
            </Btn>
          </div>
        ) : (
          /* Forgot Password View */
          <div style={{ 
            background: 'rgba(17, 28, 46, 0.85)', 
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(6, 182, 212, 0.25)', 
            borderRadius: 20, 
            padding: '2.25rem',
            boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.cyan }}>
                <KeyRound size={20} />
              </div>
              <div>
                <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 18, color: '#FFFFFF', margin: 0 }}>
                  {t('resetPasswordTitle')}
                </h3>
                <p style={{ fontSize: 12, color: colors.mutedLight, margin: 0 }}>
                  {t('resetPasswordSub')}
                </p>
              </div>
            </div>

            <Input 
              label={t('accountEmailAddress')} 
              type="email" 
              value={resetEmail} 
              onChange={e => setResetEmail(e.target.value)} 
              placeholder="you@university.ma" 
            />

            {resetStatus.error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#F87171', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 8, padding: '10px 12px', fontSize: 12, marginBottom: 16 }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{resetStatus.error}</span>
              </div>
            )}

            {resetStatus.success && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: '#34D399', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 8, padding: '10px 12px', fontSize: 12, marginBottom: 16 }}>
                <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{resetStatus.success}</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <Btn 
                variant="ghost" 
                style={{ flex: 1 }} 
                onClick={() => {
                  setShowForgot(false)
                  setResetStatus({ error: '', success: '' })
                }}
              >
                {t('backToSignIn')}
              </Btn>
              <Btn 
                variant="cyan" 
                style={{ flex: 1 }} 
                onClick={handleForgotPassword} 
                disabled={resetLoading}
              >
                {resetLoading ? t('sendingLink') : t('sendResetLink')}
              </Btn>
            </div>
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: 13, color: colors.mutedLight, marginTop: 24 }}>
          {t('noAccountYet')}{' '}
          <button onClick={() => setPage('signup')} style={{ background: 'none', border: 'none', color: colors.cyan, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
            {t('joinFree')} →
          </button>
        </p>
      </div>
    </div>
  )
}
