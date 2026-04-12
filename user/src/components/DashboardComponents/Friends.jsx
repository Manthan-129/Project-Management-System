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

    const {token, setToken, authHeaders}= useContext(AppContext);

    const [friends, setFriends]= useState([]);
    const [received, setReceived]= useState([]);
    const [sent, setSent]= useState([]);
    const [loading, setLoading]= useState(true);
    const [sending , setSending]= useState(false);
    const [tab, setTab]= useState("friends");
    const [username, setUsername]= useState('');

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
    <div>
        <div>
            <div>
                <Heart size={18}></Heart>
                <span>Connections</span>
            </div>
            <h1>Friends</h1>
            <p>Manage connections and send friend requests</p>
        </div>

        {/* Add Friends */}
        <form onSubmit={sendRequest}>
            <div>
                <Search size={16} />
                <input type="text" value={username} onChange={(e)=> setUsername(e.target.value)} placeholder="Enter username to add friend..." />
            </div>

            <button type="submit" disabled={sending || !username.trim()}><Send size={16} /> Send</button>
        </form>

        {/* Tabs */}
        <div>
            {tabs.map((t)=>{
                const TabIcon= t.icon;
                return (
                    <button key={t.key} onClick={()=> setTab(t.key)}>
                        <TabIcon size={16} />
                        <span>{t.label}</span>
                        {t.count > 0 && <span>{t.count}</span>}
                    </button>
                )
            })}
        </div>

        {/* Friends List */}
        {tab === 'friends' && (
            <div>
                {friends.length === 0 ? (
                    <EmptyState icon={Users} text="No friends yet. Send a request to get started!"/>
                ) : 
                (
                    friends.map((f)=>(
                        <div key={f._id}>
                            <div>
                                <img
                                    src={f.profilePicture || `https://ui-avatars.com/api/?name=${f.firstName}+${f.lastName}&background=6366f1&color=fff`}
                                    alt=""
                                    className="w-11 h-11 rounded-xl object-cover ring-2 ring-gray-100"
                                />

                                <div>
                                    <p>{f.firstName} {f.lastName}</p>
                                    <p>@{f.username}</p>
                                </div>
                            </div>

                            <button onClick={()=> unfriend(f._id)}><UserMinus size={14} />Unfriend</button>
                        </div>
                    ))
                )}
            </div>
        )}

        {/* Received Requests */}
        {tab === 'received' && (
            <div>
                {received.length === 0 ? (
                    <EmptyState icon= {Clock} text="No pending requests. When someone sends you a friend request, it will appear here." />
                )
            : 
            (
                received.map((r)=>(
                    <div key={r._id}>
                        <div>
                             <img
                                src={r.sender?.profilePicture || `https://ui-avatars.com/api/?name=${r.sender?.firstName}+${r.sender?.lastName}&background=6366f1&color=fff`}
                                alt=""
                                className="w-11 h-11 rounded-xl object-cover ring-2 ring-gray-100"
                            />
                            <div>
                                <p>{r.sender?.firstName} {r.sender?.lastName}</p>
                                <p>@{r.sender?.username}</p>
                            </div>
                        </div>

                        <div>
                            <button onClick={()=> respondRequest(r._id, 'accepted')}><Check size={14} /> Accept</button>
                            <button onClick={()=> respondRequest(r._id, 'rejected')}><X size={14} /> Reject</button>
                        </div>
                    </div>
                ))
            )}
            </div>
        )}

        {/* Sent Requests */}
        {tab === 'sent' && (
            <div>
                {sent.length === 0 ? (
                    <EmptyState icon={Send} text="No sent requests. When you send a friend request, it will appear here until accepted or rejected." />
                )
            :
            (
                sent.map((s)=> (
                    <div key= {s._id}>
                        <div>
                            <img
                                src={s.receiver?.profilePicture || `https://ui-avatars.com/api/?name=${s.receiver?.firstName}+${s.receiver?.lastName}&background=6366f1&color=fff`}
                                alt=""
                                className="w-11 h-11 rounded-xl object-cover ring-2 ring-gray-100"
                            />
                            <div>
                                <p>{s.receiver?.firstName} {s.receiver?.lastName}</p>
                                <p>@{s.receiver?.username}</p>
                            </div>
                        </div>
                        <button onClick={()=> cancelRequest(s._id)}><X size={14} />Cancel</button>
                    </div>
                ))
            )}
            </div>
        )}
    </div>
  )
}

export default Friends