import { ArrowLeft, Bell, Eye, Link, Lock, LogOut, Palette, ShieldCheck, Sparkles, User, UserCog } from 'lucide-react'
import React, { useContext, useState } from 'react'
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
    <aside className="flex h-full w-72 flex-col border-r border-white/70 bg-white/85 px-4 py-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl space-y-6">

        {/* ── Logo / Header ── */}
        <div className="px-2">
            <NavLink to="/" className="flex items-center gap-2.5 no-underline">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#315e8d] to-[#26486d] shadow-lg shadow-blue-950/10">
                    <Sparkles size={20} className="text-white" />
                </div>
                <div>
                    <h1 className="text-base font-black tracking-tight text-slate-800 leading-tight">Dev<span className="text-[#315e8d]">Dash</span></h1>
                    <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">Settings</p>
                </div>
            </NavLink>
        </div>

        {/* ── Back to Dashboard ── */}
        <div className="px-2">
            <NavLink to="/dashboard"
                className="flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors no-underline hover:text-indigo-500">
                <ArrowLeft size={16} />
                <span>Back to Dashboard</span>
            </NavLink>
        </div>

        {/* ── Grouped Navigation Menu ── */}
        <nav className="flex-1 space-y-5 overflow-y-auto pr-1">
            {sidebarGroups.map((group)=>(
                <div key={group.label} className="space-y-1">

                    {/* Group Label */}
                    <p className="px-3 text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-2">{group.label}</p>

                    {/* Menu Items */}
                    {group.items.map((item)=>{
                        const Icon= item.icon;
                        return (
                            <NavLink key={item.path} to={item.path} end={item.end}
                                className={({ isActive }) =>
                                    `flex items-center gap-2.5 rounded-2xl px-3 py-3 text-sm font-medium transition-all no-underline
                                    ${isActive
                                        ? 'border border-indigo-100 bg-gradient-to-r from-indigo-50 to-sky-50 text-indigo-700 shadow-sm'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                                    }`
                                }>
                                {({ isActive }) => (
                                    <>
                                        <Icon size={16} className={isActive ? 'text-indigo-500' : 'text-slate-400'} />
                                        <span className="flex-1">{item.name}</span>
                                        {isActive && <Lock size={14} className="text-indigo-400" />}
                                    </>
                                )}
                            </NavLink>
                        )
                    })}
                </div>
            ))}
        </nav>

        {/* ── Logout Button ── */}
        <div className="px-2 pt-2 border-t border-slate-200/80">
            <button onClick={handleLogout} disabled={isLoggingOut}
                className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-3 text-sm font-medium text-rose-500 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60">
                <LogOut size={16} />
                <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
            </button>
        </div>

    </aside>
  )
}

export default Sidebar