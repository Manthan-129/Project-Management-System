import { Check, Monitor, Moon, PanelLeft, PanelRight, Sun } from 'lucide-react'
import { useCallback, useContext, useEffect, useState } from 'react'
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

    const getErrorMessage = (error, fallbackMessage) => {
        return error?.response?.data?.message || fallbackMessage;
    };

    const applyThemeToDocument = useCallback((nextTheme) => {
        const root = document.documentElement;

        if (nextTheme === 'system') {
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.classList.toggle('dark', prefersDark);
            root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
            return;
        }

        root.classList.toggle('dark', nextTheme === 'dark');
        root.setAttribute('data-theme', nextTheme);
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

    useEffect(() => {
        fetchAppearanceSettings();
    }, [fetchAppearanceSettings]);

    if(isFetching) return <LoadingPage />;
  
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Page Header */}
        <h2 className="text-2xl font-semibold text-slate-800">Appearance</h2>
        <p className="text-sm text-slate-500 -mt-4">Customize how DevDash looks for you.</p>

        {/* ── Theme Selection Card ── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-semibold text-slate-700">Theme</h3>
            <p className="text-sm text-slate-500">Select your preferred color scheme.</p>
            <div className="flex gap-3">
                {themeOptions.map((opt)=>{
                    const Icon= opt.icon
                    const isSelected= theme === opt.value;
                    return (
                        <button key={opt.value} onClick={() => setTheme(opt.value)}
                            disabled={isSaving}
                            className={`flex-1 flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 transition-all
                                ${isSelected
                                    ? 'border-indigo-400 bg-indigo-50 text-indigo-600'
                                    : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:bg-slate-100'
                                }`}>
                            <Icon size={28} />
                            <span className="text-sm font-medium">{opt.label}</span>
                            {isSelected && <Check size={14} className="text-indigo-500" />}
                        </button>
                    )
                })}
            </div>
        </div>

        {/* ── Sidebar Position Card ── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-semibold text-slate-700">Sidebar Position</h3>
            <p className="text-sm text-slate-500">Choose where the dashboard sidebar appears.</p>
            
            <div className="flex gap-3">
                {/* Left option */}
                <button onClick={() => setSidebarPosition('left')}
                    disabled={isSaving}
                    className={`flex-1 flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 transition-all
                        ${sidebarPosition === 'left'
                            ? 'border-indigo-400 bg-indigo-50 text-indigo-600'
                            : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:bg-slate-100'
                        }`}>
                    <PanelLeft size={24} />
                    <span className="text-sm font-medium">Left</span>
                </button>

                {/* Right option */}
                <button onClick={() => setSidebarPosition('right')}
                    disabled={isSaving}
                    className={`flex-1 flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 transition-all
                        ${sidebarPosition === 'right'
                            ? 'border-indigo-400 bg-indigo-50 text-indigo-600'
                            : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:bg-slate-100'
                        }`}>
                    <PanelRight size={24} />
                    <span className="text-sm font-medium">Right</span>
                </button>
            </div>
        </div>

        {/* ── Save Button ── */}
        <button onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="w-full py-2.5 px-6 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors shadow-sm">
            {isSaving ? 'Saving...' : 'Save Preferences'}
        </button>
    </div>
  )
}

export default AppearancePage