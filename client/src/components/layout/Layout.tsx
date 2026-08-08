import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { Sidebar } from './Sidebar'
import { FAB } from './FAB'
import { ClassFormDialog } from '@/components/classes/ClassFormDialog'
import { AddStudentDialog } from '@/components/students/AddStudentDialog'
import { AddIncentiveDialog } from '@/components/earnings/AddIncentiveDialog'

export function Layout() {
  const [fabOpen, setFabOpen] = useState(false)
  const [addClassOpen, setAddClassOpen] = useState(false)
  const [addStudentOpen, setAddStudentOpen] = useState(false)
  const [addIncentiveOpen, setAddIncentiveOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <Sidebar
        onAddClass={() => setAddClassOpen(true)}
        onAddStudent={() => setAddStudentOpen(true)}
        onAddIncentive={() => setAddIncentiveOpen(true)}
      />

      {/* Main content */}
      <main className="lg:ml-64 pb-20 lg:pb-6">
        <div className="max-w-5xl mx-auto px-4 py-4 lg:px-6 lg:py-6">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <BottomNav />

      {/* FAB */}
      <FAB
        open={fabOpen}
        onOpenChange={setFabOpen}
        onAddClass={() => { setFabOpen(false); setAddClassOpen(true) }}
        onAddStudent={() => { setFabOpen(false); setAddStudentOpen(true) }}
        onAddIncentive={() => { setFabOpen(false); setAddIncentiveOpen(true) }}
      />

      {/* Dialogs */}
      <ClassFormDialog open={addClassOpen} onOpenChange={setAddClassOpen} />
      <AddStudentDialog open={addStudentOpen} onOpenChange={setAddStudentOpen} />
      <AddIncentiveDialog open={addIncentiveOpen} onOpenChange={setAddIncentiveOpen} />
    </div>
  )
}
