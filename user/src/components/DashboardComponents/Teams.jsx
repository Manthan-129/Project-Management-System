import React from 'react'
import { ChevronRight, Crown, Plus, Shield, Sparkles, Users, X } from 'lucide-react'
import { useContext, useEffect, useState } from 'react'
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
    <div>
        <div>
            <div>
                <div>
                    <Users size={18} />
                    <span>Team Management</span>
                </div>
                <h1>My Teams</h1>
                <p>Manage your teams and collaborate on projects</p>
            </div>
            <button onClick={()=> setShowCreate(true)}><Plus size ={16} /> New Team</button>
        </div>

        {/* Create Team Modal */}
        {showCreate && (
            <div>
                <div>
                    <div>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                            <Sparkles size={18} className="text-blue-600" />
                        </div>
                        <h2>Create New Team</h2>
                        <button onClick={()=> {setShowCreate(false); reset();}}><X size={16}/></button>
                    </div>

                   <form onSubmit={handleSubmit(createTeam)}>
                    {/* Team Name */}
                    <div>
                        <label>Team Name *</label>
                        <input type="text" {...register('name', { required: true })} placeholder="e.g. DevDash Core"/>
                        {errors.name && <p>{errors.name.message}</p>}
                    </div>

                    {/* Team Title */}
                    <div>
                        <label>Team Title *</label>
                        <input type="text" {...register('title', { required: true })} placeholder="e.g. DevDash Developers"/>
                        {errors.title && <p>{errors.title.message}</p>}
                    </div>

                    {/* Team Description */}
                    <div>
                        <label>Team Description</label>
                        <textarea {...register('description')} placeholder="Describe your team's purpose and goals..."/>
                    </div>

                    <div>
                        <button type="button" onClick={()=>{setShowCreate(false); reset();}}>Cancel</button>
                        <button type="submit" disabled={creating}>
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

        <div>
            {teams.map(team=>{
                const role= getUserRole(team);
                return (
                    <div key={team._id} onClick={()=> navigate(`/dashboard/teams/${team._id}`)}>
                        <div>
                            <div>
                                {team.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div>
                                    <h3>{team.name}</h3>
                                    <span>{roleIcon(role)} {role}</span>
                                </div>
                                {team.title && <p>{team.title}</p>}
                                <p>{team.memberCount ?? team.members?.length ?? 0} members</p>
                            </div>

                            <div>
                                <p>Team Leader Username: {team.leader?.username}</p>
                            </div>
                        </div>

                        <div>
                            <div>
                                {team.members?.slice(0,4).map((m, i)=>(
                                    <img key={i} src={m.user?.profilePicture || `https://ui-avatars.com/api/?name=${m.user?.firstName}+${m.user?.lastName}&background=6366f1&color=fff&size=28`} alt="" />
                                ))}

                                {(team.members?.length || 0) > 4 && (
                                    <div>+{team.members.length - 4}</div>
                                )}
                            </div>

                            <ChevronRight size={16} />
                        </div>
                    </div>
                )
            })}
        </div>
    </div>
  )
}

export default Teams