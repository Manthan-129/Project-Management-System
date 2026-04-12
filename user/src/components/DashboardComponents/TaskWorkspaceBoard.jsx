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
        {key: 'assignedTaskToMe', label: 'Assigned Task To Me', count: taskByCategory.assignedTaskToMe.length, icon: Inbox},
        {key: 'assignedTaskByMeAsAdmin', label: 'Assigned Task By Me As Admin', count: taskByCategory.assignedTaskByMeAsAdmin.length, icon: Send},
        {key: 'assignedTaskByMeAsLeader', label: 'Assigned Task By Me As Leader', count: taskByCategory.assignedTaskByMeAsLeader.length, icon: UserCheck},
    ];

    const tasksByStatus= getTasksByStatus;

  return (
    <div>

        {/* Headers */}
        <div>
            <div>
                <FolderKanban size={18} />
                <span>Task Workspace</span>
            </div>
            <h1>My Tasks</h1>    
            <p>View and manage tasks across your three task pages</p>
        </div>

        {/* Tabs */}
        <div>
            {tabs.map((t)=>{
                const TabIcon= t.icon;
                return (
                    <button key={t.key} onClick={()=> setTab(t.key)}>
                        <TabIcon size={16} />
                        <span>{t.label}</span>
                        {t.count > 0 && (
                            <span>{t.count}</span>
                        )}
                    </button>
                )
            })}
        </div>

        {/* Kanban Board */}
        <div>
            {KANBAN_COLUMNS.map(col=>{
                const Icon= col.icon;
                const colTasks= tasksByStatus[col.key] || [];

                return (
                    <div key={col.key}>
                        <div>
                            <div>
                                <Icon size={16} />
                            </div>
                            <h3>{col.name}</h3>
                            <span>{colTasks.length}</span>
                        </div>

                        <div>
                            {colTasks.map(task=>{
                                const daysLeft = calculateDaysLeft(task.dueDate);
                                const isOverDue= daysLeft !== null && daysLeft < 0;

                                return (
                                    <article key={task._id}>
                                        <div>
                                            <h4>{task.title}</h4>
                                            <span>{task.priority}</span>
                                        </div>

                                        <div>
                                            <span><FolderKanban size={11} />{task.team.name}</span>

                                            <span><CalendarDays size={11} />{formatDueDate(task.dueDate)}</span>
                                        </div>

                                        <div>
                                            {tab === 'assignedTaskToMe' ? (
                                                <p><span>By: {task.assignedBy.firstName}</span></p>
                                            )
                                        :
                                        (
                                            <p><span>To: {task.assignedTo.firstName}</span></p>
                                        )}
                                        
                                        {daysLeft !== null && (
                                            <p className={`font-semibold ${isOverDue ? 'text-red-600' : daysLeft === 0 ? 'text-amber-600' : 'text-gray-600'}`}>{isOverDue ? `${Math.abs(daysLeft)} days overdue` : daysLeft === 0 ? 'Due today' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}</p>
                                        )}
                                        </div>

                                        <div>
                                            <button onClick={()=> extendTaskDueDate(task._id, task.dueDate)}>+1 Day</button>
                                        </div>
                                    </article>
                                )
                            })}

                            {colTasks.length === 0 && (
                                <div>
                                    <div>
                                        <Icon size={18} />
                                    </div>
                                    <p>No tasks here</p>
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