const fs = require('fs')
const path = require('path')
const cities = require('all-the-cities')
const countries = require('i18n-iso-countries')
const translate = require('@vitalets/google-translate-api')

countries.registerLocale(require('i18n-iso-countries/langs/en.json'))
countries.registerLocale(require('i18n-iso-countries/langs/fr.json'))
countries.registerLocale(require('i18n-iso-countries/langs/ar.json'))

async function generate() {
  try {
    // all-the-cities entries have a 'country' property with the ISO2 code in many cases
    const moroccoCode = 'MA'
    const moroccoCities = cities.filter(c => c.country === moroccoCode || c.countryCode === moroccoCode || c.country_name === 'Morocco' || c.country === 'Morocco')

    // fallback: if none matched, try matching country name
    let list = moroccoCities
    if (list.length === 0) {
      list = cities.filter(c => (c.country || '').toLowerCase().includes('morocco') || (c.country_name || '').toLowerCase().includes('morocco'))
    }

    const unique = Array.from(new Set(list.map(c => c.name))).sort((a,b)=>a.localeCompare(b))

    console.log(`Found ${unique.length} unique Moroccan city names (sample 10):`, unique.slice(0,10))

    const out = []
    for (let i = 0; i < unique.length; i++) {
      const name = unique[i]
      // Auto-translate to fr and ar. Throttle a bit to be polite.
      let fr = name
      let ar = name
      try {
        const resFr = await translate(name, { to: 'fr' })
        fr = resFr.text
      } catch (e) {
        // ignore
      }
      try {
        const resAr = await translate(name, { to: 'ar' })
        ar = resAr.text
      } catch (e) {
        // ignore
      }
      out.push({ en: name, fr, ar })
      // small delay every 50 items
      if (i % 50 === 0) await new Promise(r => setTimeout(r, 200))
    }

    const outPath = path.resolve(__dirname, '..', 'src', 'data', 'cities-morocco-translated.json')
    fs.mkdirSync(path.dirname(outPath), { recursive: true })
    fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8')
    console.log('Wrote', outPath)
  } catch (err) {
    console.error('Failed to generate:', err)
    process.exit(1)
  }
}

generate()
