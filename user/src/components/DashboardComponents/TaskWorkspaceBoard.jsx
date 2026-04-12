import { CalendarDays, FolderKanban, Inbox, Send, UserCheck, CheckCircle2, Clock, GitPullRequest, ClipboardList, Trash2 } from 'lucide-react';
import { useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { AppContext } from '../../context/AppContext.jsx';
import Loading from '../LoadingPage';
import api from '../../api/axiosInstance.js';

const KANBAN_COLUMNS= [
    {key: 'todo', name: 'To Do', icon: ClipboardList, tone: 'border-slate-200 bg-slate-50'},
    {key: 'in-progress', name: 'In Progress', icon: Clock, tone: 'border-blue-200 bg-blue-50'},
    {key: 'in-review', name: 'In Review', icon: GitPullRequest, tone: 'border-amber-200 bg-amber-50'},
    {key: 'completed', name: 'Completed', icon: CheckCircle2, tone: 'border-emerald-200 bg-emerald-50'},
    {key: 'deleted', name: 'Deleted', icon: Trash2, tone: 'border-red-200 bg-red-50'},
];

const createEmptyBoard = () => ({
    todo: [],
    'in-progress': [],
    'in-review': [],
    completed: [],
    deleted: [],
});

const TaskWorkspaceBoard = () => {

    const {token, setToken, authHeaders }= useContext(AppContext);
    const [tab, setTab]= useState('assignedTaskToMe');
    const [loading, setLoading]= useState(true);
    const [workspaceBoard, setWorkspaceBoard]= useState({
        assignedTaskToMe: createEmptyBoard(),
        assignedTaskByMeAsAdmin: createEmptyBoard(),
        assignedTaskByMeAsLeader: createEmptyBoard(),
    });

    const fetchData= async ()=>{
        setLoading(true);
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
            setLoading(false);
        }
    }

    useEffect(()=>{
        if(token){
            fetchData();
        } else {
            setLoading(false);
        }
    },[token]);

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

            toast.success(data?.message || 'Due date updated successfully');

        }catch(error){
            toast.error(error?.response?.data?.message || 'Unable to extend due date');
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

    if(loading) return <Loading />;


    const tabs= [
        {key: 'assignedTaskToMe', label: 'Assigned Task To Me', count: taskByCategory.assignedTaskToMe, icon: Inbox},
        {key: 'assignedTaskByMeAsAdmin', label: 'Assigned Task By Me As Admin', count: taskByCategory.assignedTaskByMeAsAdmin, icon: Send},
        {key: 'assignedTaskByMeAsLeader', label: 'Assigned Task By Me As Leader', count: taskByCategory.assignedTaskByMeAsLeader, icon: UserCheck},
    ];

    const tasksByStatus= getTasksByStatus;

  return (
    <div className="min-h-screen bg-[#f0f4f8] px-4 py-6 lg:px-8">

        {/* Header */}
        <div className="mb-6 [animation:fadeUp_.4s_ease_both]">
            <div className="flex items-center gap-2 mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-[#e9f0f8] flex items-center justify-center">
                    <FolderKanban size={14} className="text-[#315e8d]" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[.18em] text-[#315e8d]">
                    Task Workspace
                </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Tasks</h1>
            <p className="text-sm text-slate-500 mt-1">View and manage tasks across your three task pages</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex items-center gap-2 flex-wrap [animation:fadeUp_.4s_ease_.05s_both]">
            {tabs.map((t)=>{
                const TabIcon= t.icon;
                const isActive= tab === t.key;
                return (
                    <button
                        key={t.key}
                        onClick={()=> setTab(t.key)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 border ${
                            isActive
                                ? 'bg-[#315e8d] text-white border-[#315e8d] shadow-sm'
                                : 'bg-white text-slate-500 border-[#dbe5f1] hover:bg-[#e9f0f8] hover:text-[#315e8d]'
                        }`}
                    >
                        <TabIcon size={14} />
                        <span>{t.label}</span>
                        {t.count > 0 && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg ${
                                isActive ? 'bg-white/20 text-white' : 'bg-[#e9f0f8] text-[#315e8d]'
                            }`}>
                                {t.count}
                            </span>
                        )}
                    </button>
                )
            })}
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 [animation:fadeUp_.4s_ease_.1s_both]">
            {KANBAN_COLUMNS.map(col=>{
                const Icon= col.icon;
                const colTasks= tasksByStatus[col.key] || [];

                return (
                    <div key={col.key} className={`flex flex-col rounded-2xl border ${col.tone} min-h-[200px]`}>

                        {/* Column Header */}
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-inherit">
                            <div className="w-7 h-7 rounded-lg bg-white/70 flex items-center justify-center shrink-0">
                                <Icon size={14} className="text-slate-600" />
                            </div>
                            <h3 className="text-xs font-bold text-slate-700 flex-1">{col.name}</h3>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white/70 text-slate-500">
                                {colTasks.length}
                            </span>
                        </div>

                        {/* Tasks */}
                        <div className="flex flex-col gap-2 p-3 flex-1">
                            {colTasks.map(task=>{
                                const daysLeft = calculateDaysLeft(task.dueDate);
                                const isOverDue= daysLeft !== null && daysLeft < 0;

                                return (
                                    <article
                                        key={task._id}
                                        className="bg-white rounded-xl border border-[#dbe5f1] px-3 py-3 flex flex-col gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                                    >
                                        {/* Title & Priority */}
                                        <div className="flex items-start justify-between gap-2">
                                            <h4 className="text-xs font-bold text-slate-800 leading-snug line-clamp-2">
                                                {task.title}
                                            </h4>
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 capitalize ${
                                                task.priority === 'high'   ? 'bg-red-50 text-red-600 border-red-200' :
                                                task.priority === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                                                             'bg-slate-50 text-slate-500 border-slate-200'
                                            }`}>
                                                {task.priority}
                                            </span>
                                        </div>

                                        {/* Team & Due Date */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                                                <FolderKanban size={10} />{task.team.name}
                                            </span>
                                            <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                                                <CalendarDays size={10} />{formatDueDate(task.dueDate)}
                                            </span>
                                        </div>

                                        {/* Assigned By/To & Days Left */}
                                        <div className="flex items-center justify-between gap-2">
                                            {tab === 'assignedTaskToMe' ? (
                                                <p className="text-[10px] text-slate-400 font-medium">
                                                    By: <span className="font-bold text-slate-600">{task.assignedBy.firstName}</span>
                                                </p>
                                            ) : (
                                                <p className="text-[10px] text-slate-400 font-medium">
                                                    To: <span className="font-bold text-slate-600">{task.assignedTo.firstName}</span>
                                                </p>
                                            )}

                                            {daysLeft !== null && (
                                                <p className={`text-[10px] font-semibold ${
                                                    isOverDue      ? 'text-red-600' :
                                                    daysLeft === 0 ? 'text-amber-600' :
                                                                     'text-slate-500'
                                                }`}>
                                                    {isOverDue
                                                        ? `${Math.abs(daysLeft)}d overdue`
                                                        : daysLeft === 0
                                                        ? 'Due today'
                                                        : `${daysLeft}d left`}
                                                </p>
                                            )}
                                        </div>

                                        {/* Extend Due Date */}
                                        <div className="pt-1 border-t border-slate-100">
                                            <button
                                                onClick={()=> extendTaskDueDate(task._id, task.dueDate)}
                                                className="w-full text-[10px] font-bold text-[#315e8d] bg-[#e9f0f8] hover:bg-[#dbe5f1] rounded-lg py-1 transition-all duration-150 cursor-pointer"
                                            >
                                                +1 Day
                                            </button>
                                        </div>
                                    </article>
                                )
                            })}

                            {/* Empty State */}
                            {colTasks.length === 0 && (
                                <div className="flex flex-col items-center justify-center flex-1 py-6 gap-2">
                                    <div className="w-9 h-9 rounded-xl bg-white/70 flex items-center justify-center">
                                        <Icon size={16} className="text-slate-300" />
                                    </div>
                                    <p className="text-[11px] text-slate-400 font-medium">No tasks here</p>
                                </div>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    </div>
  )
}

export default TaskWorkspaceBoard