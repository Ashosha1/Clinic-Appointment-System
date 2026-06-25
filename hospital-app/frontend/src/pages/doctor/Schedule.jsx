import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'
import Badge from '../../components/Badge'
import Spinner from '../../components/Spinner'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function DoctorSchedule() {
  const { user } = useAuth()
  const [doctor, setDoctor] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedDay, setExpandedDay] = useState(null)
  const [saving, setSaving] = useState(false)
  const [availDays, setAvailDays] = useState([1,2,3,4,5])
  const [hours, setHours] = useState({ start: '09:00', end: '17:00' })
  const [msg, setMsg] = useState('')

  useEffect(() => {
    Promise.all([
      api.get(`/doctors/${user.doctorId}`),
      api.get('/appointments'),
    ]).then(([docRes, apptRes]) => {
      const d = docRes.data
      setDoctor(d)
      setAvailDays(d.available_days?.split(',').map(Number) || [1,2,3,4,5])
      setHours({ start: d.available_hours_start || '09:00', end: d.available_hours_end || '17:00' })
      setAppointments(apptRes.data)
    }).finally(() => setLoading(false))
  }, [user.doctorId])

  // Build 5-day week view (Mon-Fri of current week)
  function getWeekDays() {
    const now = new Date()
    const monday = new Date(now)
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      return d.toISOString().slice(0, 10)
    })
  }

  const weekDays = getWeekDays()

  function apptsByDate(date) {
    return appointments.filter(a => a.date === date).sort((a, b) => a.time_slot.localeCompare(b.time_slot))
  }

  async function saveSchedule() {
    setSaving(true)
    setMsg('')
    try {
      await api.put(`/doctors/${user.doctorId}`, {
        available_days: availDays.sort().join(','),
        available_hours_start: hours.start,
        available_hours_end: hours.end,
      })
      setMsg('Schedule saved successfully')
    } catch {
      setMsg('Failed to save schedule')
    } finally {
      setSaving(false)
    }
  }

  function toggleDay(dow) {
    setAvailDays(prev =>
      prev.includes(dow) ? prev.filter(d => d !== dow) : [...prev, dow]
    )
  }

  if (loading) return <Spinner />

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Schedule</h1>
          <p className="page-sub">Manage your availability and working hours</p>
        </div>
        <button className="btn btn-primary" onClick={saveSchedule} disabled={saving}>
          {saving ? 'Saving…' : 'Save Schedule'}
        </button>
      </div>

      {msg && <div className={`alert ${msg.includes('success') ? 'alert-success' : 'alert-error'}`}>{msg}</div>}

      {/* Availability settings */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Availability Settings</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <div className="form-label" style={{ marginBottom: 10 }}>Working Days</div>
            <div className="checkbox-grid">
              {[0,1,2,3,4,5,6].map(d => (
                <label key={d} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={availDays.includes(d)}
                    onChange={() => toggleDay(d)}
                  />
                  {SHORT_DAYS[d]}
                </label>
              ))}
            </div>
          </div>
          <div>
            <div className="form-label" style={{ marginBottom: 10 }}>Working Hours</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input
                type="time"
                className="form-input"
                style={{ width: 120 }}
                value={hours.start}
                onChange={e => setHours(h => ({ ...h, start: e.target.value }))}
              />
              <span style={{ color: 'var(--text-secondary)' }}>to</span>
              <input
                type="time"
                className="form-input"
                style={{ width: 120 }}
                value={hours.end}
                onChange={e => setHours(h => ({ ...h, end: e.target.value }))}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Weekly view */}
      <div className="card">
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>This Week</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
          {weekDays.map(date => {
            const dow = new Date(date + 'T12:00:00').getDay()
            const isAvail = availDays.includes(dow)
            const dayAppts = apptsByDate(date)
            const isToday = date === new Date().toISOString().slice(0, 10)
            const isExpanded = expandedDay === date

            return (
              <div key={date} style={{ border: `2px solid ${isToday ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 10, overflow: 'hidden' }}>
                <div
                  style={{
                    padding: '10px 12px',
                    background: isToday ? 'var(--primary)' : isAvail ? 'var(--bg)' : '#F9FAFB',
                    color: isToday ? 'white' : 'var(--text)',
                    cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                  onClick={() => setExpandedDay(isExpanded ? null : date)}
                >
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{SHORT_DAYS[dow]}</div>
                    <div style={{ fontSize: 11, opacity: 0.8 }}>{date.slice(5)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {isAvail ? (
                      <span style={{ fontSize: 11, fontWeight: 700, color: isToday ? 'rgba(255,255,255,0.9)' : 'var(--accent)' }}>
                        {dayAppts.length} appt{dayAppts.length !== 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: isToday ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)' }}>Day off</span>
                    )}
                  </div>
                </div>
                {isExpanded && dayAppts.length > 0 && (
                  <div style={{ padding: '8px 10px', background: 'white' }}>
                    {dayAppts.map(a => (
                      <div key={a.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                        <span style={{ fontWeight: 700, color: 'var(--primary)', minWidth: 40 }}>{a.time_slot}</span>
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.patient_name}</span>
                        <Badge status={a.status} />
                      </div>
                    ))}
                  </div>
                )}
                {isExpanded && dayAppts.length === 0 && (
                  <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center' }}>No appointments</div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
