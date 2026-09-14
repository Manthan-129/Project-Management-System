import { CalendarDays, CheckCircle2, ClipboardList, Clock, FolderKanban, GitPullRequest, Inbox, Send, Trash2, UserCheck } from 'lucide-react';
import { useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/axiosInstance.js';
import { SOCKET_EVENTS } from '../../api/socketEvents.js';
import { AppContext } from '../../context/AppContext.jsx';
import Loading from '../LoadingPage';
import AlertModal from './AlertModal.jsx';

const KANBAN_COLUMNS= [
    {
        key: 'todo',
        name: 'To Do',
        icon: ClipboardList,
        accentColor: 'text-sky-600',
        bgTint: 'bg-sky-50/40',
        borderTint: 'border-sky-200/70',
        badgeBg: 'bg-sky-100/80 text-sky-800',
        headerBg: 'bg-gradient-to-r from-sky-50/90 via-sky-50/50 to-white',
        stripColor: 'bg-sky-400',
    },
    {
        key: 'in-progress',
        name: 'In Progress',
        icon: Clock,
        accentColor: 'text-amber-600',
        bgTint: 'bg-amber-50/30',
        borderTint: 'border-amber-200/70',
        badgeBg: 'bg-amber-100/80 text-amber-800',
        headerBg: 'bg-gradient-to-r from-amber-50/90 via-amber-50/50 to-white',
        stripColor: 'bg-amber-400',
    },
    {
        key: 'in-review',
        name: 'In Review',
        icon: GitPullRequest,
        accentColor: 'text-indigo-400',
        bgTint: 'bg-indigo-950/20',
        borderTint: 'border-indigo-800/40',
        badgeBg: 'bg-indigo-500/20 text-indigo-300',
        headerBg: 'bg-gradient-to-r from-indigo-950/60 via-indigo-900/40 to-slate-900/40',
        stripColor: 'bg-indigo-500',
    },
    {
        key: 'completed',
        name: 'Completed',
        icon: CheckCircle2,
        accentColor: 'text-emerald-600',
        bgTint: 'bg-emerald-50/30',
        borderTint: 'border-emerald-200/70',
        badgeBg: 'bg-emerald-100/80 text-emerald-800',
        headerBg: 'bg-gradient-to-r from-emerald-50/90 via-emerald-50/50 to-white',
        stripColor: 'bg-emerald-400',
    },
    {
        key: 'deleted',
        name: 'Deleted',
        icon: Trash2,
        accentColor: 'text-rose-600',
        bgTint: 'bg-rose-50/30',
        borderTint: 'border-rose-200/70',
        badgeBg: 'bg-rose-100/80 text-rose-800',
        headerBg: 'bg-gradient-to-r from-rose-50/90 via-rose-50/50 to-white',
        stripColor: 'bg-rose-400',
    },
];

const createEmptyBoard = () => ({
    todo: [],
    'in-progress': [],
    'in-review': [],
    completed: [],
    deleted: [],
});

const TaskWorkspaceBoard = () => {

    const {token, setToken, authHeaders, socket }= useContext(AppContext);
    const [tab, setTab]= useState('assignedTaskToMe');
    const [loading, setLoading]= useState(true);
    const [isExtending, setIsExtending]= useState(false);
    const [alert, setAlert]= useState({ isOpen: false, title: '', message: '', type: 'info' });
    const [workspaceBoard, setWorkspaceBoard]= useState({
        assignedTaskToMe: createEmptyBoard(),
        assignedTaskByMeAsAdmin: createEmptyBoard(),
        assignedTaskByMeAsLeader: createEmptyBoard(),
    });

    const fetchData= async (showLoading = true)=>{
        if (showLoading) setLoading(true);
        try{
            const { data } = await api.get('/tasks/workspace-board', { headers: authHeaders });

            if(!data?.success){
                toast.error(data?.message || 'Failed to fetch workspace tasks');
                setWorkspaceBoard({
                    assignedTaskToMe: createEmptyBoard(),
                    assignedTaskByMeAsAdmin: createEmptyBoard(),
                    assignedTaskByMeAsLeader: createEmptyBoard(),
                });
                return;
            }

            setWorkspaceBoard({
                assignedTaskToMe: data?.assignedToMe || createEmptyBoard(),
                assignedTaskByMeAsAdmin: data?.assignedByMeAsAdmin || createEmptyBoard(),
                assignedTaskByMeAsLeader: data?.assignedByMeAsLeader || createEmptyBoard(),
            });

        }catch(error){
            if(error?.response?.status === 401){
                setToken(null);
                localStorage.removeItem('token');
            }
            toast.error(error?.response?.data?.message || 'Unable to fetch workspace tasks');

        } finally {
            if (showLoading) setLoading(false);
        }
    }

    useEffect(()=>{
        if(token){
            fetchData(true);
        } else {
            setLoading(false);
        }
    },[token]);

    // Listen for live task events across any team assigned to/by user
    useEffect(() => {
        if (!socket) return;

        const updateBoardWithStatus = (taskId, newStatus, completedAt, taskPayload) => {
            if (!taskId || !newStatus) return;
            setWorkspaceBoard((prev) => {
                const updateCategory = (board) => {
                    const next = createEmptyBoard();
                    let found = null;
                    KANBAN_COLUMNS.forEach((col) => {
                        (board?.[col.key] || []).forEach((item) => {
                            if (item._id === taskId) {
                                found = {
                                    ...item,
                                    ...(taskPayload || {}),
                                    status: newStatus,
                                    completedAt: completedAt || item.completedAt,
                                    isDeleted: false,
                                };
                            } else {
                                next[col.key].push(item);
                            }
                        });
                    });
                    if (found && next[newStatus]) {
                        next[newStatus].unshift(found);
                    }
                    return next;
                };

                return {
                    assignedTaskToMe: updateCategory(prev.assignedTaskToMe),
                    assignedTaskByMeAsAdmin: updateCategory(prev.assignedTaskByMeAsAdmin),
                    assignedTaskByMeAsLeader: updateCategory(prev.assignedTaskByMeAsLeader),
                };
            });
        };

        const updateBoardWithTask = (taskId, updatedTask) => {
            if (!taskId) return;
            setWorkspaceBoard((prev) => {
                const updateCategory = (board) => {
                    const next = {};
                    KANBAN_COLUMNS.forEach((col) => {
                        next[col.key] = (board?.[col.key] || []).map((item) => {
                            if (item._id === taskId) {
                                return { ...item, ...(updatedTask || {}) };
                            }
                            return item;
                        });
                    });
                    return next;
                };

                return {
                    assignedTaskToMe: updateCategory(prev.assignedTaskToMe),
                    assignedTaskByMeAsAdmin: updateCategory(prev.assignedTaskByMeAsAdmin),
                    assignedTaskByMeAsLeader: updateCategory(prev.assignedTaskByMeAsLeader),
                };
            });
        };

        const updateBoardWithDeletion = (taskId, taskPayload) => {
            if (!taskId) return;
            setWorkspaceBoard((prev) => {
                const updateCategory = (board) => {
                    const next = createEmptyBoard();
                    let target = null;
                    KANBAN_COLUMNS.forEach((col) => {
                        (board?.[col.key] || []).forEach((item) => {
                            if (item._id === taskId) {
                                target = { ...item, ...(taskPayload || {}), isDeleted: true };
                            } else {
                                next[col.key].push(item);
                            }
                        });
                    });
                    if (target) {
                        next.deleted.unshift(target);
                    }
                    return next;
                };

                return {
                    assignedTaskToMe: updateCategory(prev.assignedTaskToMe),
                    assignedTaskByMeAsAdmin: updateCategory(prev.assignedTaskByMeAsAdmin),
                    assignedTaskByMeAsLeader: updateCategory(prev.assignedTaskByMeAsLeader),
                };
            });
        };

        const updateBoardWithRestoration = (taskId, taskPayload) => {
            if (!taskId) return;
            setWorkspaceBoard((prev) => {
                const updateCategory = (board) => {
                    const next = createEmptyBoard();
                    let target = null;
                    KANBAN_COLUMNS.forEach((col) => {
                        (board?.[col.key] || []).forEach((item) => {
                            if (item._id === taskId) {
                                target = {
                                    ...item,
                                    ...(taskPayload || {}),
                                    isDeleted: false,
                                    status: taskPayload?.status || 'todo',
                                };
                            } else {
                                next[col.key].push(item);
                            }
                        });
                    });
                    if (target) {
                        const dest = target.status || 'todo';
                        if (next[dest]) {
                            next[dest].unshift(target);
                        }
                    }
                    return next;
                };

                return {
                    assignedTaskToMe: updateCategory(prev.assignedTaskToMe),
                    assignedTaskByMeAsAdmin: updateCategory(prev.assignedTaskByMeAsAdmin),
                    assignedTaskByMeAsLeader: updateCategory(prev.assignedTaskByMeAsLeader),
                };
            });
        };

        const handleStatusUpdated = (data) => {
            if (data?.taskId && data?.status) {
                updateBoardWithStatus(data.taskId, data.status, data.completedAt, data.task);
            }
        };

        const handleTaskUpdated = (data) => {
            if (data?.taskId && data?.task) {
                updateBoardWithTask(data.taskId, data.task);
            }
        };

        const handleTaskDeleted = (data) => {
            if (data?.taskId) {
                updateBoardWithDeletion(data.taskId, data.task);
            }
        };

        const handleTaskRestored = (data) => {
            if (data?.taskId) {
                updateBoardWithRestoration(data.taskId, data.task);
            }
        };

        const handleTaskAssigned = () => {
            fetchData(false);
        };

        socket.on(SOCKET_EVENTS.TASK_ASSIGNED, handleTaskAssigned);
        socket.on(SOCKET_EVENTS.TASK_UNASSIGNED, handleTaskAssigned);
        socket.on(SOCKET_EVENTS.TASK_STATUS_UPDATED, handleStatusUpdated);
        socket.on(SOCKET_EVENTS.TASK_UPDATED, handleTaskUpdated);
        socket.on(SOCKET_EVENTS.TASK_DELETED, handleTaskDeleted);
        socket.on(SOCKET_EVENTS.TASK_RESTORED, handleTaskRestored);

        return () => {
            socket.off(SOCKET_EVENTS.TASK_ASSIGNED, handleTaskAssigned);
            socket.off(SOCKET_EVENTS.TASK_UNASSIGNED, handleTaskAssigned);
            socket.off(SOCKET_EVENTS.TASK_STATUS_UPDATED, handleStatusUpdated);
            socket.off(SOCKET_EVENTS.TASK_UPDATED, handleTaskUpdated);
            socket.off(SOCKET_EVENTS.TASK_DELETED, handleTaskDeleted);
            socket.off(SOCKET_EVENTS.TASK_RESTORED, handleTaskRestored);
        };
    }, [socket]);

    const taskByCategory= useMemo(()=>{
        const countBoardTasks = (board) =>
            KANBAN_COLUMNS.reduce((total, column) => total + (board?.[column.key]?.length || 0), 0);

        return {
            assignedTaskToMe: countBoardTasks(workspaceBoard.assignedTaskToMe),
            assignedTaskByMeAsAdmin: countBoardTasks(workspaceBoard.assignedTaskByMeAsAdmin),
            assignedTaskByMeAsLeader: countBoardTasks(workspaceBoard.assignedTaskByMeAsLeader),
        };
    },[workspaceBoard]);

    const getTasksByStatus= useMemo(()=>{
        return workspaceBoard[tab] || createEmptyBoard();
    }, [workspaceBoard, tab]);

    const extendTaskDueDate= async (taskId, currentDueDate)=>{
        const baseDate= currentDueDate ? new Date(currentDueDate) : new Date();
        const nextDate= new Date(baseDate);
        nextDate.setDate(nextDate.getDate() + 1);
        const dueDate= nextDate.toISOString().slice(0,10);

        setIsExtending(true);
        try{
            const { data } = await api.put(`/tasks/update/${taskId}`, { dueDate }, { headers: authHeaders });

            if(!data?.success){
                toast.error(data?.message || 'Failed to extend due date');
                return;
            }

            const updatedTask = data?.task;
            if(updatedTask?._id){
                setWorkspaceBoard((prev) => {
                    const next = { ...prev };
                    ['assignedTaskToMe', 'assignedTaskByMeAsAdmin', 'assignedTaskByMeAsLeader'].forEach((category) => {
                        const categoryBoard = next[category] || createEmptyBoard();
                        const updatedCategory = { ...categoryBoard };

                        KANBAN_COLUMNS.forEach((col) => {
                            updatedCategory[col.key] = (updatedCategory[col.key] || []).map((task) =>
                                task._id === updatedTask._id ? { ...task, ...updatedTask } : task
                            );
                        });

                        next[category] = updatedCategory;
                    });

                    return next;
                });
            }



        }catch(error){
            toast.error(error?.response?.data?.message || 'Unable to extend due date');
        } finally {
            setIsExtending(false);
        }
    }

    const formatDueDate= (date)=>{
        if(!date) return "No due date";
        return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    const calculateDaysLeft= (dueDate)=>{
        if(!dueDate) return null;
        const today= new Date();

        today.setHours(0,0,0,0);

        const due= new Date(dueDate);
        due.setHours(0,0,0,0);
        const daysLeft= Math.ceil((due - today) / (1000 * 60 * 60 * 24));

        return daysLeft;
    }

    if(loading) return <Loading inline />;


    const tabs= [
        {key: 'assignedTaskToMe', label: 'Assigned Task To Me', count: taskByCategory.assignedTaskToMe, icon: Inbox},
        {key: 'assignedTaskByMeAsAdmin', label: 'Assigned Task By Me As Admin', count: taskByCategory.assignedTaskByMeAsAdmin, icon: Send},
        {key: 'assignedTaskByMeAsLeader', label: 'Assigned Task By Me As Leader', count: taskByCategory.assignedTaskByMeAsLeader, icon: UserCheck},
    ];

    const tasksByStatus= getTasksByStatus;

  return (
    <div className="space-y-5 dd-fade-up">
        {/* Header */}
        <div className="flex flex-col gap-2 rounded-2xl border border-slate-200/70 bg-gradient-to-r from-indigo-50/60 via-white to-slate-50/70 p-4 shadow-xs md:p-5">
            <div className="dd-page-kicker w-fit">
                <FolderKanban size={14} />
                <span>Task Workspace</span>
            </div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 md:text-2xl">My Cross-Team Tasks</h1>
            <p className="text-xs font-medium text-slate-500">Track and manage tasks assigned to or by you across all teams.</p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1.5 rounded-xl border border-slate-200/70 bg-slate-100/60 p-1.5">
            {tabs.map((t)=>{
                const TabIcon= t.icon;
                const active = tab === t.key;
                return (
                    <button
                        key={t.key}
                        onClick={()=> setTab(t.key)}
                        className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                            active ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200/70' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <TabIcon size={14} />
                        <span>{t.label}</span>
                        {t.count > 0 && (
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${active ? 'bg-indigo-100 text-indigo-800' : 'bg-white text-slate-600'}`}>{t.count}</span>
                        )}
                    </button>
                )
            })}
        </div>

        {/* Kanban Board - Fixed height, dedicated scroll track */}
        <div className="flex gap-3.5 overflow-x-auto pb-3 xl:grid xl:grid-cols-5 xl:overflow-x-visible">
            {KANBAN_COLUMNS.map(col=>{
                const Icon= col.icon;
                const colTasks= tasksByStatus[col.key] || [];

                return (
                    <div
                        key={col.key}
                        className={`flex flex-col min-w-[270px] xl:min-w-0 rounded-2xl border ${col.borderTint} ${col.bgTint} p-3 shadow-xs transition-all`}
                    >
                        {/* Column Header */}
                        <div className={`mb-3 flex items-center justify-between rounded-xl border ${col.borderTint} ${col.headerBg} px-3 py-2 shadow-xs`}>
                            <div className="flex items-center gap-2">
                                <div className={`flex h-6 w-6 items-center justify-center rounded-lg bg-white shadow-xs ${col.accentColor}`}>
                                    <Icon size={14} />
                                </div>
                                <h3 className="text-xs font-bold text-slate-800">{col.name}</h3>
                            </div>
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${col.badgeBg}`}>
                                {colTasks.length}
                            </span>
                        </div>

                        {/* Scrollable Column Track - NEVER expands down indefinitely */}
                        <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[calc(100vh-300px)] min-h-[480px] pr-1 custom-scrollbar">
                            {colTasks.map(task=>{
                                const daysLeft = calculateDaysLeft(task.dueDate);
                                const isOverDue= daysLeft !== null && daysLeft < 0;
                                const priorityStyles = {
                                    high: 'text-rose-700 bg-rose-50 border-rose-200/80',
                                    medium: 'text-amber-700 bg-amber-50 border-amber-200/80',
                                    low: 'text-emerald-700 bg-emerald-50 border-emerald-200/80',
                                };
                                const priorityClass = priorityStyles[task.priority?.toLowerCase()] || 'text-slate-600 bg-slate-50 border-slate-200';

                                return (
                                    <article
                                        key={task._id}
                                        className="group relative rounded-xl border border-slate-200/80 bg-white/95 p-3.5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
                                    >
                                        {/* Accent Stripe */}
                                        <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${col.stripColor}`} />

                                        <div className="pl-1.5">
                                            <div className="flex items-start justify-between gap-2">
                                                <h4 className="text-xs font-bold leading-snug text-slate-800 line-clamp-2">{task.title}</h4>
                                                <span className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${priorityClass}`}>
                                                    {task.priority}
                                                </span>
                                            </div>

                                            <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                                                <span className="inline-flex items-center gap-1 font-medium text-indigo-600">
                                                    <FolderKanban size={11} />
                                                    {task.team?.name || task.team?.title || 'Team'}
                                                </span>
                                                <span className="inline-flex items-center gap-1">
                                                    <CalendarDays size={11} />
                                                    {formatDueDate(task.dueDate)}
                                                </span>
                                            </div>

                                            <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-slate-100 pt-2 text-[11px]">
                                                <span className="text-slate-500 font-medium">
                                                    {tab === 'assignedTaskToMe'
                                                        ? `By: ${task.assignedBy?.firstName || 'User'}`
                                                        : `To: ${task.assignedTo?.firstName || 'User'}`}
                                                </span>

                                                {daysLeft !== null && (
                                                    <span className={`text-[10px] font-bold ${isOverDue ? 'text-rose-600' : daysLeft === 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                                                        {isOverDue ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? 'Due today' : `${daysLeft}d left`}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="mt-2.5 flex justify-end">
                                                <button
                                                    disabled={isExtending}
                                                    className="rounded-md border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-700 transition-colors hover:bg-teal-100 disabled:opacity-50"
                                                    onClick={()=> extendTaskDueDate(task._id, task.dueDate)}
                                                    title="Extend due date by 1 day"
                                                >
                                                    {isExtending ? '...' : '+1 Day'}
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                )
                            })}

                            {colTasks.length === 0 && (
                                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200/80 bg-white/40 py-12 text-center">
                                    <div className="mb-2 rounded-xl bg-white p-2 text-slate-300 shadow-xs">
                                        <Icon size={18} />
                                    </div>
                                    <p className="text-xs font-medium text-slate-400">No tasks in {col.name.toLowerCase()}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>

        <AlertModal 
            isOpen={alert.isOpen}
            title={alert.title}
            message={alert.message}
            type={alert.type}
            onClose={() => setAlert({ isOpen: false, title: '', message: '', type: 'info' })}
        />
    </div>
  )
}

export default TaskWorkspaceBoard