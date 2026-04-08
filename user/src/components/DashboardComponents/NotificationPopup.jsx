import React from 'react'
import { Bell, CheckCheck, FolderPlus, Trash2, UserCheck, UserPlus, Users } from 'lucide-react';
import { useMemo } from 'react';

const iconByType= {
    'task-added' : FolderPlus,
    'task-removed' : Trash2,
    'task-assigned-to-me' : UserCheck,
    'team-invitation' : Users,
    'firend-request-received' : UserPlus,
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


const NotificationPopup = ({notifications, unreadCount, onItemClick, onMarkAllRead, onClose}) => {
  
    const hasUnread= useMemo(()=> unreadCount > 0, [unreadCount]);

    return (
    <div>
        <div>
            <div>
                <p>Notifications</p>
                <p>All app activity updates</p>
            </div>
            <button onClick={onMarkAllRead}>
                <CheckCheck size={14} /> Mark all read
            </button>
        </div>

        <div>
            {notifications.length === 0 ? (
                <div>
                    <div>
                        <Bell size={18} />
                    </div>
                    <p className="text-sm font-medium text-gray-700">No notifications yet</p>
                        <p className="text-xs text-gray-500 mt-1">New team and task updates will appear here</p>
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
                        className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${item.isRead ? 'opacity-75' : ''}`}>
                            
                            <div>
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconColorClass}`}>
                                    <Icon size={16} />
                                </div>

                                <div>
                                    <div>
                                        <p>{item.title}</p>
                                        {!item.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>}
                                    </div>
                                    <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{item.message}</p>
                                    <p className="text-[11px] text-gray-400 mt-1">{formatTimeAgo(item.createdAt)}</p>
                                </div>
                            </div>
                        </button>
                    )
                })
            )}
        </div>

        <div>
            <button onClick={onClose}>Close</button>
        </div>
    </div>
  )
}

export default NotificationPopup