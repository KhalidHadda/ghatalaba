import { useState } from 'react'
import { AuthProvider } from './hooks/useAuth'
import Navbar            from './components/Navbar'
import HomePage          from './pages/HomePage'
import LoginPage         from './pages/LoginPage'
import SignupPage        from './pages/SignupPage'
import ListingsPage      from './pages/ListingsPage'
import ProfilePage       from './pages/ProfilePage'
import ContactPage       from './pages/ContactPage'
import InboxPage         from './pages/InboxPage'
import CreateListingPage from './pages/CreateListingPage'
import DiscoverPage      from './pages/DiscoverPage'
import MyListingsPage    from './pages/MyListingsPage'
import SavedPage         from './pages/SavedPage'

export default function App() {
  const [page, setPage]                 = useState('home')
  const [selectedUser, setSelectedUser] = useState(null)

  const navigate = (p, opts = {}) => {
    if (opts.user) setSelectedUser(opts.user)
    setPage(p)
    window.scrollTo(0, 0)
  }

  const pages = {
    home:          <HomePage          setPage={navigate} />,
    login:         <LoginPage         setPage={navigate} />,
    signup:        <SignupPage        setPage={navigate} />,
    listings:      <ListingsPage      setPage={navigate} setSelectedUser={setSelectedUser} />,
    profile:       <ProfilePage       setPage={navigate} targetUser={selectedUser} />,
    contact:       <ContactPage       setPage={navigate} targetUser={selectedUser} />,
    inbox:         <InboxPage         setPage={navigate} />,
    createListing: <CreateListingPage setPage={navigate} />,
    discover:      <DiscoverPage      setPage={navigate} setSelectedUser={setSelectedUser} />,
    myListings:    <MyListingsPage    setPage={navigate} />,
    saved:         <SavedPage         setPage={navigate} />,
  }

  const hideNav = page === 'login' || page === 'signup'

  return (
    <AuthProvider>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
        {!hideNav && <Navbar page={page} setPage={navigate} />}
        <main style={{ flex: 1 }}>
          {pages[page] ?? pages.home}
        </main>
      </div>
    </AuthProvider>
  )
}