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
                `/settings/integrations/${platform}/auto-sync`,
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
        <div className="relative max-w-3xl mx-auto space-y-6">

            <div className="dd-section-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Integration Summary</span>
                        <span className="dd-badge border-indigo-100 bg-indigo-50 text-indigo-700">
                            {connectedCount} of {platforms.length} connected
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={fetchIntegrationStatus}
                        disabled={isFetching || !!activeRequest}
                        className="dd-ghost-button !px-3 !py-1.5 text-xs"
                    >
                        Refresh Status
                    </button>
                </div>
            </div>

      {/* Platform Cards */}
      {platforms.map((platform)=>{
        const Icon= platform.icon;
        const conn= connections[platform.key];
        return (
            <div key={platform.key} className="dd-section-card p-6 space-y-4">

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                            <Icon size={22} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-slate-900">{platform.name}</h3>
                                <span className={`dd-badge ${conn.connected ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
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
                            className="dd-danger-button text-xs whitespace-nowrap">
                            <Unlink size={14} />
                            {activeRequest === `disconnect-${platform.key}` ? 'Disconnecting...' : 'Disconnect'}
                        </button>
                    ) : (
                        <button onClick={() => handleConnect(platform.key)}
                            disabled={activeRequest === `connect-${platform.key}`}
                            className="dd-primary-button text-xs whitespace-nowrap">
                            <Link size={14} />
                            {activeRequest === `connect-${platform.key}` ? 'Connecting...' : 'Connect'}
                        </button>
                    )}
                </div>

                {/* Connected Details */}
                {conn.connected && (
                    <div className="space-y-3 pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-500">Connected Account</span>
                            <span className="font-semibold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">{conn.username ? `@${conn.username}` : '-'}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-500">Last Synced</span>
                            <span className="text-slate-600">{formatDate(conn.lastSynced)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-500">Auto Sync Pull Requests</span>
                            <button onClick={()=> handleToggleAutoSync(platform.key)}
                                type="button"
                                aria-pressed={conn.autoSync}
                                disabled={activeRequest === `toggle-${platform.key}`}
                                className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-200 ${conn.autoSync ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${conn.autoSync ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )
      })}

      {/* Info Card */}
      <div className="flex gap-3 p-4 bg-sky-50/70 border border-sky-100 rounded-2xl">
        <Info size={18} className="text-sky-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-sky-900">About Integrations</p>
          <p className="text-xs text-slate-600 leading-relaxed">
            Linking your accounts allows DevDash to verify repositories and track pull request reviews automatically. We only request read access. You can unlink your account at any time.
          </p>
        </div>
      </div>
    </div>
  )
}

export default IntegrationPage