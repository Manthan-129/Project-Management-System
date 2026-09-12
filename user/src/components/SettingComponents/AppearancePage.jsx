import { Check, Monitor, Moon, PanelLeft, PanelRight, Sun } from 'lucide-react'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import api from '../../api/axiosInstance.js'
import { AppContext } from '../../context/AppContext.jsx'
import LoadingPage from '../LoadingPage.jsx'

const AppearancePage = () => {

    const { authHeaders, logout, fetchCurrentUser } = useContext(AppContext);

    const [isFetching, setIsFetching]= useState(false);
    const [isSaving, setIsSaving]= useState(false);

    const [theme, setTheme] = useState('system');
    const [sidebarPosition, setSidebarPosition]= useState('left');
    const [initialSettings, setInitialSettings]= useState({
        theme: 'system',
        sidebarPosition: 'left',
    });

    // ── Data ──
  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ]

    const hasChanges =
        theme !== initialSettings.theme ||
        sidebarPosition !== initialSettings.sidebarPosition;

    const resolvedThemeLabel = useMemo(() => {
        if (theme === 'system') {
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            return `System (${prefersDark ? 'Dark' : 'Light'})`;
        }

        return theme.charAt(0).toUpperCase() + theme.slice(1);
    }, [theme]);

    const getErrorMessage = (error, fallbackMessage) => {
        return error?.response?.data?.message || fallbackMessage;
    };

    const applyThemeToDocument = useCallback((nextTheme) => {
        const root = document.documentElement;

        if (nextTheme === 'system') {
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.classList.toggle('dark', prefersDark);
            root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
            window.dispatchEvent(new CustomEvent('app:theme-change'));
            return;
        }

        root.classList.toggle('dark', nextTheme === 'dark');
        root.setAttribute('data-theme', nextTheme);
        window.dispatchEvent(new CustomEvent('app:theme-change'));
    }, []);

    const fetchAppearanceSettings = useCallback(async () => {
        try {
            setIsFetching(true);
            const { data } = await api.get('/settings/get-appearance-settings', {
                headers: authHeaders,
            });

            if (data?.success) {
                const fetchedTheme = data?.appearanceSettings?.theme;
                const fetchedSidebarPosition = data?.appearanceSettings?.sidebarPosition;
                let nextTheme = 'system';
                let nextSidebarPosition = 'left';

                if (['light', 'dark', 'system'].includes(fetchedTheme)) {
                    nextTheme = fetchedTheme;
                }

                if (['left', 'right'].includes(fetchedSidebarPosition)) {
                    nextSidebarPosition = fetchedSidebarPosition;
                }

                setTheme(nextTheme);
                setSidebarPosition(nextSidebarPosition);
                setInitialSettings({ theme: nextTheme, sidebarPosition: nextSidebarPosition });

                localStorage.setItem('theme', nextTheme);
                localStorage.setItem('sidebarPosition', nextSidebarPosition);
                applyThemeToDocument(nextTheme);
            }
        } catch (error) {
            if (error?.response?.status === 401) {
                await logout();
                return;
            }
            toast.error(getErrorMessage(error, 'Failed to fetch appearance settings'));
        } finally {
            setIsFetching(false);
        }
    }, [authHeaders, logout, applyThemeToDocument]);

    const handleSave= async ()=>{
        try {
            setIsSaving(true);
            const { data } = await api.put(
                '/settings/update-appearance-settings',
                { theme, sidebarPosition },
                { headers: authHeaders }
            );

            if (data?.success) {
                localStorage.setItem('theme', theme);
                localStorage.setItem('sidebarPosition', sidebarPosition);
                applyThemeToDocument(theme);
                await fetchCurrentUser();
                setInitialSettings({ theme, sidebarPosition });
            }
        } catch (error) {
            if (error?.response?.status === 401) {
                await logout();
                return;
            }
            toast.error(getErrorMessage(error, 'Failed to update appearance settings'));
        } finally {
            setIsSaving(false);
        }
    }

    const handleDiscardChanges = () => {
        setTheme(initialSettings.theme);
        setSidebarPosition(initialSettings.sidebarPosition);
        applyThemeToDocument(initialSettings.theme);
    }

    useEffect(() => {
        fetchAppearanceSettings();
    }, [fetchAppearanceSettings]);

    if(isFetching) return <LoadingPage />;
  
  return (
    <div className="relative max-w-3xl mx-auto space-y-6">

        <div className="dd-section-card p-4">
            <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Active Preferences</span>
                <span className="dd-badge border-indigo-100 bg-indigo-50 text-indigo-700">
                    Theme: {resolvedThemeLabel}
                </span>
                <span className="dd-badge border-slate-200 bg-slate-50 text-slate-600">
                    Sidebar: {sidebarPosition === 'left' ? 'Left' : 'Right'}
                </span>
            </div>
        </div>

        {/* Theme Selection Card */}
        <div className="dd-section-card p-6 space-y-4">
            <div>
                <h3 className="text-base font-bold text-slate-900">Theme Preference</h3>
                <p className="text-xs text-slate-500 mt-0.5">Select your preferred appearance for DevDash workspaces.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {themeOptions.map((opt)=>{
                    const Icon= opt.icon
                    const isSelected= theme === opt.value;
                    return (
                        <button key={opt.value} onClick={() => setTheme(opt.value)}
                            type="button"
                            aria-pressed={isSelected}
                            disabled={isSaving}
                            className={`flex flex-col items-center gap-2.5 py-4 px-3 rounded-2xl border transition-all duration-200
                                ${isSelected
                                    ? 'border-indigo-400 bg-indigo-50/80 text-indigo-700 shadow-sm ring-2 ring-indigo-200/60'
                                    : 'border-slate-200/80 bg-slate-50/50 text-slate-600 hover:border-slate-300 hover:bg-white'
                                }`}>
                            <Icon size={24} className={isSelected ? 'text-indigo-600' : 'text-slate-400'} />
                            <span className="text-sm font-semibold">{opt.label}</span>
                            {isSelected ? (
                                <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-600">
                                    <Check size={13} /> Active
                                </span>
                            ) : (
                                <span className="text-[11px] font-medium text-slate-400">Select</span>
                            )}
                        </button>
                    )
                })}
            </div>
        </div>

        {/* Sidebar Position Card */}
        <div className="dd-section-card p-6 space-y-4">
            <div>
                <h3 className="text-base font-bold text-slate-900">Sidebar Position</h3>
                <p className="text-xs text-slate-500 mt-0.5">Configure the dock position for your navigation sidebar.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Left option */}
                <button onClick={() => setSidebarPosition('left')}
                    type="button"
                    aria-pressed={sidebarPosition === 'left'}
                    disabled={isSaving}
                    className={`flex flex-col items-center gap-2.5 py-4 px-3 rounded-2xl border transition-all duration-200
                        ${sidebarPosition === 'left'
                            ? 'border-indigo-400 bg-indigo-50/80 text-indigo-700 shadow-sm ring-2 ring-indigo-200/60'
                            : 'border-slate-200/80 bg-slate-50/50 text-slate-600 hover:border-slate-300 hover:bg-white'
                        }`}>
                    <PanelLeft size={24} className={sidebarPosition === 'left' ? 'text-indigo-600' : 'text-slate-400'} />
                    <span className="text-sm font-semibold">Left Aligned</span>
                    {sidebarPosition === 'left' ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-600">
                            <Check size={13} /> Active
                        </span>
                    ) : (
                        <span className="text-[11px] font-medium text-slate-400">Select</span>
                    )}
                </button>

                {/* Right option */}
                <button onClick={() => setSidebarPosition('right')}
                    type="button"
                    aria-pressed={sidebarPosition === 'right'}
                    disabled={isSaving}
                    className={`flex flex-col items-center gap-2.5 py-4 px-3 rounded-2xl border transition-all duration-200
                        ${sidebarPosition === 'right'
                            ? 'border-indigo-400 bg-indigo-50/80 text-indigo-700 shadow-sm ring-2 ring-indigo-200/60'
                            : 'border-slate-200/80 bg-slate-50/50 text-slate-600 hover:border-slate-300 hover:bg-white'
                        }`}>
                    <PanelRight size={24} className={sidebarPosition === 'right' ? 'text-indigo-600' : 'text-slate-400'} />
                    <span className="text-sm font-semibold">Right Aligned</span>
                    {sidebarPosition === 'right' ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-600">
                            <Check size={13} /> Active
                        </span>
                    ) : (
                        <span className="text-[11px] font-medium text-slate-400">Select</span>
                    )}
                </button>
            </div>
        </div>

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

export default AppearancePage