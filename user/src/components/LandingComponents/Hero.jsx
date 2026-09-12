import { ArrowRight, Check, Github, Star } from 'lucide-react'
import { useContext } from 'react'
import { Link } from 'react-router-dom'
import { AppContext } from '../../context/AppContext.jsx'

const miniStats = [
  { value: '43', label: 'Active Tasks' },
  { value: '87%', label: 'Completion Rate' },
  { value: '12', label: 'Open PRs' },
]

const kanbanCols = [
  { label: 'To-do', count: 4, tasks: ['Design homepage', 'Setup CI/CD'] },
  { label: 'In progress', count: 3, tasks: ['Auth system', 'API routes'] },
  { label: 'In review', count: 2, tasks: ['Release notes', 'Profile fixes'] },
  { label: 'Completed', count: 5, tasks: ['Project setup', 'Wireframes'] },
]

const Hero = () => {
  const { token } = useContext(AppContext)
  const primaryCtaPath = token ? '/dashboard' : '/signup'

  return (
    <section className="relative min-h-[86vh] lg:min-h-[90vh] flex items-center px-5 pt-28 pb-8 lg:pb-12 lg:px-12">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_0%,rgba(99,102,241,0.14),transparent_42%),radial-gradient(circle_at_10%_20%,rgba(139,92,246,0.12),transparent_38%)]" />
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-12 items-center">

        <div className="space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/70 bg-indigo-50/70 px-3.5 py-1 text-xs font-semibold text-indigo-700">
            Built for focused engineering teams
          </div>

          <div className="space-y-5 max-w-2xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.08] tracking-tight">
              Calm control for <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">fast-moving</span> product teams.
            </h1>
            <p className="text-base md:text-lg text-slate-600 leading-relaxed max-w-xl">
              DevDash brings tasks, pull requests, and progress into one clear view so your team spends less time coordinating and more time shipping.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link to={primaryCtaPath} className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-500/20 transition-all no-underline active:scale-[0.99]">
              {token ? 'Go to Dashboard' : 'Start for Free'}
              <ArrowRight size={16} />
            </Link>
            <a href="#features" className="inline-flex items-center gap-2 px-6 py-3 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition-colors no-underline">
              See Live Demo
            </a>
          </div>

          <ul className="flex flex-wrap items-center gap-4 list-none p-0 m-0">
            <li className="flex items-center gap-1.5 text-sm text-slate-600">
              <Star size={14} className="text-amber-400 fill-amber-400" />
              <span>4.9 / 5 rating</span>
            </li>
            <li className="flex items-center gap-1.5 text-sm text-slate-600">
              <Check size={14} className="text-emerald-600" />
              <span>Free forever plan</span>
            </li>
            <li className="flex items-center gap-1.5 text-sm text-slate-600">
              <Github size={14} className="text-slate-500" />
              <span>GitHub integration</span>
            </li>
          </ul>
        </div>

        <div className="w-full">
          <div className="bg-white/95 rounded-2xl border border-slate-200/80 shadow-[0_20px_50px_-25px_rgba(15,23,42,0.12)] overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50/80">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-400/70"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400/70"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-400/70"></div>
              </div>
              <div className="flex-1 text-center text-xs font-mono text-slate-500 bg-white border border-slate-200/80 rounded-lg px-3 py-1 max-w-xs mx-auto">
                app.devdash.io/dashboard
              </div>
              <div className="flex gap-1.5">
                <div className="w-6 h-3 rounded-full bg-slate-200"></div>
                <div className="w-6 h-3 rounded-full bg-slate-200"></div>
              </div>
            </div>

            <div className="p-5 space-y-5">
              <div className="grid grid-cols-3 gap-3">
                {miniStats.map((stat) => (
                  <div key={stat.label} className="bg-slate-50/70 border border-slate-200/70 rounded-xl px-3 py-3 text-center">
                    <p className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">{stat.value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {kanbanCols.map((col) => {
                  const theme =
                    col.label === 'To-do'
                      ? { dot: 'bg-sky-500', badge: 'bg-sky-100 text-sky-700', bg: 'border-sky-200/70 bg-sky-50/40' }
                      : col.label === 'In progress'
                      ? { dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700', bg: 'border-amber-200/70 bg-amber-50/40' }
                      : col.label === 'In review'
                      ? { dot: 'bg-purple-500', badge: 'bg-purple-100 text-purple-700', bg: 'border-purple-200/70 bg-purple-50/40' }
                      : { dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700', bg: 'border-emerald-200/70 bg-emerald-50/40' };

                  return (
                    <div key={col.label} className={`border rounded-xl p-3 space-y-2.5 ${theme.bg}`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${theme.dot}`} />
                        <span className="text-xs font-bold text-slate-700 flex-1 truncate">{col.label}</span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${theme.badge}`}>{col.count}</span>
                      </div>
                      <div className="space-y-1.5">
                        {col.tasks.map((task) => (
                          <div key={task} className="bg-white border border-slate-200/80 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 shadow-sm">
                            {task}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}

export default Hero
