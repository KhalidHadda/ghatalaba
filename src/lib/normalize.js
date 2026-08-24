export function normalizeText(s = '') {
  try {
    return s.toString().normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
  } catch (e) {
    return s.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  }
}
