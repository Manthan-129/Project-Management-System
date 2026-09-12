import {
  Bell,
  ChartColumnIncreasing,
  GitPullRequest,
  Globe,
  LayoutDashboard,
  Users,
} from 'lucide-react'
import { useContext } from 'react'
import { Link } from 'react-router-dom'
import { AppContext } from '../../context/AppContext.jsx'

const iconColors = [
  'text-indigo-600 bg-indigo-50',
  'text-emerald-600 bg-emerald-50',
  'text-sky-600 bg-sky-50',
  'text-violet-600 bg-violet-50',
  'text-amber-600 bg-amber-50',
  'text-rose-600 bg-rose-50',
]

const features = [
  {
    icon: LayoutDashboard,
    title: 'Kanban Workspace',
    desc: 'Plan and execute work with drag-and-drop boards that keep priorities visible for everyone.',
  },
  {
    icon: Users,
    title: 'Team Alignment',
    desc: 'Assign owners, define responsibilities, and keep every contributor synced in real time.',
  },
  {
    icon: GitPullRequest,
    title: 'PR Visibility',
    desc: 'Link pull requests to tasks and track review status without leaving your delivery flow.',
  },
  {
    icon: ChartColumnIncreasing,
    title: 'Progress Analytics',
    desc: 'Use live completion insights to spot blockers early and protect sprint commitments.',
  },
  {
    icon: Bell,
    title: 'Smart Alerts',
    desc: 'Receive focused updates for changes that matter, not noisy notifications all day.',
  },
  {
    icon: Globe,
    title: 'Developer Network',
    desc: 'Discover collaborators, grow your internal network, and build faster as a connected team.',
  },
]

const Feature = () => {
  const { token } = useContext(AppContext)
  const primaryCtaPath = token ? '/dashboard' : '/signup'

  return (
    <section id="features" className="relative px-5 py-24 lg:px-12 overflow-hidden">
      <div className="absolute -top-24 left-1/4 w-72 h-72 bg-indigo-400/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute -bottom-24 right-1/4 w-80 h-80 bg-violet-400/10 rounded-full blur-3xl -z-10"></div>
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="max-w-2xl mx-auto text-center space-y-3">
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-[0.2em]">Platform Features</p>
          <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">Tools Your Team Will Actually Use</h2>
          <p className="text-base text-slate-600 leading-relaxed">
            DevDash combines planning, collaboration, and delivery tracking into one focused workspace built for engineering teams.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <article key={feature.title} className="group bg-white/90 border border-slate-200/80 rounded-2xl p-6 space-y-4 transition duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-200 backdrop-blur-sm">
              <div className={`w-10 h-10 flex items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105 ${iconColors[i]}`}>
                <feature.icon size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900">{feature.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{feature.desc}</p>
            </article>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link to={primaryCtaPath} className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 rounded-xl shadow-md shadow-indigo-500/20 transition-all no-underline active:scale-[0.99]">
            {token ? 'Open Dashboard' : 'Create Your Workspace'}
          </Link>
          <a href="#how-it-works" className="px-6 py-2.5 text-sm font-semibold text-slate-700 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl transition-colors no-underline">
            See Workflow
          </a>
        </div>
      </div>
    </section>
  )
}

export default Feature
