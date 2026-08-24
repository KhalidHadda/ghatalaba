/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid)
        const snap = await getDoc(userRef)
        const profileData = snap.exists() ? snap.data() : null
        setProfile(profileData)

        // Mark user as online in Firestore
        await updateDoc(userRef, {
          isOnline: true,
          lastSeen: serverTimestamp(),
        }).catch(() => {})
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  // Automatic presence tracking (online when on platform/active tab, offline when closed/hidden)
  useEffect(() => {
    if (!user) return
    const userRef = doc(db, 'users', user.uid)

    const setPresence = (online) => {
      updateDoc(userRef, {
        isOnline: online,
        lastSeen: serverTimestamp(),
      }).catch(() => {})
      setProfile(prev => prev ? { ...prev, isOnline: online } : null)
    }

    // Initial state set to true if document visible
    setPresence(document.visibilityState === 'visible')

    // Periodic heartbeat every 30s while active
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        setPresence(true)
      }
    }, 30000)

    const handleVisibilityChange = () => {
      setPresence(document.visibilityState === 'visible')
    }

    const handleFocus = () => setPresence(true)
    const handleBlur = () => setPresence(false)
    const handleUnload = () => setPresence(false)

    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)
    window.addEventListener('pagehide', handleUnload)
    window.addEventListener('beforeunload', handleUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('pagehide', handleUnload)
      window.removeEventListener('beforeunload', handleUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      setPresence(false)
    }
  }, [user])

  const toggleOnlineStatus = async (forcedStatus) => {
    if (!user) return
    const userRef = doc(db, 'users', user.uid)
    const currentStatus = profile?.isOnline !== false
    const newStatus = forcedStatus !== undefined ? forcedStatus : !currentStatus

    await updateDoc(userRef, {
      isOnline: newStatus,
      lastSeen: serverTimestamp(),
    }).catch(console.error)

    setProfile(prev => prev ? { ...prev, isOnline: newStatus } : null)
  }

  const reloadUser = async () => {
    if (!auth.currentUser) return false
    await auth.currentUser.reload()
    const currentUser = auth.currentUser
    setUser({ ...currentUser })
    if (currentUser.emailVerified) {
      const userRef = doc(db, 'users', currentUser.uid)
      await updateDoc(userRef, { emailVerified: true }).catch(() => {})
      setProfile(prev => prev ? { ...prev, emailVerified: true } : null)
      return true
    }
    return false
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, setProfile, toggleOnlineStatus, reloadUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

