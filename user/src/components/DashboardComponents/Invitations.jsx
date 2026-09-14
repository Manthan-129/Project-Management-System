import { Check, Clock, Mail, Send, X } from 'lucide-react'
import { useContext, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import api from '../../api/axiosInstance.js'
import { SOCKET_EVENTS } from '../../api/socketEvents.js'
import { AppContext } from '../../context/AppContext.jsx'
import Loading from '../LoadingPage.jsx'
import AlertModal from './AlertModal.jsx'

const Invitations = () => {

    const { token, setToken, authHeaders, socket } = useContext(AppContext);
    const [received, setReceived]= useState([]);
    const [sentByMe, setSentByMe]= useState([]);
    const [sentByTeam, setSentByTeam]= useState([]);
    const [tab, setTab]= useState('received');
    const [teamFilter, setTeamFilter]= useState('all');
    const [loading, setLoading]= useState(true);
    const [isResponding, setIsResponding]= useState(false);
    const [alert, setAlert]= useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
        isDecision: false,
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        details: null,
        onConfirm: null,
    });

    const fetchInvitations = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try{
            const [receivedRes, sentByMeRes, sentByTeamRes] = await Promise.all([
                api.get('/teams/invitations/received', { headers: authHeaders }),
                api.get('/teams/invitations/sent-by-me', { headers: authHeaders }),
                api.get('/teams/invitations/sent-by-team', { headers: authHeaders }),
            ]);

            if(!receivedRes?.data?.success){
                toast.error(receivedRes?.data?.message || 'Failed to fetch received invitations');
                setReceived([]);
                return;
            }else{
                setReceived(receivedRes?.data?.receivedInvitations || []);
            }

            if(!sentByMeRes?.data?.success || !sentByTeamRes?.data?.success){
                const sentErrorMessage =
                    sentByMeRes?.data?.message || sentByTeamRes?.data?.message || 'Failed to fetch sent invitations';
                toast.error(sentErrorMessage);
                setSentByMe([]);
                setSentByTeam([]);
                return;
            }else{
                const groupedByMe = sentByMeRes?.data?.groupedSentInvitations || [];
                const groupedByTeam = sentByTeamRes?.data?.groupedSentInvitations || [];
                setSentByMe(groupedByMe);
                setSentByTeam(groupedByTeam);
            }
        }catch(error){
            if(error?.response?.status === 401) {
                setToken(null);
                localStorage.removeItem('token');
            }
            toast.error(error?.response?.data?.message || 'Unable to fetch invitations');
        }finally{
            if (showLoading) setLoading(false);
        }
    }

    useEffect(()=> {
        if (token) {
            fetchInvitations(true);
        } else {
            setLoading(false);
        }
    }, [token, authHeaders]);

    // Live real-time socket updates for team invitations
    useEffect(() => {
        if (!socket) return;

        const handleInvitationReceived = (invitation) => {
            if (!invitation?._id) return;
            setReceived((prev) => {
                if (prev.some((inv) => inv._id === invitation._id)) return prev;
                return [invitation, ...prev];
            });
        };

        const handleInvitationResponded = ({ invitationId }) => {
            if (!invitationId) return;
            setReceived((prev) => prev.filter((inv) => inv._id !== invitationId));
            setSentByMe((prev) =>
                prev
                    .map((group) => ({
                        ...group,
                        invitations: (group.invitations || []).filter((inv) => inv._id !== invitationId),
                    }))
                    .filter((group) => (group.invitations || []).length > 0)
            );
            setSentByTeam((prev) =>
                prev
                    .map((group) => ({
                        ...group,
                        invitations: (group.invitations || []).filter((inv) => inv._id !== invitationId),
                    }))
                    .filter((group) => (group.invitations || []).length > 0)
            );
        };

        socket.on(SOCKET_EVENTS.TEAM_INVITATION_RECEIVED, handleInvitationReceived);
        socket.on(SOCKET_EVENTS.TEAM_INVITATION_RESPONDED, handleInvitationResponded);

        return () => {
            socket.off(SOCKET_EVENTS.TEAM_INVITATION_RECEIVED, handleInvitationReceived);
            socket.off(SOCKET_EVENTS.TEAM_INVITATION_RESPONDED, handleInvitationResponded);
        };
    }, [socket]);

    const respondInvitation= async (inviteId, status) => {
        setIsResponding(true);
        try{
            const { data }= await api.put(`/teams/invitations/respond/${inviteId}`, { status }, { headers: authHeaders });

            if(!data?.success){
                toast.error(data?.message || 'Failed to respond to invitation');
                return;
            }

            setReceived((prev) => prev.filter(inv => inv._id !== inviteId));
        } catch(error){
            toast.error(error?.response?.data?.message || 'Unable to respond to invitation');
        } finally {
            setIsResponding(false);
        }
    };

    const closeAlert = () => {
        setAlert({
            isOpen: false,
            title: '',
            message: '',
            type: 'info',
            isDecision: false,
            confirmText: 'Confirm',
            cancelText: 'Cancel',
            details: null,
            onConfirm: null,
        });
    };

    const handlePromptReject = (inv) => {
        setAlert({
            isOpen: true,
            title: 'Decline Team Invitation?',
            message: `Are you sure you want to decline the invitation to join ${inv.team?.name || 'this team'}?`,
            type: 'danger',
            isDecision: true,
            confirmText: 'Decline Invitation',
            cancelText: 'Keep Invitation',
            details: (
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 font-bold text-indigo-400">
                        {inv.team?.name?.charAt(0)?.toUpperCase() || 'T'}
                    </div>
                    <div>
                        <p className="font-bold text-white">{inv.team?.name || 'Team'}</p>
                        <p className="text-xs text-slate-400">Invited by @{inv.sender?.username}</p>
                    </div>
                </div>
            ),
            onConfirm: () => respondInvitation(inv._id, 'rejected'),
        });
    };

    const sentByMeCount = sentByMe.reduce((count, group) => count + (group?.invitations?.length || 0), 0);
    const sentByTeamCount = sentByTeam.reduce((count, group) => count + (group?.invitations?.length || 0), 0);

    const teamOptions = useMemo(() => {
        return sentByTeam
            .map((group) => ({
                id: group?.team?._id,
                name: group?.team?.name,
                count: group?.invitations?.length || 0,
            }))
            .filter((team) => Boolean(team.id));
    }, [sentByTeam]);

    const filteredSentByTeam = useMemo(() => {
        return teamFilter === 'all'
            ? sentByTeam
            : sentByTeam.filter((group) => group?.team?._id === teamFilter);
    }, [sentByTeam, teamFilter]);

    const teamFilterChips = [
        { id: 'all', name: 'All Teams', count: sentByTeamCount },
        ...teamOptions,
    ];

    const tabs= [
        {
            key: "received", label: 'Received', count: received.length
        },
        {
            key: 'sentByMe', label: 'Sent By Me', count: sentByMeCount
        },
        {
            key: 'sentByTeam', label: 'Sent By Team', count: sentByTeamCount
        },
    ]

    if(loading) return <Loading />;

  return (
    <div className="space-y-6 dd-fade-up">
        <div className="rounded-2xl border border-[#1b3a5c] bg-[#0c1f38] p-5 text-white shadow-xs dd-fade-up">
            <h1 className="text-3xl font-black tracking-tight text-white">Team Invitations</h1>
            <p className="mt-1 text-sm text-slate-300">Manage your team invitations.</p>
        </div>

        {/* Tabs */}
        <div className="rounded-2xl border border-[#1b3a5c] bg-[#0c1f38] p-3 text-white shadow-xs">
            {tabs.map(t=> (
                <button key= {t.key} onClick={()=> setTab(t.key)} className={`mr-2 inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${tab === t.key ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-xs' : 'bg-[#0a1829] text-slate-300 hover:bg-[#132d52] hover:text-white'}`}>
                    {t.label}
                    {t.count > 0 && <span className={`rounded-full px-2 py-0.5 text-xs ${tab === t.key ? 'bg-white/20 text-white' : 'bg-[#132d52] text-slate-300'}`}>{t.count}</span>}
                </button>
            ))}
        </div>

        {/* Received Invitations */}
        {tab === 'received' && (
            <div className="max-h-[calc(100vh-280px)] overflow-y-auto pr-1.5 custom-scrollbar space-y-3">
                {received.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-[#1b3a5c] bg-[#0c1f38] py-14 text-center">
                        <Mail size= {40} className="mx-auto text-slate-500"></Mail>
                        <p className="mt-3 text-sm text-slate-400">No Pending Invitations.</p>
                    </div>
                )
            :
            (
                received.map(inv=> (
                    <div key= {inv._id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#1b3a5c] bg-[#0c1f38] p-4 text-white shadow-xs">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#1b3a5c] bg-[#132d52] font-bold text-indigo-400">{inv.sender?.firstName?.charAt(0)?.toUpperCase() || 'U'}</div>
                            <div>
                                <p className="font-semibold text-white">{inv.sender?.firstName} {inv.sender?.lastName} (@{inv.sender?.username})</p>
                                <p className="text-sm text-slate-400">{inv.team?.name || 'Team invitation'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button disabled={isResponding} className="dd-primary-button !px-3 !py-2 disabled:opacity-50" onClick={()=> respondInvitation(inv._id, 'accepted')}>
                                {isResponding ? 'Accepting...' : <><Check size= {16} />Accept</>}
                            </button>
                            <button disabled={isResponding} className="rounded-xl border border-rose-500/30 bg-rose-500/15 !px-3 !py-2 text-sm font-semibold text-rose-300 hover:bg-rose-500/25 transition disabled:opacity-50" onClick={()=> handlePromptReject(inv)}>
                                {isResponding ? 'Rejecting...' : <><X size= {16} />Reject</>}
                            </button>
                        </div>
                    </div>
                ))
            )}
            </div>
        )}

        {/* Sent By Me */}
        {tab === 'sentByMe' && (
            <div className="space-y-3">
            {sentByMeCount === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-[#1b3a5c] bg-[#0c1f38] py-14 text-center">
                    <Send size={36} className="mx-auto text-slate-500"></Send>
                    <p className="mt-3 text-sm text-slate-400">No invitations sent by you</p>
                </div>
            )
        :
        (
            sentByMe.map(group => (
                <div key={group?.team?._id || group?.team?.name} className="rounded-2xl border border-[#1b3a5c] bg-[#0c1f38] p-4 text-white shadow-xs space-y-3">
                    <h3 className="text-lg font-bold text-white">{group?.team?.name || 'Unknown Team'}</h3>
                    <p className="text-sm text-slate-400">{group?.team?.title || 'Team invitations sent by you'}</p>

                    {(group?.invitations || []).map(inv => (
                        <div key= {inv._id} className="flex items-center justify-between gap-3 rounded-xl border border-[#1b3a5c] bg-[#081526] px-3.5 py-2.5">
                            <div className="flex items-center gap-3">
                                <img src={inv.receiver?.profilePicture || `https://ui-avatars.com/api/?name=${inv.receiver?.firstName}+${inv.receiver?.lastName}&background=3b82f6&color=fff`} alt="" className="w-10 h-10 rounded-full object-cover ring-1 ring-[#1b3a5c]" />
                                <div>
                                    <p className="font-medium text-white">{inv.receiver?.firstName} {inv.receiver?.lastName} (@{inv.receiver?.username})</p>
                                    <p className="text-xs text-slate-400">{group?.team?.name || 'Team invitation'}</p>
                                </div>
                            </div>
                            <div>
                                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-300"><Clock size= {12}></Clock> Pending</span>
                            </div>
                        </div>
                    ))}
                </div>
            ))
        )}
        </div>
        )}

        {/* Sent By Team (Grouped Packets) */}
        {tab === 'sentByTeam' && (
            <div className="space-y-3">
                <div className="rounded-2xl border border-[#1b3a5c] bg-[#0c1f38] p-4 text-white shadow-xs">
                    <div className="mb-3 flex items-center justify-between gap-2">
                        <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Filter by Team</label>
                        <span className="rounded-full border border-[#1b3a5c] bg-[#132d52] px-2.5 py-0.5 text-xs font-semibold text-slate-200">{filteredSentByTeam.length} group{filteredSentByTeam.length === 1 ? '' : 's'}</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {teamFilterChips.map((team) => {
                            const isActive = teamFilter === team.id;

                            return (
                                <button
                                    key={team.id}
                                    type="button"
                                    onClick={() => setTeamFilter(team.id)}
                                    className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                                        isActive
                                            ? 'border-indigo-500/50 bg-indigo-600 text-white shadow-xs'
                                            : 'border-[#1b3a5c] bg-[#0a1829] text-slate-300 hover:bg-[#132d52] hover:text-white'
                                    }`}
                                >
                                    <span>{team.name}</span>
                                    <span className={`rounded-full px-2 py-0.5 text-[11px] ${isActive ? 'bg-white/20 text-white font-bold' : 'bg-[#132d52] text-slate-300'}`}>
                                        {team.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {filteredSentByTeam.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-[#1b3a5c] bg-[#0c1f38] py-14 text-center">
                        <Send size={36} className="mx-auto text-slate-500"></Send>
                        <p className="mt-3 text-sm text-slate-400">No team invitation packets for this filter</p>
                    </div>
                ) : (
                    filteredSentByTeam.map((group) => (
                        <div key={group?.team?._id || group?.team?.name} className="rounded-2xl border border-[#1b3a5c] bg-[#0c1f38] p-4 text-white shadow-xs space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <h3 className="text-lg font-bold text-white">{group?.team?.name || 'Unknown Team'}</h3>
                                <span className="rounded-full border border-[#1b3a5c] bg-[#132d52] px-2.5 py-0.5 text-xs font-semibold text-slate-200">{(group?.invitations || []).length} invitations</span>
                                <p className="w-full text-sm text-slate-400">{group?.team?.title || 'Grouped team invitations'}</p>
                            </div>

                            <div className="space-y-2">
                                {(group?.invitations || []).map((inv) => (
                                    <div key={inv._id} className="flex items-center justify-between gap-3 rounded-xl border border-[#1b3a5c] bg-[#081526] px-3.5 py-2.5">
                                        <div className="flex items-center gap-3">
                                            <img src={inv.sender?.profilePicture || `https://ui-avatars.com/api/?name=${inv.sender?.firstName}+${inv.sender?.lastName}&background=3b82f6&color=fff`} alt="" className="w-10 h-10 rounded-full object-cover ring-1 ring-[#1b3a5c]" />
                                            <div>
                                                <p className="text-sm font-medium text-white">
                                                    From: {inv.sender?.firstName} {inv.sender?.lastName} (@{inv.sender?.username})
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    To: {inv.receiver?.firstName} {inv.receiver?.lastName} (@{inv.receiver?.username})
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-300"><Clock size={12}></Clock> Pending</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        )}

        <AlertModal 
            isOpen={alert.isOpen}
            title={alert.title}
            message={alert.message}
            type={alert.type}
            isDecision={alert.isDecision}
            confirmText={alert.confirmText}
            cancelText={alert.cancelText}
            confirmLoading={isResponding}
            details={alert.details}
            onConfirm={alert.onConfirm}
            onCancel={closeAlert}
            onClose={closeAlert}
        />
    </div>
  )
}

export default Invitations