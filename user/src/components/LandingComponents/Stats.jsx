
import { BadgeCheck, GitPullRequest, ShieldCheck, Users } from 'lucide-react'

const stats = [
  {
    value: '5,000+',
    label: 'Active Developers',
    icon: <Users size={20} className="text-indigo-600" />,
  },
  {
    value: '250K+',
    label: 'Tasks Completed',
    icon: <BadgeCheck size={20} className="text-emerald-600" />,
  },
  {
    value: '12K+',
    label: 'Pull Requests Tracked',
    icon: <GitPullRequest size={20} className="text-sky-600" />,
  },
  {
    value: '99.9%',
    label: 'Uptime Guarantee',
    icon: <ShieldCheck size={20} className="text-violet-600" />,
  },
]

const Stats = () => {
  return (
    <section id="stats" className="relative px-5 py-16 lg:px-12 overflow-hidden">
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-violet-400/10 rounded-full blur-3xl -z-10"></div>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {stats.map((stat)=>(
            <article key={stat.label} className="flex flex-col items-center text-center gap-3 p-5 bg-white/90 border border-slate-200/80 rounded-2xl backdrop-blur-sm shadow-[0_4px_20px_rgba(15,23,42,0.03)] hover:-translate-y-0.5 transition-all hover:border-indigo-200">
              <div className="p-2.5 bg-slate-50 border border-slate-200/70 rounded-xl">
                {stat.icon}
              </div>
              <p className="text-2xl md:text-3xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">{stat.value}</p>
              <p className="text-xs font-medium text-slate-500">{stat.label}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Stats
