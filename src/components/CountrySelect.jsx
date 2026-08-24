import React from 'react'
import { getCountryList } from '../lib/countries'
import { useLanguage } from '../context/LanguageContext'

export default function CountrySelect({ value, onChange }) {
  const { lang } = useLanguage()
  const countries = getCountryList(lang)

  return (
    <select
      value={value}
      onChange={e => onChange?.(e.target.value)}
      style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(6,13,25,0.6)', color: '#fff', outline: 'none' }}
    >
      {countries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
    </select>
  )
}
