import React, { useContext, useEffect } from 'react'
import {Outlet} from 'react-router-dom'
import Sidebar from '../components/SettingComponents/Sidebar'
import { AppContext } from '../context/AppContext.jsx'

const SettingPage = () => {
  const { ensureAuthenticated } = useContext(AppContext);

  useEffect(() => {
    ensureAuthenticated({ showToast: false });
  }, [ensureAuthenticated]);

  return (
    <div className="flex min-h-screen bg-slate-50 overflow-hidden">

        {/* Sidebar navigation */}
        <Sidebar />

        {/* Main content area — renders the active settings page */}
      <main className="min-w-0 flex-1 overflow-y-auto">
            <Outlet />
        </main>

    </div>
  )
}

export default SettingPage