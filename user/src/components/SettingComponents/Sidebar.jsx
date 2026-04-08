// import { ArrowLeft, Bell, Eye, Link, Lock, LogOut, Palette, ShieldCheck, Sparkles, User, UserCog } from 'lucide-react'
// import React from 'react'
// import { NavLink } from 'react-router-dom'

// const sidebarGroups = [
//     {
//         label: 'ACCOUNT',
//         items: [
//             {name: 'Profile', path: '/settings', icon: User, end: true},
//             {name: 'Account', path: '/settings/account', icon: UserCog},
//             {name: 'Privacy', path: '/settings/privacy', icon: Eye},
//         ],
//     },
//     {
//         label: 'PREFERENCES',
//         items: [
//             {name: 'Appearance', path: '/settings/appearance', icon: Palette},
//             {name: 'Notifications', path: '/settings/notification', icon: Bell},
//         ],
//     },
//     {
//         label: 'SECURITY',
//         items: [
//             {name: 'Security', path: '/settings/security',
//                 icon: ShieldCheck},
//         ],
//     },
//     {
//         label: 'INTEGRATIONS',
//         items: [
//             {name: 'Integrations', path: '/settings/integration', icon: Link},
//         ],
//     },
// ]

// const Sidebar = () => {
//   return (
//     <aside>
//         {/* ── Logo / Header ── */}
//         <div>
//             <NavLink to="/landing">
//                 <Sparkles size={20} />
//                 <div>
//                     <h1>Dev<span>Dash</span></h1>
//                     <p>Settings</p>
//                 </div>
//             </NavLink>
//         </div>

//         {/* ── Back to Dashboard ── */}
//         <div>
//             <NavLink to="/dashboard">
//                 <ArrowLeft size={16} />
//                 <span>Back to Dashboard</span>
//             </NavLink>
//         </div>

//         {/* ── Grouped Navigation Menu ── */}
//         <nav>
//             {sidebarGroups.map((group)=>(
//                 <div key={group.label}>

//                     {/* Group Label (ACCOUNT, PREFERENCES, etc.) */}
//                     <p>{group.label}</p>

//                     {/* Menu Items inside each group */}
//                     {group.items.map((item)=>{
//                         const Icon= item.icon;
//                         return (
//                             <NavLink key={item.path} to={item.path} end={item.end}>
//                                 {({ isActive }) => (
//                                     <>
//                                         <Icon size={16}></Icon>
//                                         <span>{item.name}</span>
//                                         {isActive && <Lock size={14} />}
//                                     </>
//                                 )}
//                             </NavLink>
//                         )
//                     })}
//                 </div>
//             ))}
//         </nav>

//         {/* ── Logout Button ── */}

//         <div>
//         <button>
//           <LogOut size={16} />
//           <span>Logout</span>
//         </button>
//       </div>

//     </aside>
//   )
// }

// export default Sidebar

import { ArrowLeft, Bell, Eye, Link, Lock, LogOut, Palette, ShieldCheck, Sparkles, User, UserCog } from 'lucide-react'
import React from 'react'
import { NavLink } from 'react-router-dom'

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
  return (
    <aside className="flex flex-col h-full w-64 bg-white border-r border-slate-200 px-4 py-6 space-y-6">

        {/* ── Logo / Header ── */}
        <div className="px-2">
            <NavLink to="/" className="flex items-center gap-2.5 no-underline">
                <div className="p-1.5 bg-indigo-50 rounded-lg">
                    <Sparkles size={20} className="text-indigo-500" />
                </div>
                <div>
                    <h1 className="text-base font-bold text-slate-800 leading-tight">Dev<span className="text-indigo-500">Dash</span></h1>
                    <p className="text-xs text-slate-400">Settings</p>
                </div>
            </NavLink>
        </div>

        {/* ── Back to Dashboard ── */}
        <div className="px-2">
            <NavLink to="/dashboard"
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-500 transition-colors no-underline">
                <ArrowLeft size={16} />
                <span>Back to Dashboard</span>
            </NavLink>
        </div>

        {/* ── Grouped Navigation Menu ── */}
        <nav className="flex-1 space-y-5 overflow-y-auto">
            {sidebarGroups.map((group)=>(
                <div key={group.label} className="space-y-1">

                    {/* Group Label */}
                    <p className="px-3 text-xs font-semibold text-slate-400 tracking-widest mb-2">{group.label}</p>

                    {/* Menu Items */}
                    {group.items.map((item)=>{
                        const Icon= item.icon;
                        return (
                            <NavLink key={item.path} to={item.path} end={item.end}
                                className={({ isActive }) =>
                                    `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors no-underline
                                    ${isActive
                                        ? 'bg-indigo-50 text-indigo-600'
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
        <div className="px-2 pt-2 border-t border-slate-100">
            <button className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
                <LogOut size={16} />
                <span>Logout</span>
            </button>
        </div>

    </aside>
  )
}

export default Sidebar