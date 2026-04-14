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
  { key: 'todo', label: 'To Do', icon: ClipboardList },
  { key: 'in-progress', label: 'In Progress', icon: Clock },
  { key: 'in-review', label: 'In Review', icon: GitPullRequest },
  { key: 'completed', label: 'Done', icon: CheckCircle2 },
  { key: 'deleted', label: 'Deleted', icon: AlertCircle },
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
  const [confirmPopup, setConfirmPopup] = useState({
    open: false,
    title: '',
    message: '',
    intent: 'neutral',
    onConfirm: null,
  });

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
    const list = prFilter === 'all' ? pullRequests : pullRequests.filter((pr) => pr.status === prFilter);
    return list;
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
      if (!data?.success) {
        toast.error(data?.message || 'Failed to fetch progress');
        setProgressData(null);
        return;
      }
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
      statuses.map((status) =>
        api.get(`/pull-requests/team/${teamId}`, {
          headers: authHeaders,
          params: { status },
        })
      )
    );

    const merged = [];
    const seen = new Set();

    responses.forEach((response) => {
      (response?.data?.pullRequests || []).forEach((pr) => {
        if (!seen.has(pr._id)) {
          seen.add(pr._id);
          merged.push(pr);
        }
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
      if (error?.response?.status === 401) {
        setToken(null);
        localStorage.removeItem('token');
      }
      toast.error(error?.response?.data?.message || error.message || 'Unable to load team details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && teamId) {
      loadAll();
    } else {
      setLoading(false);
    }
  }, [token, teamId]);

  useEffect(() => {
    if (activeTab === 'progress' && token && teamId && !progressData) {
      fetchProgress();
    }
  }, [activeTab, token, teamId, progressData]);

  const refreshTaskData = async () => {
    await Promise.all([fetchTasks(), fetchPullRequests()]);
    if (activeTab === 'progress') {
      await fetchProgress();
    }
  };

  const handleCreateTask = async (event) => {
    event.preventDefault();
    try {
      const { data } = await api.post(
        `/tasks/create/${teamId}/${taskForm.assignedTo}`,
        {
          title: taskForm.title.trim(),
          description: taskForm.description.trim(),
          priority: capitalizePriority(taskForm.priority),
          dueDate: taskForm.dueDate || undefined,
        },
        { headers: authHeaders }
      );

      if (!data?.success) {
        toast.error(data?.message || 'Failed to create task');
        return;
      }

      toast.success(data?.message || 'Task created successfully');
      setShowCreateTask(false);
      setTaskForm(emptyTaskForm);
      await refreshTaskData();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to create task');
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    try {
      const { data } = await api.patch(
        `/tasks/update-status/${taskId}`,
        { status },
        { headers: authHeaders }
      );

      if (!data?.success) {
        toast.error(data?.message || 'Failed to update task status');
        return;
      }

      toast.success(data?.message || 'Task status updated');
      await refreshTaskData();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to update task status');
    }
  };

  const deleteTask = async (taskId) => {
    setConfirmPopup({
      open: true,
      title: 'Delete Task',
      message: 'Delete this task?',
      intent: 'danger',
      onConfirm: async () => {
        try {
          const { data } = await api.put(`/tasks/${taskId}`, {}, { headers: authHeaders });
          if (!data?.success) {
            toast.error(data?.message || 'Failed to delete task');
            return;
          }

          toast.success(data?.message || 'Task deleted');
          await refreshTaskData();
        } catch (error) {
          toast.error(error?.response?.data?.message || 'Unable to delete task');
        }
      },
    });
  };

  const restoreTask = async (taskId) => {
    try {
      const { data } = await api.patch(`/tasks/restore/${taskId}`, {}, { headers: authHeaders });
      if (!data?.success) {
        toast.error(data?.message || 'Failed to restore task');
        return;
      }

      toast.success(data?.message || 'Task restored');
      await refreshTaskData();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to restore task');
    }
  };

  const extendedDueDate = async (taskId, currentDueDate) => {
    const baseDate = currentDueDate ? new Date(currentDueDate) : new Date();
    const nextDate = new Date(baseDate);
    nextDate.setDate(nextDate.getDate() + 1);
    const dueDate = nextDate.toISOString().slice(0, 10);

    try {
      const { data } = await api.put(
        `/tasks/update/${taskId}`,
        { dueDate },
        { headers: authHeaders }
      );

      if (!data?.success) {
        toast.error(data?.message || 'Failed to extend due date');
        return;
      }

      toast.success(data?.message || 'Due date extended');
      await refreshTaskData();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to extend due date');
    }
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
        {
          title: editingTaskForm.title.trim(),
          description: editingTaskForm.description.trim(),
          priority: capitalizePriority(editingTaskForm.priority),
          dueDate: editingTaskForm.dueDate || null,
          assignedTo: editingTaskForm.assignedTo || undefined,
        },
        { headers: authHeaders }
      );

      if (!data?.success) {
        toast.error(data?.message || 'Failed to update task');
        return;
      }

      toast.success(data?.message || 'Task updated successfully');
      setEditingTask(null);
      setEditingTaskForm(emptyTaskForm);
      await refreshTaskData();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to update task');
    }
  };

  const handleSubmitPR = async (event) => {
    event.preventDefault();
    if (!selectedTaskForPR) return;

    try {
      const { data } = await api.post(
        `/pull-requests/create/${selectedTaskForPR}`,
        {
          githubPRLink: prForm.githubPRLink.trim(),
          message: prForm.message.trim(),
        },
        { headers: authHeaders }
      );

      if (!data?.success) {
        toast.error(data?.message || 'Failed to submit PR');
        return;
      }

      toast.success(data?.message || 'Pull request submitted');
      setShowPRModal(false);
      setSelectedTaskForPR(null);
      setPrForm(emptyPrForm);
      await refreshTaskData();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to submit PR');
    }
  };

  const handleReviewPR = async (prId, status) => {
    try {
      const { data } = await api.post(
        `/pull-requests/review/${prId}`,
        { status, reviewNote },
        { headers: authHeaders }
      );

      if (!data?.success) {
        toast.error(data?.message || 'Failed to review pull request');
        return;
      }

      toast.success(data?.message || 'Pull request reviewed');
      setReviewingPR(null);
      setReviewNote('');
      await refreshTaskData();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to review PR');
    }
  };

  const handleInvite = async (event) => {
    event.preventDefault();

    try {
      const { data } = await api.post(
        `/teams/invitations/send/${teamId}`,
        { username: inviteForm.username.trim(), message: inviteForm.message.trim() },
        { headers: authHeaders }
      );

      if (!data?.success) {
        toast.error(data?.message || 'Failed to send invitation');
        return;
      }

      toast.success(data?.message || 'Invitation sent');
      setInviteForm(emptyInviteForm);
      setShowInvite(false);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to send invitation');
    }
  };

  const changeRole = async (memberId, role) => {
    try {
      const { data } = await api.patch(
        `/teams/change-role/${teamId}/${memberId}`,
        { role },
        { headers: authHeaders }
      );

      if (!data?.success) {
        toast.error(data?.message || 'Failed to change role');
        return;
      }

      toast.success(data?.message || 'Role updated');
      await fetchMembers();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to change role');
    }
  };

  const handleTransferLeadership = async () => {
    if (!transferTarget?._id) return;

    try {
      const { data } = await api.post(
        `/teams/transfer-leadership/${teamId}/${transferTarget._id}`,
        {},
        { headers: authHeaders }
      );

      if (!data?.success) {
        toast.error(data?.message || 'Failed to transfer leadership');
        return;
      }

      toast.success(data?.message || 'Leadership transferred');
      setShowTransfer(false);
      setTransferTarget(null);
      await Promise.all([fetchTeam(), fetchMembers()]);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to transfer leadership');
    }
  };

  const removeMember = async (memberId) => {
    setConfirmPopup({
      open: true,
      title: 'Remove Member',
      message: 'Remove this member from the team?',
      intent: 'danger',
      onConfirm: async () => {
        try {
          const { data } = await api.delete(`/teams/remove-member/${teamId}/${memberId}`, {
            headers: authHeaders,
          });

          if (!data?.success) {
            toast.error(data?.message || 'Failed to remove member');
            return;
          }

          toast.success(data?.message || 'Member removed');
          await fetchMembers();
          await refreshTaskData();
        } catch (error) {
          toast.error(error?.response?.data?.message || 'Unable to remove member');
        }
      },
    });
  };

  const leaveTeam = async () => {
    setConfirmPopup({
      open: true,
      title: 'Leave Team',
      message: 'Leave this team?',
      intent: 'warning',
      onConfirm: async () => {
        try {
          const { data } = await api.delete(`/teams/leave/${teamId}`, { headers: authHeaders });

          if (!data?.success) {
            toast.error(data?.message || 'Failed to leave team');
            return;
          }

          toast.success(data?.message || 'Left team successfully');
          navigate('/dashboard/teams');
        } catch (error) {
          toast.error(error?.response?.data?.message || 'Unable to leave team');
        }
      },
    });
  };

  const deleteTeam = async () => {
    setConfirmPopup({
      open: true,
      title: 'Delete Team Permanently',
      message: 'Delete this team permanently? This action cannot be undone.',
      intent: 'danger',
      onConfirm: async () => {
        try {
          const { data } = await api.delete(`/teams/delete/${teamId}`, { headers: authHeaders });

          if (!data?.success) {
            toast.error(data?.message || 'Failed to delete team');
            return;
          }

          toast.success(data?.message || 'Team deleted successfully');
          navigate('/dashboard/teams');
        } catch (error) {
          toast.error(error?.response?.data?.message || 'Unable to delete team');
        }
      },
    });
  };

  if (loading) return <Loading />;

  if (!team) {
    return (
      <div className="p-6">
        <button type="button" onClick={() => navigate('/dashboard/teams')} className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-gray-600">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-gray-500">
          Team not found.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex items-start gap-4">
          <button type="button" onClick={() => navigate('/dashboard/teams')} className="mt-1 rounded-xl border border-gray-200 p-2 text-gray-600">
            <ArrowLeft size={18} />
          </button>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
              {isLeader && <span className="inline-flex items-center gap-1 rounded-lg bg-yellow-50 px-2 py-1 text-xs font-bold text-yellow-700"><Crown size={11} />Leader</span>}
              {isAdmin && !isLeader && <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700"><Shield size={11} />Admin</span>}
            </div>
            <p className="text-sm text-gray-500">{team.title}</p>
            {team.description && <p className="mt-1 text-sm text-gray-600">{team.description}</p>}
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          {canManage && (
            <>
              <button type="button" onClick={() => setShowInvite(true)} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700">
                <UserPlus size={16} /> Invite
              </button>
              <button type="button" onClick={() => setShowCreateTask(true)} className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-3 py-2 text-sm font-semibold text-white">
                <Plus size={16} /> New Task
              </button>
            </>
          )}
          {isLeader ? (
            <button type="button" onClick={deleteTeam} className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600">
              Delete Team
            </button>
          ) : (
            <button type="button" onClick={leaveTeam} className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600">
              Leave Team
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-gray-200 bg-white p-2">
        {[
          { key: 'board', label: 'Kanban Board', icon: FolderKanban },
          { key: 'members', label: `Members (${visibleMembers.length})`, icon: Users },
          { key: 'progress', label: 'Progress', icon: BarChart3 },
          { key: 'prs', label: `Pull Requests (${pullRequests.filter((pr) => pr.status === 'pending').length})`, icon: GitPullRequest },
        ].map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveTab(item.key)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${active ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Icon size={16} />
              {item.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'board' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-gray-200 bg-white p-4">
            <div>
              <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-gray-700"><Filter size={14} /> Member</div>
              <select value={filterMember} onChange={(e) => setFilterMember(e.target.value)} className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 min-w-[180px]">
                <option value="all">All Members</option>
                {visibleMembers.map((member) => (
                  <option key={member?.user?._id} value={member?.user?._id}>{member?.user?.firstName} {member?.user?.lastName}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="mb-1 text-sm font-semibold text-gray-700">Priority</div>
              <div className="flex flex-wrap gap-2">
                {PRIORITIES.map((priority) => (
                  <button
                    key={priority}
                    type="button"
                    onClick={() => setFilterPriority(priority)}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold capitalize ${filterPriority === priority ? 'bg-gray-900 text-white' : 'border border-gray-200 text-gray-600'}`}
                  >
                    {priority}
                  </button>
                ))}
              </div>
            </div>

            {(filterMember !== 'all' || filterPriority !== 'all') && (
              <button type="button" onClick={() => { setFilterMember('all'); setFilterPriority('all'); }} className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600">
                Clear Filters
              </button>
            )}
          </div>

          {teamStats && (
            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
              <StatCard title="Visible" value={totalFilteredTasks} icon={Target} />
              <StatCard title="To Do" value={teamStats.byStatus?.todo || 0} icon={ClipboardList} />
              <StatCard title="In Progress" value={teamStats.byStatus?.['in-progress'] || 0} icon={Clock} />
              <StatCard title="In Review" value={teamStats.byStatus?.['in-review'] || 0} icon={GitPullRequest} />
              <StatCard title="Done" value={teamStats.byStatus?.completed || 0} icon={CheckCircle2} />
              <StatCard title="Deleted" value={teamStats.deletedTasks?.length || 0} icon={AlertCircle} />
            </div>
          )}

          <div className="grid gap-4 xl:grid-cols-5">
            {COLUMNS.map((column) => {
              const Icon = column.icon;
              const tasks = filteredBoard[column.key] || [];
              return (
                <div key={column.key} className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon size={16} />
                      <h3 className="font-semibold text-gray-900">{column.label}</h3>
                    </div>
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600">{tasks.length}</span>
                  </div>

                  <div className="space-y-3">
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
                        onSubmitPR={(taskId) => {
                          setSelectedTaskForPR(taskId);
                          setShowPRModal(true);
                        }}
                      />
                    ))}

                    {tasks.length === 0 && (
                      <div className="rounded-xl border border-dashed border-gray-200 px-3 py-8 text-center text-sm text-gray-400">
                        No tasks here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'members' && (
        <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
          <h3 className="text-lg font-bold text-gray-900">Team Members</h3>

          {teamLeader && (
            <MemberRow
              member={{ user: teamLeader, role: 'leader' }}
              isLeader={isLeader}
              isAdmin={isAdmin}
              onChangeRole={changeRole}
              onRemove={removeMember}
              onTransfer={(userItem) => {
                setTransferTarget(userItem);
                setShowTransfer(true);
              }}
            />
          )}

          <div className="space-y-3">
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
                  onTransfer={(userItem) => {
                    setTransferTarget(userItem);
                    setShowTransfer(true);
                  }}
                />
              ))}
          </div>
        </div>
      )}

      {activeTab === 'progress' && (
        <div className="space-y-5">
          {progressLoading ? (
            <Loading />
          ) : progressData ? (
            <>
              <div className="grid gap-4 lg:grid-cols-4">
                <ProgressCard title="Completion" value={`${progressData.teamSummary?.completionRate || 0}%`} subtitle={`${progressData.teamSummary?.completed || 0} completed`} icon={CheckCircle2} />
                <ProgressCard title="Total Tasks" value={progressData.teamSummary?.totalTasks || 0} subtitle="tracked in this team" icon={Target} />
                <ProgressCard title="Overdue" value={progressData.teamSummary?.overdue || 0} subtitle="need attention" icon={AlertCircle} />
                <ProgressCard title="Members" value={progressData.teamSummary?.membersCount || 0} subtitle="in the leaderboard" icon={Users} />
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Member Leaderboard</h3>
                    <p className="text-sm text-gray-500">Ranked by completion rate</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {(progressData.memberProgress || []).map((entry, index) => (
                    <div key={entry.user._id} className="rounded-2xl border border-gray-200 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-sm font-bold text-gray-500">#{index + 1}</div>
                          <img
                            src={entry.user.profilePicture || `https://ui-avatars.com/api/?name=${entry.user.firstName}+${entry.user.lastName}&background=6366f1&color=fff`}
                            alt=""
                            className="h-11 w-11 rounded-xl object-cover"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900">{entry.user.firstName} {entry.user.lastName}</p>
                              <span className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-bold uppercase text-gray-500">{entry.role}</span>
                            </div>
                            <p className="text-sm text-gray-500">@{entry.user.username}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-2xl font-extrabold text-gray-900">{entry.stats.completionRate}%</p>
                          <p className="text-xs text-gray-500">completion rate</p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-2 text-sm text-gray-600 md:grid-cols-4">
                        <StatChip label="Completed" value={entry.stats.completed} />
                        <StatChip label="In Progress" value={entry.stats.inProgress} />
                        <StatChip label="In Review" value={entry.stats.inReview} />
                        <StatChip label="Overdue" value={entry.stats.overdue} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-gray-500">
              No progress data available yet.
            </div>
          )}
        </div>
      )}

      {activeTab === 'prs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Team Pull Requests</h3>
              <p className="text-sm text-gray-500">Review and track pull requests submitted for this team</p>
            </div>

            <select value={prFilter} onChange={(e) => setPrFilter(e.target.value)} className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 min-w-[180px]">
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {combinedPullRequests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-gray-500">
              No pull requests found.
            </div>
          ) : (
            <div className="grid gap-4">
              {combinedPullRequests.map((pr) => (
                <div key={pr._id} className="rounded-2xl border border-gray-200 bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-gray-900">{pr.task?.title}</h4>
                      <p className="text-sm text-gray-500">{pr.sender?.firstName} {pr.sender?.lastName} (@{pr.sender?.username})</p>
                      <p className="mt-1 text-xs text-gray-400">Team: {pr.team?.name}</p>
                    </div>

                    <span className="rounded-lg border px-2.5 py-1 text-xs font-bold uppercase text-gray-600">
                      {pr.status}
                    </span>
                  </div>

                  <a href={pr.githubPRLink} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
                    <ExternalLink size={14} /> View on GitHub
                  </a>

                  {pr.message && <p className="mt-3 text-sm text-gray-600">{pr.message}</p>}

                  {pr.status !== 'pending' && pr.reviewedBy && (
                    <p className="mt-3 text-sm text-gray-600">
                      Reviewed by {pr.reviewedBy.firstName} {pr.reviewedBy.lastName}
                      {pr.reviewNote ? <span className="italic"> - {pr.reviewNote}</span> : null}
                    </p>
                  )}

                  {pr.status === 'pending' && canManage && (
                    <div className="mt-4 space-y-3 rounded-xl bg-gray-50 p-4">
                      {reviewingPR === pr._id ? (
                        <>
                          <textarea
                            value={reviewNote}
                            onChange={(e) => setReviewNote(e.target.value)}
                            placeholder="Review note (optional)"
                            rows={3}
                            className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none"
                          />
                          <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => handleReviewPR(pr._id, 'accepted')} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">
                              Accept
                            </button>
                            <button type="button" onClick={() => handleReviewPR(pr._id, 'rejected')} className="rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white">
                              Reject
                            </button>
                            <button type="button" onClick={() => { setReviewingPR(null); setReviewNote(''); }} className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600">
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        <button type="button" onClick={() => setReviewingPR(pr._id)} className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700">
                          Review PR
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showCreateTask && (
        <Modal title="Create New Task" icon={<Sparkles size={18} />} onClose={() => { setShowCreateTask(false); setTaskForm(emptyTaskForm); }}>
          <form onSubmit={handleCreateTask} className="space-y-4">
            <Field label="Title">
              <input value={taskForm.title} onChange={(e) => setTaskForm((prev) => ({ ...prev, title: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-3 py-2" required />
            </Field>
            <Field label="Description">
              <textarea value={taskForm.description} onChange={(e) => setTaskForm((prev) => ({ ...prev, description: e.target.value }))} rows={3} className="w-full rounded-xl border border-gray-200 px-3 py-2" />
            </Field>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Priority">
                <select value={taskForm.priority} onChange={(e) => setTaskForm((prev) => ({ ...prev, priority: e.target.value }))} className="dd-select w-full">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </Field>
              <Field label="Due Date">
                <input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm((prev) => ({ ...prev, dueDate: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-3 py-2" />
              </Field>
            </div>
            <Field label="Assigned To">
              <select value={taskForm.assignedTo} onChange={(e) => setTaskForm((prev) => ({ ...prev, assignedTo: e.target.value }))} className="dd-select w-full" required>
                <option value="">Select member</option>
                {visibleMembers.map((member) => (
                  <option key={member?.user?._id} value={member?.user?._id}>{member?.user?.firstName} {member?.user?.lastName}</option>
                ))}
              </select>
            </Field>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setShowCreateTask(false); setTaskForm(emptyTaskForm); }} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600">
                Cancel
              </button>
              <button type="submit" className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white">
                Create Task
              </button>
            </div>
          </form>
        </Modal>
      )}

      {editingTask && (
        <Modal title="Update Task" icon={<Sparkles size={18} />} onClose={() => { setEditingTask(null); setEditingTaskForm(emptyTaskForm); }}>
          <form onSubmit={updateTaskDetails} className="space-y-4">
            <Field label="Title">
              <input value={editingTaskForm.title} onChange={(e) => setEditingTaskForm((prev) => ({ ...prev, title: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-3 py-2" required />
            </Field>
            <Field label="Description">
              <textarea value={editingTaskForm.description} onChange={(e) => setEditingTaskForm((prev) => ({ ...prev, description: e.target.value }))} rows={3} className="w-full rounded-xl border border-gray-200 px-3 py-2" />
            </Field>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Priority">
                <select value={editingTaskForm.priority} onChange={(e) => setEditingTaskForm((prev) => ({ ...prev, priority: e.target.value }))} className="dd-select w-full">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </Field>
              <Field label="Due Date">
                <input type="date" value={editingTaskForm.dueDate} onChange={(e) => setEditingTaskForm((prev) => ({ ...prev, dueDate: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-3 py-2" />
              </Field>
            </div>
            <Field label="Assigned To">
              <select value={editingTaskForm.assignedTo} onChange={(e) => setEditingTaskForm((prev) => ({ ...prev, assignedTo: e.target.value }))} className="dd-select w-full">
                <option value="">Keep current</option>
                {visibleMembers.map((member) => (
                  <option key={member?.user?._id} value={member?.user?._id}>{member?.user?.firstName} {member?.user?.lastName}</option>
                ))}
              </select>
            </Field>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditingTask(null)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600">
                Cancel
              </button>
              <button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showInvite && (
        <Modal title="Invite to Team" icon={<UserPlus size={18} />} onClose={() => { setShowInvite(false); setInviteForm(emptyInviteForm); }}>
          <form onSubmit={handleInvite} className="space-y-4">
            <Field label="Username">
              <input value={inviteForm.username} onChange={(e) => setInviteForm((prev) => ({ ...prev, username: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-3 py-2" required />
            </Field>
            <Field label="Message">
              <textarea value={inviteForm.message} onChange={(e) => setInviteForm((prev) => ({ ...prev, message: e.target.value }))} rows={3} className="w-full rounded-xl border border-gray-200 px-3 py-2" />
            </Field>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setShowInvite(false); setInviteForm(emptyInviteForm); }} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600">
                Cancel
              </button>
              <button type="submit" className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white">
                Send Invite
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showPRModal && (
        <Modal title="Submit Pull Request" icon={<GitPullRequest size={18} />} onClose={() => { setShowPRModal(false); setSelectedTaskForPR(null); setPrForm(emptyPrForm); }}>
          <form onSubmit={handleSubmitPR} className="space-y-4">
            <Field label="GitHub PR Link">
              <input type="url" value={prForm.githubPRLink} onChange={(e) => setPrForm((prev) => ({ ...prev, githubPRLink: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-3 py-2" required />
            </Field>
            <Field label="Message">
              <textarea value={prForm.message} onChange={(e) => setPrForm((prev) => ({ ...prev, message: e.target.value }))} rows={3} className="w-full rounded-xl border border-gray-200 px-3 py-2" />
            </Field>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setShowPRModal(false); setSelectedTaskForPR(null); setPrForm(emptyPrForm); }} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600">
                Cancel
              </button>
              <button type="submit" className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white">
                Submit PR
              </button>
            </div>
          </form>
        </Modal>
      )}

      {confirmPopup.open && (
        <Modal
          title={confirmPopup.title}
          icon={<AlertCircle size={18} />}
          onClose={() => setConfirmPopup({ open: false, title: '', message: '', intent: 'neutral', onConfirm: null })}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">{confirmPopup.message}</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmPopup({ open: false, title: '', message: '', intent: 'neutral', onConfirm: null })}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const action = confirmPopup.onConfirm;
                  setConfirmPopup({ open: false, title: '', message: '', intent: 'neutral', onConfirm: null });
                  if (typeof action === 'function') {
                    await action();
                  }
                }}
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${confirmPopup.intent === 'danger' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-500 hover:bg-amber-600'}`}
              >
                Confirm
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showTransfer && transferTarget && (
        <Modal title="Transfer Leadership" icon={<ArrowRightLeft size={18} />} onClose={() => { setShowTransfer(false); setTransferTarget(null); }}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Transfer leadership to <strong>{transferTarget.firstName} {transferTarget.lastName}</strong> (@{transferTarget.username}).
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setShowTransfer(false); setTransferTarget(null); }} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600">
                Cancel
              </button>
              <button type="button" onClick={handleTransferLeadership} className="rounded-xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-white">
                Confirm Transfer
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</p>
        <p className="mt-1 text-2xl font-extrabold text-gray-900">{value}</p>
      </div>
      <div className="rounded-xl bg-gray-100 p-2 text-gray-500"><Icon size={16} /></div>
    </div>
  </div>
);

const ProgressCard = ({ title, value, subtitle, icon: Icon }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4">
    <div className="flex items-center gap-3">
      <div className="rounded-xl bg-gray-100 p-2 text-gray-500"><Icon size={16} /></div>
      <div>
        <p className="text-sm font-semibold text-gray-500">{title}</p>
        <p className="text-xl font-extrabold text-gray-900">{value}</p>
        <p className="text-xs text-gray-400">{subtitle}</p>
      </div>
    </div>
  </div>
);

const StatChip = ({ label, value }) => (
  <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
    <p className="text-xs text-gray-400">{label}</p>
    <p className="text-sm font-bold text-gray-800">{value}</p>
  </div>
);

const Field = ({ label, children }) => (
  <label className="block space-y-1">
    <span className="text-sm font-semibold text-gray-700">{label}</span>
    {children}
  </label>
);

const MemberRow = ({ member, isLeader, isAdmin, onChangeRole, onRemove, onTransfer }) => {
  const { user: currentUser, authHeaders, navigate } = useContext(AppContext);
  const user = member?.user;
  
  const [friendRequested, setFriendRequested] = useState(false);
  const [requestingFriend, setRequestingFriend] = useState(false);

  if (!user) return null;

  const visibility = user.privacySettings?.profileVisibility || 'public';
  const showGreenBadge = visibility === 'public' || visibility === 'team-only';
  const isSelf = currentUser?._id === user._id;
  const isFriend = currentUser?.friends?.includes(user._id);

  const handleAddFriend = async () => {
    if(!user.username) return;
    try {
      setRequestingFriend(true);
      const { data } = await api.post('/invites/invitations/send-request', { username: user.username }, { headers: authHeaders });
      if (data?.success) {
        toast.success(data.message || 'Friend request sent!');
        setFriendRequested(true);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to send friend request');
    } finally {
      setRequestingFriend(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/50 p-4 transition-all hover:bg-white hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div className="flex items-center gap-4">
        <div className="relative">
          <img
            src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=6366f1&color=fff`}
            alt=""
            className="h-12 w-12 rounded-xl object-cover shadow-sm ring-2 ring-slate-100"
          />
          {showGreenBadge && (
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-white bg-emerald-500"></span>
            </span>
          )}
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold text-slate-800">{user.firstName} {user.lastName}</p>
            <span className="rounded-lg border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 shadow-sm">{member.role}</span>
          </div>
          <p className="text-sm font-medium text-slate-500">@{user.username}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {!isSelf && (
           <button type="button" onClick={() => navigate(`/dashboard/user/${user.username}`)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-indigo-600 transition-colors">
              View Profile
           </button>
        )}

        {!isSelf && !isFriend && (
          <button 
             type="button" 
             disabled={friendRequested || requestingFriend}
             onClick={handleAddFriend} 
             className={`rounded-xl px-3 py-2 text-sm font-semibold shadow-sm transition-colors ${friendRequested ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed' : 'bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-100'}`}>
            <UserPlus size={14} className="inline-block mr-1" /> {friendRequested ? 'Request Sent' : 'Add Friend'}
          </button>
        )}

        {isLeader && member.role !== 'leader' && (
          <>
            <select value={member.role} onChange={(e) => onChangeRole(user._id, e.target.value)} className="appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 outline-none hover:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 min-w-[100px]">
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <button type="button" onClick={() => onTransfer(user)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              <ArrowRightLeft size={14} className="inline-block" /> Transfer
            </button>
            <button type="button" onClick={() => onRemove(user._id)} className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-100 transition-colors">
              <UserMinus size={14} className="inline-block" /> Remove
            </button>
          </>
        )}

        {isAdmin && !isLeader && member.role !== 'leader' && !isSelf && (
          <button type="button" onClick={() => onRemove(user._id)} className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-100 transition-colors">
            <UserMinus size={14} className="inline-block" /> Remove
          </button>
        )}
      </div>
    </div>
  );
};

const TaskCard = ({
  task,
  canManage,
  currentUserId,
  onStatusChange,
  onDelete,
  onEditTask,
  onRestoreTask,
  onExtendDueDate,
  onSubmitPR,
}) => {
  const isAssignedToMe = task.assignedTo?._id === currentUserId;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
  const priorityClass = task.priority?.toLowerCase() === 'high' ? 'text-red-600 bg-red-50 border-red-200' : task.priority?.toLowerCase() === 'low' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-amber-600 bg-amber-50 border-amber-200';

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-semibold text-gray-900">{task.title}</h4>
          <p className="text-xs text-gray-500">{task.team?.name}</p>
        </div>
        <span className={`rounded-lg border px-2 py-1 text-[10px] font-bold uppercase ${priorityClass}`}>{task.priority}</span>
      </div>

      {task.description && <p className="mt-2 text-sm text-gray-600">{task.description}</p>}

      <div className="mt-3 flex items-center justify-between gap-2 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1"><CalendarDays size={12} /> {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</span>
        <span className={isOverdue ? 'font-semibold text-red-600' : ''}>{isOverdue ? 'Overdue' : task.status}</span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <img
          src={task.assignedTo?.profilePicture || `https://ui-avatars.com/api/?name=${task.assignedTo?.firstName}+${task.assignedTo?.lastName}&background=6366f1&color=fff`}
          alt=""
          className="h-7 w-7 rounded-lg object-cover"
        />
        <span className="text-xs text-gray-600">{task.assignedTo?.firstName} {task.assignedTo?.lastName}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {!task.isDeleted && isAssignedToMe && task.status === 'todo' && (
          <button type="button" onClick={() => onStatusChange(task._id, 'in-progress')} className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-[10px] font-bold text-blue-700">
            Start Working
          </button>
        )}

        {!task.isDeleted && isAssignedToMe && task.status === 'in-progress' && (
          <button type="button" onClick={() => onSubmitPR(task._id)} className="rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1.5 text-[10px] font-bold text-purple-700">
            Submit PR
          </button>
        )}

        {canManage && !task.isDeleted && (
          <>
            <button type="button" onClick={() => onEditTask(task)} className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-[10px] font-bold text-indigo-700">
              Edit
            </button>
            <button type="button" onClick={() => onExtendDueDate(task._id, task.dueDate)} className="rounded-lg border border-cyan-200 bg-cyan-50 px-2.5 py-1.5 text-[10px] font-bold text-cyan-700">
              +1 Day
            </button>
            <select value={task.status} onChange={(e) => onStatusChange(task._id, e.target.value)} className="rounded-lg border border-gray-200 px-2 py-1 text-[10px] font-bold uppercase text-gray-700">
              {TASK_STATUSES.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </>
        )}

        {canManage && !task.isDeleted && (
          <button type="button" onClick={() => onDelete(task._id)} className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[10px] font-bold text-red-700">
            Delete
          </button>
        )}

        {canManage && task.isDeleted && (
          <button type="button" onClick={() => onRestoreTask(task._id)} className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[10px] font-bold text-emerald-700">
            Restore
          </button>
        )}
      </div>
    </div>
  );
};

const Modal = ({ title, icon, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon && <div className="rounded-xl bg-gray-100 p-2">{icon}</div>}
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"><X size={18} /></button>
      </div>
      {children}
    </div>
  </div>
);

export default TeamDetails;