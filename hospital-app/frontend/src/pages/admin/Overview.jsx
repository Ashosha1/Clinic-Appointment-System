import { useState, useEffect } from 'react'
import api from '../../api'
import StatCard from '../../components/StatCard'
import Badge from '../../components/Badge'
import Spinner from '../../components/Spinner'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const PIE_COLORS = ['#1A6B8A', '#34C4A0', '#F5A623', '#E05C5C', '#7C3AED', '#059669']

export default function AdminOverview() {
  const [summary, setSummary] = useState(null)
  const [trend, setTrend] = useState([])
  const [specialty, setSpecialty] = useState([])
  const [recentAppts, setRecentAppts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/analytics/summary'),
      api.get('/analytics/appointments-trend?days=30'),
      api.get('/analytics/specialty-breakdown'),
      api.get('/appointments'),
    ]).then(([s, t, sp, a]) => {
      setSummary(s.data)
      setTrend(t.data)
      setSpecialty(sp.data)
      setRecentAppts(a.data.slice(0, 10))
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Overview</h1>
          <p className="page-sub">Hospital performance at a glance</p>
        </div>
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        <StatCard label="Total Patients" value={summary?.totalPatients} icon="👥" color="#EBF4F8" />
        <StatCard label="Total Doctors" value={summary?.totalDoctors} icon="🩺" color="#ECFDF5" iconColor="#059669" />
        <StatCard label="Today's Appts" value={summary?.todayAppts} icon="📅" color="#F5F3FF" iconColor="#7C3AED" />
        <StatCard label="Pending" value={summary?.pendingAppts} icon="⏳" color="#FFFBEB" iconColor="#D97706" />
        <StatCard label="Monthly Revenue" value={`$${(summary?.monthlyRevenue || 0).toLocaleString()}`} icon="💰" color="#FDF2F8" iconColor="#BE185D" sub="@ $75/appt" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Appointments Trend (30 Days)</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={trend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2EAF0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip labelFormatter={d => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                <Line type="monotone" dataKey="count" stroke="#1A6B8A" strokeWidth={2} dot={false} name="Appointments" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>By Specialty</h3>
          {specialty.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}><p>No data</p></div>
          ) : (
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={specialty} dataKey="count" nameKey="specialty" cx="50%" cy="50%" outerRadius={80} label={({ specialty: s, percent }) => `${s} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                    {specialty.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Recent Appointments</h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Specialty</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentAppts.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 500 }}>{a.patient_name}</td>
                  <td>{a.doctor_name}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 12.5 }}>{a.specialty}</td>
                  <td>{formatDate(a.date)}</td>
                  <td>{a.time_slot}</td>
                  <td><Badge status={a.status} /></td>
                </tr>
              ))}
              {recentAppts.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 30, color: 'var(--text-secondary)' }}>No appointments yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
