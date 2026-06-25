import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'
import Spinner from '../../components/Spinner'

const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function DoctorProfile() {
  const { user } = useAuth()
  const [form, setForm] = useState({ bio: '', specialty: '', available_days: '1,2,3,4,5', available_hours_start: '09:00', available_hours_end: '17:00' })
  const [availDays, setAvailDays] = useState([1,2,3,4,5])
  const [pwForm, setPwForm] = useState({ password: '', new_password: '', confirm: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingPw, setSavingPw] = useState(false)
  const [msg, setMsg] = useState('')
  const [pwMsg, setPwMsg] = useState('')

  useEffect(() => {
    api.get(`/doctors/${user.doctorId}`).then(r => {
      const d = r.data
      setForm({ bio: d.bio || '', specialty: d.specialty || '', available_hours_start: d.available_hours_start || '09:00', available_hours_end: d.available_hours_end || '17:00' })
      setAvailDays(d.available_days?.split(',').map(Number) || [1,2,3,4,5])
    }).finally(() => setLoading(false))
  }, [user.doctorId])

  function toggleDay(d) {
    setAvailDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  }

  async function saveProfile(e) {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    try {
      await api.put(`/doctors/${user.doctorId}`, {
        ...form,
        available_days: availDays.sort().join(','),
      })
      setMsg('Profile updated successfully')
    } catch {
      setMsg('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  async function savePassword(e) {
    e.preventDefault()
    if (pwForm.new_password !== pwForm.confirm) return setPwMsg('Passwords do not match')
    setSavingPw(true)
    setPwMsg('')
    try {
      await api.put(`/users/${user.id}`, { password: pwForm.password, new_password: pwForm.new_password })
      setPwMsg('Password updated successfully')
      setPwForm({ password: '', new_password: '', confirm: '' })
    } catch (err) {
      setPwMsg(err.response?.data?.error || 'Failed to update password')
    } finally {
      setSavingPw(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <div style={{ maxWidth: 640 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Profile</h1>
          <p className="page-sub">Manage your professional information</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Professional Information</h3>
        {msg && <div className={`alert ${msg.includes('success') ? 'alert-success' : 'alert-error'}`}>{msg}</div>}
        <form onSubmit={saveProfile}>
          <div className="form-group">
            <label className="form-label">Specialty</label>
            <input className="form-input" value={form.specialty} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Bio</label>
            <textarea className="form-textarea" rows={4} value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Describe your experience and expertise…" />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ marginBottom: 10 }}>Available Days</label>
            <div className="checkbox-grid">
              {[0,1,2,3,4,5,6].map(d => (
                <label key={d} className="checkbox-item">
                  <input type="checkbox" checked={availDays.includes(d)} onChange={() => toggleDay(d)} />
                  {SHORT_DAYS[d]}
                </label>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Hours Start</label>
              <input type="time" className="form-input" value={form.available_hours_start} onChange={e => setForm(f => ({ ...f, available_hours_start: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Hours End</label>
              <input type="time" className="form-input" value={form.available_hours_end} onChange={e => setForm(f => ({ ...f, available_hours_end: e.target.value }))} />
            </div>
          </div>

          <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Change Password</h3>
        {pwMsg && <div className={`alert ${pwMsg.includes('success') ? 'alert-success' : 'alert-error'}`}>{pwMsg}</div>}
        <form onSubmit={savePassword}>
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input className="form-input" type="password" value={pwForm.password} onChange={e => setPwForm(f => ({ ...f, password: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input className="form-input" type="password" value={pwForm.new_password} onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))} required minLength={6} />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input className="form-input" type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={savingPw}>{savingPw ? 'Updating…' : 'Update Password'}</button>
        </form>
      </div>
    </div>
  )
}
