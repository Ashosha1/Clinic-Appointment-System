import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'
import StatCard from '../../components/StatCard'
import Badge from '../../components/Badge'
import Spinner from '../../components/Spinner'

export default function PatientDashboard() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/appointments').then(r => setAppointments(r.data)).finally(() => setLoading(false))
  }, [])

  const today = new Date().toISOString().slice(0, 10)
  const upcoming = appointments.filter(a => a.date >= today && a.status !== 'cancelled')
  const completed = appointments.filter(a => a.status === 'completed')
  const cancelled = appointments.filter(a => a.status === 'cancelled')
  const nextAppt = upcoming.sort((a, b) => a.date.localeCompare(b.date))[0]
  const recent = [...appointments].sort((a, b) => b.created_at?.localeCompare(a.created_at)).slice(0, 5)

  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  if (loading) return <Spinner />

  return (
    <div>
      <div className="welcome-banner">
        <h2>Good {greeting()}, {user?.name?.split(' ')[0]}! 👋</h2>
        <p>{dateStr}</p>
      </div>

      <div className="stat-grid">
        <StatCard label="Upcoming" value={upcoming.length} icon="📅" color="#EBF4F8" iconColor="#1A6B8A" sub="appointments" />
        <StatCard label="Completed" value={completed.length} icon="✅" color="#ECFDF5" iconColor="#059669" sub="visits" />
        <StatCard label="Cancelled" value={cancelled.length} icon="✕" color="#FEF2F2" iconColor="#E05C5C" sub="appointments" />
      </div>

      {nextAppt && (
        <div className="card" style={{ marginBottom: 24, borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Next Appointment</p>
              <h3 style={{ fontSize: 17px, fontWeight: 700 }}>{nextAppt.doctor_name}</h3>
              <p style={{ color: 'var(--primary)', fontSize: 13px, fontWeight: 500 }}>{nextAppt.specialty}</p>
              <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: 13.5 }}>
                📅 {formatDate(nextAppt.date)} &nbsp;⏰ {nextAppt.time_slot}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
              <Badge status={nextAppt.status} />
              <Link to="/patient/appointments" className="btn btn-outline btn-sm">View Details</Link>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>Recent Activity</h3>
          <Link to="/patient/appointments" className="btn btn-ghost btn-sm">View all →</Link>
        </div>
        {recent.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No appointments yet</h3>
            <p>Book your first appointment to get started</p>
            <Link to="/patient/book" className="btn btn-primary" style={{ marginTop: 16 }}>Book Appointment</Link>
          </div>
        ) : (
          recent.map(a => (
            <div key={a.id} className={`appt-card ${a.status}`}>
              <div className="appt-card-avatar">{a.doctor_name?.charAt(3) || 'D'}</div>
              <div className="appt-card-body">
                <div className="appt-card-name">{a.doctor_name}</div>
                <div className="appt-card-sub">{a.specialty} · {formatDate(a.date)} at {a.time_slot}</div>
                {a.reason && <div className="appt-card-sub" style={{ marginTop: 2 }}>{a.reason}</div>}
              </div>
              <Badge status={a.status} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
