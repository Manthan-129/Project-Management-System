import { Check, Monitor, Moon, PanelLeft, PanelRight, Sun } from 'lucide-react'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import api from '../../api/axiosInstance.js'
import { AppContext } from '../../context/AppContext.jsx'
import LoadingPage from '../LoadingPage.jsx'

const AppearancePage = () => {

    const { authHeaders, logout } = useContext(AppContext);

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
                setInitialSettings({ theme, sidebarPosition });
                toast.success(data.message || 'Appearance settings updated successfully');
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
    <div className="relative max-w-3xl mx-auto px-4 py-8 space-y-6 overflow-hidden">

        <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-400/15 rounded-full blur-3xl -z-10"></div>
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-teal-400/15 rounded-full blur-3xl -z-10"></div>

        <div className="bg-white/90 border border-blue-100 rounded-3xl p-5 shadow-[0_16px_45px_-35px_rgba(37,99,235,0.4)] backdrop-blur-sm">
            <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Preferences</span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                    Theme: {resolvedThemeLabel}
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    Sidebar: {sidebarPosition === 'left' ? 'Left' : 'Right'}
                </span>
            </div>
        </div>

        {/* ── Theme Selection Card ── */}
        <div className="bg-white/90 border border-blue-100 rounded-3xl p-6 shadow-[0_16px_45px_-35px_rgba(37,99,235,0.4)] space-y-4 backdrop-blur-sm">
            <h3 className="text-base font-semibold text-slate-700">Theme</h3>
            <p className="text-sm text-slate-500">Select your preferred color scheme.</p>
            <div className="flex gap-3">
                {themeOptions.map((opt)=>{
                    const Icon= opt.icon
                    const isSelected= theme === opt.value;
                    return (
                        <button key={opt.value} onClick={() => setTheme(opt.value)}
                            type="button"
                            aria-pressed={isSelected}
                            disabled={isSaving}
                            className={`flex-1 flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 transition-all
                                ${isSelected
                                    ? 'border-blue-400 bg-blue-50 text-blue-700'
                                    : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:bg-slate-100'
                                }`}>
                            <Icon size={28} />
                            <span className="text-sm font-medium">{opt.label}</span>
                            {isSelected && <Check size={14} className="text-blue-600" />}
                        </button>
                    )
                })}
            </div>
        </div>

        {/* ── Sidebar Position Card ── */}
        <div className="bg-white/90 border border-blue-100 rounded-3xl p-6 shadow-[0_16px_45px_-35px_rgba(20,184,166,0.4)] space-y-4 backdrop-blur-sm">
            <h3 className="text-base font-semibold text-slate-700">Sidebar Position</h3>
            <p className="text-sm text-slate-500">Choose where the dashboard sidebar appears.</p>
            
            <div className="flex gap-3">
                {/* Left option */}
                <button onClick={() => setSidebarPosition('left')}
                    type="button"
                    aria-pressed={sidebarPosition === 'left'}
                    disabled={isSaving}
                    className={`flex-1 flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 transition-all
                        ${sidebarPosition === 'left'
                            ? 'border-blue-400 bg-blue-50 text-blue-700'
                            : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:bg-slate-100'
                        }`}>
                    <PanelLeft size={24} />
                    <span className="text-sm font-medium">Left</span>
                </button>

                {/* Right option */}
                <button onClick={() => setSidebarPosition('right')}
                    type="button"
                    aria-pressed={sidebarPosition === 'right'}
                    disabled={isSaving}
                    className={`flex-1 flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 transition-all
                        ${sidebarPosition === 'right'
                            ? 'border-blue-400 bg-blue-50 text-blue-700'
                            : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:bg-slate-100'
                        }`}>
                    <PanelRight size={24} />
                    <span className="text-sm font-medium">Right</span>
                </button>
            </div>
        </div>

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

export default AppearancePage