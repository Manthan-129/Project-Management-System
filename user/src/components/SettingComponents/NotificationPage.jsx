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
          toast.success(data.message || 'Notification settings updated successfully');
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
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

      {/* Page Header */}
      <h2 className="text-2xl font-semibold text-slate-800">Notifications</h2>
      <p className="text-sm text-slate-500 -mt-4">Manage your email notification preferences.</p>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Notification Summary</span>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
            {enabledCount} / 4 categories enabled
          </span>
        </div>
      </div>

      {/* ── Email Notifications Card ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">

        {/* Card Header */}
        <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <Bell size={18} className="text-indigo-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-700">Email Notifications</h3>
            <p className="text-xs text-slate-500">Choose what events trigger email notifications.</p>
          </div>
        </div>

        {notificationItems.map((item)=>{
          const Icon= item.icon;
          return (
            <div key={item.key} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg shrink-0">
                  <Icon size={18} className="text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">{item.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                </div>
              </div>
              {/* Toggle switch */}
              <button onClick={() => handleToggle(item.key)}
                type="button"
                aria-pressed={preferences[item.key]}
                disabled={isSaving}
                className={`relative shrink-0 w-10 h-5 rounded-full transition-colors ${preferences[item.key] ? 'bg-indigo-500' : 'bg-slate-200'}`}>
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${preferences[item.key] ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          )
        })}

        <div className="pt-2 border-t border-slate-100 flex gap-3">
          <button onClick={handleDiscardChanges}
            type="button"
            disabled={isSaving || !hasChanges}
            className="flex-1 py-2.5 px-6 bg-white hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-slate-700 text-sm font-medium rounded-xl transition-colors border border-slate-200">
            Discard Changes
          </button>
          <button onClick={handleSave}
            type="button"
            disabled={isSaving || !hasChanges}
            className="flex-1 py-2.5 px-6 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors shadow-sm">
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* ── Info Card ── */}
      <div className="flex gap-3 p-4 bg-sky-50 border border-sky-100 rounded-2xl">
        <Info size={18} className="text-sky-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-700">About Notifications</p>
          <p className="text-xs text-slate-500 leading-relaxed">Email notifications are sent to your registered email address. You can change these preferences at any time.</p>
        </div>
      </div>
    </div>
  )
}

export default NotificationPage