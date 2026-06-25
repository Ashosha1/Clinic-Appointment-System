import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'
import Spinner from '../../components/Spinner'

export default function PatientProfile() {
  const { user, login, token } = useAuth()
  const [form, setForm] = useState({ name: '', phone: '', date_of_birth: '', blood_type: '', allergies: '' })
  const [pwForm, setPwForm] = useState({ password: '', new_password: '', confirm: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingPw, setSavingPw] = useState(false)
  const [msg, setMsg] = useState('')
  const [pwMsg, setPwMsg] = useState('')

  useEffect(() => {
    api.get(`/users/${user.id}`).then(r => {
      const u = r.data
      setForm({ name: u.name || '', phone: u.phone || '', date_of_birth: u.date_of_birth || '', blood_type: u.blood_type || '', allergies: u.allergies || '' })
    }).finally(() => setLoading(false))
  }, [user.id])

  async function saveProfile(e) {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    try {
      const { data } = await api.put(`/users/${user.id}`, form)
      login(token, { ...user, name: data.name })
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
          <p className="page-sub">Manage your personal information</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Personal Information</h3>
        {msg && <div className={`alert ${msg.includes('success') ? 'alert-success' : 'alert-error'}`}>{msg}</div>}
        <form onSubmit={saveProfile}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input className="form-input" type="date" value={form.date_of_birth} onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Blood Type</label>
              <select className="form-select" value={form.blood_type} onChange={e => setForm(f => ({ ...f, blood_type: e.target.value }))}>
                <option value="">Select</option>
                {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Allergies</label>
            <textarea className="form-textarea" rows={2} value={form.allergies} onChange={e => setForm(f => ({ ...f, allergies: e.target.value }))} placeholder="List any known allergies…" />
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
