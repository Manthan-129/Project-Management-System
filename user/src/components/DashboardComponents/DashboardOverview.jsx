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
    const { token, setToken, navigate } = useContext(AppContext);

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

    const authHeaders = useMemo(() => ({ token }), [token]);

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
            <div>
                <div>
                    <FolderKanban size={36} />
                </div>
                <h2>No team workspace yet.</h2>
                <p>Create a team first to unlock your new mission control dashboard.</p>
                <button onClick={() => navigate('/dashboard/teams')}>Create a Team</button>
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
        <div>
            <section>
                <div>
                    <div>
                        <div>
                            <Sparkles size={16} />
                            <span>Mission Control</span>
                        </div>
                        <h1>Action-First Team Command Center</h1>
                        <p>Different view: focus, risks, workload, and deadlines in one place.</p>
                    </div>
                    <div>
                        <p>Current Team</p>
                        <select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)}>
                            {teams.map((item) => (
                                <option key={item._id} value={item._id}>
                                    {item.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </section>

            {tasksLoading && <p>Loading team tasks...</p>}

            <section>
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

            <section>
                <article>
                    <div>
                        <Target size={18} />
                        <h2>Today Focus</h2>
                    </div>

                    <div>
                        {todayFocus.length === 0 && <p>No active focus items right now.</p>}

                        {todayFocus.map((task) => (
                            <div key={task._id}>
                                <div>
                                    <h3>{task.title}</h3>
                                    <span>{task.priority}</span>
                                </div>

                                <div>
                                    <span>
                                        <Users size={12} /> {task.assignedTo?.firstName || 'Member'}
                                    </span>

                                    {task.dueDate && (
                                        <span>
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

                <article>
                    <div>
                        <div>
                            <AlertCircle size={18} />
                            <h2>Risk Radar</h2>
                        </div>
                        <ul>
                            <RiskItem label="Overdue Tasks" count={riskRadar.overDue.length} tone="red" />
                            <RiskItem label="In Review Queue" count={riskRadar.longReview.length} tone="amber" />
                            <RiskItem label="Deleted Tasks" count={riskRadar.deleted.length} tone="blue" />
                        </ul>
                    </div>
                </article>
            </section>

            <section>
                <article>
                    <div>
                        <div>
                            <TrendingUp size={18} />
                            <h3>Team Workload Snapshot</h3>
                        </div>
                        <div>
                            {memberLoad.length === 0 && <p>No workload data available.</p>}
                            {memberLoad.map((member) => (
                                <div key={member.id}>
                                    <div>
                                        <span>{member.name}</span>
                                        <span>
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

                <article>
                    <div>
                        <CalendarClock size={18} />
                        <h2>Deadlines and Recent Updates</h2>
                    </div>

                    <div>
                        <p>Upcoming Deadlines</p>
                        <div>
                            {upcomingDeadlines.length === 0 && <p>No upcoming deadlines.</p>}
                            {upcomingDeadlines.map((task) => (
                                <div key={task._id}>
                                    <span>{task.title}</span>
                                    <span>
                                        {new Date(task.dueDate).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <p>Recent Updates</p>
                        <div>
                            {recentUpdates.length === 0 && <p>No recent updates.</p>}
                            {recentUpdates.map((task) => (
                                <div key={task._id}>
                                    <span>{task.title}</span>
                                    <span>{task.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </article>
            </section>
        </div>
    );
};

const MetricCard = ({ icon, label, value }) => {
    return (
        <article>
            <div>
                {icon} {label}
            </div>
            <p>{value}</p>
        </article>
    );
};

const RiskItem = ({ label, count, tone }) => {
    const toneClass =
        tone === 'red'
            ? 'bg-red-50 border-red-200 text-red-700'
            : tone === 'amber'
              ? 'bg-amber-50 border-amber-200 text-amber-700'
              : 'bg-blue-50 border-blue-200 text-blue-700';

    return (
        <li className={`rounded-xl border px-3 py-2 flex items-center justify-between ${toneClass}`}>
            <span>{label}</span>
            <span>{count}</span>
        </li>
    );
};

export default DashboardOverview;
