import React from 'react'
import { ChevronRight, Crown, Plus, Shield, Sparkles, Users, X } from 'lucide-react'
import { useContext, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { AppContext } from '../../context/AppContext.jsx'
import Loading from '../LoadingPage'
import { useForm }  from 'react-hook-form'
import api from '../../api/axiosInstance.js'

const Teams = () => {

    const {token,navigate, setToken, user, authHeaders}= useContext(AppContext)
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

    const gradientColors = [
        'from-blue-500 to-indigo-600',
        'from-violet-500 to-purple-600',
        'from-emerald-500 to-teal-600',
        'from-rose-500 to-pink-600',
        'from-amber-500 to-orange-600',
        'from-cyan-500 to-blue-600',
    ];

    const summary = useMemo(() => {
        const totalMembers = teams.reduce((count, team) => count + (team.memberCount ?? team.members?.length ?? 0), 0);
        const leaderCount = teams.filter((team) => team.leader?._id === user?._id).length;

        return {
            totalTeams: teams.length,
            totalMembers,
            leaderCount,
        };
    }, [teams, user?._id]);

    if(loading) return <Loading />;
  return (
    <div className="relative min-h-screen px-4 py-8 lg:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(circle_at_top,rgba(49,94,141,0.14),transparent_62%)]" />

        <div className="mx-auto flex max-w-7xl flex-col gap-6">
            <div className="dd-surface overflow-hidden dd-fade-up">
                <div className="flex flex-col gap-5 border-b border-slate-200/70 px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-2 text-left">
                        <div className="dd-badge border-blue-100 bg-blue-50 text-blue-700">
                            <Users size={14} /> Team Management
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900">My Teams</h1>
                        <p className="max-w-2xl text-sm text-slate-500">Manage your teams, track who belongs where, and jump into a workspace with one click.</p>
                    </div>

                    <button onClick={()=> setShowCreate(true)} className="dd-btn-primary self-start lg:self-auto">
                        <Plus size={16} /> New Team
                    </button>
                </div>

                <div className="grid gap-4 px-6 py-6 md:grid-cols-3">
                    <div className="dd-card-soft p-4 text-left">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Teams</p>
                        <p className="mt-2 text-2xl font-black text-slate-900">{summary.totalTeams}</p>
                    </div>
                    <div className="dd-card-soft p-4 text-left">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Members</p>
                        <p className="mt-2 text-2xl font-black text-slate-900">{summary.totalMembers}</p>
                    </div>
                    <div className="dd-card-soft p-4 text-left">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Leader Roles</p>
                        <p className="mt-2 text-2xl font-black text-slate-900">{summary.leaderCount}</p>
                    </div>
                </div>
            </div>

        {/* Create Team Modal */}
        {showCreate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-md dd-fade-in">
                <div className="dd-surface w-full max-w-xl overflow-hidden dd-fade-up">
                    <div className="flex items-start justify-between border-b border-slate-200/70 px-6 py-5">
                        <div className="flex items-center gap-3 text-left">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600">
                                <Sparkles size={18} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Create New Team</h2>
                                <p className="text-xs text-slate-500">Start a new collaboration space.</p>
                            </div>
                        </div>
                        <button onClick={()=> {setShowCreate(false); reset();}} className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                            <X size={16}/>
                        </button>
                    </div>

                   <form onSubmit={handleSubmit(createTeam)} className="space-y-5 px-6 py-6 text-left">
                    {/* Team Name */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Team Name *</label>
                        <input type="text" {...register('name', { required: true })} placeholder="e.g. DevDash Core" className="dd-input"/>
                        {errors.name && <p className="text-xs font-medium text-rose-500">This field is required</p>}
                    </div>

                    {/* Team Title */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Team Title *</label>
                        <input type="text" {...register('title', { required: true })} placeholder="e.g. DevDash Developers" className="dd-input"/>
                        {errors.title && <p className="text-xs font-medium text-rose-500">This field is required</p>}
                    </div>

                    {/* Team Description */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Team Description</label>
                        <textarea {...register('description')} placeholder="Describe your team's purpose and goals..." className="dd-input min-h-32 resize-none"/>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={()=>{setShowCreate(false); reset();}} className="dd-btn-secondary flex-1">
                            Cancel
                        </button>
                        <button type="submit" disabled={creating} className="dd-btn-primary flex-1">
                            {creating ? 'Creating...' : 'Create Team'}
                        </button>
                    </div>
                   </form>
                </div>
            </div>
        )}

        {/* Team List */}
        {teams.length === 0 && (
            <div className="dd-card flex flex-col items-center justify-center py-20 text-center dd-fade-up">
                    <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-100 to-indigo-100 shadow-sm">
                        <Users size={36} className="text-blue-500" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900">No teams yet</h3>
                    <p className="mt-2 max-w-md text-sm text-slate-500">Create your first team to start managing projects and collaborating with your crew.</p>
                </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
            {teams.map(team=>{
                const role= getUserRole(team);
                const accent = gradientColors[teams.indexOf(team) % gradientColors.length];
                return (
                    <button key={team._id} onClick={()=> navigate(`/dashboard/teams/${team._id}`)} className="group dd-card overflow-hidden text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
                        <div className={`h-2 bg-gradient-to-r ${accent}`} />
                        <div className="flex items-start justify-between gap-4 px-5 py-5">
                            <div className="flex gap-4">
                                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-lg font-black text-white shadow-lg shadow-blue-950/15`}>
                                    {team.name?.charAt(0).toUpperCase() || 'T'}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="text-lg font-bold text-slate-900">{team.name}</h3>
                                        <span className={`dd-badge ${role === 'Leader' ? 'border-yellow-100 bg-yellow-50 text-yellow-700' : role === 'Admin' ? 'border-blue-100 bg-blue-50 text-blue-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                                            {roleIcon(role)} {role}
                                        </span>
                                    </div>
                                    {team.title && <p className="text-sm text-slate-500">{team.title}</p>}
                                    <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-400">{team.memberCount ?? team.members?.length ?? 0} members</p>
                                </div>
                            </div>

                            <ChevronRight size={16} className="mt-1 text-slate-400 transition-transform group-hover:translate-x-1" />
                        </div>

                        <div className="flex items-center justify-between gap-4 border-t border-slate-200/70 px-5 py-4 text-sm text-slate-500">
                            <p className="truncate">Team Leader Username: <span className="font-semibold text-slate-700">{team.leader?.username || 'Unassigned'}</span></p>
                            <div className="flex -space-x-2">
                                {team.members?.slice(0,4).map((m, i)=>(
                                    <img key={i} src={m.user?.profilePicture || `https://ui-avatars.com/api/?name=${m.user?.firstName}+${m.user?.lastName}&background=6366f1&color=fff&size=28`} alt="" className="h-8 w-8 rounded-full border-2 border-white object-cover" />
                                ))}

                                {(team.members?.length || 0) > 4 && (
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-[11px] font-bold text-slate-700">+{team.members.length - 4}</div>
                                )}
                            </div>
                        </div>
                    </button>
                )
            })}
        </div>
        </div>
    </div>
  )
}

export default Teams