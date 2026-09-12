import React, { useContext, useEffect, useMemo, useState } from 'react'
import { Bell, ClipboardList, GitPullRequest, Info, RefreshCw, UserPlus } from 'lucide-react'
import { AppContext } from '../../context/AppContext'
import LoadingPage from '../LoadingPage'
import api from '../../api/axiosInstance.js'
import { toast } from 'react-toastify'

const NotificationPage = () => {
    const { authHeaders, logout } = useContext(AppContext);

    const [isFetching, setIsFetching]= useState(false);
    const [isSaving, setIsSaving]= useState(false);

    const [preferences, setPreferences]= useState({
        taskAssignments: false,
        taskUpdates: false,
        pullRequests: false,
        teamInvitations: false,
    });

    const [initialPreferences, setInitialPreferences]= useState({
      taskAssignments: false,
      taskUpdates: false,
      pullRequests: false,
      teamInvitations: false,
    });

    const hasChanges = useMemo(() => {
      return Object.keys(preferences).some((key) => preferences[key] !== initialPreferences[key]);
    }, [preferences, initialPreferences]);

    const enabledCount = useMemo(() => {
      return Object.values(preferences).filter(Boolean).length;
    }, [preferences]);

    const getErrorMessage = (error, fallbackMessage) => {
      return error?.response?.data?.message || fallbackMessage;
    };

    const handleToggle= (key)=>{
        setPreferences((prev)=> ({...prev, [key]: !prev[key]}));
    };

    const fetchPreferences= async()=>{
      try {
        setIsFetching(true);
        const { data } = await api.get('/settings/get-notification-settings', {
          headers: authHeaders,
        });

        if (data?.success && data?.notificationSettings) {
          const nextPreferences = {
            taskAssignments: Boolean(data.notificationSettings.taskAssignments),
            taskUpdates: Boolean(data.notificationSettings.taskUpdates),
            pullRequests: Boolean(data.notificationSettings.pullRequests),
            teamInvitations: Boolean(data.notificationSettings.teamInvitations),
          };

          setPreferences(nextPreferences);
          setInitialPreferences(nextPreferences);
        }
      } catch (error) {
        if (error?.response?.status === 401) {
          await logout();
          return;
        }
        toast.error(getErrorMessage(error, 'Failed to fetch notification settings'));
      } finally {
        setIsFetching(false);
      }
    };

    useEffect(()=>{
      fetchPreferences();
    },[authHeaders])

    const handleSave= async()=>{
      try {
        setIsSaving(true);
        const { data } = await api.put(
          '/settings/update-notification-settings',
          preferences,
          {
            headers: authHeaders,
          }
        );

        if (data?.success) {
          setInitialPreferences({ ...preferences });
        }
      } catch (error) {
        if (error?.response?.status === 401) {
          await logout();
          return;
        }
        toast.error(getErrorMessage(error, 'Failed to update notification settings'));
      } finally {
        setIsSaving(false);
      }
    };

    // ── Data ──
    const notificationItems = [
      { key: 'taskAssignments', title: 'Task Assignments', description: 'Get notified when you are assigned a new task.', icon: ClipboardList },
      { key: 'taskUpdates', title: 'Task Updates', description: 'Get notified about status changes on your tasks.', icon: RefreshCw },
      { key: 'pullRequests', title: 'Pull Requests', description: 'Get notified when a PR needs review, is merged, or commented on.', icon: GitPullRequest },
      { key: 'teamInvitations', title: 'Team Invitations', description: 'Get notified when someone invites you to a team.', icon: UserPlus },
    ]

    const handleDiscardChanges = () => {
      setPreferences({ ...initialPreferences });
    }

    if (isFetching) return <LoadingPage />;

  return (
    <div className="relative max-w-3xl mx-auto space-y-6">

      <div className="dd-section-card p-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Notification Summary</span>
          <span className="dd-badge border-indigo-100 bg-indigo-50 text-indigo-700">
            {enabledCount} of 4 categories active
          </span>
        </div>
      </div>

      {/* Email Notifications Card */}
      <div className="dd-section-card p-6 space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Bell size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Email Notifications</h3>
            <p className="text-xs text-slate-500">Configure which workspace events trigger background email alerts.</p>
          </div>
        </div>

        <div className="space-y-4">
          {notificationItems.map((item)=>{
            const Icon= item.icon;
            const isEnabled = preferences[item.key];
            return (
              <div key={item.key} className="flex items-center justify-between gap-4 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200/80 text-slate-600 shadow-xs">
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{item.description}</p>
                  </div>
                </div>

                {/* Toggle switch */}
                <button onClick={() => handleToggle(item.key)}
                  type="button"
                  aria-pressed={isEnabled}
                  disabled={isSaving}
                  className={`relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-200 ${isEnabled ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${isEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            )
          })}
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
          <button onClick={handleDiscardChanges}
            type="button"
            disabled={isSaving || !hasChanges}
            className="dd-ghost-button">
            Discard Changes
          </button>
          <button onClick={handleSave}
            type="button"
            disabled={isSaving || !hasChanges}
            className="dd-primary-button">
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div className="flex gap-3 p-4 bg-sky-50/70 border border-sky-100 rounded-2xl">
        <Info size={18} className="text-sky-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-sky-900">About Notifications</p>
          <p className="text-xs text-slate-600 leading-relaxed">Notifications are queued asynchronously using our background BullMQ workers and dispatched to your verified email address.</p>
        </div>
      </div>
    </div>
  )
}

export default NotificationPage