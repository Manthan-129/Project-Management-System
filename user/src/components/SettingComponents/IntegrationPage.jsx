import React, { useCallback, useContext, useEffect, useState } from 'react'
import { Github, Info, Link, Linkedin, Unlink } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import LoadingPage from '../LoadingPage.jsx'
import { AppContext } from '../../context/AppContext.jsx'
import api from '../../api/axiosInstance.js'

const IntegrationPage = () => {
    const { authHeaders, navigate, logout } = useContext(AppContext);
    const location = useLocation();

    const [connections, setConnections] = useState({
        github: {connected: false, username: '', lastSynced: null, autoSync: false},
        linkedin: { connected: false, username: '', lastSynced: null, autoSync: false },
        bitbucket: { connected: false, username: '', lastSynced: null, autoSync: false },
    });

    const [isFetching, setIsFetching] = useState(false);
    const [activeRequest, setActiveRequest] = useState('');

    const platforms= [
        { key: 'github', name: 'GitHub', icon: Github, description: 'Link your GitHub account to sync repositories and pull requests.' },
        { key: 'linkedin', name: 'LinkedIn', icon: Linkedin, description: 'Connect LinkedIn to sync your public professional profile data.' },
        { key: 'bitbucket', name: 'Bitbucket', icon: Link, description: 'Link Bitbucket to sync your repositories.' },
    ];
    const connectedCount = platforms.filter((platform) => connections[platform.key]?.connected).length;

    const getErrorMessage = (error, fallbackMessage) => {
        return error?.response?.data?.message || fallbackMessage;
    };

    const fetchIntegrationStatus = useCallback(async () => {
        try {
            setIsFetching(true);
            const { data } = await api.get('/settings/integrations/status', {
                headers: authHeaders,
            });

            if (data?.success && data?.integrations) {
                setConnections((prev) => ({
                    ...prev,
                    github: {
                        connected: Boolean(data.integrations.github?.connected),
                        username: data.integrations.github?.username || '',
                        lastSynced: data.integrations.github?.lastSynced || null,
                        autoSync: Boolean(data.integrations.github?.autoSync),
                    },
                    linkedin: {
                        connected: Boolean(data.integrations.linkedin?.connected),
                        username: data.integrations.linkedin?.username || '',
                        lastSynced: data.integrations.linkedin?.lastSynced || null,
                        autoSync: Boolean(data.integrations.linkedin?.autoSync),
                    },
                    bitbucket: {
                        connected: Boolean(data.integrations.bitbucket?.connected),
                        username: data.integrations.bitbucket?.username || '',
                        lastSynced: data.integrations.bitbucket?.lastSynced || null,
                        autoSync: Boolean(data.integrations.bitbucket?.autoSync),
                    },
                }));
            }
        } catch (error) {
            if (error?.response?.status === 401) {
                await logout();
                return;
            }
            toast.error(getErrorMessage(error, 'Failed to fetch integration status'));
        } finally {
            setIsFetching(false);
        }
    }, [authHeaders, logout]);

    const handleConnect= async (platform)=>{
        try {
            setActiveRequest(`connect-${platform}`);
            const { data } = await api.get(`/settings/integrations/${platform}/connect`, {
                headers: authHeaders,
            });

            if (data?.success && data?.authUrl) {
                window.location.href = data.authUrl;
            }
        } catch (error) {
            if (error?.response?.status === 401) {
                await logout();
                return;
            }
            toast.error(getErrorMessage(error, `Failed to connect ${platform}`));
        } finally {
            setActiveRequest('');
        }
    };

    const handleDisconnect= async (platform)=>{
        try {
            setActiveRequest(`disconnect-${platform}`);
            const { data } = await api.post(
                `/settings/integrations/${platform}/disconnect`,
                {},
                { headers: authHeaders }
            );

            if (data?.success) {
                setConnections((prev)=> ({
                    ...prev,
                    [platform]: { connected: false, username: '', lastSynced: null, autoSync: false },
                }));
            }
        } catch (error) {
            if (error?.response?.status === 401) {
                await logout();
                return;
            }
            toast.error(getErrorMessage(error, `Failed to disconnect ${platform}`));
        } finally {
            setActiveRequest('');
        }
    };

    const handleToggleAutoSync = async (platform)=>{
        const current = Boolean(connections?.[platform]?.autoSync);
        const nextValue = !current;

        try {
            setActiveRequest(`toggle-${platform}`);
            const { data } = await api.post(
                `/settings/integrations/${platform}/toggle-sync`,
                { autoSync: nextValue },
                { headers: authHeaders }
            );

            if (data?.success) {
                setConnections((prev)=>({
                    ...prev,
                    [platform]: {
                        ...prev[platform],
                        autoSync: Boolean(data.autoSync),
                    },
                }));
            }
        } catch (error) {
            if (error?.response?.status === 401) {
                await logout();
                return;
            }
            toast.error(getErrorMessage(error, `Failed to update auto sync for ${platform}`));
        } finally {
            setActiveRequest('');
        }
    };

    useEffect(() => {
        fetchIntegrationStatus();
    }, [fetchIntegrationStatus]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const platform = params.get('platform');
        const status = params.get('status');
        const errorMessage = params.get('error');

        if (!platform || !status) return;

        if (status === 'success') {
            fetchIntegrationStatus();
        } else if (status === 'error') {
            toast.error(errorMessage || `Failed to connect ${platform}`);
        }

        navigate('/settings/integration', { replace: true });
    }, [location.search, navigate, fetchIntegrationStatus]);

    const formatDate= (dateStr)=>{
        if(!dateStr) return 'Never'
        return new Date(dateStr).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    }

        if (isFetching) return <LoadingPage />;

  return (
        <div className="relative max-w-3xl mx-auto px-4 py-8 space-y-6 overflow-hidden">

            <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-400/15 rounded-full blur-3xl -z-10"></div>
            <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-teal-400/15 rounded-full blur-3xl -z-10"></div>

            <div className="bg-white/90 border border-blue-100 rounded-3xl p-5 shadow-[0_16px_45px_-35px_rgba(37,99,235,0.4)] backdrop-blur-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Integration Summary</span>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                            {connectedCount} / {platforms.length} connected
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={fetchIntegrationStatus}
                        disabled={isFetching || !!activeRequest}
                        className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed rounded-lg transition-colors"
                    >
                        Refresh Status
                    </button>
                </div>
            </div>

      {/* ── Platform Cards ── */}
      {platforms.map((platform)=>{
        const Icon= platform.icon;
        const conn= connections[platform.key];
        return (
            <div key={platform.key} className="bg-white/90 border border-blue-100 rounded-3xl p-6 shadow-[0_16px_45px_-35px_rgba(37,99,235,0.4)] space-y-4 backdrop-blur-sm">

                 {/* Top: Platform Info + Button */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-slate-100 rounded-xl">
                            <Icon size={24} className="text-slate-600" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-semibold text-slate-800">{platform.name}</h3>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${conn.connected ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                    {conn.connected ? 'Connected' : 'Not Connected'}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{platform.description}</p>
                        </div>
                    </div>

                    {/* Connect / Disconnect */}
                    {conn.connected ? (
                        <button onClick={() => handleDisconnect(platform.key)}
                            disabled={activeRequest === `disconnect-${platform.key}`}
                            className="shrink-0 flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed border border-rose-200 rounded-xl transition-colors whitespace-nowrap">
                            <Unlink size={14} />
                            {activeRequest === `disconnect-${platform.key}` ? 'Disconnecting...' : 'Disconnect'}
                        </button>
                    ) : (
                        <button onClick={() => handleConnect(platform.key)}
                            disabled={activeRequest === `connect-${platform.key}`}
                            className="shrink-0 flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed border border-blue-200 rounded-xl transition-colors whitespace-nowrap">
                            <Link size={14} />
                            {activeRequest === `connect-${platform.key}` ? 'Connecting...' : 'Connect'}
                        </button>
                    )}
                </div>

                {/* Connected Details */}
                {conn.connected && (
                    <div className="space-y-2.5 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-500">Username</span>
                            <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">{conn.username ? `@${conn.username}` : '-'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-500">Last Synced</span>
                            <span className="text-xs text-slate-600">{formatDate(conn.lastSynced)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-500">Auto Sync PRs</span>
                            <button onClick={()=> handleToggleAutoSync(platform.key)}
                                type="button"
                                aria-pressed={conn.autoSync}
                                disabled={activeRequest === `toggle-${platform.key}`}
                                className={`relative w-10 h-5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${conn.autoSync ? 'bg-blue-600' : 'bg-slate-200'}`}>
                                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${conn.autoSync ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )
      })}

      {/* ── Info Card ── */}
      <div className="flex gap-3 p-4 bg-sky-50 border border-sky-100 rounded-2xl">
        <Info size={18} className="text-sky-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-700">About Integrations</p>
          <p className="text-xs text-slate-500 leading-relaxed">
                        Connecting your accounts allows DevDash to import pull requests and repository/profile data.
            We only request read access. You can disconnect at any time.
          </p>
        </div>
      </div>
    </div>
  )
}

export default IntegrationPage