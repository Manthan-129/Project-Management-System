import { Eye, EyeOff, Search, Shield, Wifi } from 'lucide-react'
import { useContext, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import api from '../../api/axiosInstance.js'
import { AppContext } from '../../context/AppContext.jsx'
import LoadingPage from '../LoadingPage'

const PrivacyPage = () => {
    const { authHeaders, logout } = useContext(AppContext);

    const [isFetching, setIsFetching]= useState(false);
    const [isSaving, setIsSaving]= useState(false);

    const [settings, setSettings]= useState({
        profileVisibility: 'public',
        showEmail: true,
        showOnlineStatus: true,
        showInSearch: true,
    });

    const [initialSettings, setInitialSettings]= useState({
        profileVisibility: 'public',
        showEmail: true,
        showOnlineStatus: true,
        showInSearch: true,
    });

    const hasChanges =
        settings.profileVisibility !== initialSettings.profileVisibility ||
        settings.showEmail !== initialSettings.showEmail ||
        settings.showOnlineStatus !== initialSettings.showOnlineStatus ||
        settings.showInSearch !== initialSettings.showInSearch;

    const enabledControlsCount = useMemo(() => {
        let count = 0;
        if (settings.showEmail) count += 1;
        if (settings.showOnlineStatus) count += 1;
        if (settings.showInSearch) count += 1;
        return count;
    }, [settings]);

    const getErrorMessage = (error, fallbackMessage) => {
        return error?.response?.data?.message || fallbackMessage;
    };

    // ── Handlers ──
    const handleToggleChange= (key)=>{
        setSettings((prev)=> ({...prev, [key]: !prev[key]}));
    };

    const handleVisibilityChange= (value)=>{
        setSettings((prev)=> ({...prev, profileVisibility: value}))
    };

    const fetchPrivacySettings = async () => {
        try {
            setIsFetching(true);
            const { data } = await api.get('/settings/get-privacy-settings', {
                headers: authHeaders,
            });

            if (data?.success && data?.privacySettings) {
                const nextSettings = {
                    profileVisibility: data.privacySettings.profileVisibility || 'public',
                    showEmail: typeof data.privacySettings.showEmail === 'boolean' ? data.privacySettings.showEmail : true,
                    showOnlineStatus: typeof data.privacySettings.showOnlineStatus === 'boolean' ? data.privacySettings.showOnlineStatus : true,
                    showInSearch: typeof data.privacySettings.showInSearch === 'boolean' ? data.privacySettings.showInSearch : true,
                };

                setSettings(nextSettings);
                setInitialSettings({ ...nextSettings });
            }
        } catch (error) {
            if (error?.response?.status === 401) {
                await logout();
                return;
            }
            toast.error(getErrorMessage(error, 'Failed to fetch privacy settings'));
        } finally {
            setIsFetching(false);
        }
    };

    const handleSave= async ()=>{
        try {
            setIsSaving(true);
            const { data } = await api.put(
                '/settings/update-privacy-settings',
                settings,
                { headers: authHeaders }
            );

            if (data?.success) {
                setInitialSettings({ ...settings });
            }
        } catch (error) {
            if (error?.response?.status === 401) {
                await logout();
                return;
            }
            toast.error(getErrorMessage(error, 'Failed to update privacy settings'));
        } finally {
            setIsSaving(false);
        }
    };

    // ── Data ──

    const visibilityOptions = [
        { value: 'public', label: 'Public', desc: 'Anyone can view your profile' },
        { value: 'team-only', label: 'Team Only', desc: 'Only your team members can see you' },
        { value: 'private', label: 'Private', desc: 'Your profile is hidden from everyone' },
    ]

    const toggleItems = [
        { key: 'showEmail', title: 'Show Email Address', desc: 'Allow teammates to see your email on your profile', icon: Eye },
        { key: 'showOnlineStatus', title: 'Show Online Status', desc: 'Display green dot when you are active', icon: Wifi },
        { key: 'showInSearch', title: 'Appear in Search', desc: 'Let others find you when searching for users', icon: Search },
    ]

    const visibilityLabel =
        settings.profileVisibility === 'team-only'
            ? 'Team Only'
            : settings.profileVisibility.charAt(0).toUpperCase() + settings.profileVisibility.slice(1)

    const handleDiscardChanges = () => {
        setSettings({ ...initialSettings });
    }

    useEffect(() => {
        fetchPrivacySettings();
    }, [authHeaders, logout]);

    if (isFetching) return <LoadingPage />;

  return (
    <div className="relative max-w-3xl mx-auto space-y-6">

        {/* Current Privacy Summary */}
        <div className="dd-section-card p-4">
            <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Current Visibility</span>
                <span className="dd-badge border-indigo-100 bg-indigo-50 text-indigo-700">
                    {visibilityLabel}
                </span>
                <span className="dd-badge border-slate-200 bg-slate-50 text-slate-600">
                    {enabledControlsCount} of 3 controls active
                </span>
            </div>
        </div>

        {/* Profile Visibility Card */}
        <div className="dd-section-card p-6 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Shield size={18} />
                </div>
                <div>
                    <h3 className="text-base font-bold text-slate-900">Profile Visibility</h3>
                    <p className="text-xs text-slate-500">Configure who can discover and view your profile information.</p>
                </div>
            </div>

            {/* Selection cards */}
            <div className="space-y-2.5">
                {visibilityOptions.map((option)=>{
                    const isSelected = settings.profileVisibility === option.value;
                    return (
                        <button key={option.value} onClick={()=> handleVisibilityChange(option.value)}
                            type="button"
                            aria-pressed={isSelected}
                            disabled={isSaving}
                            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl border text-left transition-all duration-200
                                ${isSelected
                                    ? 'border-indigo-400 bg-indigo-50/70 shadow-xs ring-2 ring-indigo-200/50'
                                    : 'border-slate-200/80 bg-slate-50/50 hover:border-slate-300 hover:bg-white'
                                }`}>
                            {/* Radio indicator */}
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors
                                ${isSelected
                                    ? 'border-indigo-600 bg-indigo-600'
                                    : 'border-slate-300 bg-white'
                                }`}>
                                {isSelected && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                )}
                            </div>
                            <div>
                                <p className={`text-sm font-bold ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                                    {option.label}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">{option.desc}</p>
                            </div>
                        </button>
                    )
                })}
            </div>
        </div>

        {/* Toggle Controls Card */}
        <div className="dd-section-card p-6 space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <EyeOff size={18} />
                </div>
                <div>
                    <h3 className="text-base font-bold text-slate-900">Visibility Controls</h3>
                    <p className="text-xs text-slate-500">Fine-tune individual metadata fields across DevDash.</p>
                </div>
            </div>

            <div className="space-y-3">
                {toggleItems.map((item)=>{
                    const Icon = item.icon;
                    const isEnabled = settings[item.key];
                    return (
                        <div key={item.key} className="flex items-center justify-between gap-4 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3.5 min-w-0">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200/80 text-slate-600 shadow-xs">
                                    <Icon size={16} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                                    <p className="text-xs text-slate-500 mt-0.5 truncate">{item.desc}</p>
                                </div>
                            </div>

                            {/* Toggle switch */}
                            <button onClick={()=> handleToggleChange(item.key)}
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
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
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
  )
}

export default PrivacyPage