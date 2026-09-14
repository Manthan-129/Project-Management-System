import { Bell, FolderPlus, GitPullRequest, Trash2, UserCheck, UserMinus, UserPlus, Users } from 'lucide-react';
import { useMemo } from 'react';

const iconByType= {
    'task-added' : FolderPlus,
    'task-removed' : Trash2,
    'task-assigned' : UserCheck,
    'task-unassigned' : UserMinus,
    'task-assigned-to-me' : UserCheck,
    'team-invitation' : Users,
    'team-member-removed' : UserMinus,
    'friend-request' : UserPlus,
    'friend-request-received' : UserPlus,
    'friend-request-accepted' : UserCheck,
    'pr-created' : GitPullRequest,
    'pr-reviewed' : GitPullRequest,
};

const iconColorByType = {
    'task-added': 'text-sky-400 bg-sky-500/15',
    'task-removed': 'text-rose-400 bg-rose-500/15',
    'task-assigned': 'text-emerald-400 bg-emerald-500/15',
    'task-unassigned': 'text-amber-400 bg-amber-500/15',
    'task-assigned-to-me': 'text-emerald-400 bg-emerald-500/15',
    'team-invitation': 'text-indigo-400 bg-indigo-500/15',
    'team-member-removed': 'text-rose-400 bg-rose-500/15',
    'friend-request': 'text-pink-400 bg-pink-500/15',
    'friend-request-received': 'text-pink-400 bg-pink-500/15',
    'friend-request-accepted': 'text-emerald-400 bg-emerald-500/15',
    'pr-created': 'text-indigo-400 bg-indigo-500/15',
    'pr-reviewed': 'text-cyan-400 bg-cyan-500/15',
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
    <div className="w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-900 shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
        <div className="border-b border-slate-800 bg-slate-950/70 px-4 py-3">
            <div className="flex items-center justify-between gap-2">
                <div>
                    <p className="text-sm font-bold text-slate-100">Notifications</p>
                    <p className="text-xs text-slate-400">All app activity updates</p>
                </div>
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-slate-700 bg-slate-800 px-2 text-[11px] font-semibold text-slate-300">
                    {notifications.length}
                </span>
            </div>
        </div>

        <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-slate-400">
                        <Bell size={18} />
                    </div>
                    <p className="text-sm font-semibold text-slate-200">No notifications yet</p>
                    <p className="mt-1 text-xs text-slate-500">New team and task updates will appear here</p>
                </div>
            )
            :
            (
                notifications.map((item) => {
                    const Icon= iconByType[item.type] || Bell;
                    const iconColorClass = iconColorByType[item.type] || 'text-slate-400 bg-slate-800';

                    return (
                        <button key={item._id}
                        onClick={() => onItemClick(item)}
                        className={`w-full cursor-pointer border-b border-slate-800/70 px-4 py-3 text-left transition-colors hover:bg-slate-800/50 ${item.isRead ? 'opacity-70' : ''}`}>
                            
                            <div className="flex items-start gap-3">
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconColorClass}`}>
                                    <Icon size={16} />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="truncate text-sm font-semibold text-slate-200">{item.title}</p>
                                        {!item.isRead && <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></span>}
                                    </div>
                                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-400">{item.message}</p>
                                    <p className="mt-1 text-[11px] text-slate-500">{formatTimeAgo(item.createdAt)}</p>
                                </div>
                            </div>
                        </button>
                    )
                })
            )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-800/80 bg-slate-950/70 px-4 py-3">
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