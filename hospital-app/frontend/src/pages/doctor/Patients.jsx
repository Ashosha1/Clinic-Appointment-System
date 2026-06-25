import { useState, useEffect } from 'react'
import api from '../../api'
import Badge from '../../components/Badge'
import Spinner from '../../components/Spinner'

export default function DoctorPatients() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    api.get('/appointments').then(r => setAppointments(r.data)).finally(() => setLoading(false))
  }, [])

  // Build unique patient list
  const patientMap = {}
  for (const a of appointments) {
    if (!patientMap[a.patient_id]) {
      patientMap[a.patient_id] = { id: a.patient_id, name: a.patient_name, email: a.patient_email, appointments: [] }
    }
    patientMap[a.patient_id].appointments.push(a)
  }
  const patients = Object.values(patientMap).filter(p =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase())
  )

  const selectedPatient = selected ? patientMap[selected] : null

  if (loading) return <Spinner />

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Patients</h1>
          <p className="page-sub">{patients.length} patient{patients.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 20 }}>
        <div className="card">
          <div className="filter-bar" style={{ marginBottom: 16 }}>
            <input
              className="form-input"
              placeholder="Search patients…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1 }}
            />
          </div>

          {patients.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <h3>No patients found</h3>
              <p>Patients who book with you will appear here</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Appointments</th>
                    <th>Last Visit</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map(p => {
                    const sorted = [...p.appointments].sort((a, b) => b.date.localeCompare(a.date))
                    return (
                      <tr key={p.id} style={{ cursor: 'pointer', background: selected === p.id ? '#EBF4F8' : '' }} onClick={() => setSelected(p.id === selected ? null : p.id)}>
                        <td style={{ fontWeight: 600 }}>{p.name}</td>
                        <td style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{p.email}</td>
                        <td>{p.appointments.length}</td>
                        <td>{sorted[0] ? formatDate(sorted[0].date) : '—'}</td>
                        <td><button className="btn btn-ghost btn-sm">View →</button></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedPatient && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>{selectedPatient.name}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{selectedPatient.email}</p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>✕</button>
            </div>

            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>
              Appointment History ({selectedPatient.appointments.length})
            </div>

            {[...selectedPatient.appointments]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map(a => (
                <div key={a.id} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>{formatDate(a.date)} at {a.time_slot}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{a.reason || 'No reason specified'}</div>
                    {a.notes && <div style={{ fontSize: 12, color: 'var(--primary)', marginTop: 2 }}>Note: {a.notes}</div>}
                  </div>
                  <Badge status={a.status} />
                </div>
              ))
            }
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
