import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'
import StatCard from '../../components/StatCard'
import Badge from '../../components/Badge'
import Spinner from '../../components/Spinner'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function DoctorDashboard() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [trend, setTrend] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/appointments'),
      api.get('/analytics/appointments-trend?days=7'),
    ]).then(([apptRes, trendRes]) => {
      setAppointments(apptRes.data)
      setTrend(trendRes.data)
    }).finally(() => setLoading(false))
  }, [])

  const today = new Date().toISOString().slice(0, 10)
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  const weekStartStr = weekStart.toISOString().slice(0, 10)

  const todayAppts = appointments.filter(a => a.date === today)
  const weekAppts = appointments.filter(a => a.date >= weekStartStr)
  const uniquePatients = new Set(appointments.map(a => a.patient_id)).size
  const pending = appointments.filter(a => a.status === 'pending')

  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  if (loading) return <Spinner />

  return (
    <div>
      <div className="welcome-banner">
        <h2>Good {greeting()}, {user?.name}!</h2>
        <p>{dateStr}</p>
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        <StatCard label="Today's Appts" value={todayAppts.length} icon="📅" color="#EBF4F8" />
        <StatCard label="This Week" value={weekAppts.length} icon="📆" color="#ECFDF5" iconColor="#059669" />
        <StatCard label="Total Patients" value={uniquePatients} icon="👥" color="#F5F3FF" iconColor="#7C3AED" />
        <StatCard label="Pending" value={pending.length} icon="⏳" color="#FFFBEB" iconColor="#D97706" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Today's Schedule</h3>
          {todayAppts.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <div className="empty-icon">📅</div>
              <p>No appointments today</p>
            </div>
          ) : (
            todayAppts.sort((a, b) => a.time_slot.localeCompare(b.time_slot)).map(a => (
              <div key={a.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', minWidth: 46 }}>{a.time_slot}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{a.patient_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{a.reason || 'No reason specified'}</div>
                </div>
                <Badge status={a.status} />
              </div>
            ))
          )}
        </div>

        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Appointments (Last 7 Days)</h3>
          {trend.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}><p>No data yet</p></div>
          ) : (
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={trend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2EAF0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip labelFormatter={d => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                  <Bar dataKey="count" fill="#1A6B8A" radius={[4,4,0,0]} name="Appointments" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'
}
