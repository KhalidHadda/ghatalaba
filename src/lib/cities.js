const FALLBACK_MOROCCO_CITIES = [
  'Rabat', 'Casablanca', 'Fès', 'Marrakech', 'Agadir', 'Tangier', 'Meknès',
  'Oujda', 'Tétouan', 'Kenitra', 'Fez', 'Remote'
]

export const moroccoCityNames = FALLBACK_MOROCCO_CITIES

export async function loadMoroccoCities() {
  if (typeof window === 'undefined') return FALLBACK_MOROCCO_CITIES

  try {
    const response = await fetch('/data/cities-morocco-translated.json')
    if (!response.ok) return FALLBACK_MOROCCO_CITIES
    const data = await response.json()
    const names = Array.isArray(data)
      ? data.map(city => city?.en || city?.fr || city?.ar).filter(Boolean)
      : FALLBACK_MOROCCO_CITIES
    return names.length ? names : FALLBACK_MOROCCO_CITIES
  } catch (e) {
    console.warn('Could not load Morocco cities from public asset, falling back to defaults.', e)
    return FALLBACK_MOROCCO_CITIES
  }
}

export function buildCities(extra = []) {
  const unique = Array.from(new Set([...FALLBACK_MOROCCO_CITIES, ...extra]))
  unique.sort((a, b) => a.localeCompare(b))
  return ['All', ...unique]
}
