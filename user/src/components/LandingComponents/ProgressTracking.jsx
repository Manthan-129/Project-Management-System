import { Line } from 'rc-progress'
import { useMemo, useState } from 'react'

const progressByRange = {
  week: {
    activeTasks: 43,
    delivered: 12,
    members: [
      { name: 'Sarah Chen', role: 'Team Leader', done: 11, total: 12 },
      { name: 'Mike Johnson', role: 'Frontend Developer', done: 7, total: 9 },
      { name: 'Alex Kumar', role: 'Backend Developer', done: 9, total: 11 },
      { name: 'Emma Davis', role: 'Product Designer', done: 10, total: 10 },
    ],
  },
  month: {
    activeTasks: 128,
    delivered: 38,
    members: [
      { name: 'Sarah Chen', role: 'Team Leader', done: 34, total: 38 },
      { name: 'Mike Johnson', role: 'Frontend Developer', done: 27, total: 33 },
      { name: 'Alex Kumar', role: 'Backend Developer', done: 29, total: 35 },
      { name: 'Emma Davis', role: 'Product Designer', done: 32, total: 34 },
    ],
  },
}

const avatarColors = [
  'bg-[#e6effa] text-[#315e8d]',
  'bg-amber-100 text-amber-700',
  'bg-emerald-100 text-emerald-700',
  'bg-rose-100 text-rose-700',
]

const ProgressTracking = () => {
  const [range, setRange] = useState('week')
  const rangeData = progressByRange[range]

  const { teamDone, teamTotal, teamPct, summaryStats } = useMemo(() => {
    const done = rangeData.members.reduce((acc, member) => acc + member.done, 0)
    const total = rangeData.members.reduce((acc, member) => acc + member.total, 0)
    const pct = total ? Math.round((done / total) * 100) : 0

    return {
      teamDone: done,
      teamTotal: total,
      teamPct: pct,
      summaryStats: [
        { value: String(rangeData.activeTasks), label: 'Active Tasks' },
        { value: `${pct}%`, label: 'Team Completion' },
        { value: String(rangeData.delivered), label: range === 'week' ? 'Delivered This Sprint' : 'Delivered This Month' },
      ],
    }
  }, [range, rangeData])

  return (
    <section id="tracking" className="relative px-5 py-24 lg:px-12 overflow-hidden">
      <div className="absolute -top-24 -left-20 w-72 h-72 bg-blue-400/15 rounded-full blur-3xl -z-10"></div>
      <div className="absolute -bottom-24 -right-20 w-80 h-80 bg-teal-400/15 rounded-full blur-3xl -z-10"></div>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-start gap-12">

          <div className="w-full lg:w-2/5 space-y-8">
            <div className="space-y-3">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-[0.2em]">Progress Tracking</p>
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
                Delivery Visibility for
                <br />
                Every Contributor
              </h2>
              <p className="text-base text-slate-600 leading-relaxed">
                Turn standups into decisions. Identify bottlenecks earlier and keep sprint goals measurable.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {summaryStats.map((stat) => (
                <div key={stat.label} className="bg-white/85 border border-blue-100 rounded-2xl px-4 py-4 text-center backdrop-blur-sm">
                  <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">{stat.value}</p>
                  <p className="text-xs text-slate-600 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full lg:w-3/5 bg-white/90 border border-blue-100 rounded-2xl p-6 space-y-5 backdrop-blur-sm shadow-[0_20px_60px_-35px_rgba(18,33,58,0.45)]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">Team Progress</h3>
              <div className="flex gap-1.5" role="group" aria-label="Progress time range">
                <button
                  type="button"
                  onClick={() => setRange('week')}
                  aria-pressed={range === 'week'}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${range === 'week' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-slate-600 hover:bg-blue-100'}`}
                >
                  This Week
                </button>
                <button
                  type="button"
                  onClick={() => setRange('month')}
                  aria-pressed={range === 'month'}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${range === 'month' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-slate-600 hover:bg-blue-100'}`}
                >
                  This Month
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {rangeData.members.map((member, i) => {
                const pct = Math.round((member.done / member.total) * 100)
                return (
                  <div key={member.name} className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${avatarColors[i % avatarColors.length]}`}>
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{member.name}</p>
                          <p className="text-xs text-slate-500">{member.role}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-slate-800">{pct}%</p>
                        <p className="text-xs text-slate-500">{member.done}/{member.total} tasks</p>
                      </div>
                    </div>
                    <Line
                      strokeWidth={2}
                      percent={pct}
                      strokeColor="#1f8a6a"
                      trailColor="#dce6f2"
                      className="rounded-full"
                    />
                  </div>
                )
              })}

              <div className="space-y-2 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">Overall Team Progress</p>
                  <p className="text-sm font-bold text-blue-700">{teamPct}%</p>
                </div>
                <Line
                  strokeWidth={2}
                  percent={teamPct}
                  strokeColor="#315e8d"
                  trailColor="#dce6f2"
                  className="rounded-full"
                />
                <p className="text-xs text-slate-500">{teamDone} of {teamTotal} tasks completed</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ProgressTracking
