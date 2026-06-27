import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'

export function useUnreadCount(uid) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!uid) { setCount(0); return }
    const q = query(collection(db, 'messages'), where('toUid', '==', uid), where('read', '==', false))
    const unsub = onSnapshot(q, snap => setCount(snap.size), () => setCount(0))
    return unsub
  }, [uid])

  return count
}