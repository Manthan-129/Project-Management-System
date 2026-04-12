import { Check, Clock, Mail, Send, X } from 'lucide-react'
import { useContext, useEffect, useState } from 'react'
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
        try{
            const { data }= await api.put(`/teams/invitations/respond/${inviteId}`, { status }, { headers: authHeaders });

            if(!data?.success){
                toast.error(data?.message || 'Failed to respond to invitation');
                return;
            }

            toast.success(data?.message || 'Invitation response sent');
            setReceived((prev) => prev.filter(inv => inv._id !== inviteId));
        } catch(error){
            toast.error(error?.response?.data?.message || 'Unable to respond to invitation');
        }
    };

    if(loading) return <Loading />;

    const sentByMeCount = sentByMe.reduce((count, group) => count + (group?.invitations?.length || 0), 0);
    const sentByTeamCount = sentByTeam.reduce((count, group) => count + (group?.invitations?.length || 0), 0);

    const teamOptions = sentByTeam
        .map((group) => ({
            id: group?.team?._id,
            name: group?.team?.name,
        }))
        .filter((team) => Boolean(team.id));

    const filteredSentByTeam = teamFilter === 'all'
        ? sentByTeam
        : sentByTeam.filter((group) => group?.team?._id === teamFilter);

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

  return (
    <div>
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Team Invitations</h1>
                <p className="text-gray-500 text-sm mt-1">Manage your team invitations</p>
        </div>

        {/* Tabs */}
        <div>
            {tabs.map(t=> (
                <button key= {t.key} onClick={()=> setTab(t.key)}>
                    {t.label}
                    {t.count > 0 && <span>{t.count}</span>}
                </button>
            ))}
        </div>

        {/* Received Invitations */}
        {tab === 'received' && (
            <div>
                {received.length === 0 ? (
                    <div>
                        <Mail size= {40}></Mail>
                        <p>No Pending Invitations.</p>
                    </div>
                )
            :
            (
                received.map(inv=> (
                    <div key= {inv._id}>
                        <div>
                            <div>{inv.sender?.firstName?.charAt(0)?.toUpperCase() || 'U'}</div>
                            <div>
                                <p>{inv.sender?.firstName} {inv.sender?.lastName} (@{inv.sender?.username})</p>
                                <p>{inv.team?.name || 'Team invitation'}</p>
                            </div>
                        </div>

                        <div>
                            <button onClick={()=> respondInvitation(inv._id, 'accepted')}><Check size= {16} />Accept</button>
                            <button onClick={()=> respondInvitation(inv._id, 'rejected')}><X size= {16} />Reject</button>
                        </div>
                    </div>
                ))
            )}
            </div>
        )}


        {/* Sent By Me */}
            {tab === 'sentByMe' && (
                <div>
                {sentByMeCount === 0 ? (
                    <div>
                        <div>
                            <Send size={36}></Send>
                        </div>
                        <p>No invitations sent by you</p>
                    </div>
                )
            :
            (
                sentByMe.map(group => (
                    <div key={group?.team?._id || group?.team?.name}>
                        <h3>{group?.team?.name || 'Unknown Team'}</h3>
                        <p>{group?.team?.title || 'Team invitations sent by you'}</p>

                        {(group?.invitations || []).map(inv => (
                            <div key= {inv._id}>
                                <div>
                                    <img src={inv.receiver?.profilePicture || `https://ui-avatars.com/api/?name=${inv.receiver?.firstName}+${inv.receiver?.lastName}&background=3b82f6&color=fff`} alt="" className="w-10 h-10 rounded-full object-cover" />
                                    <div>
                                        <p>{inv.receiver?.firstName} {inv.receiver?.lastName} (@{inv.receiver?.username})</p>
                                        <p>{group?.team?.name || 'Team invitation'}</p>
                                    </div>
                                </div>
                                <div>
                                    <span><Clock size= {12}></Clock> Pending</span>
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
            <div>
                <div>
                    <label htmlFor="team-filter">Filter by Team</label>
                    <select
                        id="team-filter"
                        value={teamFilter}
                        onChange={(e) => setTeamFilter(e.target.value)}
                    >
                        <option value="all">All Teams</option>
                        {teamOptions.map((team) => (
                            <option key={team.id} value={team.id}>
                                {team.name}
                            </option>
                        ))}
                    </select>
                </div>

                {filteredSentByTeam.length === 0 ? (
                    <div>
                        <div>
                            <Send size={36}></Send>
                        </div>
                        <p>No team invitation packets for this filter</p>
                    </div>
                ) : (
                    filteredSentByTeam.map((group) => (
                        <div key={group?.team?._id || group?.team?.name}>
                            <div>
                                <h3>{group?.team?.name || 'Unknown Team'}</h3>
                                <p>{group?.team?.title || 'Grouped team invitations'}</p>
                                <span>{(group?.invitations || []).length} invitations</span>
                            </div>

                            <div>
                                {(group?.invitations || []).map((inv) => (
                                    <div key={inv._id}>
                                        <div>
                                            <img src={inv.sender?.profilePicture || `https://ui-avatars.com/api/?name=${inv.sender?.firstName}+${inv.sender?.lastName}&background=3b82f6&color=fff`} alt="" className="w-10 h-10 rounded-full object-cover" />
                                            <div>
                                                <p>
                                                    From: {inv.sender?.firstName} {inv.sender?.lastName} (@{inv.sender?.username})
                                                </p>
                                                <p>
                                                    To: {inv.receiver?.firstName} {inv.receiver?.lastName} (@{inv.receiver?.username})
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            <span><Clock size={12}></Clock> Pending</span>
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