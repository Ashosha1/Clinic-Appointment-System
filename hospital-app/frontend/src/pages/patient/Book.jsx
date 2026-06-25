import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api'
import Calendar from '../../components/Calendar'
import Spinner from '../../components/Spinner'

const SPECIALTIES = [
  { name: 'Cardiology', icon: '❤️' },
  { name: 'Dermatology', icon: '🧴' },
  { name: 'Pediatrics', icon: '👶' },
  { name: 'Neurology', icon: '🧠' },
  { name: 'Orthopedics', icon: '🦴' },
  { name: 'General', icon: '🩺' },
]

const STEPS = ['Specialty', 'Doctor', 'Date', 'Time', 'Confirm']

export default function PatientBook() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [specialty, setSpecialty] = useState('')
  const [doctors, setDoctors] = useState([])
  const [doctor, setDoctor] = useState(null)
  const [date, setDate] = useState('')
  const [slots, setSlots] = useState([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [availableDays, setAvailableDays] = useState([1,2,3,4,5])
  const [timeSlot, setTimeSlot] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [booked, setBooked] = useState(null)

  useEffect(() => {
    if (specialty) {
      api.get(`/doctors?specialty=${specialty}`).then(r => setDoctors(r.data))
    }
  }, [specialty])

  useEffect(() => {
    if (doctor && date) {
      setSlotsLoading(true)
      api.get(`/appointments/slots/${doctor.id}/${date}`)
        .then(r => setSlots(r.data.slots || []))
        .finally(() => setSlotsLoading(false))
    }
  }, [doctor, date])

  async function handleBook() {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/appointments', {
        doctor_id: doctor.id, date, time_slot: timeSlot, reason
      })
      setBooked(data)
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed')
    } finally {
      setLoading(false)
    }
  }

  if (booked) {
    return (
      <div className="card" style={{ maxWidth: 480, margin: '0 auto' }}>
        <div className="success-screen">
          <div className="success-icon">✓</div>
          <h2>Appointment Requested!</h2>
          <p>Your appointment has been submitted for confirmation.</p>
          <div className="booking-id">#{String(booked.id).padStart(6, '0')}</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            {booked.doctor_name} · {formatDate(booked.date)} at {booked.time_slot}
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 24 }}>
            <button className="btn btn-outline" onClick={() => { setBooked(null); setStep(0); setSpecialty(''); setDoctor(null); setDate(''); setTimeSlot(''); setReason('') }}>
              Book Another
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/patient/appointments')}>
              My Appointments
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Book Appointment</h1>
          <p className="page-sub">Schedule a visit with one of our specialists</p>
        </div>
      </div>

      {/* Steps */}
      <div className="booking-steps" style={{ marginBottom: 32 }}>
        {STEPS.map((s, i) => (
          <div key={s} className="step-item" style={{ flex: 'none', gap: 6 }}>
            <div className={`step-circle ${i < step ? 'done' : i === step ? 'active' : ''}`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`step-label ${i === step ? 'active' : ''}`} style={{ display: window.innerWidth > 480 ? 'block' : 'none' }}>{s}</span>
            {i < STEPS.length - 1 && <div className={`step-connector ${i < step ? 'done' : ''}`} style={{ flex: 1, minWidth: 20 }} />}
          </div>
        ))}
      </div>

      {/* Step 0: Specialty */}
      {step === 0 && (
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Select a Specialty</h2>
          <div className="specialty-grid">
            {SPECIALTIES.map(s => (
              <div
                key={s.name}
                className={`specialty-card ${specialty === s.name ? 'selected' : ''}`}
                onClick={() => setSpecialty(s.name)}
              >
                <div className="spec-icon">{s.icon}</div>
                <div className="spec-name">{s.name}</div>
              </div>
            ))}
          </div>
          <button className="btn btn-primary" disabled={!specialty} onClick={() => setStep(1)}>
            Continue →
          </button>
        </div>
      )}

      {/* Step 1: Doctor */}
      {step === 1 && (
        <div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
            <button className="btn btn-outline btn-sm" onClick={() => setStep(0)}>← Back</button>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Select a Doctor</h2>
          </div>
          {doctors.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🩺</div>
              <h3>No doctors available</h3>
              <p>No doctors found for {specialty}</p>
            </div>
          ) : (
            doctors.map(d => (
              <div
                key={d.id}
                className={`doctor-card ${doctor?.id === d.id ? 'selected' : ''}`}
                onClick={() => { setDoctor(d); setAvailableDays(d.available_days?.split(',').map(Number) || [1,2,3,4,5]) }}
              >
                <div className="doctor-card-avatar">{d.name?.charAt(4) || 'D'}</div>
                <div>
                  <div className="doctor-card-name">{d.name}</div>
                  <div className="doctor-card-spec">{d.specialty}</div>
                  <div className="doctor-card-bio">{d.bio}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                    Hours: {d.available_hours_start} – {d.available_hours_end}
                  </div>
                </div>
              </div>
            ))
          )}
          <button className="btn btn-primary" disabled={!doctor} onClick={() => setStep(2)}>
            Continue →
          </button>
        </div>
      )}

      {/* Step 2: Date */}
      {step === 2 && (
        <div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
            <button className="btn btn-outline btn-sm" onClick={() => setStep(1)}>← Back</button>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Select a Date</h2>
          </div>
          <div style={{ maxWidth: 340 }}>
            <Calendar selected={date} onSelect={d => { setDate(d); setTimeSlot('') }} availableDays={availableDays} />
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 10 }}>
            Available days: {availableDays.map(d => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ')}
          </p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} disabled={!date} onClick={() => setStep(3)}>
            Continue →
          </button>
        </div>
      )}

      {/* Step 3: Time */}
      {step === 3 && (
        <div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
            <button className="btn btn-outline btn-sm" onClick={() => setStep(2)}>← Back</button>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Select a Time Slot</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 12 }}>
            {formatDate(date)} with {doctor?.name}
          </p>
          {slotsLoading ? <Spinner /> : (
            <>
              {slots.length === 0 ? (
                <div className="alert alert-info">No slots available for this date. Try another day.</div>
              ) : (
                <div className="time-slot-grid">
                  {slots.map(s => (
                    <button
                      key={s.time}
                      className={`time-slot ${!s.available ? 'taken' : ''} ${timeSlot === s.time ? 'selected' : ''}`}
                      disabled={!s.available}
                      onClick={() => s.available && setTimeSlot(s.time)}
                    >
                      {s.time}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
          <button className="btn btn-primary" style={{ marginTop: 16 }} disabled={!timeSlot} onClick={() => setStep(4)}>
            Continue →
          </button>
        </div>
      )}

      {/* Step 4: Confirm */}
      {step === 4 && (
        <div style={{ maxWidth: 480 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
            <button className="btn btn-outline btn-sm" onClick={() => setStep(3)}>← Back</button>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Confirm Appointment</h2>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { label: 'Doctor', value: doctor?.name },
                { label: 'Specialty', value: doctor?.specialty },
                { label: 'Date', value: formatDate(date) },
                { label: 'Time', value: timeSlot },
              ].map(item => (
                <div key={item.label}>
                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Reason for visit</label>
            <textarea
              className="form-textarea"
              placeholder="Describe your symptoms or reason for the visit…"
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
            />
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={handleBook} disabled={loading}>
            {loading ? 'Booking…' : 'Confirm Booking'}
          </button>
        </div>
      )}
    </div>
  )
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}
