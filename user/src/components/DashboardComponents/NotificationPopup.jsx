import React from 'react'
import { Bell, CheckCheck, FolderPlus, Trash2, UserCheck, UserPlus, Users } from 'lucide-react';
import { useMemo } from 'react';

const iconByType= {
    'task-added' : FolderPlus,
    'task-removed' : Trash2,
    'task-assigned-to-me' : UserCheck,
    'team-invitation' : Users,
    'friend-request-received' : UserPlus,
};

const iconColorByType = {
    'task-added': 'text-blue-600 bg-blue-50',
    'task-removed': 'text-red-600 bg-red-50',
    'task-assigned-to-me': 'text-emerald-600 bg-emerald-50',
    'team-invitation': 'text-violet-600 bg-violet-50',
    'friend-request-received': 'text-pink-600 bg-pink-50',
};

const formatTimeAgo= (dateString) => {
    const date = new Date(dateString);
    const now= new Date();

    const diff= Math.floor((now - date) / 1000);

    if(diff < 60) return `${diff}s ago`;
    if(diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if(diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}


const NotificationPopup = ({notifications, unreadCount, onItemClick, onMarkAllAsRead, onClose}) => {
  
    const hasUnread= useMemo(()=> unreadCount > 0, [unreadCount]);

    return (
    <div className="absolute right-0 top-12 z-50 w-[22rem] overflow-hidden rounded-3xl border border-white/70 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] backdrop-blur-xl dd-fade-in">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
            <div>
                <p className="text-sm font-bold text-slate-900">Notifications</p>
                <p className="text-xs text-slate-500">All app activity updates</p>
            </div>
            {hasUnread && <span className="dd-badge border-indigo-100 bg-indigo-50 text-indigo-700">{unreadCount} unread</span>}
        </div>

        <div className="max-h-[24rem] overflow-y-auto">
            {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                        <Bell size={18} />
                    </div>
                    <p className="text-sm font-semibold text-slate-800">No notifications yet</p>
                    <p className="mt-1 text-xs text-slate-500">New team and task updates will appear here</p>
                </div>
            )
            :
            (
                notifications.map((item) => {
                    const Icon= iconByType[item.type] || Bell;
                    const iconColorClass = iconColorByType[item.type] || 'text-gray-600 bg-gray-100';

                    return (
                        <button key={item._id}
                        onClick={() => onItemClick(item)}
                        className={`w-full border-b border-slate-100 px-4 py-3 text-left transition-colors hover:bg-slate-50 cursor-pointer ${item.isRead ? 'opacity-75' : ''}`}>
                            
                            <div className="flex items-start gap-3">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${iconColorClass}`}>
                                    <Icon size={16} />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                        <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                                        {!item.isRead && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500"></span>}
                                    </div>
                                    <p className="mt-1 line-clamp-2 text-xs text-slate-600">{item.message}</p>
                                    <p className="mt-1 text-[11px] text-slate-400">{formatTimeAgo(item.createdAt)}</p>
                                </div>
                            </div>
                        </button>
                    )
                })
            )}
        </div>

        <div className="flex items-center gap-2 border-t border-slate-100 p-3">
            <button onClick={onMarkAllAsRead} disabled={!hasUnread} className="flex-1 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50">
                Mark all as read
            </button>
            <button onClick={onClose} className="rounded-xl bg-[#315e8d] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#26486d]">
                Close
            </button>
        </div>
    </div>
  )
}

export default NotificationPopup