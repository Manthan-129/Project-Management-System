import {
    AlertCircle,
    ArrowLeft,
    ArrowRightLeft,
    BarChart3,
    CalendarDays,
    CheckCircle2,
    ClipboardList,
    Clock,
    Crown,
    ExternalLink,
    Filter,
    FolderKanban,
    GitPullRequest,
    Plus,
    Shield,
    Sparkles,
    Target,
    UserMinus,
    UserPlus,
    Users,
    X,
} from 'lucide-react';
import { useContext, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api/axiosInstance.js';
import { AppContext } from '../../context/AppContext.jsx';
import Loading from '../LoadingPage.jsx';

const COLUMNS = [
  { key: 'todo',        label: 'To Do',       icon: ClipboardList, color: 'border-slate-300 bg-slate-50',   iconBg: 'bg-slate-100',   iconColor: 'text-slate-500' },
  { key: 'in-progress', label: 'In Progress',  icon: Clock,         color: 'border-blue-200 bg-blue-50',     iconBg: 'bg-blue-100',    iconColor: 'text-blue-500' },
  { key: 'in-review',   label: 'In Review',    icon: GitPullRequest,color: 'border-amber-200 bg-amber-50',   iconBg: 'bg-amber-100',   iconColor: 'text-amber-500' },
  { key: 'completed',   label: 'Done',         icon: CheckCircle2,  color: 'border-emerald-200 bg-emerald-50',iconBg: 'bg-emerald-100', iconColor: 'text-emerald-500' },
  { key: 'deleted',     label: 'Deleted',      icon: AlertCircle,   color: 'border-red-200 bg-red-50',       iconBg: 'bg-red-100',     iconColor: 'text-red-400' },
];

const PRIORITIES = ['all', 'low', 'medium', 'high'];
const TASK_STATUSES = ['todo', 'in-progress', 'in-review', 'completed'];

const emptyBoard = () => ({
  todo: [],
  'in-progress': [],
  'in-review': [],
  completed: [],
  deleted: [],
});

const emptyTaskForm = {
  title: '',
  description: '',
  priority: 'medium',
  dueDate: '',
  assignedTo: '',
};

const emptyInviteForm = { username: '', message: '' };
const emptyPrForm = { githubPRLink: '', message: '' };

const capitalizePriority = (priority) => {
  if (!priority) return 'Medium';
  return priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
};

const TeamDetails = () => {
  const { teamId } = useParams();
  const { token, setToken, user, navigate, authHeaders } = useContext(AppContext);

  const [team, setTeam] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [kanbanBoard, setKanbanBoard] = useState(emptyBoard());
  const [teamStats, setTeamStats] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [pullRequests, setPullRequests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [progressLoading, setProgressLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('board');
  const [filterMember, setFilterMember] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [prFilter, setPrFilter] = useState('all');

  const [showCreateTask, setShowCreateTask] = useState(false);
  const [taskForm, setTaskForm] = useState(emptyTaskForm);
  const [editingTask, setEditingTask] = useState(null);
  const [editingTaskForm, setEditingTaskForm] = useState(emptyTaskForm);

  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState(emptyInviteForm);

  const [showPRModal, setShowPRModal] = useState(false);
  const [selectedTaskForPR, setSelectedTaskForPR] = useState(null);
  const [prForm, setPrForm] = useState(emptyPrForm);
  const [reviewingPR, setReviewingPR] = useState(null);
  const [reviewNote, setReviewNote] = useState('');

  const [showTransfer, setShowTransfer] = useState(false);
  const [transferTarget, setTransferTarget] = useState(null);

  const teamLeader = team?.leader || null;

  const visibleMembers = useMemo(() => {
    const currentMembers = Array.isArray(teamMembers) ? teamMembers : [];
    if (!teamLeader) return currentMembers;
    return [
      { user: teamLeader, role: 'leader' },
      ...currentMembers.filter((member) => member?.user?._id !== teamLeader._id),
    ];
  }, [teamLeader, teamMembers]);

  const isLeader = teamLeader?._id === user?._id;
  const isAdmin = visibleMembers.some(
    (member) => member?.user?._id === user?._id && member.role === 'admin'
  );
  const canManage = isLeader || isAdmin;

  const filteredBoard = useMemo(() => {
    const result = emptyBoard();
    COLUMNS.forEach((column) => {
      result[column.key] = (kanbanBoard[column.key] || []).filter((task) => {
        const assignedToId = task?.assignedTo?._id || task?.assignedTo;
        const priority = (task?.priority || '').toLowerCase();
        if (filterMember !== 'all' && assignedToId !== filterMember) return false;
        if (filterPriority !== 'all' && priority !== filterPriority) return false;
        return true;
      });
    });
    return result;
  }, [filterMember, filterPriority, kanbanBoard]);

  const totalFilteredTasks = useMemo(
    () => COLUMNS.reduce((total, column) => total + (filteredBoard[column.key]?.length || 0), 0),
    [filteredBoard]
  );

  const combinedPullRequests = useMemo(() => {
    return prFilter === 'all' ? pullRequests : pullRequests.filter((pr) => pr.status === prFilter);
  }, [pullRequests, prFilter]);

  const fetchTeam = async () => {
    const { data } = await api.get(`/teams/${teamId}`, { headers: authHeaders });
    if (!data?.success) throw new Error(data?.message || 'Failed to fetch team');
    setTeam(data.team);
  };

  const fetchMembers = async () => {
    const { data } = await api.get(`/teams/all-members/${teamId}`, { headers: authHeaders });
    if (!data?.success) throw new Error(data?.message || 'Failed to fetch members');
    setTeamMembers(Array.isArray(data.members) ? data.members : []);
    setTeam((prev) => (prev ? { ...prev, leader: data.leader || prev.leader } : prev));
  };

  const fetchTasks = async () => {
    const { data } = await api.get(`/tasks/team-task/${teamId}`, { headers: authHeaders });
    if (!data?.success) throw new Error(data?.message || 'Failed to fetch tasks');
    setKanbanBoard(data.kanbanBoard || emptyBoard());
    setTeamStats(data.stats || null);
  };

  const fetchProgress = async () => {
    setProgressLoading(true);
    try {
      const { data } = await api.get(`/tasks/team-member-progress/${teamId}`, { headers: authHeaders });
      if (!data?.success) { toast.error(data?.message || 'Failed to fetch progress'); setProgressData(null); return; }
      setProgressData(data);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to fetch progress');
      setProgressData(null);
    } finally {
      setProgressLoading(false);
    }
  };

  const fetchPullRequests = async () => {
    const statuses = ['pending', 'accepted', 'rejected'];
    const responses = await Promise.all(
      statuses.map((status) => api.get(`/pull-requests/team/${teamId}`, { headers: authHeaders, params: { status } }))
    );
    const merged = [];
    const seen = new Set();
    responses.forEach((response) => {
      (response?.data?.pullRequests || []).forEach((pr) => {
        if (!seen.has(pr._id)) { seen.add(pr._id); merged.push(pr); }
      });
    });
    setPullRequests(merged);
  };

  const loadAll = async () => {
    if (!token || !teamId) return;
    setLoading(true);
    try {
      await Promise.all([fetchTeam(), fetchMembers(), fetchTasks(), fetchPullRequests()]);
    } catch (error) {
      if (error?.response?.status === 401) { setToken(null); localStorage.removeItem('token'); }
      toast.error(error?.response?.data?.message || error.message || 'Unable to load team details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && teamId) loadAll();
    else setLoading(false);
  }, [token, teamId]);

  useEffect(() => {
    if (activeTab === 'progress' && token && teamId && !progressData) fetchProgress();
  }, [activeTab, token, teamId, progressData]);

  const refreshTaskData = async () => {
    await Promise.all([fetchTasks(), fetchPullRequests()]);
    if (activeTab === 'progress') await fetchProgress();
  };

  const handleCreateTask = async (event) => {
    event.preventDefault();
    try {
      const { data } = await api.post(
        `/tasks/create/${teamId}/${taskForm.assignedTo}`,
        { title: taskForm.title.trim(), description: taskForm.description.trim(), priority: capitalizePriority(taskForm.priority), dueDate: taskForm.dueDate || undefined },
        { headers: authHeaders }
      );
      if (!data?.success) { toast.error(data?.message || 'Failed to create task'); return; }
      toast.success(data?.message || 'Task created successfully');
      setShowCreateTask(false); setTaskForm(emptyTaskForm);
      await refreshTaskData();
    } catch (error) { toast.error(error?.response?.data?.message || 'Unable to create task'); }
  };

  const updateTaskStatus = async (taskId, status) => {
    try {
      const { data } = await api.patch(`/tasks/update-status/${taskId}`, { status }, { headers: authHeaders });
      if (!data?.success) { toast.error(data?.message || 'Failed to update task status'); return; }
      toast.success(data?.message || 'Task status updated');
      await refreshTaskData();
    } catch (error) { toast.error(error?.response?.data?.message || 'Unable to update task status'); }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      const { data } = await api.put(`/tasks/${taskId}`, {}, { headers: authHeaders });
      if (!data?.success) { toast.error(data?.message || 'Failed to delete task'); return; }
      toast.success(data?.message || 'Task deleted');
      await refreshTaskData();
    } catch (error) { toast.error(error?.response?.data?.message || 'Unable to delete task'); }
  };

  const restoreTask = async (taskId) => {
    try {
      const { data } = await api.patch(`/tasks/restore/${taskId}`, {}, { headers: authHeaders });
      if (!data?.success) { toast.error(data?.message || 'Failed to restore task'); return; }
      toast.success(data?.message || 'Task restored');
      await refreshTaskData();
    } catch (error) { toast.error(error?.response?.data?.message || 'Unable to restore task'); }
  };

  const extendedDueDate = async (taskId, currentDueDate) => {
    const baseDate = currentDueDate ? new Date(currentDueDate) : new Date();
    const nextDate = new Date(baseDate);
    nextDate.setDate(nextDate.getDate() + 1);
    const dueDate = nextDate.toISOString().slice(0, 10);
    try {
      const { data } = await api.put(`/tasks/update/${taskId}`, { dueDate }, { headers: authHeaders });
      if (!data?.success) { toast.error(data?.message || 'Failed to extend due date'); return; }
      toast.success(data?.message || 'Due date extended');
      await refreshTaskData();
    } catch (error) { toast.error(error?.response?.data?.message || 'Unable to extend due date'); }
  };

  const openEditTaskModal = (task) => {
    setEditingTask(task);
    setEditingTaskForm({
      title: task.title || '',
      description: task.description || '',
      priority: (task.priority || 'medium').toLowerCase(),
      dueDate: task.dueDate ? String(task.dueDate).slice(0, 10) : '',
      assignedTo: task.assignedTo?._id || '',
    });
  };

  const updateTaskDetails = async (event) => {
    event.preventDefault();
    if (!editingTask?._id) return;
    try {
      const { data } = await api.put(
        `/tasks/update/${editingTask._id}`,
        { title: editingTaskForm.title.trim(), description: editingTaskForm.description.trim(), priority: capitalizePriority(editingTaskForm.priority), dueDate: editingTaskForm.dueDate || null, assignedTo: editingTaskForm.assignedTo || undefined },
        { headers: authHeaders }
      );
      if (!data?.success) { toast.error(data?.message || 'Failed to update task'); return; }
      toast.success(data?.message || 'Task updated successfully');
      setEditingTask(null); setEditingTaskForm(emptyTaskForm);
      await refreshTaskData();
    } catch (error) { toast.error(error?.response?.data?.message || 'Unable to update task'); }
  };

  const handleSubmitPR = async (event) => {
    event.preventDefault();
    if (!selectedTaskForPR) return;
    try {
      const { data } = await api.post(
        `/pull-requests/create/${selectedTaskForPR}`,
        { githubPRLink: prForm.githubPRLink.trim(), message: prForm.message.trim() },
        { headers: authHeaders }
      );
      if (!data?.success) { toast.error(data?.message || 'Failed to submit PR'); return; }
      toast.success(data?.message || 'Pull request submitted');
      setShowPRModal(false); setSelectedTaskForPR(null); setPrForm(emptyPrForm);
      await refreshTaskData();
    } catch (error) { toast.error(error?.response?.data?.message || 'Unable to submit PR'); }
  };

  const handleReviewPR = async (prId, status) => {
    try {
      const { data } = await api.post(`/pull-requests/review/${prId}`, { status, reviewNote }, { headers: authHeaders });
      if (!data?.success) { toast.error(data?.message || 'Failed to review pull request'); return; }
      toast.success(data?.message || 'Pull request reviewed');
      setReviewingPR(null); setReviewNote('');
      await refreshTaskData();
    } catch (error) { toast.error(error?.response?.data?.message || 'Unable to review PR'); }
  };

  const handleInvite = async (event) => {
    event.preventDefault();
    try {
      const { data } = await api.post(
        `/teams/invitations/send/${teamId}`,
        { username: inviteForm.username.trim(), message: inviteForm.message.trim() },
        { headers: authHeaders }
      );
      if (!data?.success) { toast.error(data?.message || 'Failed to send invitation'); return; }
      toast.success(data?.message || 'Invitation sent');
      setInviteForm(emptyInviteForm); setShowInvite(false);
    } catch (error) { toast.error(error?.response?.data?.message || 'Unable to send invitation'); }
  };

  const changeRole = async (memberId, role) => {
    try {
      const { data } = await api.patch(`/teams/change-role/${teamId}/${memberId}`, { role }, { headers: authHeaders });
      if (!data?.success) { toast.error(data?.message || 'Failed to change role'); return; }
      toast.success(data?.message || 'Role updated');
      await fetchMembers();
    } catch (error) { toast.error(error?.response?.data?.message || 'Unable to change role'); }
  };

  const handleTransferLeadership = async () => {
    if (!transferTarget?._id) return;
    try {
      const { data } = await api.post(`/teams/transfer-leadership/${teamId}/${transferTarget._id}`, {}, { headers: authHeaders });
      if (!data?.success) { toast.error(data?.message || 'Failed to transfer leadership'); return; }
      toast.success(data?.message || 'Leadership transferred');
      setShowTransfer(false); setTransferTarget(null);
      await Promise.all([fetchTeam(), fetchMembers()]);
    } catch (error) { toast.error(error?.response?.data?.message || 'Unable to transfer leadership'); }
  };

  const removeMember = async (memberId) => {
    if (!window.confirm('Remove this member from the team?')) return;
    try {
      const { data } = await api.delete(`/teams/remove-member/${teamId}/${memberId}`, { headers: authHeaders });
      if (!data?.success) { toast.error(data?.message || 'Failed to remove member'); return; }
      toast.success(data?.message || 'Member removed');
      await fetchMembers(); await refreshTaskData();
    } catch (error) { toast.error(error?.response?.data?.message || 'Unable to remove member'); }
  };

  const leaveTeam = async () => {
    if (!window.confirm('Leave this team?')) return;
    try {
      const { data } = await api.delete(`/teams/leave/${teamId}`, { headers: authHeaders });
      if (!data?.success) { toast.error(data?.message || 'Failed to leave team'); return; }
      toast.success(data?.message || 'Left team successfully');
      navigate('/dashboard/teams');
    } catch (error) { toast.error(error?.response?.data?.message || 'Unable to leave team'); }
  };

  const deleteTeam = async () => {
    if (!window.confirm('Delete this team permanently?')) return;
    try {
      const { data } = await api.delete(`/teams/delete/${teamId}`, { headers: authHeaders });
      if (!data?.success) { toast.error(data?.message || 'Failed to delete team'); return; }
      toast.success(data?.message || 'Team deleted successfully');
      navigate('/dashboard/teams');
    } catch (error) { toast.error(error?.response?.data?.message || 'Unable to delete team'); }
  };

  if (loading) return <Loading />;

  if (!team) {
    return (
      <div className="min-h-screen bg-[#f0f4f8] px-4 py-6 lg:px-8">
        <button type="button" onClick={() => navigate('/dashboard/teams')} className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#315e8d] hover:underline">
          <ArrowLeft size={16} /> Back to Teams
        </button>
        <div className="rounded-2xl border border-[#dbe5f1] bg-white p-8 text-center text-slate-400">
          Team not found.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8] px-4 py-6 lg:px-8 space-y-5">

      {/* ── Header ── */}
      <div className="[animation:fadeUp_.4s_ease_both]">
        <div className="bg-white border border-[#dbe5f1] rounded-2xl px-5 py-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard/teams')}
              className="mt-1 w-9 h-9 rounded-xl border border-[#dbe5f1] flex items-center justify-center text-slate-500 hover:bg-[#e9f0f8] hover:text-[#315e8d] transition-all duration-150 shrink-0"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-lg bg-[#e9f0f8] flex items-center justify-center">
                  <FolderKanban size={12} className="text-[#315e8d]" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[.18em] text-[#315e8d]">Team Workspace</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{team.name}</h1>
                {isLeader && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-yellow-50 border border-yellow-200 px-2 py-1 text-[10px] font-bold text-yellow-700">
                    <Crown size={10} /> Leader
                  </span>
                )}
                {isAdmin && !isLeader && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200 px-2 py-1 text-[10px] font-bold text-blue-700">
                    <Shield size={10} /> Admin
                  </span>
                )}
              </div>
              {team.title && <p className="text-sm text-slate-500 mt-0.5">{team.title}</p>}
              {team.description && <p className="text-sm text-slate-400 mt-1">{team.description}</p>}
            </div>
          </div>

          <div className="flex flex-wrap justify-end items-center gap-2 shrink-0">
            {canManage && (
              <>
                <button
                  type="button"
                  onClick={() => setShowInvite(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#dbe5f1] px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-[#e9f0f8] hover:text-[#315e8d] transition-all duration-150"
                >
                  <UserPlus size={15} /> Invite
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateTask(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#315e8d] px-3 py-2 text-sm font-semibold text-white hover:bg-[#26486d] transition-all duration-150 shadow-sm"
                >
                  <Plus size={15} /> New Task
                </button>
              </>
            )}
            {isLeader ? (
              <button type="button" onClick={deleteTeam} className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 transition-all duration-150">
                Delete Team
              </button>
            ) : (
              <button type="button" onClick={leaveTeam} className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 transition-all duration-150">
                Leave Team
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex flex-wrap gap-2 [animation:fadeUp_.4s_ease_.05s_both]">
        {[
          { key: 'board',   label: 'Kanban Board', icon: FolderKanban },
          { key: 'members', label: `Members (${visibleMembers.length})`, icon: Users },
          { key: 'progress',label: 'Progress', icon: BarChart3 },
          { key: 'prs',     label: `Pull Requests (${pullRequests.filter((pr) => pr.status === 'pending').length})`, icon: GitPullRequest },
        ].map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveTab(item.key)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 border ${
                active
                  ? 'bg-[#315e8d] text-white border-[#315e8d] shadow-sm'
                  : 'bg-white text-slate-500 border-[#dbe5f1] hover:bg-[#e9f0f8] hover:text-[#315e8d]'
              }`}
            >
              <Icon size={15} />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* ── Board Tab ── */}
      {activeTab === 'board' && (
        <div className="space-y-4 [animation:fadeUp_.35s_ease_.1s_both]">

          {/* Filters */}
          <div className="bg-white border border-[#dbe5f1] rounded-2xl px-5 py-4 flex flex-wrap items-end gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-7 h-7 rounded-lg bg-[#e9f0f8] flex items-center justify-center">
                <Filter size={13} className="text-[#315e8d]" />
              </div>
              <span className="text-xs font-bold text-[#315e8d] uppercase tracking-wider">Filters</span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Member</span>
              <select
                value={filterMember}
                onChange={(e) => setFilterMember(e.target.value)}
                className="text-sm font-semibold text-[#315e8d] bg-[#edf3fa] border border-[#dbe5f1] rounded-xl px-3 py-1.5 appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-[#315e8d]/25"
              >
                <option value="all">All Members</option>
                {visibleMembers.map((member) => (
                  <option key={member?.user?._id} value={member?.user?._id}>
                    {member?.user?.firstName} {member?.user?.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Priority</span>
              <div className="flex flex-wrap gap-1.5">
                {PRIORITIES.map((priority) => (
                  <button
                    key={priority}
                    type="button"
                    onClick={() => setFilterPriority(priority)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all duration-150 border ${
                      filterPriority === priority
                        ? 'bg-[#315e8d] text-white border-[#315e8d]'
                        : 'bg-[#edf3fa] text-[#315e8d] border-[#dbe5f1] hover:bg-[#dbe5f1]'
                    }`}
                  >
                    {priority}
                  </button>
                ))}
              </div>
            </div>

            {(filterMember !== 'all' || filterPriority !== 'all') && (
              <button
                type="button"
                onClick={() => { setFilterMember('all'); setFilterPriority('all'); }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-red-500 border border-red-200 bg-red-50 hover:bg-red-100 transition-all duration-150"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Stat Cards */}
          {teamStats && (
            <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
              <StatCard title="Visible"      value={totalFilteredTasks}                          icon={Target}       accent="bg-[#e9f0f8] text-[#315e8d]" />
              <StatCard title="To Do"        value={teamStats.byStatus?.todo || 0}               icon={ClipboardList} accent="bg-slate-100 text-slate-500" />
              <StatCard title="In Progress"  value={teamStats.byStatus?.['in-progress'] || 0}   icon={Clock}        accent="bg-blue-50 text-blue-500" />
              <StatCard title="In Review"    value={teamStats.byStatus?.['in-review'] || 0}     icon={GitPullRequest}accent="bg-amber-50 text-amber-500" />
              <StatCard title="Done"         value={teamStats.byStatus?.completed || 0}          icon={CheckCircle2} accent="bg-emerald-50 text-emerald-500" />
              <StatCard title="Deleted"      value={teamStats.deletedTasks?.length || 0}         icon={AlertCircle}  accent="bg-red-50 text-red-400" />
            </div>
          )}

          {/* Kanban Columns */}
          <div className="grid gap-3 xl:grid-cols-5">
            {COLUMNS.map((column) => {
              const Icon = column.icon;
              const tasks = filteredBoard[column.key] || [];
              return (
                <div key={column.key} className={`rounded-2xl border ${column.color} flex flex-col min-h-[180px]`}>
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-inherit">
                    <div className={`w-7 h-7 rounded-lg ${column.iconBg} flex items-center justify-center shrink-0`}>
                      <Icon size={14} className={column.iconColor} />
                    </div>
                    <h3 className="text-xs font-bold text-slate-700 flex-1">{column.label}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white/80 text-slate-500">{tasks.length}</span>
                  </div>

                  <div className="flex flex-col gap-2 p-3 flex-1">
                    {tasks.map((task) => (
                      <TaskCard
                        key={task._id}
                        task={task}
                        canManage={canManage}
                        currentUserId={user?._id}
                        onStatusChange={updateTaskStatus}
                        onDelete={deleteTask}
                        onEditTask={openEditTaskModal}
                        onRestoreTask={restoreTask}
                        onExtendDueDate={extendedDueDate}
                        onSubmitPR={(taskId) => { setSelectedTaskForPR(taskId); setShowPRModal(true); }}
                      />
                    ))}

                    {tasks.length === 0 && (
                      <div className="flex flex-col items-center justify-center flex-1 py-6 gap-2">
                        <div className={`w-9 h-9 rounded-xl ${column.iconBg} flex items-center justify-center`}>
                          <Icon size={16} className={`${column.iconColor} opacity-40`} />
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium">No tasks here</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Members Tab ── */}
      {activeTab === 'members' && (
        <div className="space-y-3 [animation:fadeUp_.35s_ease_.1s_both]">
          <div className="bg-white border border-[#dbe5f1] rounded-2xl px-5 py-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-[#e9f0f8] flex items-center justify-center">
                <Users size={14} className="text-[#315e8d]" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Team Members</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#e9f0f8] text-[#315e8d]">{visibleMembers.length}</span>
            </div>

            <div className="space-y-3">
              {teamLeader && (
                <MemberRow
                  member={{ user: teamLeader, role: 'leader' }}
                  isLeader={isLeader}
                  isAdmin={isAdmin}
                  onChangeRole={changeRole}
                  onRemove={removeMember}
                  onTransfer={(userItem) => { setTransferTarget(userItem); setShowTransfer(true); }}
                />
              )}
              {visibleMembers
                .filter((member) => member?.user?._id !== teamLeader?._id)
                .map((member) => (
                  <MemberRow
                    key={member?.user?._id}
                    member={member}
                    isLeader={isLeader}
                    isAdmin={isAdmin}
                    onChangeRole={changeRole}
                    onRemove={removeMember}
                    onTransfer={(userItem) => { setTransferTarget(userItem); setShowTransfer(true); }}
                  />
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Progress Tab ── */}
      {activeTab === 'progress' && (
        <div className="space-y-4 [animation:fadeUp_.35s_ease_.1s_both]">
          {progressLoading ? <Loading /> : progressData ? (
            <>
              <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                <ProgressCard title="Completion"  value={`${progressData.teamSummary?.completionRate || 0}%`} subtitle={`${progressData.teamSummary?.completed || 0} completed`} icon={CheckCircle2} accent="bg-emerald-50 text-emerald-500" />
                <ProgressCard title="Total Tasks" value={progressData.teamSummary?.totalTasks || 0}           subtitle="tracked in this team"                                    icon={Target}       accent="bg-[#e9f0f8] text-[#315e8d]" />
                <ProgressCard title="Overdue"     value={progressData.teamSummary?.overdue || 0}              subtitle="need attention"                                          icon={AlertCircle}  accent="bg-red-50 text-red-400" />
                <ProgressCard title="Members"     value={progressData.teamSummary?.membersCount || 0}         subtitle="in the leaderboard"                                      icon={Users}        accent="bg-violet-50 text-violet-500" />
              </div>

              <div className="bg-white border border-[#dbe5f1] rounded-2xl px-5 py-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-[#e9f0f8] flex items-center justify-center">
                    <BarChart3 size={14} className="text-[#315e8d]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Member Leaderboard</h3>
                    <p className="text-[11px] text-slate-400">Ranked by completion rate</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {(progressData.memberProgress || []).map((entry, index) => (
                    <div key={entry.user._id} className="bg-[#f8fafd] border border-[#dbe5f1] rounded-2xl p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#e9f0f8] flex items-center justify-center text-xs font-bold text-[#315e8d]">
                            #{index + 1}
                          </div>
                          <img
                            src={entry.user.profilePicture || `https://ui-avatars.com/api/?name=${entry.user.firstName}+${entry.user.lastName}&background=6366f1&color=fff`}
                            alt=""
                            className="h-10 w-10 rounded-xl object-cover ring-2 ring-white shadow-sm"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-slate-800">{entry.user.firstName} {entry.user.lastName}</p>
                              <span className="rounded-lg bg-[#e9f0f8] border border-[#dbe5f1] px-2 py-0.5 text-[9px] font-bold uppercase text-[#315e8d]">{entry.role}</span>
                            </div>
                            <p className="text-xs text-slate-400">@{entry.user.username}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-extrabold text-[#315e8d]">{entry.stats.completionRate}%</p>
                          <p className="text-[10px] text-slate-400">completion rate</p>
                        </div>
                      </div>
                      <div className="grid gap-2 grid-cols-2 md:grid-cols-4">
                        <StatChip label="Completed"   value={entry.stats.completed}   color="text-emerald-600 bg-emerald-50 border-emerald-200" />
                        <StatChip label="In Progress" value={entry.stats.inProgress}  color="text-blue-600 bg-blue-50 border-blue-200" />
                        <StatChip label="In Review"   value={entry.stats.inReview}    color="text-amber-600 bg-amber-50 border-amber-200" />
                        <StatChip label="Overdue"     value={entry.stats.overdue}     color="text-red-600 bg-red-50 border-red-200" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white border border-dashed border-[#dbe5f1] rounded-2xl p-10 text-center text-slate-400">
              No progress data available yet.
            </div>
          )}
        </div>
      )}

      {/* ── PRs Tab ── */}
      {activeTab === 'prs' && (
        <div className="space-y-4 [animation:fadeUp_.35s_ease_.1s_both]">
          <div className="bg-white border border-[#dbe5f1] rounded-2xl px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#e9f0f8] flex items-center justify-center">
                <GitPullRequest size={14} className="text-[#315e8d]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Team Pull Requests</h3>
                <p className="text-[11px] text-slate-400">Review and track PRs submitted for this team</p>
              </div>
            </div>
            <select
              value={prFilter}
              onChange={(e) => setPrFilter(e.target.value)}
              className="text-sm font-semibold text-[#315e8d] bg-[#edf3fa] border border-[#dbe5f1] rounded-xl px-3 py-1.5 appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-[#315e8d]/25"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {combinedPullRequests.length === 0 ? (
            <div className="bg-white border border-dashed border-[#dbe5f1] rounded-2xl p-10 text-center text-slate-400">
              No pull requests found.
            </div>
          ) : (
            <div className="space-y-3">
              {combinedPullRequests.map((pr) => {
                const statusColor =
                  pr.status === 'accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  pr.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-200' :
                  'bg-amber-50 text-amber-700 border-amber-200';
                const borderAccent =
                  pr.status === 'accepted' ? 'border-l-emerald-400' :
                  pr.status === 'rejected' ? 'border-l-red-400' :
                  'border-l-amber-400';
                return (
                  <div key={pr._id} className={`bg-white border border-[#dbe5f1] border-l-4 ${borderAccent} rounded-2xl px-5 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm`}>
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">{pr.task?.title}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">{pr.sender?.firstName} {pr.sender?.lastName} · @{pr.sender?.username}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Team: {pr.team?.name}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border capitalize ${statusColor}`}>
                        {pr.status}
                      </span>
                    </div>

                    <a href={pr.githubPRLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#315e8d] hover:text-[#26486d] hover:underline transition-colors duration-150 mb-2">
                      <ExternalLink size={12} /> View on GitHub
                    </a>

                    {pr.message && (
                      <p className="text-xs text-slate-500 italic bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 mb-2">
                        "{pr.message}"
                      </p>
                    )}

                    {pr.status !== 'pending' && pr.reviewedBy && (
                      <p className="text-xs text-emerald-600 font-medium flex items-center gap-1.5 mb-2">
                        <CheckCircle2 size={12} />
                        Reviewed by <span className="font-bold">{pr.reviewedBy.firstName} {pr.reviewedBy.lastName}</span>
                        {pr.reviewNote && <span className="italic text-slate-400"> — {pr.reviewNote}</span>}
                      </p>
                    )}

                    {pr.status === 'pending' && canManage && (
                      <div className="mt-3 bg-[#f8fafd] border border-[#dbe5f1] rounded-xl p-3">
                        {reviewingPR === pr._id ? (
                          <div className="space-y-2">
                            <textarea
                              value={reviewNote}
                              onChange={(e) => setReviewNote(e.target.value)}
                              placeholder="Review note (optional)"
                              rows={2}
                              className="w-full rounded-xl border border-[#dbe5f1] px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#315e8d]/25 resize-none"
                            />
                            <div className="flex flex-wrap gap-2">
                              <button type="button" onClick={() => handleReviewPR(pr._id, 'accepted')} className="px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-all duration-150">
                                Accept
                              </button>
                              <button type="button" onClick={() => handleReviewPR(pr._id, 'rejected')} className="px-3 py-1.5 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-all duration-150">
                                Reject
                              </button>
                              <button type="button" onClick={() => { setReviewingPR(null); setReviewNote(''); }} className="px-3 py-1.5 rounded-xl border border-[#dbe5f1] text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all duration-150">
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button type="button" onClick={() => setReviewingPR(pr._id)} className="text-xs font-bold text-[#315e8d] hover:underline transition-colors duration-150">
                            Review PR →
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Modals ── */}
      {showCreateTask && (
        <Modal title="Create New Task" icon={<Sparkles size={16} className="text-[#315e8d]" />} onClose={() => { setShowCreateTask(false); setTaskForm(emptyTaskForm); }}>
          <form onSubmit={handleCreateTask} className="space-y-4">
            <Field label="Title"><input value={taskForm.title} onChange={(e) => setTaskForm((prev) => ({ ...prev, title: e.target.value }))} className="w-full rounded-xl border border-[#dbe5f1] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#315e8d]/25" required /></Field>
            <Field label="Description"><textarea value={taskForm.description} onChange={(e) => setTaskForm((prev) => ({ ...prev, description: e.target.value }))} rows={3} className="w-full rounded-xl border border-[#dbe5f1] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#315e8d]/25 resize-none" /></Field>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Priority">
                <select value={taskForm.priority} onChange={(e) => setTaskForm((prev) => ({ ...prev, priority: e.target.value }))} className="w-full rounded-xl border border-[#dbe5f1] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#315e8d]/25">
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                </select>
              </Field>
              <Field label="Due Date"><input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm((prev) => ({ ...prev, dueDate: e.target.value }))} className="w-full rounded-xl border border-[#dbe5f1] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#315e8d]/25" /></Field>
            </div>
            <Field label="Assigned To">
              <select value={taskForm.assignedTo} onChange={(e) => setTaskForm((prev) => ({ ...prev, assignedTo: e.target.value }))} className="w-full rounded-xl border border-[#dbe5f1] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#315e8d]/25" required>
                <option value="">Select member</option>
                {visibleMembers.map((member) => (<option key={member?.user?._id} value={member?.user?._id}>{member?.user?.firstName} {member?.user?.lastName}</option>))}
              </select>
            </Field>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => { setShowCreateTask(false); setTaskForm(emptyTaskForm); }} className="px-4 py-2 rounded-xl border border-[#dbe5f1] text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all duration-150">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-[#315e8d] text-white text-sm font-semibold hover:bg-[#26486d] transition-all duration-150">Create Task</button>
            </div>
          </form>
        </Modal>
      )}

      {editingTask && (
        <Modal title="Update Task" icon={<Sparkles size={16} className="text-[#315e8d]" />} onClose={() => { setEditingTask(null); setEditingTaskForm(emptyTaskForm); }}>
          <form onSubmit={updateTaskDetails} className="space-y-4">
            <Field label="Title"><input value={editingTaskForm.title} onChange={(e) => setEditingTaskForm((prev) => ({ ...prev, title: e.target.value }))} className="w-full rounded-xl border border-[#dbe5f1] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#315e8d]/25" required /></Field>
            <Field label="Description"><textarea value={editingTaskForm.description} onChange={(e) => setEditingTaskForm((prev) => ({ ...prev, description: e.target.value }))} rows={3} className="w-full rounded-xl border border-[#dbe5f1] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#315e8d]/25 resize-none" /></Field>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Priority">
                <select value={editingTaskForm.priority} onChange={(e) => setEditingTaskForm((prev) => ({ ...prev, priority: e.target.value }))} className="w-full rounded-xl border border-[#dbe5f1] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#315e8d]/25">
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                </select>
              </Field>
              <Field label="Due Date"><input type="date" value={editingTaskForm.dueDate} onChange={(e) => setEditingTaskForm((prev) => ({ ...prev, dueDate: e.target.value }))} className="w-full rounded-xl border border-[#dbe5f1] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#315e8d]/25" /></Field>
            </div>
            <Field label="Assigned To">
              <select value={editingTaskForm.assignedTo} onChange={(e) => setEditingTaskForm((prev) => ({ ...prev, assignedTo: e.target.value }))} className="w-full rounded-xl border border-[#dbe5f1] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#315e8d]/25">
                <option value="">Keep current</option>
                {visibleMembers.map((member) => (<option key={member?.user?._id} value={member?.user?._id}>{member?.user?.firstName} {member?.user?.lastName}</option>))}
              </select>
            </Field>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setEditingTask(null)} className="px-4 py-2 rounded-xl border border-[#dbe5f1] text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all duration-150">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-[#315e8d] text-white text-sm font-semibold hover:bg-[#26486d] transition-all duration-150">Save Changes</button>
            </div>
          </form>
        </Modal>
      )}

      {showInvite && (
        <Modal title="Invite to Team" icon={<UserPlus size={16} className="text-[#315e8d]" />} onClose={() => { setShowInvite(false); setInviteForm(emptyInviteForm); }}>
          <form onSubmit={handleInvite} className="space-y-4">
            <Field label="Username"><input value={inviteForm.username} onChange={(e) => setInviteForm((prev) => ({ ...prev, username: e.target.value }))} className="w-full rounded-xl border border-[#dbe5f1] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#315e8d]/25" required /></Field>
            <Field label="Message"><textarea value={inviteForm.message} onChange={(e) => setInviteForm((prev) => ({ ...prev, message: e.target.value }))} rows={3} className="w-full rounded-xl border border-[#dbe5f1] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#315e8d]/25 resize-none" /></Field>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => { setShowInvite(false); setInviteForm(emptyInviteForm); }} className="px-4 py-2 rounded-xl border border-[#dbe5f1] text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all duration-150">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-[#315e8d] text-white text-sm font-semibold hover:bg-[#26486d] transition-all duration-150">Send Invite</button>
            </div>
          </form>
        </Modal>
      )}

      {showPRModal && (
        <Modal title="Submit Pull Request" icon={<GitPullRequest size={16} className="text-[#315e8d]" />} onClose={() => { setShowPRModal(false); setSelectedTaskForPR(null); setPrForm(emptyPrForm); }}>
          <form onSubmit={handleSubmitPR} className="space-y-4">
            <Field label="GitHub PR Link"><input type="url" value={prForm.githubPRLink} onChange={(e) => setPrForm((prev) => ({ ...prev, githubPRLink: e.target.value }))} className="w-full rounded-xl border border-[#dbe5f1] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#315e8d]/25" required /></Field>
            <Field label="Message"><textarea value={prForm.message} onChange={(e) => setPrForm((prev) => ({ ...prev, message: e.target.value }))} rows={3} className="w-full rounded-xl border border-[#dbe5f1] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#315e8d]/25 resize-none" /></Field>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => { setShowPRModal(false); setSelectedTaskForPR(null); setPrForm(emptyPrForm); }} className="px-4 py-2 rounded-xl border border-[#dbe5f1] text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all duration-150">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-[#315e8d] text-white text-sm font-semibold hover:bg-[#26486d] transition-all duration-150">Submit PR</button>
            </div>
          </form>
        </Modal>
      )}

      {showTransfer && transferTarget && (
        <Modal title="Transfer Leadership" icon={<ArrowRightLeft size={16} className="text-[#315e8d]" />} onClose={() => { setShowTransfer(false); setTransferTarget(null); }}>
          <div className="space-y-4">
            <p className="text-sm text-slate-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              Transfer leadership to <strong>{transferTarget.firstName} {transferTarget.lastName}</strong> (@{transferTarget.username}). This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setShowTransfer(false); setTransferTarget(null); }} className="px-4 py-2 rounded-xl border border-[#dbe5f1] text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all duration-150">Cancel</button>
              <button type="button" onClick={handleTransferLeadership} className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-all duration-150">Confirm Transfer</button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, accent }) => (
  <div className="bg-white border border-[#dbe5f1] rounded-2xl px-4 py-3.5 flex items-center gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
      <Icon size={16} />
    </div>
    <div>
      <p className="text-xl font-bold text-slate-800 leading-none">{value}</p>
      <span className="text-[11px] text-slate-400 font-medium">{title}</span>
    </div>
  </div>
);

const ProgressCard = ({ title, value, subtitle, icon: Icon, accent }) => (
  <div className="bg-white border border-[#dbe5f1] rounded-2xl px-4 py-3.5 flex items-center gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
      <Icon size={16} />
    </div>
    <div>
      <p className="text-xl font-bold text-slate-800 leading-none">{value}</p>
      <span className="text-[11px] text-slate-400 font-medium">{title}</span>
      <p className="text-[10px] text-slate-400">{subtitle}</p>
    </div>
  </div>
);

const StatChip = ({ label, value, color }) => (
  <div className={`rounded-xl border px-3 py-2 ${color}`}>
    <p className="text-[10px] font-medium opacity-70">{label}</p>
    <p className="text-sm font-bold">{value}</p>
  </div>
);

const Field = ({ label, children }) => (
  <label className="block space-y-1">
    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{label}</span>
    {children}
  </label>
);

const MemberRow = ({ member, isLeader, isAdmin, onChangeRole, onRemove, onTransfer }) => {
  const user = member?.user;
  if (!user) return null;

  const roleBadge =
    member.role === 'leader' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
    member.role === 'admin'  ? 'bg-blue-50 text-blue-700 border-blue-200' :
    'bg-[#e9f0f8] text-[#315e8d] border-[#dbe5f1]';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-[#f8fafd] border border-[#dbe5f1] rounded-2xl px-4 py-3 transition-all duration-200 hover:border-[#c8d9ee]">
      <div className="flex items-center gap-3">
        <img
          src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=6366f1&color=fff`}
          alt=""
          className="h-10 w-10 rounded-xl object-cover ring-2 ring-white shadow-sm"
        />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-slate-800">{user.firstName} {user.lastName}</p>
            <span className={`rounded-lg border px-2 py-0.5 text-[9px] font-bold uppercase ${roleBadge}`}>{member.role}</span>
          </div>
          <p className="text-xs text-slate-400">@{user.username}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {isLeader && member.role !== 'leader' && (
          <>
            <select value={member.role} onChange={(e) => onChangeRole(user._id, e.target.value)} className="text-xs font-semibold text-[#315e8d] bg-[#edf3fa] border border-[#dbe5f1] rounded-xl px-3 py-1.5 outline-none cursor-pointer">
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <button type="button" onClick={() => onTransfer(user)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#dbe5f1] text-xs font-bold text-slate-600 hover:bg-[#e9f0f8] hover:text-[#315e8d] transition-all duration-150">
              <ArrowRightLeft size={12} /> Transfer
            </button>
            <button type="button" onClick={() => onRemove(user._id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 text-xs font-bold text-red-500 hover:bg-red-50 transition-all duration-150">
              <UserMinus size={12} /> Remove
            </button>
          </>
        )}
        {isAdmin && !isLeader && member.role !== 'leader' && (
          <button type="button" onClick={() => onRemove(user._id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 text-xs font-bold text-red-500 hover:bg-red-50 transition-all duration-150">
            <UserMinus size={12} /> Remove
          </button>
        )}
      </div>
    </div>
  );
};

const TaskCard = ({ task, canManage, currentUserId, onStatusChange, onDelete, onEditTask, onRestoreTask, onExtendDueDate, onSubmitPR }) => {
  const isAssignedToMe = task.assignedTo?._id === currentUserId;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
  const priorityClass =
    task.priority?.toLowerCase() === 'high' ? 'text-red-600 bg-red-50 border-red-200' :
    task.priority?.toLowerCase() === 'low'  ? 'text-emerald-600 bg-emerald-50 border-emerald-200' :
    'text-amber-600 bg-amber-50 border-amber-200';

  return (
    <div className="bg-white border border-[#dbe5f1] rounded-xl px-3 py-3 flex flex-col gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-xs font-bold text-slate-800 leading-snug line-clamp-2">{task.title}</h4>
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 capitalize ${priorityClass}`}>{task.priority}</span>
      </div>

      {task.description && <p className="text-[11px] text-slate-400 line-clamp-2">{task.description}</p>}

      <div className="flex items-center gap-2 flex-wrap">
        <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
          <CalendarDays size={10} />
          {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No due date'}
        </span>
        {isOverdue && <span className="text-[10px] font-bold text-red-500">Overdue</span>}
      </div>

      <div className="flex items-center gap-1.5">
        <img
          src={task.assignedTo?.profilePicture || `https://ui-avatars.com/api/?name=${task.assignedTo?.firstName}+${task.assignedTo?.lastName}&background=6366f1&color=fff`}
          alt=""
          className="h-5 w-5 rounded-lg object-cover ring-1 ring-white"
        />
        <span className="text-[10px] text-slate-500 font-medium">{task.assignedTo?.firstName} {task.assignedTo?.lastName}</span>
      </div>

      <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100">
        {!task.isDeleted && isAssignedToMe && task.status === 'todo' && (
          <button type="button" onClick={() => onStatusChange(task._id, 'in-progress')} className="px-2 py-1 rounded-lg bg-blue-50 border border-blue-200 text-[9px] font-bold text-blue-700 hover:bg-blue-100 transition-all duration-150">Start</button>
        )}
        {!task.isDeleted && isAssignedToMe && task.status === 'in-progress' && (
          <button type="button" onClick={() => onSubmitPR(task._id)} className="px-2 py-1 rounded-lg bg-violet-50 border border-violet-200 text-[9px] font-bold text-violet-700 hover:bg-violet-100 transition-all duration-150">Submit PR</button>
        )}
        {canManage && !task.isDeleted && (
          <>
            <button type="button" onClick={() => onEditTask(task)} className="px-2 py-1 rounded-lg bg-[#e9f0f8] border border-[#dbe5f1] text-[9px] font-bold text-[#315e8d] hover:bg-[#dbe5f1] transition-all duration-150">Edit</button>
            <button type="button" onClick={() => onExtendDueDate(task._id, task.dueDate)} className="px-2 py-1 rounded-lg bg-cyan-50 border border-cyan-200 text-[9px] font-bold text-cyan-700 hover:bg-cyan-100 transition-all duration-150">+1 Day</button>
            <select value={task.status} onChange={(e) => onStatusChange(task._id, e.target.value)} className="px-1.5 py-1 rounded-lg border border-[#dbe5f1] text-[9px] font-bold text-slate-600 bg-[#edf3fa] outline-none cursor-pointer">
              {TASK_STATUSES.map((status) => (<option key={status} value={status}>{status}</option>))}
            </select>
            <button type="button" onClick={() => onDelete(task._id)} className="px-2 py-1 rounded-lg bg-red-50 border border-red-200 text-[9px] font-bold text-red-600 hover:bg-red-100 transition-all duration-150">Delete</button>
          </>
        )}
        {canManage && task.isDeleted && (
          <button type="button" onClick={() => onRestoreTask(task._id)} className="px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[9px] font-bold text-emerald-700 hover:bg-emerald-100 transition-all duration-150">Restore</button>
        )}
      </div>
    </div>
  );
};

const Modal = ({ title, icon, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
    <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#e9f0f8] flex items-center justify-center">{icon}</div>
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
        </div>
        <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all duration-150">
          <X size={16} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

export default TeamDetails;