import { useState, useEffect } from 'react'
import { collection, getDocs, limit, query, orderBy } from 'firebase/firestore'
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth'
import { db, auth } from '../lib/firebase'
import { useLanguage } from '../context/LanguageContext'
import { colors, Btn, Input } from '../components/UI'
import { 
  Building2, MessageCircle, ShoppingBag, Car, UserPlus
} from 'lucide-react'
import LegalModal from '../components/LegalModal'

export default function HomePage({ setPage }) {
  const { lang, t, tCity } = useLanguage()
  const [realListings, setRealListings] = useState([])
  const [realPosts, setRealPosts]       = useState([])
  const [realMarketplace, setRealMarketplace] = useState([])
  const [realRides, setRealRides]       = useState([])

  // Auth Form state on landing
  const [authMode, setAuthMode]         = useState('login') // 'login' or 'signup'
  const [loginForm, setLoginForm]       = useState({ email: '', password: '' })
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [remember, setRemember]         = useState(true) // Remember me for persistent sessions

  // Legal Modal State ('privacy' | 'terms' | null)
  const [legalModalType, setLegalModalType] = useState(null)

  useEffect(() => {
    async function fetchPreviewData() {
      try {
        const snapList = await getDocs(query(collection(db, 'listings'), orderBy('createdAt', 'desc'), limit(2)))
        setRealListings(snapList.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      } catch { /* ignore */ }

      try {
        const snapMkt = await getDocs(query(collection(db, 'marketplace'), orderBy('createdAt', 'desc'), limit(1)))
        setRealMarketplace(snapMkt.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      } catch { /* ignore */ }

      try {
        const snapRides = await getDocs(query(collection(db, 'rideshares'), orderBy('createdAt', 'desc'), limit(1)))
        setRealRides(snapRides.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      } catch { /* ignore */ }

      try {
        const snapPosts = await getDocs(query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(1)))
        setRealPosts(snapPosts.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      } catch { /* ignore */ }
    }
    fetchPreviewData()
  }, [])

  const handleLoginSubmit = async (e) => {
    e?.preventDefault()
    setError('')
    if (!loginForm.email.trim()) return setError(lang === 'fr' ? 'Veuillez saisir votre e-mail.' : lang === 'ar' ? 'يرجى إدخال البريد الإلكتروني.' : 'Please enter your email.')
    if (!loginForm.password) return setError(lang === 'fr' ? 'Veuillez saisir votre mot de passe.' : lang === 'ar' ? 'يرجى إدخال كلمة المرور.' : 'Please enter your password.')
    setLoading(true)
    try {
      // Set Firebase persistence based on remember checkbox
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence)
      await signInWithEmailAndPassword(auth, loginForm.email.trim(), loginForm.password)
      setPage('feed')
    } catch (err) {
      console.error('Login error:', err)
      setError(lang === 'fr' ? 'E-mail ou mot de passe incorrect. Veuillez réessayer.' : lang === 'ar' ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' : 'Incorrect email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: '#060D19',
      minHeight: 'calc(100vh - 64px)',
      color: '#F8FAFC',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      direction: lang === 'ar' ? 'rtl' : 'ltr',
    }}>
      {/* Main Content Workspace */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
      }}>
        <div style={{
          maxWidth: 1100,
          width: '100%',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '3rem',
          alignItems: 'center',
        }}>
          {/* Left Column: Headline & Minimal Live Feed Snippets */}
          <div>
            <h1 style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 'clamp(2.2rem, 4.5vw, 3.4rem)',
              fontWeight: 800,
              lineHeight: 1.15,
              margin: '0 0 16px',
              color: '#FFFFFF',
              letterSpacing: '-1px',
            }}>
              {t('happeningOnCampus')}
            </h1>

            <p style={{
              fontSize: 16,
              color: '#94A3B8',
              lineHeight: 1.6,
              margin: '0 0 28px',
              maxWidth: 480,
            }}>
              {t('landingSubtitle')}
            </p>

            {/* Minimal 2x2 Feed Snippets Preview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
              {realListings[0] && (
                <div 
                  onClick={() => setPage('signup')}
                  style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 14,
                    padding: '12px 14px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: colors.cyan, fontWeight: 700, marginBottom: 4 }}>
                    <Building2 size={13} /> {t('housing')}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {realListings[0].title}
                  </div>
                  <div style={{ fontSize: 12, color: '#00C896', fontWeight: 800, marginTop: 4 }}>
                    {realListings[0].price} MAD/mo
                  </div>
                </div>
              )}

              {realMarketplace[0] && (
                <div 
                  onClick={() => setPage('signup')}
                  style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 14,
                    padding: '12px 14px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: colors.cyan, fontWeight: 700, marginBottom: 4 }}>
                    <ShoppingBag size={13} /> {t('marketplace')}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {realMarketplace[0].title}
                  </div>
                  <div style={{ fontSize: 12, color: '#00C896', fontWeight: 800, marginTop: 4 }}>
                    {realMarketplace[0].price} MAD
                  </div>
                </div>
              )}

              {realRides[0] && (
                <div 
                  onClick={() => setPage('signup')}
                  style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 14,
                    padding: '12px 14px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: colors.gold, fontWeight: 700, marginBottom: 4 }}>
                    <Car size={13} /> {t('rideshare')}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {tCity(realRides[0].originCity)} ➔ {tCity(realRides[0].destCity)}
                  </div>
                  <div style={{ fontSize: 12, color: '#00C896', fontWeight: 800, marginTop: 4 }}>
                    {realRides[0].pricePerSeat} MAD/seat
                  </div>
                </div>
              )}

              {realPosts[0] && (
                <div 
                  onClick={() => setPage('signup')}
                  style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 14,
                    padding: '12px 14px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: colors.cyan, fontWeight: 700, marginBottom: 4 }}>
                    <MessageCircle size={13} /> {t('feed')}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#CBD5E1', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    "{realPosts[0].content}"
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Clean Embedded Auth Box */}
          <div>
            <div style={{
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 20,
              padding: '2rem',
              boxShadow: '0 16px 48px rgba(0, 0, 0, 0.5)',
              maxWidth: 420,
              margin: '0 auto',
            }}>
              {/* Header Switcher */}
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 20 }}>
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'none',
                    border: 'none',
                    borderBottom: authMode === 'login' ? `2px solid ${colors.cyan}` : '2px solid transparent',
                    color: authMode === 'login' ? '#FFFFFF' : '#64748B',
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: 'pointer',
                  }}
                >
                  {t('signIn')}
                </button>
                <button
                  type="button"
                  onClick={() => setPage('signup')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'none',
                    border: 'none',
                    borderBottom: authMode === 'signup' ? `2px solid ${colors.cyan}` : '2px solid transparent',
                    color: authMode === 'signup' ? '#FFFFFF' : '#64748B',
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: 'pointer',
                  }}
                >
                  {t('createAccount')}
                </button>
              </div>

              {/* Error Banner */}
              {error && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#F87171',
                  padding: '10px 14px',
                  borderRadius: 10,
                  fontSize: 13,
                  marginBottom: 16,
                }}>
                  {error}
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Input
                  label={t('emailAddress')}
                  type="email"
                  value={loginForm.email}
                  onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                  placeholder="student@university.edu"
                />

                <div>
                  <Input
                    label={t('password')}
                    type="password"
                    value={loginForm.password}
                    onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#94A3B8', fontSize: 13 }}>
                    <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} style={{ width: 16, height: 16 }} />
                    <span style={{ fontWeight: 700 }}>{t('rememberThisDevice') || 'Remember this device'}</span>
                  </label>

                  <button type="button" onClick={() => setPage('forgot')} style={{ background: 'none', border: 'none', color: colors.cyan, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                    {t('forgotPassword')}
                  </button>
                </div>

                <Btn variant="primary" type="submit" disabled={loading} style={{ width: '100%', padding: '12px', fontSize: 15, fontWeight: 700, marginTop: 4 }}>
                  {loading ? (lang === 'fr' ? 'Connexion en cours…' : lang === 'ar' ? 'جاري تسجيل الدخول...' : 'Signing in...') : t('signIn') }
                </Btn>
              </form>

              <div style={{ textAlign: 'center', marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ fontSize: 13, color: '#94A3B8', margin: '0 0 12px' }}>
                  {t('dontHaveAccountYet')}
                </p>
                <Btn variant="ghost" onClick={() => setPage('signup')} style={{ width: '100%', padding: '10px', fontSize: 14 }}>
                  <UserPlus size={16} /> {t('createFreeAccount')}
                </Btn>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer with Privacy Policy & Terms of Service */}
      <footer style={{
        maxWidth: 1100,
        width: '100%',
        margin: '0 auto',
        padding: '1.5rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        fontSize: 13,
        color: '#64748B',
      }}>
        <div>
          © {new Date().getFullYear()} Gha Talaba. {t('allRightsReserved')}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <button
            onClick={() => setLegalModalType('privacy')}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              padding: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.color = colors.cyan}
            onMouseLeave={e => e.currentTarget.style.color = '#94A3B8'}
          >
            {t('privacyPolicy')}
          </button>

          <span style={{ color: 'rgba(255,255,255,0.1)' }}>•</span>

          <button
            onClick={() => setLegalModalType('terms')}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              padding: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.color = colors.cyan}
            onMouseLeave={e => e.currentTarget.style.color = '#94A3B8'}
          >
            {t('termsOfService')}
          </button>
        </div>
      </footer>

      {/* Legal Modal Component */}
      {legalModalType && (
        <LegalModal
          type={legalModalType}
          onClose={() => setLegalModalType(null)}
        />
      )}
    </div>
  )
}
