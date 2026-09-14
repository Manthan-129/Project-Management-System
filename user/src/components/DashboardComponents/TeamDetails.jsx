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
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api/axiosInstance.js';
import { subscribeToTeamRoom, unsubscribeFromTeamRoom } from '../../api/socket.js';
import { SOCKET_EVENTS } from '../../api/socketEvents.js';
import { AppContext } from '../../context/AppContext.jsx';
import Loading from '../LoadingPage.jsx';

const COLUMNS = [
  {
    key: 'todo',
    label: 'To Do',
    icon: ClipboardList,
    accentColor: 'text-sky-400',
    bgTint: 'bg-[#0c1f38]',
    borderTint: 'border-[#1b3a5c]',
    badgeBg: 'bg-[#132d52] text-slate-200',
    headerBg: 'bg-[#0e2444] border-b border-[#1b3a5c]',
    stripColor: 'bg-sky-500',
  },
  {
    key: 'in-progress',
    label: 'In Progress',
    icon: Clock,
    accentColor: 'text-amber-400',
    bgTint: 'bg-[#0c1f38]',
    borderTint: 'border-[#1b3a5c]',
    badgeBg: 'bg-[#132d52] text-slate-200',
    headerBg: 'bg-[#0e2444] border-b border-[#1b3a5c]',
    stripColor: 'bg-amber-500',
  },
  {
    key: 'in-review',
    label: 'In Review',
    icon: GitPullRequest,
    accentColor: 'text-indigo-400',
    bgTint: 'bg-[#0c1f38]',
    borderTint: 'border-[#1b3a5c]',
    badgeBg: 'bg-[#132d52] text-slate-200',
    headerBg: 'bg-[#0e2444] border-b border-[#1b3a5c]',
    stripColor: 'bg-indigo-500',
  },
  {
    key: 'completed',
    label: 'Done',
    icon: CheckCircle2,
    accentColor: 'text-emerald-400',
    bgTint: 'bg-[#0c1f38]',
    borderTint: 'border-[#1b3a5c]',
    badgeBg: 'bg-[#132d52] text-slate-200',
    headerBg: 'bg-[#0e2444] border-b border-[#1b3a5c]',
    stripColor: 'bg-emerald-500',
  },
  {
    key: 'deleted',
    label: 'Deleted',
    icon: AlertCircle,
    accentColor: 'text-rose-400',
    bgTint: 'bg-[#0c1f38]',
    borderTint: 'border-[#1b3a5c]',
    badgeBg: 'bg-[#132d52] text-slate-200',
    headerBg: 'bg-[#0e2444] border-b border-[#1b3a5c]',
    stripColor: 'bg-rose-500',
  },
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
  const { token, setToken, user, navigate, authHeaders, socket } = useContext(AppContext);

  const [team, setTeam] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [kanbanBoard, setKanbanBoard] = useState(emptyBoard());
  const [progressData, setProgressData] = useState(null);
  const [pullRequests, setPullRequests] = useState([]);

  const teamStats = useMemo(() => {
    const now = new Date();
    const stats = {
      total: 0,
      byStatus: {
        todo: 0,
        'in-progress': 0,
        'in-review': 0,
        completed: 0,
      },
      byPriority: {
        high: 0,
        medium: 0,
        low: 0,
      },
      overDue: 0,
      deletedTasks: kanbanBoard.deleted || [],
    };

    ['todo', 'in-progress', 'in-review', 'completed'].forEach((status) => {
      const list = kanbanBoard[status] || [];
      stats.byStatus[status] = list.length;
      stats.total += list.length;
      list.forEach((t) => {
        const p = (t.priority || '').toLowerCase();
        if (stats.byPriority[p] !== undefined) {
          stats.byPriority[p]++;
        }
        if (t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed') {
          stats.overDue++;
        }
      });
    });

    return stats;
  }, [kanbanBoard]);

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

  const [isInviting, setIsInviting] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isUpdatingTask, setIsUpdatingTask] = useState(false);
  const [isSubmittingPR, setIsSubmittingPR] = useState(false);
  const [isReviewingPR, setIsReviewingPR] = useState(false);
  const [isTransferringLeadership, setIsTransferringLeadership] = useState(false);
  const [isRemovingMember, setIsRemovingMember] = useState(false);
  const [isLeavingTeam, setIsLeavingTeam] = useState(false);
  const [isDeletingTeam, setIsDeletingTeam] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isRestoringTask, setIsRestoringTask] = useState(false);
  const [isExtendingDueDate, setIsExtendingDueDate] = useState(false);
  const [isChangingRole, setIsChangingRole] = useState(false);

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

  const fetchTeam = useCallback(async () => {
    const { data } = await api.get(`/teams/${teamId}`, { headers: authHeaders });
    if (!data?.success) throw new Error(data?.message || 'Failed to fetch team');
    setTeam(data.team);
  }, [teamId, authHeaders]);

  const fetchMembers = useCallback(async () => {
    const { data } = await api.get(`/teams/all-members/${teamId}`, { headers: authHeaders });
    if (!data?.success) throw new Error(data?.message || 'Failed to fetch members');
    setTeamMembers(Array.isArray(data.members) ? data.members : []);
    setTeam((prev) => (prev ? { ...prev, leader: data.leader || prev.leader } : prev));
  }, [teamId, authHeaders]);

  const fetchTasks = useCallback(async () => {
    const { data } = await api.get(`/tasks/team-task/${teamId}`, { headers: authHeaders });
    if (!data?.success) throw new Error(data?.message || 'Failed to fetch tasks');
    setKanbanBoard(data.kanbanBoard || emptyBoard());
  }, [teamId, authHeaders]);

  const fetchProgress = useCallback(async () => {
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
  }, [teamId, authHeaders]);

  const fetchPullRequests = useCallback(async () => {
    const statuses = ['pending', 'accepted', 'rejected'];
    try {
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
    } catch (error) {
       console.error('Error fetching pull requests:', error);
    }
  }, [teamId, authHeaders]);

  const loadAll = useCallback(async () => {
    if (!token || !teamId) return;

    setLoading(true);
    try {
      await Promise.all([fetchTeam(), fetchMembers(), fetchTasks(), fetchPullRequests()]);
    } catch (error) {
      if (error?.response?.status === 401) {
        setToken(null);
        localStorage.removeItem('token');
        return; // Silent failure for 401
      }
      toast.error(error?.response?.data?.message || error.message || 'Unable to load team details');
    } finally {
      setLoading(false);
    }
  }, [token, teamId, fetchTeam, fetchMembers, fetchTasks, fetchPullRequests, setToken]);

  useEffect(() => {
    if (token && teamId) {
      loadAll();
    } else {
      setLoading(false);
    }
  }, [token, teamId, loadAll]);

  // Real-time pure state mutator for task status updates
  const applyTaskStatusUpdate = useCallback((taskId, newStatus, completedAt, taskPayload) => {
    if (!taskId || !newStatus) return;
    setKanbanBoard((prev) => {
      const next = {
        todo: [],
        'in-progress': [],
        'in-review': [],
        completed: [],
        deleted: [],
      };

      let currentTask = null;

      COLUMNS.forEach((col) => {
        (prev[col.key] || []).forEach((item) => {
          if (item._id === taskId) {
            currentTask = {
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

      if (!currentTask && taskPayload) {
        currentTask = {
          ...taskPayload,
          status: newStatus,
          completedAt: completedAt || taskPayload.completedAt,
          isDeleted: false,
        };
      }

      if (currentTask && next[newStatus]) {
        next[newStatus].unshift(currentTask);
      }

      return next;
    });
  }, []);

  // Real-time pure state mutator for task creation
  const applyTaskCreated = useCallback((newTask) => {
    if (!newTask?._id) return;
    setKanbanBoard((prev) => {
      const targetStatus = newTask.status || 'todo';
      const exists = COLUMNS.some((col) =>
        (prev[col.key] || []).some((item) => item._id === newTask._id)
      );
      if (exists) return prev;

      return {
        ...prev,
        [targetStatus]: [newTask, ...(prev[targetStatus] || [])],
      };
    });
  }, []);

  // Real-time pure state mutator for task edit/field update
  const applyTaskUpdated = useCallback((taskId, updatedTask) => {
    if (!taskId) return;
    setKanbanBoard((prev) => {
      const next = {};
      COLUMNS.forEach((col) => {
        next[col.key] = (prev[col.key] || []).map((item) => {
          if (item._id === taskId) {
            return {
              ...item,
              ...(updatedTask || {}),
              assignedTo: updatedTask?.assignedTo || item.assignedTo,
              assignedBy: updatedTask?.assignedBy || item.assignedBy,
            };
          }
          return item;
        });
      });
      return next;
    });
  }, []);

  // Real-time pure state mutator for task deletion
  const applyTaskDeleted = useCallback((taskId, taskPayload) => {
    if (!taskId) return;
    setKanbanBoard((prev) => {
      const next = {
        todo: [],
        'in-progress': [],
        'in-review': [],
        completed: [],
        deleted: [],
      };
      let targetTask = null;

      COLUMNS.forEach((col) => {
        (prev[col.key] || []).forEach((item) => {
          if (item._id === taskId) {
            targetTask = { ...item, ...(taskPayload || {}), isDeleted: true };
          } else {
            next[col.key].push(item);
          }
        });
      });

      if (!targetTask && taskPayload) {
        targetTask = { ...taskPayload, isDeleted: true };
      }

      if (targetTask) {
        next.deleted.unshift(targetTask);
      }

      return next;
    });
  }, []);

  // Real-time pure state mutator for restoring a task
  const applyTaskRestored = useCallback((taskId, taskPayload) => {
    if (!taskId) return;
    setKanbanBoard((prev) => {
      const next = {
        todo: [],
        'in-progress': [],
        'in-review': [],
        completed: [],
        deleted: [],
      };
      let restoredTask = null;

      COLUMNS.forEach((col) => {
        (prev[col.key] || []).forEach((item) => {
          if (item._id === taskId) {
            restoredTask = {
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

      if (!restoredTask && taskPayload) {
        restoredTask = {
          ...taskPayload,
          isDeleted: false,
          status: taskPayload?.status || 'todo',
        };
      }

      if (restoredTask) {
        const destStatus = restoredTask.status || 'todo';
        if (next[destStatus]) {
          next[destStatus].unshift(restoredTask);
        }
      }

      return next;
    });
  }, []);

  // Real-time WebSocket connection to Team Workspace Room
  useEffect(() => {
    if (!socket || !teamId) return;

    subscribeToTeamRoom(teamId, (result) => {
      if (!result?.success && result?.message) {
        toast.error(result.message);
      }
    });

    const handleTaskCreated = (data) => {
      if (data?.teamId && data.teamId.toString() !== teamId.toString()) return;
      if (data?.task) {
        applyTaskCreated(data.task);
        if (data.task?.assignedBy?._id !== user?._id) {
          toast.info(`New task added: ${data.task.title || 'Task'}`);
        }
      }
      if (activeTab === 'progress') fetchProgress();
    };

    const handleTaskStatusUpdated = (data) => {
      if (data?.teamId && data.teamId.toString() !== teamId.toString()) return;
      if (data?.taskId && data?.status) {
        applyTaskStatusUpdate(data.taskId, data.status, data.completedAt, data.task);
      }
      if (activeTab === 'progress') fetchProgress();
    };

    const handleTaskUpdated = (data) => {
      if (data?.teamId && data.teamId.toString() !== teamId.toString()) return;
      if (data?.taskId && data?.task) {
        applyTaskUpdated(data.taskId, data.task);
      }
      if (activeTab === 'progress') fetchProgress();
    };

    const handleTaskDeleted = (data) => {
      if (data?.teamId && data.teamId.toString() !== teamId.toString()) return;
      if (data?.taskId) {
        applyTaskDeleted(data.taskId, data.task);
      }
      if (activeTab === 'progress') fetchProgress();
    };

    const handleTaskRestored = (data) => {
      if (data?.teamId && data.teamId.toString() !== teamId.toString()) return;
      if (data?.taskId) {
        applyTaskRestored(data.taskId, data.task);
      }
      if (activeTab === 'progress') fetchProgress();
    };

    const handlePRCreated = (data) => {
      if (data?.teamId && data.teamId.toString() !== teamId.toString()) return;
      if (data?.pullRequest) {
        setPullRequests((prev) => [data.pullRequest, ...prev.filter((p) => p._id !== data.pullRequest._id)]);
      }
    };

    const handlePRReviewed = (data) => {
      if (data?.teamId && data.teamId.toString() !== teamId.toString()) return;
      if (data?.pullRequest) {
        setPullRequests((prev) =>
          prev.map((p) => (p._id === data.pullRequest._id ? { ...p, ...data.pullRequest } : p))
        );
      }
      if (activeTab === 'progress') fetchProgress();
    };

    const handleMemberJoined = (data) => {
      if (data?.teamId && data.teamId.toString() !== teamId.toString()) return;
      fetchMembers();
      fetchTeam();
      if (activeTab === 'progress') fetchProgress();
    };

    const handleMemberRemoved = (data) => {
      if (data?.teamId && data.teamId.toString() !== teamId.toString()) return;
      const targetId = data?.memberId;
      if (targetId && user?._id && targetId.toString() === user._id.toString()) {
        toast.warn('You have been removed from this team.');
        navigate('/dashboard/teams');
        return;
      }
      if (targetId) {
        setTeamMembers((prev) => prev.filter((m) => m.user?._id !== targetId && m.user !== targetId));
      }
      if (activeTab === 'progress') fetchProgress();
    };

    const handleMemberLeft = (data) => {
      if (data?.teamId && data.teamId.toString() !== teamId.toString()) return;
      const targetId = data?.userId;
      if (targetId) {
        setTeamMembers((prev) => prev.filter((m) => m.user?._id !== targetId && m.user !== targetId));
      }
      if (activeTab === 'progress') fetchProgress();
    };

    const handleMemberRoleChanged = (data) => {
      if (data?.teamId && data.teamId.toString() !== teamId.toString()) return;
      if (data?.memberId && data?.role) {
        setTeamMembers((prev) =>
          prev.map((m) =>
            m.user?._id === data.memberId || m.user === data.memberId
              ? { ...m, role: data.role }
              : m
          )
        );
      }
    };

    const handleLeadershipTransferred = (data) => {
      if (data?.teamId && data.teamId.toString() !== teamId.toString()) return;
      fetchTeam();
      fetchMembers();
    };

    const handleTeamDeleted = (data) => {
      if (data?.teamId && data.teamId.toString() !== teamId.toString()) return;
      toast.warn('This team workspace was deleted by the team leader.');
      navigate('/dashboard/teams');
    };

    socket.on(SOCKET_EVENTS.TASK_CREATED, handleTaskCreated);
    socket.on(SOCKET_EVENTS.TASK_STATUS_UPDATED, handleTaskStatusUpdated);
    socket.on(SOCKET_EVENTS.TASK_UPDATED, handleTaskUpdated);
    socket.on(SOCKET_EVENTS.TASK_DELETED, handleTaskDeleted);
    socket.on(SOCKET_EVENTS.TASK_RESTORED, handleTaskRestored);
    socket.on(SOCKET_EVENTS.PR_CREATED, handlePRCreated);
    socket.on(SOCKET_EVENTS.PR_REVIEWED, handlePRReviewed);
    socket.on(SOCKET_EVENTS.TEAM_MEMBER_JOINED, handleMemberJoined);
    socket.on(SOCKET_EVENTS.TEAM_MEMBER_REMOVED, handleMemberRemoved);
    socket.on(SOCKET_EVENTS.TEAM_MEMBER_LEFT, handleMemberLeft);
    socket.on(SOCKET_EVENTS.TEAM_MEMBER_ROLE_CHANGED, handleMemberRoleChanged);
    socket.on(SOCKET_EVENTS.TEAM_LEADERSHIP_TRANSFERRED, handleLeadershipTransferred);
    socket.on(SOCKET_EVENTS.TEAM_DELETED, handleTeamDeleted);

    return () => {
      unsubscribeFromTeamRoom(teamId);
      socket.off(SOCKET_EVENTS.TASK_CREATED, handleTaskCreated);
      socket.off(SOCKET_EVENTS.TASK_STATUS_UPDATED, handleTaskStatusUpdated);
      socket.off(SOCKET_EVENTS.TASK_UPDATED, handleTaskUpdated);
      socket.off(SOCKET_EVENTS.TASK_DELETED, handleTaskDeleted);
      socket.off(SOCKET_EVENTS.TASK_RESTORED, handleTaskRestored);
      socket.off(SOCKET_EVENTS.PR_CREATED, handlePRCreated);
      socket.off(SOCKET_EVENTS.PR_REVIEWED, handlePRReviewed);
      socket.off(SOCKET_EVENTS.TEAM_MEMBER_JOINED, handleMemberJoined);
      socket.off(SOCKET_EVENTS.TEAM_MEMBER_REMOVED, handleMemberRemoved);
      socket.off(SOCKET_EVENTS.TEAM_MEMBER_LEFT, handleMemberLeft);
      socket.off(SOCKET_EVENTS.TEAM_MEMBER_ROLE_CHANGED, handleMemberRoleChanged);
      socket.off(SOCKET_EVENTS.TEAM_LEADERSHIP_TRANSFERRED, handleLeadershipTransferred);
      socket.off(SOCKET_EVENTS.TEAM_DELETED, handleTeamDeleted);
    };
  }, [
    socket,
    teamId,
    applyTaskCreated,
    applyTaskStatusUpdate,
    applyTaskUpdated,
    applyTaskDeleted,
    applyTaskRestored,
    fetchProgress,
    fetchMembers,
    fetchTeam,
    activeTab,
    user,
    navigate,
  ]);

  useEffect(() => {
    if (activeTab === 'progress' && token && teamId && !progressData) {
      fetchProgress();
    }
  }, [activeTab, token, teamId, progressData, fetchProgress]);

  const handleCreateTask = async (event) => {
    event.preventDefault();
    setIsCreatingTask(true);
    try {
      const { data } = await api.post(
        '/tasks/create',
        {
          teamId,
          assignedTo: taskForm.assignedTo,
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

      setShowCreateTask(false);
      setTaskForm(emptyTaskForm);
      if (data?.task) {
        applyTaskCreated(data.task);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to create task');
    } finally {
      setIsCreatingTask(false);
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    setIsUpdatingStatus(true);
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

      applyTaskStatusUpdate(taskId, status, data?.task?.completedAt, data?.task);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to update task status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const deleteTask = async (taskId) => {
    setConfirmPopup({
      open: true,
      title: 'Delete Task',
      message: 'Delete this task?',
      intent: 'danger',
      onConfirm: async () => {
        setIsUpdatingTask(true);
        try {
          const { data } = await api.delete(`/tasks/delete/${taskId}`, { headers: authHeaders });
          if (!data?.success) {
            toast.error(data?.message || 'Failed to delete task');
            return;
          }

          applyTaskDeleted(taskId, data?.task);
        } catch (error) {
          toast.error(error?.response?.data?.message || 'Unable to delete task');
        } finally {
          setIsUpdatingTask(false);
        }
      },
    });
  };

  const restoreTask = async (taskId) => {
    setIsRestoringTask(true);
    try {
      const { data } = await api.patch(`/tasks/restore/${taskId}`, {}, { headers: authHeaders });
      if (!data?.success) {
        toast.error(data?.message || 'Failed to restore task');
        return;
      }

      applyTaskRestored(taskId, data?.task);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to restore task');
    } finally {
      setIsRestoringTask(false);
    }
  };

  const extendedDueDate = async (taskId, currentDueDate) => {
    const baseDate = currentDueDate ? new Date(currentDueDate) : new Date();
    const nextDate = new Date(baseDate);
    nextDate.setDate(nextDate.getDate() + 1);
    const dueDate = nextDate.toISOString().slice(0, 10);

    setIsExtendingDueDate(true);
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

      applyTaskUpdated(taskId, data?.task);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to extend due date');
    } finally {
      setIsExtendingDueDate(false);
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
    setIsUpdatingTask(true);
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

      const updatedId = editingTask._id;
      setEditingTask(null);
      setEditingTaskForm(emptyTaskForm);
      applyTaskUpdated(updatedId, data?.task);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to update task');
    } finally {
      setIsUpdatingTask(false);
    }
  };

  const handleSubmitPR = async (event) => {
    event.preventDefault();
    if (!selectedTaskForPR) return;
    setIsSubmittingPR(true);
    try {
      const { data } = await api.post(
        '/pull-requests/create',
        {
          taskId: selectedTaskForPR,
          githubPRLink: prForm.githubPRLink.trim(),
          message: prForm.message.trim(),
        },
        { headers: authHeaders }
      );

      if (!data?.success) {
        toast.error(data?.message || 'Failed to submit PR');
        return;
      }

      const taskId = selectedTaskForPR;
      setShowPRModal(false);
      setSelectedTaskForPR(null);
      setPrForm(emptyPrForm);
      if (data?.pullRequest) {
        setPullRequests((prev) => [data.pullRequest, ...prev.filter((p) => p._id !== data.pullRequest._id)]);
      }
      applyTaskStatusUpdate(taskId, 'in-review');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to submit PR');
    } finally {
      setIsSubmittingPR(false);
    }
  };

  const handleReviewPR = async (prId, status) => {
    setIsReviewingPR(true);
    try {
      const { data } = await api.put(
        `/pull-requests/review/${prId}`,
        { status, reviewNote },
        { headers: authHeaders }
      );

      if (!data?.success) {
        toast.error(data?.message || 'Failed to review pull request');
        return;
      }

      setReviewingPR(null);
      setReviewNote('');
      if (data?.pullRequest) {
        setPullRequests((prev) =>
          prev.map((p) => (p._id === prId ? { ...p, ...data.pullRequest } : p))
        );
        const resolvedTaskId = data.pullRequest.task?._id || data.pullRequest.task;
        const targetStatus = status === 'accepted' ? 'completed' : 'in-progress';
        if (resolvedTaskId) {
          applyTaskStatusUpdate(resolvedTaskId, targetStatus);
        }
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to review PR');
    } finally {
      setIsReviewingPR(false);
    }
  };

  const handleInvite = async (event) => {
    event.preventDefault();
    setIsInviting(true);
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

      setInviteForm(emptyInviteForm);
      setShowInvite(false);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to send invitation');
    } finally {
      setIsInviting(false);
    }
  };

  const changeRole = async (memberId, role) => {
    setIsChangingRole(true);
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

      await fetchMembers();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to change role');
    } finally {
      setIsChangingRole(false);
    }
  };

  const handleTransferLeadership = async () => {
    if (!transferTarget?._id) return;
    setIsTransferringLeadership(true);
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

      setShowTransfer(false);
      setTransferTarget(null);
      await Promise.all([fetchTeam(), fetchMembers()]);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to transfer leadership');
    } finally {
      setIsTransferringLeadership(false);
    }
  };

  const removeMember = async (memberId) => {
    setConfirmPopup({
      open: true,
      title: 'Remove Member',
      message: 'Remove this member from the team?',
      intent: 'danger',
      onConfirm: async () => {
        setIsRemovingMember(true);
        try {
          const { data } = await api.delete(`/teams/remove-member/${teamId}/${memberId}`, {
            headers: authHeaders,
          });

          if (!data?.success) {
            toast.error(data?.message || 'Failed to remove member');
            return;
          }

          await fetchMembers();
        } catch (error) {
          toast.error(error?.response?.data?.message || 'Unable to remove member');
        } finally {
          setIsRemovingMember(false);
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
        setIsLeavingTeam(true);
        try {
          const { data } = await api.delete(`/teams/leave/${teamId}`, { headers: authHeaders });

          if (!data?.success) {
            toast.error(data?.message || 'Failed to leave team');
            return;
          }

          navigate('/dashboard/teams');
        } catch (error) {
          toast.error(error?.response?.data?.message || 'Unable to leave team');
        } finally {
          setIsLeavingTeam(false);
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
        setIsDeletingTeam(true);
        try {
          const { data } = await api.delete(`/teams/delete/${teamId}`, { headers: authHeaders });

          if (!data?.success) {
            toast.error(data?.message || 'Failed to delete team');
            return;
          }

          navigate('/dashboard/teams');
        } catch (error) {
          toast.error(error?.response?.data?.message || 'Unable to delete team');
        } finally {
          setIsDeletingTeam(false);
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
    <div className="space-y-5 dd-fade-up">
      {/* Team Header Banner */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[#1b3a5c] bg-[#0c1f38] p-4 text-white shadow-xs md:flex-row md:items-center md:justify-between md:p-5">
        <div className="flex items-start gap-3.5">
          <button
            type="button"
            onClick={() => navigate('/dashboard/teams')}
            className="mt-0.5 rounded-xl border border-[#1b3a5c] bg-[#0a1829] p-2 text-slate-300 shadow-xs transition-colors hover:bg-[#132d52] hover:text-white"
          >
            <ArrowLeft size={16} />
          </button>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-white md:text-2xl">{team.name}</h1>
              {isLeader && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  <Crown size={10} /> Leader
                </span>
              )}
              {isAdmin && !isLeader && (
                <span className="inline-flex items-center gap-1 rounded-full border border-indigo-500/40 bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                  <Shield size={10} /> Admin
                </span>
              )}
            </div>
            <p className="text-xs font-medium text-slate-300">{team.title}</p>
            {team.description && <p className="mt-0.5 text-xs text-slate-400">{team.description}</p>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canManage && (
            <>
              <button
                disabled={isInviting}
                type="button"
                onClick={() => setShowInvite(true)}
                className="dd-ghost-button !py-2 !text-xs"
              >
                <UserPlus size={14} /> Invite
              </button>
              <button
                disabled={isCreatingTask}
                type="button"
                onClick={() => setShowCreateTask(true)}
                className="dd-primary-button !py-2 !text-xs"
              >
                <Plus size={14} /> New Task
              </button>
            </>
          )}
          {isLeader ? (
            <button
              disabled={isDeletingTeam}
              type="button"
              onClick={deleteTeam}
              className="dd-danger-button !py-2 !text-xs"
            >
              {isDeletingTeam ? 'Deleting...' : 'Delete Team'}
            </button>
          ) : (
            <button
              disabled={isLeavingTeam}
              type="button"
              onClick={leaveTeam}
              className="dd-danger-button !py-2 !text-xs"
            >
              {isLeavingTeam ? 'Leaving...' : 'Leave Team'}
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-1.5 rounded-xl border border-[#1b3a5c] bg-[#081526] p-1.5">
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
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                active ? 'bg-[#0c1f38] text-sky-400 shadow-xs ring-1 ring-[#1b3a5c]' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon size={14} />
              {item.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'board' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#1b3a5c] bg-[#0c1f38] p-3 text-white shadow-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-300"><Filter size={13} className="inline mr-1" /> Member:</span>
                <select
                  value={filterMember}
                  onChange={(e) => setFilterMember(e.target.value)}
                  className="rounded-lg border border-[#1b3a5c] bg-[#0a1829] px-2.5 py-1.5 text-xs font-medium text-slate-200 outline-none hover:border-slate-400 focus:border-sky-400 focus:bg-[#0c1f38]"
                >
                  <option value="all">All Members</option>
                  {visibleMembers.map((member) => (
                    <option key={member?.user?._id} value={member?.user?._id}>
                      {member?.user?.firstName} {member?.user?.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-300">Priority:</span>
                <div className="flex gap-1">
                  {PRIORITIES.map((priority) => (
                    <button
                      key={priority}
                      type="button"
                      onClick={() => setFilterPriority(priority)}
                      className={`rounded-lg px-2 py-1 text-xs font-semibold capitalize transition-all ${
                        filterPriority === priority
                          ? 'bg-[#132d52] text-sky-300 ring-1 ring-sky-400/40'
                          : 'text-slate-400 hover:bg-[#0a1829] hover:text-slate-200'
                      }`}
                    >
                      {priority}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {(filterMember !== 'all' || filterPriority !== 'all') && (
              <button
                type="button"
                onClick={() => { setFilterMember('all'); setFilterPriority('all'); }}
                className="rounded-lg border border-[#1b3a5c] bg-[#0a1829] px-2.5 py-1 text-xs font-semibold text-slate-300 hover:bg-[#132d52] hover:text-white"
              >
                Reset Filters
              </button>
            )}
          </div>

          {/* Stat Cards Strip */}
          {teamStats && (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
              <StatCard title="Visible" value={totalFilteredTasks} icon={Target} tone="indigo" />
              <StatCard title="To Do" value={teamStats.byStatus?.todo || 0} icon={ClipboardList} tone="sky" />
              <StatCard title="In Progress" value={teamStats.byStatus?.['in-progress'] || 0} icon={Clock} tone="amber" />
              <StatCard title="In Review" value={teamStats.byStatus?.['in-review'] || 0} icon={GitPullRequest} tone="indigo" />
              <StatCard title="Done" value={teamStats.byStatus?.completed || 0} icon={CheckCircle2} tone="emerald" />
              <StatCard title="Deleted" value={teamStats.deletedTasks?.length || 0} icon={AlertCircle} tone="rose" />
            </div>
          )}

          {/* Kanban Columns - Fixed height, dedicated scroll track */}
          <div className="flex gap-3.5 overflow-x-auto pb-3 xl:grid xl:grid-cols-5 xl:overflow-x-visible">
            {COLUMNS.map((column) => {
              const Icon = column.icon;
              const tasks = filteredBoard[column.key] || [];
              return (
                <div
                  key={column.key}
                  className={`flex flex-col min-w-[270px] xl:min-w-0 rounded-2xl border ${column.borderTint} ${column.bgTint} p-3 shadow-xs transition-all`}
                >
                  {/* Column Header */}
                  <div className={`mb-3 flex items-center justify-between rounded-xl border ${column.borderTint} ${column.headerBg} px-3 py-2 shadow-xs`}>
                    <div className="flex items-center gap-2">
                      <div className={`flex h-6 w-6 items-center justify-center rounded-lg bg-[#0a1829] border border-[#1b3a5c] shadow-xs ${column.accentColor}`}>
                        <Icon size={14} />
                      </div>
                      <h3 className="text-xs font-bold text-white">{column.label}</h3>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${column.badgeBg}`}>
                      {tasks.length}
                    </span>
                  </div>

                  {/* Scrollable Column Track - NEVER expands down indefinitely */}
                  <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[calc(100vh-320px)] min-h-[480px] pr-1 custom-scrollbar">
                    {tasks.map((task) => (
                      <TaskCard
                        key={task._id}
                        task={task}
                        columnTheme={column}
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
                        isActionPending={isUpdatingStatus || isUpdatingTask || isRestoringTask || isExtendingDueDate || isSubmittingPR}
                      />
                    ))}

                    {tasks.length === 0 && (
                      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200/80 bg-white/40 py-12 text-center">
                        <div className="mb-2 rounded-xl bg-white p-2 text-slate-300 shadow-xs">
                          <Icon size={18} />
                        </div>
                        <p className="text-xs font-medium text-slate-400">No tasks in {column.label.toLowerCase()}</p>
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
              isActionPending={isChangingRole || isRemovingMember || isTransferringLeadership}
            />
          )}

          <div className="space-y-3 max-h-[calc(100vh-340px)] overflow-y-auto pr-1.5 custom-scrollbar">
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
                  isActionPending={isChangingRole || isRemovingMember || isTransferringLeadership}
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

              <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-100">Member Leaderboard</h3>
                    <p className="text-sm text-slate-400">Ranked by completion rate</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {(progressData.memberProgress || []).map((entry, index) => (
                    <div key={entry.user._id} className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-sm font-bold text-slate-300">#{index + 1}</div>
                          <img
                            src={entry.user.profilePicture || `https://ui-avatars.com/api/?name=${entry.user.firstName}+${entry.user.lastName}&background=1e293b&color=fff`}
                            alt=""
                            className="h-11 w-11 rounded-xl object-cover ring-1 ring-slate-700"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-slate-100">{entry.user.firstName} {entry.user.lastName}</p>
                              <span className="rounded-lg border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-300">{entry.role}</span>
                            </div>
                            <p className="text-sm text-slate-400">@{entry.user.username}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-2xl font-extrabold text-slate-100">{entry.stats.completionRate}%</p>
                          <p className="text-xs text-slate-400">completion rate</p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-2 text-sm text-slate-300 md:grid-cols-4">
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
            <div className="rounded-2xl border border-dashed border-slate-700/70 bg-slate-900/40 p-8 text-center text-slate-400">
              No progress data available yet.
            </div>
          )}
        </div>
      )}

      {activeTab === 'prs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-[#1b3a5c] bg-[#0c1f38] p-4 text-white shadow-xs">
            <div>
              <h3 className="text-lg font-bold text-white">Team Pull Requests</h3>
              <p className="text-sm text-slate-300">Review and track pull requests submitted for this team</p>
            </div>

            <select value={prFilter} onChange={(e) => setPrFilter(e.target.value)} className="w-full appearance-none rounded-xl border border-[#1b3a5c] bg-[#0a1829] px-4 py-2.5 text-sm font-medium text-slate-200 outline-none transition-all hover:border-slate-400 focus:border-sky-400 focus:bg-[#0c1f38] min-w-[180px]">
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {combinedPullRequests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#1b3a5c] bg-[#0c1f38] p-8 text-center text-slate-300">
              No pull requests found.
            </div>
          ) : (
            <div className="grid gap-4">
              {combinedPullRequests.map((pr) => (
                <div key={pr._id} className="rounded-2xl border border-[#1b3a5c] bg-[#0c1f38] p-5 text-white shadow-xs">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-white text-base">{pr.task?.title}</h4>
                      <p className="text-sm text-slate-300">{pr.sender?.firstName} {pr.sender?.lastName} (@{pr.sender?.username})</p>
                      <p className="mt-1 text-xs text-slate-400">Team: {pr.team?.name}</p>
                    </div>

                    <span className="rounded-lg border border-[#1b3a5c] bg-[#132d52] px-2.5 py-1 text-xs font-bold uppercase text-slate-200">
                      {pr.status}
                    </span>
                  </div>

                  <a href={pr.githubPRLink} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-sky-400 hover:text-sky-300">
                    <ExternalLink size={14} /> View on GitHub
                  </a>

                  {pr.message && <p className="mt-3 text-sm text-slate-300 rounded-xl border border-[#1b3a5c] bg-[#081526] p-3">{pr.message}</p>}

                  {pr.status !== 'pending' && pr.reviewedBy && (
                    <p className="mt-3 text-sm text-slate-300">
                      Reviewed by {pr.reviewedBy.firstName} {pr.reviewedBy.lastName}
                      {pr.reviewNote ? <span className="italic text-slate-400"> - {pr.reviewNote}</span> : null}
                    </p>
                  )}

                  {pr.status === 'pending' && canManage && (
                    <div className="mt-4 space-y-3 rounded-xl border border-[#1b3a5c] bg-[#081526] p-4">
                      {reviewingPR === pr._id ? (
                        <>
                          <textarea
                            value={reviewNote}
                            onChange={(e) => setReviewNote(e.target.value)}
                            placeholder="Review note (optional)"
                            rows={3}
                            className="w-full rounded-xl border border-[#1b3a5c] bg-[#0c1f38] p-3 text-sm text-white placeholder-slate-400 outline-none focus:border-sky-400"
                          />
                          <div className="flex flex-wrap gap-2">
                            <button disabled={isReviewingPR} type="button" onClick={() => handleReviewPR(pr._id, 'accepted')} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50">
                              {isReviewingPR ? 'Accepting...' : 'Accept'}
                            </button>
                            <button disabled={isReviewingPR} type="button" onClick={() => handleReviewPR(pr._id, 'rejected')} className="rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50">
                              {isReviewingPR ? 'Rejecting...' : 'Reject'}
                            </button>
                            <button disabled={isReviewingPR} type="button" onClick={() => { setReviewingPR(null); setReviewNote(''); }} className="rounded-xl border border-[#1b3a5c] bg-[#0c1f38] px-3 py-2 text-sm font-semibold text-slate-300 hover:text-white disabled:opacity-50">
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        <button disabled={isReviewingPR} type="button" onClick={() => setReviewingPR(pr._id)} className="rounded-xl border border-[#1b3a5c] bg-[#0a1829] px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-[#132d52] hover:text-white disabled:opacity-50">
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
              <input value={taskForm.title} onChange={(e) => setTaskForm((prev) => ({ ...prev, title: e.target.value }))} className="w-full rounded-xl border border-[#1b3a5c] bg-[#081526] px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none" required />
            </Field>
            <Field label="Description">
              <textarea value={taskForm.description} onChange={(e) => setTaskForm((prev) => ({ ...prev, description: e.target.value }))} rows={3} className="w-full rounded-xl border border-[#1b3a5c] bg-[#081526] px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none" />
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
                <input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm((prev) => ({ ...prev, dueDate: e.target.value }))} className="w-full rounded-xl border border-[#1b3a5c] bg-[#081526] px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none" />
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
            <div className="flex justify-end gap-2.5 pt-2">
              <button disabled={isCreatingTask} type="button" onClick={() => { setShowCreateTask(false); setTaskForm(emptyTaskForm); }} className="rounded-xl border border-[#1b3a5c] bg-[#0a1829] px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-[#132d52] hover:text-white disabled:opacity-50">
                Cancel
              </button>
              <button disabled={isCreatingTask} type="submit" className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition disabled:opacity-50">
                {isCreatingTask ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {editingTask && (
        <Modal title="Update Task" icon={<Sparkles size={18} />} onClose={() => { setEditingTask(null); setEditingTaskForm(emptyTaskForm); }}>
          <form onSubmit={updateTaskDetails} className="space-y-4">
            <Field label="Title">
              <input value={editingTaskForm.title} onChange={(e) => setEditingTaskForm((prev) => ({ ...prev, title: e.target.value }))} className="w-full rounded-xl border border-[#1b3a5c] bg-[#081526] px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none" required />
            </Field>
            <Field label="Description">
              <textarea value={editingTaskForm.description} onChange={(e) => setEditingTaskForm((prev) => ({ ...prev, description: e.target.value }))} rows={3} className="w-full rounded-xl border border-[#1b3a5c] bg-[#081526] px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none" />
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
                <input type="date" value={editingTaskForm.dueDate} onChange={(e) => setEditingTaskForm((prev) => ({ ...prev, dueDate: e.target.value }))} className="w-full rounded-xl border border-[#1b3a5c] bg-[#081526] px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none" />
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
            <div className="flex justify-end gap-2.5 pt-2">
              <button disabled={isUpdatingTask} type="button" onClick={() => setEditingTask(null)} className="rounded-xl border border-[#1b3a5c] bg-[#0a1829] px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-[#132d52] hover:text-white disabled:opacity-50">
                Cancel
              </button>
              <button disabled={isUpdatingTask} type="submit" className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition disabled:opacity-50">
                {isUpdatingTask ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showInvite && (
        <Modal title="Invite to Team" icon={<UserPlus size={18} />} onClose={() => { setShowInvite(false); setInviteForm(emptyInviteForm); }}>
          <form onSubmit={handleInvite} className="space-y-4">
            <Field label="Username">
              <input value={inviteForm.username} onChange={(e) => setInviteForm((prev) => ({ ...prev, username: e.target.value }))} className="w-full rounded-xl border border-[#1b3a5c] bg-[#081526] px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none" required />
            </Field>
            <Field label="Message">
              <textarea value={inviteForm.message} onChange={(e) => setInviteForm((prev) => ({ ...prev, message: e.target.value }))} rows={3} className="w-full rounded-xl border border-[#1b3a5c] bg-[#081526] px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none" />
            </Field>
            <div className="flex justify-end gap-2.5 pt-2">
              <button disabled={isInviting} type="button" onClick={() => { setShowInvite(false); setInviteForm(emptyInviteForm); }} className="rounded-xl border border-[#1b3a5c] bg-[#0a1829] px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-[#132d52] hover:text-white disabled:opacity-50">
                Cancel
              </button>
              <button disabled={isInviting} type="submit" className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition disabled:opacity-50">
                {isInviting ? 'Inviting...' : 'Send Invite'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showPRModal && (
        <Modal title="Submit Pull Request" icon={<GitPullRequest size={18} />} onClose={() => { setShowPRModal(false); setSelectedTaskForPR(null); setPrForm(emptyPrForm); }}>
          <form onSubmit={handleSubmitPR} className="space-y-4">
            <Field label="GitHub PR Link">
              <input type="url" value={prForm.githubPRLink} onChange={(e) => setPrForm((prev) => ({ ...prev, githubPRLink: e.target.value }))} className="w-full rounded-xl border border-[#1b3a5c] bg-[#081526] px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none" required />
            </Field>
            <Field label="Message">
              <textarea value={prForm.message} onChange={(e) => setPrForm((prev) => ({ ...prev, message: e.target.value }))} rows={3} className="w-full rounded-xl border border-[#1b3a5c] bg-[#081526] px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none" />
            </Field>
            <div className="flex justify-end gap-2.5 pt-2">
              <button disabled={isSubmittingPR} type="button" onClick={() => { setShowPRModal(false); setSelectedTaskForPR(null); setPrForm(emptyPrForm); }} className="rounded-xl border border-[#1b3a5c] bg-[#0a1829] px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-[#132d52] hover:text-white disabled:opacity-50">
                Cancel
              </button>
              <button disabled={isSubmittingPR} type="submit" className="dd-primary-button px-4 py-2 text-sm font-semibold disabled:opacity-50">
                {isSubmittingPR ? 'Submitting...' : 'Submit PR'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {confirmPopup.open && (
        <Modal
          title={confirmPopup.title}
          icon={<AlertCircle size={18} className={confirmPopup.intent === 'danger' ? 'text-rose-400' : 'text-amber-400'} />}
          onClose={() => setConfirmPopup({ open: false, title: '', message: '', intent: 'neutral', onConfirm: null })}
        >
          <div className="space-y-4">
            <div className="rounded-xl border border-[#1b3a5c] bg-[#081526] p-3.5 text-sm leading-relaxed text-slate-200">
              {confirmPopup.message}
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmPopup({ open: false, title: '', message: '', intent: 'neutral', onConfirm: null })}
                className="rounded-xl border border-[#1b3a5c] bg-[#0a1829] px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-[#132d52] hover:text-white"
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
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition ${confirmPopup.intent === 'danger' ? 'bg-rose-600 hover:bg-rose-500' : 'bg-amber-600 hover:bg-amber-500'}`}
              >
                Confirm
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showTransfer && transferTarget && (
        <Modal title="Transfer Leadership" icon={<ArrowRightLeft size={18} className="text-amber-400" />} onClose={() => { setShowTransfer(false); setTransferTarget(null); }}>
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-slate-300">
              Are you sure you want to transfer ownership and leadership of this workspace? You will retain standard member access.
            </p>
            <div className="flex items-center gap-3 rounded-xl border border-[#1b3a5c] bg-[#081526] p-3">
              <img
                src={transferTarget.profilePicture || `https://ui-avatars.com/api/?name=${transferTarget.firstName}+${transferTarget.lastName}&background=f59e0b&color=fff`}
                alt=""
                className="h-10 w-10 rounded-xl object-cover ring-1 ring-[#1b3a5c]"
              />
              <div>
                <p className="font-bold text-white">{transferTarget.firstName} {transferTarget.lastName}</p>
                <p className="text-xs text-sky-400">@{transferTarget.username}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <button disabled={isTransferringLeadership} type="button" onClick={() => { setShowTransfer(false); setTransferTarget(null); }} className="rounded-xl border border-[#1b3a5c] bg-[#0a1829] px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-[#132d52] hover:text-white disabled:opacity-50">
                Cancel
              </button>
              <button disabled={isTransferringLeadership} type="button" onClick={handleTransferLeadership} className="rounded-xl bg-amber-600 hover:bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition disabled:opacity-50">
                {isTransferringLeadership ? 'Transferring...' : 'Confirm Transfer'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, tone = 'indigo' }) => {
  const tones = {
    indigo: { border: 'border-[#1b3a5c]', bg: 'bg-[#0c1f38]', text: 'text-indigo-400', iconBg: 'bg-indigo-500/15 text-indigo-400' },
    sky: { border: 'border-[#1b3a5c]', bg: 'bg-[#0c1f38]', text: 'text-sky-400', iconBg: 'bg-sky-500/15 text-sky-400' },
    amber: { border: 'border-[#1b3a5c]', bg: 'bg-[#0c1f38]', text: 'text-amber-400', iconBg: 'bg-amber-500/15 text-amber-400' },
    purple: { border: 'border-[#1b3a5c]', bg: 'bg-[#0c1f38]', text: 'text-purple-400', iconBg: 'bg-purple-500/15 text-purple-400' },
    emerald: { border: 'border-[#1b3a5c]', bg: 'bg-[#0c1f38]', text: 'text-emerald-400', iconBg: 'bg-emerald-500/15 text-emerald-400' },
    rose: { border: 'border-[#1b3a5c]', bg: 'bg-[#0c1f38]', text: 'text-rose-400', iconBg: 'bg-rose-500/15 text-rose-400' },
  };
  const t = tones[tone] || tones.indigo;

  return (
    <div className={`rounded-xl border ${t.border} ${t.bg} p-3 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-sm`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{title}</p>
          <p className="mt-0.5 text-xl font-black text-white">{value}</p>
        </div>
        <div className={`rounded-lg p-1.5 ${t.iconBg}`}>
          <Icon size={15} />
        </div>
      </div>
    </div>
  );
};

const ProgressCard = ({ title, value, subtitle, icon: Icon }) => (
  <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-4">
    <div className="flex items-center gap-3">
      <div className="rounded-xl bg-slate-800 border border-slate-700/70 p-2 text-indigo-400"><Icon size={16} /></div>
      <div>
        <p className="text-sm font-semibold text-slate-400">{title}</p>
        <p className="text-xl font-extrabold text-slate-100">{value}</p>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
    </div>
  </div>
);

const StatChip = ({ label, value }) => (
  <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 px-3 py-2">
    <p className="text-xs text-slate-400">{label}</p>
    <p className="text-sm font-bold text-slate-200">{value}</p>
  </div>
);

const Field = ({ label, children }) => (
  <label className="block space-y-1.5">
    <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">{label}</span>
    {children}
  </label>
);

const MemberRow = ({ member, isLeader, isAdmin, onChangeRole, onRemove, onTransfer, isActionPending }) => {
  const { user: currentUser, authHeaders, navigate } = useContext(AppContext);
  const user = member?.user;
  
  const [friendRequested, setFriendRequested] = useState(false);
  const [requestingFriend, setRequestingFriend] = useState(false);

  if (!user) return null;

  const showGreenBadge = user.privacySettings?.showOnlineStatus !== false;
  const isSelf = currentUser?._id === user._id;
  const isFriend = currentUser?.friends?.includes(user._id);

  const handleAddFriend = async () => {
    if(!user.username) return;
    try {
      setRequestingFriend(true);
      const { data } = await api.post('/invites/invitations/send-request', { username: user.username }, { headers: authHeaders });
      if (data?.success) {
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
             disabled={friendRequested || requestingFriend || isActionPending}
             onClick={handleAddFriend} 
             className={`rounded-xl px-3 py-2 text-sm font-semibold shadow-sm transition-colors ${friendRequested || requestingFriend || isActionPending ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-50' : 'bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-100'}`}>
            <UserPlus size={14} className="inline-block mr-1" /> {requestingFriend ? 'Requesting...' : friendRequested ? 'Request Sent' : 'Add Friend'}
          </button>
        )}

        {isLeader && member.role !== 'leader' && (
          <>
            <select disabled={isActionPending} value={member.role} onChange={(e) => onChangeRole(user._id, e.target.value)} className="appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 outline-none hover:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 min-w-[100px] disabled:opacity-50">
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <button disabled={isActionPending} type="button" onClick={() => onTransfer(user)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50">
              <ArrowRightLeft size={14} className="inline-block" /> Transfer
            </button>
            <button disabled={isActionPending} type="button" onClick={() => onRemove(user._id)} className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-100 transition-colors disabled:opacity-50">
              <UserMinus size={14} className="inline-block" /> Remove
            </button>
          </>
        )}

        {isAdmin && !isLeader && member.role !== 'leader' && !isSelf && (
          <button disabled={isActionPending} type="button" onClick={() => onRemove(user._id)} className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-100 transition-colors disabled:opacity-50">
            <UserMinus size={14} className="inline-block" /> Remove
          </button>
        )}
      </div>
    </div>
  );
};

const TaskCard = ({
  task,
  columnTheme,
  canManage,
  currentUserId,
  onStatusChange,
  onEditTask,
  onDelete,
  onRestoreTask,
  onExtendDueDate,
  onSubmitPR,
  isActionPending,
}) => {
  const isAssignedToMe = task.assignedTo?._id === currentUserId;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
  const priorityStyles = {
    high: 'text-rose-700 bg-rose-50 border-rose-200/80',
    medium: 'text-amber-700 bg-amber-50 border-amber-200/80',
    low: 'text-emerald-700 bg-emerald-50 border-emerald-200/80',
  };
  const priorityClass = priorityStyles[task.priority?.toLowerCase()] || 'text-slate-600 bg-slate-50 border-slate-200';

  return (
    <div className="group relative rounded-xl border border-slate-200/80 bg-white/95 p-3.5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
      {/* Subtle Accent Strip on Left */}
      <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${columnTheme?.stripColor || 'bg-slate-300'}`} />

      <div className="pl-1.5">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-xs font-bold leading-snug text-slate-800 line-clamp-2">{task.title}</h4>
          <span className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${priorityClass}`}>
            {task.priority}
          </span>
        </div>

        {task.description && (
          <p className="mt-1 text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{task.description}</p>
        )}

        <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-slate-100 pt-2 text-[10px] text-slate-400">
          <span className="inline-flex items-center gap-1 font-medium">
            <CalendarDays size={11} className="text-slate-400" />
            {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No date'}
          </span>
          <span className={isOverdue ? 'font-bold text-rose-600' : 'text-slate-400 capitalize'}>
            {isOverdue ? 'Overdue' : task.status?.replace('-', ' ')}
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <img
              src={task.assignedTo?.profilePicture || `https://ui-avatars.com/api/?name=${task.assignedTo?.firstName || 'U'}+${task.assignedTo?.lastName || 'M'}&background=6366f1&color=fff`}
              alt=""
              className="h-5 w-5 shrink-0 rounded-full object-cover ring-1 ring-slate-200"
            />
            <span className="truncate text-[11px] font-medium text-slate-600">
              {task.assignedTo?.firstName || 'Unassigned'}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-end gap-1">
            {!task.isDeleted && isAssignedToMe && task.status === 'todo' && (
              <button
                disabled={isActionPending}
                type="button"
                onClick={() => onStatusChange(task._id, 'in-progress')}
                className="rounded-md border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-[9px] font-bold text-sky-700 transition-colors hover:bg-sky-100 disabled:opacity-50"
              >
                Start
              </button>
            )}

            {!task.isDeleted && isAssignedToMe && task.status === 'in-progress' && (
              <button
                disabled={isActionPending}
                type="button"
                onClick={() => onSubmitPR(task._id)}
                className="rounded-md border border-indigo-500/30 bg-indigo-500/10 px-1.5 py-0.5 text-[9px] font-bold text-indigo-300 transition-colors hover:bg-indigo-500/20 disabled:opacity-50"
              >
                PR
              </button>
            )}

            {canManage && !task.isDeleted && (
              <>
                {task.status === 'todo' && (
                  <button
                    disabled={isActionPending}
                    type="button"
                    onClick={() => onEditTask(task)}
                    className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Edit
                  </button>
                )}
                <button
                  disabled={isActionPending}
                  type="button"
                  onClick={() => onExtendDueDate(task._id, task.dueDate)}
                  className="rounded-md border border-teal-200 bg-teal-50 px-1.5 py-0.5 text-[9px] font-bold text-teal-700 hover:bg-teal-100 disabled:opacity-50"
                  title="Extend due date by 1 day"
                >
                  +1d
                </button>
                {task.status === 'todo' && (
                  <button
                    disabled={isActionPending}
                    type="button"
                    onClick={() => onDelete(task._id)}
                    className="rounded-md border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold text-rose-600 hover:bg-rose-100 disabled:opacity-50"
                  >
                    Del
                  </button>
                )}
              </>
            )}

            {canManage && task.isDeleted && (
              <button
                disabled={isActionPending}
                type="button"
                onClick={() => onRestoreTask(task._id)}
                className="rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
              >
                Restore
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Modal = ({ title, icon, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm dd-fade-in" onClick={onClose}>
    <div className="w-full max-w-lg rounded-2xl border border-[#1b3a5c] bg-[#0c1f38] p-6 text-white shadow-[0_25px_60px_rgba(0,0,0,0.5)] dd-fade-up" onClick={(e) => e.stopPropagation()}>
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon && <div className="rounded-xl border border-[#1b3a5c] bg-[#132d52] p-2 text-indigo-400">{icon}</div>}
          <h2 className="text-lg font-bold tracking-tight text-white">{title}</h2>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 transition hover:bg-[#132d52] hover:text-white"><X size={18} /></button>
      </div>
      {children}
    </div>
  </div>
);

export default TeamDetails;