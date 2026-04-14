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
    <div className="relative max-w-3xl mx-auto px-4 py-8 space-y-6 overflow-hidden">

        <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-400/15 rounded-full blur-3xl -z-10"></div>
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-teal-400/15 rounded-full blur-3xl -z-10"></div>

        {/* ── Current Privacy Summary ── */}
        <div className="bg-white/90 border border-blue-100 rounded-3xl p-5 shadow-[0_16px_45px_-35px_rgba(37,99,235,0.4)] backdrop-blur-sm">
            <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Current Visibility</span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                    {visibilityLabel}
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {enabledControlsCount} / 3 controls enabled
                </span>
            </div>
        </div>

        {/* ── Profile Visibility Card ── */}
        <div className="bg-white/90 border border-blue-100 rounded-3xl p-6 shadow-[0_16px_45px_-35px_rgba(37,99,235,0.4)] space-y-4 backdrop-blur-sm">
            <h3 className="flex items-center gap-2 text-base font-semibold text-slate-700">
                <Shield size={16} className="text-blue-500" /> Profile Visibility
            </h3>
            <p className="text-sm text-slate-500">Choose who can see your profile information.</p>

            {/* Radio-style selection cards */}
            <div className="space-y-2.5">
                {visibilityOptions.map((option)=>(
                    <button key={option.value} onClick={()=> handleVisibilityChange(option.value)}
                        type="button"
                        aria-pressed={settings.profileVisibility === option.value}
                        disabled={isSaving}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all
                            ${settings.profileVisibility === option.value
                                ? 'border-blue-400 bg-blue-50'
                                : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100'
                            }`}>
                        {/* Radio indicator */}
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                            ${settings.profileVisibility === option.value
                                ? 'border-blue-600 bg-blue-600'
                                : 'border-slate-300 bg-white'
                            }`}>
                            {settings.profileVisibility === option.value && (
                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                        </div>
                        <div>
                            <p className={`text-sm font-medium ${settings.profileVisibility === option.value ? 'text-blue-700' : 'text-slate-700'}`}>
                                {option.label}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">{option.desc}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>

        {/* ── Toggle Controls Card ── */}
        <div className="bg-white/90 border border-blue-100 rounded-3xl p-6 shadow-[0_16px_45px_-35px_rgba(20,184,166,0.4)] space-y-5 backdrop-blur-sm">
            <h3 className="flex items-center gap-2 text-base font-semibold text-slate-700">
                <EyeOff size={16} className="text-blue-500" /> Visibility Controls
            </h3>

            {toggleItems.map((item)=>{
                const Icon = item.icon;
                return (
                    <div key={item.key} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg shrink-0">
                                <Icon size={16} className="text-slate-500" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-700">{item.title}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                            </div>
                        </div>

                        {/* Toggle switch */}
                        <button onClick={()=> handleToggleChange(item.key)}
                            type="button"
                            aria-pressed={settings[item.key]}
                            disabled={isSaving}
                            className={`relative shrink-0 w-10 h-5 rounded-full transition-colors ${settings[item.key] ? 'bg-blue-600' : 'bg-slate-200'}`}>
                            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings[item.key] ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>
                )
            })}
        </div>

        {/* ── Save / Discard Actions ── */}
        <div className="flex items-center gap-3">
            <button onClick={handleDiscardChanges}
                type="button"
                disabled={isSaving || !hasChanges}
                className="flex-1 py-2.5 px-6 bg-white hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-slate-700 text-sm font-medium rounded-xl transition-colors border border-slate-200">
                Discard Changes
            </button>
            <button onClick={handleSave}
                type="button"
                disabled={isSaving || !hasChanges}
                className="flex-1 py-2.5 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-teal-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-all shadow-sm">
                {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
        </div>
    </div>
  )
}

export default PrivacyPage