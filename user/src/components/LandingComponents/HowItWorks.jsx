import React, { useContext } from 'react'
import { LayoutDashboard, TrendingUp, UserPlus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppContext } from '../../context/AppContext.jsx'

const iconColors = [
  'text-[#315e8d] bg-[#e9f0f8]',
  'text-emerald-700 bg-emerald-50',
  'text-sky-700 bg-sky-50',
]

const steps = [
  {
    step: '01',
    icon: UserPlus,
    title: 'Set Up Your Workspace',
    desc: 'Create your account, define your team, and launch your first project in minutes.',
  },
  {
    step: '02',
    icon: LayoutDashboard,
    title: 'Plan and Assign Work',
    desc: 'Break goals into clear tasks, assign owners, and keep scope under control from day one.',
  },
  {
    step: '03',
    icon: TrendingUp,
    title: 'Track Delivery Daily',
    desc: 'Monitor progress with real-time updates and move releases forward with confidence.',
  },
]

const HowItWorks = () => {
  const { token } = useContext(AppContext)
  const primaryCtaPath = token ? '/dashboard' : '/signup'

  return (
    <section id="how-it-works" className="px-5 py-24 lg:px-12">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="max-w-2xl mx-auto text-center space-y-3">
          <p className="text-xs font-semibold text-[#315e8d] uppercase tracking-[0.2em]">Simple Flow</p>
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">From Kickoff to Release in 3 Steps</h2>
          <p className="text-base text-slate-600 leading-relaxed">
            No complex onboarding. Your team gets structure quickly, without slowing down development.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <article key={step.step} className="relative flex flex-col items-center text-center gap-4 p-8 bg-white/90 border border-[#dbe5f1] rounded-2xl">
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-[2px] bg-[#dbe5f1]" aria-hidden="true"></div>
              )}
              <div className="absolute -top-3.5 left-6 text-xs font-bold text-slate-600 bg-[#edf3fa] border border-[#dbe5f1] px-2.5 py-1 rounded-full">
                {step.step}
              </div>

              <div className={`w-12 h-12 flex items-center justify-center rounded-2xl ${iconColors[i]}`}>
                <step.icon size={22} />
              </div>

              <h3 className="text-base font-semibold text-slate-800">{step.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{step.desc}</p>
            </article>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link to={primaryCtaPath} className="px-5 py-2.5 text-sm font-semibold text-white bg-[#315e8d] hover:bg-[#26486d] rounded-xl transition-colors no-underline">
            {token ? 'Open Workspace' : 'Start in Minutes'}
          </Link>
          <a href="#collaboration" className="px-5 py-2.5 text-sm font-semibold text-slate-700 border border-slate-300 bg-white hover:bg-slate-50 rounded-xl transition-colors no-underline">
            View Collaboration Tools
          </a>
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
