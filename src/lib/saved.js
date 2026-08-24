const key = (uid) => `gha_talaba_saved_${uid}`

export function getSavedIds(uid) {
  if (!uid) return []
  try { return JSON.parse(localStorage.getItem(key(uid)) || '[]') }
  catch { return [] }
}

export function isSaved(uid, listingId) {
  return getSavedIds(uid).includes(listingId)
}

export function toggleSaved(uid, listingId) {
  if (!uid) return false
  const ids = getSavedIds(uid)
  const next = ids.includes(listingId)
    ? ids.filter(id => id !== listingId)
    : [...ids, listingId]
  localStorage.setItem(key(uid), JSON.stringify(next))
  return next.includes(listingId)
}