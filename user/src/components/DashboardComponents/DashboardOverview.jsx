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
import { useContext, useEffect, useMemo, useState } from 'react';
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

    const fetchTeams = async () => {
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
            }
            toast.error(error?.response?.data?.message || 'Unable to fetch teams');
            setTeams([]);
            setSelectedTeam('');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchTeams();
        } else {
            setLoading(false);
        }
    }, [token]);

    const fetchTasks = async () => {
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
            setAllTasks([]);
            setDeletedTasks([]);
            setTaskByMember({});
            setStats({ totalTasks: 0, todo: 0, inProgress: 0, completed: 0, overDue: 0 });
            toast.error(error?.response?.data?.message || 'Unable to fetch team tasks');
        } finally {
            setTasksLoading(false);
        }
    };

    useEffect(() => {
        if (token && selectedTeam) {
            fetchTasks();
        }
    }, [token, selectedTeam]);

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
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-[#315e8d]">
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
            tone: 'text-slate-700',
        },
        {
            icon: <ListTodo size={16} />,
            label: 'To-Do',
            value: stats.todo || 0,
            tone: 'text-blue-600',
        },
        {
            icon: <Clock3 size={16} />,
            label: 'In Progress',
            value: stats.inProgress || 0,
            tone: 'text-yellow-600',
        },
        {
            icon: <CheckCircle2 size={16} />,
            label: 'Completed',
            value: stats.completed || 0,
            tone: 'text-green-600',
        },
        {
            icon: <AlertTriangle size={16} />,
            label: 'Overdue',
            value: stats.overDue || 0,
            tone: 'text-red-600',
        },
        {
            icon: <AlertCircle size={16} />,
            label: 'Deleted',
            value: deletedTasks.length || 0,
            tone: 'text-slate-500',
        },
    ];

    return (
        <div className="space-y-6">
            <section className="dd-section-card">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div className="space-y-3">
                        <div className="dd-page-kicker w-fit">
                            <Sparkles size={14} />
                            <span>Mission Control</span>
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900">Action-First Team Command Center</h1>
                        <p className="text-sm text-slate-600">Focus, risks, workload, and deadlines in one place.</p>
                    </div>
                    <div className="min-w-[240px] rounded-[1.35rem] border border-slate-200/80 bg-slate-50/80 p-3 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
                        <div className="mb-2 flex items-center justify-between gap-2">
                            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Current Team</p>
                            <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-1 text-[10px] font-semibold text-[#315e8d]">
                                Workspace
                            </span>
                        </div>
                        <select className="dd-select !border-blue-200 !bg-white !px-4 !py-3 !text-[15px] !font-semibold !text-slate-800 !shadow-[0_12px_30px_rgba(49,94,141,0.08)]" value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)}>
                            {teams.map((item) => (
                                <option key={item._id} value={item._id}>
                                    {item.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </section>

            {tasksLoading && <p className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">Loading team tasks...</p>}

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
                        <Target size={18} />
                        <h2>Today Focus</h2>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {todayFocus.length === 0 && <p className="text-sm text-slate-500">No active focus items right now.</p>}

                        {todayFocus.map((task) => (
                            <div key={task._id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                                <div className="flex items-start justify-between gap-2">
                                    <h3 className="font-semibold text-slate-900">{task.title}</h3>
                                    <span className="dd-badge border-slate-200 bg-white text-slate-700">{task.priority}</span>
                                </div>

                                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                                    <span className="inline-flex items-center gap-1">
                                        <Users size={12} /> {task.assignedTo?.firstName || 'Member'}
                                    </span>

                                    {task.dueDate && (
                                        <span className="inline-flex items-center gap-1">
                                            <CalendarClock size={12} />
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
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <AlertCircle size={18} />
                            <h2>Risk Radar</h2>
                        </div>
                        <ul className="space-y-2">
                            <RiskItem label="Overdue Tasks" count={riskRadar.overDue.length} />
                            <RiskItem label="In Review Queue" count={riskRadar.longReview.length} />
                            <RiskItem label="Deleted Tasks" count={riskRadar.deleted.length} />
                        </ul>
                    </div>
                </article>
            </section>

            <section className="grid gap-4 xl:grid-cols-2">
                <article className="dd-section-card">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <TrendingUp size={18} />
                            <h3>Team Workload Snapshot</h3>
                        </div>
                        <div className="space-y-3">
                            {memberLoad.length === 0 && <p className="text-sm text-slate-500">No workload data available.</p>}
                            {memberLoad.map((member) => (
                                <div key={member.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-semibold text-slate-900">{member.name}</span>
                                        <span className="text-xs font-medium text-slate-600">
                                            {member.completed} done / {member.active} active
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold text-gray-600">Load Progress</span>
                                            <span className="text-xs font-bold text-gray-700">
                                                {Math.min(100, Math.round((member.active / 8) * 100))}%
                                            </span>
                                        </div>
                                        <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-300 ${
                                                    member.active >= 6
                                                        ? 'bg-red-500'
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
                    </div>
                </article>

                <article className="dd-section-card">
                    <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 pb-4">
                        <div>
                            <div className="flex items-center gap-2 text-sm font-semibold text-[#315e8d]">
                                <CalendarClock size={18} />
                                <span>Deadlines and Recent Updates</span>
                            </div>
                            <p className="mt-1 text-sm text-slate-500">Keep an eye on what is due soon and what changed most recently.</p>
                        </div>
                        <span className="dd-badge border-blue-200 bg-blue-50 text-[#315e8d]">{upcomingDeadlines.length + recentUpdates.length} items</span>
                    </div>

                    <div className="mt-5 grid gap-4 xl:grid-cols-2">
                        <div className="rounded-[1.25rem] border border-blue-100 bg-blue-50/60 p-4">
                            <div className="flex items-center justify-between gap-2">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-500">Upcoming Deadlines</p>
                                    <h3 className="mt-1 text-base font-bold text-slate-900">Tasks due soon</h3>
                                </div>
                                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#315e8d] shadow-sm">
                                    {upcomingDeadlines.length}
                                </span>
                            </div>

                            <div className="mt-4 space-y-2">
                                {upcomingDeadlines.length === 0 && (
                                    <div className="rounded-xl border border-dashed border-blue-200 bg-white px-3 py-4 text-sm text-slate-500">
                                        No upcoming deadlines.
                                    </div>
                                )}

                                {upcomingDeadlines.map((task) => {
                                    const dueDate = new Date(task.dueDate);
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    dueDate.setHours(0, 0, 0, 0);
                                    const daysLeft = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

                                    return (
                                        <div key={task._id} className="rounded-xl border border-white bg-white px-3 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(49,94,141,0.08)]">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="truncate font-semibold text-slate-900">{task.title}</p>
                                                    <p className="mt-1 text-xs text-slate-500">Due on {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                                                </div>
                                                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${daysLeft <= 1 ? 'bg-rose-50 text-rose-600' : daysLeft <= 3 ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-[#315e8d]'}`}>
                                                    {daysLeft < 0 ? `${Math.abs(daysLeft)}d late` : daysLeft === 0 ? 'Today' : `${daysLeft}d left`}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/80 p-4">
                            <div className="flex items-center justify-between gap-2">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Recent Updates</p>
                                    <h3 className="mt-1 text-base font-bold text-slate-900">Latest activity</h3>
                                </div>
                                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                                    {recentUpdates.length}
                                </span>
                            </div>

                            <div className="mt-4 space-y-2">
                                {recentUpdates.length === 0 && (
                                    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-4 text-sm text-slate-500">
                                        No recent updates.
                                    </div>
                                )}

                                {recentUpdates.map((task) => (
                                    <div key={task._id} className="rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate font-semibold text-slate-900">{task.title}</p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    Updated {new Date(task.updatedAt || task.createdAt).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                    })}
                                                </p>
                                            </div>
                                            <span className="dd-badge border-blue-200 bg-blue-50 text-[#315e8d]">{task.status}</span>
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

const MetricCard = ({ icon, label, value }) => {
    return (
        <article className="dd-section-card p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {icon} {label}
            </div>
            <p className="mt-3 text-3xl font-black text-slate-900">{value}</p>
        </article>
    );
};

const RiskItem = ({ label, count }) => {
    return (
        <li className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/70 px-3 py-2 text-blue-700">
            <span>{label}</span>
            <span>{count}</span>
        </li>
    );
};

export default DashboardOverview;
