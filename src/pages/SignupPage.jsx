import { useState } from 'react'
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth'
import { doc, setDoc, serverTimestamp, getDocs, query, collection, where } from 'firebase/firestore'
import { GraduationCap, Building2, User, ArrowLeft, Sparkles, AlertCircle, Mail, CheckCircle2, RefreshCw, ShoppingBag, Car } from 'lucide-react'
import { auth, db } from '../lib/firebase'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../hooks/useAuth'
import { Input, Btn, colors } from '../components/UI'
import LegalModal from '../components/LegalModal'

export default function SignupPage({ setPage }) {
  const { t } = useLanguage()
  const { reloadUser } = useAuth()
  const [role, setRole]     = useState('student')
  const [form, setForm]     = useState({ email: '', password: '', name: '', username: '', university: '' })
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [usernameStatus, setUsernameStatus] = useState(null)
  const [usernameTimer, setUsernameTimer]   = useState(null)
  const [pendingVerification, setPendingVerification] = useState(false)
  const [verificationNotice, setVerificationNotice]   = useState({ error: '', success: '' })
  const [resendLoading, setResendLoading]             = useState(false)
  const [checkLoading, setCheckLoading]               = useState(false)
  const [legalModalType, setLegalModalType]           = useState(null)

  const ROLES = [
    { id: 'student',  icon: GraduationCap, label: t('studentRole') || 'Student',       desc: t('studentRoleDesc') || 'Full access: Housing, polycopes, roommates, rides & jobs' },
    { id: 'landlord', icon: Building2,     label: t('landlordRole') || 'Homeowner',    desc: t('landlordRoleDesc') || 'List & manage housing rentals' },
    { id: 'seller',   icon: ShoppingBag,   label: t('sellerRole') || 'Merchant',       desc: t('sellerRoleDesc') || 'Sell textbooks, tech & supplies' },
    { id: 'driver',   icon: Car,           label: t('driverRole') || 'Driver / Taxi',  desc: t('driverRoleDesc') || 'Offer carpools & Grand Taxi co-rides' },
    { id: 'other',    icon: User,          label: t('otherRole') || 'Community',       desc: t('otherRoleDesc') || 'Browse marketplace & listings' },
  ]

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const checkUsername = (val) => {
    if (usernameTimer) clearTimeout(usernameTimer)
    if (!val || val.length < 3) { setUsernameStatus(null); return }
    setUsernameStatus('checking')
    const timer = setTimeout(async () => {
      try {
        const snap = await getDocs(query(collection(db, 'users'), where('username', '==', val.toLowerCase())))
        setUsernameStatus(snap.empty ? 'available' : 'taken')
      } catch {
        setUsernameStatus(null)
      }
    }, 400)
    setUsernameTimer(timer)
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
    if (!form.email.trim())       return setError('Email address is required.')
    if (!form.password)           return setError('Password is required.')
    if (form.password.length < 6) return setError('Password must be at least 6 characters.')
    setLoading(true)
    try {
      const snap = await getDocs(query(collection(db, 'users'), where('username', '==', form.username)))
      if (!snap.empty) { setError('That username was just taken. Try another.'); setLoading(false); return }
      
      const cred = await createUserWithEmailAndPassword(auth, form.email.trim(), form.password)
      
      // Send verification email
      try {
        await sendEmailVerification(cred.user)
      } catch (e) {
        console.error('Failed to send verification email:', e)
      }

      await setDoc(doc(db, 'users', cred.user.uid), {
        displayName: form.name.trim(), 
        username: form.username.toLowerCase(),
        email: form.email.trim(), 
        role, 
        university: form.university || null,
        verified: false, 
        emailVerified: false,
        createdAt: serverTimestamp(), 
        avgRating: null, 
        ratingCount: 0,
      })

      setPendingVerification(true)
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''))
    } finally { 
      setLoading(false) 
    }
  }

  const handleCheckVerification = async () => {
    setCheckLoading(true)
    setVerificationNotice({ error: '', success: '' })
    try {
      const isVerified = await reloadUser()
      if (isVerified) {
        setVerificationNotice({ error: '', success: t('emailVerifiedSuccess') })
        setTimeout(() => {
          setPage('feed')
        }, 1200)
      } else {
        setVerificationNotice({ error: t('emailNotVerifiedAlert'), success: '' })
      }
    } catch {
      setVerificationNotice({ error: 'Could not refresh verification status. Please try again.', success: '' })
    } finally {
      setCheckLoading(false)
    }
  }

  const handleResendEmail = async () => {
    setResendLoading(true)
    setVerificationNotice({ error: '', success: '' })
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser)
        setVerificationNotice({ error: '', success: t('verificationSent') })
      }
    } catch (err) {
      setVerificationNotice({ error: err.message.replace('Firebase: ', ''), success: '' })
    } finally {
      setResendLoading(false)
    }
  }

  const hint = () => {
    if (!form.username) return null
    if (form.username.length < 3)       return { color: colors.mutedLight,  text: 'At least 3 characters' }
    if (usernameStatus === 'checking')  return { color: colors.mutedLight,  text: 'Checking availability...' }
    if (usernameStatus === 'taken')     return { color: '#F87171',          text: 'Already taken' }
    if (usernameStatus === 'available') return { color: '#34D399',          text: 'Available' }
    return null
  }
  const h = hint()

  return (
    <div style={{
      minHeight: '100vh', 
      background: 'radial-gradient(circle at 50% 20%, #0F1D33 0%, #060D19 80%)',
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '2.5rem 1rem',
      position: 'relative',
    }}>
      {/* Background glow effects */}
      <div style={{
        position: 'absolute',
        top: '25%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 480,
        height: 480,
        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, rgba(99, 102, 241, 0.05) 50%, transparent 70%)',
        pointerEvents: 'none',
        borderRadius: '50%',
        filter: 'blur(50px)',
      }} />

      <div style={{ width: '100%', maxWidth: 480, position: 'relative', zIndex: 5 }}>
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
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 32, fontWeight: 800, color: '#FFFFFF' }}>
            <span style={{ color: colors.cyan }}>Gha Talaba</span>
          </div>
          <p style={{ color: colors.mutedLight, fontSize: 14, marginTop: 6 }}>{t('createAccount')}</p>
        </div>

        {!pendingVerification ? (
          <div style={{ 
            background: 'rgba(17, 28, 46, 0.85)', 
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(6, 182, 212, 0.2)', 
            borderRadius: 20, 
            padding: '2.25rem',
            boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
          }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: colors.mutedLight, marginBottom: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{t('iAmA')}</p>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              {ROLES.map(r => {
                const IconComp = r.icon
                const isSelected = role === r.id
                return (
                  <button key={r.id} onClick={() => setRole(r.id)} style={{ flex: 1, padding: '12px 8px', borderRadius: 12, cursor: 'pointer', textAlign: 'center', border: `1px solid ${isSelected ? '#06B6D4' : 'rgba(6, 182, 212, 0.15)'}`, background: isSelected ? 'rgba(6, 182, 212, 0.15)' : 'rgba(15, 23, 42, 0.5)', transition: 'all 0.2s ease' }}>
                    <div style={{ color: isSelected ? colors.cyan : colors.muted, marginBottom: 4, display: 'flex', justifyContent: 'center' }}>
                      <IconComp size={20} />
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: isSelected ? '#FFFFFF' : colors.mutedLight }}>{r.label}</div>
                    <div style={{ fontSize: 10, color: colors.muted, marginTop: 2 }}>{r.desc}</div>
                  </button>
                )
              })}
            </div>

            <Input label={t('fullName')} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Youssef Bennani" />

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: colors.mutedLight, display: 'block', marginBottom: 6 }}>{t('username')}</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: colors.cyan, fontSize: 14, pointerEvents: 'none', fontWeight: 700 }}>@</span>
                <input value={form.username} onChange={handleUsernameChange} placeholder="youssef_b" maxLength={24} style={{ width: '100%', boxSizing: 'border-box', padding: '11px 14px 11px 32px', border: `1px solid ${usernameStatus === 'taken' ? '#F87171' : usernameStatus === 'available' ? '#34D399' : 'rgba(6, 182, 212, 0.2)'}`, borderRadius: 10, fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif', background: 'rgba(15, 23, 42, 0.8)', color: '#FFFFFF', outline: 'none' }} />
              </div>
              {h && <p style={{ fontSize: 11, color: h.color, marginTop: 4, fontWeight: 600 }}>{h.text}</p>}
            </div>

            <Input label={t('emailAddress')} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@university.ma" />
            <Input label={t('password')} type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min. 6 characters" />
            {role === 'student' && <Input label={t('universityOptional')} value={form.university} onChange={e => set('university', e.target.value)} placeholder="e.g. FSR, ENCG Casablanca, EMI…" />}

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#F87171', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 8, padding: '10px 12px', fontSize: 12, marginBottom: 16 }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <Btn variant="primary" style={{ width: '100%', padding: '13px', fontSize: 15, marginTop: 4 }} onClick={handleSubmit} disabled={loading}>
              {loading ? t('creatingAccount') : t('createAccountBtn')}
            </Btn>
          </div>
        ) : (
          /* Email Verification Pending View */
          <div style={{ 
            background: 'rgba(17, 28, 46, 0.88)', 
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(6, 182, 212, 0.3)', 
            borderRadius: 20, 
            padding: '2.25rem',
            boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
            textAlign: 'center',
          }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(6, 182, 212, 0.15)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <Mail size={32} color={colors.cyan} />
            </div>

            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 22, fontWeight: 800, color: '#FFFFFF', margin: '0 0 8px' }}>
              {t('verifyEmailTitle')}
            </h3>

            <div style={{
              display: 'inline-block',
              background: 'rgba(6, 182, 212, 0.1)',
              border: '1px solid rgba(6, 182, 212, 0.25)',
              borderRadius: 99,
              padding: '4px 14px',
              fontSize: 13,
              fontWeight: 700,
              color: colors.cyan,
              marginBottom: 16,
            }}>
              {form.email.trim()}
            </div>

            <p style={{ color: colors.mutedLight, fontSize: 13, lineHeight: 1.6, margin: '0 0 20px' }}>
              {t('verifyEmailSubtitle')}
            </p>

            {verificationNotice.error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#F87171', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 8, padding: '10px 12px', fontSize: 12, marginBottom: 16, textAlign: 'left' }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{verificationNotice.error}</span>
              </div>
            )}

            {verificationNotice.success && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#34D399', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 8, padding: '10px 12px', fontSize: 12, marginBottom: 16, textAlign: 'left' }}>
                <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
                <span>{verificationNotice.success}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Btn 
                variant="cyan" 
                style={{ width: '100%', padding: '12px', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} 
                onClick={handleCheckVerification} 
                disabled={checkLoading}
              >
                <CheckCircle2 size={16} />
                {checkLoading ? 'Checking Status...' : t('checkVerification')}
              </Btn>

              <Btn 
                variant="ghost" 
                style={{ width: '100%', padding: '10px', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} 
                onClick={handleResendEmail} 
                disabled={resendLoading}
              >
                <RefreshCw size={14} className={resendLoading ? 'animate-spin' : ''} />
                {resendLoading ? 'Sending...' : t('resendVerification')}
              </Btn>

              <button
                onClick={() => setPage('feed')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: colors.mutedLight,
                  fontSize: 12,
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  marginTop: 8,
                }}
              >
                Continue to Feed (Verify later)
              </button>
            </div>
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: 13, color: colors.mutedLight, marginTop: 24 }}>
          {t('alreadyHaveAccount')}{' '}
          <button onClick={() => setPage('login')} style={{ background: 'none', border: 'none', color: colors.cyan, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>{t('signIn')}</button>
        </p>

        {/* Legal Links Footer */}
        <div style={{
          marginTop: 24,
          paddingTop: 16,
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          fontSize: 12,
          color: '#64748B',
        }}>
          <button
            onClick={() => setLegalModalType('privacy')}
            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: 12 }}
          >
            {t('privacyPolicy')}
          </button>
          <span>•</span>
          <button
            onClick={() => setLegalModalType('terms')}
            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: 12 }}
          >
            {t('termsOfService')}
          </button>
        </div>
      </div>

      {legalModalType && (
        <LegalModal
          type={legalModalType}
          onClose={() => setLegalModalType(null)}
        />
      )}
    </div>
  )
}
