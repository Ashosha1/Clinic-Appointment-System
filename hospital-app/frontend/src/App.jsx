import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import Spinner from './components/Spinner'

// Auth pages
import Login from './pages/Login'
import Register from './pages/Register'

// Patient pages
import PatientDashboard from './pages/patient/Dashboard'
import PatientBook from './pages/patient/Book'
import PatientAppointments from './pages/patient/Appointments'
import PatientNotifications from './pages/patient/Notifications'
import PatientProfile from './pages/patient/Profile'

// Doctor pages
import DoctorDashboard from './pages/doctor/Dashboard'
import DoctorSchedule from './pages/doctor/Schedule'
import DoctorAppointments from './pages/doctor/Appointments'
import DoctorPatients from './pages/doctor/Patients'
import DoctorProfile from './pages/doctor/Profile'

// Admin pages
import AdminOverview from './pages/admin/Overview'
import AdminDoctors from './pages/admin/Doctors'
import AdminPatients from './pages/admin/Patients'
import AdminAppointments from './pages/admin/Appointments'
import AdminAnalytics from './pages/admin/Analytics'
import AdminSettings from './pages/admin/Settings'

function DashboardLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  )
}

function RequireAuth({ children, role }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to={`/${user.role}`} replace />
  return children
}

function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={`/${user.role}`} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Patient */}
          <Route path="/patient" element={<RequireAuth role="patient"><DashboardLayout><PatientDashboard /></DashboardLayout></RequireAuth>} />
          <Route path="/patient/book" element={<RequireAuth role="patient"><DashboardLayout><PatientBook /></DashboardLayout></RequireAuth>} />
          <Route path="/patient/appointments" element={<RequireAuth role="patient"><DashboardLayout><PatientAppointments /></DashboardLayout></RequireAuth>} />
          <Route path="/patient/notifications" element={<RequireAuth role="patient"><DashboardLayout><PatientNotifications /></DashboardLayout></RequireAuth>} />
          <Route path="/patient/profile" element={<RequireAuth role="patient"><DashboardLayout><PatientProfile /></DashboardLayout></RequireAuth>} />

          {/* Doctor */}
          <Route path="/doctor" element={<RequireAuth role="doctor"><DashboardLayout><DoctorDashboard /></DashboardLayout></RequireAuth>} />
          <Route path="/doctor/schedule" element={<RequireAuth role="doctor"><DashboardLayout><DoctorSchedule /></DashboardLayout></RequireAuth>} />
          <Route path="/doctor/appointments" element={<RequireAuth role="doctor"><DashboardLayout><DoctorAppointments /></DashboardLayout></RequireAuth>} />
          <Route path="/doctor/patients" element={<RequireAuth role="doctor"><DashboardLayout><DoctorPatients /></DashboardLayout></RequireAuth>} />
          <Route path="/doctor/profile" element={<RequireAuth role="doctor"><DashboardLayout><DoctorProfile /></DashboardLayout></RequireAuth>} />

          {/* Admin */}
          <Route path="/admin" element={<RequireAuth role="admin"><DashboardLayout><AdminOverview /></DashboardLayout></RequireAuth>} />
          <Route path="/admin/doctors" element={<RequireAuth role="admin"><DashboardLayout><AdminDoctors /></DashboardLayout></RequireAuth>} />
          <Route path="/admin/patients" element={<RequireAuth role="admin"><DashboardLayout><AdminPatients /></DashboardLayout></RequireAuth>} />
          <Route path="/admin/appointments" element={<RequireAuth role="admin"><DashboardLayout><AdminAppointments /></DashboardLayout></RequireAuth>} />
          <Route path="/admin/analytics" element={<RequireAuth role="admin"><DashboardLayout><AdminAnalytics /></DashboardLayout></RequireAuth>} />
          <Route path="/admin/settings" element={<RequireAuth role="admin"><DashboardLayout><AdminSettings /></DashboardLayout></RequireAuth>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
