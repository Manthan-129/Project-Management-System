import { CalendarDays, CheckCircle2, Clock, ExternalLink, Filter, GitPullRequest, Layers, XCircle } from 'lucide-react'
import { useContext, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { AppContext } from '../../context/AppContext.jsx'
import Loading from '../LoadingPage'
import api from '../../api/axiosInstance.js'

const PullRequests = () => {
  const {token, setToken}= useContext(AppContext)

  const [pullRequests, setPullRequests]= useState([]);
  const [loading, setLoading]= useState(false);
  const [filterStatus, setFilterStatus]= useState('all');

  const authHeaders = { Authorization: `Bearer ${token}` };

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

  const filtered= filterStatus === 'all' ? pullRequests : pullRequests.filter(pr => pr.status == filterStatus);

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
    <div>
      {/* Headers */}
      <div>
        <div>
          <GitPullRequest size={18} />
          <span>Code Review</span>
        </div>
        <h1>My Pull Requests</h1>
        <p>Track all your submitted pull requests</p>
      </div>
      {/* Stats */}
      <div> 
        <div>
          <div>
            <div>
              <Layers size= {18}></Layers>
            </div>
            <div>
              <p>{pullRequests.length}</p>
              <span>Total PRs</span>
            </div>
          </div>

          <div>
            <div>
              <Clock size={18} />
            </div>
            <div>
              <p>{pullRequests.filter(pr => pr.status === 'pending').length}</p>
              <span>Pending Reviews</span>
            </div>
          </div>

          <div>
            <div>
              <CheckCircle2 size={18} />
            </div>
            <div>
              <p>{pullRequests.filter(pr => pr.status === 'accepted').length}</p>
              <span>Accepted PRs</span>
            </div>
          </div>

          <div>
            <div>
              <XCircle size={18} />
            </div>
            <div>
              <p>{pullRequests.filter(pr => pr.status === 'rejected').length}</p>
              <span>Rejected PRs</span>
            </div>
          </div>

        </div>
      </div>

      {/* Filter */}
      <div>
        <div>
          <Filter size={16} />
          <select value={filterStatus} onChange={(e)=> setFilterStatus(e.target.value)}>
            <option value="all">All PRs</option>
            <option value="accepted">Accepted PRs</option>
            <option value="rejected">Rejected PRs</option>
            <option value="pending">Pending PRs</option>
          </select>

          <span>{filtered.length} pull requests</span>
        </div>
      </div>

      {/* List */}
      <div>
        {filtered.length === 0 ? (
          <div>
            <div>
              <div>
                <GitPullRequest size={36} />
              </div>
              <h1>No Pull Requests Found</h1>
              <p>Submit a PR from a team task to see it here.</p>
            </div>
          </div>
        )
      :
      (
        <div>
          {filtered.map(pr => (
            <div key= {pr._id}>
              <div>
                <div>
                  <h4>{pr.task.title}</h4>
                  <p>{pr.team.name}</p>
                </div>
                <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg border ${statusColor(pr.status)}`}>
                    {statusIcon(pr.status)}
                    {pr.status}
                </span>
              </div>

              <a href={pr.githubPRLink} target="_blank"> <ExternalLink size={12} /> View on GitHub </a>
              {pr.message && <p>"{pr.message}"</p>}

              {pr.reviewedBy && (
                <p>
                  <CheckCircle2 size={12} />
                  Reviewed by <span>{pr.reviewedBy.firstName} {pr.reviewedBy.lastName}</span>
                </p>
              )}

              <div>
                <CalendarDays size={12} />
                {new Date(pr.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
      


    </div>
  )
}

export default PullRequests