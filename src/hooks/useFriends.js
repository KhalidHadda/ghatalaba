import { useState, useEffect, useCallback } from 'react'
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, getDocs, query, limit } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from './useAuth'

// Seed suggested student peers for instant connectivity across Moroccan & global universities
export const DEFAULT_SUGGESTED_PEERS = [
  {
    uid: 'peer_yassine_encg',
    displayName: 'Yassine El Amrani',
    username: 'yassine_amr',
    email: 'yassine.amrani@encg-cassa.ma',
    university: 'ENCG Casablanca',
    city: 'Casablanca',
    role: 'Student',
    major: 'Finance & Management',
    isOnline: true,
    avatar: '',
    bio: 'Looking for study groups and roommates in Casablanca Oasis.',
  },
  {
    uid: 'peer_salma_fsr',
    displayName: 'Salma Bennani',
    username: 'salma_b',
    email: 'salma.bennani@fsr.ac.ma',
    university: 'FSR Rabat',
    city: 'Rabat',
    role: 'Student',
    major: 'Computer Science',
    isOnline: true,
    avatar: '',
    bio: 'Software engineering student, avid coder and polycope contributor.',
  },
  {
    uid: 'peer_mehdi_ensa',
    displayName: 'Mehdi Tazi',
    username: 'mehdi_tazi',
    email: 'mehdi.tazi@ensa-marrakech.ac.ma',
    university: 'ENSA Marrakech',
    city: 'Marrakech',
    role: 'Student',
    major: 'Civil Engineering',
    isOnline: false,
    avatar: '',
    bio: 'Carpooling between Marrakech and Agadir on weekends.',
  },
  {
    uid: 'peer_lina_um6p',
    displayName: 'Lina Berrada',
    username: 'lina_berrada',
    email: 'lina.berrada@um6p.ma',
    university: 'UM6P Benguerir',
    city: 'Benguerir',
    role: 'Student',
    major: 'Data Science & AI',
    isOnline: true,
    avatar: '',
    bio: 'UM6P tech enthusiast, always down for campus hackathons!',
  },
  {
    uid: 'peer_hamza_usmba',
    displayName: 'Hamza Idrissi',
    username: 'hamza_idrissi',
    email: 'hamza.idrissi@usmba.ac.ma',
    university: 'USMBA Fes',
    city: 'Fes',
    role: 'Student',
    major: 'Economics',
    isOnline: true,
    avatar: '',
    bio: 'Fes Saiss campus student. Looking for shared apartment roommates.',
  },
  {
    uid: 'peer_nour_sorbonne',
    displayName: 'Nour El Fassi',
    username: 'nour_fassi',
    email: 'nour.elfassi@sorbonne-univ.fr',
    university: 'Sorbonne Paris',
    city: 'Paris',
    role: 'Student',
    major: 'International Business',
    isOnline: false,
    avatar: '',
    bio: 'Moroccan student in Paris. Connecting with fellow study abroad students.',
  },
]

export function useFriends() {
  const { user } = useAuth()
  const storageKey = user ? `gt_friends_${user.uid}` : 'gt_friends_guest'

  const [friends, setFriends] = useState(() => {
    try {
      const cached = localStorage.getItem(user ? `gt_friends_${user.uid}` : 'gt_friends_guest')
      return cached ? JSON.parse(cached) : []
    } catch {
      return []
    }
  })
  const [loading, setLoading] = useState(true)
  const [suggestedPeers, setSuggestedPeers] = useState([])

  // Load friends from Firestore profile or local fallback
  useEffect(() => {
    if (!user) {
      setFriends(prev => prev.length ? [] : prev)
      setLoading(false)
      return
    }

    let isMounted = true
    const loadFriendsData = async () => {
      try {
        const userRef = doc(db, 'users', user.uid)
        const snap = await getDoc(userRef)
        const userData = snap.exists() ? snap.data() : {}
        const friendUids = userData.friends || []

        if (!isMounted) return

        if (friendUids.length === 0) {
          // If brand new user with no friends yet, seed with 2 friendly campus contacts
          const defaultFriends = [DEFAULT_SUGGESTED_PEERS[0], DEFAULT_SUGGESTED_PEERS[1]]
          setFriends(prev => {
            if (prev.length > 0) return prev
            localStorage.setItem(storageKey, JSON.stringify(defaultFriends))
            updateDoc(userRef, { friends: defaultFriends.map(f => f.uid) }).catch(() => {})
            return defaultFriends
          })
          setLoading(false)
          return
        }

        // Fetch profiles of friends
        const friendObjects = []
        for (const fUid of friendUids) {
          // Check suggested seed list first
          const seedMatch = DEFAULT_SUGGESTED_PEERS.find(p => p.uid === fUid)
          if (seedMatch) {
            friendObjects.push(seedMatch)
            continue
          }

          try {
            const fSnap = await getDoc(doc(db, 'users', fUid))
            if (fSnap.exists()) {
              friendObjects.push({ uid: fUid, ...fSnap.data() })
            } else {
              friendObjects.push({
                uid: fUid,
                displayName: 'Student Friend',
                university: 'Campus Peer',
                isOnline: false,
              })
            }
          } catch {
            friendObjects.push({
              uid: fUid,
              displayName: 'Student Friend',
              university: 'Campus Peer',
              isOnline: false,
            })
          }
        }

        setFriends(friendObjects)
        localStorage.setItem(storageKey, JSON.stringify(friendObjects))
      } catch (err) {
        console.error('Error fetching friends:', err)
      } finally {
        setLoading(false)
      }
    }

    loadFriendsData()
    return () => {
      isMounted = false
    }
  }, [user, storageKey])

  // Fetch suggested peers from Firestore + seed defaults
  useEffect(() => {
    const fetchPeers = async () => {
      try {
        const q = query(collection(db, 'users'), limit(15))
        const snap = await getDocs(q)
        const realUsers = snap.docs
          .map(d => ({ uid: d.id, ...d.data() }))
          .filter(u => u.uid !== user?.uid)

        // Combine real users with seed peers, avoiding duplicates
        const combined = [...realUsers]
        DEFAULT_SUGGESTED_PEERS.forEach(sp => {
          if (!combined.some(u => u.uid === sp.uid || u.email === sp.email)) {
            combined.push(sp)
          }
        })
        setSuggestedPeers(combined)
      } catch {
        setSuggestedPeers(DEFAULT_SUGGESTED_PEERS)
      }
    }

    fetchPeers()
  }, [user])

  // Check if target user is currently in friends list
  const isFriend = useCallback((targetUid) => {
    if (!targetUid) return false
    return friends.some(f => f.uid === targetUid)
  }, [friends])

  // Add a friend
  const addFriend = useCallback(async (peer) => {
    if (!peer || !peer.uid) return
    if (friends.some(f => f.uid === peer.uid)) return

    const newFriendObj = {
      uid: peer.uid,
      displayName: peer.displayName || peer.name || peer.username || 'Student',
      username: peer.username || '',
      university: peer.university || 'University',
      city: peer.city || '',
      role: peer.role || 'Student',
      isOnline: peer.isOnline !== undefined ? peer.isOnline : true,
      avatar: peer.avatar || '',
      addedAt: new Date().toISOString(),
    }

    const updated = [newFriendObj, ...friends]
    setFriends(updated)
    localStorage.setItem(storageKey, JSON.stringify(updated))

    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid)
        await updateDoc(userRef, {
          friends: arrayUnion(peer.uid)
        })
      } catch (err) {
        console.warn('Firestore addFriend error:', err)
      }
    }
  }, [friends, user, storageKey])

  // Remove a friend
  const removeFriend = useCallback(async (targetUid) => {
    if (!targetUid) return
    const updated = friends.filter(f => f.uid !== targetUid)
    setFriends(updated)
    localStorage.setItem(storageKey, JSON.stringify(updated))

    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid)
        await updateDoc(userRef, {
          friends: arrayRemove(targetUid)
        })
      } catch (err) {
        console.warn('Firestore removeFriend error:', err)
      }
    }
  }, [friends, user, storageKey])

  return {
    friends,
    loading,
    suggestedPeers,
    isFriend,
    addFriend,
    removeFriend,
  }
}
