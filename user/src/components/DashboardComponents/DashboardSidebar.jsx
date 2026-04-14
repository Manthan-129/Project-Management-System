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
    <aside className="dd-aside-panel relative z-30 flex w-full flex-col gap-5 lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-[19rem] lg:shrink-0 lg:self-start">
        <div className="rounded-[1.5rem] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(49,94,141,0.12),rgba(255,255,255,0.95))] p-4 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
            <NavLink to='/' className="flex items-center gap-3 no-underline">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
                    <Sparkles size={20} className="text-[#315e8d]" />
                </div>
                <div>
                    <h1 className="text-base font-black tracking-tight text-slate-900">Dev<span className="text-[#315e8d]">Dash</span></h1>
                    <p className="text-xs font-medium text-slate-500">Project management</p>
                </div>
            </NavLink>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto pr-1">
            <p className="px-3 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Main Menu</p>
            {navItems.map((item)=> (
                <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => `dd-nav-pill ${isActive ? 'dd-nav-pill-active' : 'dd-nav-pill-inactive'}`}
                >
                    {({ isActive }) => (
                        <>
                            <div className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all ${isActive ? 'border-white/60 bg-white shadow-sm' : 'border-slate-200 bg-slate-100/90'}`}>
                                <item.icon size={16} className={isActive ? 'text-[#315e8d]' : 'text-slate-500'} />
                            </div>
                            <span className="flex-1">{item.label}</span>
                            {isActive && <ChevronRight size={14} className="text-[#315e8d]" />}
                        </>
                    )}
                </NavLink>
            ))}

            <div className="pt-4 border-t border-slate-200/80 space-y-3">
                <p className="px-3 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Preferences</p>
                <NavLink
                    to="/settings"
                    className={({ isActive }) => `dd-nav-pill ${isActive ? 'dd-nav-pill-active' : 'dd-nav-pill-inactive'}`}
                >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-100/90 transition-all">
                        <Settings size={16} className="text-slate-500" />
                    </div>
                    Settings
                </NavLink>

                <button
                    onClick={logout}
                    className="dd-nav-pill dd-nav-pill-inactive w-full text-left text-rose-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 transition-all">
                        <LogOut size={16} className="text-rose-500" />
                    </div>
                    Logout
                </button>
            </div>
        </nav>

        {user && (
            <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/90 p-3 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
                <div className="space-y-3 rounded-[1.25rem] border border-slate-100 bg-slate-50/90 p-3">
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Current Team</p>
                        <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-1 text-[10px] font-semibold text-[#315e8d]">
                            Workspace
                        </span>
                    </div>

                    <div className="flex items-center gap-3 rounded-[1.25rem] border border-slate-100 bg-white p-3">
                        <img
                            src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=6366f1&color=fff`}
                            alt="avatar"
                            className="h-11 w-11 rounded-2xl object-cover ring-2 ring-white shadow-sm"
                        />
                        <div className="min-w-0 flex-1">
                            <NavLink to={`/dashboard/user/${user.username}`} title="View Public Profile" className="block truncate text-sm font-semibold text-slate-900 transition-colors hover:text-indigo-600">
                                {user.firstName} {user.lastName}
                            </NavLink>
                            <p className="truncate text-xs text-slate-500">@{user.username}</p>
                        </div>
                        <div className="relative" ref={notificationRef}>
                            <button onClick={handleToggleNotifications} className="relative rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900">
                                <Bell size={15} />
                                {unreadNotificationsCount > 0 && (
                                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#315e8d] px-1 text-[10px] font-semibold text-white shadow">
                                        {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                                    </span>
                                )}
                            </button>

                            {isNotificationOpen && (
                                <div className="absolute bottom-[calc(100%+0.75rem)] -right-2 z-[130] w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.16)] sm:-left-4 sm:right-auto sm:origin-bottom-left">
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
                        <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400 ring-4 ring-emerald-100"></div>
                    </div>
                </div>
            </div>
        )}
    </aside>
  )
}

export default DashboardSidebar