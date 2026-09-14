import {
    AlertCircle,
    AlertTriangle,
    CalendarClock,
    CheckCircle2,
    Clock3,
    FolderKanban,
    Layers,
    ListTodo,
    Sparkles,
    Target,
    TrendingUp,
    Users,
} from 'lucide-react';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '../../api/axiosInstance.js';
import { AppContext } from '../../context/AppContext.jsx';
import Loading from '../LoadingPage';

const DashboardOverview = () => {
    const { token, setToken, navigate, authHeaders } = useContext(AppContext);

    const [teams, setTeams] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState('');
    const [allTasks, setAllTasks] = useState([]);
    const [deletedTasks, setDeletedTasks] = useState([]);
    const [taskByMember, setTaskByMember] = useState({});
    const [stats, setStats] = useState({
        totalTasks: 0,
        todo: 0,
        inProgress: 0,
        completed: 0,
        overDue: 0,
    });
    const [loading, setLoading] = useState(true);
    const [tasksLoading, setTasksLoading] = useState(false);

    const fetchTeams = useCallback(async () => {
        try {
            const { data } = await axiosInstance.get('/teams/my-teams', {
                headers: authHeaders,
            });

            if(!data?.success){
                toast.error(data?.message || 'Failed to fetch teams');
                setTeams([]);
                setSelectedTeam('');
                return;
            }

            const teamList = data.teams || [];
            setTeams(teamList);

            if (teamList.length > 0) {
                setSelectedTeam((prev) => prev || teamList[0]._id);
            } else {
                setSelectedTeam('');
            }
        } catch (error) {
            if (error?.response?.status === 401) {
                setToken(null);
                localStorage.removeItem('token');
                return; // Silent failure for 401
            }
            toast.error(error?.response?.data?.message || 'Unable to fetch teams');
            setTeams([]);
            setSelectedTeam('');
        } finally {
            setLoading(false);
        }
    }, [authHeaders, setToken]);

    useEffect(() => {
        if (token) {
            fetchTeams();
        } else {
            setLoading(false);
        }
    }, [token, fetchTeams]);

    const fetchTasks = useCallback(async () => {
        if (!selectedTeam) return;

        setTasksLoading(true);
        try {
            const { data } = await axiosInstance.get(`/tasks/team-task/${selectedTeam}`, {
                headers: authHeaders,
            });

            if(!data?.success){
                setAllTasks([]);
                setDeletedTasks([]);
                setTaskByMember({});
                setStats({totalTasks: 0, todo: 0, inProgress: 0, completed: 0, overDue: 0});
                toast.error(data?.message || 'Failed to fetch team tasks');
                return;
            }

            const fetchedTasks = data.allTasks || [];
            const fetchedDeletedTasks = data.deletedTasks || [];
            const fetchedTaskByMember = data.taskByMember || {};
            const fetchedStats = data.stats || {};

            setAllTasks(fetchedTasks);
            setDeletedTasks(fetchedDeletedTasks);
            setTaskByMember(fetchedTaskByMember);
            setStats({
                totalTasks: fetchedStats.total || 0,
                todo: fetchedStats.byStatus?.todo || 0,
                inProgress: fetchedStats.byStatus?.['in-progress'] || 0,
                completed: fetchedStats.byStatus?.completed || 0,
                overDue: fetchedStats.overDue || 0,
            });
        } catch (error) {
            if (error?.response?.status === 401) {
                setToken(null);
                localStorage.removeItem('token');
                return; // Silent failure for 401
            }
            setAllTasks([]);
            setDeletedTasks([]);
            setTaskByMember({});
            setStats({ totalTasks: 0, todo: 0, inProgress: 0, completed: 0, overDue: 0 });
            toast.error(error?.response?.data?.message || 'Unable to fetch team tasks');
        } finally {
            setTasksLoading(false);
        }
    }, [selectedTeam, authHeaders]);

    useEffect(() => {
        if (token && selectedTeam) {
            fetchTasks();
        }
    }, [token, selectedTeam, fetchTasks]);

    const todayFocus= useMemo(()=> {
        const priorityRank= {High: 3, Medium: 2, Low: 1};

        return [...allTasks]
        .filter((t)=> t.status !== 'completed')
        .sort((a,b) => {

            const priorityDifference= (priorityRank[b.priority] || 0) - (priorityRank[a.priority] || 0);
            if(priorityDifference !== 0) return priorityDifference;

            const aDate= a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
            const bDate= b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;

            return aDate - bDate;

        })
        .slice(0,3);
    },[allTasks]);

    const riskRadar = useMemo(() => {
        const now = new Date();

        const overDue = allTasks.filter(
            (t) =>
                t.dueDate &&
                new Date(t.dueDate) < now &&
                t.status !== 'completed'
        );

        const longReview = allTasks.filter((t) => t.status === 'in-review');
        const deleted = deletedTasks;

        return { overDue, longReview, deleted };
    }, [allTasks, deletedTasks]);

    const memberLoad = useMemo(() => {
        return Object.values(taskByMember)
            .map((entry) => {
                const member = entry.memberInfo || {};
                const memberStats = entry.stats || {};
                const total = memberStats.total || 0;
                const completed = memberStats.byStatus?.completed || 0;

                return {
                    id: member._id,
                    name:
                        `${member.firstName || ''} ${member.lastName || ''}`.trim() ||
                        member.username ||
                        'Member',
                    profilePicture: member.profilePicture,
                    active: Math.max(0, total - completed),
                    completed,
                    overDue: memberStats.overDue || 0,
                };
            })
            .filter((member) => member.id)
            .sort((a, b) => b.active - a.active);
    }, [taskByMember]);

    const upcomingDeadlines = useMemo(() => {
        const now = new Date();

        return [...allTasks]
            .filter(
                (t) =>
                    t.dueDate &&
                    new Date(t.dueDate) > now &&
                    t.status !== 'completed'
            )
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
            .slice(0, 5);
    }, [allTasks]);

    const recentUpdates = useMemo(() => {
        return [...allTasks]
            .sort(
                (a, b) =>
                    new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
            )
            .slice(0, 6);
    }, [allTasks]);

    if (loading) return <Loading />;

    if (teams.length === 0) {
        return (
            <div className="dd-section-card text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                    <FolderKanban size={30} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">No team workspace yet.</h2>
                <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">Create a team first to unlock your mission control dashboard.</p>
                <button onClick={() => navigate('/dashboard/teams')} className="dd-primary-button mt-5">
                    Create a Team
                </button>
            </div>
        );
    }

    const metricCards = [
        {
            icon: <Layers size={16} />,
            label: 'Total Tasks',
            value: stats.totalTasks || 0,
            tone: 'indigo',
        },
        {
            icon: <ListTodo size={16} />,
            label: 'To-Do',
            value: stats.todo || 0,
            tone: 'sky',
        },
        {
            icon: <Clock3 size={16} />,
            label: 'In Progress',
            value: stats.inProgress || 0,
            tone: 'amber',
        },
        {
            icon: <CheckCircle2 size={16} />,
            label: 'Completed',
            value: stats.completed || 0,
            tone: 'emerald',
        },
        {
            icon: <AlertTriangle size={16} />,
            label: 'Overdue',
            value: stats.overDue || 0,
            tone: 'rose',
        },
        {
            icon: <AlertCircle size={16} />,
            label: 'Deleted',
            value: deletedTasks.length || 0,
            tone: 'slate',
        },
    ];

    return (
        <div className="space-y-5 dd-fade-up">
            <section className="flex flex-col gap-4 rounded-2xl border border-[#1b3a5c] bg-[#0c1f38] p-4 shadow-md md:flex-row md:items-center md:justify-between md:p-5">
                <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-300">
                        <Sparkles size={13} />
                        <span>Mission Control</span>
                    </div>
                    <h1 className="text-xl font-black tracking-tight text-white md:text-2xl">Team Command Center</h1>
                    <p className="text-xs font-medium text-slate-300">Real-time overview of tasks, priorities, workload, and deadlines.</p>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-[#1b3a5c] bg-[#071322] p-2 shadow-xs">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1.5">Team:</span>
                    <select
                        className="rounded-lg border border-[#1b3a5c] bg-[#0c1f38] px-3 py-1.5 text-xs font-semibold text-white outline-none hover:border-indigo-400 focus:border-indigo-400 min-w-[160px]"
                        value={selectedTeam}
                        onChange={(e) => setSelectedTeam(e.target.value)}
                    >
                        {teams.map((item) => (
                            <option key={item._id} value={item._id} className="bg-[#0c1f38] text-white">
                                {item.name}
                            </option>
                        ))}
                    </select>
                </div>
            </section>

            {tasksLoading && <p className="rounded-xl border border-indigo-100 bg-indigo-50/70 px-3 py-2 text-xs font-medium text-indigo-700">Refreshing team tasks...</p>}

            <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                {metricCards.map((card) => (
                    <MetricCard
                        key={card.label}
                        icon={card.icon}
                        label={card.label}
                        value={card.value}
                        tone={card.tone}
                    />
                ))}
            </section>

            <section className="grid gap-4 xl:grid-cols-2">
                <article className="dd-section-card">
                    <div className="dd-section-head">
                        <div className="flex items-center gap-2">
                            <div className="rounded-lg bg-indigo-50 p-1.5 text-indigo-600">
                                <Target size={16} />
                            </div>
                            <h2 className="text-sm font-bold text-slate-800">Today's Focus</h2>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                            {todayFocus.length}
                        </span>
                    </div>

                    <div className="max-h-64 overflow-y-auto pr-1.5 custom-scrollbar space-y-2.5">
                        {todayFocus.length === 0 && <p className="text-xs text-slate-400">No active focus items right now.</p>}

                        {todayFocus.map((task) => (
                            <div key={task._id} className="rounded-xl border border-[#1b3a5c] bg-[#0c1f38] p-3 transition-all hover:border-[#264d79]">
                                <div className="flex items-start justify-between gap-2">
                                    <h3 className="text-xs font-bold text-white line-clamp-1">{task.title}</h3>
                                    <span className="rounded-md border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-300">
                                        {task.priority}
                                    </span>
                                </div>

                                <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                                    <span className="inline-flex items-center gap-1">
                                        <Users size={11} className="text-slate-400" /> {task.assignedTo?.firstName || 'Member'}
                                    </span>

                                    {task.dueDate && (
                                        <span className="inline-flex items-center gap-1">
                                            <CalendarClock size={11} className="text-slate-400" />
                                            {new Date(task.dueDate).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </article>

                <article className="dd-section-card">
                    <div className="dd-section-head">
                        <div className="flex items-center gap-2">
                            <div className="rounded-lg bg-rose-50 p-1.5 text-rose-600">
                                <AlertCircle size={16} />
                            </div>
                            <h2 className="text-sm font-bold text-slate-800">Risk Radar</h2>
                        </div>
                    </div>
                    <ul className="max-h-64 overflow-y-auto pr-1.5 custom-scrollbar space-y-2">
                        <RiskItem label="Overdue Tasks" count={riskRadar.overDue.length} />
                        <RiskItem label="In Review Queue" count={riskRadar.longReview.length} />
                        <RiskItem label="Deleted Tasks" count={riskRadar.deleted.length} />
                    </ul>
                </article>
            </section>

            <section className="grid gap-4 xl:grid-cols-2">
                <article className="dd-section-card">
                    <div className="dd-section-head">
                        <div className="flex items-center gap-2">
                            <div className="rounded-lg bg-emerald-50 p-1.5 text-emerald-600">
                                <TrendingUp size={16} />
                            </div>
                            <h3 className="text-sm font-bold text-slate-800">Team Workload Snapshot</h3>
                        </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto pr-1.5 custom-scrollbar space-y-2.5">
                        {memberLoad.length === 0 && <p className="text-xs text-slate-400">No workload data available.</p>}
                        {memberLoad.map((member) => (
                            <div key={member.id} className="rounded-xl border border-[#1b3a5c] bg-[#0c1f38] p-3">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-bold text-white">{member.name}</span>
                                    <span className="text-[11px] font-medium text-slate-400">
                                        {member.completed} done / {member.active} active
                                    </span>
                                </div>
                                <div className="mt-2 space-y-1">
                                    <div className="flex items-center justify-between text-[10px]">
                                        <span className="font-semibold text-slate-400">Capacity</span>
                                        <span className="font-bold text-slate-300">
                                            {Math.min(100, Math.round((member.active / 8) * 100))}%
                                        </span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-300 ${
                                                member.active >= 6
                                                    ? 'bg-rose-500'
                                                    : member.active >= 4
                                                       ? 'bg-amber-500'
                                                       : 'bg-emerald-500'
                                            }`}
                                            style={{ width: `${Math.min(100, (member.active / 8) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </article>

                <article className="dd-section-card">
                    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                            <div className="rounded-lg bg-sky-50 p-1.5 text-sky-600">
                                <CalendarClock size={16} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-800">Deadlines & Updates</h3>
                                <p className="text-[11px] text-slate-400">Recent changes and upcoming target dates.</p>
                            </div>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                            {upcomingDeadlines.length + recentUpdates.length} items
                        </span>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-[#1b3a5c] bg-[#081526]/90 p-3">
                            <div className="flex items-center justify-between gap-2 mb-2.5">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-sky-400">Due Soon</p>
                                <span className="rounded-full border border-sky-500/30 bg-sky-500/20 px-2 py-0.5 text-[10px] font-bold text-sky-300 shadow-xs">
                                    {upcomingDeadlines.length}
                                </span>
                            </div>

                            <div className="max-h-56 overflow-y-auto pr-1.5 custom-scrollbar space-y-2">
                                {upcomingDeadlines.length === 0 && (
                                    <p className="py-4 text-center text-xs text-slate-400">No upcoming deadlines.</p>
                                )}

                                {upcomingDeadlines.map((task) => {
                                    const dueDate = new Date(task.dueDate);
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    dueDate.setHours(0, 0, 0, 0);
                                    const daysLeft = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

                                    return (
                                        <div key={task._id} className="rounded-lg border border-[#1b3a5c] bg-[#0c1f38] p-2.5 shadow-xs transition hover:border-[#264d79]">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="truncate text-xs font-bold text-white">{task.title}</p>
                                                    <p className="mt-0.5 text-[10px] text-slate-400">Due {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                                                </div>
                                                <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold ${daysLeft <= 1 ? 'bg-rose-950/40 text-rose-300 border border-rose-800/50' : daysLeft <= 3 ? 'bg-amber-950/40 text-amber-300 border border-amber-800/50' : 'bg-sky-950/40 text-sky-300 border border-sky-800/50'}`}>
                                                    {daysLeft < 0 ? `${Math.abs(daysLeft)}d late` : daysLeft === 0 ? 'Today' : `${daysLeft}d left`}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="rounded-xl border border-[#1b3a5c] bg-[#081526]/90 p-3">
                            <div className="flex items-center justify-between gap-2 mb-2.5">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Activity</p>
                                <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300 shadow-xs">
                                    {recentUpdates.length}
                                </span>
                            </div>

                            <div className="max-h-56 overflow-y-auto pr-1.5 custom-scrollbar space-y-2">
                                {recentUpdates.length === 0 && (
                                    <p className="py-4 text-center text-xs text-slate-400">No recent updates.</p>
                                )}

                                {recentUpdates.map((task) => (
                                    <div key={task._id} className="rounded-lg border border-[#1b3a5c] bg-[#0c1f38] p-2.5 shadow-xs transition hover:border-[#264d79]">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="truncate text-xs font-bold text-white">{task.title}</p>
                                                <p className="mt-0.5 text-[10px] text-slate-400">
                                                    {new Date(task.updatedAt || task.createdAt).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                    })}
                                                </p>
                                            </div>
                                            <span className="rounded-md border border-indigo-500/30 bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-bold text-indigo-300 uppercase">
                                                {task.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </article>
            </section>
        </div>
    );
};

const MetricCard = ({ icon, label, value, tone = 'indigo' }) => {
    const tones = {
        indigo: { text: 'text-indigo-400', iconBg: 'bg-indigo-500/20 text-indigo-300' },
        sky: { text: 'text-sky-400', iconBg: 'bg-sky-500/20 text-sky-300' },
        amber: { text: 'text-amber-400', iconBg: 'bg-amber-500/20 text-amber-300' },
        emerald: { text: 'text-emerald-400', iconBg: 'bg-emerald-500/20 text-emerald-300' },
        rose: { text: 'text-rose-400', iconBg: 'bg-rose-500/20 text-rose-300' },
        slate: { text: 'text-slate-200', iconBg: 'bg-slate-700/50 text-slate-300' },
    };
    const t = tones[tone] || tones.indigo;

    return (
        <article className="rounded-xl border border-[#1b3a5c] bg-[#0c1f38] p-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#254d7a]">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
                <div className={`rounded-lg p-1.5 ${t.iconBg}`}>
                    {icon}
                </div>
            </div>
            <p className={`mt-1.5 text-2xl font-black ${t.text}`}>{value}</p>
        </article>
    );
};

const RiskItem = ({ label, count }) => {
    return (
        <li className="flex items-center justify-between rounded-xl border border-slate-700/60 bg-slate-900/50 px-3.5 py-2 text-xs font-semibold text-slate-200">
            <span>{label}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${count > 0 ? 'bg-rose-950/60 border border-rose-800/60 text-rose-300' : 'bg-slate-800 border border-slate-700 text-slate-400'}`}>
                {count}
            </span>
        </li>
    );
};

export default DashboardOverview;
