import { Bell, FolderPlus, Trash2, UserCheck, UserPlus, Users } from 'lucide-react';
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
    <div className="w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.14)]">
        <div className="border-b border-slate-200/80 bg-[linear-gradient(135deg,rgba(49,94,141,0.08),rgba(255,255,255,0.94))] px-4 py-3">
            <div className="flex items-center justify-between gap-2">
                <div>
                    <p className="text-sm font-bold text-slate-900">Notifications</p>
                    <p className="text-xs text-slate-500">All app activity updates</p>
                </div>
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-600">
                    {notifications.length}
                </span>
            </div>
        </div>

        <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                        <Bell size={18} />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">No notifications yet</p>
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
                        className={`w-full cursor-pointer border-b border-slate-100 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${item.isRead ? 'opacity-75' : ''}`}>
                            
                            <div className="flex items-start gap-3">
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconColorClass}`}>
                                    <Icon size={16} />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="truncate text-sm font-semibold text-slate-800">{item.title}</p>
                                        {!item.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>}
                                    </div>
                                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">{item.message}</p>
                                    <p className="mt-1 text-[11px] text-slate-400">{formatTimeAgo(item.createdAt)}</p>
                                </div>
                            </div>
                        </button>
                    )
                })
            )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200/80 bg-slate-50/70 px-4 py-3">
            <button
                className="dd-ghost-button !px-3 !py-2 text-xs"
                onClick={onMarkAllAsRead}
                disabled={!hasUnread}
            >
                Mark all as read
            </button>
            <button className="dd-primary-button !px-3 !py-2 text-xs" onClick={onClose}>Close</button>
        </div>
    </div>
  )
}

export default NotificationPopup