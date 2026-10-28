import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Dashboard } from '@/pages/Dashboard'
import { Classes } from '@/pages/Classes'
import { Students } from '@/pages/Students'
import { StudentDetail } from '@/pages/StudentDetail'
import { Earnings } from '@/pages/Earnings'
import { Settings } from '@/pages/Settings'
import { ReportsPage } from '@/pages/Reports'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'

function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <Routes>
      {!user ? (
        <>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      ) : (
        <>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/classes" element={<Classes />} />
            <Route path="/students" element={<Students />} />
            <Route path="/students/:id" element={<StudentDetail />} />
            <Route path="/earnings" element={<Earnings />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Route>
        </>
      )}
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
