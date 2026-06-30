import { Navigate, Route, Routes } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Tasks from './pages/Tasks'
import WorkList from './pages/WorkList'
import Wishlist from './pages/Wishlist'
import Payments from './pages/Payments'
import Bank from './pages/Bank'
import Calendar from './pages/Calendar'
import Health from './pages/Health'
import Family from './pages/Family'
import Assistant from './pages/Assistant'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'

export default function App() {
  return (
    <div className="flex h-full" style={{ background: 'var(--color-bg)' }}>
      <Sidebar />
      <main className="flex-1 h-full overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-8">
          <Routes>
            <Route path="/" element={<Navigate to="/tasks" replace />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/work" element={<WorkList />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/bank" element={<Bank />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/health" element={<Health />} />
            <Route path="/family" element={<Family />} />
            <Route path="/assistant" element={<Assistant />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/tasks" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}
