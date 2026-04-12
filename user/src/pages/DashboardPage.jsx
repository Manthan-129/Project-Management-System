import React, { useContext, useEffect } from 'react'
import {Outlet } from 'react-router-dom'
import DashboardSidebar from '../components/DashboardComponents/DashboardSidebar.jsx'
import { AppContext } from '../context/AppContext.jsx'

const DashboardPage = () => {
  const { ensureAuthenticated } = useContext(AppContext);

  useEffect(() => {
    ensureAuthenticated({ showToast: false });
  }, [ensureAuthenticated]);

  return (
    <div className="flex min-h-screen bg-gray-50/80">
        <DashboardSidebar />

        {/* Main content */}
      <main className="min-w-0 flex-1 overflow-y-auto">
            <Outlet />
        </main>
    </div>
  )
}

export default DashboardPage