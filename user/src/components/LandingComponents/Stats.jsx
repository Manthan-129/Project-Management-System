
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
    <section id="stats" className="px-5 py-16 lg:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {stats.map((stat)=>(
            <article key={stat.label} className="flex flex-col items-center text-center gap-3 p-5 bg-white/90 border border-[#dbe5f1] rounded-2xl">
              <div className="p-2.5 bg-[#eff4fa] border border-[#dbe5f1] rounded-xl">
                {stat.icon}
              </div>
              <p className="text-2xl md:text-3xl font-bold text-slate-800">{stat.value}</p>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Stats
