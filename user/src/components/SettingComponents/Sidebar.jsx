import { Bell, Eye, LayoutDashboard, Link, LogOut, Palette, ShieldCheck, Sparkles, User, UserCog } from 'lucide-react'
import { useContext, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { AppContext } from '../../context/AppContext.jsx'

const sidebarGroups = [
    {
        label: 'ACCOUNT',
        items: [
            {name: 'Profile', path: '/settings', icon: User, end: true},
            {name: 'Account', path: '/settings/account', icon: UserCog},
            {name: 'Privacy', path: '/settings/privacy', icon: Eye},
        ],
    },
    {
        label: 'PREFERENCES',
        items: [
            {name: 'Appearance', path: '/settings/appearance', icon: Palette},
            {name: 'Notifications', path: '/settings/notification', icon: Bell},
        ],
    },
    {
        label: 'SECURITY',
        items: [
            {name: 'Security', path: '/settings/security', icon: ShieldCheck},
        ],
    },
    {
        label: 'INTEGRATIONS',
        items: [
            {name: 'Integrations', path: '/settings/integration', icon: Link},
        ],
    },
]

const Sidebar = () => {
    const { logout } = useContext(AppContext)
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true)
            await logout()
        } finally {
            setIsLoggingOut(false)
        }
    }

  return (
    <aside className="dd-aside-panel flex w-full flex-col gap-5 lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-[19rem] lg:shrink-0 lg:self-start">
        <div className="rounded-[1.5rem] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(49,94,141,0.12),rgba(255,255,255,0.95))] p-4 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
            <NavLink to="/" className="flex items-center gap-3 no-underline">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
                    <Sparkles size={20} className="text-[#315e8d]" />
                </div>
                <div>
                    <h1 className="text-base font-black tracking-tight text-slate-900">Dev<span className="text-[#315e8d]">Dash</span></h1>
                    <p className="text-xs font-medium text-slate-500">Settings workspace</p>
                </div>
            </NavLink>
        </div>

        <div className="px-1">
            <NavLink to="/dashboard" className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
                <LayoutDashboard size={18} className="text-slate-300" />
                <span>Go to Dashboard</span>
            </NavLink>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto pr-1">
            {sidebarGroups.map((group)=>(
                <div key={group.label} className="space-y-1">
                    <p className="px-3 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400 mb-2">{group.label}</p>

                    {group.items.map((item)=>{
                        const Icon= item.icon;
                        return (
                            <NavLink key={item.path} to={item.path} end={item.end}
                                className={({ isActive }) => `dd-nav-pill ${isActive ? 'dd-nav-pill-active' : 'dd-nav-pill-inactive'}`}>
                                {({ isActive }) => (
                                    <>
                                        <div className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${isActive ? 'border-white/60 bg-white shadow-sm' : 'border-slate-200 bg-slate-100/90'}`}>
                                            <Icon size={16} className={isActive ? 'text-[#315e8d]' : 'text-slate-400'} />
                                        </div>
                                        <span className="flex-1">{item.name}</span>
                                    </>
                                )}
                            </NavLink>
                        )
                    })}
                </div>
            ))}
        </nav>

        <div className="border-t border-slate-200/80 pt-4">
            <button onClick={handleLogout} disabled={isLoggingOut}
                className="dd-ghost-button w-full justify-start border-rose-100 text-rose-600 hover:border-rose-200 hover:bg-rose-50">
                <LogOut size={16} />
                <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
            </button>
        </div>

    </aside>
  )
}

export default Sidebar