import { CalendarDays, CheckCircle2, ClipboardList, Clock, FolderKanban, GitPullRequest, Inbox, Send, Trash2, UserCheck } from 'lucide-react';
import { useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/axiosInstance.js';
import { AppContext } from '../../context/AppContext.jsx';
import Loading from '../LoadingPage';
import AlertModal from './AlertModal.jsx';

const KANBAN_COLUMNS= [
    {key: 'todo', name: 'To Do', icon: ClipboardList, tone: 'border-slate-200 bg-slate-50', iconColor: 'text-slate-700'},
    {key: 'in-progress', name: 'In Progress', icon: Clock, tone: 'border-blue-200 bg-blue-50', iconColor: 'text-blue-700'},
    {key: 'in-review', name: 'In Review', icon: GitPullRequest, tone: 'border-amber-200 bg-amber-50', iconColor: 'text-amber-700'},
    {key: 'completed', name: 'Completed', icon: CheckCircle2, tone: 'border-emerald-200 bg-emerald-50', iconColor: 'text-emerald-700'},
    {key: 'deleted', name: 'Deleted', icon: Trash2, tone: 'border-red-200 bg-red-50', iconColor: 'text-red-700'},
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
    const [alert, setAlert]= useState({ isOpen: false, title: '', message: '', type: 'info' });
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
        {key: 'assignedTaskToMe', label: 'Assigned Task To Me', count: taskByCategory.assignedTaskToMe.length, icon: Inbox},
        {key: 'assignedTaskByMeAsAdmin', label: 'Assigned Task By Me As Admin', count: taskByCategory.assignedTaskByMeAsAdmin.length, icon: Send},
        {key: 'assignedTaskByMeAsLeader', label: 'Assigned Task By Me As Leader', count: taskByCategory.assignedTaskByMeAsLeader.length, icon: UserCheck},
    ];

    const tasksByStatus= getTasksByStatus;

  return (
    <div className="space-y-6 dd-fade-up">

        {/* Headers */}
        <div className="dd-section-card dd-fade-up">
            <div className="dd-page-kicker w-fit">
                <FolderKanban size={18} />
                <span>Task Workspace</span>
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">My Tasks</h1>
            <p className="mt-1 text-sm text-slate-600">View and manage tasks across your three task pages.</p>
        </div>

        {/* Tabs */}
        <div className="dd-section-card p-3">
            {tabs.map((t)=>{
                const TabIcon= t.icon;
                return (
                    <button key={t.key} onClick={()=> setTab(t.key)} className={`mr-2 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${tab === t.key ? 'bg-[#315e8d] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                        <TabIcon size={16} />
                        <span>{t.label}</span>
                        {t.count > 0 && (
                            <span className={`rounded-full px-2 py-0.5 text-xs ${tab === t.key ? 'bg-white/20 text-white' : 'bg-white text-slate-600'}`}>{t.count}</span>
                        )}
                    </button>
                )
            })}
        </div>

        {/* Kanban Board */}
        <div className="grid gap-4 xl:grid-cols-5">
            {KANBAN_COLUMNS.map(col=>{
                const Icon= col.icon;
                const colTasks= tasksByStatus[col.key] || [];

                return (
                    <div key={col.key} className="dd-section-card p-4">
                        <div className="mb-3 flex items-center gap-2">
                            <div className={`rounded-xl border p-2 ${col.tone}`}>
                                <Icon size={16} className={col.iconColor} />
                            </div>
                            <h3 className="font-semibold text-slate-800">{col.name}</h3>
                            <span className="ml-auto dd-badge border-slate-200 bg-slate-50 text-slate-700">{colTasks.length}</span>
                        </div>

                        <div className="space-y-3">
                            {colTasks.map(task=>{
                                const daysLeft = calculateDaysLeft(task.dueDate);
                                const isOverDue= daysLeft !== null && daysLeft < 0;

                                return (
                                    <article key={task._id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                                        <div className="flex items-start justify-between gap-2">
                                            <h4 className="font-semibold text-slate-900">{task.title}</h4>
                                            <span className="dd-badge border-slate-200 bg-slate-50 text-slate-700">{task.priority}</span>
                                        </div>

                                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                                            <span className="inline-flex items-center gap-1"><FolderKanban size={11} />{task.team.name}</span>

                                            <span className="inline-flex items-center gap-1"><CalendarDays size={11} />{formatDueDate(task.dueDate)}</span>
                                        </div>

                                        <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                                            {tab === 'assignedTaskToMe' ? (
                                                <p className="text-slate-600"><span>By: {task.assignedBy.firstName}</span></p>
                                            )
                                        :
                                        (
                                            <p className="text-slate-600"><span>To: {task.assignedTo.firstName}</span></p>
                                        )}
                                        
                                        {daysLeft !== null && (
                                            <p className={`font-semibold ${isOverDue ? 'text-red-600' : daysLeft === 0 ? 'text-amber-600' : 'text-gray-600'}`}>{isOverDue ? `${Math.abs(daysLeft)} days overdue` : daysLeft === 0 ? 'Due today' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}</p>
                                        )}
                                        </div>

                                        <div className="mt-3">
                                            <button className="dd-ghost-button !w-full !py-2" onClick={()=> extendTaskDueDate(task._id, task.dueDate)}>+1 Day</button>
                                        </div>
                                    </article>
                                )
                            })}

                            {colTasks.length === 0 && (
                                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
                                    <div className="mx-auto mb-2 w-fit rounded-xl bg-white p-2 text-slate-400">
                                        <Icon size={18} />
                                    </div>
                                    <p className="text-sm text-slate-500">No tasks here</p>
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