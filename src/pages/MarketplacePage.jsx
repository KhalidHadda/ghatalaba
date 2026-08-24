import { useState, useEffect } from 'react'
import { collection, query, getDocs, addDoc, orderBy, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../context/LanguageContext'
import { useNotifications } from '../context/NotificationContext'
import { colors, Btn, Avatar, Modal, Input, Textarea } from '../components/UI'
import { Skeleton } from '../components/Skeletons'
import { 
  ShoppingBag, Search, Plus, Tag, MapPin, 
  MessageSquare, Smartphone, BookOpen, Armchair, Coffee, Shirt, Bike, Gamepad2, Package
} from 'lucide-react'

const CATEGORIES = [
  { id: 'all', label: 'All Categories', icon: Package },
  { id: 'books', label: 'Textbooks & Books', icon: BookOpen },
  { id: 'tech', label: 'Electronics & Tech', icon: Smartphone },
  { id: 'furniture', label: 'Dorm & Room Furniture', icon: Armchair },
  { id: 'appliances', label: 'Home & Kitchen Appliances', icon: Coffee },
  { id: 'fashion', label: 'Clothing & Fashion', icon: Shirt },
  { id: 'vehicles', label: 'Bikes & Scooters', icon: Bike },
  { id: 'gaming', label: 'Gaming & Hobbies', icon: Gamepad2 },
  { id: 'other', label: 'Other Items', icon: Tag },
]

const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Used']
import { buildCities } from '../lib/cities'
import CityPicker from '../components/CityPicker'
import CountrySelect from '../components/CountrySelect'
import { normalizeText } from '../lib/normalize'
const CITIES = buildCities(['Paris', 'London', 'New York', 'Istanbul', 'Montreal', 'Dubai'])


export default function MarketplacePage({ setPage, setSelectedUser }) {
  const { user, profile } = useAuth()
  const { t, tCity } = useLanguage()
  const { addToast } = useNotifications()

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedCountry, setSelectedCountry] = useState('MA')
  const [selectedCity, setSelectedCity] = useState('All')
  const [selectedCondition, setSelectedCondition] = useState('All')
  const [maxPrice, setMaxPrice] = useState('')

  // Applied filters (click to Search)
  const [appliedSearch, setAppliedSearch] = useState('')
  const [appliedCategory, setAppliedCategory] = useState('all')
  const [appliedCity, setAppliedCity] = useState('All')
  const [appliedCondition, setAppliedCondition] = useState('All')
  const [appliedMaxPrice, setAppliedMaxPrice] = useState('')

  const [selectedItem, setSelectedItem] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    title: '',
    category: 'books',
    price: '',
    condition: 'Like New',
    city: 'Rabat',
    description: '',
    image: '',
  })

  useEffect(() => {
    let isMounted = true
    async function loadData() {
      try {
        const q = query(collection(db, 'marketplace'), orderBy('createdAt', 'desc'))
        const snap = await getDocs(q)
        const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        if (isMounted) {
          setItems(fetched)
          setLoading(false)
        }
      } catch {
        if (isMounted) {
          setItems([])
          setLoading(false)
        }
      }
    }
    loadData()

    // initialize applied filters to current UI defaults
    handleApplyFilters()

    return () => { isMounted = false }
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.price || !form.description.trim()) {
      addToast('Please fill in all required item fields', 'error')
      return
    }

    setSubmitting(true)
    try {
      const newItem = {
        title: form.title.trim(),
        category: form.category,
        price: parseFloat(form.price),
        currency: 'MAD',
        condition: form.condition,
        city: form.city,
        description: form.description.trim(),
        image: form.image.trim() || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80',
        sellerId: user?.uid || 'anon',
        sellerName: profile?.displayName || user?.email || 'Student Seller',
        sellerRole: profile?.role || 'student',
        university: profile?.university || null,
        createdAt: serverTimestamp(),
      }

      const ref = await addDoc(collection(db, 'marketplace'), newItem)
      setItems(prev => [{ id: ref.id, ...newItem, createdAt: new Date() }, ...prev])

      // Also publish a feed post about the new marketplace item
      try {
        await addDoc(collection(db, 'posts'), {
          content: `${newItem.sellerName || 'Someone'} listed: ${newItem.title} · ${newItem.price} ${newItem.currency || 'MAD'}`,
          authorUid: user?.uid || 'anon',
          authorName: newItem.sellerName || 'Seller',
          authorRole: newItem.sellerRole || 'seller',
          createdAt: serverTimestamp(),
        })
      } catch (err) {
        console.warn('Could not publish marketplace cross-post:', err.message)
      }

      setShowCreateModal(false)
      setForm({ title: '', category: 'books', price: '', condition: 'Like New', city: 'Rabat', description: '', image: '' })
      addToast('Your product was published on the marketplace!', 'success')
    } catch (err) {
      addToast('Failed to list item: ' + err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleChatSeller = (item) => {
    if (!user) {
      addToast('Please sign in to message the seller', 'info')
      setPage('login')
      return
    }

    if (item.sellerId === user.uid) {
      addToast('This is your own listing', 'info')
      return
    }

    if (setSelectedUser) {
      setSelectedUser({
        uid: item.sellerId,
        displayName: item.sellerName,
        email: `${item.sellerId}@ghatalaba.com`,
        prefilledSubject: `Inquiry about: ${item.title}`,
        prefilledBody: `Hi ${item.sellerName}, I am interested in your listing "${item.title}" (${item.price} ${item.currency}) in ${item.city}. Is it still available?`
      })
    }
    setPage('contact')
  }

  // Filter items
  const handleApplyFilters = () => {
    setAppliedSearch(search)
    setAppliedCategory(selectedCategory)
    setAppliedCity(selectedCity)
    setAppliedCondition(selectedCondition)
    setAppliedMaxPrice(maxPrice)
  }

  const filteredItems = items.filter(item => {
    const q = appliedSearch || ''
    const matchSearch = normalizeText(item.title || '').includes(normalizeText(q)) ||
                        normalizeText(item.description || '').includes(normalizeText(q)) ||
                        normalizeText(item.city || '').includes(normalizeText(q))
    const matchCat = appliedCategory === 'all' || item.category === appliedCategory
    const matchCity = appliedCity === 'All' || normalizeText(item.city || '').includes(normalizeText(appliedCity))
    const matchCond = appliedCondition === 'All' || item.condition === appliedCondition
    const matchPrice = !appliedMaxPrice || item.price <= parseFloat(appliedMaxPrice)

    return matchSearch && matchCat && matchCity && matchCond && matchPrice
  })

  const getRoleBadge = (role) => {
    switch (role) {
      case 'student': return { label: 'Verified Student', color: colors.cyan }
      case 'landlord': return { label: 'Homeowner / Landlord', color: '#F59E0B' }
      case 'seller': return { label: 'Verified Merchant', color: '#10B981' }
      case 'driver': return { label: 'Verified Driver', color: '#8B5CF6' }
      default: return { label: 'Community Member', color: colors.muted }
    }
  }

  return (
    <div style={{ background: colors.navy, minHeight: '100vh', color: colors.white, paddingBottom: '4rem' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(6, 182, 212, 0.15) 0%, rgba(6, 13, 25, 0) 100%)',
        borderBottom: '1px solid rgba(6, 182, 212, 0.12)',
        padding: '2.5rem 1rem 2rem 1rem',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 99, background: 'rgba(6, 182, 212, 0.12)', border: '1px solid rgba(6, 182, 212, 0.25)', marginBottom: 10 }}>
                <ShoppingBag size={14} color={colors.cyan} />
                <span style={{ fontSize: 12, fontWeight: 700, color: colors.cyan, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Student & Community Marketplace
                </span>
              </div>
              <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 32, fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: '-0.5px' }}>
                Buy, Sell & Trade <span style={{ color: colors.cyan }}>Affordably</span>
              </h1>
              <p style={{ color: colors.mutedLight, fontSize: 14, marginTop: 6, maxWidth: 650, lineHeight: '1.5' }}>
                Textbooks, tech, furniture, appliances, and scooters. Open to students, local sellers, and community members in Morocco and worldwide.
              </p>
            </div>

            <Btn onClick={() => {
              if (!user) {
                addToast('Please sign in to list an item', 'info')
                setPage('login')
              } else {
                setShowCreateModal(true)
              }
            }} style={{
              background: 'linear-gradient(135deg, #00C896 0%, #06B6D4 100%)',
              color: '#060D19',
              fontWeight: 800,
              padding: '12px 20px',
              borderRadius: 12,
              boxShadow: '0 4px 18px rgba(6, 182, 212, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <Plus size={18} strokeWidth={2.5} /> {t('listItemForSale') || 'List Item for Sale'}
            </Btn>
          </div>

          {/* Search & Filters */}
          <div style={{
            marginTop: '2rem',
            background: 'rgba(17, 28, 46, 0.8)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(6, 182, 212, 0.2)',
            borderRadius: 16,
            padding: '1rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
            alignItems: 'center',
          }}>
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search size={16} color={colors.muted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search items, textbooks, tech..."
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '9px 12px 9px 36px',
                  borderRadius: 10,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'rgba(15, 23, 42, 0.6)',
                  color: '#FFFFFF',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>

            {/* Country + City Filter */}
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ minWidth: 160 }}>
                <CountrySelect value={selectedCountry} onChange={v => setSelectedCountry(v)} />
              </div>
              <div style={{ flex: 1 }}>
                <CityPicker value={selectedCity === 'All' ? '' : selectedCity} onChange={v => setSelectedCity(v || 'All')} placeholder="Search or type a city" countryCode={selectedCountry} lang={null} />
              </div>
            </div>

            {/* Condition Filter */}
            <div>
              <select
                value={selectedCondition}
                onChange={e => setSelectedCondition(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 10,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'rgba(15, 23, 42, 0.6)',
                  color: '#FFFFFF',
                  fontSize: 13,
                  outline: 'none',
                }}
              >
                <option value="All" style={{ background: colors.navy }}>All Conditions</option>
                {CONDITIONS.map(cond => <option key={cond} value={cond} style={{ background: colors.navy }}>{cond}</option>)}
              </select>
            </div>

            {/* Max Price / Budget Filter */}
            <div>
              <input
                type="number"
                value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)}
                placeholder="Max price (MAD)"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(15,23,42,0.6)', color: '#fff', outline: 'none' }}
              />
            </div>

            {/* Search / Apply Filters */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleApplyFilters} style={{ padding: '9px 12px', borderRadius: 10, background: 'linear-gradient(135deg,#00C896,#06B6D4)', border: 'none', color: '#061018', fontWeight: 700, cursor: 'pointer' }}>
                {t ? t('searchBtn') : 'Search'}
              </button>
              <button onClick={() => { setSelectedCity('All'); setSelectedCondition('All'); setSelectedCategory('all'); setMaxPrice(''); setSearch(''); handleApplyFilters(); }} style={{ padding: '9px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer' }}>
                {t ? t('resetBtn') : 'Reset'}
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            paddingTop: '1rem',
            scrollbarWidth: 'none',
          }}>
            {CATEGORIES.map(cat => {
              const IconComp = cat.icon
              const isActive = selectedCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 12,
                    border: `1px solid ${isActive ? '#06B6D4' : 'rgba(255, 255, 255, 0.08)'}`,
                    background: isActive ? 'rgba(6, 182, 212, 0.18)' : 'rgba(17, 28, 46, 0.6)',
                    color: isActive ? colors.cyan : colors.mutedLight,
                    fontSize: 13,
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <IconComp size={15} color={isActive ? colors.cyan : colors.muted} />
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ maxWidth: 1100, margin: '2rem auto', padding: '0 1rem' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} style={{ height: 320, background: 'rgba(17, 28, 46, 0.5)', borderRadius: 16 }}>
                <Skeleton height="180px" borderRadius="16px 16px 0 0" />
                <div style={{ padding: 16 }}>
                  <Skeleton height="20px" width="80%" borderRadius="4px" />
                  <Skeleton height="16px" width="40%" borderRadius="4px" style={{ marginTop: 8 }} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem 1rem',
            background: 'rgba(17, 28, 46, 0.4)',
            border: '1px dashed rgba(6, 182, 212, 0.2)',
            borderRadius: 20,
          }}>
            <ShoppingBag size={48} color={colors.cyan} style={{ margin: '0 auto 1rem auto', opacity: 0.8 }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF' }}>No items match your filters</h3>
            <p style={{ color: colors.mutedLight, fontSize: 14, maxWidth: 400, margin: '8px auto 20px auto' }}>
              Try adjusting your search criteria, price range, or category filter.
            </p>
            <div style={{ display: 'inline-flex', gap: 8 }}>
              <Btn onClick={() => handleApplyFilters()} style={{ padding: '9px 14px' }}>
                <Search size={14} /> Search
              </Btn>
              <Btn variant="ghost" onClick={() => { setSearch(''); setSelectedCategory('all'); setSelectedCity('All'); setSelectedCondition('All'); setMaxPrice(''); handleApplyFilters(); }}>
                Reset Filters
              </Btn>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {filteredItems.map(item => {
              const roleInfo = getRoleBadge(item.sellerRole)
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  style={{
                    background: 'rgba(17, 28, 46, 0.75)',
                    border: '1px solid rgba(6, 182, 212, 0.15)',
                    borderRadius: 16,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = '#06B6D4'
                    e.currentTarget.style.transform = 'translateY(-3px)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.15)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  {/* Item Image */}
                  <div style={{ position: 'relative', height: 190, background: '#0F172A', overflow: 'hidden' }}>
                    <img
                      src={item.image}
                      alt={item.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { e.target.src = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80' }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      background: 'rgba(6, 13, 25, 0.85)',
                      backdropFilter: 'blur(8px)',
                      padding: '4px 10px',
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 700,
                      color: colors.cyan,
                      border: '1px solid rgba(6, 182, 212, 0.3)',
                    }}>
                      {item.condition}
                    </div>

                    <div style={{
                      position: 'absolute',
                      bottom: 10,
                      left: 10,
                      background: 'rgba(0, 200, 150, 0.95)',
                      color: '#060D19',
                      padding: '4px 10px',
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 800,
                      fontFamily: 'Space Grotesk, sans-serif',
                    }}>
                      {item.price} {item.currency}
                    </div>
                  </div>

                  {/* Card Info */}
                  <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', margin: 0, lineHeight: '1.35', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {item.title}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: colors.mutedLight, fontSize: 12, marginTop: 8 }}>
                        <MapPin size={13} color={colors.cyan} /> {tCity(item.city)}
                      </div>
                    </div>

                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Avatar name={item.sellerName} size={26} />
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#FFFFFF' }}>{item.sellerName}</div>
                          <div style={{ fontSize: 9, color: roleInfo.color, fontWeight: 700 }}>{roleInfo.label}</div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleChatSeller(item)
                        }}
                        style={{
                          background: 'rgba(6, 182, 212, 0.15)',
                          border: '1px solid rgba(6, 182, 212, 0.3)',
                          color: colors.cyan,
                          borderRadius: 8,
                          padding: '6px 10px',
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <MessageSquare size={13} /> Chat
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <Modal onClose={() => setSelectedItem(null)}>
          <div style={{ padding: '0.5rem' }}>
            <div style={{ borderRadius: 12, overflow: 'hidden', height: 260, position: 'relative', marginBottom: 16 }}>
              <img src={selectedItem.image} alt={selectedItem.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', bottom: 12, left: 12, background: 'rgba(0,200,150,0.95)', color: '#060D19', padding: '6px 14px', borderRadius: 10, fontSize: 18, fontWeight: 800 }}>
                {selectedItem.price} {selectedItem.currency}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: 'rgba(6, 182, 212, 0.15)', color: colors.cyan, border: '1px solid rgba(6, 182, 212, 0.3)', fontWeight: 700 }}>
                {selectedItem.condition}
              </span>
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: 'rgba(255, 255, 255, 0.08)', color: colors.mutedLight, fontWeight: 600 }}>
                <MapPin size={11} style={{ display: 'inline', marginRight: 4 }} /> {tCity(selectedItem.city)}
              </span>
            </div>

            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#FFFFFF', margin: '0 0 10px 0' }}>{selectedItem.title}</h2>
            <p style={{ color: colors.mutedLight, fontSize: 14, lineHeight: '1.6', marginBottom: 20, whiteSpace: 'pre-line' }}>
              {selectedItem.description}
            </p>

            <div style={{ padding: 14, background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(6, 182, 212, 0.15)', borderRadius: 12, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar name={selectedItem.sellerName} size={38} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>{selectedItem.sellerName}</div>
                  <div style={{ fontSize: 11, color: getRoleBadge(selectedItem.sellerRole).color, fontWeight: 700 }}>
                    {getRoleBadge(selectedItem.sellerRole).label} {selectedItem.university ? `· ${selectedItem.university}` : ''}
                  </div>
                </div>
              </div>

              <Btn onClick={() => handleChatSeller(selectedItem)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <MessageSquare size={16} /> Chat Seller
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* List Item Modal */}
      {showCreateModal && (
        <Modal title={t('listItemModalTitle') || 'List Item for Sale'} onClose={() => setShowCreateModal(false)}>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input label="Item Title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Organic Chemistry Textbook (3rd Ed)" />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: colors.mutedLight, display: 'block', marginBottom: 6 }}>Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: 8, background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(6, 182, 212, 0.2)', color: '#FFFFFF', outline: 'none' }}>
                  {CATEGORIES.filter(c => c.id !== 'all').map(c => <option key={c.id} value={c.id} style={{ background: colors.navy }}>{c.label}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: colors.mutedLight, display: 'block', marginBottom: 6 }}>Condition</label>
                <select value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: 8, background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(6, 182, 212, 0.2)', color: '#FFFFFF', outline: 'none' }}>
                  {CONDITIONS.map(cond => <option key={cond} value={cond} style={{ background: colors.navy }}>{cond}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Price (MAD) *" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="e.g. 250" />
              <Input label="City & Country *" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="e.g. Paris, Casablanca, London..." />
            </div>

            <Textarea label="Description *" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Provide item details, reason for selling, pick-up preferences..." rows={3} />

            <Input label="Image URL (Optional)" value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} placeholder="https://..." />

            <div style={{ display: 'flex', justifySelf: 'flex-end', gap: 10, marginTop: 10 }}>
              <Btn type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Btn>
              <Btn type="submit" disabled={submitting}>{submitting ? 'Publishing...' : 'Post Item'}</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
