import { useState, useEffect } from 'react'
import api from '../../api'
import Badge from '../../components/Badge'
import Spinner from '../../components/Spinner'

const PAGE_SIZE = 10

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [notes, setNotes] = useState({})
  const [savingNotes, setSavingNotes] = useState({})

  useEffect(() => {
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    if (dateFrom) params.set('date_from', dateFrom)
    if (dateTo) params.set('date_to', dateTo)
    api.get(`/appointments?${params}`).then(r => setAppointments(r.data)).finally(() => setLoading(false))
  }, [statusFilter, dateFrom, dateTo])

  async function updateStatus(id, status) {
    await api.put(`/appointments/${id}`, { status })
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a))
  }

  async function saveNote(id) {
    setSavingNotes(s => ({ ...s, [id]: true }))
    await api.put(`/appointments/${id}`, { notes: notes[id] ?? '' })
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, notes: notes[id] ?? '' } : a))
    setSavingNotes(s => ({ ...s, [id]: false }))
  }

  const filtered = appointments
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  if (loading) return <Spinner />

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Appointments</h1>
          <p className="page-sub">{appointments.length} total appointments</p>
        </div>
      </div>

      <div className="card">
        <div className="filter-bar">
          <select className="form-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
            <option value="">All Statuses</option>
            {['pending','confirmed','completed','cancelled'].map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <input type="date" className="form-input" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1) }} placeholder="From date" />
          <input type="date" className="form-input" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1) }} placeholder="To date" />
          <button className="btn btn-outline btn-sm" onClick={() => { setStatusFilter(''); setDateFrom(''); setDateTo(''); setPage(1) }}>Clear</button>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Date</th>
                <th>Time</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>No appointments found</td></tr>
              ) : paged.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600 }}>{a.patient_name}</td>
                  <td>{formatDate(a.date)}</td>
                  <td>{a.time_slot}</td>
                  <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.reason || '—'}</td>
                  <td><Badge status={a.status} /></td>
                  <td style={{ minWidth: 180 }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        className="inline-edit"
                        defaultValue={a.notes || ''}
                        placeholder="Add note…"
                        onChange={e => setNotes(n => ({ ...n, [a.id]: e.target.value }))}
                        onBlur={() => { if (notes[a.id] !== undefined && notes[a.id] !== a.notes) saveNote(a.id) }}
                      />
                      {savingNotes[a.id] && <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Saving…</span>}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6', flexWrap: 'wrap' }}>
                      {a.status === 'pending' && (
                        <button className="btn btn-accent btn-sm" onClick={() => updateStatus(a.id, 'confirmed')}>Confirm</button>
                      )}
                      {a.status === 'confirmed' && (
                        <button className="btn btn-primary btn-sm" onClick={() => updateStatus(a.id, 'completed')}>Complete</button>
                      )}
                      {a.status !== 'cancelled' && a.status !== 'completed' && (
                        <button className="btn btn-outline btn-sm" onClick={() => updateStatus(a.id, 'cancelled')}>Cancel</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} className={page === p ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
          </div>
        )}
      </div>
    </div>
  )
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
