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
  Leader: 'bg-[#e6effa] text-[#2e5a8a]',
  Admin: 'bg-amber-100 text-amber-700',
  Member: 'bg-slate-100 text-slate-600',
}

const priorityColors = {
  high: 'bg-rose-100 text-rose-700',
  med: 'bg-amber-100 text-amber-700',
  low: 'bg-emerald-100 text-emerald-700',
}

const roleColors = {
  Leader: 'text-[#2e5a8a] bg-[#f1f6fc] border-[#d9e6f4]',
  Admin: 'text-amber-700 bg-amber-50 border-amber-100',
  Member: 'text-slate-700 bg-slate-50 border-slate-200',
}

const avatarColors = [
  'bg-[#e6effa] text-[#315e8d]',
  'bg-amber-100 text-amber-700',
  'bg-emerald-100 text-emerald-700',
  'bg-rose-100 text-rose-700',
]

const TeamCollaboration = () => {
  const { token } = useContext(AppContext)
  const inviteCtaPath = token ? '/dashboard/teams' : '/signup'

  return (
    <section id="collaboration" className="px-5 py-24 lg:px-12">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="max-w-2xl space-y-3">
          <p className="text-xs font-semibold text-[#315e8d] uppercase tracking-[0.2em]">Collaboration</p>
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
            Structured Teamwork Without
            <span className="text-[#315e8d]"> Micromanagement</span>
          </h2>
          <p className="text-base text-slate-600 leading-relaxed">
            Create ownership clarity, delegate with confidence, and keep every contributor aligned on what matters now.
          </p>
          <p className="text-sm text-slate-500 leading-relaxed">
            Leadership model: Leaders define direction, admins coordinate execution, and members focus on delivery.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white/90 border border-[#dbe5f1] rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#e9f0f8] rounded-lg">
                <Users size={16} className="text-[#315e8d]" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800 flex-1">Team Roster</h3>
              <span className="text-xs font-medium text-slate-500 bg-[#edf3fa] px-2 py-0.5 rounded-full">
                {members.length} members
              </span>
            </div>

            <div className="space-y-2.5">
              {members.map((member, i) => (
                <div key={member.name} className="flex items-center gap-3 bg-[#f9fbfe] border border-slate-200 rounded-xl px-3 py-2.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${avatarColors[i % avatarColors.length]}`}>
                    {member.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{member.name}</p>
                    <p className="text-xs text-slate-500">{member.role}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${badgeColors[member.badge]}`}>
                    {member.badge}
                  </span>
                </div>
              ))}
            </div>

            <Link to={inviteCtaPath} className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-[#2e5a8a] bg-[#edf3fa] hover:bg-[#e3edf8] border border-[#dbe5f1] rounded-xl transition-colors no-underline">
              <UserPlus size={14} />
              {token ? 'Go to Teams' : 'Invite Teammate'}
            </Link>
          </div>

          <div className="bg-white/90 border border-[#dbe5f1] rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <ClipboardList size={16} className="text-emerald-600" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">Task Assignments</h3>
            </div>

            <div className="space-y-2.5">
              {assignments.map((item) => (
                <div key={item.task} className="bg-[#f9fbfe] border border-slate-200 rounded-xl px-3 py-2.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-slate-700 truncate flex-1">{item.task}</p>
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full shrink-0 capitalize ${priorityColors[item.priority]}`}>{item.priority}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[#315e8d] font-medium">Assigned to {item.assignee}</p>
                    <p className="text-xs text-slate-500">{item.due}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/90 border border-[#dbe5f1] rounded-2xl p-5 space-y-5">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-50 rounded-lg">
                  <Mail size={16} className="text-sky-600" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800">Invitations</h3>
              </div>

              <div className="space-y-2">
                {invites.map((invite, i) => (
                  <div key={invite.name} className="flex items-center gap-3 bg-[#f9fbfe] border border-slate-200 rounded-xl px-3 py-2.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${avatarColors[(i + 2) % avatarColors.length]}`}>
                      {invite.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{invite.name}</p>
                      <p className="text-xs text-slate-500">{invite.role}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 capitalize ${invite.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {invite.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 border-t border-slate-200 pt-4">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Role Permissions</p>
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
