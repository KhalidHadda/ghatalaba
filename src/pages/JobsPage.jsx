import { useState, useEffect } from 'react'
import { collection, query, orderBy, limit, getDocs, addDoc, serverTimestamp, doc, deleteDoc } from 'firebase/firestore'
import { Briefcase, MapPin, Clock, DollarSign, PlusCircle, Search, Filter, CheckCircle2, Send, Building2, Calendar, Sparkles, Bookmark, Phone, Mail, Trash2 } from 'lucide-react'
import { db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../context/LanguageContext'
import { colors, Avatar, Badge, Btn, Input, Textarea, ConfirmDeleteModal } from '../components/UI'
import { Skeleton } from '../components/Skeletons'
import CityPicker from '../components/CityPicker'
import CountrySelect from '../components/CountrySelect'
import { normalizeText } from '../lib/normalize'

export default function JobsPage({ setPage }) {
  const { user, profile } = useAuth()
  const { t, tCity } = useLanguage()

  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('MA')
  const [selectedCity, setSelectedCity] = useState('All')
  const [selectedType, setSelectedType] = useState('All')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [savedJobIds, setSavedJobIds] = useState([])
  const [jobToDelete, setJobToDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const isJobOwner = (job) => {
    if (!user || !job) return false
    return (
      job.ownerUid === user.uid ||
      job.ownerUid === 'guest' ||
      (job.ownerName && (job.ownerName === profile?.displayName || job.ownerName === user?.email))
    )
  }

  const handleConfirmDeleteJob = async () => {
    if (!jobToDelete) return
    setDeleteLoading(true)
    try {
      if (jobToDelete.id && !jobToDelete.id.startsWith('mock_')) {
        await deleteDoc(doc(db, 'jobs', jobToDelete.id))
      }
      setJobs(prev => prev.filter(j => j.id !== jobToDelete.id))
      setJobToDelete(null)
    } catch (err) {
      console.error('Failed to delete job:', err)
    } finally {
      setDeleteLoading(false)
    }
  }

  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    title: '',
    company: '',
    city: 'Rabat',
    category: 'Tutoring & Education',
    jobType: 'Part-Time (Student Hours)',
    scheduleFit: 'Flexible / Evening & Weekends',
    salary: '',
    description: '',
    contactEmail: '',
    contactPhone: '',
  })
  const [formError, setFormError] = useState('')

  // Apply Contact Modal State
  const [selectedJobForApply, setSelectedJobForApply] = useState(null)

  useEffect(() => {
    async function fetchJobs() {
      setLoading(true)
      try {
        const q = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'), limit(30))
        const snap = await getDocs(q)
        if (!snap.empty) {
          const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          setJobs(fetched)
        } else {
          setJobs([])
        }
      } catch {
        try {
          const snap = await getDocs(collection(db, 'jobs'))
          setJobs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
        } catch {
          setJobs([])
        }
      } finally {
        setLoading(false)
      }
    }
    fetchJobs()
  }, [])

  const toggleSaveJob = (id) => {
    setSavedJobIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id])
  }

  const handlePostJob = async (e) => {
    e?.preventDefault()
    setFormError('')
    if (!user) {
      setPage('login')
      return
    }
    if (!form.title.trim()) return setFormError('Please enter a job title.')
    if (!form.company.trim()) return setFormError('Please enter employer/company name.')
    if (!form.salary.trim()) return setFormError('Please specify salary or pay rates.')
    if (!form.description.trim()) return setFormError('Please write a brief description.')

    setSubmitting(true)
    try {
      const newJobData = {
        title: form.title.trim(),
        company: form.company.trim(),
        city: form.city,
        category: form.category,
        jobType: form.jobType,
        scheduleFit: form.scheduleFit,
        salary: form.salary.trim(),
        description: form.description.trim(),
        contactEmail: form.contactEmail.trim() || user.email,
        contactPhone: form.contactPhone.trim(),
        ownerUid: user.uid,
        ownerName: profile?.displayName || user.email.split('@')[0],
        verified: profile?.verified || false,
        createdAt: serverTimestamp(),
      }

      const docRef = await addDoc(collection(db, 'jobs'), newJobData)
      setJobs(prev => [{ id: docRef.id, ...newJobData, createdAt: new Date() }, ...prev])
      setShowModal(false)
      setForm({
        title: '',
        company: '',
        city: 'Rabat',
        category: 'Tutoring & Education',
        jobType: 'Part-Time (Student Hours)',
        scheduleFit: 'Flexible / Evening & Weekends',
        salary: '',
        description: '',
        contactEmail: '',
        contactPhone: '',
      })
    } catch (err) {
      console.error(err)
      setFormError('Failed to publish job. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredJobs = jobs.filter(j => {
    const matchSearch = search === '' || 
      j.title?.toLowerCase().includes(search.toLowerCase()) || 
      j.company?.toLowerCase().includes(search.toLowerCase()) ||
      j.description?.toLowerCase().includes(search.toLowerCase())
    const matchCity = selectedCity === 'All' || normalizeText(j.city || '').includes(normalizeText(selectedCity))
    const matchType = selectedType === 'All' || j.jobType === selectedType
    const matchCat  = selectedCategory === 'All' || j.category === selectedCategory
    return matchSearch && matchCity && matchType && matchCat
  })

  const jobTypes = ['All', 'Part-Time (Student Hours)', 'Short-Term / Freelance', 'Internship', 'Full-Time']
  const categories = ['All', 'Tutoring & Education', 'Café & Food Service', 'Tech & Design', 'Campus Brand Ambassador', 'Events & Admin']

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(99, 102, 241, 0.08) 100%)',
        border: '1px solid rgba(6, 182, 212, 0.25)',
        borderRadius: 20,
        padding: '2rem 1.5rem',
        marginBottom: '2rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 99, background: 'rgba(6, 182, 212, 0.2)', border: '1px solid rgba(6, 182, 212, 0.3)', marginBottom: 10 }}>
            <Briefcase size={14} color={colors.cyan} />
            <span style={{ fontSize: 12, fontWeight: 700, color: colors.cyan, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {t('jobs')}
            </span>
          </div>

          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 'clamp(1.6rem, 4vw, 2.3rem)', color: colors.white, margin: '0 0 8px', letterSpacing: '-0.5px' }}>
            {t('jobsTitle')}
          </h1>

          <p style={{ color: colors.mutedLight, fontSize: 15, maxWidth: 650, margin: '0 0 1.25rem', lineHeight: 1.5 }}>
            {t('jobsSub')}
          </p>

          <Btn variant="cyan" onClick={() => user ? setShowModal(true) : setPage('login')}>
            <PlusCircle size={16} /> {t('postJobBtn')}
          </Btn>
        </div>
      </div>

      {/* Search & Filter Controls - Responsive: Clean layout for phone & desktop */}
      <div style={{
        background: 'rgba(17, 28, 46, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 16,
        padding: '1.25rem',
        marginBottom: '2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
        {/* Search bar row */}
        <div style={{ width: '100%', position: 'relative' }}>
          <Search size={16} color={colors.muted} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder={t('searchJobsPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: 'rgba(6, 13, 25, 0.6)',
              border: '1px solid rgba(6, 182, 212, 0.2)',
              borderRadius: 10,
              padding: '11px 12px 11px 38px',
              color: colors.white,
              fontSize: 14,
              outline: 'none',
            }}
          />
        </div>

        {/* Filter selectors row: Country + City + Job Type */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Country + City Filter */}
          <div style={{ display: 'flex', gap: 8, flex: '2 1 240px', minWidth: 0 }}>
            <div style={{ flex: '1 1 110px', minWidth: 0 }}>
              <CountrySelect value={selectedCountry} onChange={v => setSelectedCountry(v)} />
            </div>
            <div style={{ flex: '2 1 140px', minWidth: 0 }}>
              <CityPicker value={selectedCity === 'All' ? '' : selectedCity} onChange={v => setSelectedCity(v || 'All')} placeholder="City or start typing" countryCode={selectedCountry} lang={null} />
            </div>
          </div>

          {/* Job Type Filter */}
          <div style={{ flex: '1 1 160px', minWidth: 0 }}>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(6, 13, 25, 0.6)',
                border: '1px solid rgba(6, 182, 212, 0.2)',
                borderRadius: 10,
                padding: '10px 14px',
                color: colors.white,
                fontSize: 13,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {jobTypes.map(jt => (
                <option key={jt} value={jt} style={{ background: '#0F1D33', color: '#FFF' }}>
                  ⏱️ {jt === 'All' ? t('allTypes') : jt}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Categories Pills - Smooth Swipeable Rail on Mobile */}
        <div 
          className="no-scrollbar touch-scroll"
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            paddingBottom: 4,
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                background: selectedCategory === cat ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                border: selectedCategory === cat ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                color: selectedCategory === cat ? colors.cyan : colors.mutedLight,
                fontSize: 12,
                fontWeight: selectedCategory === cat ? 700 : 500,
                padding: '7px 16px',
                borderRadius: 99,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all 0.15s ease',
              }}
            >
              {cat === 'All' ? t('allCategories') : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Jobs Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          <Skeleton height={200} borderRadius={16} />
          <Skeleton height={200} borderRadius={16} />
          <Skeleton height={200} borderRadius={16} />
        </div>
      ) : filteredJobs.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem 1.5rem',
          background: 'rgba(17, 28, 46, 0.5)',
          borderRadius: 16,
          border: '1px dashed rgba(255,255,255,0.1)',
        }}>
          <Briefcase size={36} color={colors.muted} style={{ marginBottom: 12 }} />
          <h3 style={{ color: colors.white, fontSize: 18, margin: '0 0 6px' }}>{t('noJobsFound')}</h3>
          <Btn variant="cyan" onClick={() => user ? setShowModal(true) : setPage('login')}>
            <PlusCircle size={15} /> {t('postJobBtn')}
          </Btn>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filteredJobs.map(job => {
            const isSaved = savedJobIds.includes(job.id)
            return (
              <div
                key={job.id}
                style={{
                  background: 'rgba(17, 28, 46, 0.75)',
                  border: '1px solid rgba(6, 182, 212, 0.18)',
                  borderRadius: 16,
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 14,
                  transition: 'transform 0.2s ease, border-color 0.2s ease',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.4)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.18)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <div>
                  {/* Top Row: Category & Bookmark */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <Badge variant="mint">{job.category}</Badge>
                      <Badge variant="cyan">{job.jobType}</Badge>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {isJobOwner(job) && (
                        <button
                          type="button"
                          onClick={() => setJobToDelete(job)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.35)',
                            color: '#EF4444',
                            borderRadius: 8,
                            padding: '3px 8px',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                          title="Delete this job posting"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      )}
                      <button
                        onClick={() => toggleSaveJob(job.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: isSaved ? colors.cyan : colors.muted,
                          cursor: 'pointer',
                          padding: 4,
                        }}
                        title={isSaved ? 'Remove Bookmark' : 'Save Job'}
                      >
                        <Bookmark size={18} fill={isSaved ? colors.cyan : 'none'} />
                      </button>
                    </div>
                  </div>

                  {/* Title & Company */}
                  <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 17, color: colors.white, margin: '0 0 4px', lineHeight: 1.3 }}>
                    {job.title}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: colors.cyan, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                    <Building2 size={14} /> {job.company}
                    {job.verified && <CheckCircle2 size={13} color={colors.mint} title={t('verifiedEmployer')} />}
                  </div>

                  {/* Key Highlights */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: 'rgba(6, 13, 25, 0.5)', padding: '10px 12px', borderRadius: 10, marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: colors.white }}>
                      <MapPin size={13} color={colors.cyan} /> <strong>{t('cityLabel')}:</strong> {tCity(job.city)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#34D399' }}>
                      <Clock size={13} color="#34D399" /> <strong>Schedule Fit:</strong> {job.scheduleFit}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#FBBF24' }}>
                      <DollarSign size={13} color="#FBBF24" /> <strong>Pay:</strong> {job.salary}
                    </div>
                  </div>

                  {/* Description */}
                  <p style={{ color: colors.mutedLight, fontSize: 13, lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {job.description}
                  </p>
                </div>

                {/* Footer Action */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: colors.muted }}>
                    Posted by {job.ownerName || 'Employer'}
                  </span>
                  <Btn variant="cyan" style={{ fontSize: 12, padding: '6px 14px' }} onClick={() => setSelectedJobForApply(job)}>
                    <Send size={13} /> {t('applyNow') || 'Apply Now'}
                  </Btn>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Post Job Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          zIndex: 200,
        }}>
          <div style={{
            background: '#0F1D33',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            borderRadius: 20,
            width: '100%',
            maxWidth: 540,
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '1.75rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 20, color: colors.white, margin: 0 }}>
                {t('postJob') || 'Post a Student Job Offer'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: colors.muted, fontSize: 22, cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            {formError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#F87171', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 14 }}>
                {formError}
              </div>
            )}

            <form onSubmit={handlePostJob} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Input
                label="Job Title"
                placeholder="e.g., Part-time Math Tutor, Student Barista, UI Design Intern"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />

              <Input
                label="Company / Employer Name"
                placeholder="e.g., Agdal Tutoring, Café Lumière, Private Employer"
                value={form.company}
                onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Input
                  label="City & Country *"
                  placeholder="e.g. Paris, Casablanca, Remote, London..."
                  value={form.city}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                />

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.mutedLight, marginBottom: 4 }}>Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    style={{
                      width: '100%',
                      background: 'rgba(6, 13, 25, 0.6)',
                      border: '1px solid rgba(6, 182, 212, 0.2)',
                      borderRadius: 10,
                      padding: '10px',
                      color: colors.white,
                      fontSize: 13,
                    }}
                  >
                    {categories.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c} style={{ background: '#0F1D33' }}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.mutedLight, marginBottom: 4 }}>Contract Type</label>
                  <select
                    value={form.jobType}
                    onChange={e => setForm(f => ({ ...f, jobType: e.target.value }))}
                    style={{
                      width: '100%',
                      background: 'rgba(6, 13, 25, 0.6)',
                      border: '1px solid rgba(6, 182, 212, 0.2)',
                      borderRadius: 10,
                      padding: '10px',
                      color: colors.white,
                      fontSize: 13,
                    }}
                  >
                    {jobTypes.filter(t => t !== 'All').map(t => (
                      <option key={t} value={t} style={{ background: '#0F1D33' }}>{t}</option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Schedule Fit with School Hours"
                  placeholder="e.g. Evenings & Weekends, 10 hrs/week"
                  value={form.scheduleFit}
                  onChange={e => setForm(f => ({ ...f, scheduleFit: e.target.value }))}
                />
              </div>

              <Input
                label="Salary / Pay / Stipend"
                placeholder="e.g. 80 DH / hour or 2,500 DH / month"
                value={form.salary}
                onChange={e => setForm(f => ({ ...f, salary: e.target.value }))}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Input
                  label="Contact Email"
                  placeholder="e.g. jobs@employer.ma"
                  value={form.contactEmail}
                  onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))}
                />
                <Input
                  label="Contact Phone / WhatsApp"
                  placeholder="e.g. +212 661-000000"
                  value={form.contactPhone}
                  onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))}
                />
              </div>

              <Textarea
                label="Job Description & Requirements"
                placeholder="Describe key responsibilities, required skills, and student benefits..."
                rows={4}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <Btn variant="cyan" style={{ flex: 1, padding: 12 }} type="submit" disabled={submitting}>
                  {submitting ? 'Publishing...' : 'Publish Job Offer'}
                </Btn>
                <Btn variant="outline" style={{ padding: 12 }} onClick={() => setShowModal(false)} type="button">
                  Cancel
                </Btn>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Apply / Contact Modal */}
      {selectedJobForApply && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          zIndex: 200,
        }}>
          <div style={{
            background: '#0F1D33',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            borderRadius: 20,
            width: '100%',
            maxWidth: 480,
            padding: '1.75rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Briefcase size={20} color={colors.cyan} />
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, color: colors.white, margin: 0 }}>
                  Apply to {selectedJobForApply.company}
                </h3>
              </div>
              <button
                onClick={() => setSelectedJobForApply(null)}
                style={{ background: 'none', border: 'none', color: colors.muted, fontSize: 22, cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <div style={{ background: 'rgba(6, 13, 25, 0.6)', padding: '12px 14px', borderRadius: 12, marginBottom: 16 }}>
              <h4 style={{ color: colors.white, margin: '0 0 4px', fontSize: 15 }}>{selectedJobForApply.title}</h4>
              <p style={{ color: colors.mutedLight, fontSize: 12, margin: 0 }}>
                {selectedJobForApply.city} | {selectedJobForApply.salary}
              </p>
            </div>

            <p style={{ color: colors.mutedLight, fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>
              Contact the employer directly to submit your CV or express your interest for this position:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {selectedJobForApply.contactEmail && (
                <a
                  href={`mailto:${selectedJobForApply.contactEmail}?subject=Application for ${encodeURIComponent(selectedJobForApply.title)} - Gha Talaba`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: 'rgba(6, 182, 212, 0.15)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    padding: '12px 16px',
                    borderRadius: 12,
                    color: colors.cyan,
                    fontWeight: 600,
                    fontSize: 14,
                    textDecoration: 'none',
                  }}
                >
                  <Mail size={18} /> Direct Email: {selectedJobForApply.contactEmail}
                </a>
              )}

              {selectedJobForApply.contactPhone && (
                <a
                  href={`https://wa.me/${selectedJobForApply.contactPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello, I saw your job listing "${selectedJobForApply.title}" on Gha Talaba and would like to apply!`)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: 'rgba(52, 211, 153, 0.15)',
                    border: '1px solid rgba(52, 211, 153, 0.3)',
                    padding: '12px 16px',
                    borderRadius: 12,
                    color: '#34D399',
                    fontWeight: 600,
                    fontSize: 14,
                    textDecoration: 'none',
                  }}
                >
                  <Phone size={18} /> WhatsApp / Phone: {selectedJobForApply.contactPhone}
                </a>
              )}
            </div>

            {user ? (
              <Btn
                variant="cyan"
                style={{ width: '100%', padding: 12 }}
                onClick={() => {
                  setSelectedJobForApply(null)
                  setPage('inbox')
                }}
              >
                <Send size={15} /> Message Employer in Gha Talaba Chat
              </Btn>
            ) : (
              <Btn
                variant="primary"
                style={{ width: '100%', padding: 12 }}
                onClick={() => {
                  setSelectedJobForApply(null)
                  setPage('signup')
                }}
              >
                Sign Up to Chat in Real-Time
              </Btn>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(jobToDelete)}
        onClose={() => setJobToDelete(null)}
        onConfirm={handleConfirmDeleteJob}
        title="Delete Job Posting?"
        message={`Are you sure you want to delete the job posting "${jobToDelete?.title}" at ${jobToDelete?.company}?`}
        loading={deleteLoading}
      />
    </div>
  )
}
