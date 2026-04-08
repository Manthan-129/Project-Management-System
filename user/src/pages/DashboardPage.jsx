import React from 'react'
import {Outlet } from 'react-router-dom'
import DashboardSidebar from '../components/DashboardComponents/DashboardSidebar.jsx'

const DashboardPage = () => {
  return (
    <div className="flex h-screen bg-gray-50/80">
        <DashboardSidebar />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
            <Outlet />
        </main>
    </div>
  )
}

export default DashboardPage