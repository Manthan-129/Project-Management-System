import { CalendarDays, CheckCircle2, Clock, ExternalLink, Filter, GitPullRequest, Layers, XCircle } from 'lucide-react'
import { useContext, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { AppContext } from '../../context/AppContext.jsx'
import Loading from '../LoadingPage'
import api from '../../api/axiosInstance.js'

const PullRequests = () => {
    const { token, setToken, authHeaders } = useContext(AppContext);

    const [pullRequests, setPullRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');

    const fetchPrs = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/pull-requests/my-pull-requests', { headers: authHeaders });
            if (!data?.success) {
                toast.error(data?.message || 'Failed to fetch pull requests');
                setPullRequests([]); return;
            }
            setPullRequests(data?.pullRequests || []);
        } catch (error) {
            if (error?.response?.status === 401) { setToken(null); localStorage.removeItem('token'); }
            toast.error(error?.response?.data?.message || 'Unable to fetch pull requests');
            setPullRequests([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchPrs();
        else setLoading(false);
    }, [token]);

    const filtered = filterStatus === 'all'
        ? pullRequests
        : pullRequests.filter(pr => pr.status === filterStatus);

    const statusIcon = (status) => {
        if (status === 'pending')  return <Clock size={14} />;
        if (status === 'accepted') return <CheckCircle2 size={14} />;
        if (status === 'rejected') return <XCircle size={14} />;
        return null;
    };

    const statusColor = (status) => {
        if (status === 'pending')  return 'bg-amber-50 text-amber-700 border-amber-200';
        if (status === 'accepted') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        if (status === 'rejected') return 'bg-red-50 text-red-700 border-red-200';
        return '';
    };

    const statusBorderAccent = (status) => {
        if (status === 'pending')  return 'border-l-amber-400';
        if (status === 'accepted') return 'border-l-emerald-400';
        if (status === 'rejected') return 'border-l-red-400';
        return '';
    };

    if (loading) return <Loading />;

    return (
        <div className="min-h-screen bg-[#f0f4f8] px-4 py-6 lg:px-8">

            {/* ── Header ── */}
            <div className="mb-6 [animation:fadeUp_.4s_ease_both]">
                <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 rounded-lg bg-[#e9f0f8] flex items-center justify-center">
                        <GitPullRequest size={14} className="text-[#315e8d]" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[.18em] text-[#315e8d]">
                        Code Review
                    </span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Pull Requests</h1>
                <p className="text-sm text-slate-500 mt-1">Track all your submitted pull requests</p>
            </div>

            {/* ── Stats ── */}
            <div className="mb-5 [animation:fadeUp_.4s_ease_.05s_both]">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

                    <div className="bg-white border border-[#dbe5f1] rounded-2xl px-4 py-3.5 flex items-center gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#c8d9ee]">
                        <div className="w-9 h-9 rounded-xl bg-[#e9f0f8] flex items-center justify-center shrink-0">
                            <Layers size={18} className="text-[#315e8d]" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-slate-800 leading-none">
                                {pullRequests.length}
                            </p>
                            <span className="text-[11px] text-slate-400 font-medium">Total PRs</span>
                        </div>
                    </div>

                    <div className="bg-white border border-[#dbe5f1] rounded-2xl px-4 py-3.5 flex items-center gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#c8d9ee]">
                        <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                            <Clock size={18} className="text-amber-500" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-amber-600 leading-none">
                                {pullRequests.filter(pr => pr.status === 'pending').length}
                            </p>
                            <span className="text-[11px] text-slate-400 font-medium">Pending Reviews</span>
                        </div>
                    </div>

                    <div className="bg-white border border-[#dbe5f1] rounded-2xl px-4 py-3.5 flex items-center gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#c8d9ee]">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                            <CheckCircle2 size={18} className="text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-emerald-600 leading-none">
                                {pullRequests.filter(pr => pr.status === 'accepted').length}
                            </p>
                            <span className="text-[11px] text-slate-400 font-medium">Accepted PRs</span>
                        </div>
                    </div>

                    <div className="bg-white border border-[#dbe5f1] rounded-2xl px-4 py-3.5 flex items-center gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#c8d9ee]">
                        <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                            <XCircle size={18} className="text-red-500" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-red-600 leading-none">
                                {pullRequests.filter(pr => pr.status === 'rejected').length}
                            </p>
                            <span className="text-[11px] text-slate-400 font-medium">Rejected PRs</span>
                        </div>
                    </div>

                </div>
            </div>

            {/* ── Filter ── */}
            <div className="mb-4 [animation:fadeUp_.4s_ease_.1s_both]">
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="w-7 h-7 rounded-lg bg-[#e9f0f8] flex items-center justify-center shrink-0">
                        <Filter size={14} className="text-[#315e8d]" />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="text-sm font-semibold text-[#315e8d] bg-[#edf3fa] border border-[#dbe5f1] rounded-xl px-3 py-1.5 appearance-none cursor-pointer outline-none transition-all duration-200 focus:ring-2 focus:ring-[#315e8d]/25"
                    >
                        <option value="all">All PRs</option>
                        <option value="accepted">Accepted PRs</option>
                        <option value="rejected">Rejected PRs</option>
                        <option value="pending">Pending PRs</option>
                    </select>

                    <span className="text-xs font-semibold text-slate-400">
                        {filtered.length} pull request{filtered.length !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            {/* ── List ── */}
            <div className="[animation:fadeUp_.35s_ease_.15s_both]">
                {filtered.length === 0 ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-slate-100 flex items-center justify-center mb-4 shadow-sm">
                                <GitPullRequest size={28} className="text-gray-300" />
                            </div>
                            <h1 className="text-base font-bold text-slate-700 mb-1">No Pull Requests Found</h1>
                            <p className="text-sm text-slate-400 max-w-xs">
                                Submit a PR from a team task to see it here.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map(pr => (
                            <div
                                key={pr._id}
                                className={`bg-white border border-[#dbe5f1] border-l-4 ${statusBorderAccent(pr.status)} rounded-2xl px-5 py-4 transition-all duration-200 hover:border-r-[#c8d9ee] hover:border-t-[#c8d9ee] hover:border-b-[#c8d9ee] hover:-translate-y-0.5`}
                            >
                                {/* Title row */}
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="min-w-0">
                                        <h4 className="text-sm font-bold text-slate-800 truncate">
                                            {pr.task.title}
                                        </h4>
                                        <p className="text-xs text-slate-400 mt-0.5">{pr.team.name}</p>
                                    </div>
                                    <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg border shrink-0 capitalize ${statusColor(pr.status)}`}>
                                        {statusIcon(pr.status)}
                                        {pr.status}
                                    </span>
                                </div>

                                {/* GitHub link */}
                                
                                    <a href={pr.githubPRLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#315e8d] hover:text-[#26486d] hover:underline transition-colors duration-150 mb-2"
                                >
                                    <ExternalLink size={12} /> View on GitHub
                                </a>

                                {/* PR message */}
                                {pr.message && (
                                    <p className="text-xs text-slate-500 italic bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 mb-2 line-clamp-2">
                                        "{pr.message}"
                                    </p>
                                )}

                                {/* Reviewed by */}
                                {pr.reviewedBy && (
                                    <p className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium mb-2">
                                        <CheckCircle2 size={12} />
                                        Reviewed by{' '}
                                        <span className="font-bold">
                                            {pr.reviewedBy.firstName} {pr.reviewedBy.lastName}
                                        </span>
                                    </p>
                                )}

                                {/* Date */}
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                                    <CalendarDays size={12} />
                                    {new Date(pr.createdAt).toLocaleDateString('en-US', {
                                        month: 'short', day: 'numeric', year: 'numeric',
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
};

export default PullRequests