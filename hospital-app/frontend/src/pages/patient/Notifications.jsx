import { useState, useEffect } from 'react'
import api from '../../api'
import Spinner from '../../components/Spinner'

export default function PatientNotifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/notifications').then(r => setNotifications(r.data)).finally(() => setLoading(false))
  }, [])

  async function markAll() {
    await api.put('/notifications/read-all')
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })))
  }

  const unread = notifications.filter(n => !n.is_read).length

  if (loading) return <Spinner />

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-sub">{unread} unread notification{unread !== 1 ? 's' : ''}</p>
        </div>
        {unread > 0 && (
          <button className="btn btn-outline" onClick={markAll}>Mark all as read</button>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔔</div>
            <h3>No notifications</h3>
            <p>You're all caught up!</p>
          </div>
        ) : (
          notifications.map(n => (
            <div key={n.id} className={`notif-item ${n.is_read ? '' : 'unread'}`}>
              <div className={`notif-dot ${n.is_read ? 'read' : ''}`} />
              <div style={{ flex: 1 }}>
                <div className="notif-msg">{n.message}</div>
                <div className="notif-time">{formatTime(n.created_at)}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function formatTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}
