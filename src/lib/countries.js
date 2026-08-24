import countries from 'i18n-iso-countries'

// register common locales
try {
  countries.registerLocale(require('i18n-iso-countries/langs/en.json'))
  countries.registerLocale(require('i18n-iso-countries/langs/fr.json'))
  countries.registerLocale(require('i18n-iso-countries/langs/ar.json'))
} catch (e) {
  // in some environments require may not work; ignore
}

export function getCountryList(lang = 'en') {
  const all = Object.entries(countries.getNames(lang)).map(([code, name]) => ({ code, name }))
  // Put Morocco first
  const morocco = all.filter(c => c.code === 'MA')
  const others = all.filter(c => c.code !== 'MA')
  others.sort((a, b) => a.name.localeCompare(b.name))
  return [...morocco, ...others]
}
