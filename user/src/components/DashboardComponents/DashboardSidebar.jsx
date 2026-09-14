import { Bell, ChevronRight, FolderKanban, GitPullRequest, KanbanSquare, LayoutDashboard, LogOut, Settings, Sparkles, UserPlus, Users } from 'lucide-react'
import { useContext, useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { AppContext } from '../../context/AppContext.jsx'
import NotificationPopup from './NotificationPopup.jsx'

const DashboardSidebar = () => {

    const {user, logout, notifications, unreadNotificationsCount, fetchNotifications, markNotificationAsRead, markNotificationsAsRead}= useContext(AppContext);

    const [isNotificationOpen, setIsNotificationOpen]= useState(false);
    const notificationRef= useRef();

    useEffect(()=> {
        const handleOutsideClick= (event)=> {
            if(!notificationRef.current.contains(event.target)){
                setIsNotificationOpen(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);

        return ()=> {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    },[]);

    const handleToggleNotifications= async ()=>{
        if(!isNotificationOpen){
            await fetchNotifications();
        }
        setIsNotificationOpen((prev) => !prev);
    }

    const handleNotificationItemClick= async (item) => {
        if(!item.isRead ){
            await markNotificationAsRead(item._id);
        }
    }

    const navItems= [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true, accent: 'from-blue-500 to-indigo-500' },
        { to: '/dashboard/teams', icon: FolderKanban, label: 'My Teams', accent: 'from-violet-500 to-purple-500' },
        { to: '/dashboard/friends', icon: Users, label: 'Friends', accent: 'from-emerald-500 to-teal-500' },
        { to: '/dashboard/tasks-board', icon: KanbanSquare, label: 'All Tasks Board', accent: 'from-cyan-500 to-blue-500' },
        { to: '/dashboard/pull-requests', icon: GitPullRequest, label: 'Pull Requests', accent: 'from-amber-500 to-orange-500' },
        { to: '/dashboard/invitations', icon: UserPlus, label: 'Invitations', accent: 'from-pink-500 to-rose-500' },
    ];

  return (
    <aside className="relative z-30 flex w-full flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white/80 p-3.5 shadow-[0_4px_24px_rgba(15,23,42,0.03)] backdrop-blur-md lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-[18.5rem] lg:shrink-0 lg:self-start">
        <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-3.5 shadow-sm">
            <NavLink to='/' className="flex items-center gap-3 no-underline">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 shadow-sm shadow-indigo-500/20 ring-1 ring-white/20">
                    <Sparkles size={18} className="text-white" />
                </div>
                <div>
                    <h1 className="text-base font-black tracking-tight text-white">Dev<span className="text-indigo-400">Dash</span></h1>
                    <p className="text-[11px] font-medium text-slate-400">Team Workspace</p>
                </div>
            </NavLink>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto pr-1 custom-scrollbar">
            <p className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Navigation</p>
            <div className="space-y-1">
                {navItems.map((item)=> (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all no-underline ${isActive ? 'bg-indigo-50/80 font-semibold text-indigo-700 shadow-xs ring-1 ring-indigo-100' : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'}`}
                    >
                        {({ isActive }) => (
                            <>
                                <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${isActive ? 'bg-white shadow-xs text-indigo-600' : 'bg-slate-100/80 text-slate-500'}`}>
                                    <item.icon size={15} />
                                </div>
                                <span className="flex-1">{item.label}</span>
                                {isActive && <ChevronRight size={14} className="text-indigo-500" />}
                            </>
                        )}
                    </NavLink>
                ))}
            </div>

            <div className="pt-3 border-t border-slate-200/70 space-y-1">
                <p className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Settings</p>
                <NavLink
                    to="/settings"
                    className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all no-underline ${isActive ? 'bg-indigo-50/80 font-semibold text-indigo-700 shadow-xs ring-1 ring-indigo-100' : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'}`}
                >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100/80 text-slate-500">
                        <Settings size={15} />
                    </div>
                    <span>Settings</span>
                </NavLink>

                <button
                    onClick={logout}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 transition-all hover:bg-rose-50/70 hover:text-rose-700"
                >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
                        <LogOut size={15} />
                    </div>
                    <span>Logout</span>
                </button>
            </div>
        </nav>

        {user && (
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-2.5">
                <div className="flex items-center gap-2.5 rounded-lg border border-slate-800/60 bg-slate-950/60 p-2.5 shadow-xs">
                    <div className="relative">
                        <img
                            src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=6366f1&color=fff`}
                            alt="avatar"
                            className="h-9 w-9 rounded-xl object-cover ring-1 ring-slate-750 shadow-xs"
                        />
                        <span className="online-status-dot absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full"></span>
                    </div>
                    <div className="min-w-0 flex-1">
                        <NavLink to={`/dashboard/user/${user.username}`} title="View Public Profile" className="block truncate text-xs font-bold text-slate-200 transition-colors hover:text-indigo-400">
                            {user.firstName} {user.lastName}
                        </NavLink>
                        <p className="truncate text-[11px] text-slate-400">@{user.username}</p>
                    </div>
                    <div className="relative" ref={notificationRef}>
                        <button onClick={handleToggleNotifications} className="relative rounded-lg border border-slate-700 bg-slate-800/80 p-1.5 text-slate-300 shadow-xs transition hover:border-slate-600 hover:text-white">
                            <Bell size={14} />
                            {unreadNotificationsCount > 0 && (
                                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-500 px-1 text-[9px] font-bold text-white shadow">
                                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                                </span>
                            )}
                        </button>

                        {isNotificationOpen && (
                            <div className="absolute bottom-[calc(100%+0.75rem)] -right-2 z-[130] w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl sm:-left-4 sm:right-auto">
                                <NotificationPopup
                                    notifications={notifications}
                                    unreadCount={unreadNotificationsCount}
                                    onItemClick={handleNotificationItemClick}
                                    onMarkAllAsRead={markNotificationsAsRead}
                                    onClose={() => setIsNotificationOpen(false)}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
    </aside>
  )
}

export default DashboardSidebar