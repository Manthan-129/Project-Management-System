
import { BadgeCheck, GitPullRequest, ShieldCheck, Users } from 'lucide-react'

const stats = [
  {
    value: '5,000+',
    label: 'Active Developers',
    icon: <Users size={21} className="text-[#315e8d]" />,
  },
  {
    value: '250K+',
    label: 'Tasks Completed',
    icon: <BadgeCheck size={21} className="text-emerald-600" />,
  },
  {
    value: '12K+',
    label: 'Pull Requests Tracked',
    icon: <GitPullRequest size={21} className="text-sky-600" />,
  },
  {
    value: '99.9%',
    label: 'Uptime Guarantee',
    icon: <ShieldCheck size={21} className="text-slate-700" />,
  },
]

const Stats = () => {
  return (
    <section id="stats" className="relative px-5 py-16 lg:px-12 overflow-hidden">
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-400/15 rounded-full blur-3xl -z-10"></div>
      <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-teal-400/15 rounded-full blur-3xl -z-10"></div>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {stats.map((stat)=>(
            <article key={stat.label} className="flex flex-col items-center text-center gap-3 p-5 bg-white/85 border border-blue-100 rounded-2xl backdrop-blur-sm hover:-translate-y-0.5 transition-transform">
              <div className="p-2.5 bg-gradient-to-br from-blue-50 to-teal-50 border border-blue-100 rounded-xl">
                {stat.icon}
              </div>
              <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">{stat.value}</p>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Stats
