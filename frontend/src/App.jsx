import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore   from '@/store/useAuthStore'
import useThemeStore  from '@/store/useThemeStore'
import AppLayout      from '@/components/layout/AppLayout'
import Login          from '@/pages/Login'
import Dashboard      from '@/pages/Dashboard'
import Leads          from '@/pages/Leads'
import SiteVisits     from '@/pages/SiteVisits'
import Inventory      from '@/pages/Inventory'
import Bookings       from '@/pages/Bookings'
import Payments       from '@/pages/Payments'
import Customers      from '@/pages/Customers'
import Brokers        from '@/pages/Brokers'
import Tasks          from '@/pages/Tasks'
import Reports        from '@/pages/Reports'
import Settings       from '@/pages/Settings'

function RequireAuth({ children }) {
  const token = useAuthStore(s => s.token)
  if (!token) return <Navigate to="/login" replace />
  return children
}

function GuestOnly({ children }) {
  const token = useAuthStore(s => s.token)
  if (token) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const { init } = useThemeStore()
  useEffect(() => { init() }, [])

  return (
    <Routes>
      <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />

      <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route index            element={<Dashboard />} />
        <Route path="leads"     element={<Leads />} />
        <Route path="site-visits" element={<SiteVisits />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="bookings"  element={<Bookings />} />
        <Route path="payments"  element={<Payments />} />
        <Route path="customers" element={<Customers />} />
        <Route path="brokers"   element={<Brokers />} />
        <Route path="tasks"     element={<Tasks />} />
        <Route path="reports"   element={<Reports />} />
        <Route path="settings"  element={<Settings />} />
        <Route path="*"         element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
