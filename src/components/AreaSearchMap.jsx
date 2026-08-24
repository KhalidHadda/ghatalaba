import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { colors } from './UI'

const CITIES = [
  { name: 'Rabat', lat: 34.0209, lng: -6.8416, unis: ['FSR Rabat', 'EMI Rabat', 'ENSIAS'] },
  { name: 'Casablanca', lat: 33.5731, lng: -7.5898, unis: ['ENCG Casa', 'ISCAE', 'FSAC'] },
  { name: 'Fès', lat: 34.0331, lng: -5.0003, unis: ['USMBA Fès', 'INSA Fès'] },
  { name: 'Marrakech', lat: 31.6295, lng: -7.9811, unis: ['UCA Marrakech', 'FST Marrakech'] },
  { name: 'Agadir', lat: 30.4278, lng: -9.5981, unis: ['UIZ Agadir', 'ENCG Agadir'] },
  { name: 'Tanger', lat: 35.7595, lng: -5.8340, unis: ['UAE Tanger', 'ENSA Tanger'] },
  { name: 'Meknès', lat: 33.8935, lng: -5.5473, unis: ['EST Meknès', 'FS Meknès'] },
]

export default function AreaSearchMap({
  users = [],
  radiusKm = 5,
  onViewUser,
  height = 380,
}) {
  const mapContainerRef = useRef(null)
  const mapInstanceRef  = useRef(null)
  const circleRef       = useRef(null)
  const markersRef      = useRef([])

  const [activeCity, setActiveCity] = useState('Rabat')

  // Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current) return
    if (mapInstanceRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: [CITIES[0].lat, CITIES[0].lng],
      zoom: 12,
      zoomControl: true,
      attributionControl: false,
    })

    // Standard OpenStreetMap / Voyager map tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map)

    mapInstanceRef.current = map

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Update center, university markers & user markers
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    const city = CITIES.find(c => c.name === activeCity) || CITIES[0]
    map.flyTo([city.lat, city.lng], 12, { duration: 1.0 })

    // Clear old markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    // Circle radius around city center
    if (circleRef.current) {
      circleRef.current.remove()
    }

    const circle = L.circle([city.lat, city.lng], {
      color: '#00C896',
      fillColor: '#00C896',
      fillOpacity: 0.15,
      radius: radiusKm * 1000,
      weight: 2,
      dashArray: '4, 6',
    }).addTo(map)

    circleRef.current = circle

    // Helper for Div Icons
    const createMarkerIcon = (text, bgColor = '#00C896', textColor = '#060D19') => L.divIcon({
      className: 'custom-map-pill',
      html: `<div style="
        background: ${bgColor};
        color: ${textColor};
        font-weight: 700;
        font-size: 11px;
        font-family: 'Plus Jakarta Sans', sans-serif;
        padding: 4px 9px;
        border-radius: 99px;
        border: 2px solid #FFFFFF;
        box-shadow: 0 4px 10px rgba(0,0,0,0.25);
        white-space: nowrap;
        cursor: pointer;
      ">${text}</div>`,
      iconSize: [100, 28],
      iconAnchor: [50, 14],
    })

    // University Campus Markers
    city.unis.forEach((uniName, idx) => {
      const offsetLat = (idx === 0 ? 0.008 : idx === 1 ? -0.012 : 0.015)
      const offsetLng = (idx === 0 ? 0.01 : idx === 1 ? -0.015 : -0.008)

      const m = L.marker([city.lat + offsetLat, city.lng + offsetLng], {
        icon: createMarkerIcon(uniName, '#00C896', '#060D19'),
      }).addTo(map)

      m.bindPopup(`
        <div style="font-family: sans-serif; font-size: 13px; font-weight: 700; color: #0F172A;">
          ${uniName}
          <div style="font-weight: 400; font-size: 11px; color: #64748B; margin-top: 4px;">
            University Campus in ${city.name}
          </div>
        </div>
      `)
      markersRef.current.push(m)
    })

    // Student / User Pins (matching active city)
    const cityUsers = users.filter(u => u.city === city.name)
    cityUsers.forEach((u, i) => {
      const angle = (i / Math.max(1, cityUsers.length)) * 2 * Math.PI
      const dist = 0.005 + (i % 3) * 0.004
      const userLat = city.lat + Math.sin(angle) * dist
      const userLng = city.lng + Math.cos(angle) * dist

      const uMarker = L.marker([userLat, userLng], {
        icon: createMarkerIcon(u.displayName || u.username || 'Student', '#06B6D4', '#FFFFFF'),
      }).addTo(map)

      const roleBadge = u.role === 'student' ? 'Student' : u.role === 'landlord' ? 'Landlord' : 'Agent'
      const popupHtml = document.createElement('div')
      popupHtml.innerHTML = `
        <div style="font-family: sans-serif; padding: 2px;">
          <div style="font-weight: 800; font-size: 14px; color: #0F172A;">${u.displayName || u.username || 'User'}</div>
          <div style="font-size: 11px; color: #06B6D4; font-weight: 700; margin-top: 2px;">${roleBadge} · ${u.university || city.name}</div>
          <button id="view-profile-btn" style="
            margin-top: 8px; width: 100%; background: #00C896; color: #060D19; border: none;
            padding: 6px; border-radius: 6px; font-weight: 700; font-size: 11px; cursor: pointer;
          ">View Profile</button>
        </div>
      `
      popupHtml.querySelector('#view-profile-btn')?.addEventListener('click', () => {
        if (onViewUser) onViewUser(u)
      })

      uMarker.bindPopup(popupHtml)
      markersRef.current.push(uMarker)
    })

  }, [activeCity, users, radiusKm, onViewUser])

  // Dynamic radius adjustment
  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setRadius(radiusKm * 1000)
    }
  }, [radiusKm])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* City Chips */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {CITIES.map(c => (
          <button
            key={c.name}
            onClick={() => setActiveCity(c.name)}
            style={{
              padding: '5px 12px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: activeCity === c.name ? 700 : 500,
              cursor: 'pointer',
              border: activeCity === c.name ? '1px solid #00C896' : '0.5px solid rgba(255,255,255,0.12)',
              background: activeCity === c.name ? 'rgba(0,200,150,0.18)' : 'rgba(255,255,255,0.03)',
              color: activeCity === c.name ? colors.mint : colors.mutedLight,
              transition: 'all 0.15s ease',
            }}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Map Element */}
      <div style={{
        position: 'relative',
        height: height,
        borderRadius: 14,
        overflow: 'hidden',
        border: '0.5px solid rgba(0,200,150,0.3)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      }}>
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  )
}
