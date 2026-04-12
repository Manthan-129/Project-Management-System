import {
    AlertCircle, AlertTriangle, CalendarClock, CheckCircle2,
    Clock3, FolderKanban, Layers, ListTodo, Sparkles,
    Target, TrendingUp, Users, Moon, Sun,
} from 'lucide-react';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
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
    const [darkMode, setDarkMode] = useState(false);
    const [stats, setStats] = useState({
        totalTasks: 0, todo: 0, inProgress: 0, completed: 0, overDue: 0,
    });
    const [loading, setLoading] = useState(true);
    const [tasksLoading, setTasksLoading] = useState(false);

    const fetchTeams = async () => {
        try {
            const { data } = await axiosInstance.get('/teams/my-teams', { headers: authHeaders });
            if (!data?.success) {
                toast.error(data?.message || 'Failed to fetch teams');
                setTeams([]); setSelectedTeam(''); return;
            }
            const teamList = data.teams || [];
            setTeams(teamList);
            if (teamList.length > 0) setSelectedTeam((prev) => prev || teamList[0]._id);
            else setSelectedTeam('');
        } catch (error) {
            if (error?.response?.status === 401) { setToken(null); localStorage.removeItem('token'); }
            toast.error(error?.response?.data?.message || 'Unable to fetch teams');
            setTeams([]); setSelectedTeam('');
        } finally { setLoading(false); }
    };

    useEffect(() => { if (token) fetchTeams(); else setLoading(false); }, [token]);

    const fetchTasks = async () => {
        if (!selectedTeam) return;
        setTasksLoading(true);
        try {
            const { data } = await axiosInstance.get(`/tasks/team-task/${selectedTeam}`, { headers: authHeaders });
            if (!data?.success) {
                setAllTasks([]); setDeletedTasks([]); setTaskByMember({});
                setStats({ totalTasks: 0, todo: 0, inProgress: 0, completed: 0, overDue: 0 });
                toast.error(data?.message || 'Failed to fetch team tasks'); return;
            }
            setAllTasks(data.allTasks || []);
            setDeletedTasks(data.deletedTasks || []);
            setTaskByMember(data.taskByMember || {});
            const s = data.stats || {};
            setStats({
                totalTasks: s.total || 0,
                todo: s.byStatus?.todo || 0,
                inProgress: s.byStatus?.['in-progress'] || 0,
                completed: s.byStatus?.completed || 0,
                overDue: s.overDue || 0,
            });
        } catch (error) {
            setAllTasks([]); setDeletedTasks([]); setTaskByMember({});
            setStats({ totalTasks: 0, todo: 0, inProgress: 0, completed: 0, overDue: 0 });
            toast.error(error?.response?.data?.message || 'Unable to fetch team tasks');
        } finally { setTasksLoading(false); }
    };

    useEffect(() => { if (token && selectedTeam) fetchTasks(); }, [token, selectedTeam]);

    const todayFocus = useMemo(() => {
        const priorityRank = { High: 3, Medium: 2, Low: 1 };
        return [...allTasks]
            .filter((t) => t.status !== 'completed')
            .sort((a, b) => {
                const diff = (priorityRank[b.priority] || 0) - (priorityRank[a.priority] || 0);
                if (diff !== 0) return diff;
                const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
                const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
                return aDate - bDate;
            })
            .slice(0, 3);
    }, [allTasks]);

    const riskRadar = useMemo(() => {
        const now = new Date();
        return {
            overDue: allTasks.filter((t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed'),
            longReview: allTasks.filter((t) => t.status === 'in-review'),
            deleted: deletedTasks,
        };
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
                    name: `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.username || 'Member',
                    profilePicture: member.profilePicture,
                    active: Math.max(0, total - completed),
                    completed,
                    overDue: memberStats.overDue || 0,
                };
            })
            .filter((m) => m.id)
            .sort((a, b) => b.active - a.active);
    }, [taskByMember]);

    const upcomingDeadlines = useMemo(() => {
        const now = new Date();
        return [...allTasks]
            .filter((t) => t.dueDate && new Date(t.dueDate) > now && t.status !== 'completed')
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
            .slice(0, 5);
    }, [allTasks]);

    const recentUpdates = useMemo(() => {
        return [...allTasks]
            .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
            .slice(0, 6);
    }, [allTasks]);

    if (loading) return <Loading />;

    if (teams.length === 0) {
        return (
            <div className={`min-h-screen flex flex-col items-center justify-center gap-5 text-center px-5 transition-colors duration-300 ${darkMode ? 'bg-[#0d1117]' : 'bg-[#f0f4f8]'}`}>
                <div className={`w-16 h-16 flex items-center justify-center rounded-2xl ${darkMode ? 'bg-[#1a2d42] text-[#5b9bd5]' : 'bg-[#e9f0f8] text-[#315e8d]'}`}>
                    <FolderKanban size={36} />
                </div>
                <h2 className={`text-xl font-bold ${darkMode ? 'text-[#e6edf3]' : 'text-slate-800'}`}>
                    No team workspace yet.
                </h2>
                <p className={`text-sm max-w-xs leading-relaxed ${darkMode ? 'text-[#8b949e]' : 'text-slate-500'}`}>
                    Create a team first to unlock your new mission control dashboard.
                </p>
                <button
                    onClick={() => navigate('/dashboard/teams')}
                    className={`px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 ${darkMode ? 'bg-[#5b9bd5] hover:bg-[#4a80b8]' : 'bg-[#315e8d] hover:bg-[#26486d]'}`}
                >
                    Create a Team
                </button>
            </div>
        );
    }

    const metricCards = [
        { icon: <Layers size={16} />,       label: 'Total Tasks',  value: stats.totalTasks || 0, tone: darkMode ? 'text-slate-300' : 'text-slate-600' },
        { icon: <ListTodo size={16} />,      label: 'To-Do',        value: stats.todo || 0,       tone: 'text-blue-500' },
        { icon: <Clock3 size={16} />,        label: 'In Progress',  value: stats.inProgress || 0, tone: 'text-amber-500' },
        { icon: <CheckCircle2 size={16} />,  label: 'Completed',    value: stats.completed || 0,  tone: 'text-emerald-500' },
        { icon: <AlertTriangle size={16} />, label: 'Overdue',      value: stats.overDue || 0,    tone: 'text-red-500' },
        { icon: <AlertCircle size={16} />,   label: 'Deleted',      value: deletedTasks.length || 0, tone: darkMode ? 'text-slate-600' : 'text-slate-400' },
    ];

    // ── shared style helpers ──
    const dm = darkMode;
    const page    = `min-h-screen transition-colors duration-300 ${dm ? 'bg-[#0d1117]' : 'bg-[#f0f4f8]'}`;
    const card    = `rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-0.5 ${dm ? 'bg-[#161b22] border-[#2a3549] hover:border-[#334060]' : 'bg-white border-[#dbe5f1] hover:border-[#c8d9ee]'}`;
    const t1      = dm ? 'text-[#e6edf3]' : 'text-slate-900';
    const t2      = dm ? 'text-[#8b949e]' : 'text-slate-500';
    const iconBox = `w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0 ${dm ? 'bg-[#1a2d42]' : 'bg-[#e9f0f8]'}`;
    const iconClr = dm ? 'text-[#5b9bd5]' : 'text-[#315e8d]';
    const taskRow = `rounded-[13px] border px-3.5 py-3 transition-all duration-200 hover:translate-x-0.5 ${dm ? 'bg-[#1c2230] border-[#2a3549] hover:border-[#334060]' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`;
    const secLbl  = `text-[10px] font-bold uppercase tracking-widest mb-2 ${dm ? 'text-[#484f58]' : 'text-slate-400'}`;

    return (
        <div className={page}>
            {/* ─────────────────── HEADER SECTION ─────────────────── */}
            <section className="max-w-[1100px] mx-auto px-4 lg:px-6 pt-5 pb-3">
                <div className={`${card} animate-[fadeUp_.4s_ease_both]`}>
                    <div className="flex flex-wrap gap-4 items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1.5">
                                <Sparkles size={13} className={iconClr} />
                                <span className={`text-[10px] font-bold uppercase tracking-[.18em] ${iconClr}`}>
                                    Mission Control
                                </span>
                            </div>
                            <h1 className={`text-[clamp(16px,2.5vw,22px)] font-bold tracking-tight ${t1}`}>
                                Action-First Team Command Center
                            </h1>
                            <p className={`text-sm mt-1 ${t2}`}>
                                Different view: focus, risks, workload, and deadlines in one place.
                            </p>
                        </div>

                        <div className="flex items-center gap-2.5 flex-wrap">
                            {/* Dark / Light toggle */}
                            <button
                                onClick={() => setDarkMode((d) => !d)}
                                className={`flex items-center gap-2 text-xs font-semibold rounded-xl px-3.5 py-2 border transition-all duration-200 hover:scale-105 active:scale-95 ${dm ? 'bg-[#1e2a3a] border-[#2a3549] text-[#8b949e] hover:border-[#5b9bd5] hover:text-[#5b9bd5]' : 'bg-[#edf3fa] border-[#dbe5f1] text-slate-500 hover:border-[#315e8d] hover:text-[#315e8d]'}`}
                            >
                                {dm ? <Sun size={14} /> : <Moon size={14} />}
                                {dm ? 'Light' : 'Dark'}
                            </button>

                            <div>
                                <p className={`text-[10px] font-bold uppercase tracking-wide mb-1.5 ${t2}`}>
                                    Current Team
                                </p>
                                <select
                                    value={selectedTeam}
                                    onChange={(e) => setSelectedTeam(e.target.value)}
                                    className={`text-sm font-semibold rounded-xl px-3 py-2 appearance-none cursor-pointer outline-none transition-all duration-200 focus:ring-2 ${dm ? 'bg-[#1e2a3a] border border-[#2a3549] text-[#5b9bd5] focus:ring-[#5b9bd5]/25' : 'bg-[#edf3fa] border border-[#dbe5f1] text-[#315e8d] focus:ring-[#315e8d]/25'}`}
                                >
                                    {teams.map((item) => (
                                        <option key={item._id} value={item._id}>{item.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {tasksLoading && (
                <p className={`text-center text-sm animate-pulse py-1 ${t2}`}>
                    Loading team tasks...
                </p>
            )}

            {/* ─────────────────── METRIC CARDS SECTION ─────────────────── */}
            <section className="max-w-[1100px] mx-auto px-4 lg:px-6 py-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                    {metricCards.map((card_item, i) => (
                        <MetricCard
                            key={card_item.label}
                            icon={card_item.icon}
                            label={card_item.label}
                            value={card_item.value}
                            tone={card_item.tone}
                            darkMode={dm}
                            delay={i}
                        />
                    ))}
                </div>
            </section>

            {/* ─────────────────── FOCUS + RISK SECTION ─────────────────── */}
            <section className="max-w-[1100px] mx-auto px-4 lg:px-6 py-3 grid grid-cols-1 lg:grid-cols-2 gap-3">

                {/* Today Focus */}
                <article className={`${card} [animation:fadeUp_.45s_ease_.1s_both]`}>
                    <div className="flex items-center gap-2.5 mb-4">
                        <div className={iconBox}><Target size={16} className={iconClr} /></div>
                        <h2 className={`text-[15px] font-bold ${t1}`}>Today Focus</h2>
                    </div>

                    <div className="space-y-2.5">
                        {todayFocus.length === 0 && (
                            <p className={`text-sm ${t2}`}>No active focus items right now.</p>
                        )}

                        {todayFocus.map((task, i) => (
                            <div
                                key={task._id}
                                className={taskRow}
                                style={{ animationDelay: `${(i + 1) * 80}ms` }}
                            >
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                    <h3 className={`text-[13px] font-semibold truncate ${t1}`}>
                                        {task.title}
                                    </h3>
                                    <span className={`text-[10px] font-bold rounded-md px-2 py-0.5 shrink-0 ${
                                        task.priority === 'High'
                                            ? dm ? 'bg-red-900/40 text-red-400' : 'bg-red-100 text-red-700'
                                            : task.priority === 'Medium'
                                            ? dm ? 'bg-amber-900/40 text-amber-400' : 'bg-amber-100 text-amber-700'
                                            : dm ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                        {task.priority}
                                    </span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className={`flex items-center gap-1 text-[11px] ${t2}`}>
                                        <Users size={11} /> {task.assignedTo?.firstName || 'Member'}
                                    </span>

                                    {task.dueDate && (
                                        <span className={`flex items-center gap-1 text-[11px] ${t2}`}>
                                            <CalendarClock size={11} />
                                            {new Date(task.dueDate).toLocaleDateString('en-US', {
                                                month: 'short', day: 'numeric',
                                            })}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </article>

                {/* Risk Radar */}
                <article className={`${card} [animation:fadeUp_.45s_ease_.18s_both]`}>
                    <div className="flex items-center gap-2.5 mb-4">
                        <div className={iconBox}>
                            <AlertCircle size={16} className={iconClr} />
                        </div>
                        <h2 className={`text-[15px] font-bold ${t1}`}>Risk Radar</h2>
                    </div>
                    <ul className="space-y-2.5">
                        <RiskItem label="Overdue Tasks"   count={riskRadar.overDue.length}   tone="red"   darkMode={dm} />
                        <RiskItem label="In Review Queue" count={riskRadar.longReview.length} tone="amber" darkMode={dm} />
                        <RiskItem label="Deleted Tasks"   count={riskRadar.deleted.length}   tone="blue"  darkMode={dm} />
                    </ul>
                </article>
            </section>

            {/* ─────────────────── WORKLOAD + DEADLINES SECTION ─────────────────── */}
            <section className="max-w-[1100px] mx-auto px-4 lg:px-6 pt-0 pb-6 grid grid-cols-1 lg:grid-cols-2 gap-3">

                {/* Team Workload */}
                <article className={`${card} [animation:fadeUp_.45s_ease_.26s_both]`}>
                    <div className="flex items-center gap-2.5 mb-4">
                        <div className={iconBox}><TrendingUp size={16} className={iconClr} /></div>
                        <h3 className={`text-[15px] font-bold ${t1}`}>Team Workload Snapshot</h3>
                    </div>

                    <div className="space-y-4">
                        {memberLoad.length === 0 && (
                            <p className={`text-sm ${t2}`}>No workload data available.</p>
                        )}
                        {memberLoad.map((member) => (
                            <div key={member.id}>
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className={`text-[13px] font-semibold ${t1}`}>{member.name}</span>
                                    <span className={`text-[11px] ${t2}`}>
                                        {member.completed} done / {member.active} active
                                    </span>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className={`text-xs font-semibold ${t2}`}>Load Progress</span>
                                        <span className={`text-xs font-bold ${t1}`}>
                                            {Math.min(100, Math.round((member.active / 8) * 100))}%
                                        </span>
                                    </div>
                                    <div className={`h-2 rounded-full overflow-hidden ${dm ? 'bg-[#2a3549]' : 'bg-slate-200'}`}>
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ease-out ${
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
                </article>

                {/* Deadlines + Recent Updates */}
                <article className={`${card} space-y-5 [animation:fadeUp_.45s_ease_.34s_both]`}>
                    <div className="flex items-center gap-2.5">
                        <div className={iconBox}><CalendarClock size={16} className={iconClr} /></div>
                        <h2 className={`text-[15px] font-bold ${t1}`}>Deadlines and Recent Updates</h2>
                    </div>

                    <div>
                        <p className={secLbl}>Upcoming Deadlines</p>
                        <div className="space-y-1.5">
                            {upcomingDeadlines.length === 0 && (
                                <p className={`text-sm ${t2}`}>No upcoming deadlines.</p>
                            )}
                            {upcomingDeadlines.map((task) => (
                                <div key={task._id} className="flex items-center justify-between text-[12px]">
                                    <span className={`font-medium truncate mr-3 ${t1}`}>{task.title}</span>
                                    <span className={`font-medium shrink-0 ${t2}`}>
                                        {new Date(task.dueDate).toLocaleDateString('en-US', {
                                            month: 'short', day: 'numeric',
                                        })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <p className={secLbl}>Recent Updates</p>
                        <div className="space-y-1.5">
                            {recentUpdates.length === 0 && (
                                <p className={`text-sm ${t2}`}>No recent updates.</p>
                            )}
                            {recentUpdates.map((task) => (
                                <div key={task._id} className="flex items-center justify-between text-[12px]">
                                    <span className={`font-medium truncate mr-2 ${t1}`}>{task.title}</span>
                                    <span className={`shrink-0 text-[10px] font-semibold rounded-md px-2 py-0.5 ${
                                        task.status === 'completed'  ? dm ? 'bg-emerald-900/40 text-emerald-400' : 'bg-green-100 text-green-700'
                                        : task.status === 'in-progress' ? dm ? 'bg-amber-900/40 text-amber-400' : 'bg-amber-100 text-amber-700'
                                        : task.status === 'in-review'   ? dm ? 'bg-purple-900/40 text-purple-400' : 'bg-purple-100 text-purple-700'
                                        : dm ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                        {task.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </article>
            </section>
        </div>
    );
};

/* ──────────────────── SUB-COMPONENTS ──────────────────── */

const MetricCard = ({ icon, label, value, tone, darkMode, delay }) => {
    return (
        <article
            className={`rounded-2xl border px-3.5 py-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] cursor-default [animation:fadeUp_.4s_ease_both] ${
                darkMode
                    ? 'bg-[#161b22] border-[#2a3549] hover:border-[#334060]'
                    : 'bg-white border-[#dbe5f1] hover:border-[#c8d9ee]'
            }`}
            style={{ animationDelay: `${delay * 55}ms` }}
        >
            <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.06em] mb-2 ${tone}`}>
                {icon} {label}
            </div>
            <p className={`text-[clamp(20px,2.5vw,28px)] font-bold leading-none ${tone}`}>{value}</p>
        </article>
    );
};

const RiskItem = ({ label, count, tone, darkMode }) => {
    const dm = darkMode;

    const styles = {
        red:   dm ? 'bg-[#2a1515] border-[#6b2020]' : 'bg-red-50 border-red-200',
        amber: dm ? 'bg-[#2a1f0e] border-[#7a4f10]' : 'bg-amber-50 border-amber-200',
        blue:  dm ? 'bg-[#0f1f35] border-[#1e4070]' : 'bg-blue-50 border-blue-200',
    };
    const labelColor = {
        red:   dm ? 'text-red-400'    : 'text-red-700',
        amber: dm ? 'text-amber-400'  : 'text-amber-700',
        blue:  dm ? 'text-blue-400'   : 'text-blue-700',
    };
    const badgeStyle = {
        red:   dm ? 'bg-red-900/40 text-red-400'     : 'bg-red-100 text-red-700',
        amber: dm ? 'bg-amber-900/40 text-amber-400' : 'bg-amber-100 text-amber-700',
        blue:  dm ? 'bg-blue-900/40 text-blue-400'   : 'bg-blue-100 text-blue-700',
    };

    return (
        <li className={`rounded-xl border px-4 py-3 flex items-center justify-between transition-all duration-200 hover:translate-x-0.5 ${styles[tone]}`}>
            <span className={`text-[13px] font-semibold ${labelColor[tone]}`}>{label}</span>
            <span className={`text-[13px] font-bold rounded-lg px-2.5 py-0.5 ${badgeStyle[tone]}`}>{count}</span>
        </li>
    );
};

export default DashboardOverview;