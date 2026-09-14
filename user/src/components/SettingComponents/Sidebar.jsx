import { ArrowLeft, Bell, Eye, Link, Lock, LogOut, Palette, ShieldCheck, Sparkles, User, UserCog } from 'lucide-react'
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
        <aside className="sticky top-4 flex h-[calc(100vh-2rem)] w-72 shrink-0 flex-col rounded-2xl border border-[#1b3a5c] bg-[#0c1f38] p-4 shadow-[0_4px_24px_rgba(15,23,42,0.03)] backdrop-blur-md">

        {/* Brand Header */}
        <div className="mb-5 px-1">
            <NavLink to="/" className="flex items-center gap-3 no-underline">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 text-white shadow-sm shadow-indigo-600/20">
                    <Sparkles size={18} />
                </div>
                <div>
                    <h1 className="text-base font-black tracking-tight text-white">DevDash</h1>
                    <p className="text-[11px] font-medium text-slate-400">Settings Panel</p>
                </div>
            </NavLink>
        </div>

        {/* Back to Dashboard */}
        <div className="mb-4">
            <NavLink to="/dashboard"
                className="group flex w-full items-center justify-center gap-2 rounded-xl border border-[#1b3a5c] bg-[#0a1829] px-3.5 py-2 text-sm font-semibold text-slate-200 shadow-sm transition-all hover:border-slate-500 hover:bg-[#132d52] no-underline">
                <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-0.5 text-slate-400" />
                <span>Back to Dashboard</span>
            </NavLink>
        </div>

        {/* Grouped Navigation Menu */}
        <nav className="flex-1 space-y-5 overflow-y-auto pr-1 custom-scrollbar">
            {sidebarGroups.map((group)=>(
                <div key={group.label} className="space-y-1">
                    <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{group.label}</p>

                    {group.items.map((item)=>{
                        const Icon= item.icon;
                        return (
                            <NavLink key={item.path} to={item.path} end={item.end}
                                className={({ isActive }) =>
                                    `flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all no-underline
                                    ${isActive
                                        ? 'border border-[#1b3a5c] bg-[#132d52] text-sky-300 font-semibold shadow-xs'
                                        : 'border border-transparent text-slate-300 hover:border-[#1b3a5c] hover:bg-[#0a1829] hover:text-white'
                                    }`
                                }>
                                {({ isActive }) => (
                                    <>
                                        <Icon size={16} className={isActive ? 'text-sky-400' : 'text-slate-400'} />
                                        <span className="flex-1">{item.name}</span>
                                        {isActive && <Lock size={13} className="text-sky-400" />}
                                    </>
                                )}
                            </NavLink>
                        )
                    })}
                </div>
            ))}
        </nav>

        {/* Logout Button */}
        <div className="mt-4 border-t border-[#1b3a5c] pt-3">
            <button onClick={handleLogout} disabled={isLoggingOut}
                className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-rose-400 transition-colors hover:bg-rose-950/30 disabled:cursor-not-allowed disabled:opacity-50">
                <LogOut size={16} />
                <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
            </button>
        </div>

    </aside>
  )
}

export default Sidebar