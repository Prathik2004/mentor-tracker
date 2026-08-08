import { Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Dashboard } from '@/pages/Dashboard'
import { Classes } from '@/pages/Classes'
import { Students } from '@/pages/Students'
import { StudentDetail } from '@/pages/StudentDetail'
import { Earnings } from '@/pages/Earnings'
import { Settings } from '@/pages/Settings'
import { ReportsPage } from '@/pages/Reports'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/classes" element={<Classes />} />
        <Route path="/students" element={<Students />} />
        <Route path="/students/:id" element={<StudentDetail />} />
        <Route path="/earnings" element={<Earnings />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/reports" element={<ReportsPage />} />
      </Route>
    </Routes>
  )
}
