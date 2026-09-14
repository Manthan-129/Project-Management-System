import {
    Briefcase,
    CalendarClock,
    CheckCircle2,
    ExternalLink,
    Github,
    Heart,
    Link as LinkIcon,
    Linkedin,
    Mail,
    Sparkles,
    Target,
} from 'lucide-react';
import { useContext, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axiosInstance.js';
import { AppContext } from '../../context/AppContext.jsx';
import Loading from '../LoadingPage.jsx';

const toArray = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value.trim()) return [value.trim()];
    return [];
};

const safeHost = (url) => {
    try {
        return new URL(url).hostname.replace(/^www\./, '');
    } catch {
        return 'External Link';
    }
};

const normalizePrLinks = (work) => {
    const links = [];

    if (Array.isArray(work?.githubPRLinks)) {
        work.githubPRLinks.forEach((entry, index) => {
            if (typeof entry === 'string' && entry.trim()) {
                links.push({ label: `PR ${index + 1}`, url: entry.trim() });
            } else if (entry?.url) {
                links.push({ label: entry.label || `PR ${index + 1}`, url: entry.url });
            }
        });
    }

    if (typeof work?.githubPRLink === 'string' && work.githubPRLink.trim()) {
        links.push({ label: 'PR Link', url: work.githubPRLink.trim() });
    }

    return links;
};

const UserProfile = () => {
    const { username } = useParams();
    const { token, authHeaders } = useContext(AppContext);

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const showcaseWorks = useMemo(() => {
        const rawWorks = Array.isArray(profile?.workShowcase) ? profile.workShowcase : [];

        return rawWorks.map((work, index) => ({
            id: work?._id || `work-${index}`,
            title: work?.title || `Work #${index + 1}`,
            summary: work?.summary || work?.description || 'No summary provided yet.',
            details: toArray(work?.details),
            role: work?.role || 'Contributor',
            techStack: toArray(work?.techStack),
            outcomes: toArray(work?.outcomes),
            prLinks: normalizePrLinks(work),
            repoUrl: work?.repositoryUrl || work?.repoUrl || '',
            liveUrl: work?.liveUrl || '',
            duration: work?.duration || '',
            createdAt: work?.createdAt || '',
        }));
    }, [profile]);

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

    if (loading) return <Loading inline />;

    if (error === 'PrivateProfile') {
        return (
            <div className="flex min-h-[50vh] flex-col items-center justify-center p-8 text-center dd-fade-up">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-800 shadow-inner">
                    <Target size={32} className="text-slate-400" />
                </div>
                <h2 className="text-2xl font-black text-slate-200">Private Profile</h2>
                <p className="mt-2 max-w-md text-slate-400">This user has chosen to keep their profile private. Only authorized users or mutual friends might be permitted to view these details depending on their constraints.</p>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="flex min-h-[50vh] flex-col items-center justify-center p-8 text-center text-rose-400">
                <p>{error || 'User not found'}</p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl space-y-6 pb-12 dd-fade-up">
            {/* Hero Profile Banner */}
            <section className="dd-section-card overflow-hidden p-0 border border-slate-700/60 shadow-[0_4px_24px_rgba(15,23,42,0.15)]">
                <div className="relative bg-gradient-to-r from-[#071322] via-[#0d223c] to-[#091729] border-b border-slate-800/80 px-6 py-8 sm:px-8">
                    <div className="pointer-events-none absolute inset-0 [background-image:radial-gradient(circle_at_90%_10%,rgba(114,241,197,0.14),transparent_50%)]" />

                    <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                            <img
                                src={profile.profilePicture || `https://ui-avatars.com/api/?name=${profile.firstName}+${profile.lastName}&background=1e293b&color=fff&size=200`}
                                alt={`${profile.firstName} avatar`}
                                className="h-24 w-24 rounded-2xl border-4 border-slate-800/90 bg-slate-900 object-cover shadow-xl sm:h-28 sm:w-28 ring-2 ring-indigo-500/20"
                            />
                            <div className="pb-1 text-white">
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/70 bg-slate-800/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300 backdrop-blur-sm">
                                    Public Profile
                                </span>
                                <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl text-white">
                                    {profile.firstName} {profile.lastName}
                                </h1>
                                <p className="text-sm font-medium text-slate-400">@{profile.username}</p>
                            </div>
                        </div>

                        {profile.isFriend && (
                            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 shadow-md backdrop-blur-md">
                                <Heart size={14} className="fill-emerald-400 text-emerald-400" />
                                Friends
                            </div>
                        )}
                    </div>
                </div>

                {/* Profile Stats Bar */}
                <div className="grid grid-cols-1 gap-3 border-t border-slate-800/80 bg-slate-900/40 p-5 sm:grid-cols-3 sm:p-6">
                    <div className="rounded-2xl border border-slate-800/80 bg-slate-950/50 p-4 transition-all hover:border-slate-700">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Connections</p>
                        <p className="mt-1 text-2xl font-extrabold text-indigo-400">{profile.friendCount || 0}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800/80 bg-slate-950/50 p-4 transition-all hover:border-slate-700">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Showcased Works</p>
                        <p className="mt-1 text-2xl font-extrabold text-cyan-400">{showcaseWorks.length}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800/80 bg-slate-950/50 p-4 transition-all hover:border-slate-700">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Visibility</p>
                        <p className="mt-1 text-base font-bold capitalize text-slate-200">{profile?.privacySettings?.profileVisibility || 'public'}</p>
                    </div>
                </div>
            </section>

            {/* Profile Content Grid */}
            <div className="grid gap-6 xl:grid-cols-3">
                {/* Left Side: Bio & Links */}
                <section className="space-y-6 xl:col-span-1">
                    <article className="dd-section-card">
                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">About</h3>
                        <p className="mt-3 text-sm leading-relaxed text-slate-600">
                            {profile.bio || "This user hasn't added a bio yet."}
                        </p>
                    </article>

                    <article className="dd-section-card">
                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Links and Contact</h3>
                        <div className="mt-4 space-y-2.5">
                            {profile.privacySettings?.showEmail !== false && profile.email ? (
                                <a
                                    href={`mailto:${profile.email}`}
                                    className="group flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 px-3.5 py-2.5 text-sm text-slate-700 no-underline transition hover:border-indigo-300 hover:bg-white"
                                >
                                    <span className="inline-flex items-center gap-2 font-medium">
                                        <Mail size={15} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                        {profile.email}
                                    </span>
                                    <ExternalLink size={14} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                </a>
                            ) : (
                                <div className="flex items-center gap-2 rounded-xl border border-slate-200/70 bg-slate-50/50 px-3.5 py-2.5 text-sm italic text-slate-400">
                                    <Mail size={15} className="text-slate-400" /> Email hidden by privacy settings
                                </div>
                            )}

                            {profile.githubUrl && (
                                <a
                                    href={profile.githubUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="group flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 px-3.5 py-2.5 text-sm text-slate-700 no-underline transition hover:border-indigo-300 hover:bg-white"
                                >
                                    <span className="inline-flex items-center gap-2 font-medium">
                                        <Github size={15} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                        {safeHost(profile.githubUrl)}
                                    </span>
                                    <ExternalLink size={14} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                </a>
                            )}

                            {profile.linkedinUrl && (
                                <a
                                    href={profile.linkedinUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="group flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 px-3.5 py-2.5 text-sm text-slate-700 no-underline transition hover:border-indigo-300 hover:bg-white"
                                >
                                    <span className="inline-flex items-center gap-2 font-medium">
                                        <Linkedin size={15} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                        LinkedIn
                                    </span>
                                    <ExternalLink size={14} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                </a>
                            )}

                            {profile.portfolioUrl && (
                                <a
                                    href={profile.portfolioUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="group flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 px-3.5 py-2.5 text-sm text-slate-700 no-underline transition hover:border-indigo-300 hover:bg-white"
                                >
                                    <span className="inline-flex items-center gap-2 font-medium">
                                        <LinkIcon size={15} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                        {safeHost(profile.portfolioUrl)}
                                    </span>
                                    <ExternalLink size={14} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                </a>
                            )}
                        </div>
                    </article>
                </section>

                {/* Right Side: Work Showcase */}
                <section className="space-y-4 xl:col-span-2">
                    <article className="dd-section-card">
                        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-5">
                            <div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/60 bg-indigo-50/70 px-3 py-1 text-xs font-semibold text-indigo-700">
                                    <Briefcase size={13} />
                                    <span>Work Showcase</span>
                                </div>
                                <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">Highlighted Work and Contributions</h2>
                                <p className="mt-1 text-xs text-slate-500">Detailed projects, outcomes, and GitHub PR links showcased by this user.</p>
                            </div>
                            <span className="rounded-full border border-indigo-200/70 bg-indigo-50/70 px-3 py-1 text-xs font-bold text-indigo-700">
                                {showcaseWorks.length} entries
                            </span>
                        </div>

                        {showcaseWorks.length === 0 ? (
                            <div className="mt-6 rounded-2xl border border-dashed border-slate-700/70 bg-slate-900/40 p-8 text-center">
                                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-indigo-400">
                                    <Sparkles size={20} />
                                </div>
                                <p className="text-sm font-semibold text-slate-200">No showcased work yet</p>
                                <p className="mt-1 text-xs text-slate-400">This profile has not added project details yet.</p>
                            </div>
                        ) : (
                            <div className="mt-6 max-h-[540px] overflow-y-auto pr-2 custom-scrollbar space-y-4">
                                {showcaseWorks.map((work) => (
                                    <article
                                        key={work.id}
                                        className="rounded-2xl border border-slate-700/60 bg-slate-900/50 p-5 shadow-sm transition-all hover:border-slate-600"
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-100">{work.title}</h3>
                                                <p className="mt-1 text-sm text-slate-300 leading-relaxed">{work.summary}</p>
                                            </div>
                                            <span className="rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1 text-xs font-semibold text-slate-300">
                                                {work.role}
                                            </span>
                                        </div>

                                        {(work.duration || work.createdAt) && (
                                            <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
                                                <CalendarClock size={13} />
                                                {work.duration || `Added ${new Date(work.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                                            </p>
                                        )}

                                        {work.details.length > 0 && (
                                            <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
                                                {work.details.map((detail, index) => (
                                                    <li key={`${work.id}-detail-${index}`} className="flex items-start gap-2">
                                                        <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-400" />
                                                        <span>{detail}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}

                                        {work.techStack.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-1.5">
                                                {work.techStack.map((tech, index) => (
                                                    <span
                                                        key={`${work.id}-tech-${index}`}
                                                        className="rounded-lg border border-slate-700/70 bg-slate-800/70 px-2.5 py-1 text-xs font-medium text-slate-300"
                                                    >
                                                        {tech}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {work.outcomes.length > 0 && (
                                            <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/50 p-3.5">
                                                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Impact and Outcomes</p>
                                                <ul className="mt-2 space-y-1.5 text-xs text-slate-300">
                                                    {work.outcomes.map((item, index) => (
                                                        <li key={`${work.id}-outcome-${index}`} className="flex items-start gap-2">
                                                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                                                            <span>{item}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        <div className="mt-4 flex flex-wrap gap-2 pt-2 border-t border-slate-800">
                                            {work.prLinks.map((link, index) => (
                                                <a
                                                    key={`${work.id}-pr-${index}`}
                                                    href={link.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 no-underline transition hover:bg-slate-700/80 hover:text-white"
                                                >
                                                    <Github size={13} /> {link.label}
                                                </a>
                                            ))}

                                            {work.repoUrl && (
                                                <a
                                                    href={work.repoUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 no-underline transition hover:bg-slate-700/80 hover:text-white"
                                                >
                                                    <Github size={13} /> Repository
                                                </a>
                                            )}

                                            {work.liveUrl && (
                                                <a
                                                    href={work.liveUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 no-underline transition hover:bg-slate-700/80 hover:text-white"
                                                >
                                                    <ExternalLink size={13} /> Live Demo
                                                </a>
                                            )}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </article>
                </section>
            </div>
        </div>
    );
};

export default UserProfile;
