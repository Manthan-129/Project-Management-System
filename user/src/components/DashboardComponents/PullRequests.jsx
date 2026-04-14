import { CalendarDays, CheckCircle2, Clock, ExternalLink, Filter, GitPullRequest, Layers, XCircle } from 'lucide-react'
import { useContext, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import api from '../../api/axiosInstance.js'
import { AppContext } from '../../context/AppContext.jsx'
import Loading from '../LoadingPage'
import AlertModal from './AlertModal'

const PullRequests = () => {
  const {token, setToken, authHeaders}= useContext(AppContext)

  const [pullRequests, setPullRequests]= useState([]);
  const [loading, setLoading]= useState(false);
  const [filterStatus, setFilterStatus]= useState('all');
  const [alert, setAlert]= useState({ isOpen: false, title: '', message: '', type: 'info' });

  const fetchPrs= async ()=>{
    setLoading(true);
    try{
        const { data }= await api.get('/pull-requests/my-pull-requests', {headers: authHeaders});
        if(!data?.success){
            toast.error(data?.message || 'Failed to fetch pull requests');
            setPullRequests([]);
            return;
        }

        setPullRequests(data?.pullRequests || []);
        
    }catch(error){
        if(error?.response?.status === 401){
            setToken(null);
            localStorage.removeItem('token');
        }
        toast.error(error?.response?.data?.message || 'Unable to fetch pull requests');
        setPullRequests([]);

    }finally{
        setLoading(false);
    }
  }

  useEffect(()=>{
    if(token){
      fetchPrs();
    } else {
      setLoading(false);
    }
  }, [token]);

  const filtered= useMemo(() => {
    return filterStatus === 'all' ? pullRequests : pullRequests.filter(pr => pr.status === filterStatus);
  }, [pullRequests, filterStatus]);

  const statusIcon= (status)=>{
    if(status === 'pending') return <Clock size={14} />
    if(status === 'accepted') return <CheckCircle2 size={14} />
    if(status === 'rejected') return <XCircle size={14} />
    return null;
  }

  const statusColor= (status)=>{
    if (status === 'pending') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (status === 'accepted') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (status === 'rejected') return 'bg-red-50 text-red-700 border-red-200';
    return null;
  }

  const statusBorderAccent= (status)=>{
    if (status === 'pending') return 'border-l-amber-400';
        if (status === 'accepted') return 'border-l-emerald-400';
        if (status === 'rejected') return 'border-l-red-400';
  }

  if(loading) return <Loading />;
  return (
    <div className="space-y-6 dd-fade-up">
      <div className="dd-section-card dd-fade-up">
        <div className="dd-page-kicker w-fit">
          <GitPullRequest size={14} />
          <span>Code Review</span>
        </div>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">My Pull Requests</h1>
        <p className="mt-1 text-sm text-slate-600">Track all your submitted pull requests.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="dd-section-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
                <Layers size= {18}></Layers>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{pullRequests.length}</p>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Total PRs</span>
              </div>
            </div>
          </div>

          <div className="dd-section-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-100 p-2 text-amber-700">
                <Clock size={18} />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{pullRequests.filter(pr => pr.status === 'pending').length}</p>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Pending Reviews</span>
              </div>
            </div>
          </div>

          <div className="dd-section-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{pullRequests.filter(pr => pr.status === 'accepted').length}</p>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Accepted PRs</span>
              </div>
            </div>
          </div>

          <div className="dd-section-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-rose-100 p-2 text-rose-700">
                <XCircle size={18} />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{pullRequests.filter(pr => pr.status === 'rejected').length}</p>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Rejected PRs</span>
              </div>
            </div>
          </div>
      </div>


      <div className="dd-section-card">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Filter size={16} />
            <span>Filter by status</span>
          </div>
          <div className="flex items-center gap-3">
            <select className="dd-select min-w-[210px]" value={filterStatus} onChange={(e)=> setFilterStatus(e.target.value)}>
              <option value="all">All PRs</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="dd-section-card py-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-[#315e8d]">
                <GitPullRequest size={36} />
            </div>
            <h1 className="mt-4 text-lg font-bold text-slate-900">No Pull Requests Found</h1>
            <p className="mt-2 text-sm text-slate-600">Submit a PR from a team task to see it here.</p>
          </div>
        )
      :
      (
        <div className="space-y-3">
          {filtered.map(pr => (
            <div key= {pr._id} className={`dd-section-card border-l-4 ${statusBorderAccent(pr.status)}`}>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-slate-900">{pr.task.title}</h4>
                  <p className="text-sm text-slate-500">{pr.team.name}</p>
                </div>
                <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg border ${statusColor(pr.status)}`}>
                    {statusIcon(pr.status)}
                    {pr.status}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                <a className="inline-flex items-center gap-1.5 font-semibold text-[#315e8d] hover:text-[#26486d] no-underline" href={pr.githubPRLink} target="_blank" rel="noreferrer"> <ExternalLink size={12} /> View on GitHub </a>
                <div className="inline-flex items-center gap-1 text-xs text-slate-500">
                  <CalendarDays size={12} />
                  {new Date(pr.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>

              {pr.message && <p className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">"{pr.message}"</p>}

              {pr.reviewedBy && (
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                  <CheckCircle2 size={12} />
                  Reviewed by <span>{pr.reviewedBy.firstName} {pr.reviewedBy.lastName}</span>
                </p>
              )}
            </div>
          ))}
        </div>
      )}
      </div>
      
      <AlertModal 
        isOpen={alert.isOpen}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert({ isOpen: false, title: '', message: '', type: 'info' })}
      />

    </div>
  )
}

export default PullRequests