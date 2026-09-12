import { useContext, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import DashboardSidebar from '../components/DashboardComponents/DashboardSidebar.jsx'
import { AppContext } from '../context/AppContext.jsx'

const DashboardPage = () => {
  const { ensureAuthenticated, user } = useContext(AppContext);

  useEffect(() => {
    ensureAuthenticated({ showToast: false });
  }, [ensureAuthenticated]);

  const isSidebarRight = user?.appearanceSettings?.sidebarPosition === 'right';

  return (
    <div className="dd-app-shell">
      <div className={`mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-5 px-4 py-4 lg:px-6 lg:py-6 ${isSidebarRight ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}>
        <DashboardSidebar />

        <main className="min-w-0 flex-1">
          <div className="min-h-[calc(100vh-3rem)] rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-[0_4px_24px_rgba(15,23,42,0.03)] backdrop-blur-md md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardPage