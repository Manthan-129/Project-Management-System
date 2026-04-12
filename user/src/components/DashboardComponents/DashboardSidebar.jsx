import React from 'react'
import { Bell, ChevronRight, FolderKanban, GitPullRequest, KanbanSquare, LayoutDashboard, LogOut, Settings, Sparkles, UserPlus, Users } from 'lucide-react'
import { useContext, useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { AppContext } from '../../context/AppContext.jsx'
import NotificationPopup from './NotificationPopup.jsx'

const DashboardSidebar = () => {

    const { user, logout, notifications, unreadNotificationsCount, fetchNotifications, markNotificationAsRead, markNotificationsAsRead } = useContext(AppContext);

    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const notificationRef = useRef(null);

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setIsNotificationOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    const handleToggleNotifications = async () => {
        if (!isNotificationOpen) await fetchNotifications();
        setIsNotificationOpen((prev) => !prev);
    }

    const handleNotificationItemClick = async (item) => {
        if (!item.isRead) await markNotificationAsRead(item._id);
    }

    const navItems = [
        { to: '/dashboard',              icon: LayoutDashboard, label: 'Dashboard',       end: true, accent: 'from-blue-500 to-indigo-500' },
        { to: '/dashboard/teams',        icon: FolderKanban,    label: 'My Teams',         accent: 'from-violet-500 to-purple-500' },
        { to: '/dashboard/friends',      icon: Users,           label: 'Friends',          accent: 'from-emerald-500 to-teal-500' },
        { to: '/dashboard/tasks-board',  icon: KanbanSquare,    label: 'All Tasks Board',  accent: 'from-cyan-500 to-blue-500' },
        { to: '/dashboard/pull-requests',icon: GitPullRequest,  label: 'Pull Requests',    accent: 'from-amber-500 to-orange-500' },
        { to: '/dashboard/invitations',  icon: UserPlus,        label: 'Invitations',      accent: 'from-pink-500 to-rose-500' },
    ];

    return (
        <aside className="w-64 h-screen flex flex-col bg-white border-r border-gray-100 shrink-0">

            {/* ── Logo ── */}
            <div className="px-4 py-5 border-b border-gray-100">
                <NavLink to='/' className="flex items-center gap-3 no-underline group">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm transition-transform duration-200 group-hover:scale-105">
                        <Sparkles size={20} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900 leading-none">
                            Dev<span className="text-blue-600">Dash</span>
                        </h1>
                        <p className="text-[10px] text-gray-400 font-medium mt-0.5">Project Management</p>
                    </div>
                </NavLink>
            </div>

            {/* ── Navigation Items ── */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2">
                    Main Menu
                </p>
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                                isActive
                                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-100'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                                    isActive
                                        ? `bg-gradient-to-br ${item.accent} shadow-sm`
                                        : 'bg-gray-100 group-hover:bg-gray-200'
                                }`}>
                                    <item.icon
                                        size={16}
                                        className={isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}
                                    />
                                </div>
                                <span className="flex-1">{item.label}</span>
                                {isActive && (
                                    <ChevronRight size={14} className="text-blue-400 animate-[fadeIn_.2s_ease_both]" />
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* ── Bottom / Preferences ── */}
            <div className="px-3 py-3 space-y-0.5 border-t border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2">
                    Preferences
                </p>
                <NavLink
                    to="/settings"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-all duration-200 group"
                >
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-all duration-200">
                        <Settings size={16} className="text-gray-500" />
                    </div>
                    Settings
                </NavLink>

                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all duration-200 cursor-pointer group"
                >
                    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-all duration-200">
                        <LogOut size={16} className="text-red-500" />
                    </div>
                    Logout
                </button>
            </div>

            {/* ── User Info ── */}
            {user && (
                <div className="border-t border-gray-100 px-4 py-4">
                    <div className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-3 border border-gray-100">
                        <img
                            src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=6366f1&color=fff`}
                            alt="avatar"
                            className="w-10 h-10 rounded-xl object-cover ring-2 ring-white shadow-sm shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                                {user.firstName} {user.lastName}
                            </p>
                            <p className="text-xs text-gray-500 truncate">@{user.username}</p>
                        </div>

                        {/* Notification bell */}
                        <div ref={notificationRef} className="relative shrink-0">
                            <button
                                onClick={handleToggleNotifications}
                                className="relative w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all duration-200"
                            >
                                <Bell size={15} />
                                {unreadNotificationsCount > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold px-1 leading-none shadow-sm animate-[fadeIn_.2s_ease_both]">
                                        {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                                    </span>
                                )}
                            </button>

                            {isNotificationOpen && (
                                <NotificationPopup
                                    notifications={notifications}
                                    unreadCount={unreadNotificationsCount}
                                    onItemClick={handleNotificationItemClick}
                                    onMarkAllAsRead={markNotificationsAsRead}
                                    onClose={() => setIsNotificationOpen(false)}
                                />
                            )}
                        </div>

                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-100 shrink-0"></div>
                    </div>
                </div>
            )}
        </aside>
    )
}

export default DashboardSidebar