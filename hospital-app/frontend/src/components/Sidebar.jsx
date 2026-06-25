import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import api from '../api'

const NAV = {
  patient: [
    { to: '/patient', label: 'Dashboard', icon: '⊞', end: true },
    { to: '/patient/book', label: 'Book Appointment', icon: '＋' },
    { to: '/patient/appointments', label: 'My Appointments', icon: '📋' },
    { to: '/patient/notifications', label: 'Notifications', icon: '🔔', badge: true },
    { to: '/patient/profile', label: 'Profile', icon: '👤' },
  ],
  doctor: [
    { to: '/doctor', label: 'Dashboard', icon: '⊞', end: true },
    { to: '/doctor/schedule', label: 'My Schedule', icon: '📅' },
    { to: '/doctor/appointments', label: 'Appointments', icon: '📋' },
    { to: '/doctor/patients', label: 'Patients', icon: '👥' },
    { to: '/doctor/profile', label: 'Profile', icon: '👤' },
  ],
  admin: [
    { to: '/admin', label: 'Overview', icon: '⊞', end: true },
    { to: '/admin/doctors', label: 'Manage Doctors', icon: '🩺' },
    { to: '/admin/patients', label: 'Manage Patients', icon: '👥' },
    { to: '/admin/appointments', label: 'All Appointments', icon: '📋' },
    { to: '/admin/analytics', label: 'Analytics', icon: '📊' },
    { to: '/admin/settings', label: 'Settings', icon: '⚙️' },
  ],
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (user?.role === 'patient' || user?.role === 'doctor') {
      api.get('/notifications').then(r => {
        setUnread(r.data.filter(n => !n.is_read).length)
      }).catch(() => {})
    }
  }, [user])

  const links = NAV[user?.role] || []
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <>
      <button className="hamburger" onClick={() => setOpen(o => !o)} aria-label="Menu">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="1" y="4" width="16" height="2" rx="1" fill="#1C2B3A"/>
          <rect x="1" y="8" width="16" height="2" rx="1" fill="#1C2B3A"/>
          <rect x="1" y="12" width="16" height="2" rx="1" fill="#1C2B3A"/>
        </svg>
      </button>

      <div className={`sidebar-overlay ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-mark">
            <div className="logo-icon">M</div>
            <div>
              <div className="logo-text">MediCare</div>
              <div className="logo-sub">Hospital System</div>
            </div>
          </div>
        </div>

        <span className={`sidebar-role-badge ${user?.role}`}>{user?.role}</span>

        <nav className="sidebar-nav">
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <span className="nav-icon">{link.icon}</span>
              {link.label}
              {link.badge && unread > 0 && (
                <span className="nav-badge">{unread}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{initials}</div>
            <div>
              <div className="user-name">{user?.name}</div>
              <div className="user-email">{user?.email}</div>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>Sign Out</button>
        </div>
      </aside>
    </>
  )
}
