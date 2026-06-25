import { useState, useEffect } from 'react'
import api from '../../api'
import Badge from '../../components/Badge'
import Modal from '../../components/Modal'
import Spinner from '../../components/Spinner'

export default function PatientAppointments() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('upcoming')
  const [selected, setSelected] = useState(null)
  const [cancelling, setCancelling] = useState(null)

  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    api.get('/appointments').then(r => setAppointments(r.data)).finally(() => setLoading(false))
  }, [])

  const tabs = {
    upcoming: appointments.filter(a => a.date >= today && a.status !== 'cancelled'),
    past: appointments.filter(a => a.date < today || a.status === 'completed'),
    cancelled: appointments.filter(a => a.status === 'cancelled'),
  }

  async function handleCancel(id) {
    setCancelling(id)
    try {
      await api.put(`/appointments/${id}`, { status: 'cancelled' })
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a))
      setSelected(null)
    } finally {
      setCancelling(null)
    }
  }

  if (loading) return <Spinner />

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Appointments</h1>
          <p className="page-sub">View and manage your appointments</p>
        </div>
      </div>

      <div className="card">
        <div className="tabs">
          {['upcoming', 'past', 'cancelled'].map(t => (
            <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)} ({tabs[t].length})
            </button>
          ))}
        </div>

        {tabs[tab].length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No {tab} appointments</h3>
            <p>Your {tab} appointments will appear here</p>
          </div>
        ) : (
          tabs[tab].map(a => (
            <div key={a.id} className={`appt-card ${a.status}`}>
              <div className="appt-card-avatar">{a.doctor_name?.charAt(4) || 'D'}</div>
              <div className="appt-card-body">
                <div className="appt-card-name">{a.doctor_name}</div>
                <div className="appt-card-sub">{a.specialty} · {formatDate(a.date)} at {a.time_slot}</div>
                {a.reason && <div className="appt-card-sub">{a.reason}</div>}
              </div>
              <div className="appt-card-actions">
                <Badge status={a.status} />
                <button className="btn btn-outline btn-sm" onClick={() => setSelected(a)}>Details</button>
                {tab === 'upcoming' && a.status !== 'cancelled' && (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleCancel(a.id)}
                    disabled={cancelling === a.id}
                  >
                    {cancelling === a.id ? '…' : 'Cancel'}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {selected && (
        <Modal title="Appointment Details" onClose={() => setSelected(null)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { label: 'Booking ID', value: `#${String(selected.id).padStart(6, '0')}` },
              { label: 'Status', value: <Badge status={selected.status} /> },
              { label: 'Doctor', value: selected.doctor_name },
              { label: 'Specialty', value: selected.specialty },
              { label: 'Date', value: formatDate(selected.date) },
              { label: 'Time', value: selected.time_slot },
            ].map(item => (
              <div key={item.label}>
                <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>{item.label}</div>
                <div style={{ fontSize: 14 }}>{item.value}</div>
              </div>
            ))}
          </div>
          {selected.reason && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>Reason</div>
              <div style={{ fontSize: 14 }}>{selected.reason}</div>
            </div>
          )}
          {selected.notes && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>Doctor's Notes</div>
              <div style={{ fontSize: 14, background: 'var(--bg)', padding: '10px 14px', borderRadius: 6 }}>{selected.notes}</div>
            </div>
          )}
          {selected.status !== 'cancelled' && selected.date >= new Date().toISOString().slice(0,10) && (
            <div style={{ marginTop: 20 }}>
              <button
                className="btn btn-danger"
                style={{ width: '100%' }}
                onClick={() => handleCancel(selected.id)}
                disabled={cancelling === selected.id}
              >
                {cancelling === selected.id ? 'Cancelling…' : 'Cancel Appointment'}
              </button>
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}
