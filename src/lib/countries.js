import countries from 'i18n-iso-countries'
import en from 'i18n-iso-countries/langs/en.json'
import fr from 'i18n-iso-countries/langs/fr.json'
import ar from 'i18n-iso-countries/langs/ar.json'

// register common locales
try {
  countries.registerLocale(en)
  countries.registerLocale(fr)
  countries.registerLocale(ar)
} catch {
  // in some environments locale registration may already exist; ignore
}

export function getCountryList(lang = 'en') {
  const all = Object.entries(countries.getNames(lang)).map(([code, name]) => ({ code, name }))
  // Put Morocco first
  const morocco = all.filter(c => c.code === 'MA')
  const others = all.filter(c => c.code !== 'MA')
  others.sort((a, b) => a.name.localeCompare(b.name))
  return [...morocco, ...others]
}
