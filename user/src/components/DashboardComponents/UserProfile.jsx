import { ArrowLeft, ExternalLink, Github, Heart, Link as LinkIcon, Linkedin, Mail, Target, Users } from 'lucide-react';
import { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api/axiosInstance.js';
import { AppContext } from '../../context/AppContext.jsx';
import Loading from '../LoadingPage.jsx';

const UserProfile = () => {
    const { username } = useParams();
    const { token, authHeaders } = useContext(AppContext);
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            if (!username) return;
            try {
                setLoading(true);
                setError('');
                const { data } = await api.get(`/settings/profile/${username}`, {
                    headers: authHeaders,
                });
                if (data?.success) {
                    setProfile(data.profile);
                } else {
                    setError('Failed to load profile');
                }
            } catch (err) {
                if (err?.response?.status === 403) {
                    setError('PrivateProfile');
                } else {
                    setError(err?.response?.data?.message || 'Unable to fetch profile');
                }
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchProfile();
        }
    }, [token, username, authHeaders]);

    if (loading) return <Loading />;

    if (error === 'PrivateProfile') {
        return (
            <div className="flex min-h-[50vh] flex-col items-center justify-center p-8 text-center dd-fade-up">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 shadow-inner">
                    <Target size={32} className="text-slate-400" />
                </div>
                <h2 className="text-2xl font-black text-slate-800">Private Profile</h2>
                <p className="mt-2 max-w-md text-slate-500">This user has chosen to keep their profile private. Only authorized users or mutual friends might be permitted to view these details depending on their constraints.</p>
                <button onClick={() => navigate(-1)} className="mt-6 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-slate-800 transition-colors">
                    Go Back
                </button>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="flex min-h-[50vh] flex-col items-center justify-center p-8 text-center text-rose-500">
                <p>{error || 'User not found'}</p>
                <button onClick={() => navigate(-1)} className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium hover:bg-rose-100 transition-colors">
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl space-y-6 dd-fade-up pb-10">
            {/* Header / Banner area */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                {/* Banner Gradient */}
                <div className="h-32 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 sm:h-48"></div>
                
                {/* Back button overlay */}
                <button 
                    onClick={() => navigate(-1)} 
                    className="absolute left-4 top-4 flex items-center justify-center rounded-xl bg-white/20 p-2 text-white backdrop-blur-md hover:bg-white/30 transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>

                <div className="relative px-6 pb-6 sm:px-10">
                    <div className="-mt-12 flex flex-col sm:-mt-16 sm:flex-row sm:items-end sm:gap-6">
                        <div className="relative">
                            <img
                                src={profile.profilePicture || `https://ui-avatars.com/api/?name=${profile.firstName}+${profile.lastName}&background=6366f1&color=fff&size=200`}
                                alt={`${profile.firstName}'s avatar`}
                                className="h-24 w-24 rounded-2xl border-4 border-white bg-white object-cover shadow-lg sm:h-32 sm:w-32"
                            />
                            {profile.privacySettings?.profileVisibility === 'public' && (
                                <span className="absolute bottom-1 right-1 flex h-5 w-5">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex h-5 w-5 rounded-full border-2 border-white bg-emerald-500"></span>
                                </span>
                            )}
                        </div>
                        <div className="mt-4 flex-1 pb-1 sm:mt-0">
                            <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">{profile.firstName} {profile.lastName}</h1>
                            <p className="text-sm font-semibold text-indigo-600 sm:text-base">@{profile.username}</p>
                        </div>
                        <div className="mt-4 flex gap-3 sm:mt-0 sm:pb-2">
                            {profile.isFriend ? (
                                <div className="inline-flex cursor-default items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-600 shadow-sm">
                                    <Heart size={16} className="fill-emerald-600" /> Friends
                                </div>
                            ) : (
                                <button className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors hover:-translate-y-0.5"
                                  onClick={() => toast.info('To add friend, view them in Team context or search by username in Friends module.')}
                                >
                                    <Users size={16} /> Add Friend
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Profile Grid content */}
            <div className="grid gap-6 md:grid-cols-3">
                {/* Left Column */}
                <div className="space-y-6 md:col-span-1">
                    {/* Bio Section */}
                    <div className="rounded-3xl border border-slate-200 bg-white/60 p-6 shadow-sm backdrop-blur-sm">
                        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-400">About Me</h3>
                        <p className="text-[15px] leading-relaxed text-slate-700">
                            {profile.bio || "This user hasn't added a bio yet."}
                        </p>
                    </div>

                    {/* Stats Section */}
                    <div className="rounded-3xl border border-slate-200 bg-white/60 shadow-sm backdrop-blur-sm overflow-hidden">
                        <div className="flex border-b border-slate-100 p-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
                                <Heart size={18} />
                            </div>
                            <div className="ml-3 flex flex-col justify-center">
                                <p className="text-xl font-black text-slate-800">{profile.friendCount}</p>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Friends</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column / Links and Contact */}
                <div className="space-y-6 md:col-span-2">
                    <div className="rounded-3xl border border-slate-200 bg-white/60 p-6 shadow-sm backdrop-blur-sm">
                        <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">Links & Contact</h3>
                        <div className="space-y-3">
                            {/* Email - Handled by privacy setting on backend */}
                            {profile.email ? (
                                <div className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-3.5 transition-all hover:border-slate-200 hover:bg-white hover:shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-xl bg-orange-100 p-2 text-orange-600"><Mail size={16} /></div>
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500">Email Address</p>
                                            <a href={`mailto:${profile.email}`} className="text-sm font-medium text-slate-900 group-hover:text-indigo-600">{profile.email}</a>
                                        </div>
                                    </div>
                                    <ExternalLink size={14} className="text-slate-300 opacity-0 transition-opacity group-hover:opacity-100" />
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 rounded-2xl border border-slate-100/50 bg-slate-50/50 p-3.5">
                                    <div className="rounded-xl bg-slate-200 p-2 text-slate-500"><Mail size={16} /></div>
                                    <p className="text-sm font-medium italic text-slate-500">Email hidden by user privacy settings</p>
                                </div>
                            )}

                            {/* Github */}
                            {profile.githubUrl && (
                                <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-3.5 transition-all hover:border-slate-200 hover:bg-white hover:shadow-sm hover:-translate-y-0.5">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-xl bg-slate-900 p-2 text-white"><Github size={16} /></div>
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500">GitHub Profile</p>
                                            <p className="text-sm font-medium text-slate-900 group-hover:text-indigo-600">{new URL(profile.githubUrl).pathname.slice(1)}</p>
                                        </div>
                                    </div>
                                    <ExternalLink size={14} className="text-slate-400 transition-colors group-hover:text-indigo-600" />
                                </a>
                            )}

                            {/* LinkedIn */}
                            {profile.linkedinUrl && (
                                <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-3.5 transition-all hover:border-slate-200 hover:bg-white hover:shadow-sm hover:-translate-y-0.5">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-xl bg-blue-100 p-2 text-blue-600"><Linkedin size={16} /></div>
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500">LinkedIn</p>
                                            <p className="text-sm font-medium text-slate-900 group-hover:text-indigo-600">Connect on LinkedIn</p>
                                        </div>
                                    </div>
                                    <ExternalLink size={14} className="text-slate-400 transition-colors group-hover:text-indigo-600" />
                                </a>
                            )}

                            {/* Portfolio */}
                            {profile.portfolioUrl && (
                                <a href={profile.portfolioUrl} target="_blank" rel="noreferrer" className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-3.5 transition-all hover:border-slate-200 hover:bg-white hover:shadow-sm hover:-translate-y-0.5">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-xl bg-emerald-100 p-2 text-emerald-600"><LinkIcon size={16} /></div>
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500">Personal Portfolio</p>
                                            <p className="text-sm font-medium text-slate-900 group-hover:text-indigo-600">{new URL(profile.portfolioUrl).hostname}</p>
                                        </div>
                                    </div>
                                    <ExternalLink size={14} className="text-slate-400 transition-colors group-hover:text-indigo-600" />
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
