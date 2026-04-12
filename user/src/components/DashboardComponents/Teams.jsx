import React from 'react'
import { ChevronRight, Crown, Plus, Shield, Sparkles, Users, X } from 'lucide-react'
import { useContext, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { AppContext } from '../../context/AppContext.jsx'
import Loading from '../LoadingPage'
import { useForm }  from 'react-hook-form'
import api from '../../api/axiosInstance.js'

const Teams = () => {

    const {token, navigate, setToken, user, authHeaders}= useContext(AppContext)
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

    const fetchTeams= async ()=>{
        setLoading(true);
        try{
            const { data } = await api.get('/teams/my-teams', { headers: authHeaders });

            if(!data?.success){
                toast.error(data?.message || 'Failed to fetch teams');
                setTeams([]);
                return;
            }

            setTeams(data?.teams || []);
        }catch(error){
            if(error?.response?.status === 401){
                setToken(null);
                localStorage.removeItem('token');
            }
            toast.error(error?.response?.data?.message || 'Unable to fetch teams');
            setTeams([]);

        } finally {
            setLoading(false);
        }
    }

    useEffect(()=>{
        if(token){
            fetchTeams();
        } else {
            setLoading(false);
        }
    },[token]);

    const createTeam= async (formData)=>{
        setCreating(true);
        try{
            const { data } = await api.post('/teams/create', formData, { headers: authHeaders });

            if(!data?.success){
                toast.error(data?.message || 'Failed to create team');
                return;
            }

            toast.success(data?.message || 'Team created successfully');
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

    const gradientColors = [
        'from-blue-500 to-indigo-600',
        'from-violet-500 to-purple-600',
        'from-emerald-500 to-teal-600',
        'from-rose-500 to-pink-600',
        'from-amber-500 to-orange-600',
        'from-cyan-500 to-blue-600',
    ];

    if(loading) return <Loading />;

    return (
        <div className="min-h-screen bg-[#f0f4f8] px-4 py-6 lg:px-8">

            {/* ── Header ── */}
            <div className="mb-6 flex items-center justify-between [animation:fadeUp_.4s_ease_both]">
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-7 h-7 rounded-lg bg-[#e9f0f8] flex items-center justify-center">
                            <Users size={14} className="text-[#315e8d]" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-[.18em] text-[#315e8d]">
                            Team Management
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Teams</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage your teams and collaborate on projects</p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#315e8d] text-white text-sm font-semibold hover:bg-[#26486d] transition-all duration-200 shadow-sm cursor-pointer"
                >
                    <Plus size={16} /> New Team
                </button>
            </div>

            {/* ── Create Team Modal ── */}
            {showCreate && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                    onClick={() => { setShowCreate(false); reset(); }}
                >
                    <div
                        className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                                    <Sparkles size={18} className="text-blue-600" />
                                </div>
                                <h2 className="text-lg font-bold text-slate-900">Create New Team</h2>
                            </div>
                            <button
                                onClick={() => { setShowCreate(false); reset(); }}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all duration-150 cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(createTeam)} className="space-y-4">
                            {/* Team Name */}
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">Team Name *</label>
                                <input
                                    type="text"
                                    {...register('name', { required: 'Team name is required' })}
                                    placeholder="e.g. DevDash Core"
                                    className="w-full rounded-xl border border-[#dbe5f1] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#315e8d]/25 focus:border-[#315e8d] transition-all duration-150"
                                />
                                {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name.message}</p>}
                            </div>

                            {/* Team Title */}
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">Team Title *</label>
                                <input
                                    type="text"
                                    {...register('title', { required: 'Team title is required' })}
                                    placeholder="e.g. DevDash Developers"
                                    className="w-full rounded-xl border border-[#dbe5f1] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#315e8d]/25 focus:border-[#315e8d] transition-all duration-150"
                                />
                                {errors.title && <p className="text-xs text-red-500 font-medium">{errors.title.message}</p>}
                            </div>

                            {/* Team Description */}
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">Team Description</label>
                                <textarea
                                    {...register('description')}
                                    placeholder="Describe your team's purpose and goals..."
                                    rows={3}
                                    className="w-full rounded-xl border border-[#dbe5f1] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#315e8d]/25 focus:border-[#315e8d] transition-all duration-150 resize-none"
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex justify-end gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => { setShowCreate(false); reset(); }}
                                    className="px-4 py-2 rounded-xl border border-[#dbe5f1] text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all duration-150 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="px-4 py-2 rounded-xl bg-[#315e8d] text-white text-sm font-semibold hover:bg-[#26486d] transition-all duration-150 disabled:opacity-60 cursor-pointer"
                                >
                                    {creating ? 'Creating...' : 'Create Team'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Empty State ── */}
            {teams.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-5 shadow-sm">
                        <Users size={36} className="text-blue-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">No teams yet</h3>
                    <p className="text-gray-500 text-sm max-w-xs">Create your first team to start managing projects and collaborating with your crew.</p>
                </div>
            )}

            {/* ── Team List ── */}
            <div className="space-y-3 [animation:fadeUp_.4s_ease_.1s_both]">
                {teams.map((team, index) => {
                    const role = getUserRole(team);
                    const gradient = gradientColors[index % gradientColors.length];
                    return (
                        <div
                            key={team._id}
                            onClick={() => navigate(`/dashboard/teams/${team._id}`)}
                            className="bg-white border border-[#dbe5f1] rounded-2xl px-5 py-4 flex items-center justify-between gap-4 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-[#c8d9ee] hover:shadow-sm"
                        >
                            {/* Left: Avatar + Info */}
                            <div className="flex items-center gap-4 min-w-0">
                                {/* Team Initial Avatar */}
                                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm`}>
                                    {team.name.charAt(0).toUpperCase()}
                                </div>

                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                        <h3 className="text-sm font-bold text-slate-800 truncate">{team.name}</h3>
                                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg ${roleBadgeColor(role)}`}>
                                            {roleIcon(role)} {role}
                                        </span>
                                    </div>
                                    {team.title && (
                                        <p className="text-xs text-slate-500 truncate">{team.title}</p>
                                    )}
                                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                                        {team.memberCount ?? team.members?.length ?? 0} members
                                    </p>
                                    <p className="text-[11px] text-slate-400 font-medium">
                                        Leader: <span className="font-semibold text-slate-500">@{team.leader?.username}</span>
                                    </p>
                                </div>
                            </div>

                            {/* Right: Member Avatars + Chevron */}
                            <div className="flex items-center gap-3 shrink-0">
                                <div className="flex items-center -space-x-2">
                                    {team.members?.slice(0, 4).map((m, i) => (
                                        <img
                                            key={i}
                                            src={m.user?.profilePicture || `https://ui-avatars.com/api/?name=${m.user?.firstName}+${m.user?.lastName}&background=6366f1&color=fff&size=28`}
                                            alt=""
                                            className="w-7 h-7 rounded-lg object-cover ring-2 ring-white"
                                        />
                                    ))}
                                    {(team.members?.length || 0) > 4 && (
                                        <div className="w-7 h-7 rounded-lg bg-[#e9f0f8] ring-2 ring-white flex items-center justify-center text-[10px] font-bold text-[#315e8d]">
                                            +{team.members.length - 4}
                                        </div>
                                    )}
                                </div>

                                <ChevronRight size={16} className="text-slate-400" />
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default Teams