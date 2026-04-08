import React from 'react'

const colColors = {
  'To-do': 'bg-slate-400',
  'In progress': 'bg-amber-400',
  'In review': 'bg-sky-500',
  'Completed': 'bg-emerald-500',
}

const priorityColors = {
  high: 'bg-rose-100 text-rose-700',
  med: 'bg-amber-100 text-amber-700',
  low: 'bg-emerald-100 text-emerald-700',
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
    <section className="px-5 py-24 lg:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-12">

          <div className="w-full lg:w-3/5 bg-white/95 border border-[#d8e3f0] rounded-2xl shadow-[0_20px_60px_-35px_rgba(18,33,58,0.45)] overflow-hidden">
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800">Sprint Board</h3>
                <span className="text-xs font-medium text-slate-500 bg-[#edf3fa] px-2.5 py-1 rounded-full">
                  14 Tasks
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {columns.map((col) => (
                  <div key={col.label} className="bg-[#f7f9fc] border border-slate-200 rounded-xl p-2.5 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${colColors[col.label]}`}></div>
                      <span className="text-xs font-semibold text-slate-600 flex-1 truncate">{col.label}</span>
                      <span className="text-xs font-medium text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded-full">{col.count}</span>
                    </div>

                    <div className="space-y-1.5">
                      {col.tasks.map((task) => (
                        <div key={task.title} className="bg-white border border-slate-200 rounded-lg p-2 space-y-1.5">
                          {task.done ? (
                            <p className="text-xs text-slate-400 line-through">{task.title}</p>
                          ) : (
                            <>
                              <p className="text-xs text-slate-700 font-medium leading-snug">{task.title}</p>
                              <div className="flex items-center justify-between gap-1">
                                <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full capitalize ${priorityColors[task.priority]}`}>{task.priority}</span>
                                <span className="text-xs text-slate-400">{task.date}</span>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="w-full lg:w-2/5 space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold text-[#315e8d] uppercase tracking-[0.2em]">Visual Workflow</p>
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
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
                  <div className="mt-1 w-2 h-2 rounded-full bg-[#315e8d] shrink-0"></div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">{item.title}</h4>
                    <p className="text-sm text-slate-600 mt-0.5">{item.desc}</p>
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
