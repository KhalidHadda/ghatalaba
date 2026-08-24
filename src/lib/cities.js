import moroccoCities from '../data/cities-morocco-translated.json'

export const moroccoCityNames = Array.isArray(moroccoCities) ? moroccoCities.map(c => c.en) : []

export function buildCities(extra = []) {
  const unique = Array.from(new Set([...moroccoCityNames, ...extra]))
  unique.sort((a, b) => a.localeCompare(b))
  return ['All', ...unique]
}
