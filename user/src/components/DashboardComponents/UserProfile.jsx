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

    if (loading) return <Loading />;

    if (error === 'PrivateProfile') {
        return (
            <div className="flex min-h-[50vh] flex-col items-center justify-center p-8 text-center dd-fade-up">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 shadow-inner">
                    <Target size={32} className="text-slate-400" />
                </div>
                <h2 className="text-2xl font-black text-slate-800">Private Profile</h2>
                <p className="mt-2 max-w-md text-slate-500">This user has chosen to keep their profile private. Only authorized users or mutual friends might be permitted to view these details depending on their constraints.</p>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="flex min-h-[50vh] flex-col items-center justify-center p-8 text-center text-rose-500">
                <p>{error || 'User not found'}</p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl space-y-6 pb-10 dd-fade-up">
            <section className="dd-section-card overflow-hidden p-0">
                <div className="bg-[linear-gradient(125deg,#315e8d,#4a7db0_45%,#86a9cb)] px-5 py-5 sm:px-7">
                    <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div className="flex items-end gap-4">
                            <img
                                src={profile.profilePicture || `https://ui-avatars.com/api/?name=${profile.firstName}+${profile.lastName}&background=315e8d&color=fff&size=200`}
                                alt={`${profile.firstName} avatar`}
                                className="h-24 w-24 rounded-2xl border-4 border-white bg-white object-cover shadow-lg sm:h-28 sm:w-28"
                            />
                            <div className="pb-1 text-white">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-100">Public Profile</p>
                                <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{profile.firstName} {profile.lastName}</h1>
                                <p className="text-sm font-semibold text-blue-100">@{profile.username}</p>
                            </div>
                        </div>

                        {profile.isFriend && (
                            <div className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-600 shadow-sm">
                                <Heart size={16} className="fill-emerald-600" /> Friends
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid gap-4 border-t border-slate-200/80 bg-white p-5 sm:grid-cols-3 sm:p-6">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Connections</p>
                        <p className="mt-1 text-2xl font-black text-slate-900">{profile.friendCount || 0}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Showcased Works</p>
                        <p className="mt-1 text-2xl font-black text-slate-900">{showcaseWorks.length}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Visibility</p>
                        <p className="mt-1 text-base font-bold capitalize text-slate-900">{profile?.privacySettings?.profileVisibility || 'public'}</p>
                    </div>
                </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-3">
                <section className="space-y-6 xl:col-span-1">
                    <article className="dd-section-card">
                        <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">About</h3>
                        <p className="mt-3 text-sm leading-6 text-slate-700">
                            {profile.bio || "This user hasn't added a bio yet."}
                        </p>
                    </article>

                    <article className="dd-section-card">
                        <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Links and Contact</h3>
                        <div className="mt-4 space-y-3">
                            {profile.privacySettings?.showEmail !== false && profile.email ? (
                                <a href={`mailto:${profile.email}`} className="group flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 no-underline transition hover:border-slate-300 hover:bg-white">
                                    <span className="inline-flex items-center gap-2"><Mail size={14} /> {profile.email}</span>
                                    <ExternalLink size={14} className="text-slate-400 group-hover:text-[#315e8d]" />
                                </a>
                            ) : (
                                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm italic text-slate-500">
                                    <Mail size={14} className="text-slate-400" /> Email hidden by privacy settings
                                </div>
                            )}

                            {profile.githubUrl && (
                                <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="group flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 no-underline transition hover:border-slate-300 hover:bg-white">
                                    <span className="inline-flex items-center gap-2"><Github size={14} /> {safeHost(profile.githubUrl)}</span>
                                    <ExternalLink size={14} className="text-slate-400 group-hover:text-[#315e8d]" />
                                </a>
                            )}

                            {profile.linkedinUrl && (
                                <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="group flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 no-underline transition hover:border-slate-300 hover:bg-white">
                                    <span className="inline-flex items-center gap-2"><Linkedin size={14} /> LinkedIn</span>
                                    <ExternalLink size={14} className="text-slate-400 group-hover:text-[#315e8d]" />
                                </a>
                            )}

                            {profile.portfolioUrl && (
                                <a href={profile.portfolioUrl} target="_blank" rel="noreferrer" className="group flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 no-underline transition hover:border-slate-300 hover:bg-white">
                                    <span className="inline-flex items-center gap-2"><LinkIcon size={14} /> {safeHost(profile.portfolioUrl)}</span>
                                    <ExternalLink size={14} className="text-slate-400 group-hover:text-[#315e8d]" />
                                </a>
                            )}
                        </div>
                    </article>
                </section>

                <section className="space-y-4 xl:col-span-2">
                    <article className="dd-section-card">
                        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200/80 pb-4">
                            <div>
                                <div className="dd-page-kicker w-fit">
                                    <Briefcase size={14} />
                                    <span>Work Showcase</span>
                                </div>
                                <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900">Highlighted Work and Contributions</h2>
                                <p className="mt-1 text-sm text-slate-600">Detailed projects, outcomes, and GitHub PR links this user wants to showcase.</p>
                            </div>
                            <span className="dd-badge border-blue-200 bg-blue-50 text-[#315e8d]">{showcaseWorks.length} entries</span>
                        </div>

                        {showcaseWorks.length === 0 ? (
                            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-6 text-center">
                                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[#315e8d] shadow-sm">
                                    <Sparkles size={18} />
                                </div>
                                <p className="text-sm font-semibold text-slate-700">No showcased work yet</p>
                                <p className="mt-1 text-sm text-slate-500">This profile has not added project details yet.</p>
                            </div>
                        ) : (
                            <div className="mt-5 space-y-4">
                                {showcaseWorks.map((work) => (
                                    <article key={work.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">{work.title}</h3>
                                                <p className="mt-1 text-sm text-slate-600">{work.summary}</p>
                                            </div>
                                            <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-[#315e8d]">
                                                {work.role}
                                            </span>
                                        </div>

                                        {(work.duration || work.createdAt) && (
                                            <p className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                                                <CalendarClock size={12} />
                                                {work.duration || `Added ${new Date(work.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                                            </p>
                                        )}

                                        {work.details.length > 0 && (
                                            <ul className="mt-3 space-y-1.5 text-sm text-slate-700">
                                                {work.details.map((detail, index) => (
                                                    <li key={`${work.id}-detail-${index}`} className="flex items-start gap-2">
                                                        <CheckCircle2 size={14} className="mt-[2px] shrink-0 text-[#315e8d]" />
                                                        <span>{detail}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}

                                        {work.techStack.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {work.techStack.map((tech, index) => (
                                                    <span key={`${work.id}-tech-${index}`} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                                        {tech}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {work.outcomes.length > 0 && (
                                            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Impact and Outcomes</p>
                                                <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                                                    {work.outcomes.map((item, index) => (
                                                        <li key={`${work.id}-outcome-${index}`} className="flex items-start gap-2">
                                                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#315e8d]" />
                                                            <span>{item}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {work.prLinks.map((link, index) => (
                                                <a
                                                    key={`${work.id}-pr-${index}`}
                                                    href={link.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-[#315e8d] no-underline transition hover:bg-blue-100"
                                                >
                                                    <Github size={13} /> {link.label}
                                                </a>
                                            ))}

                                            {work.repoUrl && (
                                                <a
                                                    href={work.repoUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 no-underline transition hover:border-slate-300 hover:bg-slate-50"
                                                >
                                                    <Github size={13} /> Repository
                                                </a>
                                            )}

                                            {work.liveUrl && (
                                                <a
                                                    href={work.liveUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 no-underline transition hover:border-slate-300 hover:bg-slate-50"
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
