import { Star } from 'lucide-react'

const avatarColors = [
  'bg-indigo-50 text-indigo-700',
  'bg-emerald-50 text-emerald-700',
  'bg-amber-50 text-amber-700',
]

const testimonials = [
  {
    name: 'James Park',
    role: 'Engineering Manager',
    company: 'TechFlow Inc.',
    avatar: 'JP',
    stars: 5,
    quote: 'DevDash gave our engineering team a shared source of truth. Planning became clearer, and our review cycle dropped by almost 40% in one month.',
  },
  {
    name: 'Anika Sharma',
    role: 'Lead Developer',
    company: 'CloudBuild Co.',
    avatar: 'AS',
    stars: 5,
    quote: 'Connecting task boards and pull requests removed so much context switching. Our daily check-ins are now focused and much shorter.',
  },
  {
    name: 'Marcus Chen',
    role: 'Founder',
    company: 'Launchpad Labs',
    avatar: 'MC',
    stars: 5,
    quote: 'For a small team, DevDash provides just enough structure without heavy process. We move faster while staying organized.',
  },
]

const Testimonials = () => {
  return (
    <section id="testimonials" className="relative px-5 py-24 lg:px-12 overflow-hidden">
      <div className="absolute -top-20 left-1/4 h-64 w-64 rounded-full bg-indigo-400/12 blur-3xl -z-10" />
      <div className="absolute -bottom-24 right-1/4 h-72 w-72 rounded-full bg-violet-400/12 blur-3xl -z-10" />
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="max-w-2xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200/80 rounded-full text-xs font-semibold text-amber-700 shadow-xs">
            <Star size={13} className="fill-amber-400 text-amber-400" />
            Trusted by product teams
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
            Teams Ship Better With <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">DevDash</span>
          </h2>
          <p className="text-base text-slate-600 leading-relaxed">
            Real feedback from teams that improved planning clarity and delivery speed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, i) => (
            <article key={testimonial.name} className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white/80 p-6 space-y-5 shadow-xs backdrop-blur-sm transition-all duration-200 hover:border-indigo-200 hover:shadow-md">
              <div className="flex gap-0.5">
                {Array.from({ length: testimonial.stars }).map((_, index) => (
                  <Star key={index} size={14} className="fill-amber-400 text-amber-400" />
                ))}
              </div>

              <p className="text-sm text-slate-600 leading-relaxed flex-1">"{testimonial.quote}"</p>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${avatarColors[i % avatarColors.length]}`}>
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{testimonial.name}</p>
                  <p className="text-xs text-slate-500">{testimonial.role} - {testimonial.company}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="flex justify-center">
          <div className="inline-flex flex-col items-center gap-1.5 px-6 py-4 rounded-2xl border border-slate-200/80 bg-white/85 shadow-xs backdrop-blur-sm">
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} size={16} className="fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-base font-bold text-slate-800">4.9 out of 5</span>
            <span className="text-xs text-slate-600">based on 1,200+ product and engineering reviews</span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Testimonials
