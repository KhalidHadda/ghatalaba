/* eslint-disable react-refresh/only-export-components */
/* eslint-disable no-unused-vars */
import { useState } from 'react'
import { motion } from 'motion/react'
import { Eye, EyeOff, Star, X } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

export const colors = {
  navy:       '#060D19',
  navyMid:    '#0F172A',
  navyLight:  '#111C2E',
  mint:       '#00C896',
  mintDim:    '#00A87D',
  cyan:       '#06B6D4',
  indigo:     '#6366F1',
  gold:       '#F59E0B',
  cream:      '#F8FAFC',
  white:      '#FFFFFF',
  muted:      '#64748B',
  mutedLight: '#94A3B8',
  border:     'rgba(6, 182, 212, 0.18)',
}

export function Badge({ children, variant = 'student' }) {
  const styles = {
    student:  { background: 'rgba(0, 200, 150, 0.12)',  color: '#00C896',  border: '0.5px solid rgba(0, 200, 150, 0.3)' },
    landlord: { background: 'rgba(245, 158, 11, 0.12)',  color: '#F59E0B',  border: '0.5px solid rgba(245, 158, 11, 0.3)' },
    other:    { background: 'rgba(148, 163, 184, 0.12)', color: '#94A3B8',  border: '0.5px solid rgba(148, 163, 184, 0.3)' },
    verified: { background: 'rgba(6, 182, 212, 0.15)',   color: '#06B6D4',  border: '0.5px solid rgba(6, 182, 212, 0.4)' },
  }
  const s = styles[variant] || styles.other
  return (
    <span style={{ 
      ...s, 
      fontSize: 11, 
      fontWeight: 600, 
      padding: '4px 11px', 
      borderRadius: 99, 
      display: 'inline-flex', 
      alignItems: 'center', 
      gap: 4, 
      letterSpacing: '0.04em' 
    }}>
      {children}
    </span>
  )
}

export function StarRow({ value = 0, onChange, size = 18, showLabel = true, interactive = true }) {
  const [hoverVal, setHoverVal] = useState(0)
  const isInteractive = Boolean(onChange && interactive)
  const displayVal = isInteractive && hoverVal > 0 ? hoverVal : value

  const RATING_LABELS = {
    1: '1.0 · Needs Improvement',
    2: '2.0 · Fair',
    3: '3.0 · Good',
    4: '4.0 · Very Good',
    5: '5.0 · Excellent!'
  }

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
      <div 
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
        onMouseLeave={() => isInteractive && setHoverVal(0)}
      >
        {[1, 2, 3, 4, 5].map(n => {
          const active = n <= displayVal
          const isHovered = isInteractive && n === hoverVal

          return (
            <motion.button
              key={n}
              type="button"
              onClick={() => isInteractive && onChange?.(n)}
              onMouseEnter={() => isInteractive && setHoverVal(n)}
              whileHover={isInteractive ? { scale: 1.35, y: -2 } : { scale: 1.1 }}
              whileTap={isInteractive ? { scale: 0.85 } : {}}
              style={{
                background: 'none',
                border: 'none',
                padding: 2,
                margin: 0,
                cursor: isInteractive ? 'pointer' : 'default',
                outline: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <Star
                size={size}
                fill={active ? colors.gold : 'none'}
                color={active ? colors.gold : 'rgba(245, 158, 11, 0.3)'}
                style={{
                  filter: active ? `drop-shadow(0 0 6px ${colors.gold}90)` : 'none',
                  transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              />
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    position: 'absolute',
                    inset: -4,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(245, 158, 11, 0.35) 0%, transparent 70%)',
                    pointerEvents: 'none',
                  }}
                />
              )}
            </motion.button>
          )
        })}

        {showLabel && displayVal > 0 && (
          <span style={{ 
            fontSize: 12, 
            fontWeight: 700, 
            color: colors.gold, 
            marginLeft: 6,
            fontFamily: 'Space Grotesk, sans-serif',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4
          }}>
            {displayVal.toFixed(1)}
          </span>
        )}
      </div>

      {isInteractive && hoverVal > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: colors.cyan,
            letterSpacing: '0.02em',
            background: 'rgba(6, 182, 212, 0.12)',
            padding: '2px 8px',
            borderRadius: 6,
            border: '0.5px solid rgba(6, 182, 212, 0.3)',
          }}
        >
          {RATING_LABELS[hoverVal]}
        </motion.div>
      )}
    </div>
  )
}

export function FluidAspectMeter({ 
  label, 
  value = 0, 
  maxValue = 100, 
  unit = '%', 
  color = 'cyan', 
  icon: Icon,
  interactive = false,
  onChange,
  description
}) {
  const percent = Math.min(100, Math.max(0, (value / maxValue) * 100))

  const gradients = {
    cyan:    'linear-gradient(90deg, #06B6D4 0%, #3B82F6 100%)',
    mint:    'linear-gradient(90deg, #00C896 0%, #06B6D4 100%)',
    gold:    'linear-gradient(90deg, #F59E0B 0%, #EAB308 100%)',
    indigo:  'linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)',
    emerald: 'linear-gradient(90deg, #10B981 0%, #00C896 100%)',
  }

  const selectedGradient = gradients[color] || gradients.cyan

  const handleClick = (e) => {
    if (!interactive || !onChange) return
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const ratio = Math.max(0, Math.min(1, clickX / rect.width))
    const newVal = Math.round(ratio * maxValue)
    onChange(newVal)
  }

  return (
    <div style={{ marginBottom: 14, width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ 
          fontSize: 13, 
          fontWeight: 600, 
          color: colors.white, 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: 6 
        }}>
          {Icon && <Icon size={14} color={colors.cyan} />}
          {label}
        </span>
        <span style={{ 
          fontSize: 12, 
          fontWeight: 800, 
          fontFamily: 'Space Grotesk, sans-serif',
          color: color === 'gold' ? colors.gold : colors.cyan,
          background: 'rgba(255,255,255,0.05)',
          padding: '2px 8px',
          borderRadius: 6,
          border: '0.5px solid rgba(255,255,255,0.1)',
        }}>
          {value}{unit}
        </span>
      </div>

      <div 
        onClick={handleClick}
        style={{
          height: 10,
          width: '100%',
          background: 'rgba(15, 23, 42, 0.9)',
          borderRadius: 99,
          padding: 2,
          border: '1px solid rgba(6, 182, 212, 0.2)',
          position: 'relative',
          overflow: 'hidden',
          cursor: interactive ? 'pointer' : 'default',
          boxSizing: 'border-box'
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
          style={{
            height: '100%',
            borderRadius: 99,
            background: selectedGradient,
            boxShadow: `0 0 12px ${color === 'gold' ? '#F59E0B' : '#06B6D4'}80`,
            position: 'relative',
          }}
        >
          {/* Sheen Sweep */}
          <motion.div
            animate={{ x: ['-100%', '200%'] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: '40%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
            }}
          />
        </motion.div>
      </div>

      {description && (
        <div style={{ fontSize: 11, color: colors.mutedLight, marginTop: 4 }}>
          {description}
        </div>
      )}
    </div>
  )
}

export function TraitSlider({ label, name, value = 3, onChange }) {
  const percent = ((value - 1) / 4) * 100

  const TRAIT_DESCRIPTIONS = {
    cleanliness: { 1: 'Casual', 2: 'Moderate', 3: 'Tidy', 4: 'Very Clean', 5: 'Spotless' },
    noise:       { 1: 'Silent / Quiet', 2: 'Calm', 3: 'Moderate', 4: 'Lively', 5: 'Party Vibe' },
    payment:     { 1: 'Flexible', 2: 'Fair', 3: 'Reliable', 4: 'Always On Time', 5: 'Instant' },
    social:      { 1: 'Private', 2: 'Quiet Neighbor', 3: 'Friendly', 4: 'Very Social', 5: 'Community Host' },
  }

  const descriptor = TRAIT_DESCRIPTIONS[name]?.[value] || `${value}/5`

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: colors.white }}>{label}</span>
        <span style={{ 
          fontSize: 12, 
          fontWeight: 700, 
          color: colors.cyan, 
          background: 'rgba(6, 182, 212, 0.12)', 
          padding: '2px 8px', 
          borderRadius: 6,
          border: '0.5px solid rgba(6, 182, 212, 0.3)',
          fontFamily: 'Space Grotesk, sans-serif' 
        }}>
          {descriptor} ({value}/5)
        </span>
      </div>

      <div style={{ position: 'relative', width: '100%', height: 28, display: 'flex', alignItems: 'center' }}>
        {/* Track */}
        <div style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: 8,
          borderRadius: 99,
          background: 'rgba(15, 23, 42, 0.9)',
          border: '1px solid rgba(6, 182, 212, 0.2)',
          overflow: 'hidden',
        }}>
          <motion.div
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #00C896 0%, #06B6D4 100%)',
              boxShadow: '0 0 10px rgba(6, 182, 212, 0.5)',
            }}
          />
        </div>

        <input 
          type="range" 
          min={1} 
          max={5} 
          step={1} 
          value={value}
          onChange={e => onChange?.(name, parseInt(e.target.value))}
          style={{ 
            position: 'absolute',
            inset: 0,
            width: '100%', 
            height: '100%',
            opacity: 0, 
            cursor: 'pointer',
            zIndex: 10,
          }}
        />

        {/* Thumb */}
        <motion.div
          animate={{ left: `calc(${percent}% - 10px)` }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: '#FFFFFF',
            border: '2.5px solid #06B6D4',
            boxShadow: '0 0 12px rgba(6, 182, 212, 0.8), 0 2px 6px rgba(0,0,0,0.4)',
            pointerEvents: 'none',
            zIndex: 5,
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: colors.muted, marginTop: 2 }}>
        <span>1 - Low</span>
        <span>3 - Balanced</span>
        <span>5 - High</span>
      </div>
    </div>
  )
}

export function RatingBreakdown({ reviews = [] }) {
  const total = reviews.length
  if (total === 0) return null

  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  reviews.forEach(r => {
    const star = Math.min(5, Math.max(1, Math.round(r.rating || r.overall || 5)))
    counts[star] = (counts[star] || 0) + 1
  })

  return (
    <div style={{ 
      background: 'rgba(15, 23, 42, 0.6)', 
      padding: '12px 16px', 
      borderRadius: 12, 
      border: '0.5px solid rgba(6, 182, 212, 0.15)',
      marginBottom: 16
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: colors.white, marginBottom: 8 }}>Rating Breakdown</div>
      {[5, 4, 3, 2, 1].map(star => {
        const count = counts[star] || 0
        const pct = total ? (count / total) * 100 : 0
        return (
          <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, marginBottom: 4 }}>
            <span style={{ color: colors.gold, fontWeight: 700, width: 28 }}>{star} ★</span>
            <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6 }}
                style={{ height: '100%', background: colors.gold, borderRadius: 99 }}
              />
            </div>
            <span style={{ color: colors.muted, width: 28, textAlign: 'right' }}>{count}</span>
          </div>
        )
      })}
    </div>
  )
}

export function isOnlineUser(u) {
  if (!u) return false
  if (u.isOnline === false || u.status === 'offline') return false
  if (u.isOnline === true || u.status === 'online') return true
  if (u.lastSeen) {
    const time = u.lastSeen?.toDate ? u.lastSeen.toDate().getTime() : new Date(u.lastSeen).getTime()
    if (!isNaN(time)) {
      return (Date.now() - time) < 300000 // online if seen within last 5 mins
    }
  }
  return false
}

export function OnlineStatusBadge({ isOnline = false, size = 'md', showText = true }) {
  const online = Boolean(isOnline)
  const { t } = useLanguage()

  const sizes = {
    sm: { padding: '3px 8px', fontSize: 10, dotSize: 6 },
    md: { padding: '5px 12px', fontSize: 11, dotSize: 8 },
    lg: { padding: '7px 16px', fontSize: 12, dotSize: 10 }
  }

  const s = sizes[size] || sizes.md

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: s.padding,
        borderRadius: 99,
        background: online 
          ? 'linear-gradient(135deg, rgba(0, 200, 150, 0.22) 0%, rgba(6, 182, 212, 0.16) 100%)'
          : 'linear-gradient(135deg, rgba(239, 68, 68, 0.18) 0%, rgba(100, 116, 139, 0.12) 100%)',
        border: online 
          ? '1px solid rgba(0, 200, 150, 0.45)' 
          : '1px solid rgba(239, 68, 68, 0.35)',
        boxShadow: online 
          ? '0 0 12px rgba(0, 200, 150, 0.3), inset 0 0 8px rgba(0, 200, 150, 0.15)' 
          : '0 0 8px rgba(239, 68, 68, 0.2)',
        cursor: 'default',
        fontFamily: 'Space Grotesk, sans-serif',
        fontWeight: 700,
        fontSize: s.fontSize,
        letterSpacing: '0.05em',
        color: online ? '#00C896' : '#EF4444',
      }}
    >
      {/* Lit Glowing Beacon Dot */}
      <div style={{ position: 'relative', width: s.dotSize, height: s.dotSize, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: online ? '#00C896' : '#EF4444',
          boxShadow: online ? '0 0 8px #00C896' : '0 0 6px #EF4444',
        }} />
        {online && (
          <motion.div
            animate={{ scale: [1, 2.2, 1], opacity: [0.8, 0, 0.8] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: '#00C896',
            }}
          />
        )}
      </div>

      {showText && (
        <span>{online ? t('statusOnline') : t('statusOffline')}</span>
      )}
    </div>
  )
}

export function Avatar({ name = '?', size = 40, isOnline }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0, display: 'inline-block' }}>
      <div style={{
        width: size, 
        height: size, 
        borderRadius: '50%',
        background: `linear-gradient(135deg, #06B6D4 0%, #6366F1 100%)`,
        color: '#FFFFFF', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontFamily: 'Space Grotesk, sans-serif', 
        fontWeight: 700, 
        fontSize: size * 0.38, 
        boxShadow: '0 0 12px rgba(6, 182, 212, 0.25)',
        border: '1.5px solid rgba(255, 255, 255, 0.2)',
      }}>
        {initials}
      </div>

      {isOnline !== undefined && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: Math.max(10, Math.round(size * 0.28)),
          height: Math.max(10, Math.round(size * 0.28)),
          borderRadius: '50%',
          background: isOnline ? '#00C896' : '#EF4444',
          border: '2px solid #060D19',
          boxShadow: isOnline ? '0 0 8px #00C896' : '0 0 4px #EF4444',
          zIndex: 2,
        }} />
      )}
    </div>
  )
}

export function Card({ children, style = {}, glow = false }) {
  return (
    <div style={{
      background: 'rgba(17, 28, 46, 0.75)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(6, 182, 212, 0.15)',
      borderRadius: 16, 
      padding: '1.5rem',
      boxShadow: glow ? '0 8px 32px rgba(6, 182, 212, 0.12)' : '0 4px 20px rgba(0, 0, 0, 0.25)',
      transition: 'all 0.2s ease',
      ...style,
    }}>
      {children}
    </div>
  )
}

export function Input({ label, type = 'text', style = {}, ...props }) {
  const [showPassword, setShowPassword] = useState(false)
  const isPasswordType = type === 'password'
  const currentType = isPasswordType ? (showPassword ? 'text' : 'password') : type

  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 600, color: colors.mutedLight, display: 'block', marginBottom: 6, letterSpacing: '0.02em' }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <input 
          {...props} 
          type={currentType} 
          style={{
            width: '100%', 
            boxSizing: 'border-box', 
            padding: isPasswordType ? '11px 40px 11px 14px' : '11px 14px',
            border: '1px solid rgba(6, 182, 212, 0.2)', 
            borderRadius: 10,
            fontSize: 14, 
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            background: 'rgba(15, 23, 42, 0.8)', 
            color: '#FFFFFF', 
            outline: 'none',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            ...style,
          }}
          onFocus={e => {
            e.target.style.borderColor = '#06B6D4'
            e.target.style.boxShadow = '0 0 12px rgba(6, 182, 212, 0.25)'
            if (props.onFocus) props.onFocus(e)
          }}
          onBlur={e => {
            e.target.style.borderColor = 'rgba(6, 182, 212, 0.2)'
            e.target.style.boxShadow = 'none'
            if (props.onBlur) props.onBlur(e)
          }}
        />
        {isPasswordType && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            title={showPassword ? "Hide password" : "Show password"}
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: showPassword ? colors.cyan : colors.muted,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 4,
              borderRadius: 6,
              transition: 'color 0.15s ease',
            }}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  )
}

export function Textarea({ label, style = {}, ...props }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: colors.mutedLight, display: 'block', marginBottom: 6 }}>{label}</label>}
      <textarea {...props} style={{
        width: '100%', boxSizing: 'border-box', padding: '11px 14px',
        border: '1px solid rgba(6, 182, 212, 0.2)', borderRadius: 10,
        fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif',
        background: 'rgba(15, 23, 42, 0.8)', color: '#FFFFFF',
        resize: 'vertical', minHeight: 96, outline: 'none',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        ...style,
      }}
      onFocus={e => {
        e.target.style.borderColor = '#06B6D4'
        e.target.style.boxShadow = '0 0 12px rgba(6, 182, 212, 0.25)'
      }}
      onBlur={e => {
        e.target.style.borderColor = 'rgba(6, 182, 212, 0.2)'
        e.target.style.boxShadow = 'none'
      }}
      />
    </div>
  )
}

export function Btn({ children, variant = 'primary', style = {}, ...props }) {
  const base = {
    padding: '11px 22px', 
    borderRadius: 10, 
    fontSize: 14,
    fontFamily: 'Plus Jakarta Sans, sans-serif', 
    fontWeight: 700,
    cursor: 'pointer', 
    border: 'none', 
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    letterSpacing: '0.01em',
  }

  const variants = {
    primary: { background: 'linear-gradient(135deg, #00C896 0%, #06B6D4 100%)', color: '#060D19', boxShadow: '0 4px 16px rgba(0, 200, 150, 0.25)' },
    cyan:    { background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)', color: '#FFFFFF', boxShadow: '0 4px 16px rgba(6, 182, 212, 0.3)' },
    gold:    { background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', color: '#060D19', boxShadow: '0 4px 16px rgba(245, 158, 11, 0.25)' },
    ghost:   { background: 'rgba(6, 182, 212, 0.1)', color: '#06B6D4', border: '1px solid rgba(6, 182, 212, 0.3)' },
    dark:    { background: '#0F172A', color: '#FFFFFF', border: '1px solid rgba(6, 182, 212, 0.2)' },
  }

  const v = variants[variant] || variants.primary

  return (
    <button {...props} style={{ ...base, ...v, ...style }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.filter = 'brightness(1.1)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.filter = 'none'
      }}
      onMouseDown={e => {
        e.currentTarget.style.transform = 'translateY(0) scale(0.98)'
      }}
    >
      {children}
    </button>
  )
}

export function SectionTitle({ children }) {
  return (
    <h2 style={{
      fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 22,
      color: '#FFFFFF', margin: '0 0 1.25rem', letterSpacing: '-0.3px',
      display: 'flex', alignItems: 'center', gap: 8
    }}>
      {children}
    </h2>
  )
}

export function Modal({ isOpen, onClose, title, children }) {
  // Support both usage patterns: callers may pass isOpen boolean OR conditionally render <Modal> when they want it shown.
  // Only block rendering when isOpen === false explicitly.
  if (isOpen === false) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      background: 'rgba(6, 13, 25, 0.85)',
      backdropFilter: 'blur(12px)',
    }}
    onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        style={{
          width: '100%',
          maxWidth: 580,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: '#0F172A',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          borderRadius: 20,
          padding: '24px 28px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
          position: 'relative',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 20, fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              color: colors.mutedLight,
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  )
}
