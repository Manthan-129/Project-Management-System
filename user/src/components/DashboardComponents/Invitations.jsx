import { Check, Clock, Mail, Send, X } from 'lucide-react'
import { useContext, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import api from '../../api/axiosInstance.js'
import { AppContext } from '../../context/AppContext.jsx'
import Loading from '../LoadingPage.jsx'

const Invitations = () => {

    const { token, setToken, authHeaders } = useContext(AppContext);
    const [received, setReceived] = useState([]);
    const [sentByMe, setSentByMe] = useState([]);
    const [sentByTeam, setSentByTeam] = useState([]);
    const [tab, setTab] = useState('received');
    const [teamFilter, setTeamFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    const fetchInvitations = async () => {
        setLoading(true);
        try {
            const [receivedRes, sentByMeRes, sentByTeamRes] = await Promise.all([
                api.get('/teams/invitations/received', { headers: authHeaders }),
                api.get('/teams/invitations/sent-by-me', { headers: authHeaders }),
                api.get('/teams/invitations/sent-by-team', { headers: authHeaders }),
            ]);

            if (!receivedRes?.data?.success) {
                toast.error(receivedRes?.data?.message || 'Failed to fetch received invitations');
                setReceived([]); return;
            } else {
                setReceived(receivedRes?.data?.receivedInvitations || []);
            }

            if (!sentByMeRes?.data?.success || !sentByTeamRes?.data?.success) {
                toast.error(sentByMeRes?.data?.message || sentByTeamRes?.data?.message || 'Failed to fetch sent invitations');
                setSentByMe([]); setSentByTeam([]); return;
            } else {
                setSentByMe(sentByMeRes?.data?.groupedSentInvitations || []);
                setSentByTeam(sentByTeamRes?.data?.groupedSentInvitations || []);
            }
        } catch (error) {
            if (error?.response?.status === 401) { setToken(null); localStorage.removeItem('token'); }
            toast.error(error?.response?.data?.message || 'Unable to fetch invitations');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (token) fetchInvitations();
        else setLoading(false);
    }, [token, authHeaders]);

    const respondInvitation = async (inviteId, status) => {
        try {
            const { data } = await api.put(`/teams/invitations/respond/${inviteId}`, { status }, { headers: authHeaders });
            if (!data?.success) { toast.error(data?.message || 'Failed to respond to invitation'); return; }
            toast.success(data?.message || 'Invitation response sent');
            setReceived((prev) => prev.filter(inv => inv._id !== inviteId));
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Unable to respond to invitation');
        }
    };

    if (loading) return <Loading />;

    const sentByMeCount = sentByMe.reduce((count, group) => count + (group?.invitations?.length || 0), 0);
    const sentByTeamCount = sentByTeam.reduce((count, group) => count + (group?.invitations?.length || 0), 0);

    const teamOptions = sentByTeam
        .map((group) => ({ id: group?.team?._id, name: group?.team?.name }))
        .filter((team) => Boolean(team.id));

    const filteredSentByTeam = teamFilter === 'all'
        ? sentByTeam
        : sentByTeam.filter((group) => group?.team?._id === teamFilter);

    const tabs = [
        { key: 'received',   label: 'Received',     count: received.length },
        { key: 'sentByMe',   label: 'Sent By Me',   count: sentByMeCount   },
        { key: 'sentByTeam', label: 'Sent By Team', count: sentByTeamCount },
    ];

    return (
        <div className="min-h-screen bg-[#f0f4f8] px-4 py-6 lg:px-8">

            {/* ── Page Header ── */}
            <div className="mb-6 [animation:fadeUp_.4s_ease_both]">
                <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 rounded-lg bg-[#e9f0f8] flex items-center justify-center">
                        <Mail size={14} className="text-[#315e8d]" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[.18em] text-[#315e8d]">
                        Invitations
                    </span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Team Invitations</h1>
                <p className="text-sm text-slate-500 mt-1">Manage your team invitations</p>
            </div>

            {/* ── Tabs ── */}
            <div className="flex items-center gap-2 mb-5 flex-wrap [animation:fadeUp_.4s_ease_.05s_both]">
                {tabs.map(t => {
                    const isActive = tab === t.key;
                    return (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95 ${
                                isActive
                                    ? 'bg-[#315e8d] text-white shadow-sm'
                                    : 'bg-white text-slate-500 border border-[#dbe5f1] hover:border-[#315e8d] hover:text-[#315e8d]'
                            }`}
                        >
                            {t.label}
                            {t.count > 0 && (
                                <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none ${
                                    isActive
                                        ? 'bg-white/20 text-white'
                                        : 'bg-[#e9f0f8] text-[#315e8d]'
                                }`}>
                                    {t.count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ── Received Invitations ── */}
            {tab === 'received' && (
                <div className="space-y-2.5 [animation:fadeUp_.35s_ease_both]">
                    {received.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-slate-100 flex items-center justify-center mb-4 shadow-sm">
                                <Mail size={28} className="text-gray-300" />
                            </div>
                            <p className="text-sm text-gray-500 max-w-xs">No pending invitations.</p>
                        </div>
                    ) : (
                        received.map(inv => (
                            <div
                                key={inv._id}
                                className="flex items-center justify-between gap-3 bg-white border border-[#dbe5f1] rounded-2xl px-4 py-3.5 transition-all duration-200 hover:border-[#c8d9ee] hover:-translate-y-0.5"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                                        {inv.sender?.firstName?.charAt(0)?.toUpperCase() || 'U'}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 truncate">
                                            {inv.sender?.firstName} {inv.sender?.lastName}{' '}
                                            <span className="font-normal text-slate-400">(@{inv.sender?.username})</span>
                                        </p>
                                        <p className="text-xs text-slate-400 truncate">
                                            {inv.team?.name || 'Team invitation'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={() => respondInvitation(inv._id, 'accepted')}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
                                    >
                                        <Check size={13} /> Accept
                                    </button>
                                    <button
                                        onClick={() => respondInvitation(inv._id, 'rejected')}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
                                    >
                                        <X size={13} /> Reject
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* ── Sent By Me ── */}
            {tab === 'sentByMe' && (
                <div className="space-y-4 [animation:fadeUp_.35s_ease_both]">
                    {sentByMeCount === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-slate-100 flex items-center justify-center mb-4 shadow-sm">
                                <Send size={28} className="text-gray-300" />
                            </div>
                            <p className="text-sm text-gray-500 max-w-xs">No invitations sent by you.</p>
                        </div>
                    ) : (
                        sentByMe.map(group => (
                            <div
                                key={group?.team?._id || group?.team?.name}
                                className="bg-white border border-[#dbe5f1] rounded-2xl overflow-hidden transition-all duration-200 hover:border-[#c8d9ee]"
                            >
                                {/* Group header */}
                                <div className="px-4 py-3 border-b border-[#f0f4f8] bg-[#f8fafc]">
                                    <h3 className="text-sm font-bold text-slate-800">
                                        {group?.team?.name || 'Unknown Team'}
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {group?.team?.title || 'Team invitations sent by you'}
                                    </p>
                                </div>

                                {/* Invitation rows */}
                                <div className="divide-y divide-[#f0f4f8]">
                                    {(group?.invitations || []).map(inv => (
                                        <div
                                            key={inv._id}
                                            className="flex items-center justify-between gap-3 px-4 py-3 transition-colors duration-150 hover:bg-slate-50"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <img
                                                    src={inv.receiver?.profilePicture || `https://ui-avatars.com/api/?name=${inv.receiver?.firstName}+${inv.receiver?.lastName}&background=3b82f6&color=fff`}
                                                    alt=""
                                                    className="w-9 h-9 rounded-xl object-cover ring-2 ring-gray-100 shrink-0"
                                                />
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-slate-800 truncate">
                                                        {inv.receiver?.firstName} {inv.receiver?.lastName}{' '}
                                                        <span className="font-normal text-slate-400">(@{inv.receiver?.username})</span>
                                                    </p>
                                                    <p className="text-xs text-slate-400 truncate">
                                                        {group?.team?.name || 'Team invitation'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="shrink-0">
                                                <span className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-100 rounded-lg">
                                                    <Clock size={11} /> Pending
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* ── Sent By Team ── */}
            {tab === 'sentByTeam' && (
                <div className="space-y-4 [animation:fadeUp_.35s_ease_both]">

                    {/* Filter row */}
                    <div className="flex items-center gap-3">
                        <label
                            htmlFor="team-filter"
                            className="text-xs font-bold text-slate-500 uppercase tracking-wide shrink-0"
                        >
                            Filter by Team
                        </label>
                        <select
                            id="team-filter"
                            value={teamFilter}
                            onChange={(e) => setTeamFilter(e.target.value)}
                            className="text-sm font-semibold text-[#315e8d] bg-[#edf3fa] border border-[#dbe5f1] rounded-xl px-3 py-1.5 appearance-none cursor-pointer outline-none transition-all duration-200 focus:ring-2 focus:ring-[#315e8d]/25"
                        >
                            <option value="all">All Teams</option>
                            {teamOptions.map((team) => (
                                <option key={team.id} value={team.id}>{team.name}</option>
                            ))}
                        </select>
                    </div>

                    {filteredSentByTeam.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-slate-100 flex items-center justify-center mb-4 shadow-sm">
                                <Send size={28} className="text-gray-300" />
                            </div>
                            <p className="text-sm text-gray-500 max-w-xs">
                                No team invitation packets for this filter.
                            </p>
                        </div>
                    ) : (
                        filteredSentByTeam.map((group) => (
                            <div
                                key={group?.team?._id || group?.team?.name}
                                className="bg-white border border-[#dbe5f1] rounded-2xl overflow-hidden transition-all duration-200 hover:border-[#c8d9ee]"
                            >
                                {/* Group header */}
                                <div className="px-4 py-3 border-b border-[#f0f4f8] bg-[#f8fafc] flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-bold text-slate-800 truncate">
                                            {group?.team?.name || 'Unknown Team'}
                                        </h3>
                                        <p className="text-xs text-slate-400 mt-0.5 truncate">
                                            {group?.team?.title || 'Grouped team invitations'}
                                        </p>
                                    </div>
                                    <span className="shrink-0 text-[11px] font-bold text-[#315e8d] bg-[#e9f0f8] border border-[#dbe5f1] rounded-lg px-2.5 py-1">
                                        {(group?.invitations || []).length} invitations
                                    </span>
                                </div>

                                {/* Invitation rows */}
                                <div className="divide-y divide-[#f0f4f8]">
                                    {(group?.invitations || []).map((inv) => (
                                        <div
                                            key={inv._id}
                                            className="flex items-center justify-between gap-3 px-4 py-3 transition-colors duration-150 hover:bg-slate-50"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <img
                                                    src={inv.sender?.profilePicture || `https://ui-avatars.com/api/?name=${inv.sender?.firstName}+${inv.sender?.lastName}&background=3b82f6&color=fff`}
                                                    alt=""
                                                    className="w-9 h-9 rounded-xl object-cover ring-2 ring-gray-100 shrink-0"
                                                />
                                                <div className="min-w-0">
                                                    <p className="text-xs text-slate-500 truncate">
                                                        <span className="font-semibold text-slate-700">From:</span>{' '}
                                                        {inv.sender?.firstName} {inv.sender?.lastName}{' '}
                                                        <span className="text-slate-400">(@{inv.sender?.username})</span>
                                                    </p>
                                                    <p className="text-xs text-slate-500 truncate mt-0.5">
                                                        <span className="font-semibold text-slate-700">To:</span>{' '}
                                                        {inv.receiver?.firstName} {inv.receiver?.lastName}{' '}
                                                        <span className="text-slate-400">(@{inv.receiver?.username})</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="shrink-0">
                                                <span className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-100 rounded-lg">
                                                    <Clock size={11} /> Pending
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

        </div>
    );
}

export default Invitations