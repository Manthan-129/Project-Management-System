import { Check, Clock, Mail, Send, X } from 'lucide-react'
import { useContext, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import api from '../../api/axiosInstance.js'
import { AppContext } from '../../context/AppContext.jsx'
import Loading from '../LoadingPage.jsx'

const Invitations = () => {

    const { token, setToken, authHeaders } = useContext(AppContext);
    const [received, setReceived]= useState([]);
    const [sentByMe, setSentByMe]= useState([]);
    const [sentByTeam, setSentByTeam]= useState([]);
    const [tab, setTab]= useState('received');
    const [teamFilter, setTeamFilter]= useState('all');
    const [loading, setLoading]= useState(true);
    const [isResponding, setIsResponding]= useState(false);

    const fetchInvitations = async () => {
        setLoading(true);
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
            setLoading(false);
        }
    }

    useEffect(()=> {
        if (token) {
            fetchInvitations();
        } else {
            setLoading(false);
        }
    }, [token, authHeaders]);

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
        <div className="dd-section-card dd-fade-up">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Team Invitations</h1>
            <p className="mt-1 text-sm text-slate-600">Manage your team invitations.</p>
        </div>

        {/* Tabs */}
        <div className="dd-section-card p-3">
            {tabs.map(t=> (
                <button key= {t.key} onClick={()=> setTab(t.key)} className={`mr-2 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${tab === t.key ? 'bg-[#315e8d] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    {t.label}
                    {t.count > 0 && <span className={`rounded-full px-2 py-0.5 text-xs ${tab === t.key ? 'bg-white/20 text-white' : 'bg-white text-slate-600'}`}>{t.count}</span>}
                </button>
            ))}
        </div>

        {/* Received Invitations */}
        {tab === 'received' && (
            <div className="space-y-3">
                {received.length === 0 ? (
                    <div className="dd-section-card py-14 text-center">
                        <Mail size= {40} className="mx-auto text-slate-300"></Mail>
                        <p className="mt-3 text-sm text-slate-600">No Pending Invitations.</p>
                    </div>
                )
            :
            (
                received.map(inv=> (
                    <div key= {inv._id} className="dd-section-card p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 font-bold text-[#315e8d]">{inv.sender?.firstName?.charAt(0)?.toUpperCase() || 'U'}</div>
                            <div>
                                <p className="font-semibold text-slate-900">{inv.sender?.firstName} {inv.sender?.lastName} (@{inv.sender?.username})</p>
                                <p className="text-sm text-slate-500">{inv.team?.name || 'Team invitation'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button disabled={isResponding} className="dd-primary-button !px-3 !py-2 disabled:opacity-50" onClick={()=> respondInvitation(inv._id, 'accepted')}>
                                {isResponding ? 'Accepting...' : <><Check size= {16} />Accept</>}
                            </button>
                            <button disabled={isResponding} className="dd-ghost-button !px-3 !py-2 border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-50" onClick={()=> respondInvitation(inv._id, 'rejected')}>
                                {isResponding ? 'Rejecting...' : <><X size= {16} />Reject</>}
                            </button>
                        </div>
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
                    <div className="dd-section-card py-14 text-center">
                        <Send size={36} className="mx-auto text-slate-300"></Send>
                        <p className="mt-3 text-sm text-slate-600">No invitations sent by you</p>
                    </div>
                )
            :
            (
                sentByMe.map(group => (
                    <div key={group?.team?._id || group?.team?.name} className="dd-section-card p-4 space-y-3">
                        <h3 className="text-lg font-bold text-slate-900">{group?.team?.name || 'Unknown Team'}</h3>
                        <p className="text-sm text-slate-500">{group?.team?.title || 'Team invitations sent by you'}</p>

                        {(group?.invitations || []).map(inv => (
                            <div key= {inv._id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                <div className="flex items-center gap-3">
                                    <img src={inv.receiver?.profilePicture || `https://ui-avatars.com/api/?name=${inv.receiver?.firstName}+${inv.receiver?.lastName}&background=3b82f6&color=fff`} alt="" className="w-10 h-10 rounded-full object-cover" />
                                    <div>
                                        <p className="font-medium text-slate-800">{inv.receiver?.firstName} {inv.receiver?.lastName} (@{inv.receiver?.username})</p>
                                        <p className="text-xs text-slate-500">{group?.team?.name || 'Team invitation'}</p>
                                    </div>
                                </div>
                                <div>
                                    <span className="dd-badge border-amber-200 bg-amber-50 text-amber-700"><Clock size= {12}></Clock> Pending</span>
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
                <div className="dd-section-card p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                        <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Filter by Team</label>
                        <span className="dd-badge border-slate-200 bg-slate-50 text-slate-700">{filteredSentByTeam.length} group{filteredSentByTeam.length === 1 ? '' : 's'}</span>
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
                                            ? 'border-[#d7e3f1] bg-[linear-gradient(135deg,rgba(49,94,141,0.12),rgba(255,255,255,0.95))] text-[#26486d] shadow-[0_12px_30px_rgba(49,94,141,0.10)]'
                                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                    }`}
                                >
                                    <span>{team.name}</span>
                                    <span className={`rounded-full px-2 py-0.5 text-[11px] ${isActive ? 'bg-white/80 text-[#315e8d]' : 'bg-slate-100 text-slate-500'}`}>
                                        {team.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {filteredSentByTeam.length === 0 ? (
                    <div className="dd-section-card py-14 text-center">
                        <Send size={36} className="mx-auto text-slate-300"></Send>
                        <p className="mt-3 text-sm text-slate-600">No team invitation packets for this filter</p>
                    </div>
                ) : (
                    filteredSentByTeam.map((group) => (
                        <div key={group?.team?._id || group?.team?.name} className="dd-section-card p-4 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <h3 className="text-lg font-bold text-slate-900">{group?.team?.name || 'Unknown Team'}</h3>
                                <span className="dd-badge border-slate-200 bg-slate-50 text-slate-700">{(group?.invitations || []).length} invitations</span>
                                <p className="w-full text-sm text-slate-500">{group?.team?.title || 'Grouped team invitations'}</p>
                            </div>

                            <div className="space-y-2">
                                {(group?.invitations || []).map((inv) => (
                                    <div key={inv._id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                        <div className="flex items-center gap-3">
                                            <img src={inv.sender?.profilePicture || `https://ui-avatars.com/api/?name=${inv.sender?.firstName}+${inv.sender?.lastName}&background=3b82f6&color=fff`} alt="" className="w-10 h-10 rounded-full object-cover" />
                                            <div>
                                                <p className="text-sm text-slate-700">
                                                    From: {inv.sender?.firstName} {inv.sender?.lastName} (@{inv.sender?.username})
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    To: {inv.receiver?.firstName} {inv.receiver?.lastName} (@{inv.receiver?.username})
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            <span className="dd-badge border-amber-200 bg-amber-50 text-amber-700"><Clock size={12}></Clock> Pending</span>
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
  )
}

export default Invitations