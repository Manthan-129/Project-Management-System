import React from 'react'
import {
  Bell,
  ChartColumnIncreasing,
  GitPullRequest,
  Globe,
  LayoutDashboard,
  Users,
} from 'lucide-react'

const iconColors = [
  'text-[#315e8d] bg-[#e9f0f8]',
  'text-emerald-700 bg-emerald-50',
  'text-sky-700 bg-sky-50',
  'text-slate-700 bg-slate-100',
  'text-cyan-700 bg-cyan-50',
  'text-rose-700 bg-rose-50',
]

const features = [
  {
    icon: <LayoutDashboard size={20} />,
    title: 'Kanban Workspace',
    desc: 'Plan and execute work with drag-and-drop boards that keep priorities visible for everyone.',
  },
  {
    icon: <Users size={20} />,
    title: 'Team Alignment',
    desc: 'Assign owners, define responsibilities, and keep every contributor synced in real time.',
  },
  {
    icon: <GitPullRequest size={20} />,
    title: 'PR Visibility',
    desc: 'Link pull requests to tasks and track review status without leaving your delivery flow.',
  },
  {
    icon: <ChartColumnIncreasing size={20} />,
    title: 'Progress Analytics',
    desc: 'Use live completion insights to spot blockers early and protect sprint commitments.',
  },
  {
    icon: <Bell size={20} />,
    title: 'Smart Alerts',
    desc: 'Receive focused updates for changes that matter, not noisy notifications all day.',
  },
  {
    icon: <Globe size={20} />,
    title: 'Developer Network',
    desc: 'Discover collaborators, grow your internal network, and build faster as a connected team.',
  },
]

const Feature = () => {
  return (
    <section id="features" className="px-5 py-24 lg:px-12">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="max-w-2xl mx-auto text-center space-y-3">
          <p className="text-xs font-semibold text-[#315e8d] uppercase tracking-[0.2em]">Platform Features</p>
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">Tools Your Team Will Actually Use</h2>
          <p className="text-base text-slate-600 leading-relaxed">
            DevDash combines planning, collaboration, and delivery tracking into one focused workspace built for engineering teams.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <article key={feature.title} className="bg-white/90 border border-[#dbe5f1] rounded-2xl p-6 space-y-4 transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
              <div className={`w-10 h-10 flex items-center justify-center rounded-xl ${iconColors[i]}`}>
                {feature.icon}
              </div>
              <h3 className="text-base font-semibold text-slate-800">{feature.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{feature.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Feature
