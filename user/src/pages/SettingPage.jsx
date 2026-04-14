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
          <div className="dd-shell-frame h-full p-4 md:p-6">
            <div className="dd-page-header mb-5">
              <div className="space-y-3">
                <span className="dd-page-kicker"><SlidersHorizontal size={13} /> Workspace Settings</span>
                <div>
                  <h1 className="dd-page-title">Shape your workspace</h1>
                  <p className="dd-page-subtitle">Tune account, privacy, security, and integrations from one place.</p>
                </div>
              </div>


            </div>

            <div className="dd-shell-surface min-h-[calc(100vh-13rem)] overflow-hidden">
              <div className="h-full overflow-y-auto p-1 md:p-0">
                <Outlet />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default SettingPage