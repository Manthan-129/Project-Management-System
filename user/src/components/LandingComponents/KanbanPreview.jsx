
const colStyles = {
  'To-do': { dot: 'bg-sky-500', badge: 'bg-sky-100 text-sky-700', bg: 'border-sky-200/70 bg-sky-50/40' },
  'In progress': { dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700', bg: 'border-amber-200/70 bg-amber-50/40' },
  'In review': { dot: 'bg-purple-500', badge: 'bg-purple-100 text-purple-700', bg: 'border-purple-200/70 bg-purple-50/40' },
  'Completed': { dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700', bg: 'border-emerald-200/70 bg-emerald-50/40' },
}

const priorityColors = {
  high: 'bg-rose-50 text-rose-700 border border-rose-200/60',
  med: 'bg-amber-50 text-amber-700 border border-amber-200/60',
  low: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
}

const columns = [
  {
    label: 'To-do',
    count: 4,
    tasks: [
      { title: 'Design landing page', priority: 'high', date: 'Jan 25' },
      { title: 'Setup database', priority: 'med', date: 'Jan 28' },
      { title: 'Write unit tests', priority: 'low', date: 'Feb 2' },
    ],
  },
  {
    label: 'In progress',
    count: 3,
    tasks: [
      { title: 'Build auth system', priority: 'high', date: 'Jan 30' },
      { title: 'API integration', priority: 'low', date: 'Feb 1' },
      { title: 'Dashboard layout', priority: 'med', date: 'Feb 3' },
    ],
  },
  {
    label: 'In review',
    count: 2,
    tasks: [
      { title: 'User profile page', priority: 'med', date: 'Jan 27' },
      { title: 'Notification bar', priority: 'high', date: 'Jan 29' },
    ],
  },
  {
    label: 'Completed',
    count: 5,
    tasks: [
      { title: 'Project setup', done: true },
      { title: 'Wireframes', done: true },
      { title: 'Tech stack', done: true },
    ],
  },
]

const highlights = [
  {
    title: 'Clear Workflow States',
    desc: 'Track every task from backlog to done without hidden handoffs.',
  },
  {
    title: 'Priority First',
    desc: 'Surface urgent work instantly with lightweight visual signals.',
  },
  {
    title: 'Deadline Awareness',
    desc: 'Keep delivery dates visible so planning decisions stay realistic.',
  },
]

const KanbanPreview = () => {
  return (
    <section id="kanban-preview" className="relative px-5 py-24 lg:px-12 overflow-hidden">
      <div className="absolute -top-24 -right-20 w-72 h-72 bg-indigo-400/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute -bottom-24 -left-20 w-80 h-80 bg-violet-400/10 rounded-full blur-3xl -z-10"></div>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-12">

          <div className="w-full lg:w-3/5 bg-white/95 border border-slate-200/80 rounded-2xl backdrop-blur-md shadow-[0_20px_50px_-25px_rgba(15,23,42,0.1)] overflow-hidden">
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Sprint Board</h3>
                <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-2.5 py-0.5 rounded-full">
                  14 Tasks
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {columns.map((col) => {
                  const theme = colStyles[col.label] || { dot: 'bg-slate-400', badge: 'bg-slate-100 text-slate-700', bg: 'border-slate-200 bg-slate-50' };

                  return (
                    <div key={col.label} className={`border rounded-xl p-2.5 space-y-2 ${theme.bg}`}>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${theme.dot}`}></div>
                        <span className="text-xs font-bold text-slate-700 flex-1 truncate">{col.label}</span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${theme.badge}`}>{col.count}</span>
                      </div>

                      <div className="space-y-1.5">
                        {col.tasks.map((task) => (
                          <div key={task.title} className="bg-white border border-slate-200/80 rounded-lg p-2.5 space-y-1.5 shadow-sm hover:shadow-md transition-shadow">
                            {task.done ? (
                              <p className="text-xs text-slate-400 line-through">{task.title}</p>
                            ) : (
                              <>
                                <p className="text-xs text-slate-800 font-medium leading-snug">{task.title}</p>
                                <div className="flex items-center justify-between gap-1">
                                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md capitalize ${priorityColors[task.priority]}`}>{task.priority}</span>
                                  <span className="text-[11px] text-slate-400">{task.date}</span>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="w-full lg:w-2/5 space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-[0.2em]">Visual Workflow</p>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
                Boards That Help Teams
                <br />
                Make Better Decisions
              </h2>
              <p className="text-base text-slate-600 leading-relaxed">
                Give every stakeholder a shared view of progress, ownership, and deadlines across the sprint.
              </p>
            </div>

            <div className="space-y-4">
              {highlights.map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <div className="mt-1.5 w-2 h-2 rounded-full bg-indigo-600 shrink-0"></div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                    <p className="text-sm text-slate-600 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

export default KanbanPreview
