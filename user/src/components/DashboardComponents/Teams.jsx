import { ChevronRight, Crown, Plus, Shield, Sparkles, Users, X } from 'lucide-react'
import { useCallback, useContext, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import api from '../../api/axiosInstance.js'
import { SOCKET_EVENTS } from '../../api/socketEvents.js'
import { AppContext } from '../../context/AppContext.jsx'
import Loading from '../LoadingPage'

const Teams = () => {

    const {token,navigate, setToken, user, authHeaders, socket}= useContext(AppContext)
    const [teams, setTeams]= useState([]);
    const [loading, setLoading]= useState(true);

    const [showCreate, setShowCreate]= useState(false);
    
    const {register, handleSubmit, formState: {errors}, reset}= useForm({
        defaultValues: {
            name: '',
            title: '',
            description: '',
        }
    })

    const [creating, setCreating]= useState(false);

    const fetchTeams = useCallback(async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const { data } = await api.get('/teams/my-teams', { headers: authHeaders });

            if(!data?.success){
                toast.error(data?.message || 'Failed to fetch teams');
                setTeams([]);
                return;
            }

            setTeams(data?.teams || []);
        } catch (error) {
            if (error?.response?.status === 401) {
                setToken(null);
                localStorage.removeItem('token');
                return; // Silent failure for 401
            }
            toast.error(error?.response?.data?.message || 'Unable to fetch teams');
            setTeams([]);

        } finally {
            if (showLoading) setLoading(false);
        }
    }, [authHeaders, setToken]);

    useEffect(() => {
        if (token) {
            fetchTeams(true);
        } else {
            setLoading(false);
        }
    }, [token, fetchTeams]);

    // Live socket updates for team list
    useEffect(() => {
        if (!socket) return;

        const handleTeamListUpdate = () => {
            fetchTeams(false);
        };

        socket.on(SOCKET_EVENTS.TEAM_MEMBER_JOINED, handleTeamListUpdate);
        socket.on(SOCKET_EVENTS.TEAM_MEMBER_REMOVED, handleTeamListUpdate);
        socket.on(SOCKET_EVENTS.TEAM_REMOVED_FROM_TEAM, handleTeamListUpdate);
        socket.on(SOCKET_EVENTS.TEAM_MEMBER_ROLE_CHANGED, handleTeamListUpdate);
        socket.on(SOCKET_EVENTS.TEAM_LEADERSHIP_TRANSFERRED, handleTeamListUpdate);
        socket.on(SOCKET_EVENTS.TEAM_DELETED, handleTeamListUpdate);

        return () => {
            socket.off(SOCKET_EVENTS.TEAM_MEMBER_JOINED, handleTeamListUpdate);
            socket.off(SOCKET_EVENTS.TEAM_MEMBER_REMOVED, handleTeamListUpdate);
            socket.off(SOCKET_EVENTS.TEAM_REMOVED_FROM_TEAM, handleTeamListUpdate);
            socket.off(SOCKET_EVENTS.TEAM_MEMBER_ROLE_CHANGED, handleTeamListUpdate);
            socket.off(SOCKET_EVENTS.TEAM_LEADERSHIP_TRANSFERRED, handleTeamListUpdate);
            socket.off(SOCKET_EVENTS.TEAM_DELETED, handleTeamListUpdate);
        };
    }, [socket, fetchTeams]);

    const createTeam= async (formData)=>{
        setCreating(true);
        try{
            const { data } = await api.post('/teams/create', formData, { headers: authHeaders });

            if(!data?.success){
                toast.error(data?.message || 'Failed to create team');
                return;
            }

            setShowCreate(false);
            reset();
            await fetchTeams();
        }catch(error){
            toast.error(error?.response?.data?.message || 'Unable to create team');
        }
        setCreating(false);
    }

    const getUserRole= (team)=>{
        if(team.leader?._id === user?._id) return 'Leader';
        const member= team.members?.find(m => m.user?._id === user?._id);
        if(member?.role === 'admin') return 'Admin';
        return 'Member';
    }

    const roleIcon= (role)=>{
        if(role === 'Leader') return <Crown size={16} className='text-yellow-500'/>;
        if(role === 'Admin') return <Shield size={16} className='text-blue-500'/>;
        return <Users size={16} className='text-gray-500'/>;
    }

    const roleBadgeColor = (role) => {
        if (role === 'Leader') return 'text-yellow-700 bg-yellow-50 border border-yellow-200';
        if (role === 'Admin') return 'text-blue-700 bg-blue-50 border border-blue-200';
        return 'text-gray-600 bg-gray-50 border border-gray-200';
    };

    const cardThemes = [
        { gradient: 'from-blue-500 to-indigo-600', borderHover: 'hover:border-blue-300', accent: 'border-l-blue-500' },
        { gradient: 'from-violet-500 to-purple-600', borderHover: 'hover:border-violet-300', accent: 'border-l-violet-500' },
        { gradient: 'from-teal-500 to-emerald-600', borderHover: 'hover:border-teal-300', accent: 'border-l-teal-500' },
        { gradient: 'from-rose-500 to-pink-600', borderHover: 'hover:border-rose-300', accent: 'border-l-rose-500' },
        { gradient: 'from-amber-500 to-orange-600', borderHover: 'hover:border-amber-300', accent: 'border-l-amber-500' },
        { gradient: 'from-cyan-500 to-blue-600', borderHover: 'hover:border-cyan-300', accent: 'border-l-cyan-500' },
    ];

    if(loading) return <Loading inline />;
  return (
    <div className="space-y-6">
            <div className="dd-section-card dd-fade-up">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                <div className="dd-page-kicker w-fit">
                    <Users size={18} />
                    <span>Team Management</span>
                </div>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">My Teams</h1>
                <p className="mt-1 text-sm text-slate-600">Manage your teams and collaborate on projects.</p>
            </div>
            <button className="dd-primary-button w-fit" onClick={()=> setShowCreate(true)}><Plus size ={16} /> New Team</button>
            </div>
        </div>

        {/* Create Team Modal */}
        {showCreate && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/35 px-4 dd-fade-in">
                    <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_30px_80px_rgba(15,23,42,0.2)] dd-fade-up">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                            <Sparkles size={18} className="text-blue-600" />
                        </div>
                        <h2 className="flex-1 text-lg font-bold text-slate-900">Create New Team</h2>
                        <button className="rounded-xl border border-slate-200 p-2 text-slate-600" onClick={()=> {setShowCreate(false); reset();}}><X size={16}/></button>
                    </div>

                   <form onSubmit={handleSubmit(createTeam)} className="space-y-4">
                    {/* Team Name */}
                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-slate-700">Team Name *</label>
                        <input className="dd-input" type="text" {...register('name', { required: true })} placeholder="e.g. DevDash Core"/>
                        {errors.name && <p className="text-xs text-rose-600">{errors.name.message}</p>}
                    </div>

                    {/* Team Title */}
                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-slate-700">Team Title *</label>
                        <input className="dd-input" type="text" {...register('title', { required: true })} placeholder="e.g. DevDash Developers"/>
                        {errors.title && <p className="text-xs text-rose-600">{errors.title.message}</p>}
                    </div>

                    {/* Team Description */}
                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-slate-700">Team Description</label>
                        <textarea className="dd-input min-h-[90px]" {...register('description')} placeholder="Describe your team's purpose and goals..."/>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button className="dd-ghost-button" type="button" onClick={()=>{setShowCreate(false); reset();}}>Cancel</button>
                        <button className="dd-primary-button" type="submit" disabled={creating}>
                            {creating ? 'Creating...' : 'Create Team'}
                        </button>
                    </div>
                   </form>
                </div>
            </div>
        )}

        {/* Team List */}
        {teams.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-5 shadow-sm">
                        <Users size={36} className="text-blue-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">No teams yet</h3>
                    <p className="text-gray-500 text-sm max-w-xs">Create your first team to start managing projects and collaborating with your crew.</p>
                </div>
        )}

        <div className="grid gap-3.5 md:grid-cols-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1.5 custom-scrollbar">
            {teams.map((team, idx) => {
                const role = getUserRole(team);
                const theme = cardThemes[idx % cardThemes.length];
                return (
                    <div 
                        key={team._id} 
                        onClick={() => navigate(`/dashboard/teams/${team._id}`)} 
                        className={`dd-section-card group cursor-pointer border border-slate-200/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${theme.borderHover} border-l-4 ${theme.accent}`}
                    >
                        <div className="flex items-start justify-between gap-3.5">
                            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${theme.gradient} text-lg font-black text-white shadow-sm shadow-slate-200`}>
                                {team.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="truncate text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{team.name}</h3>
                                    <span className={`dd-badge ${roleBadgeColor(role)}`}>{roleIcon(role)} {role}</span>
                                </div>
                                {team.title && <p className="mt-0.5 truncate text-xs text-slate-500">{team.title}</p>}
                                <p className="mt-1 text-xs font-medium text-slate-400">{team.memberCount ?? team.members?.length ?? 0} members</p>
                            </div>

                            <div className="text-right shrink-0">
                                <span className="rounded-md bg-slate-100/80 px-2 py-1 text-[11px] font-medium text-slate-500">
                                    @{team.leader?.username || 'leader'}
                                </span>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                            <div className="flex -space-x-2">
                                {team.members?.slice(0, 4).map((m, i) => (
                                    <img key={i} className="h-7 w-7 rounded-full border-2 border-white object-cover shadow-xs" src={m.user?.profilePicture || `https://ui-avatars.com/api/?name=${m.user?.firstName}+${m.user?.lastName}&background=6366f1&color=fff&size=28`} alt="" />
                                ))}

                                {(team.members?.length || 0) > 4 && (
                                    <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[10px] font-bold text-slate-600">+{team.members.length - 4}</div>
                                )}
                            </div>

                            <div className="flex items-center gap-1 text-xs font-semibold text-slate-400 group-hover:text-indigo-600 transition-colors">
                                <span>Open Workspace</span>
                                <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    </div>
  )
}

export default Teams