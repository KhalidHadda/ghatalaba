import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { LanguageProvider } from './context/LanguageContext'
import { ThemeProvider } from './context/ThemeContext'
import { NotificationProvider } from './context/NotificationContext'
import Navbar            from './components/Navbar'
import EmailVerificationBanner from './components/EmailVerificationBanner'
import HomePage          from './pages/HomePage'
import LoginPage         from './pages/LoginPage'
import SignupPage        from './pages/SignupPage'
import ListingsPage      from './pages/ListingsPage'
import ProfilePage       from './pages/ProfilePage'
import ContactPage       from './pages/ContactPage'
import InboxPage         from './pages/InboxPage'
import DiscoverPage      from './pages/DiscoverPage'
import MyListingsPage    from './pages/MyListingsPage'
import SavedPage         from './pages/SavedPage'
import FeedPage          from './pages/FeedPage'
import EventsPage        from './pages/EventsPage'
import JobsPage          from './pages/JobsPage'
import MarketplacePage   from './pages/MarketplacePage'
import RidesharePage     from './pages/RidesharePage'

const PAGE_META = {
  home: {
    title: 'Gha Talaba - Global Student Hub & Housing | Born in Morocco',
    description: 'Housing, roommate matching, student jobs, marketplace, rideshare, and campus community — born in Morocco, built for students worldwide.',
  },
  marketplace: {
    title: 'Student & Community Marketplace | Gha Talaba',
    description: 'Buy and sell textbooks, laptops, room furniture, appliances, and student gear at affordable prices.',
  },
  rideshare: {
    title: 'Rideshare & Grand Taxi Splitter | Gha Talaba',
    description: 'Intercity carpooling and Grand Taxi group splitting for students commuting across cities.',
  },
  feed: {
    title: 'Campus Feed | Gha Talaba Global Student Community',
    description: 'Engage in live student discussions, campus news, and study tips across universities in Morocco and worldwide.',
  },
  listings: {
    title: 'Student Housing & Rentals | Gha Talaba Global',
    description: 'Find affordable student housing, studios, and shared apartments near universities in Morocco and globally.',
  },
  jobs: {
    title: 'Student Jobs & Internships | Gha Talaba Global',
    description: 'Explore part-time student jobs, tutoring, freelance work, and internships in Morocco and international remote opportunities.',
  },
  events: {
    title: 'Student Events & Meetups | Gha Talaba',
    description: 'Discover upcoming university events, hackathons, academic workshops, and student meetups locally and globally.',
  },
  discover: {
    title: 'Roommate Finder | Gha Talaba',
    description: 'Find compatible student roommates in Morocco and across international student hubs.',
  },
  inbox: {
    title: 'Real-Time Chat & Messages | Gha Talaba',
    description: 'Chat in real-time with landlords, roommates, and university peers worldwide.',
  },
  profile: {
    title: 'My Profile | Gha Talaba',
    description: 'Manage your verified student badge, housing preferences, and global roommate profile.',
  },
  saved: {
    title: 'Saved Housing Listings | Gha Talaba',
    description: 'Your bookmarked student housing listings in Morocco and worldwide.',
  },
  myListings: {
    title: 'My Listings | Gha Talaba',
    description: 'Manage your published student housing announcements.',
  },
  login: {
    title: 'Sign In | Gha Talaba',
    description: 'Sign in to access student housing, roommate matching, and global campus chat.',
  },
  signup: {
    title: 'Join Gha Talaba | Global Student Network',
    description: 'Create your verified student account on Gha Talaba, open to students everywhere.',
  },
  contact: {
    title: 'Contact Landlord / Student | Gha Talaba',
    description: 'Send a direct message to housing owners and student roommates.',
  },
}

const ROUTE_PATH_MAP = {
  home: '/',
  feed: '/feed',
  marketplace: '/marketplace',
  rideshare: '/rideshare',
  listings: '/listings',
  jobs: '/jobs',
  events: '/events',
  discover: '/discover',
  inbox: '/inbox',
  profile: '/profile',
  saved: '/saved',
  myListings: '/my-listings',
  createListing: '/create-listing',
  login: '/login',
  signup: '/signup',
  contact: '/contact',
}

const PATH_TO_PAGE_MAP = {
  '': 'home',
  'home': 'home',
  'feed': 'feed',
  'marketplace': 'marketplace',
  'rideshare': 'rideshare',
  'listings': 'listings',
  'jobs': 'jobs',
  'events': 'events',
  'discover': 'discover',
  'inbox': 'inbox',
  'profile': 'profile',
  'saved': 'saved',
  'my-listings': 'myListings',
  'mylistings': 'myListings',
  'create-listing': 'createListing',
  'createlisting': 'createListing',
  'login': 'login',
  'signup': 'signup',
  'contact': 'contact',
}

function getPageFromLocation() {
  // Check pathname first (e.g., /feed -> 'feed')
  const path = window.location.pathname.replace(/^\/+/, '').split('/')[0].toLowerCase()
  if (PATH_TO_PAGE_MAP[path]) return PATH_TO_PAGE_MAP[path]

  // Backward compatibility fallback for existing hash bookmarks (e.g., /#feed -> 'feed')
  const hash = window.location.hash.replace('#', '').replace(/^\/+/, '').toLowerCase()
  if (PATH_TO_PAGE_MAP[hash]) return PATH_TO_PAGE_MAP[hash]

  return 'home'
}

function AppContent() {
  const { user } = useAuth()
  
  // Read page from URL path on initial load (HTML5 Web History)
  const [page, setPage] = useState(() => getPageFromLocation())
  
  const [selectedUser, setSelectedUser] = useState(null)

  const guestAllowedPages = ['home', 'login', 'signup']
  const activePage = !user && !guestAllowedPages.includes(page) 
    ? 'home' 
    : (user && page === 'home') 
      ? 'feed' 
      : page

  // Synchronize clean URL path and document meta tags
  useEffect(() => {
    const meta = PAGE_META[activePage] || PAGE_META.home
    document.title = meta.title

    let metaDesc = document.querySelector('meta[name="description"]')
    if (!metaDesc) {
      metaDesc = document.createElement('meta')
      metaDesc.name = 'description'
      document.head.appendChild(metaDesc)
    }
    metaDesc.content = meta.description

    // Update URL path without hash using HTML5 Web History
    const targetPath = ROUTE_PATH_MAP[activePage] || '/'
    if (window.location.pathname !== targetPath || window.location.hash) {
      window.history.replaceState({ page: activePage }, '', targetPath)
    }
  }, [activePage])

  // Listen to browser Back/Forward navigation (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const p = getPageFromLocation()
      setPage(p)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = (p, opts = {}) => {
    if (opts.user) setSelectedUser(opts.user)
    setPage(p)
    const targetPath = ROUTE_PATH_MAP[p] || '/'
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ page: p }, '', targetPath)
    }
    window.scrollTo(0, 0)
  }

  const pages = {
    home:          <HomePage          setPage={navigate} />,
    login:         <LoginPage         setPage={navigate} />,
    signup:        <SignupPage        setPage={navigate} />,
    feed:          <FeedPage          setPage={navigate} />,
    jobs:          <JobsPage          setPage={navigate} />,
    marketplace:   <MarketplacePage   setPage={navigate} setSelectedUser={setSelectedUser} />,
    rideshare:     <RidesharePage     setPage={navigate} setSelectedUser={setSelectedUser} />,
    events:        <EventsPage        setPage={navigate} />,
    listings:      <ListingsPage      setPage={navigate} setSelectedUser={setSelectedUser} />,
    profile:       <ProfilePage       setPage={navigate} targetUser={selectedUser} />,
    contact:       <ContactPage       setPage={navigate} targetUser={selectedUser} />,
    inbox:         <InboxPage         setPage={navigate} />,
    createListing: <MyListingsPage    setPage={navigate} />,
    discover:      <DiscoverPage      setPage={navigate} setSelectedUser={setSelectedUser} />,
    myListings:    <MyListingsPage    setPage={navigate} />,
    saved:         <SavedPage         setPage={navigate} />,
  }

  const hideNav = activePage === 'login' || activePage === 'signup'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      {!hideNav && <Navbar page={activePage} setPage={navigate} />}
      {!hideNav && <EmailVerificationBanner />}
      <main style={{ flex: 1 }}>
        {pages[activePage] ?? pages.feed}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <ThemeProvider>
          <NotificationProvider>
            <AppContent />
          </NotificationProvider>
        </ThemeProvider>
      </LanguageProvider>
    </AuthProvider>
  )
}
