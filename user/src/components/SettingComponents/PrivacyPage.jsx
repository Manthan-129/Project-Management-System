import React, { useState, useEffect, useContext } from 'react'
import { Eye, EyeOff, Search, Shield, Wifi } from 'lucide-react'
import LoadingPage from '../LoadingPage'
import {AppContext} from '../../context/AppContext.jsx'
import api from '../../api/axiosInstance.js'
import { toast } from 'react-toastify'

const PrivacyPage = () => {
    const { token, logout } = useContext(AppContext);

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
                headers: { Authorization: `Bearer ${token}` },
            });

            if (data?.success && data?.privacySettings) {
                const nextSettings = {
                    profileVisibility: data.privacySettings.profileVisibility || 'public',
                    showEmail: typeof data.privacySettings.showEmail === 'boolean' ? data.privacySettings.showEmail : true,
                    showOnlineStatus: typeof data.privacySettings.showOnlineStatus === 'boolean' ? data.privacySettings.showOnlineStatus : true,
                    showInSearch: typeof data.privacySettings.showInSearch === 'boolean' ? data.privacySettings.showInSearch : true,
                };

                setSettings(nextSettings);
                setInitialSettings(nextSettings);
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
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (data?.success) {
                setInitialSettings(settings);
                toast.success(data.message || 'Privacy settings updated successfully');
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

    useEffect(() => {
        fetchPrivacySettings();
    }, [token]);

    if (isFetching) return <LoadingPage />;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Page Header */}
        <h2 className="text-2xl font-semibold text-slate-800">Privacy</h2>
        <p className="text-sm text-slate-500 -mt-4">Control who can see your information and how you appear to others.</p>

        {/* ── Profile Visibility Card ── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="flex items-center gap-2 text-base font-semibold text-slate-700">
                <Shield size={16} className="text-indigo-400" /> Profile Visibility
            </h3>
            <p className="text-sm text-slate-500">Choose who can see your profile information.</p>

            {/* Radio-style selection cards */}
            <div className="space-y-2.5">
                {visibilityOptions.map((option)=>(
                    <button key={option.value} onClick={()=> handleVisibilityChange(option.value)}
                        disabled={isSaving}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all
                            ${settings.profileVisibility === option.value
                                ? 'border-indigo-400 bg-indigo-50'
                                : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100'
                            }`}>
                        {/* Radio indicator */}
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                            ${settings.profileVisibility === option.value
                                ? 'border-indigo-500 bg-indigo-500'
                                : 'border-slate-300 bg-white'
                            }`}>
                            {settings.profileVisibility === option.value && (
                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                        </div>
                        <div>
                            <p className={`text-sm font-medium ${settings.profileVisibility === option.value ? 'text-indigo-700' : 'text-slate-700'}`}>
                                {option.label}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">{option.desc}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>

        {/* ── Toggle Controls Card ── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <h3 className="flex items-center gap-2 text-base font-semibold text-slate-700">
                <EyeOff size={16} className="text-indigo-400" /> Visibility Controls
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
                            disabled={isSaving}
                            className={`relative shrink-0 w-10 h-5 rounded-full transition-colors ${settings[item.key] ? 'bg-indigo-500' : 'bg-slate-200'}`}>
                            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings[item.key] ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>
                )
            })}
        </div>

        {/* ── Save Button ── */}
        <button onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="w-full py-2.5 px-6 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors shadow-sm">
            {isSaving ? 'Saving...' : 'Save Privacy Settings'}
        </button>
    </div>
  )
}

export default PrivacyPage