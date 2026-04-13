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
        <aside className="sticky top-0 shrink-0 flex h-screen w-72 flex-col space-y-6 border-r border-blue-100 bg-white/90 px-4 py-6 backdrop-blur-xl shadow-[10px_0_40px_-28px_rgba(37,99,235,0.28)]">

        {/* ── Logo / Header ── */}
        <div className="px-2">
            <NavLink to="/" className="flex items-center gap-2.5 no-underline">
                <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-2">
                    <Sparkles size={19} className="text-blue-600" />
                </div>
                <div>
                    <h1 className="text-base font-bold leading-tight text-slate-800">Dev<span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">Dash</span></h1>
                    <p className="text-xs text-slate-400">Settings Panel</p>
                </div>
            </NavLink>
        </div>

        {/* ── Back to Dashboard ── */}
        <div className="px-2">
            <NavLink to="/dashboard"
                className="group flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm font-semibold text-blue-700 transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-100 hover:shadow-sm no-underline">
                <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
                <span>Back to Dashboard</span>
            </NavLink>
        </div>

        {/* ── Grouped Navigation Menu ── */}
        <nav className="flex-1 space-y-5 overflow-y-auto pr-1">
            {sidebarGroups.map((group)=>(
                <div key={group.label} className="space-y-1">

                    {/* Group Label */}
                    <p className="mb-2 px-3 text-[11px] font-semibold tracking-[0.18em] text-slate-400">{group.label}</p>

                    {/* Menu Items */}
                    {group.items.map((item)=>{
                        const Icon= item.icon;
                        return (
                            <NavLink key={item.path} to={item.path} end={item.end}
                                className={({ isActive }) =>
                                    `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all no-underline
                                    ${isActive
                                        ? 'border border-blue-200 bg-gradient-to-r from-blue-50 to-teal-50 text-blue-700 shadow-[0_8px_20px_-16px_rgba(37,99,235,0.7)]'
                                        : 'border border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-800'
                                    }`
                                }>
                                {({ isActive }) => (
                                    <>
                                        <Icon size={16} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                                        <span className="flex-1">{item.name}</span>
                                        {isActive && <Lock size={14} className="text-blue-400" />}
                                    </>
                                )}
                            </NavLink>
                        )
                    })}
                </div>
            ))}
        </nav>

        {/* ── Logout Button ── */}
        <div className="border-t border-slate-100 px-2 pt-3">
            <button onClick={handleLogout} disabled={isLoggingOut}
                className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-500 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60">
                <LogOut size={16} />
                <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
            </button>
        </div>

    </aside>
  )
}

export default Sidebar