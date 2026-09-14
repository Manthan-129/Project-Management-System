import { Check, Clock, Heart, Send, UserMinus, Users, X } from 'lucide-react'
import { useContext, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import api from '../../api/axiosInstance.js'
import { SOCKET_EVENTS } from '../../api/socketEvents.js'
import { AppContext } from '../../context/AppContext.jsx'
import Loading from '../LoadingPage.jsx'
import AlertModal from './AlertModal.jsx'


const EmptyState = ({ icon: Icon, text }) => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl border border-[#1b3a5c] bg-[#0c1f38] flex items-center justify-center mb-4 shadow-sm">
            <Icon size={28} className="text-slate-400" />
        </div>
        <p className="text-sm text-slate-400 max-w-xs">{text}</p>
    </div>
);

const Friends = () => {

    const {token, setToken, authHeaders, navigate, socket}= useContext(AppContext);

    const [friends, setFriends]= useState([]);
    const [received, setReceived]= useState([]);
    const [sent, setSent]= useState([]);
    const [loading, setLoading]= useState(true);
    const [sending , setSending]= useState(false);
    const [tab, setTab]= useState("friends");
    const [username, setUsername]= useState('');
    const [isResponding, setIsResponding]= useState(false);
    const [isCancelling, setIsCancelling]= useState(false);
    const [isUnfriending, setIsUnfriending]= useState(false);
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
    },[token]);

    // Real-time friend updates via WebSockets
    useEffect(() => {
        if (!socket) return;

        const handleRequestReceived = (invite) => {
            if (!invite?._id) return;
            setReceived((prev) => [invite, ...prev.filter((r) => r._id !== invite._id)]);
        };

        const handleRequestResponded = ({ inviteId }) => {
            if (!inviteId) return;
            setSent((prev) => prev.filter((s) => s._id !== inviteId));
        };

        const handleRequestCancelled = ({ inviteId }) => {
            if (!inviteId) return;
            setReceived((prev) => prev.filter((r) => r._id !== inviteId));
        };

        const handleFriendListUpdated = () => {
            fetchFriends();
        };

        const handleUnfriended = ({ friendId }) => {
            if (!friendId) return;
            setFriends((prev) => prev.filter((f) => f._id !== friendId));
        };

        socket.on(SOCKET_EVENTS.FRIEND_REQUEST_RECEIVED, handleRequestReceived);
        socket.on(SOCKET_EVENTS.FRIEND_REQUEST_RESPONDED, handleRequestResponded);
        socket.on(SOCKET_EVENTS.FRIEND_REQUEST_ACCEPTED, handleFriendListUpdated);
        socket.on(SOCKET_EVENTS.FRIEND_REQUEST_CANCELLED, handleRequestCancelled);
        socket.on(SOCKET_EVENTS.FRIEND_LIST_UPDATED, handleFriendListUpdated);
        socket.on(SOCKET_EVENTS.FRIEND_UNFRIENDED, handleUnfriended);

        return () => {
            socket.off(SOCKET_EVENTS.FRIEND_REQUEST_RECEIVED, handleRequestReceived);
            socket.off(SOCKET_EVENTS.FRIEND_REQUEST_RESPONDED, handleRequestResponded);
            socket.off(SOCKET_EVENTS.FRIEND_REQUEST_ACCEPTED, handleFriendListUpdated);
            socket.off(SOCKET_EVENTS.FRIEND_REQUEST_CANCELLED, handleRequestCancelled);
            socket.off(SOCKET_EVENTS.FRIEND_LIST_UPDATED, handleFriendListUpdated);
            socket.off(SOCKET_EVENTS.FRIEND_UNFRIENDED, handleUnfriended);
        };
    }, [socket]);

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
        setIsResponding(true);
        try{
            const { data } = await api.put(
                `/invites/invitations/respond/${inviteId}`,
                { status },
                { headers: authHeaders }
            );

            if(!data?.success){
                toast.error(data?.message || 'Failed to respond to request');
                return;
            }


            setReceived((prev) => prev.filter((r) => r._id !== inviteId));
            if(status === 'accepted'){
                await fetchFriends();
            }
        }catch(error){
            toast.error(error?.response?.data?.message || 'Unable to respond to request');
        } finally {
            setIsResponding(false);
        }
    }

    const cancelRequest= async (inviteId)=>{
        setIsCancelling(true);
        try{
            const { data } = await api.delete(`/invites/invitations/cancel-request/${inviteId}`, {
                headers: authHeaders,
            });

            if(!data?.success){
                toast.error(data?.message || 'Failed to cancel request');
                return;
            }


            setSent((prev) => prev.filter((s) => s._id !== inviteId));

        }catch(error){
            toast.error(error?.response?.data?.message || 'Unable to cancel request');
        } finally {
            setIsCancelling(false);
        }
    }

    const unfriend= async (friendId)=>{
        setIsUnfriending(true);
        try{
            const { data } = await api.post(`/invites/unfriend/${friendId}`, {}, { headers: authHeaders });

            if(!data?.success){
                toast.error(data?.message || 'Failed to unfriend user');
                return;
            }


            setFriends((prev) => prev.filter((f) => f._id !== friendId));
        }catch(error){
            toast.error(error?.response?.data?.message || 'Unable to unfriend user');
        } finally {
            setIsUnfriending(false);
        }
    }

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

    const handlePromptUnfriend = (f) => {
        setAlert({
            isOpen: true,
            title: `Unfriend ${f.firstName} ${f.lastName}?`,
            message: `Are you sure you want to remove @${f.username} from your friends list? You will no longer share direct collaboration activity with them.`,
            type: 'danger',
            isDecision: true,
            confirmText: 'Confirm Unfriend',
            cancelText: 'Cancel',
            details: (
                <div className="flex items-center gap-3">
                    <img
                        src={f.profilePicture || `https://ui-avatars.com/api/?name=${f.firstName}+${f.lastName}&background=6366f1&color=fff`}
                        alt=""
                        className="h-10 w-10 rounded-xl object-cover ring-1 ring-[#1b3a5c]"
                    />
                    <div>
                        <p className="font-bold text-white">{f.firstName} {f.lastName}</p>
                        <p className="text-xs text-slate-400">@{f.username}</p>
                    </div>
                </div>
            ),
            onConfirm: () => unfriend(f._id),
        });
    };

    const handlePromptCancelRequest = (s) => {
        setAlert({
            isOpen: true,
            title: 'Cancel Friend Request?',
            message: `Are you sure you want to cancel the pending friend request sent to @${s.receiver?.username}?`,
            type: 'warning',
            isDecision: true,
            confirmText: 'Cancel Request',
            cancelText: 'Keep Request',
            details: (
                <div className="flex items-center gap-3">
                    <img
                        src={s.receiver?.profilePicture || `https://ui-avatars.com/api/?name=${s.receiver?.firstName}+${s.receiver?.lastName}&background=6366f1&color=fff`}
                        alt=""
                        className="h-10 w-10 rounded-xl object-cover ring-1 ring-[#1b3a5c]"
                    />
                    <div>
                        <p className="font-bold text-white">{s.receiver?.firstName} {s.receiver?.lastName}</p>
                        <p className="text-xs text-slate-400">@{s.receiver?.username}</p>
                    </div>
                </div>
            ),
            onConfirm: () => cancelRequest(s._id),
        });
    };

    const handlePromptRejectRequest = (r) => {
        setAlert({
            isOpen: true,
            title: 'Decline Friend Request?',
            message: `Are you sure you want to decline the friend request from @${r.sender?.username}?`,
            type: 'danger',
            isDecision: true,
            confirmText: 'Decline Request',
            cancelText: 'Keep Request',
            details: (
                <div className="flex items-center gap-3">
                    <img
                        src={r.sender?.profilePicture || `https://ui-avatars.com/api/?name=${r.sender?.firstName}+${r.sender?.lastName}&background=6366f1&color=fff`}
                        alt=""
                        className="h-10 w-10 rounded-xl object-cover ring-1 ring-[#1b3a5c]"
                    />
                    <div>
                        <p className="font-bold text-white">{r.sender?.firstName} {r.sender?.lastName}</p>
                        <p className="text-xs text-slate-400">@{r.sender?.username}</p>
                    </div>
                </div>
            ),
            onConfirm: () => respondRequest(r._id, 'rejected'),
        });
    };

    const tabs= [
        {key: 'friends', label: 'Friends', count: friends.length, icon: Heart},
        {key: 'received', label: 'Received', count: received.length, icon: Clock},
        {key: 'sent', label: 'Sent', count: sent.length, icon: Send},
    ]

    if(loading) return <Loading />

  return (
        <div className="space-y-6 dd-fade-up">
            <div className="rounded-2xl border border-[#1b3a5c] bg-[#0c1f38] p-5 text-white shadow-xs dd-fade-up">
                <div className="dd-page-kicker w-fit">
                    <Heart size={18}></Heart>
                    <span>Connections</span>
                </div>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-white">Friends</h1>
                <p className="mt-1 text-sm text-slate-300">Manage connections and send friend requests.</p>
            </div>

            <form onSubmit={sendRequest} className="rounded-2xl border border-[#1b3a5c] bg-[#0c1f38] p-4 text-white flex flex-col gap-3 md:flex-row md:items-center shadow-xs">
                <div className="relative flex-1">
                    <input className="dd-input" type="text" value={username} onChange={(e)=> setUsername(e.target.value)} placeholder="Enter username to add friend..." disabled={sending} />
                </div>

                <button className="dd-primary-button disabled:opacity-50" type="submit" disabled={sending || !username.trim()}>
                    {sending ? 'Sending...' : <><Send size={16} /> Send</>}
                </button>
            </form>

            <div className="rounded-2xl border border-[#1b3a5c] bg-[#0c1f38] p-3 text-white shadow-xs">
                {tabs.map((t)=>{
                    const TabIcon= t.icon;
                    return (
                        <button key={t.key} onClick={()=> setTab(t.key)} className={`mr-2 inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${tab === t.key ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-xs' : 'bg-[#0a1829] text-slate-300 hover:bg-[#132d52] hover:text-white'}`}>
                            <TabIcon size={16} />
                            <span>{t.label}</span>
                            {t.count > 0 && <span className={`rounded-full px-2 py-0.5 text-xs ${tab === t.key ? 'bg-white/20 text-white' : 'bg-[#132d52] text-slate-300'}`}>{t.count}</span>}
                        </button>
                    )
                })}
            </div>

            {tab === 'friends' && (
                <div className="max-h-[calc(100vh-280px)] overflow-y-auto pr-1.5 custom-scrollbar space-y-4">
                    {friends.length === 0 ? (
                        <EmptyState icon={Users} text="No friends yet. Send a request to get started!"/>
                    ) : (
                        friends.map((f)=>{
                            const showGreenBadge = f.privacySettings?.showOnlineStatus !== false;
                            return (
                            <div key={f._id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#1b3a5c] bg-[#0c1f38] p-4 text-white transition-all hover:bg-[#0f2746] hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <img
                                            src={f.profilePicture || `https://ui-avatars.com/api/?name=${f.firstName}+${f.lastName}&background=6366f1&color=fff`}
                                            alt=""
                                            className="w-12 h-12 rounded-xl object-cover shadow-sm ring-2 ring-[#1b3a5c]"
                                        />
                                        {showGreenBadge && (
                                            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                                <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-[#0c1f38] bg-emerald-500"></span>
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-bold text-white">{f.firstName} {f.lastName}</p>
                                        <p className="text-sm font-medium text-slate-400">@{f.username}</p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <button type="button" onClick={() => navigate(`/dashboard/user/${f.username}`)} className="rounded-xl border border-[#1b3a5c] bg-[#0a1829] px-3 py-2 text-sm font-semibold text-slate-200 shadow-sm hover:bg-[#132d52] hover:text-white transition-colors">
                                        View Profile
                                    </button>
                                    <button disabled={isUnfriending} className="rounded-xl border border-rose-500/30 bg-rose-500/15 px-3 py-2 text-sm font-semibold text-rose-300 hover:bg-rose-500/25 transition-colors disabled:opacity-50" onClick={()=> handlePromptUnfriend(f)}>
                                        <UserMinus size={14} className="inline-block" /> {isUnfriending ? 'Unfriending...' : 'Unfriend'}
                                    </button>
                                </div>
                            </div>
                        )})
                    )}
                </div>
            )}

            {tab === 'received' && (
                <div className="max-h-[calc(100vh-280px)] overflow-y-auto pr-1.5 custom-scrollbar space-y-3">
                    {received.length === 0 ? (
                        <EmptyState icon= {Clock} text="No pending requests. When someone sends you a friend request, it will appear here." />
                    ) : (
                        received.map((r)=>(
                            <div key={r._id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#1b3a5c] bg-[#0c1f38] p-4 text-white shadow-xs">
                                <div className="flex items-center gap-3">
                                     <img
                                        src={r.sender?.profilePicture || `https://ui-avatars.com/api/?name=${r.sender?.firstName}+${r.sender?.lastName}&background=6366f1&color=fff`}
                                        alt=""
                                        className="w-11 h-11 rounded-xl object-cover ring-2 ring-[#1b3a5c]"
                                    />
                                    <div>
                                        <p className="font-semibold text-white">{r.sender?.firstName} {r.sender?.lastName}</p>
                                        <p className="text-sm text-slate-400">@{r.sender?.username}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button disabled={isResponding} className="dd-primary-button !px-3 !py-2 disabled:opacity-50" onClick={()=> respondRequest(r._id, 'accepted')}>
                                        {isResponding ? 'Accepting...' : <><Check size={14} /> Accept</>}
                                    </button>
                                    <button disabled={isResponding} className="rounded-xl border border-rose-500/30 bg-rose-500/15 px-3 py-2 text-sm font-semibold text-rose-300 hover:bg-rose-500/25 transition-colors disabled:opacity-50" onClick={()=> handlePromptRejectRequest(r)}>
                                        {isResponding ? 'Rejecting...' : <><X size={14} /> Reject</>}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {tab === 'sent' && (
                <div className="max-h-[calc(100vh-280px)] overflow-y-auto pr-1.5 custom-scrollbar space-y-3">
                    {sent.length === 0 ? (
                        <EmptyState icon={Send} text="No sent requests. When you send a friend request, it will appear here until accepted or rejected." />
                    ) : (
                        sent.map((s)=> (
                            <div key= {s._id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#1b3a5c] bg-[#0c1f38] p-4 text-white shadow-xs">
                                <div className="flex items-center gap-3">
                                    <img
                                        src={s.receiver?.profilePicture || `https://ui-avatars.com/api/?name=${s.receiver?.firstName}+${s.receiver?.lastName}&background=6366f1&color=fff`}
                                        alt=""
                                        className="w-11 h-11 rounded-xl object-cover ring-2 ring-[#1b3a5c]"
                                    />
                                    <div>
                                        <p className="font-semibold text-white">{s.receiver?.firstName} {s.receiver?.lastName}</p>
                                        <p className="text-sm text-slate-400">@{s.receiver?.username}</p>
                                    </div>
                                </div>
                                <button disabled={isCancelling} className="rounded-xl border border-rose-500/30 bg-rose-500/15 px-3 py-2 text-sm font-semibold text-rose-300 hover:bg-rose-500/25 transition-colors disabled:opacity-50" onClick={()=> handlePromptCancelRequest(s)}>
                                    {isCancelling ? 'Cancelling...' : <><X size={14} /> Cancel</>}
                                </button>
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
                confirmLoading={isUnfriending || isCancelling || isResponding}
                details={alert.details}
                onConfirm={alert.onConfirm}
                onCancel={closeAlert}
                onClose={closeAlert}
            />
        </div>
  )
}

export default Friends