import { SlidersHorizontal } from 'lucide-react'
import { useContext, useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import Sidebar from '../components/SettingComponents/Sidebar'
import { AppContext } from '../context/AppContext.jsx'

const SettingPage = () => {
  const { ensureAuthenticated, user } = useContext(AppContext);

  useEffect(() => {
    ensureAuthenticated({ showToast: false });
  }, [ensureAuthenticated]);

  const isSidebarRight = user?.appearanceSettings?.sidebarPosition === 'right';

  return (
    <div className="dd-app-shell">
      <div className={`mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-5 px-4 py-4 lg:px-6 lg:py-6 ${isSidebarRight ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}>
        <Sidebar />

        <main className="min-w-0 flex-1">
          <div className="min-h-[calc(100vh-3rem)] rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-[0_4px_24px_rgba(15,23,42,0.03)] backdrop-blur-md md:p-6">
            <div className="mb-6 border-b border-slate-100 pb-5">
              <span className="dd-page-kicker"><SlidersHorizontal size={13} /> Workspace Settings</span>
              <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">Shape your workspace</h1>
              <p className="mt-1 text-sm text-slate-500">Tune account, privacy, security, and integrations from one place.</p>
            </div>

            <div className="overflow-y-auto">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default SettingPage