import React, { useState, useMemo, useRef, useEffect } from 'react'
import moroccoCities from '../data/cities-morocco-translated.json'

import { normalizeText } from '../lib/normalize'

export default function CityPicker({ value = '', onChange, placeholder = '', countryCode = 'MA', lang = 'en', id }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value || '')
  const [highlight, setHighlight] = useState(0)
  const rootRef = useRef(null)

  useEffect(() => setQuery(value || ''), [value])

  const moroccoOptions = useMemo(() => {
    if (!Array.isArray(moroccoCities)) return []
      return moroccoCities.map(c => ({
        en: c.en,
        fr: c.fr,
        ar: c.ar,
        normEn: normalizeText(c.en || ''),
        normFr: normalizeText(c.fr || c.en || ''),
        normAr: normalizeText(c.ar || c.en || ''),
      }))
    }, [])

  const intlFallback = useMemo(() => ['Paris','London','New York','Istanbul','Montreal','Dubai'], [])

  const allOptions = useMemo(() => {
      if (countryCode === 'MA') return moroccoOptions.map(o => ({ label: o[lang] || o.en, norm: lang === 'fr' ? o.normFr : lang === 'ar' ? o.normAr : o.normEn }))
      return intlFallback.map(l => ({ label: l, norm: normalizeText(l) }))
  }, [countryCode, moroccoOptions, intlFallback, lang])

  const normalizedQuery = useMemo(() => normalizeText(query), [query])

  const filtered = useMemo(() => {
      if (!normalizedQuery) return allOptions.slice(0, 50).map(o => o.label)
    // simple fuzzy: keep items that include all query tokens
    const tokens = normalizedQuery.split(/\s+/).filter(Boolean)
    return allOptions.filter(opt => {
        const n = opt.norm
      return tokens.every(t => n.indexOf(t) !== -1)
      }).slice(0, 50).map(o => o.label)
  }, [normalizedQuery, allOptions])

  useEffect(() => setHighlight(0), [filtered])

  useEffect(() => {
    function onDocClick(e) {
      if (!rootRef.current) return
      if (!rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  function handleSelect(val) {
    setQuery(val)
    onChange?.(val)
    setOpen(false)
  }

  function onKeyDown(e) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setOpen(true)
      e.preventDefault()
      return
    }
    if (e.key === 'ArrowDown') {
      setHighlight(h => Math.min(h + 1, filtered.length - 1))
      e.preventDefault()
    } else if (e.key === 'ArrowUp') {
      setHighlight(h => Math.max(h - 1, 0))
      e.preventDefault()
    } else if (e.key === 'Enter') {
      if (open && filtered[highlight]) {
        handleSelect(filtered[highlight])
        e.preventDefault()
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <input
        id={id}
        value={query}
        onChange={e => { setQuery(e.target.value); onChange?.(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(6,13,25,0.6)', color: '#fff', outline: 'none' }}
      />

      {open && filtered && filtered.length > 0 && (
        <ul role="listbox" aria-label="city suggestions" style={{ position: 'absolute', left: 0, right: 0, maxHeight: 240, overflow: 'auto', marginTop: 6, background: '#0b1220', borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.4)', zIndex: 40, listStyle: 'none', padding: 6 }}>
          {filtered.map((opt, i) => (
            <li
              key={`${opt}-${i}`}
              role="option"
              aria-selected={i === highlight}
              onMouseDown={(ev) => { ev.preventDefault(); handleSelect(opt) }}
              onMouseEnter={() => setHighlight(i)}
              style={{ padding: '8px 10px', borderRadius: 6, background: i === highlight ? 'rgba(255,255,255,0.06)' : 'transparent', cursor: 'pointer', color: '#fff' }}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}

      {open && (!filtered || filtered.length === 0) && (
        <div style={{ position: 'absolute', left: 0, right: 0, marginTop: 6, background: '#0b1220', borderRadius: 8, padding: 10, color: '#bbb' }}>{countryCode === 'MA' ? 'No cities found' : 'No suggestions'}</div>
      )}
    </div>
  )
}
