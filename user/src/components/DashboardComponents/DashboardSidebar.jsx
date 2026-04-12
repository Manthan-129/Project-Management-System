import React from 'react'
import { Bell, ChevronRight, FolderKanban, GitPullRequest, KanbanSquare, LayoutDashboard, LogOut, Settings, Sparkles, UserPlus, Users } from 'lucide-react'
import { useContext, useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { AppContext } from '../../context/AppContext.jsx'
import NotificationPopup from './NotificationPopup.jsx'

const DashboardSidebar = () => {

    const {user, logout, notifications, unreadNotificationsCount, fetchNotifications, markNotificationAsRead, markNotificationsAsRead}= useContext(AppContext);

    const [isNotificationOpen, setIsNotificationOpen]= useState(false);
    const notificationRef= useRef(null);

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (
                notificationRef.current &&
                !notificationRef.current.contains(event.target)
            ) {
                setIsNotificationOpen(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, []);

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
    <aside className="flex h-full w-80 flex-col border-r border-white/70 bg-white/80 px-4 py-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <div className="px-2">
            <NavLink to='/' className="flex items-center gap-3 no-underline">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#315e8d] to-[#26486d] shadow-lg shadow-blue-950/10">
                    <Sparkles size={20} className="text-white" />
                </div>  
                <div>
                    <h1 className="text-lg font-black tracking-tight text-slate-900">Dev<span className="text-[#315e8d]">Dash</span></h1>
                    <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">Project Management</p>
                </div>
            </NavLink>
        </div>

        {/* Navigation Items */}
        <nav className="mt-8 space-y-2">
            <p className="px-2 text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400">Main Menu</p>
            {navItems.map((item, index)=> (
                <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                        `flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all group ${
                            isActive
                                ? 'border border-indigo-100 bg-gradient-to-r from-indigo-50 to-sky-50 text-indigo-700 shadow-sm'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                        }`
                    }
                >
                    {({ isActive }) => (
                        <>
                            <div className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${isActive ? `bg-gradient-to-br ${item.accent} shadow-lg shadow-blue-950/10` : 'bg-slate-100 group-hover:bg-slate-200'}`}>
                                <item.icon size={16} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'} />
                            </div>
                            <span className="flex-1">{item.label}</span>
                            {isActive && <ChevronRight size={14} className="text-indigo-400" />}
                        </>
                    )}
                </NavLink>
            ))}
        </nav>

        {/* Bottom Section */}
        <div className="mt-8 space-y-2 border-t border-slate-200/80 pt-6">
            <p className="px-2 text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400">Preferences</p>
            <NavLink
                to="/settings"
                className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-slate-500 transition-all group hover:bg-slate-50 hover:text-slate-800"
            >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 transition-all group-hover:bg-slate-200">
                    <Settings size={16} className="text-slate-500" />
                </div>
                Settings
            </NavLink>

            <button
                onClick={logout}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-rose-500 transition-all cursor-pointer hover:bg-rose-50 group"
            >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 transition-all group-hover:bg-rose-100">
                    <LogOut size={16} className="text-rose-500" />
                </div>
                Logout
            </button>
        </div>

        {/* User info */}
        {user && (
            <div className="mt-6 border-t border-slate-200/80 px-2 pt-6">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
                    <img
                        src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=6366f1&color=fff`}
                        alt="avatar"
                        className="h-11 w-11 rounded-xl object-cover ring-4 ring-white shadow-sm"
                    />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">{user.firstName} {user.lastName}</p>
                        <p className="truncate text-xs text-slate-500">@{user.username}</p>
                    </div>
                    <div ref={notificationRef}>
                        <button onClick={handleToggleNotifications} className="relative rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800">
                            <Bell size={15} />
                            {unreadNotificationsCount > 0 && (
                                <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-indigo-500 px-1 text-[10px] font-bold leading-4 text-white shadow-sm">
                                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                                </span>
                            )}
                        </button>

                        {isNotificationOpen && (
                            <NotificationPopup 
                            notifications= {notifications}
                            unreadCount= {unreadNotificationsCount}
                            onItemClick= {handleNotificationItemClick}
                            onMarkAllAsRead= {markNotificationsAsRead}
                            onClose= {()=> setIsNotificationOpen(false)}
                            />
                        )}
                    </div>
                    <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400 ring-4 ring-emerald-100"></div>
                </div>
            </div>
        )}
    </aside>
  )
}

export default DashboardSidebar