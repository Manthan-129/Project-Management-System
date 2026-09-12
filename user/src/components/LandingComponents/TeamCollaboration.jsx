import { Check, ClipboardList, Mail, UserPlus, Users } from 'lucide-react'
import { useContext } from 'react'
import { Link } from 'react-router-dom'
import { AppContext } from '../../context/AppContext.jsx'

const members = [
  { name: 'Sarah Chen', role: 'Team Leader', badge: 'Leader' },
  { name: 'Mike Johnson', role: 'Frontend Admin', badge: 'Admin' },
  { name: 'Alex Kumar', role: 'Backend Developer', badge: 'Member' },
  { name: 'Emma Davis', role: 'Product Designer', badge: 'Member' },
]

const assignments = [
  { task: 'Refine onboarding screens', assignee: 'Emma Davis', due: 'Jan 30', priority: 'high' },
  { task: 'Ship auth endpoints', assignee: 'Alex Kumar', due: 'Feb 1', priority: 'high' },
  { task: 'Harden component library', assignee: 'Mike Johnson', due: 'Feb 3', priority: 'med' },
  { task: 'Sprint retrospective notes', assignee: 'Sarah Chen', due: 'Feb 5', priority: 'low' },
]

const invites = [
  { name: 'Jordan Lee', role: 'DevOps Engineer', status: 'pending' },
  { name: 'Priya Nair', role: 'QA Engineer', status: 'accepted' },
]

const permissions = [
  {
    role: 'Leader',
    perms: [
      'Owns team scope and delivery decisions',
      'Can assign work across all roles',
      'Controls roster, permissions, and priorities',
    ],
  },
  {
    role: 'Admin',
    perms: [
      'Coordinates member tasks and timelines',
      'Cannot assign work to other admins',
      'Reviews progress and removes blockers',
    ],
  },
  {
    role: 'Member',
    perms: [
      'Updates own tasks and statuses',
      'Links PRs and delivery notes',
      'Shares implementation progress',
    ],
  },
]

const badgeColors = {
  Leader: 'bg-indigo-50 text-indigo-700 border border-indigo-200/70',
  Admin: 'bg-amber-50 text-amber-700 border border-amber-200/70',
  Member: 'bg-slate-100 text-slate-700 border border-slate-200/70',
}

const priorityColors = {
  high: 'bg-rose-50 text-rose-700 border border-rose-200/60',
  med: 'bg-amber-50 text-amber-700 border border-amber-200/60',
  low: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
}

const roleColors = {
  Leader: 'text-indigo-900 bg-indigo-50/60 border-indigo-200/70',
  Admin: 'text-amber-900 bg-amber-50/60 border-amber-200/70',
  Member: 'text-slate-800 bg-slate-50/70 border-slate-200/70',
}

const avatarColors = [
  'bg-indigo-100 text-indigo-700',
  'bg-amber-100 text-amber-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
]

const TeamCollaboration = () => {
  const { token } = useContext(AppContext)
  const inviteCtaPath = token ? '/dashboard/teams' : '/signup'

  return (
    <section id="collaboration" className="relative px-5 py-24 lg:px-12 overflow-hidden">
      <div className="absolute -top-24 -left-20 w-72 h-72 bg-indigo-400/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-violet-400/10 rounded-full blur-3xl -z-10"></div>
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="max-w-2xl space-y-3">
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-[0.2em]">Collaboration</p>
          <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            Structured Teamwork Without
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent"> Micromanagement</span>
          </h2>
          <p className="text-base text-slate-600 leading-relaxed">
            Create ownership clarity, delegate with confidence, and keep every contributor aligned on what matters now.
          </p>
          <p className="text-sm text-slate-500 leading-relaxed">
            Leadership model: Leaders define direction, admins coordinate execution, and members focus on delivery.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white/90 border border-slate-200/80 rounded-2xl p-5 space-y-4 backdrop-blur-sm shadow-[0_4px_20px_rgba(15,23,42,0.03)]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Users size={16} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 flex-1">Team Roster</h3>
              <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-2 py-0.5 rounded-full">
                {members.length} members
              </span>
            </div>

            <div className="space-y-2.5">
              {members.map((member, i) => (
                <div key={member.name} className="flex items-center gap-3 bg-slate-50/70 border border-slate-200/70 rounded-xl px-3 py-2.5 hover:border-indigo-200 transition-all">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${avatarColors[i % avatarColors.length]}`}>
                    {member.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{member.name}</p>
                    <p className="text-xs text-slate-500">{member.role}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${badgeColors[member.badge]}`}>
                    {member.badge}
                  </span>
                </div>
              ))}
            </div>

            <Link to={inviteCtaPath} className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200/70 rounded-xl transition-all no-underline">
              <UserPlus size={14} />
              {token ? 'Go to Teams' : 'Invite Teammate'}
            </Link>
          </div>

          <div className="bg-white/90 border border-slate-200/80 rounded-2xl p-5 space-y-4 backdrop-blur-sm shadow-[0_4px_20px_rgba(15,23,42,0.03)]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <ClipboardList size={16} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Task Assignments</h3>
            </div>

            <div className="space-y-2.5">
              {assignments.map((item) => (
                <div key={item.task} className="bg-slate-50/70 border border-slate-200/70 rounded-xl px-3 py-2.5 space-y-1.5 hover:border-emerald-200 transition-all">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-800 truncate flex-1">{item.task}</p>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md shrink-0 capitalize ${priorityColors[item.priority]}`}>{item.priority}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-indigo-600 font-medium">Assigned to {item.assignee}</p>
                    <p className="text-xs text-slate-400">{item.due}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/90 border border-slate-200/80 rounded-2xl p-5 space-y-5 backdrop-blur-sm shadow-[0_4px_20px_rgba(15,23,42,0.03)]">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
                  <Mail size={16} />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Invitations</h3>
              </div>

              <div className="space-y-2">
                {invites.map((invite, i) => (
                  <div key={invite.name} className="flex items-center gap-3 bg-slate-50/70 border border-slate-200/70 rounded-xl px-3 py-2.5 hover:border-sky-200 transition-all">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${avatarColors[(i + 2) % avatarColors.length]}`}>
                      {invite.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{invite.name}</p>
                      <p className="text-xs text-slate-500">{invite.role}</p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 capitalize ${invite.status === 'accepted' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-amber-50 text-amber-700 border border-amber-200/60'}`}>
                      {invite.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 border-t border-slate-100 pt-4">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Role Permissions</p>
              <div className="space-y-3">
                {permissions.map((roleGroup) => (
                  <div key={roleGroup.role} className={`border rounded-xl p-3 space-y-2 ${roleColors[roleGroup.role]}`}>
                    <p className="text-xs font-bold uppercase tracking-wide">{roleGroup.role}</p>
                    <div className="space-y-1">
                      {roleGroup.perms.map((permission) => (
                        <div key={permission} className="flex items-start gap-1.5">
                          <Check size={11} className="mt-0.5 shrink-0 opacity-80" />
                          <span className="text-xs opacity-90 leading-snug">{permission}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default TeamCollaboration
