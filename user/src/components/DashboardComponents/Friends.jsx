import { Check, Clock, Heart, Send, UserMinus, Users, X } from 'lucide-react'
import { useContext, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import api from '../../api/axiosInstance.js'
import { AppContext } from '../../context/AppContext.jsx'
import Loading from '../LoadingPage.jsx'
import AlertModal from './AlertModal.jsx'


const EmptyState = ({ icon: Icon, text }) => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-slate-100 flex items-center justify-center mb-4 shadow-sm">
            <Icon size={28} className="text-gray-300" />
        </div>
        <p className="text-sm text-gray-500 max-w-xs">{text}</p>
    </div>
);

const Friends = () => {

    const {token, setToken, authHeaders, navigate}= useContext(AppContext);

    const [friends, setFriends]= useState([]);
    const [received, setReceived]= useState([]);
    const [sent, setSent]= useState([]);
    const [loading, setLoading]= useState(true);
    const [sending , setSending]= useState(false);
    const [tab, setTab]= useState("friends");
    const [username, setUsername]= useState('');
    const [alert, setAlert]= useState({ isOpen: false, title: '', message: '', type: 'info' });

    const fetchFriends = async ()=>{
        try{
            const { data } = await api.get('/invites/friends', { headers: authHeaders });

            if(!data?.success){
                toast.error(data?.message || 'Failed to fetch friends');
                setFriends([]);
                return;
            }

            setFriends(data?.friends || []);
        }catch(error){
            toast.error(error?.response?.data?.message || 'Unable to fetch friends');
            setFriends([]);
        }
    }

    const fetchRequests= async ()=>{
        try{
            const [receivedRes, sentRes] = await Promise.all([
                api.get('/invites/invitations/received', { headers: authHeaders }),
                api.get('/invites/invitations/sent', { headers: authHeaders }),
            ]);

            if(!receivedRes?.data?.success){
                toast.error(receivedRes?.data?.message || 'Failed to fetch received requests');
                setReceived([]);
            } else {
                setReceived(receivedRes?.data?.invitations || []);
            }

            if(!sentRes?.data?.success){
                toast.error(sentRes?.data?.message || 'Failed to fetch sent requests');
                setSent([]);
            } else {
                setSent(sentRes?.data?.invitations || []);
            }
        }catch(error){
            toast.error(error?.response?.data?.message || 'Unable to fetch requests');
            setReceived([]);
            setSent([]);
        }
    }

    useEffect(()=> {
        const loadData = async () => {
            if(!token){
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                await Promise.all([fetchFriends(), fetchRequests()]);
            } catch (_error) {
                // Errors are handled inside fetch helpers.
            } finally {
                setLoading(false);
            }
        };

        loadData();
    },[token])

    const sendRequest= async (e)=>{
        e.preventDefault();
        if(!username.trim()) return ;
        setSending(true);
        try{
            const { data } = await api.post(
                '/invites/invitations/send-request',
                { username: username.trim() },
                { headers: authHeaders }
            );

            if(!data?.success){
                toast.error(data?.message || 'Failed to send request');
                return;
            }

            toast.success(data?.message || 'Friend request sent');
            setUsername('');

            const sentRes = await api.get('/invites/invitations/sent', { headers: authHeaders });
            if(sentRes?.data?.success){
                setSent(sentRes?.data?.invitations || []);
            }

        }catch(error){
            if(error?.response?.status === 401){
                setToken(null);
                localStorage.removeItem('token');
            }
            toast.error(error?.response?.data?.message || 'Unable to send request');
        }
        setSending(false);
    }

    const respondRequest= async (inviteId, status)=>{
        try{
            const { data } = await api.post(
                `/invites/invitations/respond-request/${inviteId}`,
                { status },
                { headers: authHeaders }
            );

            if(!data?.success){
                toast.error(data?.message || 'Failed to respond to request');
                return;
            }

            toast.success(data?.message || `Request ${status}`);
            setReceived((prev) => prev.filter((r) => r._id !== inviteId));
            if(status === 'accepted'){
                await fetchFriends();
            }
        }catch(error){
            toast.error(error?.response?.data?.message || 'Unable to respond to request');
        }
    }

    const cancelRequest= async (inviteId)=>{
        try{
            const { data } = await api.delete(`/invites/invitations/cancel-request/${inviteId}`, {
                headers: authHeaders,
            });

            if(!data?.success){
                toast.error(data?.message || 'Failed to cancel request');
                return;
            }

            toast.success(data?.message || 'Request cancelled');
            setSent((prev) => prev.filter((s) => s._id !== inviteId));

        }catch(error){
            toast.error(error?.response?.data?.message || 'Unable to cancel request');
        }
    }

    const unfriend= async (friendId)=>{
        try{
            const { data } = await api.post(`/invites/unfriend/${friendId}`, {}, { headers: authHeaders });

            if(!data?.success){
                toast.error(data?.message || 'Failed to unfriend user');
                return;
            }

            toast.success(data?.message || 'Unfriended successfully');
            setFriends((prev) => prev.filter((f) => f._id !== friendId));
        }catch(error){
            toast.error(error?.response?.data?.message || 'Unable to unfriend user');
        }
    }

    const tabs= [
        {key: 'friends', label: 'Friends', count: friends.length, icon: Heart},
        {key: 'received', label: 'Received', count: received.length, icon: Clock},
        {key: 'sent', label: 'Sent', count: sent.length, icon: Send},
    ]

    if(loading) return <Loading />

  return (
        <div className="space-y-6 dd-fade-up">
            <div className="dd-section-card dd-fade-up">
                <div className="dd-page-kicker w-fit">
                    <Heart size={18}></Heart>
                    <span>Connections</span>
                </div>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Friends</h1>
                <p className="mt-1 text-sm text-slate-600">Manage connections and send friend requests.</p>
            </div>

            <form onSubmit={sendRequest} className="dd-section-card flex flex-col gap-3 md:flex-row md:items-center">
                <div className="relative flex-1">
                    <input className="dd-input" type="text" value={username} onChange={(e)=> setUsername(e.target.value)} placeholder="Enter username to add friend..." />
                </div>

                <button className="dd-primary-button" type="submit" disabled={sending || !username.trim()}><Send size={16} /> Send</button>
            </form>

            <div className="dd-section-card p-3">
                {tabs.map((t)=>{
                    const TabIcon= t.icon;
                    return (
                        <button key={t.key} onClick={()=> setTab(t.key)} className={`mr-2 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${tab === t.key ? 'bg-[#315e8d] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                            <TabIcon size={16} />
                            <span>{t.label}</span>
                            {t.count > 0 && <span className={`rounded-full px-2 py-0.5 text-xs ${tab === t.key ? 'bg-white/20 text-white' : 'bg-white text-slate-600'}`}>{t.count}</span>}
                        </button>
                    )
                })}
            </div>

            {tab === 'friends' && (
                <div className="space-y-4">
                    {friends.length === 0 ? (
                        <EmptyState icon={Users} text="No friends yet. Send a request to get started!"/>
                    ) : (
                        friends.map((f)=>{
                            const visibility = f.privacySettings?.profileVisibility || 'public';
                            const showGreenBadge = visibility === 'public';
                            return (
                            <div key={f._id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/50 p-4 transition-all hover:bg-white hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <img
                                            src={f.profilePicture || `https://ui-avatars.com/api/?name=${f.firstName}+${f.lastName}&background=6366f1&color=fff`}
                                            alt=""
                                            className="w-12 h-12 rounded-xl object-cover shadow-sm ring-2 ring-slate-100"
                                        />
                                        {showGreenBadge && (
                                            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                                <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-white bg-emerald-500"></span>
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">{f.firstName} {f.lastName}</p>
                                        <p className="text-sm font-medium text-slate-500">@{f.username}</p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <button type="button" onClick={() => navigate(`/dashboard/user/${f.username}`)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-indigo-600 transition-colors">
                                        View Profile
                                    </button>
                                    <button className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-100 transition-colors" onClick={()=> unfriend(f._id)}>
                                        <UserMinus size={14} className="inline-block" /> Unfriend
                                    </button>
                                </div>
                            </div>
                        )})
                    )}
                </div>
            )}

            {tab === 'received' && (
                <div className="space-y-3">
                    {received.length === 0 ? (
                        <EmptyState icon= {Clock} text="No pending requests. When someone sends you a friend request, it will appear here." />
                    ) : (
                        received.map((r)=>(
                            <div key={r._id} className="dd-section-card flex flex-wrap items-center justify-between gap-3 p-4">
                                <div className="flex items-center gap-3">
                                     <img
                                        src={r.sender?.profilePicture || `https://ui-avatars.com/api/?name=${r.sender?.firstName}+${r.sender?.lastName}&background=6366f1&color=fff`}
                                        alt=""
                                        className="w-11 h-11 rounded-xl object-cover ring-2 ring-gray-100"
                                    />
                                    <div>
                                        <p className="font-semibold text-slate-900">{r.sender?.firstName} {r.sender?.lastName}</p>
                                        <p className="text-sm text-slate-500">@{r.sender?.username}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button className="dd-primary-button !px-3 !py-2" onClick={()=> respondRequest(r._id, 'accepted')}><Check size={14} /> Accept</button>
                                    <button className="dd-ghost-button !px-3 !py-2 border-rose-200 text-rose-600 hover:bg-rose-50" onClick={()=> respondRequest(r._id, 'rejected')}><X size={14} /> Reject</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {tab === 'sent' && (
                <div className="space-y-3">
                    {sent.length === 0 ? (
                        <EmptyState icon={Send} text="No sent requests. When you send a friend request, it will appear here until accepted or rejected." />
                    ) : (
                        sent.map((s)=> (
                            <div key= {s._id} className="dd-section-card flex flex-wrap items-center justify-between gap-3 p-4">
                                <div className="flex items-center gap-3">
                                    <img
                                        src={s.receiver?.profilePicture || `https://ui-avatars.com/api/?name=${s.receiver?.firstName}+${s.receiver?.lastName}&background=6366f1&color=fff`}
                                        alt=""
                                        className="w-11 h-11 rounded-xl object-cover ring-2 ring-gray-100"
                                    />
                                    <div>
                                        <p className="font-semibold text-slate-900">{s.receiver?.firstName} {s.receiver?.lastName}</p>
                                        <p className="text-sm text-slate-500">@{s.receiver?.username}</p>
                                    </div>
                                </div>
                                <button className="dd-ghost-button border-rose-200 text-rose-600 hover:bg-rose-50" onClick={()=> cancelRequest(s._id)}><X size={14} />Cancel</button>
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
                onClose={() => setAlert({ isOpen: false, title: '', message: '', type: 'info' })}
            />
        </div>
  )
}

export default Friends