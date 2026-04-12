import React from 'react'
import { Bell, CheckCheck, FolderPlus, Trash2, UserCheck, UserPlus, Users } from 'lucide-react';
import { useMemo } from 'react';

const iconByType = {
    'task-added':               FolderPlus,
    'task-removed':             Trash2,
    'task-assigned-to-me':      UserCheck,
    'team-invitation':          Users,
    'friend-request-received':  UserPlus,
};

const iconColorByType = {
    'task-added':              'text-blue-600 bg-blue-50',
    'task-removed':            'text-red-600 bg-red-50',
    'task-assigned-to-me':     'text-emerald-600 bg-emerald-50',
    'team-invitation':         'text-violet-600 bg-violet-50',
    'friend-request-received': 'text-pink-600 bg-pink-50',
};

const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
};

const NotificationPopup = ({ notifications, unreadCount, onItemClick, onMarkAllAsRead, onClose }) => {

    const hasUnread = useMemo(() => unreadCount > 0, [unreadCount]);

    return (
        <div className="absolute bottom-12 right-0 w-80 bg-white border border-[#dbe5f1] rounded-2xl shadow-lg overflow-hidden z-50 [animation:fadeUp_.25s_ease_both]">

            {/* ── Header ── */}
            <div className="px-4 py-3.5 border-b border-[#f0f4f8] bg-[#f8fafc]">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <p className="text-sm font-bold text-slate-800">Notifications</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">All app activity updates</p>
                    </div>
                    {unreadCount > 0 && (
                        <span className="text-[10px] font-bold text-[#315e8d] bg-[#e9f0f8] border border-[#dbe5f1] rounded-full px-2 py-0.5 shrink-0">
                            {unreadCount} new
                        </span>
                    )}
                </div>
            </div>

            {/* ── Notification List ── */}
            <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                            <Bell size={18} className="text-gray-300" />
                        </div>
                        <p className="text-sm font-medium text-gray-700">No notifications yet</p>
                        <p className="text-xs text-gray-500 mt-1">New team and task updates will appear here</p>
                    </div>
                ) : (
                    notifications.map((item) => {
                        const Icon = iconByType[item.type] || Bell;
                        const iconColorClass = iconColorByType[item.type] || 'text-gray-600 bg-gray-100';

                        return (
                            <button
                                key={item._id}
                                onClick={() => onItemClick(item)}
                                className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150 cursor-pointer ${item.isRead ? 'opacity-60' : ''}`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconColorClass}`}>
                                        <Icon size={16} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-[13px] font-semibold text-slate-800 truncate">
                                                {item.title}
                                            </p>
                                            {!item.isRead && (
                                                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                                            {item.message}
                                        </p>
                                        <p className="text-[11px] text-gray-400 mt-1">
                                            {formatTimeAgo(item.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>

            {/* ── Footer ── */}
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-[#f0f4f8] bg-[#f8fafc]">
                <button
                    onClick={onMarkAllAsRead}
                    disabled={!hasUnread}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#315e8d] hover:text-[#26486d] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95"
                >
                    <CheckCheck size={13} />
                    Mark all as read
                </button>
                <button
                    onClick={onClose}
                    className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                    Close
                </button>
            </div>

        </div>
    );
}

export default NotificationPopup