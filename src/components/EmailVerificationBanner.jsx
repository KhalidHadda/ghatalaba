import { useState } from 'react'
import { sendEmailVerification } from 'firebase/auth'
import { Mail, CheckCircle2, RefreshCw, X, AlertTriangle } from 'lucide-react'
import { auth } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../context/LanguageContext'
import { colors } from './UI'

export default function EmailVerificationBanner() {
  const { user, reloadUser } = useAuth()
  const { t } = useLanguage()
  const [dismissed, setDismissed] = useState(false)
  const [checking, setChecking]   = useState(false)
  const [sending, setSending]     = useState(false)
  const [message, setMessage]     = useState('')
  const [statusType, setStatusType] = useState('info') // 'info' | 'success' | 'error'

  if (!user || user.emailVerified || dismissed) {
    return null
  }

  const handleCheck = async () => {
    setChecking(true)
    setMessage('')
    try {
      const isVerified = await reloadUser()
      if (isVerified) {
        setStatusType('success')
        setMessage(t('emailVerifiedSuccess'))
      } else {
        setStatusType('error')
        setMessage(t('emailNotVerifiedAlert'))
      }
    } catch {
      setStatusType('error')
      setMessage('Could not check verification status. Please try again.')
    } finally {
      setChecking(false)
    }
  }

  const handleResend = async () => {
    setSending(true)
    setMessage('')
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser)
        setStatusType('success')
        setMessage(t('verificationSent'))
      }
    } catch (err) {
      setStatusType('error')
      setMessage(err.message.replace('Firebase: ', ''))
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{
      background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
      borderBottom: '1px solid rgba(245, 158, 11, 0.3)',
      padding: '10px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      flexWrap: 'wrap',
      position: 'relative',
      zIndex: 90,
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 280 }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'rgba(245, 158, 11, 0.2)',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FBBF24',
          flexShrink: 0,
        }}>
          <AlertTriangle size={18} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>{t('verifyEmailTitle')}</span>
            <span style={{ fontSize: 11, background: 'rgba(245, 158, 11, 0.2)', color: '#FBBF24', padding: '1px 8px', borderRadius: 99, border: '1px solid rgba(245, 158, 11, 0.3)' }}>
              {user.email}
            </span>
          </div>
          <p style={{ fontSize: 12, color: colors.mutedLight, margin: '2px 0 0' }}>
            {t('unverifiedBanner')}
          </p>
          {message && (
            <p style={{
              fontSize: 12,
              fontWeight: 600,
              margin: '4px 0 0',
              color: statusType === 'success' ? '#34D399' : '#F87171'
            }}>
              {message}
            </p>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <button
          onClick={handleCheck}
          disabled={checking}
          style={{
            background: 'rgba(6, 182, 212, 0.2)',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            color: colors.cyan,
            fontSize: 12,
            fontWeight: 700,
            padding: '6px 12px',
            borderRadius: 8,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontFamily: 'Plus Jakarta Sans, sans-serif',
          }}
        >
          <CheckCircle2 size={14} />
          {checking ? 'Checking...' : t('checkVerification')}
        </button>

        <button
          onClick={handleResend}
          disabled={sending}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: colors.white,
            fontSize: 12,
            fontWeight: 600,
            padding: '6px 12px',
            borderRadius: 8,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontFamily: 'Plus Jakarta Sans, sans-serif',
          }}
        >
          <RefreshCw size={13} className={sending ? 'animate-spin' : ''} />
          {sending ? 'Sending...' : t('resendVerification')}
        </button>

        <button
          onClick={() => setDismissed(true)}
          title="Dismiss banner"
          style={{
            background: 'none',
            border: 'none',
            color: colors.mutedLight,
            padding: 4,
            cursor: 'pointer',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
