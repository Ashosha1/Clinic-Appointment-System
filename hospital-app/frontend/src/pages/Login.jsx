import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', form)
      login(data.token, data.user)
      navigate(`/${data.user.role}`)
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  function fillDemo(email, password) {
    setForm({ email, password })
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-icon" style={{ margin: '0 auto 12px', width: 48, height: 48, fontSize: 24 }}>M</div>
          <h1>MediCare Hospital</h1>
          <p>Hospital Appointment System</p>
        </div>

        <h2 className="auth-title">Welcome back</h2>
        <p className="auth-sub">Sign in to your account</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input
              className="form-input"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
          </div>
          <button className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Register as patient</Link>
        </div>

        <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Demo accounts</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { label: 'Admin', email: 'admin@hospital.com', pw: 'admin123' },
              { label: 'Dr. Mitchell', email: 'sarah.mitchell@hospital.com', pw: 'doctor123' },
              { label: 'Patient 1', email: 'patient1@test.com', pw: 'test123' },
            ].map(d => (
              <button
                key={d.email}
                className="btn btn-outline btn-sm"
                type="button"
                onClick={() => fillDemo(d.email, d.pw)}
                style={{ justifyContent: 'flex-start' }}
              >
                <span style={{ fontWeight: 600, color: 'var(--primary)', minWidth: 80 }}>{d.label}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{d.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
