import { Check, Clock, Heart, Search, Send, UserMinus, Users, X } from 'lucide-react'
import { useContext, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { AppContext } from '../../context/AppContext.jsx'
import Loading from '../LoadingPage.jsx'
import api from '../../api/axiosInstance.js'

const EmptyState = ({ icon: Icon, text }) => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-slate-100 flex items-center justify-center mb-4 shadow-sm">
            <Icon size={28} className="text-gray-300" />
        </div>
        <p className="text-sm text-gray-500 max-w-xs">{text}</p>
    </div>
);

const Friends = () => {

    const { token, setToken, authHeaders } = useContext(AppContext);

    const [friends, setFriends] = useState([]);
    const [received, setReceived] = useState([]);
    const [sent, setSent] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [tab, setTab] = useState("friends");
    const [username, setUsername] = useState('');

    const fetchFriends = async () => {
        try {
            const { data } = await api.get('/invites/friends', { headers: authHeaders });
            if (!data?.success) { toast.error(data?.message || 'Failed to fetch friends'); setFriends([]); return; }
            setFriends(data?.friends || []);
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Unable to fetch friends');
            setFriends([]);
        }
    }

    const fetchRequests = async () => {
        try {
            const [receivedRes, sentRes] = await Promise.all([
                api.get('/invites/invitations/received', { headers: authHeaders }),
                api.get('/invites/invitations/sent', { headers: authHeaders }),
            ]);
            if (!receivedRes?.data?.success) { toast.error(receivedRes?.data?.message || 'Failed to fetch received requests'); setReceived([]); }
            else setReceived(receivedRes?.data?.invitations || []);
            if (!sentRes?.data?.success) { toast.error(sentRes?.data?.message || 'Failed to fetch sent requests'); setSent([]); }
            else setSent(sentRes?.data?.invitations || []);
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Unable to fetch requests');
            setReceived([]); setSent([]);
        }
    }

    useEffect(() => {
        const loadData = async () => {
            if (!token) { setLoading(false); return; }
            setLoading(true);
            try { await Promise.all([fetchFriends(), fetchRequests()]); }
            catch (_error) { }
            finally { setLoading(false); }
        };
        loadData();
    }, [token]);

    const sendRequest = async (e) => {
        e.preventDefault();
        if (!username.trim()) return;
        setSending(true);
        try {
            const { data } = await api.post('/invites/invitations/send-request', { username: username.trim() }, { headers: authHeaders });
            if (!data?.success) { toast.error(data?.message || 'Failed to send request'); return; }
            toast.success(data?.message || 'Friend request sent');
            setUsername('');
            const sentRes = await api.get('/invites/invitations/sent', { headers: authHeaders });
            if (sentRes?.data?.success) setSent(sentRes?.data?.invitations || []);
        } catch (error) {
            if (error?.response?.status === 401) { setToken(null); localStorage.removeItem('token'); }
            toast.error(error?.response?.data?.message || 'Unable to send request');
        }
        setSending(false);
    }

    const respondRequest = async (inviteId, status) => {
        try {
            const { data } = await api.post(`/invites/invitations/respond-request/${inviteId}`, { status }, { headers: authHeaders });
            if (!data?.success) { toast.error(data?.message || 'Failed to respond to request'); return; }
            toast.success(data?.message || `Request ${status}`);
            setReceived((prev) => prev.filter((r) => r._id !== inviteId));
            if (status === 'accepted') await fetchFriends();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Unable to respond to request');
        }
    }

    const cancelRequest = async (inviteId) => {
        try {
            const { data } = await api.delete(`/invites/invitations/cancel-request/${inviteId}`, { headers: authHeaders });
            if (!data?.success) { toast.error(data?.message || 'Failed to cancel request'); return; }
            toast.success(data?.message || 'Request cancelled');
            setSent((prev) => prev.filter((s) => s._id !== inviteId));
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Unable to cancel request');
        }
    }

    const unfriend = async (friendId) => {
        try {
            const { data } = await api.post(`/invites/unfriend/${friendId}`, {}, { headers: authHeaders });
            if (!data?.success) { toast.error(data?.message || 'Failed to unfriend user'); return; }
            toast.success(data?.message || 'Unfriended successfully');
            setFriends((prev) => prev.filter((f) => f._id !== friendId));
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Unable to unfriend user');
        }
    }

    const tabs = [
        { key: 'friends',  label: 'Friends',  count: friends.length,  icon: Heart },
        { key: 'received', label: 'Received', count: received.length, icon: Clock },
        { key: 'sent',     label: 'Sent',     count: sent.length,     icon: Send  },
    ];

    if (loading) return <Loading />;

    return (
        <div className="min-h-screen bg-[#f0f4f8] px-4 py-6 lg:px-8">

            {/* ── Page Header ── */}
            <div className="mb-6 [animation:fadeUp_.4s_ease_both]">
                <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 rounded-lg bg-[#e9f0f8] flex items-center justify-center">
                        <Heart size={14} className="text-[#315e8d]" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[.18em] text-[#315e8d]">
                        Connections
                    </span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Friends</h1>
                <p className="text-sm text-slate-500 mt-1">Manage connections and send friend requests</p>
            </div>

            {/* ── Add Friend Form ── */}
            <form
                onSubmit={sendRequest}
                className="flex items-center gap-2.5 mb-5 [animation:fadeUp_.4s_ease_.05s_both]"
            >
                <div className="flex-1 flex items-center gap-2.5 bg-white border border-[#dbe5f1] rounded-2xl px-4 py-2.5 transition-all duration-200 focus-within:border-[#315e8d] focus-within:ring-2 focus-within:ring-[#315e8d]/15">
                    <Search size={15} className="text-slate-400 shrink-0" />
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter username to add friend..."
                        className="flex-1 text-sm text-slate-800 placeholder:text-slate-400 bg-transparent outline-none"
                    />
                </div>

                <button
                    type="submit"
                    disabled={sending || !username.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#315e8d] hover:bg-[#26486d] disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl transition-all duration-200 hover:scale-105 active:scale-95 shrink-0"
                >
                    <Send size={14} />
                    {sending ? 'Sending...' : 'Send'}
                </button>
            </form>

            {/* ── Tabs ── */}
            <div className="flex items-center gap-2 mb-5 [animation:fadeUp_.4s_ease_.1s_both]">
                {tabs.map((t) => {
                    const TabIcon = t.icon;
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
                            <TabIcon size={14} />
                            <span>{t.label}</span>
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

            {/* ── Friends List ── */}
            {tab === 'friends' && (
                <div className="space-y-2.5 [animation:fadeUp_.35s_ease_both]">
                    {friends.length === 0 ? (
                        <EmptyState icon={Users} text="No friends yet. Send a request to get started!" />
                    ) : (
                        friends.map((f) => (
                            <div
                                key={f._id}
                                className="flex items-center justify-between gap-3 bg-white border border-[#dbe5f1] rounded-2xl px-4 py-3 transition-all duration-200 hover:border-[#c8d9ee] hover:-translate-y-0.5"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <img
                                        src={f.profilePicture || `https://ui-avatars.com/api/?name=${f.firstName}+${f.lastName}&background=6366f1&color=fff`}
                                        alt=""
                                        className="w-11 h-11 rounded-xl object-cover ring-2 ring-gray-100 shrink-0"
                                    />
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 truncate">
                                            {f.firstName} {f.lastName}
                                        </p>
                                        <p className="text-xs text-slate-400 truncate">@{f.username}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => unfriend(f._id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shrink-0"
                                >
                                    <UserMinus size={13} />
                                    Unfriend
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* ── Received Requests ── */}
            {tab === 'received' && (
                <div className="space-y-2.5 [animation:fadeUp_.35s_ease_both]">
                    {received.length === 0 ? (
                        <EmptyState icon={Clock} text="No pending requests. When someone sends you a friend request, it will appear here." />
                    ) : (
                        received.map((r) => (
                            <div
                                key={r._id}
                                className="flex items-center justify-between gap-3 bg-white border border-[#dbe5f1] rounded-2xl px-4 py-3 transition-all duration-200 hover:border-[#c8d9ee] hover:-translate-y-0.5"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <img
                                        src={r.sender?.profilePicture || `https://ui-avatars.com/api/?name=${r.sender?.firstName}+${r.sender?.lastName}&background=6366f1&color=fff`}
                                        alt=""
                                        className="w-11 h-11 rounded-xl object-cover ring-2 ring-gray-100 shrink-0"
                                    />
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 truncate">
                                            {r.sender?.firstName} {r.sender?.lastName}
                                        </p>
                                        <p className="text-xs text-slate-400 truncate">@{r.sender?.username}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={() => respondRequest(r._id, 'accepted')}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
                                    >
                                        <Check size={13} /> Accept
                                    </button>
                                    <button
                                        onClick={() => respondRequest(r._id, 'rejected')}
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

            {/* ── Sent Requests ── */}
            {tab === 'sent' && (
                <div className="space-y-2.5 [animation:fadeUp_.35s_ease_both]">
                    {sent.length === 0 ? (
                        <EmptyState icon={Send} text="No sent requests. When you send a friend request, it will appear here until accepted or rejected." />
                    ) : (
                        sent.map((s) => (
                            <div
                                key={s._id}
                                className="flex items-center justify-between gap-3 bg-white border border-[#dbe5f1] rounded-2xl px-4 py-3 transition-all duration-200 hover:border-[#c8d9ee] hover:-translate-y-0.5"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <img
                                        src={s.receiver?.profilePicture || `https://ui-avatars.com/api/?name=${s.receiver?.firstName}+${s.receiver?.lastName}&background=6366f1&color=fff`}
                                        alt=""
                                        className="w-11 h-11 rounded-xl object-cover ring-2 ring-gray-100 shrink-0"
                                    />
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 truncate">
                                            {s.receiver?.firstName} {s.receiver?.lastName}
                                        </p>
                                        <p className="text-xs text-slate-400 truncate">@{s.receiver?.username}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => cancelRequest(s._id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shrink-0"
                                >
                                    <X size={13} /> Cancel
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}

        </div>
    );
}

export default Friends